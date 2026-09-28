<?php
ob_start(); // Start output buffering immediately to catch ANY stray whitespace or warnings

include_once __DIR__ . "/../../config/cors.php";
// No JSON header because we will output a PDF

include __DIR__ . "/../../config/db.php";
include_once __DIR__ . "/../../helpers/authMiddleware.php";
require_once __DIR__ . "/../../libs/fpdf/fpdf.php";

$sessionUser = requireAuth(['DONOR', 'ADMIN']);
$userID = $sessionUser['userID'];

if (!isset($_GET['donationID'])) {
    http_response_code(400);
    die("Donation ID is required.");
}

$donationID = intval($_GET['donationID']);

// Fetch Donor ID and User details
$stmt = $conn->prepare("
    SELECT d.donorID, u.fullName, u.email 
    FROM Donors d 
    JOIN Users u ON d.userID = u.userID 
    WHERE u.userID = ?
");
$stmt->bind_param("i", $userID);
$stmt->execute();
$donorResult = $stmt->get_result();
if ($donorResult->num_rows === 0) {
    http_response_code(403);
    die("Donor profile not found.");
}
$donorData = $donorResult->fetch_assoc();
$donorID = intval($donorData['donorID']);
$donorName = $donorData['fullName'];
$donorEmail = $donorData['email'];
$stmt->close();

// Fetch Donation Details
$query = "
    SELECT d.amount, d.donationDate, d.paymentMethod, d.status as donationStatus,
           p.title as projectName,
           o.organizationName as department, o.universityName,
           pay.transactionID, pay.paymentGateway
    FROM Donations d
    JOIN Projects p ON d.projectID = p.projectID
    JOIN Organizers o ON p.organizerID = o.organizerID
    LEFT JOIN Payments pay ON d.donationID = pay.donationID
    WHERE d.donationID = ? AND d.donorID = ?
";

$stmtDetail = $conn->prepare($query);
if (!$stmtDetail) {
    http_response_code(500);
    die("Database query error.");
}

$stmtDetail->bind_param("ii", $donationID, $donorID);
$stmtDetail->execute();
$resDetail = $stmtDetail->get_result();

if ($resDetail->num_rows === 0) {
    http_response_code(404);
    die("Donation not found or unauthorized.");
}

$donation = $resDetail->fetch_assoc();
$stmtDetail->close();

if ($donation['donationStatus'] !== 'APPROVED') {
    http_response_code(403);
    die("Receipts are only available for completed donations.");
}

$transactionID = $donation['transactionID'] ? $donation['transactionID'] : ($donation['paymentMethod'] === 'BANK_SLIP' ? 'N/A (Bank Slip)' : 'Pending');
$actualPaymentMethod = 'Not Recorded';
if ($donation['paymentMethod'] === 'ONLINE') {
    $actualPaymentMethod = $donation['paymentGateway'] ? $donation['paymentGateway'] : 'Online Payment';
} elseif ($donation['paymentMethod'] === 'BANK_SLIP') {
    $actualPaymentMethod = 'Bank Transfer';
}

// Generate PDF
$pdf = new FPDF();
$pdf->AddPage();

// FundUp Branding
$logoPath = __DIR__ . '/../../../frontend/src/assets/images/FundUp logo-CRF5i8gW.png';
$hasLogo = file_exists($logoPath);

if ($hasLogo) {
    $pdf->Image($logoPath, 10, 10, 40);
    $pdf->SetXY(55, 15);
}

$pdf->SetFont('Arial', 'B', 24);
$pdf->SetTextColor(37, 99, 235); // Blue-600
$pdf->Cell(0, 10, 'FundUp', 0, 1, 'L');

if ($hasLogo) {
    $pdf->SetX(55);
}
$pdf->SetFont('Arial', '', 10);
$pdf->SetTextColor(100, 116, 139); // Slate-500
$pdf->Cell(0, 5, 'University Fundraising Platform', 0, 1, 'L');

if ($hasLogo) {
    $pdf->SetY(max($pdf->GetY() + 10, 35));
} else {
    $pdf->Ln(10);
}

// Receipt Header
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetTextColor(15, 23, 42); // Slate-900
$pdf->Cell(0, 10, 'OFFICIAL DONATION RECEIPT', 0, 1, 'C');
$pdf->SetFont('Arial', '', 10);
$pdf->SetTextColor(100, 116, 139);
$pdf->Cell(0, 5, 'Receipt No: REC-' . str_pad($donationID, 6, '0', STR_PAD_LEFT), 0, 1, 'C');
$pdf->Cell(0, 5, 'Date Generated: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
$pdf->Ln(15);

// Donor Details
$pdf->SetFont('Arial', 'B', 12);
$pdf->SetTextColor(15, 23, 42);
$pdf->Cell(0, 8, 'Donor Information', 0, 1, 'L');
$pdf->SetFont('Arial', '', 11);
$pdf->SetTextColor(51, 65, 85); // Slate-700
$pdf->Cell(40, 7, 'Name:', 0, 0);
$pdf->Cell(0, 7, $donorName, 0, 1);
$pdf->Cell(40, 7, 'Email:', 0, 0);
$pdf->Cell(0, 7, $donorEmail, 0, 1);
$pdf->Ln(10);

// Donation Details
$pdf->SetFont('Arial', 'B', 12);
$pdf->SetTextColor(15, 23, 42);
$pdf->Cell(0, 8, 'Donation Details', 0, 1, 'L');
$pdf->SetFont('Arial', '', 11);
$pdf->SetTextColor(51, 65, 85);

// Create a table-like layout
$pdf->Cell(50, 7, 'Project / Campaign:', 0, 0);
$pdf->MultiCell(0, 7, $donation['projectName']);
$pdf->Cell(50, 7, 'University / Dept:', 0, 0);
$pdf->MultiCell(0, 7, $donation['universityName'] . ' - ' . $donation['department']);
$pdf->Cell(50, 7, 'Donation Date:', 0, 0);
$pdf->Cell(0, 7, $donation['donationDate'], 0, 1);
$pdf->Cell(50, 7, 'Payment Method:', 0, 0);
$pdf->Cell(0, 7, $actualPaymentMethod, 0, 1);
$pdf->Cell(50, 7, 'Transaction ID:', 0, 0);
$pdf->Cell(0, 7, $transactionID, 0, 1);
$pdf->Cell(50, 7, 'Payment Status:', 0, 0);
$pdf->Cell(0, 7, 'Completed (APPROVED)', 0, 1);
$pdf->Ln(10);

// Amount highlight
$pdf->SetFillColor(241, 245, 249); // Slate-100
$pdf->SetFont('Arial', 'B', 14);
$pdf->Cell(50, 12, 'Total Amount:', 0, 0, 'L', true);
$pdf->SetTextColor(5, 150, 105); // Emerald-600
$pdf->Cell(0, 12, 'Rs. ' . number_format($donation['amount'], 2), 0, 1, 'L', true);
$pdf->Ln(15);

// Thank you message
$pdf->SetFont('Arial', 'I', 11);
$pdf->SetTextColor(100, 116, 139);
$pdf->MultiCell(0, 6, "Thank you, {$donorName}, for your generous support! Your contribution makes a direct impact on the future of our university ecosystem.", 0, 'C');
$pdf->Ln(10);
$pdf->SetFont('Arial', '', 9);
$pdf->Cell(0, 5, 'This is a computer-generated receipt and requires no signature.', 0, 1, 'C');

// Capture PDF as string to prevent any inline warnings from corrupting it
$pdfContent = $pdf->Output('S');

// Clean ANY and ALL output buffers that were opened (this discards any warnings/whitespace)
while (ob_get_level()) {
    ob_end_clean();
}

// Send standard headers for PDF download explicitly
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="FundUp_Receipt_' . $donationID . '.pdf"');
header('Cache-Control: private, max-age=0, must-revalidate');
header('Pragma: public');
header('Content-Length: ' . strlen($pdfContent));

// Output the clean binary PDF
echo $pdfContent;
exit;
