<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
$currentAdmin = requireAuth(['ADMIN']);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['organizerUserID']) || !isset($data['reason'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

$organizerUserID = intval($data['organizerUserID']);
$reason = $conn->real_escape_string($data['reason']);
$adminID = $_SESSION['userID'] ?? 1;

try {
    $conn->begin_transaction();

    // Get user details first to check status transition and get details for the email
    $userQuery = $conn->prepare("SELECT fullName, email, status FROM Users WHERE userID = ?");
    $userQuery->bind_param("i", $organizerUserID);
    $userQuery->execute();
    $userRes = $userQuery->get_result();
    $userRow = $userRes ? $userRes->fetch_assoc() : null;
    $userQuery->close();

    $oldStatus = $userRow ? $userRow['status'] : null;
    $recipientEmail = $userRow ? $userRow['email'] : null;
    $recipientName = $userRow ? $userRow['fullName'] : null;
    $shouldSendEmail = ($userRow && $oldStatus !== 'SUSPENDED');

    // 1. Suspend the user account and save statusReason
    $suspend_user = "UPDATE Users SET status = 'SUSPENDED', statusReason = ? WHERE userID = ?";
    $stmt1 = $conn->prepare($suspend_user);
    $stmt1->bind_param("si", $reason, $organizerUserID);
    $stmt1->execute();
    $stmt1->close();

    // 2. Get organizerID from userID
    $get_org = "SELECT organizerID FROM Organizers WHERE userID = ?";
    $stmt_org = $conn->prepare($get_org);
    $stmt_org->bind_param("i", $organizerUserID);
    $stmt_org->execute();
    $orgResult = $stmt_org->get_result();
    
    if ($orgResult->num_rows > 0) {
        $orgRow = $orgResult->fetch_assoc();
        $organizerID = $orgRow['organizerID'];

        // 3. Suspend all active projects owned by this organizer
        $suspend_projects = "UPDATE Projects SET status = 'SUSPENDED' WHERE organizerID = ? AND status != 'COMPLETED'";
        $stmt2 = $conn->prepare($suspend_projects);
        $stmt2->bind_param("i", $organizerID);
        $stmt2->execute();
        $stmt2->close();
    }
    $stmt_org->close();

    // 4. Record action in moderation history
    $insert_history = "INSERT INTO moderation_history (targetUserID, adminID, action_type, notes) VALUES (?, ?, 'SUSPEND_ORGANIZER', ?)";
    $stmt3 = $conn->prepare($insert_history);
    $stmt3->bind_param("iis", $organizerUserID, $adminID, $reason);
    $stmt3->execute();
    $stmt3->close();

    $conn->commit();

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
            $logMsg = date('[Y-m-d H:i:s]') . " Suspend Organizer Email: Sent suspension email to $recipientEmail ($recipientName). Status: " . ($mailSent ? "Success" : "Failed") . "\n";
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Suspend Organizer Mail Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send user suspension email from suspendOrganizer: " . $mailEx->getMessage());
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Organizer and their active projects have been suspended.'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
