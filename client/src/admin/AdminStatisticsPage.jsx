import { useEffect, useState } from "react";
import { getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function AdminStatisticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${getApiBase()}/api/admin/statistics`, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        setData(d);
      })
      .catch((e) => showToast(`❌ ${e.message}`, "error"));
  }, [showToast]);

  if (!data) return <p>Loading…</p>;

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Statistics</h1>
          <p>
            Election: <strong>{data.electionStatus}</strong> · Total votes recorded: {data.totalVotes} · Voters: {data.totalVoters} · Candidates:{" "}
            {data.totalCandidates}
          </p>
        </div>
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Party</th>
              <th>Votes</th>
              <th>%</th>
              <th style={{ minWidth: 160 }}>Bar</th>
            </tr>
          </thead>
          <tbody>
            {(data.candidates || []).map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  {c.partySymbol} {c.party}
                </td>
                <td>{c.votes}</td>
                <td>{c.percentage}%</td>
                <td>
                  <div style={{ background: "#eee", borderRadius: 4, height: 10 }}>
                    <div style={{ width: `${c.percentage}%`, height: 10, background: "var(--primary-color, #6366f1)", borderRadius: 4 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
