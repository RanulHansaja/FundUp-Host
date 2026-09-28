<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";

$stats = [
    "activeCampaigns" => 0,
    "totalDonors" => 0,
    "totalFundsRaised" => 0,
    "universitiesSupported" => 0
];

try {
    // Auto-mark active projects whose end date has passed as COMPLETED
    $conn->query("UPDATE Projects SET status = 'COMPLETED' WHERE status = 'ACTIVE' AND endDate < CURDATE()");

    // 1. Active Ongoing Campaigns count
    // Count campaign records that are currently live to donors, including approved campaigns
    $sql1 = "SELECT COUNT(*) as count FROM Projects WHERE status IN ('ACTIVE', 'APPROVED') AND endDate >= CURDATE() AND (targetAmount = 0 OR collectedAmount < targetAmount)";
    $res1 = $conn->query($sql1);
    if ($res1 && $row = $res1->fetch_assoc()) {
        $stats["activeCampaigns"] = (int)$row["count"];
    }

    // 2. Total Donors (Total active registered donors)
    $sql2 = "SELECT COUNT(*) as count FROM Donors d JOIN Users u ON d.userID = u.userID WHERE u.status = 'ACTIVE'";
    $res2 = $conn->query($sql2);
    if ($res2 && $row = $res2->fetch_assoc()) {
        $stats["totalDonors"] = (int)$row["count"];
    }

    // 3. Total Funds Raised (Sum of all APPROVED donations)
    $sql3 = "SELECT IFNULL(SUM(amount), 0) as total FROM Donations WHERE status = 'APPROVED'";
    $res3 = $conn->query($sql3);
    if ($res3 && $row = $res3->fetch_assoc()) {
        $stats["totalFundsRaised"] = (float)$row["total"];
    }

    // 4. Universities Supported (Total supported universities by the platform)
    $sql4 = "SELECT COUNT(*) as count FROM university_domains";
    $res4 = $conn->query($sql4);
    if ($res4 && $row = $res4->fetch_assoc()) {
        $stats["universitiesSupported"] = (int)$row["count"];
    }

    echo json_encode([
        "success" => true,
        "data" => $stats
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch stats: " . $e->getMessage()
    ]);
}
?>
