import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import { getApiBase } from "../api.js";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "null");
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [voter, setVoter] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("voterToken");
    if (t) setVoter(parseVoter());
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🗳️</span>
            <span className="logo-text">VoteHub</span>
          </Link>
          <ul className={`navbar-menu${menuOpen ? " active" : ""}`} id="navbarMenu">
            <li>
              <a href="#about" className="nav-link active">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="nav-link">
                About
              </a>
            </li>
            <li>
              <a href="#features" className="nav-link">
                Features
              </a>
            </li>
            <li>
              <a href="#faq" className="nav-link">
                FAQ
              </a>
            </li>
          </ul>
          <div className="navbar-auth" id="navbarAuth">
            {voter ? (
              <div className="user-profile-nav" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="welcome-text">
                  Welcome, <strong>{voter.name}</strong>
                </span>
                <Link to="/dashboard" className="btn btn-primary btn-small">
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    if (window.confirm("Logout?")) {
                      localStorage.removeItem("voterToken");
                      localStorage.removeItem("voterUser");
                      setVoter(null);
                    }
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="hamburger"
            id="hamburger"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-background">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            {voter ? `Welcome Back, ${(voter.name || "").split(" ")[0]}!` : "Your Vote, Your Voice, Your Future"}
          </h1>
          <p className="hero-subtitle">
            Secure. Transparent. Democratic. Vote with confidence in a secure online voting system.
          </p>
          <div className="hero-buttons">
            {voter ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  🚀 Go to Dashboard
                </Link>
                <Link to="/results" className="btn btn-secondary btn-large">
                  📊 View Live Results
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  🗳️ Start Voting Now
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  🔐 Login
                </Link>
              </>
            )}
          </div>
          <HomeStats />
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <h2>About VoteHub</h2>
          <p>
            VoteHub is India&apos;s leading secure, transparent, and user-friendly online voting platform designed to
            make voting accessible to everyone. Our mission is to strengthen democracy through technology.
          </p>
          <div className="about-grid">
            {[
              ["🔒", "Bank-Level Security", "Enterprise-grade encryption ensures your vote is protected"],
              ["✓", "Verified Voters", "Only eligible voters can participate"],
              ["📊", "Real-Time Transparency", "Live results and complete audit trails"],
              ["⚡", "Lightning Fast", "Vote instantly from anywhere"],
              ["🌐", "Accessible 24/7", "Vote anytime during election period"],
              ["♿", "Inclusive Design", "Accessible interface for voters of all abilities"]
            ].map(([icon, title, text]) => (
              <div key={title} className="about-card">
                <div className="about-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            {[
              ["📝", "Easy Registration", "Complete voter registration in just 2 minutes"],
              ["🗳️", "One-Click Voting", "Vote for your preferred candidate instantly"],
              ["📈", "Live Results", "Watch results update in real-time"],
              ["👤", "Detailed Profiles", "View comprehensive candidate profiles"],
              ["📱", "Mobile Responsive", "Vote from any device"],
              ["✋", "NOTA Option", "Exercise your right to vote for NOTA"]
            ].map(([icon, title, text]) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How do I register to vote?</h4>
              <p>
                Click Register, fill your details (name, email, DOB, phone, password) and verify your account.
              </p>
            </div>
            <div className="faq-item">
              <h4>Is my vote secure?</h4>
              <p>We use encryption and secure servers. Your vote is recorded safely.</p>
            </div>
            <div className="faq-item">
              <h4>Can I vote multiple times?</h4>
              <p>No. The system prevents double voting once you have cast your vote.</p>
            </div>
            <div className="faq-item">
              <h4>What if I want to vote for NOTA?</h4>
              <p>NOTA is available alongside all candidates.</p>
            </div>
            <div className="faq-item">
              <h4>When can I vote?</h4>
              <p>During the election period as set by the administrator.</p>
            </div>
            <div className="faq-item">
              <h4>Can I change my vote after submission?</h4>
              <p>No. Once submitted, your vote is final.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Vote?</h2>
          <p>Join thousands of voters exercising their democratic right securely online</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Register Now
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>VoteHub</h4>
              <p>Secure Online Voting System</p>
            </div>
            <div className="footer-section">
              <h4>Links</h4>
              <ul>
                <li>
                  <a href="#about">About</a>
                </li>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 VoteHub. All rights reserved. | Secure Democracy Through Technology</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function HomeStats() {
  const [stats, setStats] = useState({ voters: "700+", candidates: "6", votes: "150+" });

  useEffect(() => {
    const base = getApiBase();
    fetch(`${base}/api/admin/election-status`)
      .then((r) => r.json())
      .then(() => {
        setStats({ voters: "700+", candidates: "6", votes: "150+" });
      })
      .catch(() => setStats({ voters: "700+", candidates: "6", votes: "150+" }));
  }, []);

  return (
    <div className="hero-stats">
      <div className="stat">
        <div className="stat-number" id="voterCount">
          {stats.voters}
        </div>
        <div className="stat-label">Active Voters</div>
      </div>
      <div className="stat">
        <div className="stat-number" id="candidateCount">
          {stats.candidates}
        </div>
        <div className="stat-label">Candidates</div>
      </div>
      <div className="stat">
        <div className="stat-number" id="voteCount">
          {stats.votes}
        </div>
        <div className="stat-label">Votes Cast</div>
      </div>
    </div>
  );
}
