<?php
// Configured allowed origins for security
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
];

// If FRONTEND_URL is set in environment (e.g. from Docker or Azure), add it
$env_frontend = getenv('FRONTEND_URL');
if (!empty($env_frontend)) {
    $allowed_origins[] = rtrim($env_frontend, '/');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow configured origins or any Vercel deployment (*.vercel.app)
if (in_array($origin, $allowed_origins) || (preg_match('/^https:\/\/[a-z0-9-]+\.vercel\.app$/i', $origin))) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default to FRONTEND_URL or localhost:5173 if origin header is missing
    $default_origin = !empty($env_frontend) ? $env_frontend : "http://localhost:5173";
    header("Access-Control-Allow-Origin: $default_origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (isset($_SERVER["REQUEST_METHOD"]) && $_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit(0);
}

