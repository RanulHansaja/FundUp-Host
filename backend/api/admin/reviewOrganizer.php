<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
requireAuth(['ADMIN']);

$body = json_decode(file_get_contents('php://input'), true);
$verificationID = intval($body['verificationID'] ?? 0);
$action = $body['action'] ?? ''; // 'APPROVED' or 'REJECTED'
$remarks = $body['remarks'] ?? '';

if (!$verificationID || !in_array($action, ['APPROVED', 'REJECTED'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit();
}

$conn->begin_transaction();
try {
    // Update OrganizerVerifications
    $stmt1 = $conn->prepare("UPDATE OrganizerVerifications SET approvalStatus = ?, remarks = ?, reviewDate = NOW() WHERE verificationID = ?");
    $stmt1->bind_param("ssi", $action, $remarks, $verificationID);
    $stmt1->execute();

    // Update Organizers.verificationStatus
    $newStatus = ($action === 'APPROVED') ? 'VERIFIED' : 'REJECTED';
    $stmt2 = $conn->prepare("UPDATE Organizers o JOIN OrganizerVerifications ov ON o.organizerID = ov.organizerID SET o.verificationStatus = ?, o.verifiedDate = NOW() WHERE ov.verificationID = ?");
    $stmt2->bind_param("si", $newStatus, $verificationID);
    $stmt2->execute();

    if ($action === 'APPROVED') {
        $stmt3 = $conn->prepare("UPDATE Users u JOIN Organizers o ON o.userID = u.userID JOIN OrganizerVerifications ov ON ov.organizerID = o.organizerID SET u.status = 'ACTIVE' WHERE ov.verificationID = ?");
        $stmt3->bind_param("i", $verificationID);
        $stmt3->execute();
        $stmt3->close();
    }

    $conn->commit();

    // Send email notification (failsafe)
    try {
        $userQuery = "SELECT u.email, u.fullName FROM OrganizerVerifications ov 
                      JOIN Organizers o ON ov.organizerID = o.organizerID 
                      JOIN Users u ON o.userID = u.userID 
                      WHERE ov.verificationID = ?";
        $stmt = $conn->prepare($userQuery);
        $stmt->bind_param("i", $verificationID);
        $stmt->execute();
        $res = $stmt->get_result();
        
        $logFile = __DIR__ . '/../../mail_debug.log';
        $logMsg = date('[Y-m-d H:i:s]') . " VerificationID: $verificationID, Action: $action, Remarks: $remarks\n";
        
        if ($res && $row = $res->fetch_assoc()) {
            $recipientEmail = $row['email'];
            $recipientName = $row['fullName'];
            
            $logMsg .= "Recipient found: $recipientEmail ($recipientName)\n";
            
            require_once __DIR__ . '/../../helpers/MailHelper.php';
            if ($action === 'APPROVED') {
                $mailSent = sendOrganizerApprovedEmail($recipientEmail, $recipientName);
                $logMsg .= "Approval email sent status: " . ($mailSent ? "Success" : "Failed") . "\n";
            } else if ($action === 'REJECTED') {
                $mailSent = sendOrganizerRejectedEmail($recipientEmail, $recipientName, $remarks);
                $logMsg .= "Rejection email sent status: " . ($mailSent ? "Success" : "Failed") . "\n";
            }
        } else {
            $logMsg .= "Recipient not found in database for VerificationID: $verificationID\n";
        }
        $stmt->close();
        file_put_contents($logFile, $logMsg, FILE_APPEND);
    } catch (Exception $mailEx) {
        $logFile = __DIR__ . '/../../mail_debug.log';
        $errorMsg = date('[Y-m-d H:i:s]') . " Mail Error: " . $mailEx->getMessage() . "\n";
        file_put_contents($logFile, $errorMsg, FILE_APPEND);
        error_log("Failed to send organizer verification email: " . $mailEx->getMessage());
    }

    echo json_encode(['success' => true, 'message' => "Organizer $action successfully"]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
$conn->close();
?>