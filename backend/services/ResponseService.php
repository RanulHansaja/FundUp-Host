<?php

/**
 * Standardized Centralized API Response Service.
 * Ensures consistent JSON responses across all FundUp endpoints.
 */
class Response {
    /**
     * Send a successful JSON response.
     *
     * @param mixed $data Data payload to return to the client
     * @param string $message User-friendly message
     * @param int $code HTTP status code (default 200)
     */
    public static function success($data = null, string $message = "Success", int $code = 200): void {
        http_response_code($code);
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
        }
        $payload = [
            "success" => true,
            "message" => $message
        ];
        if ($data !== null) {
            $payload["data"] = $data;
        }
        echo json_encode($payload);
        exit();
    }

    /**
     * Send an error JSON response.
     *
     * @param string $message Error description
     * @param int $code HTTP error code (default 400 Bad Request)
     * @param mixed $errors Optional field-level error details
     */
    public static function error(string $message = "An error occurred", int $code = 400, $errors = null): void {
        http_response_code($code);
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
        }
        $payload = [
            "success" => false,
            "message" => $message
        ];
        if ($errors !== null) {
            $payload["errors"] = $errors;
        }
        echo json_encode($payload);
        exit();
    }

    /**
     * Send a 401 Unauthorized response.
     */
    public static function unauthorized(string $message = "Authentication required. Please log in."): void {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response.
     */
    public static function forbidden(string $message = "Access denied. You do not have permission."): void {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found response.
     */
    public static function notFound(string $message = "Resource not found."): void {
        self::error($message, 404);
    }
}
