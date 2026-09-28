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
?>
