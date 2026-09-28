<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['DONOR', 'ADMIN']);
$userID = $sessionUser['userID'];

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
    SELECT d.donationID, d.amount, d.donationDate, d.status as donationStatus, d.paymentMethod,
           p.title as projectName, ps.verificationStatus, pay.paymentGateway
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    LEFT JOIN PaymentSlips ps ON d.donationID = ps.donationID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    WHERE d.donorID = ? AND d.status = 'PENDING'
    ORDER BY d.donationDate DESC
";

$stmtList = $conn->prepare($query);
$donations = [];

if ($stmtList) {
    $stmtList->bind_param("i", $donorID);
    $stmtList->execute();
    $resList = $stmtList->get_result();
    
    while ($row = $resList->fetch_assoc()) {
        $verificationStatus = $row['verificationStatus'] ? $row['verificationStatus'] : 'PENDING';
        
        $actualPaymentMethod = 'Not Recorded';
        if ($row['paymentMethod'] === 'ONLINE') {
            $actualPaymentMethod = $row['paymentGateway'] ? $row['paymentGateway'] : 'Online Payment';
        } elseif ($row['paymentMethod'] === 'BANK_SLIP') {
            $actualPaymentMethod = 'Bank Transfer';
        }
        
        $donations[] = [
            "id" => $row['donationID'],
            "projectName" => $row['projectName'],
            "amount" => floatval($row['amount']),
            "date" => $row['donationDate'],
            "paymentMethod" => $actualPaymentMethod,
            "paymentStatus" => $row['donationStatus'],
            "verificationStatus" => $verificationStatus,
            "expectedProcessing" => "2-3 Business Days",
            "adminNotes" => "N/A"
        ];
    }
    $stmtList->close();
}

echo json_encode([
    "success" => true,
    "data" => $donations
]);
exit;
