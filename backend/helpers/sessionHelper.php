<?php
/**
 * Safely initializes PHP sessions with hardened cookie security parameters.
 */
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Enforce cookie secure parameters (HttpOnly, SameSite, and Secure if HTTPS)
        $isSecure = (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['SERVER_PORT'] == 443))
                 || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        
        // PHP 7.3+ configuration array
        session_set_cookie_params([
            'lifetime' => 0, // Until browser closes
            'path' => '/',
            'domain' => '', // Auto-selects current domain
            'secure' => $isSecure,
            'httponly' => true, // Blocks JavaScript from reading the cookie
            'samesite' => $isSecure ? 'None' : 'Lax' // Lax is suitable for HTTP localhost development
        ]);
        
        session_start();
    }
}

