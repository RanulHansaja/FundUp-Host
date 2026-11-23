<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . "/../../helpers/MailHelper.php";

$to = isset($_GET['to']) ? trim($_GET['to']) : 'ranulhansaja414@gmail.com';

try {
    $mail = getMailerInstance();
    $mail->addAddress($to, 'FundUp Administrator');
    $mail->isHTML(true);
    $mail->Subject = 'FundUp Email Delivery Verification - System Diagnostic';
    $mail->Body = '<h2>FundUp Email System Active</h2><p>This email confirms that the FundUp automated SMTP delivery service is operating correctly on Azure App Service.</p><p>Timestamp: ' . date('Y-m-d H:i:s') . '</p>';
    
    $sent = $mail->send();
    echo json_encode([
        "success" => true,
        "message" => "Test email successfully delivered to $to",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
