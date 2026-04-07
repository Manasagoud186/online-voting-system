import { useEffect, useState } from "react";
import { getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function AdminVotersPage() {
  const { showToast } = useToast();
  const [voters, setVoters] = useState([]);
  const [totals, setTotals] = useState({ totalVoters: 0, votedCount: 0 });

  useEffect(() => {
    fetch(`${getApiBase()}/api/admin/voters`, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        setVoters(d.voters || []);
        setTotals({ totalVoters: d.totalVoters, votedCount: d.votedCount });
      })
      .catch((e) => showToast(`❌ ${e.message}`, "error"));
  }, [showToast]);

  function exportCsv() {
    fetch(`${getApiBase()}/api/admin/voters/export/csv`, { headers: adminHeaders() })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "voters_list.csv";
        a.click();
      })
      .catch(() => showToast("Export failed", "error"));
  }

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Voters</h1>
          <p>
            {totals.totalVoters} registered · {totals.votedCount} voted
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Voter ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Voted</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((v) => (
              <tr key={v.id}>
                <td>{v.voterId}</td>
                <td>{v.fullName}</td>
                <td>{v.email}</td>
                <td>{v.phone || "—"}</td>
                <td>{v.hasVoted ? "Yes" : "No"}</td>
                <td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {voters.length === 0 && <p style={{ padding: 24, textAlign: "center" }}>No voters</p>}
      </div>
    </>
  );
}
