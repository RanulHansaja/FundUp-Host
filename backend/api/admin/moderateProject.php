<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']);

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$projectId = $data['projectID'] ?? null;
$action = $data['action'] ?? null;
$reason = $data['reason'] ?? null;
$adminID = $_SESSION['userID'] ?? 1;

if (!$projectId || !$action) {
    echo json_encode(['success' => false, 'message' => 'Project ID and Action are required.']);
    exit;
}

try {
    $conn->begin_transaction();

    if ($action === 'REJECT') {
        // Change project status to REJECTED
        $stmt = $conn->prepare("UPDATE Projects SET status = 'REJECTED' WHERE projectID = ?");
        $stmt->bind_param("i", $projectId);
        $stmt->execute();
        
        // Resolve all reports for this project
        $note = "Resolved - Project Rejected" . ($reason ? " (Reason: $reason)" : "");
        $stmt2 = $conn->prepare("UPDATE Reports SET status = 'RESOLVED', adminNotes = CONCAT(IFNULL(adminNotes, ''), '\n', ?) WHERE projectID = ? AND status = 'PENDING'");
        $stmt2->bind_param("si", $note, $projectId);
        $stmt2->execute();

        // Record in moderation_history
        $stmt3 = $conn->prepare("INSERT INTO moderation_history (projectID, adminID, action_type, notes) VALUES (?, ?, 'REJECT_PROJECT', ?)");
        $stmt3->bind_param("iis", $projectId, $adminID, $reason);
        $stmt3->execute();

    } else if ($action === 'SUSPEND') {
        // Change project status to SUSPENDED
        $stmt = $conn->prepare("UPDATE Projects SET status = 'SUSPENDED' WHERE projectID = ?");
        $stmt->bind_param("i", $projectId);
        $stmt->execute();

        // Resolve all reports for this project
        $note = "Resolved - Project Suspended" . ($reason ? " (Reason: $reason)" : "");
        $stmt2 = $conn->prepare("UPDATE Reports SET status = 'RESOLVED', adminNotes = CONCAT(IFNULL(adminNotes, ''), '\n', ?) WHERE projectID = ? AND status = 'PENDING'");
        $stmt2->bind_param("si", $note, $projectId);
        $stmt2->execute();

        // Record in moderation_history
        $stmt3 = $conn->prepare("INSERT INTO moderation_history (projectID, adminID, action_type, notes) VALUES (?, ?, 'SUSPEND_PROJECT', ?)");
        $stmt3->bind_param("iis", $projectId, $adminID, $reason);
        $stmt3->execute();
    } else if ($action === 'ACTIVE') {
        // Change project status to ACTIVE
        $stmt = $conn->prepare("UPDATE Projects SET status = 'ACTIVE' WHERE projectID = ?");
        $stmt->bind_param("i", $projectId);
        $stmt->execute();

        // Resolve all reports for this project if any
        $note = "Resolved - Project Activated";
        $stmt2 = $conn->prepare("UPDATE Reports SET status = 'RESOLVED', adminNotes = CONCAT(IFNULL(adminNotes, ''), '\n', ?) WHERE projectID = ? AND status = 'PENDING'");
        $stmt2->bind_param("si", $note, $projectId);
        $stmt2->execute();

        // Record in moderation_history
        $stmt3 = $conn->prepare("INSERT INTO moderation_history (projectID, adminID, action_type, notes) VALUES (?, ?, 'ACTIVATE_PROJECT', 'Project activated by admin')");
        $stmt3->bind_param("ii", $projectId, $adminID);
        $stmt3->execute();
    } else {
        throw new Exception("Invalid action.");
    }

    $conn->commit();

    // Trigger email notifications for SUSPEND and REJECT actions
    if ($action === 'SUSPEND' || $action === 'REJECT') {
        try {
            require_once __DIR__ . '/../../helpers/MailHelper.php';

            // 1. Retrieve Organizer name, email, and project title
            $orgQuery = "
                SELECT u.email, u.fullName, p.title 
                FROM Projects p
                JOIN Organizers o ON p.organizerID = o.organizerID
                JOIN Users u ON o.userID = u.userID
                WHERE p.projectID = ?
            ";
            $stmtOrg = $conn->prepare($orgQuery);
            $stmtOrg->bind_param("i", $projectId);
            $stmtOrg->execute();
            $resOrg = $stmtOrg->get_result();
            
            $logFile = __DIR__ . '/../../mail_debug.log';
            $logMsg = date('[Y-m-d H:i:s]') . " ProjectID: $projectId, Action: $action, Reason: $reason\n";

            if ($resOrg && $rowOrg = $resOrg->fetch_assoc()) {
                $recipientEmail = $rowOrg['email'];
                $recipientName = $rowOrg['fullName'];
                $projectName = $rowOrg['title'];

                $logMsg .= "Organizer found: $recipientEmail ($recipientName), Project: $projectName\n";

                // 2. Retrieve Admin Email (try currently logged in admin, fallback to first active admin)
                $adminEmail = null;
                if (!empty($adminID)) {
                    $stmtAdmin = $conn->prepare("SELECT email FROM Users WHERE userID = ? AND role = 'ADMIN'");
                    $stmtAdmin->bind_param("i", $adminID);
                    $stmtAdmin->execute();
                    $resAdmin = $stmtAdmin->get_result();
                    if ($resAdmin && $rowAdmin = $resAdmin->fetch_assoc()) {
                        $adminEmail = $rowAdmin['email'];
                    }
                    $stmtAdmin->close();
                }
                if (!$adminEmail) {
                    $resAdmin = $conn->query("SELECT email FROM Users WHERE role = 'ADMIN' LIMIT 1");
                    if ($resAdmin && $rowAdmin = $resAdmin->fetch_assoc()) {
                        $adminEmail = $rowAdmin['email'];
                    }
                }
                if (!$adminEmail) {
                    $adminEmail = 'admin@fundup.com'; // Fallback default
                }
                
                $logMsg .= "Admin Email resolved: $adminEmail\n";

                // 3. Retrieve actual adminNotes from the resolved report
                $adminNotes = '';
                $stmtReport = $conn->prepare("SELECT adminNotes FROM Reports WHERE projectID = ? AND status = 'RESOLVED' ORDER BY reportDate DESC LIMIT 1");
                $stmtReport->bind_param("i", $projectId);
                $stmtReport->execute();
                $resReport = $stmtReport->get_result();
                if ($resReport && $rowReport = $resReport->fetch_assoc()) {
                    $adminNotes = $rowReport['adminNotes'];
                }
                $stmtReport->close();

                // If adminNotes is empty, fallback to a sensible text containing the admin's reason
                if (empty($adminNotes)) {
                    $adminNotes = "Resolved - Project " . ($action === 'REJECT' ? 'Rejected' : 'Suspended') . ($reason ? " (Reason: $reason)" : "");
                }

                $logMsg .= "Admin Notes retrieved: " . str_replace("\n", " ", $adminNotes) . "\n";

                // 4. Send email
                if ($action === 'SUSPEND') {
                    $mailSent = sendProjectSuspendedEmail($recipientEmail, $recipientName, $projectName, $adminNotes, $adminEmail);
                    $logMsg .= "Suspension email sent status: " . ($mailSent ? "Success" : "Failed") . "\n";
                } else {
                    $mailSent = sendProjectRejectedEmail($recipientEmail, $recipientName, $projectName, $adminNotes, $adminEmail);
                    $logMsg .= "Permanent rejection email sent status: " . ($mailSent ? "Success" : "Failed") . "\n";
                }
            } else {
                $logMsg .= "Organizer not found for ProjectID: $projectId\n";
            }
            $stmtOrg->close();
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Mail/Trigger Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send project moderation email: " . $mailEx->getMessage());
        }
    }

    echo json_encode(['success' => true, 'message' => 'Project successfully moderated.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>
