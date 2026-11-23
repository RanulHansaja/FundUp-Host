<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");
include __DIR__ . "/../../config/db.php";

$action = $_GET['action'] ?? '';

if ($action === 'clear_broken_avatar') {
    $conn->query("UPDATE Users SET profilePhoto = NULL WHERE userID = 1");
    echo json_encode(["success" => true, "message" => "Admin avatar reset to NULL"]);
    exit();
}

$weekly_query = "SELECT 
                    DATE(u.createdAt) as day,
                    DAYNAME(DATE(u.createdAt)) as dayName,
                    SUM(CASE WHEN u.role = 'ORGANIZER' THEN 1 ELSE 0 END) as organizers,
                    SUM(CASE WHEN u.role = 'DONOR' THEN 1 ELSE 0 END) as donors
                 FROM Users u
                 WHERE u.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY DATE(u.createdAt), DAYNAME(DATE(u.createdAt))
                 ORDER BY DATE(u.createdAt) ASC";

$weekly_res = $conn->query($weekly_query);

$cat_query = "SELECT p.category, SUM(d.amount) as raised 
              FROM Projects p
              JOIN Donations d ON p.projectID = d.projectID
              WHERE d.status = 'APPROVED'
              GROUP BY p.category";
$cat_res = $conn->query($cat_query);

$user_res = $conn->query("SELECT userID, fullName, email, role, profilePhoto FROM Users WHERE role = 'ADMIN' LIMIT 1");
$admin = $user_res ? $user_res->fetch_assoc() : null;

echo json_encode([
    "success" => true,
    "weekly_rows" => $weekly_res ? $weekly_res->num_rows : false,
    "weekly_error" => $conn->error,
    "adminUser" => $admin
]);

$conn->close();
?>
