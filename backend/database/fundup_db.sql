-- FundUp Database Schema
-- Developed by Group CST20

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS fundup_db;
USE fundup_db;

-- 1. University Domains Lookup Table (For automatic organizer verification)
CREATE TABLE IF NOT EXISTS university_domains (
    domainID INT AUTO_INCREMENT PRIMARY KEY,
    universityName VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS Users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phoneNo VARCHAR(20),
    role ENUM('DONOR', 'ORGANIZER', 'ADMIN') NOT NULL,
    profilePhoto VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED') DEFAULT 'ACTIVE',
    statusReason TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Donors Table
CREATE TABLE IF NOT EXISTS Donors (
    donorID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT UNIQUE NOT NULL,
    badgeLevel ENUM('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'NONE',
    totalDonation DECIMAL(15, 2) DEFAULT 0.00,
    bio TEXT DEFAULT NULL,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Organizers Table
CREATE TABLE IF NOT EXISTS Organizers (
    organizerID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT UNIQUE NOT NULL,
    organizationName VARCHAR(255) NOT NULL,
    universityName VARCHAR(255) NOT NULL,
    verificationStatus ENUM('PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED') DEFAULT 'PENDING',
    verifiedDate DATETIME DEFAULT NULL,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Organizer Verification Documents Table
CREATE TABLE IF NOT EXISTS OrganizerVerifications (
    verificationID INT AUTO_INCREMENT PRIMARY KEY,
    organizerID INT NOT NULL,
    approvalLetterPath VARCHAR(255) NOT NULL,
    studentIdPath VARCHAR(255) NOT NULL,
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approvalStatus ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    reviewDate DATETIME DEFAULT NULL,
    remarks TEXT,
    reviewedBy INT DEFAULT NULL,
    FOREIGN KEY (organizerID) REFERENCES Organizers(organizerID) ON DELETE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES Users(userID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Projects Table
CREATE TABLE IF NOT EXISTS Projects (
    projectID INT AUTO_INCREMENT PRIMARY KEY,
    organizerID INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    shortSummary VARCHAR(500) NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    targetAmount DECIMAL(15, 2) NOT NULL,
    collectedAmount DECIMAL(15, 2) DEFAULT 0.00,
    progressPercent INT DEFAULT 0,
    bannerImage VARCHAR(255),
    status ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'APPROVED', 'REMOVED', 'REJECTED') DEFAULT 'ACTIVE',
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    socialMediaLink VARCHAR(100),
    proposalPdfPath VARCHAR(255),
    FOREIGN KEY (organizerID) REFERENCES Organizers(organizerID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Project Media Table
CREATE TABLE IF NOT EXISTS ProjectMedia (
    mediaID INT AUTO_INCREMENT PRIMARY KEY,
    projectID INT NOT NULL,
    mediaType ENUM('IMAGE', 'VIDEO') NOT NULL,
    mediaPaths TEXT NOT NULL,
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectID) REFERENCES Projects(projectID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Donations Table
CREATE TABLE IF NOT EXISTS Donations (
    donationID INT AUTO_INCREMENT PRIMARY KEY,
    donorID INT NOT NULL,
    projectID INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    donationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paymentMethod ENUM('ONLINE', 'BANK_SLIP') NOT NULL,
    recognitionRequired BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'APPROVED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    FOREIGN KEY (donorID) REFERENCES Donors(donorID),
    FOREIGN KEY (projectID) REFERENCES Projects(projectID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Payments Table (Gateway Online Payments)
CREATE TABLE IF NOT EXISTS Payments (
    paymentID INT AUTO_INCREMENT PRIMARY KEY,
    donationID INT NOT NULL,
    transactionID VARCHAR(255) UNIQUE NOT NULL,
    paymentGateway VARCHAR(50) NOT NULL,
    paymentStatus VARCHAR(50) NOT NULL,
    paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationID) REFERENCES Donations(donationID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Payment Slips Table (Manual Slip Uploads)
CREATE TABLE IF NOT EXISTS PaymentSlips (
    slipID INT AUTO_INCREMENT PRIMARY KEY,
    donationID INT NOT NULL,
    imagePath VARCHAR(255) NOT NULL,
    uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verificationStatus ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    verifiedByOrganizerID INT DEFAULT NULL,
    verifiedDate DATETIME DEFAULT NULL,
    FOREIGN KEY (donationID) REFERENCES Donations(donationID) ON DELETE CASCADE,
    FOREIGN KEY (verifiedByOrganizerID) REFERENCES Organizers(organizerID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Recognitions Table (Donor appreciation and advertisements)
CREATE TABLE IF NOT EXISTS Recognitions (
    recognitionID INT AUTO_INCREMENT PRIMARY KEY,
    donationID INT NOT NULL,
    badgeAwarded ENUM('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'NONE',
    socialMediaPromotion BOOLEAN DEFAULT FALSE,
    bannerPromotion BOOLEAN DEFAULT FALSE,
    description TEXT,
    approvalStatus ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    FOREIGN KEY (donationID) REFERENCES Donations(donationID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Progress Updates Table (Organizer posting updates of project) changed  progressPercent INT DEFAULT 0,milestone VARCHAR(255) DEFAULT NULL,

CREATE TABLE IF NOT EXISTS ProgressUpdates (
    updateID INT AUTO_INCREMENT PRIMARY KEY,
    projectID INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    imagePaths TEXT DEFAULT NULL,
    videoPaths TEXT DEFAULT NULL,
    progressPercent INT DEFAULT 0,
    milestone VARCHAR(255) DEFAULT NULL,
    updateDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectID) REFERENCES Projects(projectID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Reports Table
CREATE TABLE IF NOT EXISTS Reports (
    reportID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    projectID INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    reportDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'VALID', 'INVALID', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
    reviewedBy INT DEFAULT NULL,
    adminNotes TEXT DEFAULT NULL,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE,
    FOREIGN KEY (projectID) REFERENCES Projects(projectID) ON DELETE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES Users(userID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Commercializations Table (Commercial Sponsorship Ads for donations >= 100,000)
CREATE TABLE IF NOT EXISTS Commercializations (
    commercialID INT AUTO_INCREMENT PRIMARY KEY,
    donationID INT NOT NULL,
    companyName VARCHAR(255) NOT NULL,
    websiteLink VARCHAR(500) DEFAULT NULL,
    mediaPath VARCHAR(255) NOT NULL,
    mediaType ENUM('IMAGE', 'VIDEO') NOT NULL,
    approvalStatus ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationID) REFERENCES Donations(donationID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE comments (
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    comment TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comments_user
        FOREIGN KEY (userID)
        REFERENCES Users(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 16. Moderation History Table
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


CREATE TABLE password_resets (
    resetID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    tokenHash VARCHAR(64) NOT NULL,
    expiresAt DATETIME NOT NULL,
    usedAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);



INSERT INTO university_domains (universityName, domain) VALUES
('Uva Wellassa University', '@std.uwu.ac.lk'),
('University of Colombo', '@cmb.ac.lk'),
('University of Peradeniya', '@pdn.ac.lk'),
( 'University of Moratuwa', '@uom.lk'),
( 'University of Sri Jayewardenepura', '@sjp.ac.lk'),
( 'University of Kelaniya', '@kln.ac.lk'),
( 'University of Ruhuna', '@ruh.ac.lk'),
( 'Eastern University, Sri Lanka', '@esn.ac.lk'),
( 'South Eastern University of Sri Lanka', '@seu.ac.lk'),
( 'Sabaragamuwa University of Sri Lanka', '@sab.ac.lk'),
( 'Wayamba University of Sri Lanka', '@wyb.ac.lk'),
( 'Rajarata University of Sri Lanka', '@rjt.ac.lk'),
('University of Jaffna', '@jfn.ac.lk'),
( 'University of Vavuniya', '@vau.ac.lk'),
( 'Open University of Sri Lanka', '@ou.ac.lk'),
( 'University of the Visual and Performing Arts', '@vpa.ac.lk');


INSERT INTO Users
(
    fullName,
    email,
    password,
    role,
    status
)
VALUES
(
    'System Admin',
    'admin@fundup.com',
    '$2y$10$8XaLr7.7CfFKKqz/fxtbaepgO3Dp4So6qtIKcT7FpLwu5Uf/rRXkm',
    'ADMIN',
    'ACTIVE'
);
