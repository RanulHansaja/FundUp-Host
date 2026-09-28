<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";
include_once __DIR__ . "/../../helpers/uploadHelper.php";
include_once __DIR__ . "/../../helpers/projectGoalNotification.php";

$sessionUser = requireAuth(['DONOR']);
$userID = $sessionUser['userID'];

// Fetch the donorID associated with the logged-in userID
$stmtDonor = $conn->prepare("SELECT d.donorID, u.fullName FROM Donors d JOIN Users u ON d.userID = u.userID WHERE d.userID = ? LIMIT 1");
$stmtDonor->bind_param("i", $userID);
$stmtDonor->execute();
$donorRes = $stmtDonor->get_result();
if ($donorRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Donor profile not found."]);
    exit();
}
$donorData = $donorRes->fetch_assoc();
$donorID = (int)$donorData['donorID'];
$donorName = trim((string)$donorData['fullName']);
$stmtDonor->close();

// Support both JSON content type (for ONLINE) and Form-Data (for BANK_SLIP or commercial uploads)
$projectID = 0;
$amount = 0.0;
$paymentMethod = '';
$recognitionRequired = false;
$orderID = '';
$companyName = '';
$websiteLink = '';

if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $data = json_decode(file_get_contents("php://input"), true);
    $projectID = isset($data['projectID']) ? (int)$data['projectID'] : 0;
    $amount = isset($data['amount']) ? (float)$data['amount'] : 0.0;
    $paymentMethod = isset($data['paymentMethod']) ? trim($data['paymentMethod']) : '';
    $recognitionRequired = isset($data['recognitionRequired']) ? (bool)$data['recognitionRequired'] : false;
    $orderID = isset($data['orderID']) ? trim($data['orderID']) : '';
    $companyName = isset($data['companyName']) ? trim($data['companyName']) : '';
    $websiteLink = isset($data['websiteLink']) ? trim($data['websiteLink']) : '';
} else {
    $projectID = isset($_POST['projectID']) ? (int)$_POST['projectID'] : 0;
    $amount = isset($_POST['amount']) ? (float)$_POST['amount'] : 0.0;
    $paymentMethod = isset($_POST['paymentMethod']) ? trim($_POST['paymentMethod']) : '';
    $recognitionRequired = isset($_POST['recognitionRequired']) ? ($_POST['recognitionRequired'] === 'true' || $_POST['recognitionRequired'] === '1') : false;
    $orderID = isset($_POST['orderID']) ? trim($_POST['orderID']) : '';
    $companyName = isset($_POST['companyName']) ? trim($_POST['companyName']) : '';
    $websiteLink = isset($_POST['websiteLink']) ? trim($_POST['websiteLink']) : '';
}

if ($amount <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid donation amount."]);
    exit();
}

if ($projectID <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid project ID."]);
    exit();
}

if (!in_array($paymentMethod, ['ONLINE', 'BANK_SLIP'])) {
    echo json_encode(["success" => false, "message" => "Invalid payment method."]);
    exit();
}

// Start Transaction
$conn->begin_transaction();

