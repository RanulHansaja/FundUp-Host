<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

$response = [
    "success" => false,
    "message" => "",
    "data" => null
];

try {
    $stmt = $conn->prepare("UPDATE Notifications SET isRead = TRUE WHERE userID = ? AND isRead = FALSE");
    $stmt->bind_param("i", $userID);
    $stmt->execute();
    $stmt->close();

    $response["success"] = true;
    $response["message"] = "Notifications marked as read.";
} catch (Exception $e) {
    $response["message"] = "Failed to update notification status: " . $e->getMessage();
}

$conn->close();
echo json_encode($response);
