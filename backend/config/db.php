<?php

$host = "localhost";
$username = "root";
$password = "";
$dbname = "fundup_db";
$port = 3306; // Change this port configuration as needed for your environment

try {
    $conn = new mysqli($host, $username, $password, $dbname, $port);
} catch (Exception $e) {
    die("Connection Failed: " . $e->getMessage());
}

if ($conn->connect_error) {
    die("Connection Failed: " . $conn->connect_error);
}

