import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VoterNav from "../components/VoterNav.jsx";
import "../styles/success-extra.css";

function parseVoter() {
  try {
    return JSON.parse(localStorage.getItem("voterUser") || "null");
  } catch {
    return null;
  }
}

export default function SuccessPage() {
  const navigate = useNavigate();
  const [voter, setVoter] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("voterToken")) navigate("/login", { replace: true });
    else setVoter(parseVoter());
  }, [navigate]);

  return (
    <>
      <VoterNav voter={voter} showMenu={false} />
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1>Thank You for Voting!</h1>
          <p>Your vote has been successfully submitted and recorded.</p>

          <div className="success-info">
            <p>📍 Your vote is:</p>
            <ul>
              <li>✓ Securely encrypted</li>
              <li>✓ Permanently recorded</li>
              <li>✓ Anonymous and confidential</li>
              <li>✓ Cannot be changed</li>
            </ul>
          </div>

          <div className="success-actions">
            <Link to="/results" className="btn btn-primary btn-large">
              📊 View Live Results
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-large">
              Back to Dashboard
            </Link>
          </div>

          <p className="success-message">
            Thank you for exercising your democratic right!
            <br />
            Your participation strengthens our democracy.
          </p>
        </div>
      </div>
    </>
  );
}
