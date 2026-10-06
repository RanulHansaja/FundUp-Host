<?php

$host = "localhost";
$username = "root";
$password = "";
$dbname = "fundup_db";
$port = 3306; // Change this port configuration as needed for your environment

try {
    $conn = new mysqli($host, $username, $password, $dbname, $port);
    if ($conn->connect_error) {
        throw new Exception($conn->connect_error);
    }
} catch (Throwable $e) {
    http_response_code(500);
    if (!headers_sent()) {
        header("Content-Type: application/json");
    }
    echo json_encode([
        "success" => false,
        "message" => "Database Connection Failed: " . $e->getMessage()
    ]);
    exit();
}

