const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();

const app = express();

console.log("\n" + "=".repeat(70));
console.log("🚀 VOTEHUB SERVER STARTING");
console.log("=".repeat(70));

require("dotenv").config();

const PORT = process.env.PORT || 5000;
const VOTER_JWT_SECRET = process.env.VOTER_JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!VOTER_JWT_SECRET || !ADMIN_JWT_SECRET) {
    console.error("❌ ERROR: VOTER_JWT_SECRET and ADMIN_JWT_SECRET must be set in .env file");
    process.exit(1);
}
console.log("📍 PORT:", PORT);
console.log("🔐 Secrets configured from .env");

// ===========================
// MIDDLEWARE - CRITICAL ORDER!
// ===========================

// 1. CORS FIRST
app.use(cors({
    origin: function (origin, callback) {
        // Reflect the incoming origin or allow default local
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// 2. Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. Request Logger
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ===========================
// STATIC FILE SERVING - CRITICAL!
// ===========================

const publicPath = path.join(__dirname, "public");
const frontendPath = path.join(__dirname, "frontend");
const adminPath = path.join(__dirname, "admin");
const reactDist = path.join(__dirname, "client", "dist");
const useReactClient = fs.existsSync(path.join(reactDist, "index.html"));

// Create folders
[publicPath, path.join(publicPath, "uploads"), path.join(publicPath, "uploads", "candidates")].forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

console.log("\n📁 Static file paths:");
console.log("   Public:", publicPath);
if (useReactClient) {
    console.log("   React SPA:", reactDist);
} else {
    console.log("   Frontend:", frontendPath);
    console.log("   Admin:", adminPath);
}

// Uploads first (shared by API + client)
app.use("/uploads", express.static(path.join(publicPath, "uploads")));

if (useReactClient) {
    app.use(express.static(reactDist));
} else {
    app.use(express.static(frontendPath));
    if (fs.existsSync(adminPath)) {
        app.use("/admin", express.static(adminPath));
    }
}

app.use(express.static(publicPath));

console.log("✅ Static files configured\n");

// ===========================
// DATABASE
// ===========================
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'voting_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Helper to calculate election status dynamically based on time
 */
const getCalculatedStatus = (dbStatus, startTime, endTime) => {
    if (dbStatus === 'PAUSED') return 'PAUSED';
    if (dbStatus === 'CLOSED') return 'CLOSED';

    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (start && now < start) return 'UPCOMING';
    if (end && now > end) return 'CLOSED';

    return dbStatus; // usually ACTIVE
};
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("❌ FATAL ERROR: Database credentials not found in .env file!");
    console.error("Please create .env file with required database credentials.");
    process.exit(1);
}

pool.getConnection()
    .then(conn => {
        console.log("✅ DATABASE CONNECTED");
        conn.release();
    })
    .catch(err => {
        console.error("❌ DATABASE ERROR:", err.message);
    });

// ===========================
// AUTH MIDDLEWARE
// ===========================

const authenticateVoter = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No authorization header" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token" });
        }

        const decoded = jwt.verify(token, VOTER_JWT_SECRET);
        req.voter = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

const authenticateAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No authorization header" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token" });
        }

        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

const uploadCandidateImage = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, "public", "uploads", "candidates"),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
});

// ===========================
// API ROUTES
// ===========================

