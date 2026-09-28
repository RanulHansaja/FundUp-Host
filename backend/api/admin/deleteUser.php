<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
$currentAdmin = requireAuth(['ADMIN']);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['userID'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameter (userID).']);
    exit;
}

$userID = (int)$data['userID'];
$reason = trim($data['reason'] ?? '');

if (empty($reason)) {
    echo json_encode(['success' => false, 'message' => 'A valid reason is required to block a user account.']);
    exit;
}

// Safety check: Prevent admin from deleting/blocking their own account
if ($userID === $currentAdmin['userID']) {
    echo json_encode(['success' => false, 'message' => 'You cannot block your own admin account.']);
    exit;
}

$adminID = (int)($currentAdmin['userID'] ?? 1);

try {
    $conn->begin_transaction();

    // Query current status and user info before update to check status transition and get details for the email
    $userQuery = $conn->prepare("SELECT fullName, email, status FROM Users WHERE userID = ?");
    $userQuery->bind_param("i", $userID);
    $userQuery->execute();
    $userRes = $userQuery->get_result();
    $userRow = $userRes ? $userRes->fetch_assoc() : null;
    $userQuery->close();

    $oldStatus = $userRow ? $userRow['status'] : null;
    $recipientEmail = $userRow ? $userRow['email'] : null;
    $recipientName = $userRow ? $userRow['fullName'] : null;
    $shouldSendEmail = ($userRow && $oldStatus !== 'BLOCKED');

    // 1. Soft-block user by setting status = 'BLOCKED' and saving statusReason
    $stmt = $conn->prepare("UPDATE Users SET status = 'BLOCKED', statusReason = ? WHERE userID = ?");
    $stmt->bind_param("si", $reason, $userID);
    $stmt->execute();
    $stmt->close();

    // 2. If user is an organizer, suspend active projects
    $getOrgStmt = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ?");
    $getOrgStmt->bind_param("i", $userID);
    $getOrgStmt->execute();
    $orgRes = $getOrgStmt->get_result();

    if ($orgRes && $orgRes->num_rows > 0) {
        $orgRow = $orgRes->fetch_assoc();
        $organizerID = (int)$orgRow['organizerID'];

        $suspendProjStmt = $conn->prepare("UPDATE Projects SET status = 'SUSPENDED' WHERE organizerID = ? AND status != 'COMPLETED'");
        $suspendProjStmt->bind_param("i", $organizerID);
        $suspendProjStmt->execute();
        $suspendProjStmt->close();
    }
    $getOrgStmt->close();

    // 3. Record in moderation_history
    $histStmt = $conn->prepare("INSERT INTO moderation_history (targetUserID, adminID, action_type, notes) VALUES (?, ?, 'BLOCK_USER', ?)");
    $histStmt->bind_param("iis", $userID, $adminID, $reason);
    $histStmt->execute();
    $histStmt->close();

    // 4. Create user notification
    $notifTitle = "Account Blocked";
    $notifMsg = "Your account has been blocked by platform administration. Reason: " . $reason;
    $notifStmt = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
    $notifStmt->bind_param("iss", $userID, $notifTitle, $notifMsg);
    $notifStmt->execute();
    $notifStmt->close();

    $conn->commit();

    // Trigger email notification if user status transitioned to BLOCKED
    if ($shouldSendEmail) {
        try {
            require_once __DIR__ . '/../../helpers/MailHelper.php';
            $mailSent = sendUserBlockedEmail($recipientEmail, $recipientName, $reason);
            $logFile = __DIR__ . '/../../mail_debug.log';
            $logMsg = date('[Y-m-d H:i:s]') . " Block User Email: Sent block email to $recipientEmail ($recipientName). Status: " . ($mailSent ? "Success" : "Failed") . "\n";
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Block User Mail Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send user block email: " . $mailEx->getMessage());
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'User account blocked successfully. Reason recorded.'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error blocking user account: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
