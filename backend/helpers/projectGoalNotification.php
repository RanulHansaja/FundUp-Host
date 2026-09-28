<?php

function notifyProjectGoalReached($conn, $organizerUserID, $projectTitle, $targetAmount)
{
    $notificationTitle = "Project Goal Reached";
    $notificationMessage = "Congratulations! Your project '" . $projectTitle . "' has reached its fundraising goal of Rs. " . number_format($targetAmount, 2) . ".";

    $stmtExisting = $conn->prepare("SELECT notificationID FROM Notifications WHERE userID = ? AND title = ? AND message = ? LIMIT 1");
    $stmtExisting->bind_param("iss", $organizerUserID, $notificationTitle, $notificationMessage);
    $stmtExisting->execute();
    $existingResult = $stmtExisting->get_result();
    $stmtExisting->close();

    if ($existingResult->num_rows === 0) {
        $stmtNotification = $conn->prepare("INSERT INTO Notifications (userID, title, message) VALUES (?, ?, ?)");
        $stmtNotification->bind_param("iss", $organizerUserID, $notificationTitle, $notificationMessage);
        if (!$stmtNotification->execute()) {
            throw new Exception("Failed to create project goal notification.");
        }
        $stmtNotification->close();
    }
}