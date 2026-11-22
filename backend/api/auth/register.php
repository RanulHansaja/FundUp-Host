<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include __DIR__ . "/../../helpers/validateEmailDomain.php";
include_once __DIR__ . "/../../helpers/uploadHelper.php";

// Parse inputs
$fullName = "";
$email = "";
$password = "";
$confirmPassword = "";
$role = "DONOR";
$phone = "";

$clubName = "";
$universityId = "";

$isMultipart = false;

// Check if request is multipart/form-data
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";
if (strpos($contentType, "multipart/form-data") !== false) {
    $isMultipart = true;
    $fullName = $_POST["representativeName"] ?? ($_POST["fullName"] ?? "");
    $email = $_POST["email"] ?? "";
    $password = $_POST["password"] ?? "";
    $confirmPassword = $_POST["confirmPassword"] ?? "";
    $role = $_POST["role"] ?? "ORGANIZER";
    $phone = $_POST["phone"] ?? "";
    
    $clubName = $_POST["clubName"] ?? "";
    $universityId = $_POST["universityId"] ?? "";
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data !== null) {
        $fullName = $data["fullName"] ?? "";
        $email = $data["email"] ?? "";
        $password = $data["password"] ?? "";
        $confirmPassword = $data["confirmPassword"] ?? "";
        $role = $data["role"] ?? "DONOR";
        $phone = $data["phone"] ?? "";
    }
}

$phone = preg_replace('/[^0-9]/', '', $phone);

// Basic validation
if (empty($fullName) || empty($email) || empty($password) || empty($confirmPassword) || empty($phone)) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required"
    ]);
    exit();
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid phone number"
    ]);
    exit();
}

if(!filter_var($fullName, FILTER_VALIDATE_REGEXP, ["options" => ["regexp" => "/^[a-zA-Z\s]+$/"]])) {
    echo json_encode([
        "success" => false,
        "message" => "Full Name can only contain letters and spaces"
    ]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format"
    ]);
    exit();
}

if ($password != $confirmPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Passwords do not match"
    ]);
    exit();
}

if (strlen($password) < 8) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters long"
    ]);
    exit();
}

// File storage Setup for Organizers
$approvalLetterPath = "";
$studentIdPath = "";

if ($role === "ORGANIZER") {
    if (empty($clubName) || empty($universityId)) {
        echo json_encode([
            "success" => false,
            "message" => "Club Name and University selection are required"
        ]);
        exit();
    }

    if (!isset($_FILES["approvalLetter"]) || $_FILES["approvalLetter"]["error"] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "success" => false,
            "message" => "Valid University Approval Letter is required"
        ]);
        exit();
    }

    if (!isset($_FILES["studentIdImage"]) || $_FILES["studentIdImage"]["error"] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "success" => false,
            "message" => "Valid Club Head Student ID is required"
        ]);
        exit();
    }

    $approvalDir = "../../uploads/approval_letters/";
    $studentIdDir = "../../uploads/student_ids/";

    if (!is_dir($approvalDir)) {
        mkdir($approvalDir, 0777, true);
    }
    if (!is_dir($studentIdDir)) {
        mkdir($studentIdDir, 0777, true);
    }

    // Validate approval letter (Image or PDF)
    $approvalExt = validateUploadedFile(
        $_FILES["approvalLetter"],
        ['jpg', 'jpeg', 'png', 'pdf'],
        ['image/jpeg', 'image/png', 'application/pdf']
    );
    if ($approvalExt === false) {
        echo json_encode([
            "success" => false,
            "message" => "Approval Letter must be a valid JPG, PNG, or PDF file (max 10MB)."
        ]);
        exit();
    }

    // Validate student ID image (strictly image)
    $studentIdExt = validateUploadedFile(
        $_FILES["studentIdImage"],
        ['jpg', 'jpeg', 'png'],
        ['image/jpeg', 'image/png']
    );
    if ($studentIdExt === false) {
        echo json_encode([
            "success" => false,
            "message" => "Student ID must be a valid JPG or PNG image (max 10MB)."
        ]);
        exit();
    }

    // Generate safe filenames
    $approvalLetterName = generateSafeFileName($_FILES["approvalLetter"]["name"], $approvalExt);
    $approvalLetterDest = $approvalDir . $approvalLetterName;
    
    $studentIdName = generateSafeFileName($_FILES["studentIdImage"]["name"], $studentIdExt);
    $studentIdDest = $studentIdDir . $studentIdName;

    if (!move_uploaded_file($_FILES["approvalLetter"]["tmp_name"], $approvalLetterDest)) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to save approval letter"
        ]);
        exit();
    }
    $approvalLetterPath = "uploads/approval_letters/" . $approvalLetterName;

    if (!move_uploaded_file($_FILES["studentIdImage"]["tmp_name"], $studentIdDest)) {
        // Clean up approval letter
        unlink($approvalLetterDest);
        echo json_encode([
            "success" => false,
            "message" => "Failed to save student ID image"
        ]);
        exit();
    }
    $studentIdPath = "uploads/student_ids/" . $studentIdName;
}

