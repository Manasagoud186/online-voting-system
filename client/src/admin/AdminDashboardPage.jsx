import { useEffect, useState } from "react";
import { getApiBase, adminHeaders } from "../api.js";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${getApiBase()}/api/admin/dashboard`, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="page-header" style={{ color: "coral" }}>{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Dashboard Overview</h1>
          <p>Monitor election progress and key metrics</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="summary-card">
          <div className="card-header">
            <h3>Total Registered Voters</h3>
            <span className="card-icon">👥</span>
          </div>
          <div className="card-body">
            <div className="card-value">{data.totalVoters}</div>
            <div className="card-label">Registered</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <h3>Active Candidates</h3>
            <span className="card-icon">🎖️</span>
          </div>
          <div className="card-body">
            <div className="card-value">{data.totalCandidates}</div>
            <div className="card-label">Running</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <h3>Total Votes Cast</h3>
            <span className="card-icon">🗳️</span>
          </div>
          <div className="card-body">
            <div className="card-value">{data.totalVotes}</div>
            <div className="card-label">Recorded</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <h3>Election Status</h3>
            <span className="card-icon">⚙️</span>
          </div>
          <div className="card-body">
            <div className="card-value" style={{ fontSize: 24 }}>
              {data.electionStatus}
            </div>
            <div className="card-label">Current</div>
          </div>
        </div>
      </div>

      {data.candidates?.length > 0 && (
        <div className="data-card" style={{ marginTop: 24 }}>
          <h2>Top candidates by votes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Party</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.slice(0, 8).map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    {c.partySymbol} {c.party}
                  </td>
                  <td>{c.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
