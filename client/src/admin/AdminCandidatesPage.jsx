import { useCallback, useEffect, useState } from "react";
import { assetUrl, getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

const PAGE_SIZE = 10;

export default function AdminCandidatesPage() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/api/admin/candidates`, { headers: adminHeaders() });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed");
    setList(data.candidates || []);
    setFiltered(data.candidates || []);
    setPage(1);
  }, []);

  useEffect(() => {
    load().catch((e) => showToast(`❌ ${e.message}`, "error"));
  }, [load, showToast]);

  useEffect(() => {
    const q = search.toLowerCase();
    const f = q ? list.filter((c) => c.name.toLowerCase().includes(q) || c.party.toLowerCase().includes(q)) : [...list];
    setFiltered(f);
    setPage(1);
  }, [search, list]);

  async function deleteCandidate(id) {
    if (!window.confirm("Delete this candidate?")) return;
    const res = await fetch(`${getApiBase()}/api/admin/candidates/${id}`, {
      method: "DELETE",
      headers: adminHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.message || "Delete failed", "error");
      return;
    }
    showToast("✅ Deleted", "success");
    load().catch(() => {});
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!edit) return;
    const body = {
      name: edit.name.trim(),
      party: edit.party.trim(),
      biography: edit.biography || "",
      imageUrl: edit.imageUrl || "",
      experience: edit.experience || "",
      policies: edit.policies || "",
      partySymbol: edit.partySymbol || "🏛️",
      status: edit.status || "active",
      email: edit.email || null,
      phone: edit.phone || null
    };
    const res = await fetch(`${getApiBase()}/api/admin/candidates/${edit.id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.message || "Update failed", "error");
      return;
    }
    showToast("✅ Updated", "success");
    setEdit(null);
    load().catch(() => {});
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Candidates</h1>
          <p>Manage election candidates</p>
        </div>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search name or party…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 200, padding: 10 }}
        />
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Party</th>
              <th>Bio</th>
              <th>Symbol</th>
              <th>Votes</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {slice.map((c) => (
              <tr key={c.id}>
                <td>
                  <img src={assetUrl(c.imageUrl)} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                </td>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{c.party}</td>
                <td>{(c.biography || "").slice(0, 50)}…</td>
                <td style={{ fontSize: "1.5em" }}>{c.partySymbol}</td>
                <td>
                  <strong>{c.votes}</strong>
                </td>
                <td>
                  <span className="badge badge-success">{c.status}</span>
                </td>
                <td>
                  <button type="button" className="btn btn-small" onClick={() => setEdit({ ...c })}>
                    ✏️
                  </button>{" "}
                  <button type="button" className="btn btn-small" onClick={() => deleteCandidate(c.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ padding: 24, textAlign: "center" }}>No candidates</p>}
        <div style={{ display: "flex", gap: 8, padding: 12, flexWrap: "wrap" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`btn btn-small${p === page ? " btn-primary" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {edit && (
        <div className="modal-overlay" style={modalOverlay} onClick={() => setEdit(null)} role="presentation">
          <div className="modal-content" style={modalBox} onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>Edit candidate</h2>
            <form onSubmit={saveEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Name</label>
                <input className="form-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Party</label>
                <input className="form-input" value={edit.party} onChange={(e) => setEdit({ ...edit, party: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Biography</label>
                <textarea className="form-input" rows={3} value={edit.biography || ""} onChange={(e) => setEdit({ ...edit, biography: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Image URL</label>
                <input className="form-input" value={edit.imageUrl || ""} onChange={(e) => setEdit({ ...edit, imageUrl: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16
};

const modalBox = {
  background: "white",
  borderRadius: 12,
  padding: 24,
  maxWidth: 480,
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto"
};
