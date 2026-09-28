<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$token = trim($data["token"] ?? "");
$password = $data["password"] ?? "";
$confirmPassword = $data["confirmPassword"] ?? "";

// 9. Password Validation (server side validation)
if (empty($token) || empty($password) || empty($confirmPassword)) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit();
}

if ($password !== $confirmPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Passwords do not match."
    ]);
    exit();
}

if (strlen($password) < 8) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters long."
    ]);
    exit();
}

// 7. Backend Token Validation
$tokenHash = hash('sha256', $token);

$stmt = $conn->prepare("SELECT resetID, userID, expiresAt, usedAt FROM password_resets WHERE tokenHash = ? LIMIT 1");
$stmt->bind_param("s", $tokenHash);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid reset token."
    ]);
    $stmt->close();
    exit();
}

$resetRecord = $result->fetch_assoc();
$stmt->close();

$resetID = (int) $resetRecord["resetID"];
$userID = (int) $resetRecord["userID"];
$expiresAt = $resetRecord["expiresAt"];
$usedAt = $resetRecord["usedAt"];

// 7. Check if usedAt is NULL
if ($usedAt !== null) {
    echo json_encode([
        "success" => false,
        "message" => "This reset link has already been used."
    ]);
    exit();
}

// 7. Check if expiresAt has passed (using current system date/time)
if (strtotime($expiresAt) < time()) {
    echo json_encode([
        "success" => false,
        "message" => "This reset link has expired."
    ]);
    exit();
}

// Validate that user exists in the Users table
$userCheck = $conn->prepare("SELECT userID FROM Users WHERE userID = ? LIMIT 1");
$userCheck->bind_param("i", $userID);
$userCheck->execute();
$userCheckResult = $userCheck->get_result();

if ($userCheckResult->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "The user associated with this token no longer exists."
    ]);
    $userCheck->close();
    exit();
}
$userCheck->close();

// Start transaction to update password and mark token as used
$conn->begin_transaction();

try {
    // 8. Hash new password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Update password in Users table
    $updateUser = $conn->prepare("UPDATE Users SET password = ? WHERE userID = ?");
    $updateUser->bind_param("si", $hashedPassword, $userID);
    $updateUser->execute();
    $updateUser->close();

    // 10. Invalidate Token After Successful Reset (mark usedAt)
    $updateToken = $conn->prepare("UPDATE password_resets SET usedAt = NOW() WHERE resetID = ?");
    $updateToken->bind_param("i", $resetID);
    $updateToken->execute();
    $updateToken->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Your password has been successfully reset. Redirecting to login..."
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "An error occurred while resetting the password: " . $e->getMessage()
    ]);
}

$conn->close();
exit();
?>
