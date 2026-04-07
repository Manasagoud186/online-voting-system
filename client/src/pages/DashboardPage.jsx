import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import { getApiBase, voterHeaders } from "../api.js";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "{}");
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [voter, setVoter] = useState(parseVoter());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("CLOSED");
  const [endTime, setEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timerLabel, setTimerLabel] = useState("Time Remaining");
  const [timeRemaining, setTimeRemaining] = useState("--:--:--");
  const [candidateLabel, setCandidateLabel] = useState("--");

  const token = localStorage.getItem("voterToken");

  const loadCandidatesCount = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/voters/candidates`, { headers: voterHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Failed");
      const count = (data.candidates || []).filter((c) => !c.isNota).length;
      setCandidateLabel(`${count} + NOTA`);
    } catch {
      setCandidateLabel("Error");
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${getApiBase()}/api/admin/election-status`, {
          headers: { ...voterHeaders() }
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Server error");
        if (cancelled) return;

        const st = (data.status || "CLOSED").toUpperCase();
        setStatus(st);
        setEndTime(data.endTime ? new Date(data.endTime) : null);
        setStartTime(data.startTime ? new Date(data.startTime) : null);

        if (st === "ACTIVE" && data.endTime) {
          setTimerLabel("Time Remaining");
        } else if (st === "UPCOMING" && data.startTime) {
          setTimerLabel("Starts In");
        } else {
          setTimeRemaining("--:--:--");
        }
        setLoading(false);
        setError("");
        await loadCandidatesCount();
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          setError(e.message || "Failed to load");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, navigate, loadCandidatesCount]);

  useEffect(() => {
    const target =
      status === "ACTIVE" && endTime
        ? endTime
        : status === "UPCOMING" && startTime
          ? startTime
          : null;
    if (!target) return;

    const id = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        if (status === "UPCOMING") window.location.reload();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(id);
  }, [status, endTime, startTime]);

  const statusColors = {
    ACTIVE: "#27ae60",
    UPCOMING: "#3498db",
    PAUSED: "#f39c12",
    CLOSED: "#e74c3c"
  };

  let votingStatusText = "Closed";
  let votingColor = "#e74c3c";
  let showVote = false;
  let showAlready = false;
  let showClosed = false;

  if (voter.hasVoted) {
    votingStatusText = "✓ Voted";
    votingColor = "#27ae60";
    showAlready = true;
  } else if (status === "ACTIVE") {
    votingStatusText = "Ready";
    votingColor = "#667eea";
    showVote = true;
  } else if (status === "UPCOMING") {
    votingStatusText = "Upcoming";
    votingColor = "#3498db";
  } else {
    showClosed = true;
  }

  return (
    <>
      <VoterNav voter={voter} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 id="welcomeTitle">Welcome, {voter.name || "Voter"}!</h1>
          <p id="welcomeMessage">Get ready to vote</p>
        </div>

        {loading && (
          <div id="loadingState" style={{ textAlign: "center", padding: 40 }}>
            <div className="loading-spinner" />
            <p>Loading dashboard...</p>
          </div>
        )}

        {error && !loading && (
          <div id="errorState" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "red", fontSize: 18 }}>⚠️ Error Loading Dashboard</p>
            <p style={{ color: "#666", marginBottom: 20 }}>{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
              🔄 Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div id="statsContent">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🗳️</div>
                <h3>Election Status</h3>
                <p className="stat-value" style={{ color: statusColors[status] || "#f39c12" }}>
                  {status}
                </p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <h3>{timerLabel}</h3>
                <p className="stat-value">{timeRemaining}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <h3>Your Voting Status</h3>
                <p className="stat-value" style={{ color: votingColor }}>
                  {votingStatusText}
                </p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Total Candidates</h3>
                <p className="stat-value">{candidateLabel}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                {showVote && (
                  <Link to="/vote" className="btn btn-primary btn-large">
                    🗳️ Vote Now
                  </Link>
                )}
                <Link to="/results" className="btn btn-secondary btn-large">
                  📊 View Results
                </Link>
                <Link to="/profile" className="btn btn-secondary btn-large">
                  👤 My Profile
                </Link>
              </div>
            </div>

            {showAlready && (
              <div className="alert-box alert-success">
                <h3>✅ You Have Already Voted</h3>
                <p>Thank you for exercising your right to vote!</p>
              </div>
            )}
            {showClosed && !voter.hasVoted && status !== "UPCOMING" && (
              <div className="alert-box alert-info">
                <h3>📋 Election is Closed</h3>
                <p>The voting period has ended.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
