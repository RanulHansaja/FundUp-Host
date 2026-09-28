<?php
include_once "../../config/cors.php";
header("Content-Type: application/json");

include_once "../../config/db.php";
include_once "../../helpers/authMiddleware.php";
include_once "../../helpers/uploadHelper.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

// Check Content-Type to support both JSON and Form-Data (for file upload)
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $data = json_decode(file_get_contents("php://input"), true);
} else {
    $data = $_POST;
}

if (!isset($data['projectID'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing projectID.'
    ]);
    exit();
}

$projectID = (int)$data['projectID'];

$title = trim($data['title'] ?? '');
$category = trim($data['category'] ?? '');
$shortSummary = trim($data['shortSummary'] ?? '');
$description = trim($data['description'] ?? '');
$targetAmount = (float)($data['targetAmount'] ?? 0);
$startDate = trim($data['startDate'] ?? '');
$endDate = trim($data['endDate'] ?? '');
$socialMediaLink = trim($data['socialMediaLink'] ?? '');

if (empty($title) || empty($category) || empty($description) || $targetAmount <= 0 || empty($startDate) || empty($endDate)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing or invalid fields. Title, Category, Description, Target Amount, Start Date, and End Date are required.'
    ]);
    exit();
}

// 1. Resolve organizerID from userID
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
$organizerID = (int)$organizer['organizerID'];
$stmt->close();

// 2. Verify project ownership
$stmt = $conn->prepare("SELECT organizerID, status FROM Projects WHERE projectID = ? LIMIT 1");
$stmt->bind_param('i', $projectID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Project not found.'
    ]);
    exit();
}

$project = $result->fetch_assoc();
$stmt->close();

if ((int)$project['organizerID'] !== $organizerID) {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized: This project does not belong to your organization.'
    ]);
    exit();
}

if ($project['status'] === 'REJECTED') {
    echo json_encode([
        'success' => false,
        'message' => 'Cannot update project: This project has been rejected.'
    ]);
    exit();
}

// Process Proposal PDF upload if provided
$proposalPdfPath = null;
if (isset($_FILES['proposalPdf']) && $_FILES['proposalPdf']['error'] === UPLOAD_ERR_OK) {
    $proposalDir = __DIR__ . '/../../uploads/project_proposals';
    if (!is_dir($proposalDir)) {
        mkdir($proposalDir, 0777, true);
    }
    $proposalExt = validateUploadedFile($_FILES['proposalPdf'], ['pdf'], ['application/pdf']);
    if ($proposalExt === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Proposal document must be a PDF file.'
        ]);
        exit();
    }
    
    // Check size limit: max 10MB (10 * 1024 * 1024)
    if ($_FILES['proposalPdf']['size'] > 10 * 1024 * 1024) {
        echo json_encode([
            'success' => false,
            'message' => 'Proposal document must be 10MB or smaller.'
        ]);
        exit();
    }
    
    $proposalFileName = generateSafeFileName($_FILES['proposalPdf']['name'], $proposalExt);
    $proposalDestination = $proposalDir . '/' . $proposalFileName;
    if (!move_uploaded_file($_FILES['proposalPdf']['tmp_name'], $proposalDestination)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save proposal PDF.'
        ]);
        exit();
    }
    $proposalPdfPath = 'uploads/project_proposals/' . $proposalFileName;
}

// 3. Update the Projects table
if ($proposalPdfPath !== null) {
    $sql = "
        UPDATE Projects 
        SET title = ?, category = ?, shortSummary = ?, description = ?, targetAmount = ?, startDate = ?, endDate = ?, socialMediaLink = ?, proposalPdfPath = ?
        WHERE projectID = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssdssssi', $title, $category, $shortSummary, $description, $targetAmount, $startDate, $endDate, $socialMediaLink, $proposalPdfPath, $projectID);
} else {
    $sql = "
        UPDATE Projects 
        SET title = ?, category = ?, shortSummary = ?, description = ?, targetAmount = ?, startDate = ?, endDate = ?, socialMediaLink = ?
        WHERE projectID = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssdsssi', $title, $category, $shortSummary, $description, $targetAmount, $startDate, $endDate, $socialMediaLink, $projectID);
}

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Project updated successfully.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update project: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
