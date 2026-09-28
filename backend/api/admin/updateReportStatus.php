<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['reportID']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

$reportID = intval($data['reportID']);
$status = $conn->real_escape_string($data['status']);
$adminNotes = isset($data['adminNotes']) ? $conn->real_escape_string($data['adminNotes']) : null;
$reviewerID = $_SESSION['userID'] ?? 1; // Fallback to 1 if session is somehow missing but auth passed

// Validate status enum
$validStatuses = ['PENDING', 'VALID', 'INVALID', 'RESOLVED', 'DISMISSED'];
if (!in_array($status, $validStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status value.']);
    exit;
}

try {
    $update_query = "
        UPDATE reports 
        SET status = ?, 
            adminNotes = ?, 
            reviewedBy = ?
        WHERE reportID = ?
    ";
    
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("ssii", $status, $adminNotes, $reviewerID, $reportID);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Report updated successfully.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update report.'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
