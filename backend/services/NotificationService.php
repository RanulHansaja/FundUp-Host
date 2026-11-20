<?php

/**
 * Centralized Notification and Messaging Service.
 * Manages in-app database notifications and email dispatches.
 */
class NotificationService {
    /**
     * Send an in-app database notification to a user.
     *
     * @param mysqli $conn Active database connection
     * @param int $userID Target recipient user ID
     * @param string $message Notification body text
     * @param string $type Notification type category (e.g. 'DONATION', 'APPROVAL', 'PROJECT', 'SYSTEM')
     * @return bool True if created successfully
     */
    public static function createInApp(mysqli $conn, int $userID, string $message, string $type = 'SYSTEM'): bool {
        $stmt = $conn->prepare("INSERT INTO notifications (userID, message, isRead, createdAt) VALUES (?, ?, 0, NOW())");
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param("is", $userID, $message);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    /**
     * Sends an email notification using PHPMailer.
     *
     * @param string $toEmail Recipient email address
     * @param string $toName Recipient display name
     * @param string $subject Email subject line
     * @param string $htmlBody HTML content
     * @return bool True on success
     */
    public static function sendEmail(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
        try {
            if (file_exists(__DIR__ . '/../helpers/MailHelper.php')) {
                require_once __DIR__ . '/../helpers/MailHelper.php';
            }
            if (function_exists('getMailerInstance')) {
                $mail = getMailerInstance();
                $mail->addAddress($toEmail, $toName);
                $mail->isHTML(true);
                $mail->Subject = $subject;
                $mail->Body = $htmlBody;
                return $mail->send();
            }
            return false;
        } catch (Throwable $e) {
            error_log("NotificationService Email Error: " . $e->getMessage());
            return false;
        }
    }
}
