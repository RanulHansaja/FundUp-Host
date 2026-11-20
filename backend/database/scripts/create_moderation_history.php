<?php
require_once __DIR__ . "/../../config/db.php";
$query = "
CREATE TABLE IF NOT EXISTS moderation_history (
    historyID INT AUTO_INCREMENT PRIMARY KEY,
    projectID INT DEFAULT NULL,
    targetUserID INT DEFAULT NULL,
    adminID INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectID) REFERENCES Projects(projectID) ON DELETE CASCADE,
    FOREIGN KEY (targetUserID) REFERENCES Users(userID) ON DELETE CASCADE,
    FOREIGN KEY (adminID) REFERENCES Users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
if ($conn->query($query)) {
    echo "Table created successfully.";
} else {
    echo "Error creating table: " . $conn->error;
}
?>
