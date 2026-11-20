<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

/**
 * Creates and configures a reusable PHPMailer instance.
 * 
 * @return PHPMailer
 */
function getMailerInstance() {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        throw new \Exception("PHPMailer library not found or vendor autoload missing");
    }
    $mail = new PHPMailer(true);
    
    $smtpUser = getenv('SMTP_USER') ?: 'ranulhansaja414@gmail.com';
    $smtpPass = getenv('SMTP_PASS') ?: '';
    $smtpHost = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
    $smtpPort = (int)(getenv('SMTP_PORT') ?: 587);

    // Server settings
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpPort;
    $mail->CharSet    = 'UTF-8';
    
    // Default From address
    $mail->setFrom($smtpUser, 'FundUp Team');
    
    return $mail;
}

/**
 * Sends an email notification to an approved organizer.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendOrganizerApprovedEmail($recipientEmail, $recipientName) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp - Organizer Account Approved';
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp - Organizer Account Approved</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content h2 { margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15); }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <h2>Hello, ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . '!</h2>
            <p>We are pleased to inform you that your organizer registration for FundUp has been <strong>approved</strong> by our administration team!</p>
            <p>You can now log into your account, access the organizer dashboard, and start creating fundraising projects to make a difference.</p>
            <div class="button-container">
                <a href="http://localhost:5173/login" class="button" style="color: #ffffff;">Go to Dashboard</a>
            </div>
            <p>Best regards,<br><strong>FundUp Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Hello " . $recipientName . ",\n\n" .
                     "We are pleased to inform you that your organizer registration for FundUp has been approved by our administration team!\n\n" .
                     "You can now log into your account, access the organizer dashboard, and start creating fundraising projects to make a difference.\n\n" .
                     "Go to Dashboard: http://localhost:5173/login\n\n" .
                     "Best regards,\n" .
                     "FundUp Team";

    return $mail->send();
}

/**
 * Sends an email notification to a rejected organizer.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $remarks
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendOrganizerRejectedEmail($recipientEmail, $recipientName, $remarks) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp - Organizer Registration Rejected';
    
    $remarksSection = '';
    if (!empty(trim($remarks))) {
        $remarksSection = '
            <div class="remarks-box">
                <div class="remarks-title">Administrator Comments:</div>
                <div class="remarks-content">' . nl2br(htmlspecialchars($remarks, ENT_QUOTES, 'UTF-8')) . '</div>
            </div>';
    }

    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp - Organizer Registration Rejected</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content h2 { margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .remarks-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .remarks-title { font-weight: 600; color: #991b1b; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .remarks-content { color: #7f1d1d; font-size: 15px; line-height: 1.5; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15); }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <h2>Hello, ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . '!</h2>
            <p>Thank you for registering as an organizer on FundUp. After reviewing your application, unfortunately, our administration team has rejected your registration at this time.</p>
            ' . $remarksSection . '
            <p>We politely request you to review the issues mentioned above, make any necessary corrections, and register again.</p>
            <div class="button-container">
                <a href="http://localhost:5173/register" class="button" style="color: #ffffff;">Register Again</a>
            </div>
            <p>Best regards,<br><strong>FundUp Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $plainTextRemarks = '';
    if (!empty(trim($remarks))) {
        $plainTextRemarks = "Administrator Comments:\n---------------------\n" . $remarks . "\n\n";
    }
    
    $mail->AltBody = "Hello " . $recipientName . ",\n\n" .
                     "Thank you for registering as an organizer on FundUp. After reviewing your application, unfortunately, our administration team has rejected your registration at this time.\n\n" .
                     $plainTextRemarks .
                     "We politely request you to review the issues mentioned above, make any necessary corrections, and register again.\n\n" .
                     "Register Again: http://localhost:5173/register\n\n" .
                     "Best regards,\n" .
                     "FundUp Team";

    return $mail->send();
}

/**
 * Sends a password reset email notification.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $resetLink
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendPasswordResetEmail($recipientEmail, $recipientName, $resetLink) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp - Password Reset Request';
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp - Password Reset Request</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content h2 { margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15); }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
        .warning { font-size: 13px; color: #ef4444; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <h2>Hello, ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . '!</h2>
            <p>We received a request to reset your password for your FundUp account. Click the button below to set a new password:</p>
            <div class="button-container">
                <a href="' . htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8') . '" class="button" style="color: #ffffff;">Reset Password</a>
            </div>
            <p><strong>This reset link will expire in 15 minutes.</strong></p>
            <p class="warning">If you did not request this password reset, please ignore this email or contact support if you have concerns. Your password will remain unchanged.</p>
            <p>Best regards,<br><strong>FundUp Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Hello " . $recipientName . ",\n\n" .
                     "We received a request to reset your password for your FundUp account. Please use the link below to reset your password:\n\n" .
                     $resetLink . "\n\n" .
                     "This reset link will expire in 15 minutes.\n\n" .
                     "If you did not request this reset, please ignore this email. Your password will remain unchanged.\n\n" .
                     "Best regards,\n" .
                     "FundUp Team";

    return $mail->send();
}

/**
 * Sends an email notification to an organizer whose project is suspended.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $projectName
 * @param string $adminNotes
 * @param string $adminEmail
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendProjectSuspendedEmail($recipientEmail, $recipientName, $projectName, $adminNotes, $adminEmail) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Your Project Has Been Temporarily Suspended';
    
    $adminNotesFormatted = nl2br(htmlspecialchars($adminNotes, ENT_QUOTES, 'UTF-8'));
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Project Suspended</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content h2 { margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .notes-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .notes-title { font-weight: 600; color: #92400e; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .notes-content { color: #78350f; font-size: 15px; line-height: 1.5; }
        .contact-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; margin: 25px 0; border-radius: 8px; text-align: center; }
        .contact-email { font-weight: bold; color: #4f46e5; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <h2>Dear Valued Organizer,</h2>
            <p>We are writing to inform you that your project "<strong>' . htmlspecialchars($projectName, ENT_QUOTES, 'UTF-8') . '</strong>" has currently been suspended by the FundUp administration team.</p>
            
            <div class="notes-box">
                <div class="notes-title">Reason for suspension:</div>
                <div class="notes-content">' . $adminNotesFormatted . '</div>
            </div>
            
            <p>We kindly request you to review the issue mentioned above and make the necessary changes to your project to address the reason for the suspension.</p>
            
            <p>Once the necessary changes have been completed, please send an email to the FundUp administrator at:</p>
            
            <div class="contact-box">
                <span class="contact-email">' . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') . '</span>
            </div>
            
            <p>requesting approval to restore your project. Please include any relevant evidence or supporting documents/proofs that demonstrate that the issue has been resolved.</p>
            
            <p>We appreciate your cooperation and your commitment to maintaining the quality and integrity of the FundUp platform.</p>
            
            <p>Best regards,<br><strong>FundUp Administration Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear Valued Organizer,\n\n" .
                     "We are writing to inform you that your project \"" . $projectName . "\" has currently been suspended by the FundUp administration team.\n\n" .
                     "Reason for suspension:\n" .
                     $adminNotes . "\n\n" .
                     "We kindly request you to review the issue mentioned above and make the necessary changes to your project to address the reason for the suspension.\n\n" .
                     "Once the necessary changes have been completed, please send an email to the FundUp administrator at:\n" .
                     $adminEmail . "\n\n" .
                     "requesting approval to restore your project.\n\n" .
                     "Please include any relevant evidence or supporting documents/proofs that demonstrate that the issue has been resolved.\n\n" .
                     "We appreciate your cooperation and your commitment to maintaining the quality and integrity of the FundUp platform.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}

/**
 * Sends an email notification to an organizer whose project is permanently rejected.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $projectName
 * @param string $adminNotes
 * @param string $adminEmail
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendProjectRejectedEmail($recipientEmail, $recipientName, $projectName, $adminNotes, $adminEmail) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Your Project Has Been Permanently Rejected';
    
    $adminNotesFormatted = nl2br(htmlspecialchars($adminNotes, ENT_QUOTES, 'UTF-8'));
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Project Permanently Rejected</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content h2 { margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .notes-box { background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .notes-title { font-weight: 600; color: #9f1239; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .notes-content { color: #881337; font-size: 15px; line-height: 1.5; }
        .contact-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; margin: 25px 0; border-radius: 8px; text-align: center; }
        .contact-email { font-weight: bold; color: #4f46e5; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <h2>Dear Valued Organizer,</h2>
            <p>We regret to inform you that your project "<strong>' . htmlspecialchars($projectName, ENT_QUOTES, 'UTF-8') . '</strong>" has been permanently rejected by the FundUp administration team.</p>
            
            <div class="notes-box">
                <div class="notes-title">Reason for rejection:</div>
                <div class="notes-content">' . $adminNotesFormatted . '</div>
            </div>
            
            <p>The issue identified above has been considered a critical violation of the requirements or standards of the FundUp platform, and therefore the project cannot continue on the platform.</p>
            
            <p>We understand that this may be disappointing, and we appreciate your understanding and cooperation with the FundUp community guidelines.</p>
            
            <p>If you believe this decision was made in error or you require further clarification, you may contact the FundUp administration team at:</p>
            
            <div class="contact-box">
                <span class="contact-email">' . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') . '</span>
            </div>
            
            <p>Please ensure that any communication regarding this decision clearly explains your concern and includes relevant supporting evidence where appropriate.</p>
            
            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br><strong>FundUp Administration Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear Valued Organizer,\n\n" .
                     "We regret to inform you that your project \"" . $projectName . "\" has been permanently rejected by the FundUp administration team.\n\n" .
                     "Reason for rejection:\n" .
                     $adminNotes . "\n\n" .
                     "The issue identified above has been considered a critical violation of the requirements or standards of the FundUp platform, and therefore the project cannot continue on the platform.\n\n" .
                     "We understand that this may be disappointing, and we appreciate your understanding and cooperation with the FundUp community guidelines.\n\n" .
                     "If you believe this decision was made in error or you require further clarification, you may contact the FundUp administration team at:\n" .
                     $adminEmail . "\n\n" .
                     "Please ensure that any communication regarding this decision clearly explains your concern and includes relevant supporting evidence where appropriate.\n\n" .
                     "Thank you for your understanding.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}

/**
 * Sends an email notification to a suspended user.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $statusReason
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendUserSuspendedEmail($recipientEmail, $recipientName, $statusReason, $adminEmail) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Your Account Has Been Temporarily Suspended';
    
    $statusReasonFormatted = nl2br(htmlspecialchars($statusReason, ENT_QUOTES, 'UTF-8'));
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Your Account Has Been Temporarily Suspended</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .notes-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .notes-content { color: #78350f; font-size: 15px; line-height: 1.5; }
        .contact-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; margin: 25px 0; border-radius: 8px; text-align: center; }
        .contact-email { font-weight: bold; color: #4f46e5; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . ',</p>
            <p>We are writing to inform you that your FundUp account has been temporarily suspended by the FundUp administration team.</p>
            
            <p>Reason for suspension:</p>
            <div class="notes-box">
                <div class="notes-content">' . $statusReasonFormatted . '</div>
            </div>
            
            <p>We kindly request you to review and correct the issue mentioned above.</p>
            <p>If you have corrected the issue and would like to request the reinstatement/approval of your account, please send an email to the FundUp administration team at:</p>
            
            <div class="contact-box">
                <span class="contact-email">' . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') . '</span>
            </div>
            
            <p>Please include relevant proofs or supporting evidence demonstrating that the issue has been corrected.</p>
            <p>Our administration team will review your request and the provided evidence accordingly.</p>
            <p>We appreciate your understanding and cooperation.</p>
            <p>Best regards,<br>FundUp Administration Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear " . $recipientName . ",\n\n" .
                     "We are writing to inform you that your FundUp account has been temporarily suspended by the FundUp administration team.\n\n" .
                     "Reason for suspension:\n\n" .
                     $statusReason . "\n\n" .
                     "We kindly request you to review and correct the issue mentioned above.\n\n" .
                     "If you have corrected the issue and would like to request the reinstatement/approval of your account, please send an email to the FundUp administration team at:\n\n" .
                     $adminEmail . "\n\n" .
                     "Please include relevant proofs or supporting evidence demonstrating that the issue has been corrected.\n\n" .
                     "Our administration team will review your request and the provided evidence accordingly.\n\n" .
                     "We appreciate your understanding and cooperation.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}

/**
 * Sends an email notification to a permanently blocked/removed user.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $statusReason
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendUserBlockedEmail($recipientEmail, $recipientName, $statusReason) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Your Account Has Been Permanently Blocked';
    
    $statusReasonFormatted = nl2br(htmlspecialchars($statusReason, ENT_QUOTES, 'UTF-8'));
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Your Account Has Been Permanently Blocked</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .notes-box { background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .notes-content { color: #881337; font-size: 15px; line-height: 1.5; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . ',</p>
            <p>We regret to inform you that your FundUp account has been permanently blocked by the FundUp administration team.</p>
            
            <p>Reason for this action:</p>
            <div class="notes-box">
                <div class="notes-content">' . $statusReasonFormatted . '</div>
            </div>
            
            <p>As a result of this action, your account will no longer be permitted to access or use the FundUp platform.</p>
            <p>If you believe this decision was made in error or you would like to request further clarification, please contact the FundUp administration team and provide any relevant information or supporting evidence.</p>
            <p>We appreciate your understanding.</p>
            <p>Best regards,<br>FundUp Administration Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear " . $recipientName . ",\n\n" .
                     "We regret to inform you that your FundUp account has been permanently blocked by the FundUp administration team.\n\n" .
                     "Reason for this action:\n\n" .
                     $statusReason . "\n\n" .
                     "As a result of this action, your account will no longer be permitted to access or use the FundUp platform.\n\n" .
                     "If you believe this decision was made in error or you would like to request further clarification, please contact the FundUp administration team and provide any relevant information or supporting evidence.\n\n" .
                     "We appreciate your understanding.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}

/**
 * Sends an email notification to a reinstated user.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendUserReinstatedEmail($recipientEmail, $recipientName) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Your Account Has Been Reinstated';
    
    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Your Account Has Been Reinstated</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . ',</p>
            <p>We are pleased to inform you that the FundUp administration team has reviewed the proofs and supporting evidence you submitted regarding your suspended account.</p>
            <p>After reviewing the provided information, we have accepted your proofs and confirmed that the issue has been appropriately addressed.</p>
            <p>Your FundUp account has now been reinstated, and you can access and use your account as usual.</p>
            <p>Thank you for taking the necessary steps to resolve the issue and for your cooperation with the FundUp administration team.</p>
            <p>We welcome you back to the FundUp community and appreciate your continued commitment to following the platform\'s guidelines.</p>
            <p>Best regards,<br>FundUp Administration Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear " . $recipientName . ",\n\n" .
                     "We are pleased to inform you that the FundUp administration team has reviewed the proofs and supporting evidence you submitted regarding your suspended account.\n\n" .
                     "After reviewing the provided information, we have accepted your proofs and confirmed that the issue has been appropriately addressed.\n\n" .
                     "Your FundUp account has now been reinstated, and you can access and use your account as usual.\n\n" .
                     "Thank you for taking the necessary steps to resolve the issue and for your cooperation with the FundUp administration team.\n\n" .
                     "We welcome you back to the FundUp community and appreciate your continued commitment to following the platform's guidelines.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}

/**
 * Sends an email notification to a donor when their payment slip is rejected.
 * 
 * @param string $recipientEmail
 * @param string $recipientName
 * @param string $projectName
 * @param string|null $rejectionReason
 * @return bool True on success
 * @throws Exception If email sending fails
 */
