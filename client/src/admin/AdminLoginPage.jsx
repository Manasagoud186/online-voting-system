import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBase } from "../api.js";
import { useToast } from "../ToastContext.jsx";
import "../styles/admin-login.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@votehub.com");
  const [password, setPassword] = useState("admin123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("adminToken")) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setGeneral("");
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Login failed");
      const SESSION_TIMEOUT = 30 * 60 * 1000;
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      localStorage.setItem("adminTokenExpiry", String(Date.now() + SESSION_TIMEOUT));
      showToast("✅ Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/admin/dashboard"), 600);
    } catch (err) {
      setGeneral(err.message);
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-body">
      <div className="admin-bg-shapes">
        <div className="shape shape1" />
        <div className="shape shape2" />
        <div className="shape shape3" />
      </div>
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="logo-icon">🛡️</div>
            <h1>VoteHub Admin</h1>
            <p>Secure Election Management</p>
          </div>
          <form className="admin-login-form" onSubmit={onSubmit} style={{ opacity: loading ? 0.5 : 1 }}>
            <div className="form-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input id="adminEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="adminPassword">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="adminPassword"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => !s)}>
                  👁️
                </button>
              </div>
            </div>
            <button type="submit" className="admin-login-btn" disabled={loading}>
              Login to Admin Panel
            </button>
            {general && <div className="admin-login-general">{general}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
