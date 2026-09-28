<?php

/**
 * Checks if the email domain is associated with a registered university.
 * 
 * @param string $email The email address to check
 * @param mysqli $conn The mysqli database connection
 * @return array|bool Returns the university domain database row if matched, false otherwise.
 */
function checkEmailDomain($email, $conn) {
    $at_pos = strrpos($email, '@');
    if ($at_pos === false) {
        return false;
    }
    
    $domain = substr($email, $at_pos);
    $domain = strtolower(trim($domain));

    $stmt = $conn->prepare("SELECT * FROM university_domains WHERE LOWER(domain) = ?");
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("s", $domain);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row;
    }
    
    return false;
}
