<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Authenticate session (restrict to ORGANIZER)
$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

$response = [
    "success" => false,
    "message" => "",
    "data" => null
];

try {
    // 1. Fetch Organizer Profile Details
    $stmt = $conn->prepare("
        SELECT o.organizerID, o.organizationName, o.universityName, o.verificationStatus, u.fullName, u.email, u.phoneNo
        FROM Organizers o
        JOIN Users u ON o.userID = u.userID
        WHERE o.userID = ? LIMIT 1
    ");
    $stmt->bind_param("i", $userID);
    $stmt->execute();
    $orgResult = $stmt->get_result();

    if ($orgResult->num_rows === 0) {
        $response["message"] = "Organizer profile not found.";
        echo json_encode($response);
        exit;
    }

    $organizerInfo = $orgResult->fetch_assoc();
    $organizerID = intval($organizerInfo['organizerID']);
    $stmt->close();

    // 2. Fetch Stats
    // Total Funds Raised (sum of collectedAmount of all projects belonging to the organizer)
    $fundsStmt = $conn->prepare("SELECT SUM(collectedAmount) AS totalRaised FROM Projects WHERE organizerID = ?");
    $fundsStmt->bind_param("i", $organizerID);
    $fundsStmt->execute();
    $fundsResult = $fundsStmt->get_result();
    $totalRaised = floatval($fundsResult->fetch_assoc()['totalRaised'] ?? 0);
    $fundsStmt->close();

    // Active Projects Count 
    $activeStmt = $conn->prepare("SELECT COUNT(*) AS activeCount FROM Projects WHERE organizerID = ? AND status IN ('ACTIVE')");
    $activeStmt->bind_param("i", $organizerID);
    $activeStmt->execute();
    $activeResult = $activeStmt->get_result();
    $activeCount = intval($activeResult->fetch_assoc()['activeCount'] ?? 0);
    $activeStmt->close();

    // Pending Verification Count (from PaymentSlips & Donations)
    $pendingStmt = $conn->prepare("
        SELECT COUNT(*) AS pendingCount 
        FROM PaymentSlips ps
        JOIN Donations d ON ps.donationID = d.donationID
        JOIN Projects p ON d.projectID = p.projectID
        WHERE p.organizerID = ? AND ps.verificationStatus = 'PENDING'
    ");
    $pendingStmt->bind_param("i", $organizerID);
    $pendingStmt->execute();
    $pendingResult = $pendingStmt->get_result();
    $pendingCount = intval($pendingResult->fetch_assoc()['pendingCount'] ?? 0);
    $pendingStmt->close();

    // Total Unique Donors count
    $donorsStmt = $conn->prepare("
        SELECT COUNT(d.donorID) AS donorCount 
        FROM Donors d
        JOIN Users u ON d.userID = u.userID
        WHERE u.role = 'DONOR' AND u.status
    = 'ACTIVE'
    ");
    $donorsStmt->execute();
    $donorsResult = $donorsStmt->get_result();
    $donorCount = intval($donorsResult->fetch_assoc()['donorCount'] ?? 0);
    $donorsStmt->close();

    // 3. Fetch Campaigns (Projects)
    $campaigns = [];
    $projectsStmt = $conn->prepare("
        SELECT p.projectID, p.title, p.shortSummary, p.description, p.category, p.targetAmount, p.collectedAmount, p.bannerImage, p.endDate, p.status, p.socialMediaLink,
               (SELECT COUNT(*) FROM Donations d WHERE d.projectID = p.projectID) AS donationCount
        FROM Projects p
        WHERE p.organizerID = ?
        ORDER BY p.createdAt DESC
    ");
    $projectsStmt->bind_param("i", $organizerID);
    $projectsStmt->execute();
    $projectsResult = $projectsStmt->get_result();

    while ($row = $projectsResult->fetch_assoc()) {
        // calculate days left
        $endDateTimestamp = strtotime($row["endDate"]);
        $daysLeft = 0;
        if ($endDateTimestamp > time()) {
            $daysLeft = max(0, intval(ceil(($endDateTimestamp - time()) / 86400)));
        }
        
        $campaigns[] = [
            "id" => intval($row["projectID"]),
            "title" => $row["title"],
            "tagline" => $row["shortSummary"],
            "category" => $row["category"],
            "goal" => floatval($row["targetAmount"]),
            "raised" => floatval($row["collectedAmount"]),
            "image" => $row["bannerImage"] ? $row["bannerImage"] : null,
            "endDate" => $row["endDate"],
            "status" => $row["status"],
            "socialMediaLink" => $row["socialMediaLink"],
            "donationCount" => intval($row["donationCount"]),
            "daysLeft" => $daysLeft,
            "verified" => ($organizerInfo["verificationStatus"] ?? '') === 'VERIFIED'
        ];
    }
    $projectsStmt->close();

    // 4. Fetch Recent Activity (Recent direct contributions)
    $recentDonations = [];
    $activityStmt = $conn->prepare("
        SELECT d.donationID, d.amount, d.donationDate, d.status, p.title AS projectTitle, u.fullName AS donorName
        FROM Donations d
        JOIN Projects p ON d.projectID = p.projectID
        JOIN Donors dn ON d.donorID = dn.donorID
        JOIN Users u ON dn.userID = u.userID
        WHERE p.organizerID = ?
        ORDER BY d.donationDate DESC
        LIMIT 5
    ");
    $activityStmt->bind_param("i", $organizerID);
    $activityStmt->execute();
    $activityResult = $activityStmt->get_result();

    while ($row = $activityResult->fetch_assoc()) {
        $recentDonations[] = [
            "id" => "TXN-" . $row["donationID"],
            "donorName" => $row["donorName"],
            "project" => $row["projectTitle"],
            "amount" => floatval($row["amount"]),
            "date" => date("Y-m-d", strtotime($row["donationDate"])),
            "status" => $row["status"] === 'PENDING' ? 'Pending Approval' : ($row["status"] === 'APPROVED' ? 'Approved' : 'Failed')
        ];
    }
    $activityStmt->close();

    // 5. Fetch Notifications
    $notifications = [];
    $notifStmt = $conn->prepare("
        SELECT notificationID, title, message, createdAt, isRead 
        FROM Notifications 
        WHERE userID = ? 
        ORDER BY createdAt DESC 
        LIMIT 5
    ");
    $notifStmt->bind_param("i", $userID);
    $notifStmt->execute();
    $notifResult = $notifStmt->get_result();
    while ($row = $notifResult->fetch_assoc()) {
        $notifications[] = [
            "id" => intval($row["notificationID"]),
            "text" => $row["title"] . ": " . $row["message"],
            "time" => date("Y-m-d H:i", strtotime($row["createdAt"])),
            "unread" => !$row["isRead"]
        ];
    }
    $notifStmt->close();

    // Provide dynamic notification fallbacks if database notifications are empty for UX
    if (empty($notifications)) {
        $slipNotifyStmt = $conn->prepare("
            SELECT ps.slipID, p.title 
            FROM PaymentSlips ps
            JOIN Donations d ON ps.donationID = d.donationID
            JOIN Projects p ON d.projectID = p.projectID
            WHERE p.organizerID = ? AND ps.verificationStatus = 'PENDING'
            LIMIT 3
        ");
        $slipNotifyStmt->bind_param("i", $organizerID);
        $slipNotifyStmt->execute();
        $slipNotifyResult = $slipNotifyStmt->get_result();
        while ($row = $slipNotifyResult->fetch_assoc()) {
            $notifications[] = [
                "id" => 1000 + intval($row["slipID"]),
                "text" => "A manual donation slip has been uploaded for " . $row["title"] . ".",
                "time" => "Action Required",
                "unread" => true
            ];
        }
        $slipNotifyStmt->close();
    }

    $response["success"] = true;
    $response["data"] = [
        "organizer" => [
            "name" => $organizerInfo["fullName"],
            "email" => $organizerInfo["email"],
            "university" => $organizerInfo["universityName"],
            "club_name" => $organizerInfo["organizationName"],
            "phone" => $organizerInfo["phoneNo"]
        ],
        "stats" => [
            "totalRaised" => $totalRaised,
            "activeCount" => $activeCount,
            "pendingCount" => $pendingCount,
            "donorCount" => $donorCount
        ],
        "campaigns" => $campaigns,
        "recentDonations" => $recentDonations,
        "notifications" => $notifications
    ];

} catch (Exception $e) {
    $response["message"] = "Error fetching organizer dashboard data: " . $e->getMessage();
}

$conn->close();
echo json_encode($response);
