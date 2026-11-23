<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");
include __DIR__ . "/../../config/db.php";

$results = [];

try {
    // 1. Test Weekly Query
    $weekly_query = "SELECT 
                        DATE(u.createdAt) as day,
                        DAYNAME(DATE(u.createdAt)) as dayName,
                        SUM(CASE WHEN u.role = 'ORGANIZER' THEN 1 ELSE 0 END) as organizers,
                        SUM(CASE WHEN u.role = 'DONOR' THEN 1 ELSE 0 END) as donors
                     FROM Users u
                     WHERE u.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                     GROUP BY DATE(u.createdAt), DAYNAME(DATE(u.createdAt))
                     ORDER BY DATE(u.createdAt) ASC";
    
    $res = $conn->query($weekly_query);
    if (!$res) {
        throw new Exception("Weekly query failed: " . $conn->error);
    }
    $results['weekly'] = $res->num_rows;

    // 2. Test Category Query
    $cat_query = "SELECT p.category, SUM(d.amount) as raised 
                  FROM Projects p
                  JOIN Donations d ON p.projectID = d.projectID
                  WHERE d.status = 'APPROVED'
                  GROUP BY p.category";
    $cat_res = $conn->query($cat_query);
    if (!$cat_res) {
        throw new Exception("Category query failed: " . $conn->error);
    }
    $results['categories'] = $cat_res->num_rows;

    // 3. Admin user profile photo check
    $user_res = $conn->query("SELECT userID, fullName, email, role, profilePhoto FROM Users WHERE role = 'ADMIN' LIMIT 1");
    if ($user_res && $row = $user_res->fetch_assoc()) {
        $results['adminUser'] = [
            'userID' => $row['userID'],
            'email' => $row['email'],
            'profilePhoto' => $row['profilePhoto']
        ];
    }

    echo json_encode(["success" => true, "data" => $results]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
