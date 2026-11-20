<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/MailHelper.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");

if (empty($email)) {
    echo json_encode([
        "success" => false,
        "message" => "Email is required."
    ]);
    exit();
}

// Check if user exists (role-independent)
$stmt = $conn->prepare("SELECT userID, fullName FROM Users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $userID = (int) $user["userID"];
    $fullName = $user["fullName"];
    $stmt->close();

    // 11. Invalidate previous unused reset tokens for this user
    $invalidateStmt = $conn->prepare("UPDATE password_resets SET usedAt = NOW() WHERE userID = ? AND usedAt IS NULL");
    $invalidateStmt->bind_param("i", $userID);
    $invalidateStmt->execute();
    $invalidateStmt->close();

    // 3. Secure Token Generation (cryptographically secure)
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    // 4. Token Expiration (15 minutes from now)
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $insertStmt = $conn->prepare("INSERT INTO password_resets (userID, tokenHash, expiresAt) VALUES (?, ?, ?)");
    $insertStmt->bind_param("iss", $userID, $tokenHash, $expiresAt);
    $insertStmt->execute();
    $insertStmt->close();

    // Determine the frontend base URL dynamically (matching config/cors.php origins or default to localhost:5173)
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
    $allowed_origins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
    ];
    $baseUrl = in_array($origin, $allowed_origins) ? $origin : 'http://localhost:5173';
    $resetLink = "$baseUrl/reset-password?token=$token";

    // 5. Send password reset email (failsafe try-catch)
    try {
        sendPasswordResetEmail($email, $fullName, $resetLink);
    } catch (Throwable $mailEx) {
        error_log("Failed to send password reset email to $email: " . $mailEx->getMessage());
    }
} else {
    $stmt->close();
}

// 2. Generic response to prevent user/account enumeration
echo json_encode([
    "success" => true,
    "message" => "If an account exists for this email, a password reset link has been sent."
]);
exit();
?>
