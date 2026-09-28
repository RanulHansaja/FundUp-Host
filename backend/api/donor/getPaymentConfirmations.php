<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['DONOR']);
$userID = $sessionUser['userID'];

// Fetch the donorID associated with the logged-in userID to prevent IDOR/BOLA
$stmtDonor = $conn->prepare("SELECT donorID FROM Donors WHERE userID = ? LIMIT 1");
$stmtDonor->bind_param("i", $userID);
$stmtDonor->execute();
$donorRes = $stmtDonor->get_result();
if ($donorRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Donor profile not found."]);
    exit();
}
$donorID = (int)$donorRes->fetch_assoc()['donorID'];
$stmtDonor->close();

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];

// Fetch bank slip donations and verification statuses
$stmt = $conn->prepare("
    SELECT 
        d.donationID,
        d.amount,
        d.donationDate,
        d.paymentMethod,
        d.status as donationStatus,
        p.title as projectTitle,
        ps.verificationStatus as slipStatus,
        ps.imagePath as slipImage
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    LEFT JOIN PaymentSlips ps ON d.donationID = ps.donationID
    WHERE d.donorID = ? AND d.paymentMethod = 'BANK_SLIP'
    ORDER BY d.donationDate DESC
");

if (!$stmt) {
    $response["message"] = "Query preparation failed: " . $conn->error;
    echo json_encode($response);
    exit;
}

$stmt->bind_param("i", $donorID);
$stmt->execute();
$result = $stmt->get_result();

$confirmations = [];
while ($row = $result->fetch_assoc()) {
    // Resolve verification status: Pending, Verified, Rejected
    $status = 'Pending';
    if ($row['slipStatus'] === 'APPROVED') {
        $status = 'Verified';
    } elseif ($row['slipStatus'] === 'REJECTED') {
        $status = 'Rejected';
    } else {
        $status = 'Pending';
    }

    $confirmations[] = [
        "donationID" => intval($row["donationID"]),
        "projectTitle" => $row["projectTitle"],
        "amount" => floatval($row["amount"]),
        "date" => $row["donationDate"],
        "paymentMethod" => "BANK_SLIP",
        "status" => $status,
        "slipImage" => $row["slipImage"]
    ];
}

$stmt->close();

$response["success"] = true;
$response["data"] = $confirmations;

echo json_encode($response);
?>
