<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/sessionHelper.php";

startSecureSession();

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if (empty($email) || empty($password)) {
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