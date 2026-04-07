import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import { assetUrl, getApiBase, voterHeaders } from "../api.js";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "{}");
  } catch {
    return {};
  }
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [voter] = useState(parseVoter());
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [electionStatus, setElectionStatus] = useState("CLOSED");

  const loadResults = useCallback(async () => {
    const token = localStorage.getItem("voterToken");
    if (!token) return;
    const [res, stRes] = await Promise.all([
      fetch(`${getApiBase()}/api/voters/results`, { headers: voterHeaders() }),
      fetch(`${getApiBase()}/api/admin/election-status`, { headers: voterHeaders() })
    ]);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed");
    setResults(data.results || []);
    setTotalVotes(data.totalVotes || 0);
    const st = await stRes.json();
    if (st.success) setElectionStatus((st.status || "CLOSED").toUpperCase());
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("voterToken")) {
      navigate("/login");
      return;
    }
    loadResults().catch(() => {});
    const id = setInterval(() => loadResults().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [navigate, loadResults]);

  const sorted = [...results].sort((a, b) => b.votes - a.votes);
  const top = sorted[0];
  const nonNotaWinner =
    electionStatus === "CLOSED" && top && !top.isNota
      ? top
      : electionStatus === "CLOSED"
        ? sorted.find((r) => !r.isNota)
        : null;

  return (
    <>
      <VoterNav voter={voter} />
      <div className="results-container">
        <div className="results-header">
          <h1>📊 Election Results</h1>
          <div className="results-stats">
            <div className="stat">
              <div className="stat-number">{totalVotes}</div>
              <div className="stat-label">Total Votes</div>
            </div>
            <div className="stat">
              <div className="stat-number">{results.filter((r) => !r.isNota).length}</div>
              <div className="stat-label">Candidates</div>
            </div>
          </div>
        </div>

        {electionStatus === "CLOSED" && nonNotaWinner && nonNotaWinner.votes > 0 && (
          <div className="winner-card">
            <h2>🏆 Election Winner</h2>
            <div className="winner-content">
              <img src={assetUrl(nonNotaWinner.imageUrl)} alt={nonNotaWinner.name} className="winner-image" />
              <div className="winner-info">
                <h3>{nonNotaWinner.name}</h3>
                <p>{nonNotaWinner.party}</p>
                <p className="winner-votes">{nonNotaWinner.votes} votes</p>
              </div>
            </div>
          </div>
        )}

        <div className="results-table-container">
          <h2>Vote Counts & Rankings</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Party</th>
                <th>Votes</th>
                <th>Percentage</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30 }}>
                    Loading...
                  </td>
                </tr>
              ) : (
                results.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>
                      {r.partySymbol} {r.party}
                    </td>
                    <td>{r.votes}</td>
                    <td>{r.percentage ?? 0}%</td>
                    <td>
                      <div className="progress-bar-wrap" style={{ background: "#eee", borderRadius: 4, height: 8 }}>
                        <div
                          style={{
                            width: `${r.percentage || 0}%`,
                            height: "100%",
                            background: "var(--primary-color)",
                            borderRadius: 4
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <button type="button" onClick={() => loadResults()} className="btn btn-secondary">
            🔄 Refresh Results
          </button>{" "}
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
