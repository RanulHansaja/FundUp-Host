<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
requireAuth(['ADMIN']);

$response = ["success" => false, "data" => [], "message" => ""];

// Fetch pending organizer verifications
$sql = "SELECT ov.verificationID, ov.submittedDate, ov.approvalStatus, ov.approvalLetterPath, ov.studentIdPath,
               o.organizerID, o.organizationName, o.universityName, o.verificationStatus,
               u.userID, u.fullName, u.email, u.createdAt
        FROM OrganizerVerifications ov
        JOIN Organizers o ON ov.organizerID = o.organizerID
        JOIN Users u ON o.userID = u.userID
        WHERE ov.approvalStatus = 'PENDING'
        ORDER BY ov.submittedDate DESC";

$result = $conn->query($sql);

if ($result) {
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = [
            "verificationID" => (int)$row["verificationID"],
            "submittedDate" => $row["submittedDate"],
            "approvalStatus" => $row["approvalStatus"],
            "approvalLetterPath" => $row["approvalLetterPath"],
            "studentIdPath" => $row["studentIdPath"],
            "organizerID" => (int)$row["organizerID"],
            "organizationName" => $row["organizationName"],
            "universityName" => $row["universityName"],
            "verificationStatus" => $row["verificationStatus"],
            "userID" => (int)$row["userID"],
            "fullName" => $row["fullName"],
            "email" => $row["email"],
            "createdAt" => $row["createdAt"]
        ];
    }

    $response["success"] = true;
    $response["data"] = $items;
} else {
    $response["message"] = "Failed to fetch records";
}

echo json_encode($response);

?>
