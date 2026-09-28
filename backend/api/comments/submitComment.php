<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/sessionHelper.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

startSecureSession();
$sessionUser = requireAuth();

$data = json_decode(file_get_contents("php://input"), true);
$comment = trim($data["comment"] ?? "");

if (empty($comment)) {
    echo json_encode([
        "success" => false,
        "message" => "Comment cannot be empty."
    ]);
    exit();
}

if (strlen($comment) > 2000) {
    echo json_encode([
        "success" => false,
        "message" => "Comment is too long. Please keep it under 2000 characters."
    ]);
    exit();
}

$comment = htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');

$stmt = $conn->prepare("INSERT INTO comments (userID, comment) VALUES (?, ?)");
$stmt->bind_param("is", $sessionUser['userID'], $comment);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Comment submitted successfully."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to save comment. Please try again later."
    ]);
}

$stmt->close();
?>