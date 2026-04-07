import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function AdminAddCandidatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [partySymbol, setPartySymbol] = useState("🏛️");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [biography, setBiography] = useState("");
  const [experience, setExperience] = useState("");
  const [policies, setPolicies] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("party", party.trim());
      fd.append("partySymbol", partySymbol);
      if (email.trim()) fd.append("email", email.trim());
      if (phone.trim()) fd.append("phone", phone.trim());
      if (biography) fd.append("biography", biography);
      if (experience) fd.append("experience", experience);
      if (policies) fd.append("policies", policies);
      if (imageUrl.trim()) fd.append("imageUrl", imageUrl.trim());
      if (file) fd.append("image", file);

      const res = await fetch(`${getApiBase()}/api/admin/candidates`, {
        method: "POST",
        headers: adminHeaders(false),
        body: fd
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      showToast("✅ Candidate added", "success");
      navigate("/admin/candidates");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Add Candidate</h1>
          <p>Register a new candidate for the election</p>
        </div>
      </div>

      <div className="data-card" style={{ maxWidth: 640 }}>
        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Name *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Party *</label>
            <input className="form-input" value={party} onChange={(e) => setParty(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Party symbol (emoji)</label>
            <input className="form-input" value={partySymbol} onChange={(e) => setPartySymbol(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Phone</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Biography</label>
            <textarea className="form-input" rows={3} value={biography} onChange={(e) => setBiography(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Experience</label>
            <textarea className="form-input" rows={2} value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Policies</label>
            <textarea className="form-input" rows={2} value={policies} onChange={(e) => setPolicies(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Image URL (optional if uploading file)</label>
            <input className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Upload image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Add candidate"}
          </button>
        </form>
      </div>
    </>
  );
}
