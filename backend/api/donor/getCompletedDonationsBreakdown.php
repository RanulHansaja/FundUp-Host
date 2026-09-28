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
    SELECT d.donationID, d.amount, d.donationDate, d.paymentMethod, 
           p.title as projectName, pay.transactionID, pay.paymentGateway
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    WHERE d.donorID = ? AND d.status = 'APPROVED'
    ORDER BY d.donationDate ASC
";

$stmtList = $conn->prepare($query);
$donations = [];

if ($stmtList) {
    $stmtList->bind_param("i", $donorID);
    $stmtList->execute();
    $resList = $stmtList->get_result();
    
    $runningTotal = 0.00;
    
    while ($row = $resList->fetch_assoc()) {
        $amount = floatval($row['amount']);
        $runningTotal += $amount;
        
        $transactionID = $row['transactionID'] ? $row['transactionID'] : ($row['paymentMethod'] === 'BANK_SLIP' ? 'N/A' : 'Pending');
        
        $actualPaymentMethod = 'Not Recorded';
        if ($row['paymentMethod'] === 'ONLINE') {
            $actualPaymentMethod = $row['paymentGateway'] ? $row['paymentGateway'] : 'Online Payment';
        } elseif ($row['paymentMethod'] === 'BANK_SLIP') {
            $actualPaymentMethod = 'Bank Transfer';
        }
        
        // Sorting ascending to calculate running total properly, but we probably want it descending in UI.
        // We will array_reverse at the end.
        
        $donations[] = [
            "id" => $row['donationID'],
            "projectName" => $row['projectName'],
            "date" => $row['donationDate'],
            "amount" => $amount,
            "paymentMethod" => $actualPaymentMethod,
            "transactionID" => $transactionID,
            "receiptStatus" => "Available", // Mocked as requested
            "runningTotal" => $runningTotal
        ];
    }
    $stmtList->close();
}

// Reverse to show most recent first
$donations = array_reverse($donations);

echo json_encode([
    "success" => true,
    "data" => $donations
]);
exit;
