<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");
include __DIR__ . "/../../config/db.php";

$res = $conn->query("SELECT userID, fullName, email, profilePhoto FROM Users WHERE userID = 2");
$row = $res ? $res->fetch_assoc() : null;

$envStorageAccount = getenv('AZURE_STORAGE_ACCOUNT');
$uploadsDirExists = is_dir(__DIR__ . "/../../uploads/profiles");
$filesInProfiles = $uploadsDirExists ? scandir(__DIR__ . "/../../uploads/profiles") : [];

echo json_encode([
    "user" => $row,
    "has_azure_storage_env" => !empty($envStorageAccount),
    "azure_storage_account" => $envStorageAccount,
    "uploads_dir_exists" => $uploadsDirExists,
    "files" => $filesInProfiles
]);
$conn->close();
?>