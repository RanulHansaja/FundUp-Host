<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . "/../../config/db.php";

// Auto-mark active projects whose end date has passed as COMPLETED
$conn->query("UPDATE Projects SET status = 'COMPLETED' WHERE status = 'ACTIVE' AND endDate < CURDATE()");

// Fetch active projects from Projects table and join with Organizers for verification / university info
$sql = "
    SELECT p.projectID, p.title, p.shortSummary, p.description, p.category, p.targetAmount, p.collectedAmount, p.bannerImage, p.endDate, p.status, o.organizationName, o.universityName 
    FROM Projects p
    LEFT JOIN Organizers o ON p.organizerID = o.organizerID
    WHERE p.status IN ('ACTIVE', 'COMPLETED', 'PENDING', 'SUSPENDED', 'APPROVED')
    ORDER BY p.createdAt DESC
";

$result = $conn->query($sql);
$projects = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $projects[] = [
            "id" => intval($row["projectID"]),
            "title" => $row["title"],
            "description" => $row["shortSummary"] ? $row["shortSummary"] : $row["description"],
            "category" => $row["category"],
            "raised" => floatval($row["collectedAmount"]),
            "goal" => floatval($row["targetAmount"]),
            "image" => $row["bannerImage"],
            "endDate" => $row["endDate"],
            "status" => $row["status"],
            "organizationName" => $row["organizationName"] ?? "Campus Organization",
            "universityName" => $row["universityName"] ?? "University"
        ];
    }
    echo json_encode([
        "success" => true,
        "data" => $projects
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Database query failed: " . $conn->error
    ]);
}
?>
