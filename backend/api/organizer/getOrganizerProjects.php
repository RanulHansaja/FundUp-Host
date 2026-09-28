<?php
include_once "../../config/cors.php";
header("Content-Type: application/json");

include_once "../../config/db.php";
include_once "../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

// First get the organizerID for this userID
$stmt = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmt->bind_param('i', $userID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Organizer profile not found.'
    ]);
    exit();
}

$organizer = $result->fetch_assoc();
$organizerID = (int)$organizer['organizerID'];
$stmt->close();

// Now fetch the organizer's projects (all statuses)
// We also count how many donations exist for this project to decide if it's deletable
$sql = "
    SELECT p.projectID, p.title, p.shortSummary, p.description, p.category, p.targetAmount, p.collectedAmount, p.progressPercent, p.bannerImage, p.startDate, p.endDate, p.status, p.socialMediaLink, p.proposalPdfPath,
           (SELECT COUNT(*) FROM Donations d WHERE d.projectID = p.projectID) AS donationCount,
           (SELECT notes FROM moderation_history WHERE projectID = p.projectID AND action_type = 'REJECT_PROJECT' ORDER BY createdAt DESC LIMIT 1) AS rejectionReason
    FROM Projects p
    WHERE p.organizerID = ?
    ORDER BY p.createdAt DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $organizerID);
$stmt->execute();
$result = $stmt->get_result();
$projects = [];

while ($row = $result->fetch_assoc()) {
    $projects[] = [
        "id" => intval($row["projectID"]),
        "title" => $row["title"],
        "shortSummary" => $row["shortSummary"],
        "description" => $row["description"],
        "category" => $row["category"],
        "goal" => floatval($row["targetAmount"]),
        "raised" => floatval($row["collectedAmount"]),
        "image" => $row["bannerImage"],
        "startDate" => $row["startDate"],
        "endDate" => $row["endDate"],
        "status" => $row["status"],
        "rejectionReason" => $row["rejectionReason"],
        "socialMediaLink" => $row["socialMediaLink"],
        "proposalPdfPath" => $row["proposalPdfPath"],
        "progressPercent" => intval($row["progressPercent"] ?? 0),
        "donationCount" => intval($row["donationCount"])
    ];
}

echo json_encode([
    "success" => true,
    "data" => $projects
]);

$stmt->close();
$conn->close();
?>