function sendPaymentSlipRejectedEmail($recipientEmail, $recipientName, $projectName, $rejectionReason = null) {
    $mail = getMailerInstance();
    $mail->addAddress($recipientEmail, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = 'FundUp – Notification Regarding Your Submitted Payment Slip';
    
    $reasonHtml = '';
    $reasonText = '';
    if (!empty($rejectionReason)) {
        $reasonHtml = '
            <p>Reason provided by the organizer:</p>
            <div class="notes-box">
                <div class="notes-content">' . nl2br(htmlspecialchars($rejectionReason, ENT_QUOTES, 'UTF-8')) . '</div>
            </div>';
        $reasonText = "Reason provided by the organizer:\n" . $rejectionReason . "\n\n";
    }

    // HTML Template
    $body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FundUp – Notification Regarding Your Submitted Payment Slip</title>
    <style>
        body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f6; }
        .header { background: linear-gradient(135deg, #475569 0%, #1e293b 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .content p { font-size: 16px; margin-bottom: 24px; color: #475569; }
        .notes-box { background-color: #f8fafc; border-left: 4px solid #64748b; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .notes-content { color: #334155; font-size: 15px; line-height: 1.5; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #ffffff; margin: 0;">FundUp</h1>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8') . ',</p>
            <p>We are writing to inform you that the payment slip you submitted in connection with your donation to "' . htmlspecialchars($projectName, ENT_QUOTES, 'UTF-8') . '" has been rejected following review by the project organizer.</p>
            <p>The submitted payment slip could not be accepted as valid confirmation of the donation.</p>
            ' . $reasonHtml . '
            <p>If you wish to proceed with the donation, we kindly recommend you to send the valid and correct payment slip again through a new payment submission on the FundUp platform.</p>
            <p>We sincerely appreciate your understanding and your willingness to support the FundUp community.</p>
            <p>Best regards,<br>FundUp Administration Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 FundUp. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>';

    $mail->Body = $body;
    
    // Plain text alternative
    $mail->AltBody = "Dear " . $recipientName . ",\n\n" .
                     "We are writing to inform you that the payment slip you submitted in connection with your donation to \"" . $projectName . "\" has been rejected following review by the project organizer.\n\n" .
                     "The submitted payment slip could not be accepted as valid confirmation of the donation.\n\n" .
                     $reasonText .
                     "If you wish to proceed with the donation, we kindly recommend you to send the valid and correct payment slip again through a new payment submission on the FundUp platform.\n\n" .
                     "We sincerely appreciate your understanding and your willingness to support the FundUp community.\n\n" .
                     "Best regards,\n" .
                     "FundUp Administration Team";

    return $mail->send();
}




