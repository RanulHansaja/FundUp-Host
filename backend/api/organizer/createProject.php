<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";
include_once __DIR__ . "/../../helpers/uploadHelper.php";

// Authorize strictly for logged-in Organizers
$sessionUser = requireAuth(['ORGANIZER']);

$requiredFields = [
    'userID',
    'title',
    'category',
    'shortSummary',
    'description',
    'targetAmount',
    'startDate',
    'endDate',

];

foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
        echo json_encode([
            'success' => false,
            'message' => "Missing required field: {$field}"
        ]);
        exit();
    }
}

$userID = $sessionUser['userID'];
$title = trim($_POST['title']);
$category = trim($_POST['category']);
$shortSummary = trim($_POST['shortSummary'] ?? '');
$description = trim($_POST['description']);
$targetAmount = (float) $_POST['targetAmount'];
$startDate = trim($_POST['startDate']);
$endDate = trim($_POST['endDate']);
$socialMediaLink = trim($_POST['socialMediaLink'] ?? '');

if (mb_strlen($title) > 150) {
    echo json_encode([
        'success' => false,
        'message' => 'Project title must be 150 characters or fewer.'
    ]);
    exit();
}
 $allowedCategories = [
  'Education',
  'Sports',
  'Charity',
  'Health & Medical',
  'Environment',
  'Other'
];
if (!in_array($category, $allowedCategories, true)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please select a valid project category.'
    ]);
    exit();
}

if ($shortSummary === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Short summary is required.'
    ]);
    exit();
}

if (mb_strlen($shortSummary) > 500) {
    echo json_encode([
        'success' => false,
        'message' => 'Short summary must be 500 characters or fewer.'
    ]);
    exit();
}

function isValidProjectDate($date) {
    $parsedDate = DateTime::createFromFormat('!Y-m-d', $date);
    $errors = DateTime::getLastErrors();
    return $parsedDate !== false
        && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))
        && $parsedDate->format('Y-m-d') === $date;
}

if (!isValidProjectDate($startDate) || !isValidProjectDate($endDate)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter valid start and end dates.'
    ]);
    exit();
}

$today = (new DateTime('today'))->format('Y-m-d');
if ($startDate < $today) {
    echo json_encode([
        'success' => false,
        'message' => 'Start date cannot be in the past.'
    ]);
    exit();
}

if ($endDate <= $startDate) {
    echo json_encode([
        'success' => false,
        'message' => 'End date must be after the start date.'
    ]);
    exit();
}

if ($targetAmount < 10000) {
    echo json_encode([
        'success' => false,
        'message' => 'Target amount must be at least 10,000.'
    ]);
    exit();
}

if ($socialMediaLink !== '' && (!filter_var($socialMediaLink, FILTER_VALIDATE_URL) || !in_array(parse_url($socialMediaLink, PHP_URL_SCHEME), ['http', 'https'], true))) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid social media URL.'
    ]);
    exit();
}

if (empty($_FILES['coverImage']) || $_FILES['coverImage']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'Project cover image is required.'
    ]);
    exit();
}

$stmt = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmt->bind_param('i', $userID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Organizer profile not found.'
    ]);
    exit();
}

$organizer = $result->fetch_assoc();
$stmt->close();
$organizerID = (int) $organizer['organizerID'];

$bannerImagePath = '';
$proposalPdfPath = '';
$mediaPaths = [];

$baseUploadDir = __DIR__ . '/../../uploads';
$bannerDir = $baseUploadDir . '/project_banners';
$proposalDir = $baseUploadDir . '/project_proposals';
$galleryImageDir = $baseUploadDir . '/project_gallery/images';
$galleryVideoDir = $baseUploadDir . '/project_gallery/videos';

if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);
if (!is_dir($proposalDir)) mkdir($proposalDir, 0777, true);
if (!is_dir($galleryImageDir)) mkdir($galleryImageDir, 0777, true);
if (!is_dir($galleryVideoDir)) mkdir($galleryVideoDir, 0777, true);

$conn->begin_transaction();

