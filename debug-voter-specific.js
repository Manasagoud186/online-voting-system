const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSpecificVoter() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [rows] = await conn.query('SELECT id, name, email FROM voters WHERE email = "voter6@test.com"');
    if (rows.length > 0) {
        console.log('FOUND:', rows[0]);
    } else {
        console.log('NOT FOUND: voter6@test.com');
    }
    
    await conn.end();
}

checkSpecificVoter().catch(console.error);
