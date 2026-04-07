import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function navClass({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

export default function VoterNav({ voter, showMenu = true }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function logout() {
    if (!window.confirm("Logout?")) return;
    localStorage.removeItem("voterToken");
    localStorage.removeItem("voterUser");
    navigate("/");
    window.location.reload();
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🗳️</span>
          <span className="logo-text">VoteHub</span>
        </Link>
        {showMenu && (
          <ul className={`navbar-menu${open ? " active" : ""}`} id="navbarMenu">
            <li>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/vote" className={navClass}>
                Vote
              </NavLink>
            </li>
            <li>
              <NavLink to="/results" className={navClass}>
                Results
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
            </li>
          </ul>
        )}
        <div className="navbar-auth">
          {voter ? (
            <>
              <span id="voterName">{voter.name || "Voter"}</span>
              <button type="button" onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
        {showMenu && (
          <button
            type="button"
            className="hamburger"
            id="hamburger"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        )}
      </div>
    </nav>
  );
}
