<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";

$projectID = isset($_GET['projectID']) ? intval($_GET['projectID']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if ($projectID <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid project ID."
    ]);
    exit;
}

// Auto-mark active projects whose end date has passed as COMPLETED
$conn->query("UPDATE Projects SET status = 'COMPLETED' WHERE status = 'ACTIVE' AND endDate < CURDATE()");

// 1. Fetch Project Details & Organizer Details
$projectSql = "
    SELECT 
        p.projectID, p.title, p.shortSummary, p.description, p.category, 
        p.targetAmount, p.collectedAmount, p.progressPercent, p.bannerImage, p.status, 
        p.startDate, p.endDate, p.socialMediaLink, p.proposalPdfPath,
        o.organizationName, o.universityName, 
        u.fullName AS organizerName, u.email AS organizerEmail, u.phoneNo AS organizerPhone
    FROM Projects p
    JOIN Organizers o ON p.organizerID = o.organizerID
    JOIN Users u ON o.userID = u.userID
    WHERE p.projectID = ?
    LIMIT 1
";

$stmt = $conn->prepare($projectSql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Database prepare statement failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $projectID);
$stmt->execute();
$projectResult = $stmt->get_result();

if ($projectResult->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Project not found."
    ]);
    $stmt->close();
    exit;
}

$projectData = $projectResult->fetch_assoc();
if ($projectData['status'] === 'SUSPENDED') {
    echo json_encode([
        "success" => false,
        "message" => "This project has been suspended and is no longer available."
    ]);
    $stmt->close();
    exit;
}
if ($projectData['status'] === 'REJECTED') {
    echo json_encode([
        "success" => false,
        "message" => "This project has been rejected and is no longer available."
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

// Structure Project details cleanly
$project = [
    "id" => intval($projectData["projectID"]),
    "title" => $projectData["title"],
    "shortSummary" => $projectData["shortSummary"],
    "description" => $projectData["description"],
    "category" => $projectData["category"],
    "targetAmount" => floatval($projectData["targetAmount"]),
    "collectedAmount" => floatval($projectData["collectedAmount"]),
    "bannerImage" => $projectData["bannerImage"],
    "status" => $projectData["status"],
    "startDate" => $projectData["startDate"],
    "endDate" => $projectData["endDate"],
    "socialMediaLink" => $projectData["socialMediaLink"],
    "proposalPdfPath" => $projectData["proposalPdfPath"],
    "progressPercent" => intval($projectData["progressPercent"] ?? 0),
    "organizationName" => $projectData["organizationName"],
    "universityName" => $projectData["universityName"],
    "organizerName" => $projectData["organizerName"],
    "organizerEmail" => $projectData["organizerEmail"],
    "organizerPhone" => $projectData["organizerPhone"]
];

// 2. Fetch Project Media
$media = [];
$mediaSql = "SELECT mediaID, mediaType, mediaPaths FROM ProjectMedia WHERE projectID = ?";
$stmt = $conn->prepare($mediaSql);
if ($stmt) {
    $stmt->bind_param("i", $projectID);
    $stmt->execute();
    $mediaResult = $stmt->get_result();
    while ($row = $mediaResult->fetch_assoc()) {
        $paths = json_decode($row["mediaPaths"] ?? '[]', true);
        if (!is_array($paths)) {
            $paths = $row["mediaPaths"] ? [$row["mediaPaths"]] : [];
        }
        foreach ($paths as $path) {
            $media[] = [
                "id" => intval($row["mediaID"]),
                "type" => $row["mediaType"],
                "path" => $path
            ];
        }
    }
    $stmt->close();
}

// 3. Fetch Project Progress Updates
$updates = [];
$updatesSql = "SELECT updateID, title, description, imagePaths, progressPercent, milestone, updateDate FROM ProgressUpdates WHERE projectID = ? ORDER BY updateDate DESC";
$stmt = $conn->prepare($updatesSql);
if ($stmt) {
    $stmt->bind_param("i", $projectID);
    $stmt->execute();
    $updatesResult = $stmt->get_result();
    while ($row = $updatesResult->fetch_assoc()) {
        $rawImage = $row["imagePath"] ?? null;
        $imagePaths = json_decode($rawImage ?? '[]', true);
        if (!is_array($imagePaths)) {
            $imagePaths = $rawImage ? [$rawImage] : [];
        }
        $videoPaths = [];
        $firstImage = !empty($imagePaths) ? $imagePaths[0] : null;

        $updates[] = [
            "id" => intval($row["updateID"]),
            "title" => $row["title"],
            "description" => $row["description"],
            "image" => $firstImage,
            "imagePaths" => $imagePaths,
            "videoPaths" => $videoPaths,
            "progressPercent" => intval($row["progressPercent"] ?? 0),
            "milestone" => $row["milestone"],
            "date" => $row["updateDate"]
        ];
    }
    $stmt->close();
}

// 4. Fetch Approved Donations
$donations = [];
$donationsSql = "
    SELECT d.donationID, d.amount, d.donationDate, d.recognitionRequired, u.fullName AS donorName
    FROM Donations d
    JOIN Donors dn ON d.donorID = dn.donorID
    JOIN Users u ON dn.userID = u.userID
    WHERE d.projectID = ? AND d.status = 'APPROVED'
    ORDER BY d.donationDate DESC
";
$stmt = $conn->prepare($donationsSql);
if ($stmt) {
    $stmt->bind_param("i", $projectID);
    $stmt->execute();
    $donationsResult = $stmt->get_result();
    while ($row = $donationsResult->fetch_assoc()) {
        $donations[] = [
            "id" => intval($row["donationID"]),
            "amount" => floatval($row["amount"]),
            "date" => $row["donationDate"],
            "recognitionRequired" => (bool)$row["recognitionRequired"],
            "donorName" => $row["donorName"]
        ];
    }
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "data" => [
        "project" => $project,
        "media" => $media,
        "updates" => $updates,
        "donations" => $donations
    ]
]);
?>
