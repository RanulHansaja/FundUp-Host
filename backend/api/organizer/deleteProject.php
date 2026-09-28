<?php
include_once "../../config/cors.php";
header("Content-Type: application/json");

include_once "../../config/db.php";
include_once "../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['ORGANIZER']);
$userID = $sessionUser['userID'];

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['projectID'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing projectID.'
    ]);
    exit();
}

$projectID = (int)$data['projectID'];

// 1. Resolve organizerID from userID
$stmt = $conn->prepare("SELECT organizerID FROM Organizers WHERE userID = ? LIMIT 1");
$stmt->bind_param('i', $userID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Organizer profile not found.'
    ]);
    exit();
}

$organizer = $result->fetch_assoc();
$organizerID = (int)$organizer['organizerID'];
$stmt->close();

// 2. Verify project ownership and check if it has received any donations
$stmt = $conn->prepare("SELECT organizerID, collectedAmount, status FROM Projects WHERE projectID = ? LIMIT 1");
$stmt->bind_param('i', $projectID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Project not found.'
    ]);
    exit();
}

$project = $result->fetch_assoc();
$stmt->close();

if ((int)$project['organizerID'] !== $organizerID) {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized: This project does not belong to your organization.'
    ]);
    exit();
}

if ($project['status'] === 'SUSPENDED' || $project['status'] === 'REJECTED') {
    echo json_encode([
        'success' => false,
        'message' => 'Cannot delete project: This project is ' . strtolower($project['status']) . '.'
    ]);
    exit();
}

// 3. Double-check if the project has any donations in the Donations table
$stmt = $conn->prepare("SELECT COUNT(*) as donationCount FROM Donations WHERE projectID = ?");
$stmt->bind_param('i', $projectID);
$stmt->execute();
$result = $stmt->get_result();
$don = $result->fetch_assoc();
$stmt->close();

if ((int)$don['donationCount'] > 0 || (float)$project['collectedAmount'] > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Cannot delete project: This project has received donations or payment slips.'
    ]);
    exit();
}

// 4. Proceed with safe deletion inside a transaction
$conn->begin_transaction();
try {
    // Delete from child tables just in case (e.g. ProjectMedia)
    $stmt1 = $conn->prepare("DELETE FROM ProjectMedia WHERE projectID = ?");
    $stmt1->bind_param('i', $projectID);
    $stmt1->execute();
    $stmt1->close();

    $stmt2 = $conn->prepare("DELETE FROM Projects WHERE projectID = ?");
    $stmt2->bind_param('i', $projectID);
    $stmt2->execute();
    $stmt2->close();

    $conn->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Project deleted successfully.'
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete project: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
