<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth();
$userID = $sessionUser['userID'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$stmt = $conn->prepare("SELECT profilePhoto FROM Users WHERE userID = ?");
$stmt->bind_param("i", $userID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "User not found."]);
    $stmt->close();
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

if ($user['profilePhoto']) {
    $filePath = __DIR__ . "/../../" . $user['profilePhoto'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
}

$updateStmt = $conn->prepare("UPDATE Users SET profilePhoto = NULL WHERE userID = ?");
$updateStmt->bind_param("i", $userID);

if ($updateStmt->execute()) {
    echo json_encode(["success" => true, "message" => "Profile photo removed successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to remove profile photo from database."]);
}

$updateStmt->close();

?>
