const fs = require('fs');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '7080',
    database: 'Online_Voting_System'
});

async function importVoters() {
    try {
        // Read CSV file
        const fileContent = fs.readFileSync('voters.csv', 'utf-8');
        const lines = fileContent.split('\n');
        
        // Skip header row
        const records = lines.slice(1).filter(line => line.trim().length > 0);

        console.log(`📥 Found ${records.length} voters to import...\n`);

        const conn = await pool.getConnection();

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const line of records) {
            try {
                // Parse CSV line
                const [name, email, password, hasVoted] = line.split(',').map(v => v.trim());

                if (!name || !email || !password) {
                    console.log(`❌ INVALID: Missing data in line: ${line}`);
                    errors++;
                    continue;
                }

                // Check if already exists
                const [existing] = await conn.query(
                    "SELECT id FROM voters WHERE email = ?",
                    [email.toLowerCase()]
                );

                if (existing.length > 0) {
                    console.log(`⏭️  SKIPPED: ${email} (already exists)`);
                    skipped++;
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert
                await conn.query(
                    `INSERT INTO voters (name, email, password, date_of_birth, phone, has_voted, created_at) 
                     VALUES (?, ?, ?, NULL, NULL, 0, NOW())`,
                    [name, email.toLowerCase(), hashedPassword]
                );

                console.log(`✅ Imported: ${email}`);
                imported++;

            } catch (error) {
                console.log(`❌ ERROR: ${error.message}`);
                errors++;
            }
        }

        conn.release();

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 IMPORT COMPLETE!`);
        console.log(`✅ Imported: ${imported}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`${'='.repeat(50)}\n`);

        process.exit(0);

    } catch (error) {
        console.error('❌ FATAL ERROR:', error.message);
        process.exit(1);
    }
}

importVoters();