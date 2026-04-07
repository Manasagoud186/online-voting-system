import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import { getApiBase, voterHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "{}");
  } catch {
    return {};
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [voter, setVoter] = useState(parseVoter());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("voterToken")) {
      navigate("/login");
      return;
    }
    fetch(`${getApiBase()}/api/voters/profile`, { headers: voterHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed");
        setProfile(data.profile);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [navigate]);

  function downloadProfile() {
    if (!profile) return;
    const text = JSON.stringify(profile, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "votehub-profile.json";
    a.click();
    showToast("📥 Profile downloaded", "success");
  }

  return (
    <>
      <VoterNav voter={voter} />
      <div className="profile-container">
        <div className="profile-header">
          <h1>👤 Your Profile</h1>
          <p>Your voter account information and voting status</p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="loading-spinner" />
            <p>Loading your profile...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "red", fontSize: 18 }}>⚠️ Error Loading Profile</p>
            <p style={{ color: "#666" }}>{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 20 }}>
              🔄 Retry
            </button>
          </div>
        )}

        {profile && !loading && (
          <div className="profile-card">
            <div className="profile-section">
              <h2>📋 Personal Information</h2>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Full Name:</span>
                  <span className="info-value">{profile.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Voter ID:</span>
                  <span className="info-value">{profile.voterId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{profile.phone || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date of Birth:</span>
                  <span className="info-value">{profile.dateOfBirth || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Registered:</span>
                  <span className="info-value">{profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "—"}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>🗳️ Voting Status</h2>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{profile.hasVoted ? "Voted" : "Not Voted"}</span>
                </div>
                {profile.hasVoted && profile.votedAt && (
                  <div className="info-row">
                    <span className="info-label">Voted At:</span>
                    <span className="info-value">{new Date(profile.votedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>⚙️ Account Actions</h2>
              <div className="action-grid">
                <button type="button" onClick={downloadProfile} className="btn btn-secondary">
                  📥 Download Profile
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => showToast("Privacy policy (placeholder)", "info")}>
                  🔒 Privacy Policy
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => showToast("Terms (placeholder)", "info")}>
                  📜 Terms of Service
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => showToast("Contact admin to delete account.", "info")}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
