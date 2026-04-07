import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import { assetUrl, getApiBase, voterHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "{}");
  } catch {
    return {};
  }
}

export default function VotingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [voter, setVoter] = useState(parseVoter());
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem("voterToken");

  const loadFlow = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    const v = parseVoter();
    setVoter(v);

    const statusRes = await fetch(`${getApiBase()}/api/admin/election-status`, {
      headers: { ...voterHeaders() }
    });
    if (!statusRes.ok) throw new Error(`Failed to check election status: ${statusRes.status}`);
    const statusData = await statusRes.json();

    if (statusData.status !== "ACTIVE") {
      setPhase("notActive");
      return;
    }
    if (v.hasVoted) {
      setPhase("already");
      return;
    }

    const res = await fetch(`${getApiBase()}/api/voters/candidates`, { headers: voterHeaders() });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Server error");
    if (!data.candidates?.length) throw new Error("No candidates available.");

    setCandidates(data.candidates);
    setPhase("vote");
  }, [token, navigate]);

  useEffect(() => {
    loadFlow().catch((e) => {
      setError(e.message);
      setPhase("error");
    });
  }, [loadFlow]);

  async function submitVote() {
    if (selected === null || selected === undefined) {
      showToast("❌ Please select a candidate", "error");
      return;
    }
    if (!window.confirm("⚠️ Are you sure? This cannot be changed.")) return;

    try {
      const res = await fetch(`${getApiBase()}/api/voters/vote`, {
        method: "POST",
        headers: voterHeaders(),
        body: JSON.stringify({ candidateId: selected.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to submit vote");

      const v = parseVoter();
      v.hasVoted = true;
      v.votedAt = new Date().toISOString();
      localStorage.setItem("voterUser", JSON.stringify(v));
      showToast("✅ Vote submitted!", "success");
      setTimeout(() => navigate("/success"), 800);
    } catch (e) {
      showToast(`❌ ${e.message}`, "error");
    }
  }

  function clearSelection() {
    setSelected(null);
  }

  return (
    <>
      <VoterNav voter={voter} />
      <div className="voting-container">
        <div className="voting-header">
          <h1>🗳️ Cast Your Vote</h1>
          <div className="voting-status">
            {phase === "vote" && <span className="status-badge" style={{ background: "#27ae60" }}>🟢 Active</span>}
            {phase === "notActive" && <span className="status-badge" style={{ background: "#f39c12" }}>⏸️ Not Active</span>}
            {phase === "loading" && <span className="status-badge">Loading...</span>}
          </div>
        </div>

        {phase === "already" && (
          <div className="alert-box alert-success">
            <h3>✅ You Have Already Voted</h3>
            <p>Thank you for participating in the election. You cannot vote again.</p>
            <Link to="/results" className="btn btn-primary">
              View Results
            </Link>
          </div>
        )}

        {phase === "notActive" && (
          <div className="alert-box alert-info">
            <h3>📋 Election is Not Active</h3>
            <p>You cannot vote at this time. Please wait for the voting period to begin.</p>
            <Link to="/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="loading-spinner" />
            <p>Loading candidates...</p>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "red", fontSize: 18 }}>⚠️ Error Loading</p>
            <p style={{ color: "#666" }}>{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 20 }}>
              🔄 Retry
            </button>
          </div>
        )}

        {phase === "vote" && (
          <>
            <div className="voting-grid">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`candidate-card${selected?.id === c.id ? " selected" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  <div className="candidate-image">
                    <img src={assetUrl(c.imageUrl)} alt={c.name} onError={(e) => { e.target.src = `https://via.placeholder.com/200?text=${encodeURIComponent(c.name)}`; }} />
                  </div>
                  <div className="candidate-content">
                    <h3 className="candidate-name">{c.name}</h3>
                    <p className="candidate-party" style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                      <span className="party-symbol-highlight">{c.partySymbol}</span>
                      <strong style={{ fontSize: "1.1em" }}>{c.party}</strong>
                    </p>
                    {!c.isNota ? (
                      <p className="candidate-bio">{(c.biography || "No description").slice(0, 80)}...</p>
                    ) : (
                      <p className="candidate-bio">None of the Above</p>
                    )}
                    <div className="vote-checkbox">
                      <input type="radio" name="candidate" readOnly checked={selected?.id === c.id} />
                      <label>Select</label>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div className="selected-section">
                  <h3>📋 Your Selection:</h3>
                  <div className="selected-card">
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 20, alignItems: "center" }}>
                      <img
                        src={assetUrl(selected.imageUrl)}
                        alt={selected.name}
                        style={{ width: 100, height: 100, borderRadius: 8, objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/100?text=${encodeURIComponent(selected.name)}`;
                        }}
                      />
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="party-symbol-highlight-large">{selected.partySymbol}</span>
                        <div>
                          <h4 style={{ margin: "0 0 5px 0", fontSize: 22 }}>{selected.name}</h4>
                          <p style={{ margin: "0 0 5px 0", color: "#667eea", fontSize: 16 }}>
                            <strong>{selected.party}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="submit-section">
                  <p className="warning">⚠️ Once you submit your vote, it cannot be changed. Please ensure your selection is correct.</p>
                  <button type="button" onClick={submitVote} className="btn btn-primary btn-large">
                    ✅ CONFIRM & SUBMIT VOTE
                  </button>
                  <button type="button" onClick={clearSelection} className="btn btn-secondary">
                    Change Selection
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
