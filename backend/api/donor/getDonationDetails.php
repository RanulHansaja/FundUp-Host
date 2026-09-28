<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['DONOR', 'ADMIN']);
$userID = $sessionUser['userID'];

if (!isset($_GET['donationID'])) {
    echo json_encode(["success" => false, "message" => "Donation ID is required."]);
    exit();
}

$donationID = intval($_GET['donationID']);

// Fetch Donor ID
$stmt = $conn->prepare("SELECT donorID FROM Donors WHERE userID = ?");
$stmt->bind_param("i", $userID);
$stmt->execute();
$donorResult = $stmt->get_result();
if ($donorResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Donor profile not found."]);
    exit();
}
$donorID = intval($donorResult->fetch_assoc()['donorID']);
$stmt->close();

$query = "
    SELECT d.donationID, d.amount, d.donationDate, d.paymentMethod, d.status as donationStatus,
           p.title as projectName, p.targetAmount, p.collectedAmount,
           o.organizationName as department, o.universityName,
           pay.transactionID, pay.paymentGateway,
           ps.verificationStatus
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Organizers o ON p.organizerID = o.organizerID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    LEFT JOIN PaymentSlips ps ON d.donationID = ps.donationID
    WHERE d.donationID = ? AND d.donorID = ?
";

$stmtDetail = $conn->prepare($query);
if ($stmtDetail) {
    $stmtDetail->bind_param("ii", $donationID, $donorID);
    $stmtDetail->execute();
    $resDetail = $stmtDetail->get_result();
    
    if ($resDetail->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Donation not found or unauthorized."]);
        exit();
    }
    
    $row = $resDetail->fetch_assoc();
    
    $transactionID = $row['transactionID'] ? $row['transactionID'] : ($row['paymentMethod'] === 'BANK_SLIP' ? 'N/A' : 'Pending');
    $verificationStatus = $row['verificationStatus'] ? $row['verificationStatus'] : ($row['paymentMethod'] === 'ONLINE' ? 'Auto-Verified' : 'Pending');
    $receiptAvailable = $row['donationStatus'] === 'APPROVED';
    
    $actualPaymentMethod = 'Not Recorded';
    if ($row['paymentMethod'] === 'ONLINE') {
        $actualPaymentMethod = $row['paymentGateway'] ? $row['paymentGateway'] : 'Online Payment';
    } elseif ($row['paymentMethod'] === 'BANK_SLIP') {
        $actualPaymentMethod = 'Bank Transfer';
    }
    
    $targetAmount = floatval($row['targetAmount']);
    $collectedAmount = floatval($row['collectedAmount']);
    $progressPercent = $targetAmount > 0 ? min(100, round(($collectedAmount / $targetAmount) * 100, 2)) : 0;
    
    $data = [
        "id" => $row['donationID'],
        "projectInfo" => $row['projectName'],
        "university" => $row['universityName'],
        "department" => $row['department'],
        "organizerDetails" => "Managed by " . $row['department'],
        "amount" => floatval($row['amount']),
        "date" => $row['donationDate'],
        "paymentMethod" => $actualPaymentMethod,
        "transactionID" => $transactionID,
        "paymentStatus" => $row['donationStatus'],
        "verificationStatus" => $verificationStatus,
        "taxReceiptAvailability" => $receiptAvailable ? "Available" : "Not Available",
        "donationMessage" => "N/A",
        "campaignProgress" => $progressPercent . "%"
    ];
    
    $stmtDetail->close();
    
    echo json_encode([
        "success" => true,
        "data" => $data
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Database error."]);
}
exit;
