<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth();

$data = json_decode(file_get_contents("php://input"), true);

// Enforce that a user can only update their own profile
$userID = $sessionUser['userID'];
$fullName = trim($data["fullName"] ?? "");
$email = trim($data["email"] ?? "");

if (!$userID) {
    echo json_encode(["success" => false, "message" => "userID is required."]);
    exit();
}

if (empty($fullName) || empty($email)) {
    echo json_encode(["success" => false, "message" => "Full Name and Email are required."]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // 1. Check if email exists for other users
    $stmtCheck = $conn->prepare("SELECT userID FROM Users WHERE email = ? AND userID != ?");
    $stmtCheck->bind_param("si", $email, $userID);
    $stmtCheck->execute();
    if ($stmtCheck->get_result()->num_rows > 0) {
        throw new Exception("Email address is already in use by another account.");
    }
    $stmtCheck->close();

    // 2. Update basic info in Users table
    $stmtUpdate = $conn->prepare("UPDATE Users SET fullName = ?, email = ? WHERE userID = ?");
    $stmtUpdate->bind_param("ssi", $fullName, $email, $userID);
    if (!$stmtUpdate->execute()) {
        throw new Exception("Failed to update base user profile.");
    }
    $stmtUpdate->close();

    // 3. Update role-specific tables
    if (isset($data["role"])) {
        if ($data["role"] === "ORGANIZER") {
            $orgName = trim($data["organizationName"] ?? "");
            $uniName = trim($data["universityName"] ?? "");
            if (!empty($orgName) || !empty($uniName)) {
                $stmtOrg = $conn->prepare("UPDATE Organizers SET organizationName = ?, universityName = ? WHERE userID = ?");
                $stmtOrg->bind_param("ssi", $orgName, $uniName, $userID);
                $stmtOrg->execute();
                $stmtOrg->close();
            }
        } else if ($data["role"] === "DONOR") {
            $bio = trim($data["bio"] ?? "");
            $stmtDonor = $conn->prepare("UPDATE Donors SET bio = ? WHERE userID = ?");
            $stmtDonor->bind_param("si", $bio, $userID);
            $stmtDonor->execute();
            $stmtDonor->close();
        }
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Profile updated successfully."]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