// Check Email Domain for University matching
$isVerified = false;
$verificationStatus = "UNVERIFIED";
$verifiedDate = null;
$approvalStatus = "PENDING";

if ($role === "ORGANIZER") {
    $uniDomainInfo = checkEmailDomain($email, $conn);
    if ($uniDomainInfo !== false) {
        $isVerified = true;
        $verificationStatus = "VERIFIED";
        $verifiedDate = date("Y-m-d H:i:s");
        $approvalStatus = "APPROVED";
    }
}

// Fetch University Name
$universityName = "";
if ($role === "ORGANIZER" && !empty($universityId)) {
    $uniQuery = $conn->prepare("SELECT universityName FROM university_domains WHERE domainID = ?");
    $uniQuery->bind_param("i", $universityId);
    $uniQuery->execute();
    $uniResult = $uniQuery->get_result();
    if ($uniRow = $uniResult->fetch_assoc()) {
        $universityName = $uniRow["universityName"];
    }
    $uniQuery->close();
}

$conn->begin_transaction();

try {
    // Check if email already exists
    $checkEmail = $conn->prepare("SELECT userID, status FROM Users WHERE email = ?");
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $emailResult = $checkEmail->get_result();
    if ($emailResult->num_rows > 0) {
        $existingUser = $emailResult->fetch_assoc();
        $checkEmail->close();
        if ($existingUser['status'] === 'BLOCKED') {
            throw new Exception("This email address has been blocked/deactivated by platform administration and cannot be used to register a new account.");
        } else {
            throw new Exception("An account with this email address already exists. Please log in instead.");
        }
    }
    $checkEmail->close();

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $userStatus = "ACTIVE";
    if ($role === "ORGANIZER" && $approvalStatus === "PENDING") {
        $userStatus = "PENDING";
    }

    // Insert into Users table
    $stmt = $conn->prepare("INSERT INTO Users (fullName, email, password, role, phoneNo, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $fullName, $email, $hashedPassword, $role, $phone, $userStatus);
    $stmt->execute();
    $userID = $conn->insert_id;
    $stmt->close();

    if ($role === "ORGANIZER") {
        // Insert into Organizers table
        $stmt2 = $conn->prepare(
            "INSERT INTO Organizers (userID, organizationName, universityName, verificationStatus, verifiedDate) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt2->bind_param("issss", $userID, $clubName, $universityName, $verificationStatus, $verifiedDate);
        $stmt2->execute();
        $organizerID = $conn->insert_id;
        $stmt2->close();

        // Insert into OrganizerVerifications table
        $stmt3 = $conn->prepare(
            "INSERT INTO OrganizerVerifications (organizerID, approvalLetterPath, studentIdPath, approvalStatus) 
             VALUES (?, ?, ?, ?)"
        );
        $stmt3->bind_param("isss", $organizerID, $approvalLetterPath, $studentIdPath, $approvalStatus);
        $stmt3->execute();
        $stmt3->close();
    } else {
        // Insert into Donors table
        $stmt2 = $conn->prepare("INSERT INTO Donors (userID) VALUES (?)");
        $stmt2->bind_param("i", $userID);
        $stmt2->execute();
        $stmt2->close();
    }

    $adminTitle = "New user registration";
    $adminMessage = "New user registration: " . $fullName . " has registered on FundUp.";

    if ($role === "ORGANIZER" && $approvalStatus === "PENDING") {
        $adminTitle = "New organizer approval request";
        $adminMessage = "New organizer approval request from " . $fullName . " requires your review.";
    } elseif (!empty($role) && $role !== "DONOR") {
        $adminMessage = "New " . strtolower($role) . " registration: " . $fullName . " has registered on FundUp.";
    }

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

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registration successful",
        "isVerified" => ($role === "ORGANIZER" ? $isVerified : null)
    ]);

} catch (Exception $e) {
    $conn->rollback();
    
    // Clean up uploaded files on failure
    if (!empty($approvalLetterPath) && file_exists("../../" . $approvalLetterPath)) {
        unlink("../../" . $approvalLetterPath);
    }
    if (!empty($studentIdPath) && file_exists("../../" . $studentIdPath)) {
        unlink("../../" . $studentIdPath);
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

?>