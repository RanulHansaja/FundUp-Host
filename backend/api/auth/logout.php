<?php
include_once "../../config/cors.php";
header("Content-Type: application/json");

include_once "../../helpers/sessionHelper.php";

startSecureSession();

// Unset all session variables
$_SESSION = array();

// If it's desired to kill the session, also delete the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy session
session_destroy();

echo json_encode([
    "success" => true,
    "message" => "Logged out successfully."
]);
?>
