const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabase() {
    let conn = null;
    try {
        console.log('Connecting to MySQL...');
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        const dbName = process.env.DB_NAME || 'voting_system';
        console.log('Creating/Using database:', dbName);

        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await conn.query(`USE \`${dbName}\``);

        console.log('Creating tables...');

        await conn.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await conn.query(`
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
            )
        `);

        await conn.query(`
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
            )
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voter_id INT NOT NULL,
                candidate_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS election_control (
                id INT AUTO_INCREMENT PRIMARY KEY,
                status ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'CLOSED',
                start_time TIMESTAMP NULL,
                end_time TIMESTAMP NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Check if admin already exists
        const [existingAdmin] = await conn.query(
            'SELECT id FROM admins WHERE email = ?',
            ['admin@votehub.com']
        );

        if (existingAdmin.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await conn.query(
                'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                ['System Admin', 'admin@votehub.com', hash]
            );
            console.log('Default admin created.');
        } else {
            console.log('Admin already exists, skipping.');
        }

        // Seed election_control if empty
        const [electionRows] = await conn.query('SELECT COUNT(*) as count FROM election_control');
        if (electionRows[0].count === 0) {
            await conn.query("INSERT INTO election_control (status) VALUES ('CLOSED')");
            console.log('Election control seeded.');
        }

        console.log('');
        console.log('='.repeat(50));
        console.log('Database setup complete!');
        console.log('Database:', dbName);
        console.log('Admin Email:    admin@votehub.com');
        console.log('Admin Password: admin123');
        console.log('='.repeat(50));

        await conn.end();
        process.exit(0);

    } catch (error) {
        console.error('Database setup FAILED:', error.message);
        console.log('');
        console.log('Make sure your .env file has correct values for:');
        console.log('  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
        if (conn) await conn.end().catch(() => {});
        process.exit(1);
    }
}

setupDatabase();
