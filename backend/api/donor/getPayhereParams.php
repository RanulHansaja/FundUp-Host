<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../config/payhere.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['DONOR']);
$userID = $sessionUser['userID'];

$data = json_decode(file_get_contents("php://input"), true);
$amount = isset($data['amount']) ? (float)$data['amount'] : 0.0;
$projectID = isset($data['projectID']) ? (int)$data['projectID'] : 0;

if ($amount <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid donation amount."]);
    exit();
}

if ($projectID <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid project ID."]);
    exit();
}

// Verify project exists & check remaining target amount
$stmtProj = $conn->prepare("SELECT title, collectedAmount, targetAmount, status FROM Projects WHERE projectID = ? LIMIT 1");
$stmtProj->bind_param("i", $projectID);
$stmtProj->execute();
$projRes = $stmtProj->get_result();
if ($projRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Project not found."]);
    exit();
}
$projInfo = $projRes->fetch_assoc();
$projectTitle = $projInfo['title'];
$currentCollected = (float)$projInfo['collectedAmount'];
$targetAmount = (float)$projInfo['targetAmount'];
$stmtProj->close();

if ($projInfo['status'] === 'SUSPENDED') {
    echo json_encode(["success" => false, "message" => "This project has been suspended. Donations are currently disabled."]);
    exit();
}
if ($projInfo['status'] === 'REJECTED') {
    echo json_encode(["success" => false, "message" => "This project has been rejected. Donations are currently disabled."]);
    exit();
}

if ($targetAmount > 0) {
    if ($currentCollected >= $targetAmount) {
        echo json_encode(["success" => false, "message" => "This campaign has already reached its full target funding goal."]);
        exit();
    }
    $remaining = $targetAmount - $currentCollected;
    if ($amount > $remaining) {
        echo json_encode(["success" => false, "message" => "Donation amount exceeds the remaining target goal. Maximum contribution allowed is Rs. " . number_format($remaining, 2) . "."]);
        exit();
    }
}

// Fetch donor profile details
$stmtUser = $conn->prepare("SELECT fullName, email, phoneNo FROM Users WHERE userID = ? LIMIT 1");
$stmtUser->bind_param("i", $userID);
$stmtUser->execute();
$userRes = $stmtUser->get_result();
if ($userRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "User profile not found."]);
    exit();
}
$userInfo = $userRes->fetch_assoc();
$stmtUser->close();

// Generate unique order ID
$orderID = "DON-" . $userID . "-" . time() . "-" . rand(1000, 9999);

// Format amount to 2 decimal places as required by PayHere
$amountFormatted = number_format($amount, 2, '.', '');

// Compute Hash
$merchantSecretHash = strtoupper(md5(PAYHERE_MERCHANT_SECRET));
$hashSequence = PAYHERE_MERCHANT_ID . $orderID . $amountFormatted . PAYHERE_CURRENCY . $merchantSecretHash;
$hash = strtoupper(md5($hashSequence));

// Split full name for first_name and last_name fields
$parts = explode(" ", trim($userInfo['fullName']));
$firstName = $parts[0];
$lastName = isset($parts[1]) ? implode(" ", array_slice($parts, 1)) : "Donor";

echo json_encode([
    "success" => true,
    "data" => [
        "sandbox" => PAYHERE_SANDBOX,
        "merchant_id" => PAYHERE_MERCHANT_ID,
        "order_id" => $orderID,
        "amount" => $amount,
        "currency" => PAYHERE_CURRENCY,
        "hash" => $hash,
        "projectTitle" => $projectTitle,
        "first_name" => $firstName,
        "last_name" => $lastName,
        "email" => $userInfo['email'],
        "phone" => $userInfo['phoneNo'] ? $userInfo['phoneNo'] : "0771234567"
    ]
]);
?>
