const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function verifyPassword() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [rows] = await conn.query('SELECT password FROM voters WHERE email = "voter6@test.com"');
    if (rows.length > 0) {
        const hash = rows[0].password;
        const match = await bcrypt.compare('123456', hash);
        console.log('Password match for voter6@test.com (123456):', match);
        
        if (!match) {
            const newHash = await bcrypt.hash('123456', 10);
            await conn.query('UPDATE voters SET password = ? WHERE email = "voter6@test.com"', [newHash]);
            console.log('Password reset to 123456 for voter6@test.com');
        }
    } else {
        console.log('Voter not found');
    }
    
    await conn.end();
}

verifyPassword().catch(console.error);
