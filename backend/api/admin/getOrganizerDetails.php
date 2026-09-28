<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include_once __DIR__ . '/../../config/db.php';
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
requireAuth(['ADMIN']);

$verificationID = isset($_GET['verificationID']) ? intval($_GET['verificationID']) : 0;
if (!$verificationID) {
    echo json_encode(['success' => false, 'message' => 'Missing verificationID']);
    exit();
}

$sql = "
    SELECT 
        ov.verificationID,
        ov.organizerID,
        ov.approvalLetterPath,
        ov.studentIdPath,
        ov.submittedDate,
        ov.approvalStatus,
        ov.remarks,
        o.userID,
        o.organizationName,
        o.universityName,
        o.verificationStatus,
        u.fullName,
        u.email,
        u.phoneNo,
        u.createdAt
    FROM OrganizerVerifications ov
    JOIN Organizers o ON ov.organizerID = o.organizerID
    JOIN Users u ON o.userID = u.userID
    WHERE ov.verificationID = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $verificationID);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Not found']);
    exit();
}

echo json_encode(['success' => true, 'data' => $row]);
$stmt->close();
$conn->close();
?>