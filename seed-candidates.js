const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedCandidates() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    await conn.query(`USE \`${process.env.DB_NAME}\``);

    // Clear everything for a clean slate
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('TRUNCATE TABLE votes');
    await conn.query('TRUNCATE TABLE candidates');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // Reset voter votes
    await conn.query('UPDATE voters SET has_voted = 0, voted_at = NULL');

    const candidates = [
        {
            name: 'Kalvakuntla Chandrashekhar Rao',
            party: 'Bharat Rashtra Samithi (BRS)',
            party_symbol: '🚗',
            email: 'kcr@brs.in',
            phone: '9800000001',
            biography: 'Founder of Telangana state and former Chief Minister with a focus on farm welfare, irrigation projects, and Dalit empowerment.',
            experience: '15 years as Chief Minister, chief architect of Telangana state formation',
            policies: 'Rythu Bandhu farm income support, Mission Bhagiratha water, Dalit Bandhu scheme, KCR Kit welfare',
            image_url: 'https://via.placeholder.com/200/FF6B35/ffffff?text=KCR'
        },
        {
            name: 'Anumula Revanth Reddy',
            party: 'Indian National Congress (INC)',
            party_symbol: '✋',
            email: 'revanth.reddy@inc.in',
            phone: '9800000002',
            biography: 'Current Chief Minister of Telangana, youth leader and Senior Congress politician known for grassroots political work and farmer advocacy.',
            experience: 'Current CM of Telangana, multiple terms as MP and MLA, State Congress President',
            policies: 'Six guarantees scheme, free bus travel for women, farm loan waiver, unemployment support',
            image_url: 'https://via.placeholder.com/200/19A83B/ffffff?text=Revanth'
        },
        {
            name: 'N. Ramchander Rao',
            party: 'Bharatiya Janata Party (BJP)',
            party_symbol: '🪷',
            email: 'nramchander@bjp.in',
            phone: '9800000003',
            biography: 'Senior BJP leader in Telangana with decades of grassroots political work, focused on development and national integration.',
            experience: '20+ years as BJP leader in Telangana, multiple election campaigns',
            policies: 'National development, infrastructure growth, Make in India, religious harmony, national security',
            image_url: 'https://via.placeholder.com/200/FF9933/ffffff?text=NRR'
        },
        {
            name: 'Goda Koushik Reddy',
            party: 'Independent',
            party_symbol: '⭐',
            email: 'koushik.reddy@independent.in',
            phone: '9800000004',
            biography: 'Independent candidate fighting for local constituency issues including water supply, road infrastructure, and youth employment.',
            experience: 'Local governance work, community leader, youth activist',
            policies: 'Local constituency development, youth employment, clean water access, road infrastructure',
            image_url: 'https://via.placeholder.com/200/6C5CE7/ffffff?text=GKR'
        },
        {
            name: 'Banda Anil Rao',
            party: 'Independent',
            party_symbol: '🌟',
            email: 'anil.rao@independent.in',
            phone: '9800000005',
            biography: 'Independent candidate with strong roots in local community welfare, environmental protection, and education reform efforts.',
            experience: 'Social activist, education reformer, community welfare organizer',
            policies: 'Environmental protection, education reform, healthcare access, anti-corruption',
            image_url: 'https://via.placeholder.com/200/00B894/ffffff?text=BAR'
        }
    ];

    for (const c of candidates) {
        await conn.query(
            `INSERT INTO candidates 
             (name, party, party_symbol, email, phone, biography, experience, policies, image_url, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [c.name, c.party, c.party_symbol, c.email, c.phone, c.biography, c.experience, c.policies, c.image_url]
        );
    }

    const [rows] = await conn.query('SELECT id, name, party, party_symbol FROM candidates ORDER BY id');
    console.log('\nCandidates seeded successfully:');
    rows.forEach(r => console.log(`  ${r.id}. ${r.party_symbol} ${r.name} — ${r.party}`));
    console.log('  6. ✋ NOTA — None of the Above (auto-added by server)');
    console.log('\nAll voter votes have been reset.');

    await conn.end();
}

seedCandidates().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
