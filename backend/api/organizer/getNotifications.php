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
    $notifications = [];
    $stmt = $conn->prepare("SELECT notificationID, title, message, createdAt, isRead FROM Notifications WHERE userID = ? ORDER BY createdAt DESC LIMIT 20");
    $stmt->bind_param("i", $userID);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            "id" => intval($row["notificationID"]),
            "title" => $row["title"],
            "message" => $row["message"],
            "time" => date("Y-m-d H:i", strtotime($row["createdAt"])),
            "unread" => !$row["isRead"]
        ];
    }

    $stmt->close();
    $response["success"] = true;
    $response["data"] = [
        "notifications" => $notifications
    ];
} catch (Exception $e) {
    $response["message"] = "Failed to load notifications: " . $e->getMessage();
}

$conn->close();
echo json_encode($response);
