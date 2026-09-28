<?php

include_once __DIR__ . "/../../config/cors.php"; // allows React to talk to PHP
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/authMiddleware.php';

// Verify that the user is logged in as an ADMIN
requireAuth(['ADMIN']); // checks session cookie → is this an ADMIN?

try {
    // Get Active Organizers (VERIFIED organizers with ACTIVE users)
    $organizers_query = "SELECT COUNT(*) as count FROM Organizers o
                         JOIN Users u ON o.userID = u.userID
                         WHERE u.status = 'ACTIVE' AND o.verificationStatus = 'VERIFIED'";
    $organizers_result = $conn->query($organizers_query);
    $activeOrganizers = $organizers_result->fetch_assoc()['count'] ?? 0;

    // Get Active Donors (donors with ACTIVE users)
    $donors_query = "SELECT COUNT(*) as count FROM Donors d
                     JOIN Users u ON d.userID = u.userID
                     WHERE u.status = 'ACTIVE'";
    $donors_result = $conn->query($donors_query);
    $activeDonors = $donors_result->fetch_assoc()['count'] ?? 0;

    // Get Total Projects
    $projects_query = "SELECT COUNT(*) as count FROM Projects WHERE status IN ('ACTIVE', 'COMPLETED','SUSPENDED','PENDING')";
    $projects_result = $conn->query($projects_query);
    $totalProjects = $projects_result->fetch_assoc()['count'] ?? 0;

    // Get Total Users (all roles)
    $users_query = "SELECT COUNT(*) as count FROM Users WHERE status IN ('ACTIVE', 'SUSPENDED', 'PENDING')";
    $users_result = $conn->query($users_query);
    $totalUsers = $users_result->fetch_assoc()['count'] ?? 0;

    // Get Weekly Activity Data (last 7 days)
    $weekly_query = "SELECT 
                        DATE(u.createdAt) as day,
                        DAYNAME(u.createdAt) as dayName,
                        SUM(CASE WHEN u.role = 'ORGANIZER' THEN 1 ELSE 0 END) as organizers,
                        SUM(CASE WHEN u.role = 'DONOR' THEN 1 ELSE 0 END) as donors
                     FROM Users u
                     WHERE u.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                     GROUP BY DATE(u.createdAt)
                     ORDER BY DATE(u.createdAt) ASC";
    
    $weekly_result = $conn->query($weekly_query);
    $weeklyData = [];
    
    if ($weekly_result && $weekly_result->num_rows > 0) {
        while ($row = $weekly_result->fetch_assoc()) {
            $weeklyData[] = [
                'day' => substr($row['dayName'], 0, 3),
                'organizers' => (int)$row['organizers'] ?? 0,
                'donors' => (int)$row['donors'] ?? 0
            ];
        }
    }
    
    // Fill missing days with 0 values
    $dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (count($weeklyData) < 7) {
        for ($i = 0; $i < 7; $i++) {
            $dayExists = array_filter($weeklyData, function($d) use ($dayNames, $i) {
                return $d['day'] === $dayNames[$i];
            });
            if (empty($dayExists)) {
                $weeklyData[] = [
                    'day' => $dayNames[$i],
                    'organizers' => 0,
                    'donors' => 0
                ];
            }
        }
        // Re-sort by day
        $dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        usort($weeklyData, function($a, $b) use ($dayOrder) {
            return array_search($a['day'], $dayOrder) - array_search($b['day'], $dayOrder);
        });
    }

    // 1. Total Funds Raised (Sum of all APPROVED donations)
    $funds_raised_query = "SELECT IFNULL(SUM(amount), 0) as total FROM Donations WHERE status = 'APPROVED'";
    $funds_raised_result = $conn->query($funds_raised_query);
    $totalFundsRaised = (float)($funds_raised_result->fetch_assoc()['total'] ?? 0.0);

    // 2. Total Donations (Count of all APPROVED donations)
    $donations_query = "SELECT COUNT(*) as count FROM Donations WHERE status = 'APPROVED'";
    $donations_result = $conn->query($donations_query);
    $totalDonations = (int)($donations_result->fetch_assoc()['count'] ?? 0);

    // 3. Average Donation
    $averageDonation = $totalDonations > 0 ? $totalFundsRaised / $totalDonations : 0.0;

    // 4. Successful Campaigns
    // Auto-mark active projects whose end date has passed as COMPLETED first
    $conn->query("UPDATE Projects SET status = 'COMPLETED' WHERE status = 'ACTIVE' AND endDate < CURDATE()");
    $successful_query = "SELECT COUNT(*) as count FROM Projects WHERE status = 'COMPLETED' OR (targetAmount > 0 AND collectedAmount >= targetAmount)";
    $successful_result = $conn->query($successful_query);
    $successfulCampaigns = (int)($successful_result->fetch_assoc()['count'] ?? 0);

    // 5. Funds Raised by Category (using exactly what the database has)
    // Preset all standard categories to 0
    $categories = [
        'Education' => 0.0,
        'Sports' => 0.0,
        'Charity' => 0.0,
        'Health & Medical' => 0.0,
        'Environment' => 0.0,
        'Other' => 0.0
    ];

    $category_query = "SELECT p.category, SUM(d.amount) as raised 
                       FROM Projects p
                       JOIN Donations d ON p.projectID = d.projectID
                       WHERE d.status = 'APPROVED'
                       GROUP BY p.category";
    $category_result = $conn->query($category_query);
    if ($category_result) {
        while ($row = $category_result->fetch_assoc()) {
            $cat = $row['category'];
            if (array_key_exists($cat, $categories)) {
                $categories[$cat] += (float)$row['raised'];
            } else {
                $categories['Other'] += (float)$row['raised'];
            }
        }
    }

    $fundsRaisedByCategory = [];
    foreach ($categories as $name => $raised) {
        $percentage = $totalFundsRaised > 0 ? ($raised / $totalFundsRaised) * 100 : 0.0;
        $fundsRaisedByCategory[] = [
            'name' => $name,
            'raised' => (float)$raised,
            'percentage' => round($percentage, 2)
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'activeOrganizers' => $activeOrganizers,
            'activeDonors' => $activeDonors,
            'totalProjects' => $totalProjects,
            'totalUsers' => $totalUsers,
            'weeklyData' => $weeklyData,
            'totalFundsRaised' => $totalFundsRaised,
            'totalDonations' => $totalDonations,
            'averageDonation' => $averageDonation,
            'successfulCampaigns' => $successfulCampaigns,
            'fundsRaisedByCategory' => $fundsRaisedByCategory
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching dashboard data: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
