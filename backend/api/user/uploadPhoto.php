<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";
include_once __DIR__ . "/../../helpers/uploadHelper.php";

$sessionUser = requireAuth();
$userID = $sessionUser['userID'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

if (!isset($_FILES['profilePhoto']) || $_FILES['profilePhoto']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error."]);
    exit();
}

$file = $_FILES['profilePhoto'];
$maxSize = 5 * 1024 * 1024; // 5MB

if ($file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File size exceeds the maximum limit of 5MB."]);
    exit();
}

$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
if (!in_array($file['type'], $allowedMimeTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file format. Only JPG, PNG, and GIF are allowed."]);
    exit();
}

$fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = "user_" . $userID . "_" . time() . "." . $fileExt;

$dbFilePath = saveFileToStorage($file['tmp_name'], $fileName, 'profiles');

if ($dbFilePath) {
    $stmt = $conn->prepare("UPDATE Users SET profilePhoto = ? WHERE userID = ?");
    $stmt->bind_param("si", $dbFilePath, $userID);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Profile photo updated successfully.",
            "profilePhoto" => $dbFilePath
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update database."]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
}

?>