// TEST
app.get("/api/test", (req, res) => {
    console.log("✅ Test route");
    res.json({
        success: true,
        message: "✅ API Working",
        timestamp: new Date().toISOString()
    });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    let conn = null;
    try {
        const { fullName, email, password, dateOfBirth, phone } = req.body;

        console.log("📝 Register:", email);

        if (!fullName || !email || !password || !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password too short"
            });
        }

        // Age validation: must be 18 to 98 years old
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            if (isNaN(age) || age < 18) {
                return res.status(400).json({
                    success: false,
                    message: "You must be at least 18 years old to register"
                });
            }
            if (age > 98) {
                return res.status(400).json({
                    success: false,
                    message: "Date of birth year is too far in the past (max age is 98)"
                });
            }
        }

        conn = await pool.getConnection();

        const [existing] = await conn.query(
            "SELECT id FROM voters WHERE email = ?",
            [email.toLowerCase()]
        );

        if (existing.length > 0) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await conn.query(
            `INSERT INTO voters (name, email, password, date_of_birth, phone, has_voted, created_at) 
             VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [fullName, email.toLowerCase(), hashedPassword, dateOfBirth, phone || null]
        );

        conn.release();

        const voterId = result.insertId;
        const token = jwt.sign(
            { id: voterId, email: email.toLowerCase(), role: "voter" },
            VOTER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ Registered:", email);

        res.status(201).json({
            success: true,
            message: "✅ Registration successful",
            token,
            user: {
                id: voterId,
                name: fullName,
                email: email.toLowerCase(),
                hasVoted: false,
                dateOfBirth,
                phone: phone || null,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Register error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    let conn = null;
    try {
        const { email, password } = req.body;

        console.log("🔐 Login:", email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password required"
            });
        }

        conn = await pool.getConnection();

        const [voters] = await conn.query(
            `SELECT id, name, email, password, has_voted, voted_at, date_of_birth, phone, created_at 
             FROM voters WHERE email = ?`,
            [email.toLowerCase()]
        );

        if (voters.length === 0) {
            conn.release();
            console.log("❌ Not found:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const voter = voters[0];
        const isValid = await bcrypt.compare(password, voter.password);

        if (!isValid) {
            conn.release();
            console.log("❌ Wrong password");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        conn.release();

        const token = jwt.sign(
            { id: voter.id, email: voter.email, role: "voter" },
            VOTER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ Login successful");

        res.json({
            success: true,
            message: "✅ Login successful",
            token,
            user: {
                id: voter.id,
                name: voter.name,
                email: voter.email,
                hasVoted: voter.has_voted === 1,
                votedAt: voter.voted_at,
                dateOfBirth: voter.date_of_birth,
                phone: voter.phone,
                createdAt: voter.created_at
            }
        });

    } catch (error) {
        console.error("❌ Login error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});

// GET CANDIDATES
app.get("/api/voters/candidates", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📋 Candidates");

        conn = await pool.getConnection();

        const [candidates] = await conn.query(
            `SELECT id, name, party, party_symbol, email, phone, biography, 
                    experience, policies, image_url, votes 
             FROM candidates 
             WHERE status = 'active' 
             ORDER BY name`
        );

        conn.release();

        console.log("✅ Found", candidates.length, "candidates");

        res.json({
            success: true,
            candidates: [
                ...candidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    party: c.party,
                    partySymbol: c.party_symbol || "🏛️",
                    email: c.email,
                    phone: c.phone,
                    biography: c.biography || "No description",
                    experience: c.experience || "No experience",
                    policies: c.policies || "No policies",
                    imageUrl: c.image_url || "https://via.placeholder.com/200?text=Candidate",
                    votes: c.votes || 0,
                    isNota: false
                })),
                {
                    id: 0,
                    name: "NOTA",
                    party: "None of the Above",
                    partySymbol: "❌",
                    biography: "Vote for none",
                    imageUrl: "https://via.placeholder.com/200?text=NOTA",
                    votes: 0,
                    isNota: true
                }
            ]
        });

    } catch (error) {
        console.error("❌ Candidates error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// SUBMIT VOTE
app.post("/api/voters/vote", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        const { candidateId } = req.body;
        const voterId = req.voter.id;

        console.log("🗳️ Vote from voter:", voterId, "candidate:", candidateId);

        if (candidateId === undefined || candidateId === null) {
            return res.status(400).json({
                success: false,
                message: "Candidate ID required"
            });
        }

        conn = await pool.getConnection();

        const [[statusRow]] = await conn.query(
            "SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1"
        );

        const currentStatus = statusRow ? getCalculatedStatus(statusRow.status, statusRow.start_time, statusRow.end_time) : 'CLOSED';

        if (currentStatus !== 'ACTIVE') {
            conn.release();
            return res.status(400).json({
                success: false,
                message: currentStatus === 'UPCOMING' ? "Election has not started yet" : "Election is closed or paused",
                status: currentStatus
            });
        }

        const [existingVote] = await conn.query(
            "SELECT id FROM votes WHERE voter_id = ?",
            [voterId]
        );

        if (existingVote.length > 0) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Already voted"
            });
        }

        if (candidateId !== 0) {
            const [candidateCheck] = await conn.query(
                "SELECT id FROM candidates WHERE id = ? AND status = 'active'",
                [candidateId]
            );

            if (candidateCheck.length === 0) {
                conn.release();
                return res.status(400).json({
                    success: false,
                    message: "Invalid candidate"
                });
            }
        }

        await conn.query(
            "INSERT INTO votes (voter_id, candidate_id, created_at) VALUES (?, ?, NOW())",
            [voterId, candidateId === 0 ? null : candidateId]
        );

        if (candidateId !== 0) {
            await conn.query(
                "UPDATE candidates SET votes = votes + 1 WHERE id = ?",
                [candidateId]
            );
        }

        await conn.query(
            "UPDATE voters SET has_voted = 1, voted_at = NOW() WHERE id = ?",
            [voterId]
        );

        conn.release();

        console.log("✅ Vote recorded");

        res.json({
            success: true,
            message: "✅ Vote recorded"
        });

    } catch (error) {
        console.error("❌ Vote error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// GET RESULTS
app.get("/api/voters/results", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📊 Results");

        conn = await pool.getConnection();

        // Get candidates with their vote counts from the candidates table
        const [candidates] = await conn.query(
            `SELECT id, name, party, party_symbol as partySymbol, image_url as imageUrl, votes
             FROM candidates
             WHERE status = 'active'
             ORDER BY votes DESC`
        );

        // Count NOTA votes (where candidate_id is NULL)
        const [[{ notaVotes }]] = await conn.query(
            "SELECT COUNT(*) as notaVotes FROM votes WHERE candidate_id IS NULL"
        );

        // Get election status
        const [[statusRow]] = await conn.query("SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1");
        const electionStatus = statusRow ? getCalculatedStatus(statusRow.status, statusRow.start_time, statusRow.end_time) : 'CLOSED';

        // Count total voters
        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as totalVoters FROM voters");

        conn.release();

        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0) + (notaVotes || 0);

        const results = candidates.map(c => ({
            id: c.id,
            name: c.name,
            party: c.party,
            partySymbol: c.partySymbol || "🏛️",
            imageUrl: c.imageUrl || "https://via.placeholder.com/200?text=Candidate",
            votes: c.votes || 0,
            percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0,
            isNota: false
        }));

        // Add NOTA to results if there are any NOTA votes or if candidates exist
        results.push({
            id: 0,
            name: "NOTA",
            party: "None of the Above",
            partySymbol: "❌",
            imageUrl: "https://via.placeholder.com/200?text=NOTA",
            votes: notaVotes || 0,
            percentage: totalVotes > 0 ? Math.round((notaVotes / totalVotes) * 100) : 0,
            isNota: true
        });

        // Re-sort to include NOTA in rankings
        results.sort((a, b) => b.votes - a.votes);

        console.log("✅ Results retrieved");

        res.json({
            success: true,
            results,
            totalVotes
        });

    } catch (error) {
        console.error("❌ Results error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// GET PROFILE
app.get("/api/voters/profile", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("👤 Profile");

        conn = await pool.getConnection();

        const [voters] = await conn.query(
            `SELECT id, name, email, phone, date_of_birth, has_voted, voted_at, created_at 
             FROM voters WHERE id = ?`,
            [req.voter.id]
        );

        conn.release();
        if (voters.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Not found"
            });
        }

        const voter = voters[0];

        console.log("✅ Profile retrieved");

        res.json({
            success: true,
            profile: {
                id: voter.id,
                name: voter.name,
                email: voter.email,
                phone: voter.phone,
                dateOfBirth: voter.date_of_birth,
                hasVoted: voter.has_voted === 1,
                votedAt: voter.voted_at,
                createdAt: voter.created_at,
                voterId: `VOTER-${voter.id}`
            }
        });

    } catch (error) {
        console.error("❌ Profile error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// ELECTION STATUS (Public)
app.get("/api/admin/election-status", async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [[statusRow]] = await conn.query("SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1");
        conn.release();

        if (!statusRow) {
            return res.json({ success: true, status: 'CLOSED', startTime: null, endTime: null });
        }

        const calculatedStatus = getCalculatedStatus(statusRow.status, statusRow.start_time, statusRow.end_time);

        res.json({
            success: true,
            status: calculatedStatus,
            startTime: statusRow.start_time,
            endTime: statusRow.end_time
        });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - LOGIN
app.post("/api/admin/login", async (req, res) => {
    let conn = null;
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

        conn = await pool.getConnection();
        const [admins] = await conn.query("SELECT * FROM admins WHERE email = ?", [email.toLowerCase()]);
        if (admins.length === 0) {
            conn.release();
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const admin = admins[0];
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            conn.release();
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        conn.release();
        const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, ADMIN_JWT_SECRET, { expiresIn: "12h" });
        res.json({ success: true, message: "Login successful", token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Login failed", error: error.message });
    }
});

// ADMIN - GET VOTERS
app.get("/api/admin/voters", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [voters] = await conn.query("SELECT id, name as fullName, CONCAT('VOTER-', id) as voterId, email, phone, date_of_birth as dateOfBirth, has_voted as hasVoted, voted_at as votedAt, created_at as createdAt FROM voters ORDER BY created_at DESC");

        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as totalVoters FROM voters");
        const [[{ votedCount }]] = await conn.query("SELECT COUNT(*) as votedCount FROM voters WHERE has_voted = 1");

        conn.release();
        res.json({
            success: true,
            voters,
            totalVoters: totalVoters || 0,
            votedCount: votedCount || 0
        });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - GET CANDIDATES
app.get("/api/admin/candidates", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [candidates] = await conn.query("SELECT id, name, party, party_symbol as partySymbol, email, phone, biography, experience, policies, image_url as imageUrl, votes, status, created_at as createdAt FROM candidates ORDER BY created_at DESC");
        conn.release();
        res.json({ success: true, candidates });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - ADD CANDIDATE
app.post("/api/admin/candidates", authenticateAdmin, uploadCandidateImage.single("image"), async (req, res) => {
    let conn = null;
    try {
        const { name, party, email, phone, biography, experience, policies, partySymbol } = req.body;
        let imageUrl = req.body.imageUrl || "https://via.placeholder.com/200?text=Candidate";
        if (req.file) {
            imageUrl = `/uploads/candidates/${req.file.filename}`;
        }
        conn = await pool.getConnection();
        const [result] = await conn.query(
            "INSERT INTO candidates (name, party, party_symbol, email, phone, biography, experience, policies, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
            [name, party, partySymbol || null, email || null, phone || null, biography || null, experience || null, policies || null, imageUrl]
        );
        conn.release();
        res.json({ success: true, message: "Candidate added", candidateId: result.insertId });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - UPDATE CANDIDATE
app.put("/api/admin/candidates/:id", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        const { id } = req.params;
        const { name, party, biography, experience, policies, imageUrl, partySymbol, status, email, phone } = req.body;

        console.log(`📝 Updating candidate ID: ${id}`);
        console.log("📦 Body data:", req.body);

        conn = await pool.getConnection();

        const [result] = await conn.query(
            `UPDATE candidates SET 
                name = ?, 
                party = ?, 
                biography = ?, 
                experience = ?, 
                policies = ?, 
                image_url = ?, 
                party_symbol = ?, 
                status = ?,
                email = ?,
                phone = ?
             WHERE id = ?`,
            [name, party, biography, experience, policies, imageUrl, partySymbol, status || 'active', email || null, phone || null, id]
        );

        console.log("📊 Query result:", result);
        conn.release();

        if (result.affectedRows === 0) {
            console.log("⚠️ No candidate found with that ID");
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            });
        }

        console.log("✅ Candidate updated successfully in DB");

        res.json({
            success: true,
            message: "Candidate updated successfully"
        });

    } catch (error) {
        console.error("❌ Update error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed to update candidate",
            error: error.message
        });
    }
});

// ADMIN - DELETE CANDIDATE
app.delete("/api/admin/candidates/:id", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM candidates WHERE id = ?", [req.params.id]);
        conn.release();
        res.json({ success: true, message: "Candidate deleted" });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - START ELECTION
app.post("/api/admin/election/start", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        const { duration } = req.body; // duration in seconds
        conn = await pool.getConnection();

        // Deactivate any currently active/upcoming election
        await conn.query("UPDATE election_control SET status = 'CLOSED' WHERE status IN ('ACTIVE', 'UPCOMING', 'PAUSED')");

        let endTime = null;
        if (duration) {
            endTime = new Date(Date.now() + duration * 1000);
        }

        await conn.query("INSERT INTO election_control (status, start_time, end_time) VALUES ('ACTIVE', CURRENT_TIMESTAMP, ?)", [endTime]);
        conn.release();
        res.json({ success: true, message: "Election started", endTime });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - STOP ELECTION
app.post("/api/admin/election/stop", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE election_control SET status = 'CLOSED', end_time = NOW() WHERE status IN ('ACTIVE', 'PAUSED', 'UPCOMING') ORDER BY id DESC LIMIT 1");
        conn.release();
        res.json({ success: true, message: "Election stopped" });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - PAUSE ELECTION
app.post("/api/admin/election/pause", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE election_control SET status = 'PAUSED' WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 1");
        conn.release();
        res.json({ success: true, message: "Election paused" });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - EXTEND ELECTION
app.post("/api/admin/election/extend", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        const { additionalMinutes } = req.body;
        conn = await pool.getConnection();
        await conn.query("UPDATE election_control SET end_time = DATE_ADD(end_time, INTERVAL ? MINUTE) WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 1", [additionalMinutes]);
        const [[{ newEndTime }]] = await conn.query("SELECT end_time as newEndTime FROM election_control WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 1");
        conn.release();
        res.json({ success: true, message: "Election extended", newEndTime });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - RESUME ELECTION
app.post("/api/admin/election/resume", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE election_control SET status = 'ACTIVE' WHERE status = 'PAUSED' ORDER BY id DESC LIMIT 1");
        conn.release();
        res.json({ success: true, message: "Election resumed" });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - SCHEDULE ELECTION
app.post("/api/admin/election/schedule", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        const { startTime, endTime } = req.body;
        conn = await pool.getConnection();

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();
        const initialStatus = (start <= now) ? 'ACTIVE' : 'UPCOMING';

        await conn.query("INSERT INTO election_control (status, start_time, end_time) VALUES (?, ?, ?)", [initialStatus, start, end]);
        conn.release();
        res.json({ success: true, message: `Election scheduled as ${initialStatus}` });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - ELECTION SETTINGS
app.post("/api/admin/election/settings", authenticateAdmin, async (req, res) => {
    // In a real app we'd save these to a settings table. For now just return success.
    res.json({ success: true, message: "Settings updated" });
});

// ADMIN - DASHBOARD (Alias for statistics or extended)
app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as totalVoters FROM voters");
        const [[{ totalCandidates }]] = await conn.query("SELECT COUNT(*) as totalCandidates FROM candidates WHERE status = 'active'");
        const [[{ totalVotes }]] = await conn.query("SELECT COUNT(*) as totalVotes FROM votes");
        const [candidates] = await conn.query("SELECT id, name, party, party_symbol as partySymbol, votes FROM candidates WHERE status = 'active' ORDER BY votes DESC");
        const [[{ election }]] = await conn.query("SELECT status FROM election_control ORDER BY id DESC LIMIT 1") || [{ status: 'CLOSED' }];

        conn.release();

        res.json({
            success: true,
            totalVoters: totalVoters || 0,
            totalCandidates: totalCandidates || 0,
            totalVotes: totalVotes || 0,
            electionStatus: election ? election.status : 'CLOSED',
            candidates: candidates || []
        });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Dashboard failed", error: error.message });
    }
});

// ADMIN - VOTERS EXPORT
app.get("/api/admin/voters/export/csv", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [voters] = await conn.query("SELECT name, email, phone, has_voted as hasVoted, created_at FROM voters ORDER BY created_at DESC");
        conn.release();

        const csv = "Name,Email,Phone,Has Voted,Registered At\n" +
            voters.map(v => `"${v.name}","${v.email}","${v.phone || ''}",${v.hasVoted === 1 ? 'Yes' : 'No'},"${v.created_at}"`).join("\n");

        res.header("Content-Type", "text/csv");
        res.attachment("voters_list.csv");
        return res.send(csv);
    } catch (error) {
        if (conn) conn.release();
        res.status(500).send("Export failed");
    }
});

// ADMIN - GENERATE REPORT
app.post("/api/admin/generate-report", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [candidates] = await conn.query("SELECT name, party, votes FROM candidates WHERE status = 'active' ORDER BY votes DESC");
        const [[{ totalVotes }]] = await conn.query("SELECT COUNT(*) as totalVotes FROM votes");
        conn.release();

        // Simple text report for now, simulating PDF generation
        let report = `ELECTION REPORT - ${new Date().toLocaleDateString()}\n`;
        report += `Total Votes Cast: ${totalVotes}\n\n`;
        report += `RANKING:\n`;
        candidates.forEach((c, i) => {
            const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
            report += `${i + 1}. ${c.name} (${c.party}): ${c.votes} votes (${pct}%)\n`;
        });

        res.header("Content-Type", "text/plain");
        res.attachment(`election_report_${Date.now()}.txt`);
        return res.send(report);
    } catch (error) {
        if (conn) conn.release();
        res.status(500).send("Report generation failed");
    }
});

// ADMIN - RESULTS
app.get("/api/admin/results", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as totalVoters FROM voters");
        const [candidates] = await conn.query(`
            SELECT id, name, party, party_symbol as partySymbol, image_url as imageUrl, votes 
            FROM candidates 
            WHERE status = 'active' 
            ORDER BY votes DESC
        `);
        const [[statusRow]] = await conn.query("SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1");
        const electionStatus = statusRow ? getCalculatedStatus(statusRow.status, statusRow.start_time, statusRow.end_time) : 'CLOSED';

        conn.release();

        res.json({
            success: true,
            totalVoters: totalVoters || 0,
            candidates: candidates.map(c => ({
                ...c,
                imageUrl: c.imageUrl || "https://via.placeholder.com/200?text=Candidate"
            })),
            electionStatus,
            published: true
        });
    } catch (error) {
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
});

// ADMIN - PUBLISH RESULTS
app.post("/api/admin/results/publish", authenticateAdmin, async (req, res) => {
    // In a real app we'd save this to DB, for now we just return success
    res.json({ success: true, message: "Results published successfully" });
});

// ADMIN - EXPORT RESULTS CSV
app.get("/api/admin/results/export/csv", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [candidates] = await conn.query("SELECT name, party, votes FROM candidates WHERE status = 'active' ORDER BY votes DESC");
        conn.release();

        const csv = "Name,Party,Votes\n" + candidates.map(c => `"${c.name}","${c.party}",${c.votes}`).join("\n");
        res.header("Content-Type", "text/csv");
        res.attachment("results.csv");
        return res.send(csv);
    } catch (error) {
        if (conn) conn.release();
        res.status(500).send("Export failed");
    }
});

// ADMIN - STATISTICS
app.get("/api/admin/statistics", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();

        // Get candidates and their real-time vote counts
        const [candidates] = await conn.query(`
            SELECT id, name, party, party_symbol as partySymbol, votes 
            FROM candidates 
            WHERE status = 'active'
            ORDER BY votes DESC
        `);

        // Count total voters
        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as totalVoters FROM voters");

        // Count total candidates (active)
        const [[{ totalCandidates }]] = await conn.query("SELECT COUNT(*) as totalCandidates FROM candidates WHERE status = 'active'");

        // Get election status with dynamic calculation
        const [[statusRow]] = await conn.query("SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1");
        const baseStatus = statusRow ? statusRow.status : 'CLOSED';
        const electionStatus = statusRow ? getCalculatedStatus(baseStatus, statusRow.start_time, statusRow.end_time) : 'CLOSED';

        // Calculate total votes
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

        conn.release();

        res.json({
            success: true,
            candidates: candidates.map(c => ({
                ...c,
                percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
            })),
            totalVotes: totalVotes || 0,
            totalVoters: totalVoters || 0,
            totalCandidates: totalCandidates || 0,
            electionStatus: electionStatus
        });

    } catch (error) {
        console.error("❌ Stats error:", error.message);
        if (conn) conn.release();
        res.status(500).json({ success: false, message: "Failed to load statistics" });
    }
});

// ADMIN - STATISTICS EXPORT CSV
app.get("/api/admin/statistics/export/csv", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [candidates] = await conn.query("SELECT name, party, votes FROM candidates WHERE status = 'active' ORDER BY votes DESC");
        conn.release();

        const csv = "Name,Party,Votes,Percentage\n";
        const total = candidates.reduce((s, c) => s + c.votes, 0);
        const rows = candidates.map(c => {
            const pct = total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0;
            return `"${c.name}","${c.party}",${c.votes},${pct}%`;
        }).join("\n");

        res.header("Content-Type", "text/csv");
        res.attachment("statistics.csv");
        return res.send(csv + rows);
    } catch (error) {
        if (conn) conn.release();
        res.status(500).send("Export failed");
    }
});

// ADMIN - STATISTICS EXPORT JSON
app.get("/api/admin/statistics/export/json", authenticateAdmin, async (req, res) => {
    let conn = null;
    try {
        conn = await pool.getConnection();
        const [[{ totalVoters }]] = await conn.query("SELECT COUNT(*) as total_voters FROM voters");
        const [[{ totalVotes }]] = await conn.query("SELECT COUNT(*) as total_votes FROM votes");
        const [candidates] = await conn.query("SELECT name, party, votes FROM candidates WHERE status = 'active' ORDER BY votes DESC");
        conn.release();

        const data = {
            totalVoters,
            totalVotes,
            timestamp: new Date().toISOString(),
            candidates: candidates.map(c => ({
                ...c,
                percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0
            }))
        };

        res.header("Content-Type", "application/json");
        res.attachment("statistics.json");
        return res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        if (conn) conn.release();
        res.status(500).send("Export failed");
    }
});

// ===========================
// LEGACY HTML ROUTES (when React build is not used)
// ===========================

if (!useReactClient) {
    app.get("/index.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });

    app.get("/login.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "login.html"));
    });

    app.get("/register.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "register.html"));
    });

    app.get("/dashboard.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "dashboard.html"));
    });

    app.get("/voting.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "voting.html"));
    });

    app.get("/profile.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "profile.html"));
    });

    app.get("/results.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "results.html"));
    });

    app.get("/success.html", (req, res) => {
        res.sendFile(path.join(frontendPath, "success.html"));
    });
}

// ===========================
// FALLBACK ROUTES
// ===========================

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// ===========================
// REACT SPA (production build)
// ===========================

if (useReactClient) {
    app.use((req, res, next) => {
        if (req.method !== "GET" || req.path.startsWith("/api")) return next();
        res.sendFile(path.join(reactDist, "index.html"));
    });
}

// ===========================
// ERROR HANDLERS
// ===========================

app.use((req, res) => {
    console.log("⚠️ 404 -", req.method, req.path);
    res.status(404).json({
        success: false,
        message: "Not found"
    });
});

app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Server error"
    });
});

// ===========================
// START SERVER
// ===========================

app.listen(PORT, () => {
    console.log("\n" + "=".repeat(70));
    console.log("✅ VOTEHUB READY");
    console.log("=".repeat(70));
    if (useReactClient) {
        console.log(`\n✅ App (React): http://localhost:${PORT}/`);
        console.log(`✅ Admin (React): http://localhost:${PORT}/admin/login\n`);
    } else {
        console.log(`\n✅ Admin: http://localhost:${PORT}/admin`);
        console.log(`✅ Voter: http://localhost:${PORT}\n`);
    }
    console.log("=".repeat(70) + "\n");
});

module.exports = app;