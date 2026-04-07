import { useEffect, useState } from "react";
import { assetUrl, getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function AdminResultsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${getApiBase()}/api/admin/results`, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        setData(d);
      })
      .catch((e) => showToast(`❌ ${e.message}`, "error"));
  }, [showToast]);

  async function publish() {
    try {
      const res = await fetch(`${getApiBase()}/api/admin/results/publish`, {
        method: "POST",
        headers: adminHeaders(),
        body: "{}"
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      showToast("✅ " + (d.message || "Published"), "success");
    } catch (e) {
      showToast(`❌ ${e.message}`, "error");
    }
  }

  function exportCsv() {
    fetch(`${getApiBase()}/api/admin/results/export/csv`, { headers: adminHeaders() })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "results.csv";
        a.click();
      })
      .catch(() => showToast("Export failed", "error"));
  }

  if (!data) return <p>Loading…</p>;

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Results</h1>
          <p>
            Status: {data.electionStatus} · {data.totalVoters} voters registered
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={publish}>
            Publish Results
          </button>
        </div>
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Party</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {(data.candidates || []).map((c) => (
              <tr key={c.id}>
                <td>
                  <img src={assetUrl(c.imageUrl)} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                </td>
                <td>{c.name}</td>
                <td>
                  {c.partySymbol} {c.party}
                </td>
                <td>
                  <strong>{c.votes}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
