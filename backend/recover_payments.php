<?php
include_once __DIR__ . "/config/db.php";

echo "Starting data recovery for old donations...\n";

// 1. Recover ONLINE payments
$queryOnline = "
    UPDATE Donations d
    JOIN Payments p ON d.donationID = p.donationID
    SET d.paymentMethod = 'ONLINE'
    WHERE d.paymentMethod = '' OR d.paymentMethod IS NULL OR d.paymentMethod NOT IN ('ONLINE', 'BANK_SLIP')
";
if ($conn->query($queryOnline)) {
    echo "Recovered ONLINE payments. Rows affected: " . $conn->affected_rows . "\n";
} else {
    echo "Error recovering ONLINE payments: " . $conn->error . "\n";
}

// 2. Recover BANK_SLIP payments
$querySlip = "
    UPDATE Donations d
    JOIN PaymentSlips ps ON d.donationID = ps.donationID
    SET d.paymentMethod = 'BANK_SLIP'
    WHERE d.paymentMethod = '' OR d.paymentMethod IS NULL OR d.paymentMethod NOT IN ('ONLINE', 'BANK_SLIP')
";
if ($conn->query($querySlip)) {
    echo "Recovered BANK_SLIP payments. Rows affected: " . $conn->affected_rows . "\n";
} else {
    echo "Error recovering BANK_SLIP payments: " . $conn->error . "\n";
}

// Let's verify how many still don't have a valid paymentMethod
$queryCheck = "SELECT COUNT(*) as count FROM Donations WHERE paymentMethod = '' OR paymentMethod IS NULL";
$resCheck = $conn->query($queryCheck);
$row = $resCheck->fetch_assoc();
echo "Remaining donations with no recorded payment method: " . $row['count'] . "\n";

echo "Data recovery complete.\n";
