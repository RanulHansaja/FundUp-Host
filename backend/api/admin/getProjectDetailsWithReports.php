<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']);

if (!isset($_GET['projectID'])) {
    echo json_encode(['success' => false, 'message' => 'Project ID is required.']);
    exit;
}

$projectID = intval($_GET['projectID']);

try {
    // 1. Fetch Project Details
    $project_query = "
        SELECT 
            p.projectID as id,
            p.organizerID,
            o.userID as organizerUserID,
            p.title as name,
            COALESCE(o.universityName, o.organizationName) as organizer,
            o.universityName,
            p.description,
            p.category,
            p.status as projectStatus,
            p.collectedAmount as raised,
            p.targetAmount,
            DATE_FORMAT(p.createdAt, '%Y-%m-%d') as createdDate,
            DATE_FORMAT(p.startDate, '%Y-%m-%d') as startDate,
            DATE_FORMAT(p.endDate, '%Y-%m-%d') as endDate,
            p.bannerImage,
            p.proposalPdfPath,
            o.verificationStatus as organizerVerificationStatus
        FROM Projects p
        LEFT JOIN Organizers o ON p.organizerID = o.organizerID
        WHERE p.projectID = ?
    ";
    
    $stmt = $conn->prepare($project_query);
    $stmt->bind_param("i", $projectID);
    $stmt->execute();
    $projectResult = $stmt->get_result();
    
    if ($projectResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Project not found.']);
        exit;
    }
    
    $project = $projectResult->fetch_assoc();
    
    // Pick a color deterministically based on ID
    $colors = ['bg-rose-100', 'bg-indigo-100', 'bg-emerald-100', 'bg-amber-100', 'bg-blue-100'];
    $project['color'] = $colors[$project['id'] % count($colors)];
    
    // Compute progress
    $progress = 0;
    if ($project['targetAmount'] > 0) {
        $progress = round(($project['raised'] / $project['targetAmount']) * 100);
    }
    if ($progress > 100) $progress = 100;
    $project['progress'] = $progress;
    
    // Format amounts
    $project['raisedFormatted'] = 'Rs. ' . number_format($project['raised'], 2);
    $project['targetFormatted'] = 'Rs. ' . number_format($project['targetAmount'], 2);

    // 1.1 Fetch Number of Donors
    $donor_query = "SELECT COUNT(DISTINCT donorID) as donorCount FROM Donations WHERE projectID = ? AND status IN ('APPROVED', 'PENDING')";
    $stmt_donors = $conn->prepare($donor_query);
    $stmt_donors->bind_param("i", $projectID);
    $stmt_donors->execute();
    $donor_result = $stmt_donors->get_result();
    $project['donorCount'] = $donor_result->fetch_assoc()['donorCount'] ?? 0;

    // 1.2 Fetch Additional Project Images
    $media_query = "SELECT mediaPaths, mediaType FROM ProjectMedia WHERE projectID = ?";
    $stmt_media = $conn->prepare($media_query);
    $stmt_media->bind_param("i", $projectID);
    $stmt_media->execute();
    $media_result = $stmt_media->get_result();
    $media = [];
    while ($row = $media_result->fetch_assoc()) {
        $paths = json_decode($row["mediaPaths"] ?? '[]', true);
        if (!is_array($paths)) {
            $paths = $row["mediaPaths"] ? [$row["mediaPaths"]] : [];
        }
        foreach ($paths as $path) {
            $media[] = [
                "mediaType" => $row["mediaType"],
                "mediaPath" => $path
            ];
        }
    }
    $project['media'] = $media;

    // 1.3 Fetch Progress Updates
    $updates_query = "SELECT title, description, imagePaths, DATE_FORMAT(updateDate, '%Y-%m-%d') as updateDate FROM ProgressUpdates WHERE projectID = ? ORDER BY updateDate DESC";
    $stmt_updates = $conn->prepare($updates_query);
    $stmt_updates->bind_param("i", $projectID);
    $stmt_updates->execute();
    $updates_result = $stmt_updates->get_result();
    $updates = [];
    while ($row = $updates_result->fetch_assoc()) {
        $rawImage = $row["imagePaths"] ?? null;
        $imagePaths = json_decode($rawImage ?? '[]', true);
        if (!is_array($imagePaths)) {
            $imagePaths = $rawImage ? [$rawImage] : [];
        }
        
        $row['imagePaths'] = $imagePaths;
        $row['videoPaths'] = [];
        $row['imagePath'] = !empty($imagePaths) ? $imagePaths[0] : null;
        $updates[] = $row;
    }
    $project['updates'] = $updates;

    // 1.4 Fetch Organizer Verification Documents
    $verifications_query = "
        SELECT 
            ov.verificationID,
            ov.approvalLetterPath, 
            ov.studentIdPath,
            DATE_FORMAT(ov.submittedDate, '%Y-%m-%d %H:%i') as submittedDate,
            ov.approvalStatus
        FROM OrganizerVerifications ov
        JOIN Organizers o ON ov.organizerID = o.organizerID
        JOIN Projects p ON o.organizerID = p.organizerID
        WHERE p.projectID = ?
        ORDER BY ov.submittedDate DESC
    ";
    $stmt_verifications = $conn->prepare($verifications_query);
    $stmt_verifications->bind_param("i", $projectID);
    $stmt_verifications->execute();
    $verifications_result = $stmt_verifications->get_result();
    
    $verifications = [];
    while ($row = $verifications_result->fetch_assoc()) {
        $verifications[] = $row;
    }
    $project['organizerVerifications'] = $verifications;

    // 2. Fetch Reports for this project
    $reports_query = "
        SELECT 
            r.reportID, 
            r.reason, 
            r.description, 
            r.status as reportStatus, 
            r.adminNotes,
            DATE_FORMAT(r.reportDate, '%Y-%m-%d %H:%i') as reportDate,
            u.fullName as reporterName,
            rev.fullName as reviewerName
        FROM Reports r
        LEFT JOIN Users u ON r.userID = u.userID
        LEFT JOIN Users rev ON r.reviewedBy = rev.userID
        WHERE r.projectID = ?
        ORDER BY r.reportDate DESC
    ";
    
    $stmt2 = $conn->prepare($reports_query);
    $stmt2->bind_param("i", $projectID);
    $stmt2->execute();
    $reportsResult = $stmt2->get_result();
    
    $reports = [];
    while ($row = $reportsResult->fetch_assoc()) {
        $reports[] = [
            'reportID' => $row['reportID'],
            'reporterName' => $row['reporterName'] ?? 'Anonymous',
            'reason' => $row['reason'],
            'description' => $row['description'],
            'status' => $row['reportStatus'],
            'adminNotes' => $row['adminNotes'],
            'date' => $row['reportDate'],
            'reviewerName' => $row['reviewerName']
        ];
    }
    
    $project['totalReports'] = count($reports);

    echo json_encode([
        'success' => true,
        'data' => [
            'project' => $project,
            'reports' => $reports
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
