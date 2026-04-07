const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    await conn.query(`USE \`${process.env.DB_NAME}\``);

    // Find voters whose password is NOT a proper bcrypt hash (not 60 chars starting with $2b$)
    const [rows] = await conn.query(
        "SELECT id, email, LENGTH(password) as pwd_len, LEFT(password, 4) as pwd_start FROM voters WHERE LENGTH(password) != 60 OR password NOT LIKE '$2%'"
    );

    console.log('Voters with non-bcrypt passwords:', rows.length);
    rows.slice(0, 10).forEach(r =>
        console.log(` ID:${r.id} | ${r.email} | start:${r.pwd_start} | len:${r.pwd_len}`)
    );

    const [total] = await conn.query('SELECT COUNT(*) as n FROM voters');
    console.log('Total voters in DB:', total[0].n);

    await conn.end();
})().catch(e => console.error('ERROR:', e.message));
