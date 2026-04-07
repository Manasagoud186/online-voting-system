

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    has_voted BOOLEAN DEFAULT 0,
    voted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255) NOT NULL,
    party_symbol VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    biography TEXT,
    experience TEXT,
    policies TEXT,
    image_url VARCHAR(255),
    votes INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    candidate_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS election_control (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'CLOSED',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default admin password is 'admin123'
INSERT INTO admins (name, email, password) 
VALUES ('System Admin', 'admin@votehub.com', '$2b$10$2HBxGUoYToX7Sv7GfBueCOK/BDIK4WNU6L1j9TNgFtCLjJ4YWEmKa')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO election_control (status) 
SELECT 'CLOSED' FROM DUAL 
WHERE NOT EXISTS (SELECT * FROM election_control);
