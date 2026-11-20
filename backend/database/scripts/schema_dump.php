<?php
require 'config/db.php';
$tables = $conn->query('SHOW TABLES');
while($row = $tables->fetch_array()) {
    echo $row[0] . "\n";
    $desc = $conn->query('DESCRIBE ' . $row[0]);
    while($col = $desc->fetch_assoc()) {
        echo '  - ' . $col['Field'] . ' (' . $col['Type'] . ')' . "\n";
    }
}
?>
