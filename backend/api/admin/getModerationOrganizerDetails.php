<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']);

if (!isset($_GET['organizerUserID'])) {
    echo json_encode(['success' => false, 'message' => 'Organizer User ID is required.']);
    exit;
}

$organizerUserID = intval($_GET['organizerUserID']);

try {
    $query = "
        SELECT 
            u.fullName,
            u.profilePhoto,
            u.email,
            u.phoneNo,
            u.status as accountStatus,
            DATE_FORMAT(u.createdAt, '%Y-%m-%d') as registrationDate,
            o.universityName,
            o.organizationName,
            o.organizerID
        FROM Users u
        LEFT JOIN Organizers o ON u.userID = o.userID
        WHERE u.userID = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $organizerUserID);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Organizer not found.']);
        exit;
    }
    
    $organizer = $result->fetch_assoc();
    $organizerID = $organizer['organizerID'];
    
    // Aggregate project counts
    $activeProjects = 0;
    $completedProjects = 0;
    
    if ($organizerID) {
        $proj_query = "SELECT status, COUNT(*) as count FROM Projects WHERE organizerID = ? GROUP BY status";
        $stmt_proj = $conn->prepare($proj_query);
        $stmt_proj->bind_param("i", $organizerID);
        $stmt_proj->execute();
        $proj_result = $stmt_proj->get_result();
        
        while ($row = $proj_result->fetch_assoc()) {
            if ($row['status'] === 'ACTIVE') {
                $activeProjects = $row['count'];
            } else if ($row['status'] === 'COMPLETED') {
                $completedProjects = $row['count'];
            }
        }
    }
    
    $organizer['activeProjects'] = $activeProjects;
    $organizer['completedProjects'] = $completedProjects;
    $organizer['department'] = $organizer['organizationName'] ?: 'N/A';
    
    // Add full path to profile photo
    if (!empty($organizer['profilePhoto']) && !filter_var($organizer['profilePhoto'], FILTER_VALIDATE_URL)) {
        $organizer['profilePhoto'] = 'http://localhost/FundUp_Host/backend/' . ltrim($organizer['profilePhoto'], '/');
    }

    echo json_encode([
        'success' => true,
        'data' => $organizer
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
