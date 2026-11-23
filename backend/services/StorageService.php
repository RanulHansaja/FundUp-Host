<?php

/**
 * Centralized Cloud and Local Storage Service.
 * Prioritizes Azure Blob Storage (Hot LRS) with graceful local disk fallback.
 */
class StorageService {
    /**
     * Validates and saves an uploaded file to storage.
     *
     * @param array $file Entry from $_FILES (e.g., $_FILES['profilePhoto'])
     * @param string $subfolder Destination subfolder (e.g., 'profiles', 'banners', 'proposals')
     * @param array $allowedExtensions Whitelist of lowercase extensions (e.g. ['jpg', 'png'])
     * @param array $allowedMimeTypes Whitelist of MIME types
     * @param int $maxSizeBytes Maximum size in bytes (default 10MB)
     * @return string|false Stored relative path (e.g. 'uploads/profiles/xxx.jpg') or false on failure
     */
    public static function upload(
        array $file,
        string $subfolder = '',
        array $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'jfif'],
        array $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/pjpeg'],
        int $maxSizeBytes = 10485760
    ) {
        if (!isset($file) || !is_array($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }

        // 1. Size check
        if ($file['size'] > $maxSizeBytes) {
            return false;
        }

        // 2. Extension validation
        $originalName = basename($file['name']);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions)) {
            return false;
        }

        // 3. MIME validation
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

        // 4. Generate safe randomized filename
        $cleanName = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $safeFileName = time() . "_" . bin2hex(random_bytes(8)) . "_" . $cleanName . "." . $extension;

        $cleanSubfolder = !empty($subfolder) ? trim($subfolder, '/') . '/' : '';
        $blobPath = $cleanSubfolder . $safeFileName;

        // 5. Upload to Azure Blob Storage if configured
        if (self::uploadToAzureBlob($file['tmp_name'], $blobPath)) {
            $storageAccount = getenv('AZURE_STORAGE_ACCOUNT') ?: 'fundupstorage01';
            return "https://{$storageAccount}.blob.core.windows.net/uploads/" . $blobPath;
        }

        // 6. Graceful local storage fallback
        $targetDir = __DIR__ . "/../uploads/" . $cleanSubfolder;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $destPath = $targetDir . $safeFileName;
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            return "uploads/" . $blobPath;
        }

        return false;
    }

    /**
     * Uploads file to Azure Blob Storage using REST API and HMAC-SHA256 signature.
     */
    public static function uploadToAzureBlob(string $localFilePath, string $blobPath): bool {
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
}
