<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
$currentAdmin = requireAuth(['ADMIN']);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['userID']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields (userID, status).']);
    exit;
}

$userID = (int)$data['userID'];
$rawStatus = strtoupper(trim($data['status']));
$reason = trim($data['reason'] ?? '');

// Map status to DB enum: PENDING, ACTIVE, SUSPENDED
$status = 'ACTIVE';
if ($rawStatus === 'SUSPENDED') {
    $status = 'SUSPENDED';
} else if ($rawStatus === 'PENDING') {
    $status = 'PENDING';
}

// Validation: Require reason when suspending
if ($status === 'SUSPENDED' && empty($reason)) {
    echo json_encode(['success' => false, 'message' => 'A valid reason is required to suspend a user account.']);
    exit;
}

// Safety check: Prevent admin from suspending themselves
if ($userID === $currentAdmin['userID'] && $status === 'SUSPENDED') {
    echo json_encode(['success' => false, 'message' => 'You cannot suspend your own admin account.']);
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
    $shouldSendEmail = ($status === 'SUSPENDED' && $userRow && $oldStatus !== 'SUSPENDED');
    $shouldSendReinstatedEmail = ($status === 'ACTIVE' && $userRow && $oldStatus === 'SUSPENDED');

    // 1. Update user status and statusReason in Users table
    $statusReason = ($status === 'ACTIVE') ? null : $reason;
    $stmt = $conn->prepare("UPDATE Users SET status = ?, statusReason = ? WHERE userID = ?");
    $stmt->bind_param("ssi", $status, $statusReason, $userID);
    $stmt->execute();
    $stmt->close();

    // 2. If status is SUSPENDED, suspend active projects if organizer
    if ($status === 'SUSPENDED') {
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

        // Record in moderation_history
        $histStmt = $conn->prepare("INSERT INTO moderation_history (targetUserID, adminID, action_type, notes) VALUES (?, ?, 'SUSPEND_USER', ?)");
        $histStmt->bind_param("iis", $userID, $adminID, $reason);
        $histStmt->execute();
        $histStmt->close();

        // Create user notification
        $notifTitle = "Account Suspended";
        $notifMsg = "Your account has been suspended by administration. Reason: " . $reason;
        $notifStmt = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $notifStmt->bind_param("iss", $userID, $notifTitle, $notifMsg);
        $notifStmt->execute();
        $notifStmt->close();

    } else if ($status === 'ACTIVE') {
        // Record activation in moderation_history
        $actNotes = !empty($reason) ? $reason : "Account reactivated by admin.";
        $histStmt = $conn->prepare("INSERT INTO moderation_history (targetUserID, adminID, action_type, notes) VALUES (?, ?, 'ACTIVATE_USER', ?)");
        $histStmt->bind_param("iis", $userID, $adminID, $actNotes);
        $histStmt->execute();
        $histStmt->close();

        // Create user notification
        $notifTitle = "Account Reactivated";
        $notifMsg = "Your account has been reactivated. You now have full access to platform features.";
        $notifStmt = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $notifStmt->bind_param("iss", $userID, $notifTitle, $notifMsg);
        $notifStmt->execute();
        $notifStmt->close();
    }

    $conn->commit();

    // Trigger email notification if user status transitioned to SUSPENDED
    if ($shouldSendEmail) {
        try {
            require_once __DIR__ . '/../../helpers/MailHelper.php';

            // Resolve admin email address dynamically
            $adminEmail = $currentAdmin['email'] ?? null;
            if (empty($adminEmail)) {
                $resAdmin = $conn->query("SELECT email FROM Users WHERE role = 'ADMIN' LIMIT 1");
                if ($resAdmin && $rowAdmin = $resAdmin->fetch_assoc()) {
                    $adminEmail = $rowAdmin['email'];
                }
            }
            if (empty($adminEmail)) {
                $adminEmail = 'admin@fundup.com';
            }

            $mailSent = sendUserSuspendedEmail($recipientEmail, $recipientName, $reason, $adminEmail);
            $logFile = __DIR__ . '/../../mail_debug.log';
            $logMsg = date('[Y-m-d H:i:s]') . " Suspend User Email: Sent suspension email to $recipientEmail ($recipientName). Status: " . ($mailSent ? "Success" : "Failed") . "\n";
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Suspend User Mail Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send user suspension email: " . $mailEx->getMessage());
        }
    }

    // Trigger email notification if user status transitioned to ACTIVE from SUSPENDED
    if ($shouldSendReinstatedEmail) {
        try {
            require_once __DIR__ . '/../../helpers/MailHelper.php';
            $mailSent = sendUserReinstatedEmail($recipientEmail, $recipientName);
            $logFile = __DIR__ . '/../../mail_debug.log';
            $logMsg = date('[Y-m-d H:i:s]') . " Reinstate User Email: Sent reinstatement email to $recipientEmail ($recipientName). Status: " . ($mailSent ? "Success" : "Failed") . "\n";
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Reinstate User Mail Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send user reinstatement email: " . $mailEx->getMessage());
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'User status updated successfully.'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update user status: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
