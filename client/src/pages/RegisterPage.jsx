import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiBase } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("voterToken")) navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const today = new Date();
    const minYear = today.getFullYear() - 98;
    const minDate = new Date(minYear, today.getMonth(), today.getDate());
    const maxYear = today.getFullYear() - 18;
    const maxDate = new Date(maxYear, today.getMonth(), today.getDate());
    const el = document.getElementById("dob");
    if (el) {
      el.min = minDate.toISOString().split("T")[0];
      el.max = maxDate.toISOString().split("T")[0];
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!fullName.trim() || fullName.trim().length < 3) next.name = "Name must be at least 3 characters";
    if (!email.trim() || !email.includes("@")) next.email = "Valid email is required";
    if (!dob) next.dob = "Date of birth is required";
    else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) next.dob = "You must be at least 18 years old to vote";
      if (age > 98) next.dob = "Age cannot exceed 98 years";
    }
    if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!terms) {
      showToast("❌ You must accept the terms and conditions", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          dateOfBirth: dob,
          phone: phone.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Registration failed");
      showToast("✅ Registration successful! Redirecting to login...", "success");
      localStorage.removeItem("voterToken");
      localStorage.removeItem("voterUser");
      setTimeout(() => navigate("/login"), 1200);
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
            <div className="auth-icon">📝</div>
            <h1>Create Your Account</h1>
            <p>Join VoteHub and exercise your right to vote</p>
          </div>

          <form onSubmit={onSubmit} style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}>
            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
              </div>
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
              </div>
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-XXXXXXXXXX" />
              </div>
            </div>

            <div className="form-group">
              <label>
                Date of Birth * <small style={{ color: "#888" }}>(Age Must be &gt; 18 years old)</small>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">📅</span>
                <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>
              {errors.dob && <span className="error-msg">{errors.dob}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => !s)}>
                  👁️
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type={showPw2 ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPw2((s) => !s)}>
                  👁️
                </button>
              </div>
              {errors.confirm && <span className="error-msg">{errors.confirm}</span>}
            </div>

            <div className="form-check">
              <input type="checkbox" id="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
              <label htmlFor="terms">I agree to Terms of Service and Privacy Policy *</label>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              Create Account
            </button>
            {loading && <div className="loading-spinner" style={{ display: "block", margin: "16px auto" }} />}
            {errors.general && <span className="error-msg general-error">{errors.general}</span>}
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
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
