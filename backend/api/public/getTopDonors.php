<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";

try {
    $limitSql = " LIMIT 5";
    if (isset($_GET['all']) && $_GET['all'] === 'true') {
        $limitSql = "";
    } elseif (isset($_GET['limit'])) {
        if ($_GET['limit'] === 'all') {
            $limitSql = "";
        } elseif (is_numeric($_GET['limit'])) {
            $limitSql = " LIMIT " . intval($_GET['limit']);
        }
    }

    $sql = "SELECT u.fullName, u.profilePhoto, d.totalDonation, d.bio, d.badgeLevel 
            FROM Donors d 
            JOIN Users u ON d.userID = u.userID 
            WHERE u.status = 'ACTIVE'
            ORDER BY d.totalDonation DESC" . $limitSql;
    $result = $conn->query($sql);
    
    $donors = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $total = (float)$row['totalDonation'];
            $badge = $row['badgeLevel'] ?? 'NONE';
            if ($badge === 'NONE') {
                if ($total >= 500000) $badge = 'PLATINUM';
                elseif ($total >= 100000) $badge = 'GOLD';
                elseif ($total >= 50000) $badge = 'SILVER';
                elseif ($total >= 25000) $badge = 'BRONZE';
                elseif ($total >= 5000) $badge = 'STARTER';
            }

            $donors[] = [
                'fullName' => $row['fullName'],
                'profilePhoto' => $row['profilePhoto'],
                'totalDonation' => $total,
                'affiliation' => (!empty($row['bio'])) ? $row['bio'] : 'Philanthropic Backer',
                'badgeLevel' => $badge
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "data" => $donors
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch top donors: " . $e->getMessage()
    ]);
}
?>
