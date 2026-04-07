const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkVoters() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [rows] = await conn.query('SELECT id, name, email, has_voted FROM voters');
    console.log('VOTERS IN DATABASE:');
    rows.forEach(r => console.log(`- ${r.id}: ${r.name} (${r.email}) | Has Voted: ${r.has_voted}`));
    
    await conn.end();
}

checkVoters().catch(console.error);