try {
    // Validate Cover Image
    $coverExt = validateUploadedFile($_FILES['coverImage'], ['jpg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp']);
    if ($coverExt === false) {
        throw new Exception('Cover image must be a valid JPG, PNG, or WEBP file (max 10MB).');
    }
    $bannerFileName = generateSafeFileName($_FILES['coverImage']['name'], $coverExt);
    $bannerDestination = $bannerDir . '/' . $bannerFileName;
    if (!move_uploaded_file($_FILES['coverImage']['tmp_name'], $bannerDestination)) {
        throw new Exception('Failed to save cover image.');
    }
    $bannerImagePath = 'uploads/project_banners/' . $bannerFileName;

    // Validate Proposal PDF

if (empty($_FILES['proposalPdf']) || $_FILES['proposalPdf']['error'] !== UPLOAD_ERR_OK) {
    throw new Exception('Proposal document is required.');
}

$proposalExt = validateUploadedFile(
    $_FILES['proposalPdf'],
    ['pdf'],
    ['application/pdf']
);

if ($proposalExt === false) {
    throw new Exception('Proposal document must be a valid PDF (max 10MB).');
}

$proposalFileName = generateSafeFileName(
    $_FILES['proposalPdf']['name'],
    $proposalExt
);

$proposalDestination = $proposalDir . '/' . $proposalFileName;

if (!move_uploaded_file(
    $_FILES['proposalPdf']['tmp_name'],
    $proposalDestination
)) {
    throw new Exception('Failed to save proposal PDF.');
}

$proposalPdfPath = 'uploads/project_proposals/' . $proposalFileName;
    

    $stmt = $conn->prepare(
        "INSERT INTO Projects (
            organizerID,
            title,
            shortSummary,
            description,
            category,
            targetAmount,
            collectedAmount,
            progressPercent,
            bannerImage,
            startDate,
            endDate,
            socialMediaLink,
            proposalPdfPath,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, 0.00, 0, ?, ?, ?, ?, ?, 'ACTIVE')"
    );
    $stmt->bind_param(
        'issssdsssss',
        $organizerID,
        $title,
        $shortSummary,
        $description,
        $category,
        $targetAmount,
        $bannerImagePath,
        $startDate,
        $endDate,
        $socialMediaLink,
        $proposalPdfPath
    );
    $stmt->execute();
    $projectID = $stmt->insert_id;
    $stmt->close();

    $uploadedPhotos = [];
    if (isset($_FILES['galleryImages']) && is_array($_FILES['galleryImages']['name'])) {
        foreach ($_FILES['galleryImages']['name'] as $index => $name) {
            if ($_FILES['galleryImages']['error'][$index] !== UPLOAD_ERR_OK) {
                continue;
            }
            $tempFile = [
                'name' => $_FILES['galleryImages']['name'][$index],
                'type' => $_FILES['galleryImages']['type'][$index],
                'tmp_name' => $_FILES['galleryImages']['tmp_name'][$index],
                'error' => $_FILES['galleryImages']['error'][$index],
                'size' => $_FILES['galleryImages']['size'][$index]
            ];
            $imgExt = validateUploadedFile($tempFile, ['jpg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp']);
            if ($imgExt === false) {
                throw new Exception('One or more gallery images are invalid. Only JPG, PNG, and WEBP allowed.');
            }
            $mediaFileName = generateSafeFileName($tempFile['name'], $imgExt);
            $mediaDestination = $galleryImageDir . '/' . $mediaFileName;
            if (!move_uploaded_file($tempFile['tmp_name'], $mediaDestination)) {
                throw new Exception('Failed to save one or more gallery images.');
            }
            $mediaPath = 'uploads/project_gallery/images/' . $mediaFileName;
            $uploadedPhotos[] = $mediaPath;
        }
    }

    if (!empty($uploadedPhotos)) {
        $mediaPathsJson = json_encode($uploadedPhotos, JSON_UNESCAPED_SLASHES);
        $stmt = $conn->prepare("INSERT INTO ProjectMedia (projectID, mediaType, mediaPaths) VALUES (?, 'IMAGE', ?)");
        $stmt->bind_param('is', $projectID, $mediaPathsJson);
        $stmt->execute();
        $stmt->close();
    }

    $uploadedVideos = [];
    if (isset($_FILES['galleryVideos']) && is_array($_FILES['galleryVideos']['name'])) {
        foreach ($_FILES['galleryVideos']['name'] as $index => $name) {
            if ($_FILES['galleryVideos']['error'][$index] !== UPLOAD_ERR_OK) {
                continue;
            }
            $tempFile = [
                'name' => $_FILES['galleryVideos']['name'][$index],
                'type' => $_FILES['galleryVideos']['type'][$index],
                'tmp_name' => $_FILES['galleryVideos']['tmp_name'][$index],
                'error' => $_FILES['galleryVideos']['error'][$index],
                'size' => $_FILES['galleryVideos']['size'][$index]
            ];
            $vidExt = validateUploadedFile($tempFile, ['mp4'], ['video/mp4']);
            if ($vidExt === false) {
                throw new Exception('One or more gallery videos are invalid. Only MP4 allowed.');
            }
            $mediaFileName = generateSafeFileName($tempFile['name'], $vidExt);
            $mediaDestination = $galleryVideoDir . '/' . $mediaFileName;
            if (!move_uploaded_file($tempFile['tmp_name'], $mediaDestination)) {
                throw new Exception('Failed to save one or more gallery videos.');
            }
            $mediaPath = 'uploads/project_gallery/videos/' . $mediaFileName;
            $uploadedVideos[] = $mediaPath;
        }
    }

    if (!empty($uploadedVideos)) {
        $mediaPathsJson = json_encode($uploadedVideos, JSON_UNESCAPED_SLASHES);
        $stmt = $conn->prepare("INSERT INTO ProjectMedia (projectID, mediaType, mediaPaths) VALUES (?, 'VIDEO', ?)");
        $stmt->bind_param('is', $projectID, $mediaPathsJson);
        $stmt->execute();
        $stmt->close();
    }

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Project created successfully.',
        'projectID' => $projectID
    ]);
} catch (Exception $e) {
    $conn->rollback();
if (!empty($bannerFileName)) {
    $file = $bannerDir . '/' . $bannerFileName;
    if (file_exists($file)) {
        unlink($file);
    }
}

if (!empty($proposalFileName)) {
    $file = $proposalDir . '/' . $proposalFileName;
    if (file_exists($file)) {
        unlink($file);
    }
}
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>