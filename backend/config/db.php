<?php

$host = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$dbname = getenv('DB_NAME') ?: "fundup_db";
$port = (int)(getenv('DB_PORT') ?: 3306);

try {
    $conn = mysqli_init();
    $use_ssl = (getenv('DB_SSL') === 'true' || strpos($host, 'azure.com') !== false);
    $flags = $use_ssl ? MYSQLI_CLIENT_SSL : 0;

    if (!@mysqli_real_connect($conn, $host, $username, $password, $dbname, $port, NULL, $flags)) {
        throw new Exception(mysqli_connect_error());
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

