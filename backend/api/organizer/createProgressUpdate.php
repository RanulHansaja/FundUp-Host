<?php
include_once __DIR__ . "/../../config/cors.php";
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(0);

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];



// Simple file move helper
function sanitizeFileName($name) {
    $name = basename($name);
    $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
    return time() . "_" . $name;
}

function ensureProgressPercentColumn($conn) {
    $columnCheck = $conn->query("SHOW COLUMNS FROM Projects LIKE 'progressPercent'");
    if ($columnCheck && $columnCheck->num_rows === 0) {
        return $conn->query("ALTER TABLE Projects ADD COLUMN progressPercent INT DEFAULT 0 AFTER collectedAmount");
    }
    return true;
}

function outputJson($payload, int $status = 200) {
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit();
}

$projectID = intval($_POST['projectID'] ?? 0);
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$progressPercent = intval($_POST['progressPercent'] ?? 0);
$milestone = trim($_POST['milestone'] ?? '');

if ($projectID <= 0 || !$title || !$description) {
    outputJson(['success' => false, 'message' => 'Missing required fields.'], 400);
}

// verify project ownership
$stmt = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmt->bind_param('i', $userID);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    outputJson(['success' => false, 'message' => 'Organizer profile not found.'], 403);
}
$organizer = $result->fetch_assoc();
$organizerID = (int)$organizer['organizerID'];
$stmt->close();

// check project and current progress
$stmt = $conn->prepare("SELECT organizerID, progressPercent, status FROM Projects WHERE projectID = ? LIMIT 1");
$stmt->bind_param('i', $projectID);
$stmt->execute();
$projRes = $stmt->get_result();
if ($projRes->num_rows === 0) {
    outputJson(['success' => false, 'message' => 'Project not found.'], 404);
}
$row = $projRes->fetch_assoc();
if ((int)$row['organizerID'] !== $organizerID) {
    outputJson(['success' => false, 'message' => 'Unauthorized.'], 403);
}
if ($row['status'] === 'SUSPENDED') {
    outputJson(['success' => false, 'message' => 'Progress updates are unavailable while this project is suspended.'], 400);
}
if ($row['status'] === 'REJECTED') {
    outputJson(['success' => false, 'message' => 'Progress updates are unavailable because this project has been rejected.'], 400);
}
$currentProgress = intval($row['progressPercent'] ?? 0);
if ($progressPercent <= $currentProgress) {
    outputJson(['success' => false, 'message' => "Progress percentage must be greater than the current project progress ({$currentProgress}%)."], 400);
}
if ($progressPercent > 100) {
    outputJson(['success' => false, 'message' => 'Progress percentage cannot exceed 100%.'], 400);
}
if ($currentProgress >= 100) {
    outputJson(['success' => false, 'message' => 'This project has already reached 100% progress.'], 400);
}
$stmt->close();

$uploadedPhotos = [];
if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
    foreach ($_FILES['photos']['name'] as $index => $name) {
        if ($_FILES['photos']['error'][$index] !== UPLOAD_ERR_OK) {
            continue;
        }
        $tmpName = $_FILES['photos']['tmp_name'][$index];
        if ($tmpName && $name) {
            $safeName = sanitizeFileName($name);
            $targetDir = __DIR__ . "/../../uploads/project_gallery/images/";
            if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
            $dest = $targetDir . $safeName;
            if (move_uploaded_file($tmpName, $dest)) {
                $uploadedPhotos[] = 'uploads/project_gallery/images/' . $safeName;
            }
        }
    }
}

$uploadedVideos = [];
if (!empty($_FILES['videos']) && is_array($_FILES['videos']['name'])) {
    foreach ($_FILES['videos']['name'] as $index => $name) {
        if ($_FILES['videos']['error'][$index] !== UPLOAD_ERR_OK) {
            continue;
        }
        $tmpName = $_FILES['videos']['tmp_name'][$index];
        if ($tmpName && $name) {
            $safeName = sanitizeFileName($name);
            $targetDir = __DIR__ . "/../../uploads/project_gallery/videos/";
            if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
            $dest = $targetDir . $safeName;
            if (move_uploaded_file($tmpName, $dest)) {
                $uploadedVideos[] = 'uploads/project_gallery/videos/' . $safeName;
            }
        }
    }
}

$imagePathsJson = !empty($uploadedPhotos) ? json_encode($uploadedPhotos, JSON_UNESCAPED_SLASHES) : null;
$videoPathsJson = !empty($uploadedVideos) ? json_encode($uploadedVideos, JSON_UNESCAPED_SLASHES) : null;

try {
    $stmt = $conn->prepare("INSERT INTO ProgressUpdates (projectID, title, description, imagePaths, videoPaths, progressPercent, milestone, updateDate) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param('issssis', $projectID, $title, $description, $imagePathsJson, $videoPathsJson, $progressPercent, $milestone);

    if ($stmt->execute()) {
        $progressUpdateId = $conn->insert_id;
        $stmt->close();

        if (!ensureProgressPercentColumn($conn)) {
            outputJson([
                'success' => true,
                'message' => 'Progress update published successfully.',
                'data' => ['progressUpdateId' => $progressUpdateId]
            ]);
        }

        $updateStmt = $conn->prepare("UPDATE Projects SET progressPercent = ? WHERE projectID = ?");
        if ($updateStmt) {
            $updateStmt->bind_param('ii', $progressPercent, $projectID);
            $updateStmt->execute();
            $updateStmt->close();
        }

        outputJson([
            'success' => true,
            'message' => 'Progress update published successfully.',
            'data' => ['progressUpdateId' => $progressUpdateId]
        ]);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }
} catch (Exception $e) {
    outputJson(['success' => false, 'message' => 'Failed to save update: ' . $e->getMessage()], 500);
}
$conn->close();
