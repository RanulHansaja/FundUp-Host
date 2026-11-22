<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/sessionHelper.php";

startSecureSession();

// Rate limiting with a Cooldown Period (5 failed attempts within 10 minutes -> 60s cooldown, no permanent lock)
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
$clientIp = trim(explode(',', $clientIp)[0]);
$rateKey = 'rate_login_' . md5($clientIp);

$maxAttempts = 5;
$cooldownSeconds = 60; // Cooldown duration (1 minute)
$windowSeconds = 600;   // 10 minutes rolling window
$now = time();

$attempts = $_SESSION[$rateKey]['attempts'] ?? 0;
$lastAttempt = $_SESSION[$rateKey]['last_attempt'] ?? 0;

// Reset attempts if the previous failure occurred outside the 10-minute window
if ($lastAttempt > 0 && ($now - $lastAttempt) > $windowSeconds) {
    $attempts = 0;
    $_SESSION[$rateKey] = ['attempts' => 0, 'last_attempt' => $now];
}

if ($attempts >= $maxAttempts) {
    $timePassed = $now - $lastAttempt;
    if ($timePassed < $cooldownSeconds) {
        $remaining = $cooldownSeconds - $timePassed;
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "message" => "Too many failed login attempts. Please wait {$remaining} seconds (cooldown) before trying again."
        ]);
        exit();
    } else {
        // Cooldown period expired: reset counter (allows retry without permanent lockout)
        $_SESSION[$rateKey] = ['attempts' => 0, 'last_attempt' => $now];
    }
}

function registerLoginFailure($key) {
    $curr = $_SESSION[$key]['attempts'] ?? 0;
    $_SESSION[$key] = [
        'attempts' => $curr + 1,
        'last_attempt' => time()
    ];
}

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if (empty($email) || empty($password)) {
    registerLoginFailure($rateKey);
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);
    exit();
}

$stmt = $conn->prepare("SELECT userID, fullName, password, role, status, profilePhoto FROM Users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    registerLoginFailure($rateKey);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    $stmt->close();
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user["password"])) {
    registerLoginFailure($rateKey);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    exit();
}

if ($user["status"] === "SUSPENDED") {
    echo json_encode([
        "success" => false,
        "message" => "Your account has been suspended. Please contact support."
    ]);
    exit();
}

if ($user["status"] === "BLOCKED") {
    echo json_encode([
        "success" => false,
        "message" => "Your account has been permanently blocked by platform administration. Access denied."
    ]);
    exit();
}



$verificationStatus = null;
if ($user["role"] === "ORGANIZER") {
    $stmt2 = $conn->prepare("SELECT verificationStatus FROM Organizers WHERE userID = ? LIMIT 1");
    $stmt2->bind_param("i", $user["userID"]);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $organizer = $result2->fetch_assoc();
    $stmt2->close();

    if (!$organizer) {
        echo json_encode([
            "success" => false,
            "message" => "Organizer profile not found. Please contact support."
        ]);
        exit();
    }

    $verificationStatus = $organizer["verificationStatus"];
    if ($verificationStatus === "UNVERIFIED") {
        echo json_encode([
            "success" => false,
            "message" => "Your organizer account is not verified yet. Access is restricted until verification is complete."
        ]);
        exit();
    }else if ($verificationStatus === "REJECTED") {
        echo json_encode([
            "success" => false,
            "message" => "Your organizer account verification was rejected. Please contact support for further assistance."
        ]);
        exit();
    }
}

// Regenerate session ID to prevent Session Fixation
session_regenerate_id(true);

// Clear failed rate limit attempts on successful authentication
unset($_SESSION[$rateKey]);

// Store user details in session
$_SESSION['userID'] = (int) $user["userID"];
$_SESSION['role'] = $user["role"];
$_SESSION['fullName'] = $user["fullName"];
$_SESSION['email'] = $email;

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "userID" => (int) $user["userID"],
    "fullName" => $user["fullName"],
    "email" => $email,
    "role" => $user["role"],
    "verificationStatus" => $verificationStatus,
    "profilePhoto" => $user["profilePhoto"]
]);

?>