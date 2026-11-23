<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']);

try {
    // Summary Stats
    $totalReported = $conn->query("SELECT COUNT(DISTINCT projectID) as count FROM Reports")->fetch_assoc()['count'] ?? 0;
    $pendingReviews_query = "
        SELECT COUNT(DISTINCT p.projectID) as count 
        FROM Projects p 
        JOIN Reports r ON p.projectID = r.projectID 
        WHERE p.status NOT IN ('APPROVED', 'REJECTED', 'SUSPENDED') 
        AND p.projectID NOT IN (
            SELECT DISTINCT projectID FROM Reports WHERE status != 'PENDING'
        )
    ";
    $pendingReviews = $conn->query($pendingReviews_query)->fetch_assoc()['count'] ?? 0;
    $resolvedReports = $conn->query("SELECT COUNT(*) as count FROM Reports WHERE status IN ('RESOLVED', 'DISMISSED')")->fetch_assoc()['count'] ?? 0;
    
    // Removed projects are those that have a report and are SUSPENDED or REJECTED
    $removedProjects = $conn->query("SELECT COUNT(DISTINCT p.projectID) as count FROM Projects p JOIN Reports r ON p.projectID = r.projectID WHERE p.status IN ('SUSPENDED', 'REJECTED')")->fetch_assoc()['count'] ?? 0;

    // Project List Grouped
    $projects_query = "
        SELECT 
            p.projectID as id,
            p.title as name,
            COALESCE(o.universityName, o.organizationName) as organizer,
            p.description,
            p.category,
            p.status as projectStatus,
            p.collectedAmount as raised,
            p.targetAmount,
            DATE_FORMAT(p.createdAt, '%Y-%m-%d') as createdDate,
            COUNT(r.reportID) as reportsCount,
            MAX(r.reportDate) as latestReportDate,
            DATE_FORMAT(MAX(r.reportDate), '%Y-%m-%d') as submittedDate
        FROM Projects p
        JOIN Reports r ON p.projectID = r.projectID
        LEFT JOIN Organizers o ON p.organizerID = o.organizerID
        GROUP BY p.projectID, o.universityName, o.organizationName
        ORDER BY latestReportDate DESC
    ";
    
    $result = $conn->query($projects_query);
    $projects = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $projectId = $row['id'];
            
            // Get latest report details for this project
            $latest_report_query = "
                SELECT r.reason, r.description, u.fullName as reporterName, r.status as reportStatus, r.reportDate
                FROM Reports r
                LEFT JOIN Users u ON r.userID = u.userID
                WHERE r.projectID = ? 
                ORDER BY r.reportDate DESC LIMIT 1
            ";
            $stmt = $conn->prepare($latest_report_query);
            $stmt->bind_param("i", $projectId);
            $stmt->execute();
            $latestReport = $stmt->get_result()->fetch_assoc();
            
            $progress = 0;
            if ($row['targetAmount'] > 0) {
                $progress = round(($row['raised'] / $row['targetAmount']) * 100);
            }
            if ($progress > 100) $progress = 100;

            // Determine display status based on project status and report status
            // Check if there are ANY pending reports first
            $pending_check_query = "SELECT COUNT(*) as count FROM Reports WHERE projectID = ? AND status = 'PENDING'";
            $stmt_pend_check = $conn->prepare($pending_check_query);
            $stmt_pend_check->bind_param("i", $projectId);
            $stmt_pend_check->execute();
            $pendingCount = $stmt_pend_check->get_result()->fetch_assoc()['count'] ?? 0;

            // Check if there are ANY VALID or INVALID reports
            $ur_check_query = "SELECT COUNT(*) as count FROM Reports WHERE projectID = ? AND status IN ('VALID', 'INVALID')";
            $stmt_ur_check = $conn->prepare($ur_check_query);
            $stmt_ur_check->bind_param("i", $projectId);
            $stmt_ur_check->execute();
            $urCount = $stmt_ur_check->get_result()->fetch_assoc()['count'] ?? 0;

            // Get the latest approval timestamp
            $mod_query = "SELECT createdAt FROM moderation_history WHERE projectID = ? AND action_type = 'APPROVE_PROJECT' ORDER BY createdAt DESC LIMIT 1";
            $stmt_mod = $conn->prepare($mod_query);
            $stmt_mod->bind_param("i", $projectId);
            $stmt_mod->execute();
            $mod_result = $stmt_mod->get_result();
            $last_approved = null;
            if ($mod_row = $mod_result->fetch_assoc()) {
                $last_approved = $mod_row['createdAt'];
            }
            
            // Get the latest report date for comparison
            $latestReportDate = $latestReport['reportDate'] ?? null;

            if ($pendingCount > 0) {
                $status = 'Pending Review';
            } else if ($row['projectStatus'] === 'REJECTED') {
                $status = 'Rejected';
            } else if ($row['projectStatus'] === 'SUSPENDED') {
                $status = 'Suspended';
            } else if ($row['projectStatus'] === 'APPROVED') {
                // If it is APPROVED, we need to check if the approval happened AFTER the latest report.
                // If there are no reports, or if the approval is newer than the latest report, it is Approved.
                if ($urCount > 0 && $latestReportDate && (!$last_approved || strtotime($latestReportDate) > strtotime($last_approved))) {
                    $status = 'Reviewed';
                } else {
                    $status = 'Approved';
                }
            } else if ($urCount > 0) {
                $status = 'Reviewed';
            } else {
                $status = 'Reviewed';
            }

            // Pick a color deterministically
            $colors = ['bg-rose-100', 'bg-indigo-100', 'bg-emerald-100', 'bg-amber-100', 'bg-blue-100'];
            $color = $colors[$projectId % count($colors)];

            $projects[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'organizer' => $row['organizer'] ?? 'Unknown Organizer',
                'description' => $row['description'],
                'category' => $row['category'],
                'status' => $status,
                'progress' => $progress,
                'raised' => 'Rs. ' . number_format($row['raised'], 2),
                'createdDate' => $row['createdDate'],
                'submittedDate' => $row['submittedDate'],
                'reportsCount' => (int)$row['reportsCount'],
                'newReportsCount' => (int)$pendingCount,
                'reviewedReportsCount' => (int)$urCount,
                'reportReason' => $latestReport['reason'] ?? 'Unknown',
                'reporterDetails' => $latestReport['reporterName'] ?? 'Anonymous',
                'comments' => $latestReport['description'] ?? 'No comments provided.',
                'evidence' => 'None', // Default as per schema
                'color' => $color,
                'history' => [
                    ['event' => 'Report Submitted', 'date' => $row['submittedDate'], 'type' => 'warning']
                ]
            ];
        }
    }

    // Get distinct categories
    $categories_query = "SELECT DISTINCT category FROM Projects WHERE category IS NOT NULL AND category != '' ORDER BY category";
    $cat_result = $conn->query($categories_query);
    $categories = [];
    if ($cat_result && $cat_result->num_rows > 0) {
        while ($row = $cat_result->fetch_assoc()) {
            $categories[] = $row['category'];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => [
                'totalReported' => $totalReported,
                'pendingReviews' => $pendingReviews,
                'resolvedReports' => $resolvedReports,
                'removedProjects' => $removedProjects
            ],
            'projects' => $projects,
            'categories' => $categories
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
