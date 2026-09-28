<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/sessionHelper.php";

startSecureSession();

$query = "SELECT c.commentID, c.comment, c.createdAt, u.userID, u.fullName, u.role, u.profilePhoto
          FROM comments c
          JOIN Users u ON c.userID = u.userID
          ORDER BY c.commentID DESC
          LIMIT 2";

$result = $conn->query($query);

$comments = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "data" => $comments
]);
?>