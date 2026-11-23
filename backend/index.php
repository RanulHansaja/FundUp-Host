<?php
// FundUp Root Router & Static Fallback Handler
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);

// If request is for an uploaded file that is not on App Service disk, redirect to Azure Blob Storage
if (preg_match('#^/(uploads/.*)$#', $path, $matches)) {
    $storageAccount = getenv('AZURE_STORAGE_ACCOUNT') ?: 'fundupstorage01';
    $blobUrl = "https://{$storageAccount}.blob.core.windows.net/{$matches[1]}";
    header("Location: " . $blobUrl, true, 302);
    exit();
}

// Fallback response for unrouted requests
header("Content-Type: application/json");
http_response_code(404);
echo json_encode([
    "success" => false, 
    "message" => "FundUp API Endpoint Not Found"
]);
?>
