<?php

include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";

$sessionUser = requireAuth(['DONOR', 'ADMIN']);
$userID = $sessionUser['userID'];
$donorID = null;

$response = [
    "success" => false,
    "message" => "",
    "data" => null
];

// Fetch Donor ID
$stmt = $conn->prepare("SELECT donorID FROM Donors WHERE userID = ?");
$stmt->bind_param("i", $userID);
$stmt->execute();
$donorResult = $stmt->get_result();
if ($donorResult->num_rows === 0) {
    // Check if it's admin or default for testing if no donor found
    $donorID = 1;
} else {
    $donorRow = $donorResult->fetch_assoc();
    $donorID = intval($donorRow['donorID']);
}
$stmt->close();

// Default values for stats
$totalDonated = 0.00;
$projectsImpacted = 0;
$pendingVerifications = 0;

// Calculate Total Donated
$stmtTotal = $conn->prepare("SELECT SUM(amount) as total FROM Donations WHERE donorID = ? AND status = 'APPROVED'");
$stmtTotal->bind_param("i", $donorID);
$stmtTotal->execute();
$resTotal = $stmtTotal->get_result()->fetch_assoc();
if ($resTotal && $resTotal['total'] !== null) {
    $totalDonated = floatval($resTotal['total']);
}
$stmtTotal->close();

// Calculate Projects Impacted
$stmtImpact = $conn->prepare("SELECT COUNT(DISTINCT projectID) as count FROM Donations WHERE donorID = ? AND status = 'APPROVED'");
$stmtImpact->bind_param("i", $donorID);
$stmtImpact->execute();
$resImpact = $stmtImpact->get_result()->fetch_assoc();
if ($resImpact) {
    $projectsImpacted = intval($resImpact['count']);
}
$stmtImpact->close();

// Calculate Pending Verifications
$stmtPending = $conn->prepare("SELECT COUNT(donationID) as count FROM Donations WHERE donorID = ? AND status = 'PENDING'");
$stmtPending->bind_param("i", $donorID);
$stmtPending->execute();
$resPending = $stmtPending->get_result()->fetch_assoc();
if ($resPending) {
    $pendingVerifications = intval($resPending['count']);
}
$stmtPending->close();

// Get filter params
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
$offset = ($page - 1) * $limit;

$year = isset($_GET['year']) ? trim($_GET['year']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Build Query for List
$query = "
    SELECT d.donationID, d.amount, d.donationDate, d.status as paymentStatus, d.paymentMethod,
           p.projectID, p.title as projectName, o.organizationName, o.universityName,
           pay.paymentGateway
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Organizers o ON p.organizerID = o.organizerID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    WHERE d.donorID = ?
";
$params = [$donorID];
$types = "i";

if (!empty($year) && $year !== 'All') {
    $query .= " AND YEAR(d.donationDate) = ?";
    $params[] = intval($year);
    $types .= "i";
}

if (!empty($status) && $status !== 'All') {
    $dbStatus = $status;
    if (strtoupper($status) === 'COMPLETED') $dbStatus = 'APPROVED';
    if (strtoupper($status) === 'PROCESSING') $dbStatus = 'PENDING';
    if (strtoupper($status) === 'FAILED') $dbStatus = 'REJECTED';
    
    $query .= " AND d.status = ?";
    $params[] = strtoupper($dbStatus);
    $types .= "s";
}

if (!empty($search)) {
    $query .= " AND p.title LIKE ?";
    $params[] = "%" . $search . "%";
    $types .= "s";
}

// Get total count for pagination
$countQuery = str_replace("d.donationID, d.amount, d.donationDate, d.status as paymentStatus, d.paymentMethod,
           p.projectID, p.title as projectName, o.organizationName, o.universityName,
           pay.paymentGateway", "COUNT(d.donationID) as totalRows", $query);
$stmtCount = $conn->prepare($countQuery);
if ($stmtCount) {
    $stmtCount->bind_param($types, ...$params);
    $stmtCount->execute();
    $resCount = $stmtCount->get_result()->fetch_assoc();
    $totalRows = $resCount ? intval($resCount['totalRows']) : 0;
    $stmtCount->close();
} else {
    $totalRows = 0;
}


$query .= " ORDER BY d.donationDate DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmtList = $conn->prepare($query);
$donations = [];

if ($stmtList) {
    $stmtList->bind_param($types, ...$params);
    $stmtList->execute();
    $resList = $stmtList->get_result();
    
    while ($row = $resList->fetch_assoc()) {
        $actualPaymentMethod = 'Not Recorded';
        if ($row['paymentMethod'] === 'ONLINE') {
            $actualPaymentMethod = $row['paymentGateway'] ? $row['paymentGateway'] : 'Online Payment';
        } elseif ($row['paymentMethod'] === 'BANK_SLIP') {
            $actualPaymentMethod = 'Bank Transfer';
        }
        
        $donations[] = [
            "id" => $row['donationID'],
            "projectID" => $row['projectID'],
            "projectName" => $row['projectName'],
            "department" => $row['organizationName'],
            "university" => $row['universityName'],
            "date" => $row['donationDate'],
            "amount" => floatval($row['amount']),
            "paymentMethod" => $actualPaymentMethod,
            "paymentStatus" => $row['paymentStatus'] // APPROVED, PENDING, REJECTED
        ];
    }
    $stmtList->close();
}

$response["success"] = true;
$response["data"] = [
    "stats" => [
        "totalDonated" => $totalDonated,
        "projectsImpacted" => $projectsImpacted,
        "pendingVerifications" => $pendingVerifications
    ],
    "donations" => $donations,
    "pagination" => [
        "page" => $page,
        "limit" => $limit,
        "totalRows" => $totalRows,
        "totalPages" => ceil($totalRows / $limit)
    ]
];

echo json_encode($response);
exit;
