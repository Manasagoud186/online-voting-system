import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiBase } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("voterToken")) navigate("/dashboard", { replace: true });
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!email.includes("@")) next.email = "Invalid email format";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Login failed");
      if (!data.token) throw new Error("No token received");
      localStorage.setItem("voterToken", data.token);
      localStorage.setItem("voterUser", JSON.stringify(data.user));
      showToast("✅ Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setErrors({ general: err.message });
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🗳️</span>
            <span className="logo-text">VoteHub</span>
          </Link>
          <div className="navbar-auth">
            <Link to="/" className="btn btn-secondary">
              Back Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h1>Welcome Back</h1>
            <p>Login to your VoteHub account to vote</p>
          </div>

          <form id="loginForm" onSubmit={onSubmit} style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}>
            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
              </div>
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => !s)}>
                  👁️
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              Login to Vote
            </button>
            {loading && <div className="loading-spinner" style={{ display: "block", margin: "16px auto" }} />}
            {errors.general && <span className="error-msg general-error">{errors.general}</span>}
          </form>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account? <Link to="/register">Register here</Link>
            </p>
            <p>
              <Link to="/">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
