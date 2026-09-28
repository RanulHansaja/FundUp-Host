<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Authenticate session (donors and admins allowed)
$sessionUser = requireAuth(['DONOR', 'ADMIN']);

// Force userID to be the authenticated user's ID to prevent IDOR/BOLA
$userID = $sessionUser['userID'];
$donorID = null;

// Initialize response array
$response = [
    "success" => false,
    "message" => "",
    "data" => null
];

// 1. Fetch Donor and User details
if ($donorID) {
    $stmt = $conn->prepare("
        SELECT d.donorID, u.fullName, u.email, d.badgeLevel, d.totalDonation 
        FROM Donors d
        JOIN Users u ON d.userID = u.userID
        WHERE d.donorID = ?
    ");
    if (!$stmt) {
        $response["message"] = "Query preparation failed: " . $conn->error;
        echo json_encode($response);
        exit;
    }
    $stmt->bind_param("i", $donorID);
} else if ($userID) {
    $stmt = $conn->prepare("
        SELECT d.donorID, u.fullName, u.email, d.badgeLevel, d.totalDonation 
        FROM Donors d
        JOIN Users u ON d.userID = u.userID
        WHERE u.userID = ?
    ");
    if (!$stmt) {
        $response["message"] = "Query preparation failed: " . $conn->error;
        echo json_encode($response);
        exit;
    }
    $stmt->bind_param("i", $userID);
} else {
    // Default to donorID = 1 for testing
    $defaultDonorID = 1;
    $stmt = $conn->prepare("
        SELECT d.donorID, u.fullName, u.email, d.badgeLevel, d.totalDonation 
        FROM Donors d
        JOIN Users u ON d.userID = u.userID
        WHERE d.donorID = ?
    ");
    if (!$stmt) {
        $response["message"] = "Query preparation failed: " . $conn->error;
        echo json_encode($response);
        exit;
    }
    $stmt->bind_param("i", $defaultDonorID);
}

$stmt->execute();
$donorResult = $stmt->get_result();

if ($donorResult->num_rows === 0) {
    $response["message"] = "Donor not found with the provided details.";
    echo json_encode($response);
    exit;
}

$donorInfo = $donorResult->fetch_assoc();
$stmt->close();

// Resolve/override $donorID to the actual ID found in the database
$donorID = intval($donorInfo['donorID']);

// Calculate actual total donations dynamically from Donations table to prevent column desync
$stmtTotal = $conn->prepare("
    SELECT SUM(amount) as calculatedTotal 
    FROM Donations 
    WHERE donorID = ? AND status = 'APPROVED'
");
$stmtTotal->bind_param("i", $donorID);
$stmtTotal->execute();
$totalRes = $stmtTotal->get_result()->fetch_assoc();
$actualTotal = floatval($totalRes['calculatedTotal'] ?? 0.00);
$stmtTotal->close();

$donorInfo['totalDonation'] = $actualTotal;

// 2. Fetch Projects Supported count
$stmtSupported = $conn->prepare("
    SELECT COUNT(DISTINCT projectID) as projectsSupported 
    FROM Donations 
    WHERE donorID = ? AND status = 'APPROVED'
");
$stmtSupported->bind_param("i", $donorID);
$stmtSupported->execute();
$supportedResult = $stmtSupported->get_result();
$supportedRow = $supportedResult->fetch_assoc();
$donorInfo['projectsSupported'] = intval($supportedRow['projectsSupported']);
$stmtSupported->close();

// Auto-mark active projects whose end date has passed as COMPLETED
$conn->query("UPDATE Projects SET status = 'COMPLETED' WHERE status = 'ACTIVE' AND endDate < CURDATE()");

// 3. Fetch Ongoing Campaigns count (Excludes SUSPENDED, REJECTED, and COMPLETED projects)
$activeCampaigns = 0;
$resultActive = $conn->query("SELECT COUNT(*) as activeCount FROM Projects WHERE status NOT IN ('SUSPENDED', 'REJECTED', 'COMPLETED') AND endDate >= CURDATE()");
if ($resultActive) {
    $row = $resultActive->fetch_assoc();
    $activeCampaigns = intval($row['activeCount']);
}

// 4. Set verified/ongoing projects count (excluding SUSPENDED, REJECTED, and COMPLETED)
$verifiedProjects = $activeCampaigns;

// 5. Fetch Supported Projects List for the current donor
$activeProjectsList = [];
$projectsQuery = "
    SELECT DISTINCT p.projectID, p.title, p.description, p.category, p.targetAmount, p.collectedAmount, p.bannerImage, p.endDate, p.status, o.organizationName, o.universityName 
    FROM Projects p
    JOIN Organizers o ON p.organizerID = o.organizerID
    JOIN Donations d ON p.projectID = d.projectID
    WHERE d.donorID = ? AND d.status = 'APPROVED'
    ORDER BY d.donationDate DESC
    LIMIT 4
";
$stmtProjects = $conn->prepare($projectsQuery);
if ($stmtProjects) {
    $stmtProjects->bind_param("i", $donorID);
    $stmtProjects->execute();
    $resultProjects = $stmtProjects->get_result();
    while ($row = $resultProjects->fetch_assoc()) {
        $activeProjectsList[] = [
            "projectID" => intval($row["projectID"]),
            "title" => $row["title"],
            "description" => $row["description"],
            "category" => $row["category"],
            "targetAmount" => floatval($row["targetAmount"]),
            "collectedAmount" => floatval($row["collectedAmount"]),
            "bannerImage" => $row["bannerImage"] ? $row["bannerImage"] : "/src/assets/images/Educational Support Fundraiser.png",
            "endDate" => $row["endDate"],
            "status" => $row["status"],
            "organizationName" => $row["organizationName"],
            "universityName" => $row["universityName"]
        ];
    }
    $stmtProjects->close();
}

// 6. Fetch Recent Activity Feed (Live Tracking)
$liveTracking = [];
$activityQuery = "
    SELECT d.amount, d.donationDate, p.title as projectTitle, u.fullName as donorName 
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Donors dn ON d.donorID = dn.donorID
    JOIN Users u ON dn.userID = u.userID
    WHERE d.status = 'APPROVED'
    ORDER BY d.donationDate DESC
    LIMIT 5
";
$resultActivity = $conn->query($activityQuery);
if ($resultActivity && $resultActivity->num_rows > 0) {
    while ($row = $resultActivity->fetch_assoc()) {
        $liveTracking[] = [
            "type" => "donation",
            "title" => $row["projectTitle"],
            "message" => $row["donorName"] . " donated Rs. " . number_format($row["amount"], 0) . ".",
            "time" => $row["donationDate"]
        ];
    }
}

// If activity feed is sparse, append useful mock campaign updates for realistic visual effect
if (count($liveTracking) < 3) {
    // Check remaining amounts of active projects to make them realistic
    foreach ($activeProjectsList as $proj) {
        $remaining = $proj["targetAmount"] - $proj["collectedAmount"];
        if ($remaining > 0) {
            $liveTracking[] = [
                "type" => "update",
                "title" => $proj["title"],
                "message" => "Campaign nearing target! Rs. " . number_format($remaining, 0) . " remaining.",
                "time" => date("Y-m-d H:i:s", strtotime("-2 hours"))
            ];
        }
    }
    
    // Add default backup trackings if empty
    if (count($liveTracking) === 0) {
        $liveTracking[] = [
            "type" => "update",
            "title" => "Educational Support",
            "message" => "Campaign nearing target! Rs. 150k remaining.",
            "time" => date("Y-m-d H:i:s", strtotime("-10 mins"))
        ];
        $liveTracking[] = [
            "type" => "milestone",
            "title" => "Green Campus",
            "message" => "New Milestone Reached: 50% target achieved!",
            "time" => date("Y-m-d H:i:s", strtotime("-1 hour"))
        ];
    }
}

// Prepare final response
$response["success"] = true;
$response["data"] = [
    "donor" => $donorInfo,
    "stats" => [
        "totalDonations" => floatval($donorInfo["totalDonation"]),
        "activeCampaigns" => $activeCampaigns,
        "verifiedProjects" => $verifiedProjects
    ],
    "activeProjects" => $activeProjectsList,
    "liveTracking" => $liveTracking
];

echo json_encode($response);
?>
