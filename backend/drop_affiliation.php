<?php
include __DIR__ . "/config/db.php";

$sql = "ALTER TABLE Donors DROP COLUMN IF EXISTS affiliation;";
if ($conn->query($sql) === TRUE) {
    echo "Column 'affiliation' dropped successfully.";
} else {
    // If MariaDB/MySQL doesn't support IF EXISTS for DROP COLUMN, use a try-catch equivalent
    $sql2 = "ALTER TABLE Donors DROP COLUMN affiliation;";
    if ($conn->query($sql2) === TRUE) {
        echo "Column 'affiliation' dropped successfully.";
    } else {
        echo "Error or column doesn't exist: " . $conn->error;
    }
}
?>