try {
    // 1. Verify project exists
    $stmtProj = $conn->prepare("SELECT p.title, p.collectedAmount, p.targetAmount, p.organizerID, p.status, p.endDate, o.userID AS organizerUserID FROM Projects p JOIN Organizers o ON p.organizerID = o.organizerID WHERE p.projectID = ? LIMIT 1");
    $stmtProj->bind_param("i", $projectID);
    $stmtProj->execute();
    $projRes = $stmtProj->get_result();
    if ($projRes->num_rows === 0) {
        throw new Exception("Project not found.");
    }
    $projectData = $projRes->fetch_assoc();
    
    if ($projectData['status'] === 'SUSPENDED') {
        throw new Exception("This project has been suspended. Donations are currently disabled.");
    }
    if ($projectData['status'] === 'REJECTED') {
        throw new Exception("This project has been rejected. Donations are currently disabled.");
    }
    if ($projectData['status'] === 'COMPLETED') {
        throw new Exception("This campaign is marked as completed. Donations are no longer accepted.");
    }
    if (!empty($projectData['endDate']) && strtotime($projectData['endDate'] . ' 23:59:59') < time()) {
        throw new Exception("This campaign reached its end date on " . $projectData['endDate'] . ". Donations are now closed.");
    }
    
    $projectTitle = $projectData['title'];
    $currentCollected = (float)$projectData['collectedAmount'];
    $targetAmount = (float)$projectData['targetAmount'];
    $organizerID = (int)$projectData['organizerID'];
    $organizerUserID = (int)$projectData['organizerUserID'];
    $stmtProj->close();

    if ($targetAmount > 0) {
        if ($currentCollected >= $targetAmount) {
            throw new Exception("This campaign has already reached its full target funding goal.");
        }
        $remainingAmount = $targetAmount - $currentCollected;
        if ($amount > $remainingAmount) {
            throw new Exception("Donation amount (Rs. " . number_format($amount, 2) . ") exceeds the remaining target goal. Maximum contribution allowed is Rs. " . number_format($remainingAmount, 2) . ".");
        }
    }

    // 2. Define initial donation status
    $donationStatus = ($paymentMethod === 'ONLINE') ? 'APPROVED' : 'PENDING';
    $recReqVal = $recognitionRequired ? 1 : 0;

    // 3. Insert Donation
    $stmtInsert = $conn->prepare("INSERT INTO Donations (donorID, projectID, amount, paymentMethod, recognitionRequired, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmtInsert->bind_param("iidsis", $donorID, $projectID, $amount, $paymentMethod, $recReqVal, $donationStatus);
    if (!$stmtInsert->execute()) {
        throw new Exception("Failed to create donation record: " . $stmtInsert->error);
    }
    $donationID = $conn->insert_id;
    $stmtInsert->close();

    // 4. Handle Specific Payment Methods
    if ($paymentMethod === 'ONLINE') {
        if (empty($orderID)) {
            throw new Exception("Transaction ID (OrderID) is required for online payments.");
        }

        // Insert into Payments table
        $stmtPay = $conn->prepare("INSERT INTO Payments (donationID, transactionID, paymentGateway, paymentStatus) VALUES (?, ?, 'PAYHERE', 'APPROVED')");
        $stmtPay->bind_param("is", $donationID, $orderID);
        if (!$stmtPay->execute()) {
            throw new Exception("Failed to log payment transaction.");
        }
        $stmtPay->close();

        // Notify only the organizer who owns this project after the payment is recorded as approved.
        $organizerNotifTitle = "Online Payment Received - " . $orderID;
        $organizerNotifMessage = !empty($donorName)
            ? "Online payment received: " . $donorName . " has donated Rs. " . number_format($amount, 2) . " to your project '" . $projectTitle . "'."
            : "You have received an online payment of Rs. " . number_format($amount, 2) . " for your project '" . $projectTitle . "'.";
        $stmtExistingNotif = $conn->prepare("SELECT notificationID FROM Notifications WHERE userID = ? AND title = ? LIMIT 1");
        $stmtExistingNotif->bind_param("is", $organizerUserID, $organizerNotifTitle);
        $stmtExistingNotif->execute();
        $existingNotifRes = $stmtExistingNotif->get_result();
        $stmtExistingNotif->close();

        if ($existingNotifRes->num_rows === 0) {
            $stmtOrganizerNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
            $stmtOrganizerNotif->bind_param("iss", $organizerUserID, $organizerNotifTitle, $organizerNotifMessage);
            if (!$stmtOrganizerNotif->execute()) {
                throw new Exception("Failed to create organizer payment notification.");
            }
            $stmtOrganizerNotif->close();
        }

        // Increment Project's collectedAmount & auto-complete if target reached
        $newCollected = $currentCollected + $amount;
        if ($targetAmount > 0 && $newCollected >= $targetAmount) {
            $stmtUpdateProj = $conn->prepare("UPDATE Projects SET collectedAmount = ?, status = 'COMPLETED' WHERE projectID = ?");
            $stmtUpdateProj->bind_param("di", $newCollected, $projectID);
        } else {
            $stmtUpdateProj = $conn->prepare("UPDATE Projects SET collectedAmount = ? WHERE projectID = ?");
            $stmtUpdateProj->bind_param("di", $newCollected, $projectID);
        }
        if (!$stmtUpdateProj->execute()) {
            throw new Exception("Failed to update project collection.");
        }
        $stmtUpdateProj->close();

        if ($targetAmount > 0 && $newCollected >= $targetAmount) {
            notifyProjectGoalReached($conn, $organizerUserID, $projectTitle, $targetAmount);
        }

        // Update Donor totalDonation & badgeLevel
        // Calculate dynamic total
        $stmtSum = $conn->prepare("SELECT SUM(amount) as total FROM Donations WHERE donorID = ? AND status = 'APPROVED'");
        $stmtSum->bind_param("i", $donorID);
        $stmtSum->execute();
        $sumRes = $stmtSum->get_result()->fetch_assoc();
        $totalApprovedAmount = (float)($sumRes['total'] ?? 0.0);
        $stmtSum->close();

        // Compute badge level
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
        if (!$stmtUpdateDonor->execute()) {
            throw new Exception("Failed to update donor badge details.");
        }
        $stmtUpdateDonor->close();

        // Add Recognition entry if requested
        if ($recognitionRequired) {
            $stmtRec = $conn->prepare("INSERT INTO Recognitions (donationID, badgeAwarded, socialMediaPromotion, bannerPromotion, description, approvalStatus) VALUES (?, ?, 0, 0, 'Supported Online Campaign', 'APPROVED')");
            $stmtRec->bind_param("is", $donationID, $badge);
            $stmtRec->execute();
            $stmtRec->close();
        }

        // Add user notification
        $notifTitle = "Donation Successful";
        $notifMessage = "Thank you! Your donation of Rs. " . number_format($amount, 2) . " for \"" . $projectTitle . "\" was received successfully.";
        $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotif->bind_param("iss", $userID, $notifTitle, $notifMessage);
        $stmtNotif->execute();
        $stmtNotif->close();

    } else {
        // BANK_SLIP
        if (empty($_FILES['slipImage']) || $_FILES['slipImage']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Bank slip receipt image is required.");
        }

        // Validate receipt image
        $slipExt = validateUploadedFile($_FILES['slipImage'], ['jpg', 'jpeg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp']);
        if ($slipExt === false) {
            throw new Exception("Receipt slip must be a valid JPG, PNG, or WEBP image (max 10MB).");
        }

        // Establish target folder path
        $targetDir = __DIR__ . '/../../uploads/slips';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $safeName = generateSafeFileName($_FILES['slipImage']['name'], $slipExt);
        $destinationPath = $targetDir . '/' . $safeName;
        if (!move_uploaded_file($_FILES['slipImage']['tmp_name'], $destinationPath)) {
            throw new Exception("Failed to save uploaded slip receipt.");
        }

        $dbRelativePath = 'uploads/slips/' . $safeName;

            // Insert into PaymentSlips table
        $stmtSlip = $conn->prepare("INSERT INTO PaymentSlips (donationID, imagePath, verificationStatus) VALUES (?, ?, 'PENDING')");
        $stmtSlip->bind_param("is", $donationID, $dbRelativePath);
        if (!$stmtSlip->execute()) {
            throw new Exception("Failed to record transaction slip metadata.");
        }
        $stmtSlip->close();

        // Notify the project owner / organizer about the pending bank slip
        $stmtOrgUser = $conn->prepare("SELECT u.userID FROM Organizers o JOIN Users u ON o.userID = u.userID WHERE o.organizerID = ? LIMIT 1");
        $stmtOrgUser->bind_param("i", $organizerID);
        $stmtOrgUser->execute();
        $orgUserRes = $stmtOrgUser->get_result();
        if ($orgUserRes->num_rows > 0) {
            $organizerUserID = (int)$orgUserRes->fetch_assoc()['userID'];
            $stmtOrgUser->close();

            $notifTitle = "New payment slip received";
            $donorFullName = !empty($sessionUser['fullName']) ? $sessionUser['fullName'] : 'A donor';
            $notifMessage = "New payment slip received from " . $donorFullName . " for project \"" . $projectTitle . "\". Please review the payment.";

            $stmtNotifOrg = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
            $stmtNotifOrg->bind_param("iss", $organizerUserID, $notifTitle, $notifMessage);
            $stmtNotifOrg->execute();
            $stmtNotifOrg->close();
        } else {
            $stmtOrgUser->close();
        }

        // Add Recognition entry if requested (Approval will happen later when slip is verified)
        if ($recognitionRequired) {
            $stmtRec = $conn->prepare("INSERT INTO Recognitions (donationID, badgeAwarded, socialMediaPromotion, bannerPromotion, description, approvalStatus) VALUES (?, 'NONE', 0, 0, 'Supported via Bank Slip', 'PENDING')");
            $stmtRec->bind_param("i", $donationID);
            $stmtRec->execute();
            $stmtRec->close();
        }

        // Add user notification
        $notifTitle = "Bank Slip Uploaded";
        $notifMessage = "Your transfer slip for Rs. " . number_format($amount, 2) . " on \"" . $projectTitle . "\" has been uploaded and is pending organizer verification.";
        $stmtNotif = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotif->bind_param("iss", $userID, $notifTitle, $notifMessage);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    // 5. Handle Commercialization Data (for donations >= 50,000 LKR)
    if ($amount >= 50000 && !empty($companyName)) {
        $adMediaRelPath = '';
        $mediaType = 'IMAGE';

        if (!empty($_FILES['adMedia']) && $_FILES['adMedia']['error'] === UPLOAD_ERR_OK) {
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'];
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
            
            $adExt = validateUploadedFile($_FILES['adMedia'], $allowedExts, $allowedMimes);
            if ($adExt === false) {
                throw new Exception("Commercial ad media must be a valid image (JPG, PNG, WEBP) or video (MP4, WEBM).");
            }

            $targetDir = __DIR__ . '/../../uploads/commercials';
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0777, true);
            }

            $safeName = generateSafeFileName($_FILES['adMedia']['name'], $adExt);
            $destinationPath = $targetDir . '/' . $safeName;
            if (!move_uploaded_file($_FILES['adMedia']['tmp_name'], $destinationPath)) {
                throw new Exception("Failed to save commercial ad media file.");
            }

            $adMediaRelPath = 'uploads/commercials/' . $safeName;
            $mediaType = in_array(strtolower($adExt), ['mp4', 'webm']) ? 'VIDEO' : 'IMAGE';
        }

        if (!empty($adMediaRelPath)) {
            $commStatus = ($paymentMethod === 'ONLINE') ? 'APPROVED' : 'PENDING';
            $stmtComm = $conn->prepare("INSERT INTO Commercializations (donationID, companyName, websiteLink, mediaPath, mediaType, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtComm->bind_param("isssss", $donationID, $companyName, $websiteLink, $adMediaRelPath, $mediaType, $commStatus);
            if (!$stmtComm->execute()) {
                throw new Exception("Failed to save commercialization ad details.");
            }
            $stmtComm->close();
        }
    }

    $conn->commit();
    echo json_encode([
        "success" => true,
        "message" => ($paymentMethod === 'ONLINE') ? "Donation completed successfully." : "Receipt uploaded successfully. Pending verification.",
        "data" => [
            "donationID" => $donationID,
            "status" => $donationStatus,
            "amount" => $amount
        ]
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
