<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";

$sql = "
    SELECT c.commercialID, c.companyName, c.websiteLink, c.mediaPath, c.mediaType, c.createdAt
    FROM Commercializations c
    JOIN Donations d ON c.donationID = d.donationID
    WHERE c.approvalStatus = 'APPROVED'
      AND d.status = 'APPROVED'
        AND c.createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY c.createdAt DESC
";

$result = $conn->query($sql);
$slides = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $slides[] = [
            "id" => intval($row["commercialID"]),
            "companyName" => $row["companyName"],
            "websiteLink" => $row["websiteLink"],
            "mediaPath" => $row["mediaPath"],
            "mediaType" => $row["mediaType"],
            "createdAt" => $row["createdAt"]
        ];
    }

    echo json_encode([
        "success" => true,
        "data" => $slides
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Database query failed: " . $conn->error
    ]);
}
?>
