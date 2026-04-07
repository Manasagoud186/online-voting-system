/**
 * update-voter-dobs.js
 * Assigns random DOBs (ages 18-98) to all voters that currently have null date_of_birth
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

function randomDOB() {
    const today = new Date();
    // Pick a random age between 18 and 98
    const age = Math.floor(Math.random() * (98 - 18 + 1)) + 18;
    // Pick a random day within the year, up to today
    const birthYear = today.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12); // 0-11
    const maxDay = new Date(birthYear, birthMonth + 1, 0).getDate(); // days in month
    const birthDay = Math.floor(Math.random() * maxDay) + 1;
    const dob = new Date(birthYear, birthMonth, birthDay);
    // Return as YYYY-MM-DD string
    return dob.toISOString().split('T')[0];
}

async function run() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database');

        // Get all voters with null DOB
        const [voters] = await conn.query('SELECT id FROM voters WHERE date_of_birth IS NULL');
        console.log(`📋 Found ${voters.length} voters with missing DOB`);

        if (voters.length === 0) {
            console.log('✅ All voters already have a DOB. Nothing to update.');
            await conn.end();
            return;
        }

        let updated = 0;
        for (const voter of voters) {
            const dob = randomDOB();
            await conn.query('UPDATE voters SET date_of_birth = ? WHERE id = ?', [dob, voter.id]);
            updated++;
        }

        console.log(`✅ Successfully updated ${updated} voters with random DOBs (ages 18-98)`);

        // Verify
        const [sample] = await conn.query('SELECT id, name, date_of_birth FROM voters LIMIT 5');
        console.log('\n📊 Sample of updated voters:');
        sample.forEach(v => console.log(`  Voter #${v.id} - ${v.name}: ${v.date_of_birth}`));

        await conn.end();
        console.log('\n✅ Done!');

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (conn) await conn.end();
        process.exit(1);
    }
}

run();
