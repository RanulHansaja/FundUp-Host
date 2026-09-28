<?php
require_once __DIR__ . '/sessionHelper.php';

/**
 * Enforces session authentication and optional role authorization.
 *
 * @param array $allowedRoles Array of roles authorized to access the resource (e.g. ['ADMIN', 'ORGANIZER'])
 * @return array The session user data: ['userID' => int, 'role' => string, 'fullName' => string, 'email' => string]
 */
function requireAuth(array $allowedRoles = []) {
    startSecureSession();

    if (!isset($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Authentication required. Please log in."
        ]);
        exit();
    }

    $userID = (int) $_SESSION['userID'];
    $role = $_SESSION['role'] ?? '';
    $fullName = $_SESSION['fullName'] ?? '';
    $email = $_SESSION['email'] ?? '';

    // Verify role permissions if specified
    if (!empty($allowedRoles) && !in_array($role, $allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. You do not have permissions to perform this action."
        ]);
        exit();
    }

    return [
        "userID" => $userID,
        "role" => $role,
        "fullName" => $fullName,
        "email" => $email
    ];
}

