<?php

/**
 * Validates an uploaded file strictly to prevent malicious uploads (like PHP shells).
 *
 * @param array $file The element from $_FILES (e.g., $_FILES['coverImage'])
 * @param array $allowedExtensions Whitelist of lowercase file extensions (e.g., ['jpg', 'jpeg', 'png', 'pdf'])
 * @param array $allowedMimeTypes Whitelist of MIME types (e.g., ['image/jpeg', 'image/png', 'application/pdf'])
 * @param int $maxSizeBytes Maximum allowed file size in bytes (default 10MB)
 * @return string|bool Returns the clean sanitized file extension on success, false on failure.
 */
function validateUploadedFile($file, array $allowedExtensions, array $allowedMimeTypes, $maxSizeBytes = 10485760) {
    if (!isset($file) || !is_array($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }

    // 1. Check size limit
    if ($file['size'] > $maxSizeBytes) {
        return false;
    }

    // 2. Validate Extension
    $filename = basename($file['name']);
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions)) {
        return false;
    }

    // 3. Validate MIME type using PHP Fileinfo
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
    } else {
        $mimeType = mime_content_type($file['tmp_name']);
    }

    if (!in_array($mimeType, $allowedMimeTypes)) {
        return false;
    }

    return $extension;
}

/**
 * Generates a safe, randomized filename to prevent filename collisions and directory traversal.
 *
 * @param string $originalName Original filename
 * @param string $extension Validated extension
 * @return string Safe randomized name
 */
function generateSafeFileName($originalName, $extension) {
    $cleanName = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
    return time() . "_" . bin2hex(random_bytes(8)) . "_" . $cleanName . "." . $extension;
}

/**
 * Uploads a file directly to Azure Blob Storage using Azure's REST API.
 * 
 * @param string $localFilePath The temporary file path on server ($_FILES['...']['tmp_name'])
 * @param string $blobPath The destination path inside container (e.g., 'profiles/user_1.jpg')
 * @return bool True if upload succeeded, false otherwise.
 */
function uploadToAzureBlob($localFilePath, $blobPath) {
    $account = getenv('AZURE_STORAGE_ACCOUNT');
    $key = getenv('AZURE_STORAGE_KEY');
    $container = 'uploads';

    if (empty($account) || empty($key)) {
        return false;
    }

    $fileData = file_get_contents($localFilePath);
    if ($fileData === false) {
        return false;
    }

    $fileLength = strlen($fileData);
    $mimeType = function_exists('mime_content_type') ? (mime_content_type($localFilePath) ?: 'application/octet-stream') : 'application/octet-stream';
    $date = gmdate('D, d M Y H:i:s T');

    $canonicalHeaders = "x-ms-blob-type:BlockBlob\nx-ms-date:{$date}\nx-ms-version:2021-08-06";
    $canonicalResource = "/{$account}/{$container}/{$blobPath}";

    $stringToSign = "PUT\n\n\n{$fileLength}\n\n{$mimeType}\n\n\n\n\n\n\n{$canonicalHeaders}\n{$canonicalResource}";
    $signature = base64_encode(hash_hmac('sha256', $stringToSign, base64_decode($key), true));
    $authorization = "SharedKey {$account}:{$signature}";

    $url = "https://{$account}.blob.core.windows.net/{$container}/{$blobPath}";
    $headers = [
        "x-ms-blob-type: BlockBlob",
        "x-ms-date: {$date}",
        "x-ms-version: 2021-08-06",
        "Content-Type: {$mimeType}",
        "Content-Length: {$fileLength}",
        "Authorization: {$authorization}"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fileData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($httpCode === 201);
}

/**
 * Saves an uploaded file: prioritizes Azure Blob Storage, with graceful fallback to local storage.
 *
 * @param string $tmpPath The temporary path of uploaded file ($_FILES['...']['tmp_name'])
 * @param string $fileName The sanitized safe filename
 * @param string $subfolder The subfolder (e.g. 'profiles', 'approval_letters', 'project_banners')
 * @return string|bool Returns the database path (e.g. 'uploads/profiles/xxx.jpg') on success, false on failure.
 */
function saveFileToStorage($tmpPath, $fileName, $subfolder = '') {
    $cleanSubfolder = !empty($subfolder) ? trim($subfolder, '/') . '/' : '';
    $blobPath = $cleanSubfolder . $fileName;

    // Try Azure Blob Storage first
    if (uploadToAzureBlob($tmpPath, $blobPath)) {
        $storageAccount = getenv('AZURE_STORAGE_ACCOUNT') ?: 'fundupstorage01';
        return "https://{$storageAccount}.blob.core.windows.net/uploads/" . $blobPath;
    }

    // Local storage fallback
    $targetDir = __DIR__ . "/../uploads/" . $cleanSubfolder;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $destPath = $targetDir . $fileName;
    if (move_uploaded_file($tmpPath, $destPath)) {
        return "uploads/" . $blobPath;
    }

    return false;
}

/**
 * Resolves any stored file path to its full publicly accessible URL.
 * Transparently upgrades legacy 'uploads/...' relative paths to full Azure Blob Storage URLs.
 *
 * @param string|null $storedPath
 * @return string|null
 */
function getFileUrl($storedPath) {
    if (empty($storedPath)) {
        return null;
    }
    if (preg_match('/^https?:\/\//i', $storedPath)) {
        return $storedPath;
    }
    $storageAccount = getenv('AZURE_STORAGE_ACCOUNT') ?: 'fundupstorage01';
    $cleanPath = ltrim($storedPath, '/');
    return "https://{$storageAccount}.blob.core.windows.net/{$cleanPath}";
}
?>
