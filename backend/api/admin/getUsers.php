<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

// Restrict strictly to ADMIN
requireAuth(['ADMIN']);

$response = ["success" => false, "data" => [], "message" => ""];

// Query users with associated donor/organizer details, project counts, and donation totals
$sql = "SELECT 
            u.userID,
            u.fullName,
            u.email,
            u.phoneNo,
            u.role,
            u.status,
            u.statusReason,
            u.profilePhoto,
            u.createdAt,
            o.organizerID,
            o.organizationName,
            o.universityName,
            o.verificationStatus,
            d.donorID,
            d.badgeLevel,
            d.bio AS donorBio,
            d.totalDonation,
            (SELECT COUNT(*) FROM Projects p WHERE p.organizerID = o.organizerID) AS projectsCount,
            (SELECT COALESCE(SUM(dn.amount), 0) FROM Donations dn WHERE dn.donorID = d.donorID AND dn.status = 'APPROVED') AS totalDonationsCalculated
        FROM Users u
        LEFT JOIN Organizers o ON u.userID = o.userID
        LEFT JOIN Donors d ON u.userID = d.userID
        ORDER BY u.userID DESC";

$result = $conn->query($sql);

if ($result) {
    $users = [];
    $baseUrl = 'http://localhost/FundUp-Host/backend/';

    while ($row = $result->fetch_assoc()) {
        $roleStr = strtoupper($row['role']);
        $statusStr = ucfirst(strtolower($row['status']));
        
        // Capitalize role for UI display
        $formattedRole = 'Donor';
        if ($roleStr === 'ORGANIZER') $formattedRole = 'Organizer';
        else if ($roleStr === 'ADMIN') $formattedRole = 'Admin';

        // University & Department
        $university = 'N/A';
        $department = 'N/A';
        if ($roleStr === 'ORGANIZER') {
            $university = !empty($row['universityName']) ? $row['universityName'] : 'University';
            $department = !empty($row['organizationName']) ? $row['organizationName'] : 'Campus Organization';
        } else if ($roleStr === 'ADMIN') {
            $university = 'FundUp Platform Ops';
            $department = 'System Security';
        }

        // Donations calculation
        $donatedAmt = floatval(!empty($row['totalDonation']) && floatval($row['totalDonation']) > 0 ? $row['totalDonation'] : ($row['totalDonationsCalculated'] ?? 0));
        $formattedDonations = 'Rs. ' . number_format($donatedAmt, 2);

        // Joined date
        $joinedDate = !empty($row['createdAt']) ? date('Y-m-d', strtotime($row['createdAt'])) : date('Y-m-d');

        // Bio
        $bio = $row['donorBio'];
        if (empty($bio)) {
            if ($roleStr === 'ORGANIZER') {
                $bio = "Organizer at " . $university . ".";
            } else if ($roleStr === 'ADMIN') {
                $bio = "System Administrator managing verification workflows and platform health.";
            } else {
                $bio = "Donor account supporting university crowdfunding campaigns.";
            }
        }

        // Avatar / Profile Photo directly from Database ONLY (do NOT set hardcoded default images)
        $avatar = null;
        $dbPhoto = trim($row['profilePhoto'] ?? '');
        if (!empty($dbPhoto)) {
            if (preg_match('/^https?:\/\//i', $dbPhoto)) {
                $avatar = $dbPhoto;
            } else {
                $avatar = $baseUrl . ltrim($dbPhoto, '/');
            }
        }

        $users[] = [
            "id" => "USR-" . str_pad($row['userID'], 4, '0', STR_PAD_LEFT),
            "userID" => (int)$row['userID'],
            "name" => $row['fullName'],
            "email" => $row['email'],
            "phone" => !empty($row['phoneNo']) ? $row['phoneNo'] : 'N/A',
            "role" => $formattedRole,
            "status" => $statusStr,
            "joinedDate" => $joinedDate,
            "university" => $university,
            "department" => $department,
            "projectsCount" => (int)$row['projectsCount'],
            "totalDonations" => $formattedDonations,
            "avatar" => $avatar,
            "profilePhoto" => !empty($dbPhoto) ? $dbPhoto : null,
            "bio" => $bio,
            "statusReason" => !empty($row['statusReason']) ? $row['statusReason'] : null,
            "verificationStatus" => $row['verificationStatus'] ?? null,
            "badgeLevel" => $row['badgeLevel'] ?? null
        ];
    }

    $response["success"] = true;
    $response["data"] = $users;
} else {
    $response["message"] = "Failed to fetch users list.";
}

echo json_encode($response);
$conn->close();
?>
