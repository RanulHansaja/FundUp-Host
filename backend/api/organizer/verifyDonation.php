<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";
include_once __DIR__ . "/../../helpers/projectGoalNotification.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

// Fetch the organizerID associated with the logged-in userID
$stmtOrganizer = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmtOrganizer->bind_param("i", $userID);
$stmtOrganizer->execute();
$orgRes = $stmtOrganizer->get_result();
if ($orgRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Organizer profile not found."]);
    exit();
}
$organizerID = (int)$orgRes->fetch_assoc()['organizerID'];
$stmtOrganizer->close();

$data = json_decode(file_get_contents("php://input"), true);
$donationID = isset($data['donationID']) ? (int)$data['donationID'] : 0;
$action = isset($data['action']) ? strtoupper(trim($data['action'])) : '';

if ($donationID <= 0 || !in_array($action, ['APPROVE', 'REJECT'])) {
    echo json_encode(["success" => false, "message" => "Invalid parameters. Required: donationID & action (APPROVE/REJECT)."]);
    exit();
}

// Check if the donation exists and belongs to the organizer's project
$queryCheck = "
    SELECT d.amount, d.donorID, d.projectID, d.paymentMethod, d.status AS donationStatus,
           p.title AS projectTitle, p.collectedAmount, p.targetAmount, p.organizerID, dn.userID AS donorUserID
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Donors dn ON d.donorID = dn.donorID
    WHERE d.donationID = ? LIMIT 1
";

$stmtCheck = $conn->prepare($queryCheck);
$stmtCheck->bind_param("i", $donationID);
$stmtCheck->execute();
$checkRes = $stmtCheck->get_result();

if ($checkRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Donation record not found."]);
    $stmtCheck->close();
    exit();
}

$donationInfo = $checkRes->fetch_assoc();
$stmtCheck->close();

if ((int)$donationInfo['organizerID'] !== $organizerID) {
    echo json_encode(["success" => false, "message" => "Access denied. You do not manage the campaign associated with this donation."]);
    exit();
}

if ($donationInfo['donationStatus'] !== 'PENDING') {
    echo json_encode(["success" => false, "message" => "This donation has already been processed (current status: " . $donationInfo['donationStatus'] . ")."]);
    exit();
}

// Begin transaction
$conn->begin_transaction();

