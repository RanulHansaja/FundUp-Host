<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth();

$userID = $_GET["userID"] ?? null;

if (!$userID) {
    echo json_encode(["success" => false, "message" => "userID is required."]);
    exit();
}

// Enforce Access Control: user can only view their own profile unless they are an ADMIN
if ($sessionUser['role'] !== 'ADMIN' && (int)$userID !== $sessionUser['userID']) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. You can only view your own profile."]);
    exit();
}

$stmt = $conn->prepare("SELECT userID, fullName, email, phoneNo, role, status, profilePhoto FROM Users WHERE userID = ? LIMIT 1");
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

$response = [
    "success" => true,
    "user" => $user,
];

// Fetch role-specific details
if ($user["role"] === "ORGANIZER") {
    $stmt2 = $conn->prepare("SELECT organizerID, organizationName, universityName, verificationStatus, verifiedDate FROM Organizers WHERE userID = ? LIMIT 1");
    $stmt2->bind_param("i", $userID);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $organizer = $result2->fetch_assoc();
    $stmt2->close();
    
    if ($organizer) {
        $response["organizer"] = $organizer;
    }
} else if ($user["role"] === "DONOR") {
    $stmt3 = $conn->prepare("SELECT donorID, badgeLevel, totalDonation, bio FROM Donors WHERE userID = ? LIMIT 1");
    $stmt3->bind_param("i", $userID);
    $stmt3->execute();
    $result3 = $stmt3->get_result();
    $donor = $result3->fetch_assoc();
    $stmt3->close();
    
    if ($donor) {
        $response["donor"] = $donor;
    }
}

echo json_encode($response);

?>
