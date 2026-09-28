<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

// Fetch the organizerID associated with the logged-in userID
$stmtOrganizer = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmtOrganizer->bind_param("i", $userID);
$stmtOrganizer->execute();
$orgRes = $stmtOrganizer->get_result();
if ($orgRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Organizer profile not found."]);
    exit();
}
$organizerID = (int)$orgRes->fetch_assoc()['organizerID'];
$stmtOrganizer->close();

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];

// Fetch all donations made to this organizer's projects
$query = "
    SELECT 
        d.donationID,
        d.amount,
        d.donationDate,
        d.paymentMethod,
        d.status AS donationStatus,
        p.title AS projectTitle,
        p.projectID,
        u.fullName AS donorName,
        u.email AS donorEmail,
        ps.slipID,
        ps.imagePath AS slipImage,
        ps.verificationStatus AS slipStatus,
        pay.paymentGateway,
        c.commercialID,
        c.companyName,
        c.websiteLink,
        c.mediaPath AS adMedia,
        c.mediaType AS adMediaType,
        c.approvalStatus AS commStatus
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Donors dn ON d.donorID = dn.donorID
    JOIN Users u ON dn.userID = u.userID
    LEFT JOIN PaymentSlips ps ON d.donationID = ps.donationID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    LEFT JOIN Commercializations c ON d.donationID = c.donationID
    WHERE p.organizerID = ?
    ORDER BY d.donationDate DESC
";

$stmt = $conn->prepare($query);
if (!$stmt) {
    $response["message"] = "Query preparation failed: " . $conn->error;
    echo json_encode($response);
    exit();
}

$stmt->bind_param("i", $organizerID);
$stmt->execute();
$result = $stmt->get_result();

$donations = [];
while ($row = $result->fetch_assoc()) {
    $actualPaymentMethod = 'Not Recorded';
    if ($row['paymentMethod'] === 'ONLINE') {
        $actualPaymentMethod = $row['paymentGateway'] ? $row['paymentGateway'] : 'Online Payment';
    } elseif ($row['paymentMethod'] === 'BANK_SLIP') {
        $actualPaymentMethod = 'Bank Transfer';
    }

    $donations[] = [
        "donationID" => intval($row["donationID"]),
        "projectID" => intval($row["projectID"]),
        "projectTitle" => $row["projectTitle"],
        "donorName" => $row["donorName"],
        "donorEmail" => $row["donorEmail"],
        "amount" => floatval($row["amount"]),
        "date" => $row["donationDate"],
        "paymentMethod" => $actualPaymentMethod,
        "status" => $row["donationStatus"],
        "slipID" => $row["slipID"] ? intval($row["slipID"]) : null,
        "slipImage" => $row["slipImage"],
        "slipStatus" => $row["slipStatus"],
        "commercial" => $row["commercialID"] ? [
            "commercialID" => intval($row["commercialID"]),
            "companyName" => $row["companyName"],
            "websiteLink" => $row["websiteLink"],
            "adMedia" => $row["adMedia"],
            "adMediaType" => $row["adMediaType"],
            "commStatus" => $row["commStatus"]
        ] : null
    ];
}

$stmt->close();

$response["success"] = true;
$response["data"] = $donations;

echo json_encode($response);
?>