try {
    $amount = (float)$donationInfo['amount'];
    $donorID = (int)$donationInfo['donorID'];
    $donorUserID = (int)$donationInfo['donorUserID'];
    $projectID = (int)$donationInfo['projectID'];
    $projectTitle = $donationInfo['projectTitle'];
    $donorEmail = null;
    $donorName = null;

    if ($action === 'APPROVE') {
        // 1. Update PaymentSlips status
        $stmtSlip = $conn->prepare("UPDATE PaymentSlips SET verificationStatus = 'APPROVED', verifiedByOrganizerID = ?, verifiedDate = NOW() WHERE donationID = ?");
        $stmtSlip->bind_param("ii", $organizerID, $donationID);
        $stmtSlip->execute();
        $stmtSlip->close();

        // 2. Update Donation status
        $stmtDonation = $conn->prepare("UPDATE Donations SET status = 'APPROVED' WHERE donationID = ?");
        $stmtDonation->bind_param("i", $donationID);
        $stmtDonation->execute();
        $stmtDonation->close();

        // 3. Increment Projects collectedAmount & auto-complete if target reached
        $newCollected = (float)$donationInfo['collectedAmount'] + $amount;
        $targetAmount = (float)$donationInfo['targetAmount'];
        
        if ($targetAmount > 0 && $newCollected >= $targetAmount) {
            $stmtUpdateProj = $conn->prepare("UPDATE Projects SET collectedAmount = ?, status = 'COMPLETED' WHERE projectID = ?");
            $stmtUpdateProj->bind_param("di", $newCollected, $projectID);
        } else {
            $stmtUpdateProj = $conn->prepare("UPDATE Projects SET collectedAmount = ? WHERE projectID = ?");
            $stmtUpdateProj->bind_param("di", $newCollected, $projectID);
        }
        $stmtUpdateProj->execute();
        $stmtUpdateProj->close();

        if ($targetAmount > 0 && $newCollected >= $targetAmount) {
            $organizerUserID = $userID;
            notifyProjectGoalReached($conn, $organizerUserID, $projectTitle, $targetAmount);
        }

        // 4. Update Donor totalDonation & badgeLevel
        $stmtSum = $conn->prepare("SELECT SUM(amount) as total FROM Donations WHERE donorID = ? AND status = 'APPROVED'");
        $stmtSum->bind_param("i", $donorID);
        $stmtSum->execute();
        $sumRes = $stmtSum->get_result()->fetch_assoc();
        $totalApprovedAmount = (float)($sumRes['total'] ?? 0.0);
        $stmtSum->close();

        $badge = 'NONE';
        if ($totalApprovedAmount >= 500000) {
            $badge = 'PLATINUM';
        } elseif ($totalApprovedAmount >= 100000) {
            $badge = 'GOLD';
        } elseif ($totalApprovedAmount >= 50000) {
            $badge = 'SILVER';
        } elseif ($totalApprovedAmount >= 25000) {
            $badge = 'BRONZE';
        }

        $stmtUpdateDonor = $conn->prepare("UPDATE Donors SET totalDonation = ?, badgeLevel = ? WHERE donorID = ?");
        $stmtUpdateDonor->bind_param("dsi", $totalApprovedAmount, $badge, $donorID);
        $stmtUpdateDonor->execute();
        $stmtUpdateDonor->close();

        // 5. Update Recognitions (if any)
        $stmtUpdateRec = $conn->prepare("UPDATE Recognitions SET badgeAwarded = ?, approvalStatus = 'APPROVED' WHERE donationID = ?");
        $stmtUpdateRec->bind_param("si", $badge, $donationID);
        $stmtUpdateRec->execute();
        $stmtUpdateRec->close();

        // 6. Update Commercializations (if any)
        $stmtUpdateComm = $conn->prepare("UPDATE Commercializations SET approvalStatus = 'APPROVED' WHERE donationID = ?");
        $stmtUpdateComm->bind_param("i", $donationID);
        $stmtUpdateComm->execute();
        $stmtUpdateComm->close();

        // 7. Send notification to donor
        $notifTitle = "Payment Slip Approved";
        $notifMessage = "Your payment slip for \"" . $projectTitle . "\" has been approved successfully. Thank you for supporting this project.";
        $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotif->bind_param("iss", $donorUserID, $notifTitle, $notifMessage);
        $stmtNotif->execute();
        $stmtNotif->close();

    } else {
        // REJECT
        // 1. Update PaymentSlips status
        $stmtSlip = $conn->prepare("UPDATE PaymentSlips SET verificationStatus = 'REJECTED', verifiedByOrganizerID = ?, verifiedDate = NOW() WHERE donationID = ?");
        $stmtSlip->bind_param("ii", $organizerID, $donationID);
        $stmtSlip->execute();
        $stmtSlip->close();

        // 2. Update Donation status
        $stmtDonation = $conn->prepare("UPDATE Donations SET status = 'FAILED' WHERE donationID = ?");
        $stmtDonation->bind_param("i", $donationID);
        $stmtDonation->execute();
        $stmtDonation->close();

        // 3. Update Recognitions (if any)
        $stmtUpdateRec = $conn->prepare("UPDATE Recognitions SET approvalStatus = 'REJECTED' WHERE donationID = ?");
        $stmtUpdateRec->bind_param("i", $donationID);
        $stmtUpdateRec->execute();
        $stmtUpdateRec->close();

        // 4. Update Commercializations (if any)
        $stmtUpdateComm = $conn->prepare("UPDATE Commercializations SET approvalStatus = 'REJECTED' WHERE donationID = ?");
        $stmtUpdateComm->bind_param("i", $donationID);
        $stmtUpdateComm->execute();
        $stmtUpdateComm->close();

        // 5. Send notification to donor
        $notifTitle = "Payment Slip Rejected";
        $notifMessage = "Your payment slip for \"" . $projectTitle . "\" was rejected. Please submit a valid payment slip to continue your donation.";
        $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotif->bind_param("iss", $donorUserID, $notifTitle, $notifMessage);
        $stmtNotif->execute();
        $stmtNotif->close();

        // Fetch donor details for email notification
        $stmtUser = $conn->prepare("SELECT fullName, email FROM Users WHERE userID = ? LIMIT 1");
        if ($stmtUser) {
            $stmtUser->bind_param("i", $donorUserID);
            $stmtUser->execute();
            $userRes = $stmtUser->get_result();
            if ($userRes && $userRow = $userRes->fetch_assoc()) {
                $donorEmail = $userRow['email'];
                $donorName = $userRow['fullName'];
            }
            $stmtUser->close();
        }
    }

    $conn->commit();

    // Trigger email notification if action was REJECT
    if ($action === 'REJECT' && !empty($donorEmail)) {
        try {
            require_once __DIR__ . '/../../helpers/MailHelper.php';
            $mailSent = sendPaymentSlipRejectedEmail($donorEmail, $donorName, $projectTitle, null);
            $logFile = __DIR__ . '/../../mail_debug.log';
            $logMsg = date('[Y-m-d H:i:s]') . " Reject Slip Email: Sent rejection email to $donorEmail ($donorName) for project \"$projectTitle\". Status: " . ($mailSent ? "Success" : "Failed") . "\n";
            file_put_contents($logFile, $logMsg, FILE_APPEND);
        } catch (Exception $mailEx) {
            $logFile = __DIR__ . '/../../mail_debug.log';
            $errorMsg = date('[Y-m-d H:i:s]') . " Reject Slip Mail Error: " . $mailEx->getMessage() . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            error_log("Failed to send payment slip rejection email: " . $mailEx->getMessage());
        }
    }

    echo json_encode(["success" => true, "message" => "Donation manual transfer slip has been successfully " . strtolower($action) . "ed."]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
