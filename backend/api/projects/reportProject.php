<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Enforce login for reporting projects
$sessionUser = requireAuth();
$userID = $sessionUser['userID'];

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$projectID = isset($data['projectID']) ? (int)$data['projectID'] : (isset($data['id']) ? (int)$data['id'] : (isset($_POST['projectID']) ? (int)$_POST['projectID'] : 0));
$reason = isset($data['reason']) ? trim($data['reason']) : (isset($_POST['reason']) ? trim($_POST['reason']) : '');
$description = isset($data['description']) ? trim($data['description']) : (isset($_POST['description']) ? trim($_POST['description']) : '');

if ($projectID <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid project ID."]);
    exit();
}

if (empty($reason)) {
    echo json_encode(["success" => false, "message" => "Please select a reason for reporting this project."]);
    exit();
}

// 1. Verify project exists
$stmtProj = $conn->prepare("SELECT p.projectID, p.title, o.userID AS organizerUserID FROM Projects p JOIN Organizers o ON p.organizerID = o.organizerID WHERE p.projectID = ? LIMIT 1");
$stmtProj->bind_param("i", $projectID);
$stmtProj->execute();
$projRes = $stmtProj->get_result();
if ($projRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Target project not found."]);
    exit();
}
$projectInfo = $projRes->fetch_assoc();
$projectTitle = $projectInfo['title'];
$organizerUserID = (int)$projectInfo['organizerUserID'];
$stmtProj->close();

// 2. Check if user already submitted a pending report for this project
$stmtCheck = $conn->prepare("SELECT reportID FROM Reports WHERE userID = ? AND projectID = ? AND status = 'PENDING' LIMIT 1");
$stmtCheck->bind_param("ii", $userID, $projectID);
$stmtCheck->execute();
$checkRes = $stmtCheck->get_result();
if ($checkRes->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "You have already submitted a pending report for this campaign."]);
    $stmtCheck->close();
    exit();
}
$stmtCheck->close();

// 3. Insert report into database
$stmtInsert = $conn->prepare("INSERT INTO Reports (userID, projectID, reason, description, status) VALUES (?, ?, ?, ?, 'PENDING')");
$stmtInsert->bind_param("iiss", $userID, $projectID, $reason, $description);

if ($stmtInsert->execute()) {
    $reportID = $stmtInsert->insert_id;
    $stmtInsert->close();

    // Create user notification
    $notifTitle = "Report Submitted";
    $notifMsg = "Your report for campaign \"" . $projectTitle . "\" has been received and will be reviewed by system administrators.";
    $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
    $stmtNotif->bind_param("iss", $userID, $notifTitle, $notifMsg);
    $stmtNotif->execute();
    $stmtNotif->close();

    // Notify the project owner about the new report
    $organizerNotifTitle = "Project Report Received";
    $organizerNotifMsg = "A donor has reported your project \"" . $projectTitle . "\".";
    $stmtOrganizerNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
    $stmtOrganizerNotif->bind_param("iss", $organizerUserID, $organizerNotifTitle, $organizerNotifMsg);
    $stmtOrganizerNotif->execute();
    $stmtOrganizerNotif->close();

    // Notify admin users about the reported project
    $adminTitle = "Project Reported";
    $adminMessage = "Project " . $projectTitle . " has been reported and requires your attention.";
    $stmtAdmins = $conn->prepare("SELECT userID FROM Users WHERE role = 'ADMIN'");
    $stmtAdmins->execute();
    $adminResult = $stmtAdmins->get_result();
    while ($adminRow = $adminResult->fetch_assoc()) {
        $adminUserID = (int)$adminRow['userID'];
        $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotif->bind_param("iss", $adminUserID, $adminTitle, $adminMessage);
        $stmtNotif->execute();
        $stmtNotif->close();
    }
    $stmtAdmins->close();

    echo json_encode([
        "success" => true,
        "message" => "Thank you. Your report has been submitted successfully and is queued for admin review.",
        "reportID" => $reportID
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to submit report: " . $stmtInsert->error
    ]);
    $stmtInsert->close();
}
?>
