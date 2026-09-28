<?php
require_once __DIR__ . "/../../config/db.php";
$query = "ALTER TABLE ProgressUpdates ADD COLUMN progressPercent INT DEFAULT 0, ADD COLUMN milestone VARCHAR(255) DEFAULT NULL";
if ($conn->query($query)) {
    echo "Columns added successfully.";
} else {
    echo "Error: " . $conn->error;
}
?>
