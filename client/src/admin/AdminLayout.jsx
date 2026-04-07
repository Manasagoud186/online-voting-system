import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/admin.css";

function navLinkClass({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function sideClass({ isActive }) {
  return isActive ? "sidebar-item active" : "sidebar-item";
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      setAdmin(JSON.parse(localStorage.getItem("adminUser") || "null"));
    } catch {
      setAdmin(null);
    }
  }, []);

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminTokenExpiry");
    navigate("/admin/login");
  }

  return (
    <>
      <nav className="admin-navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">VoteHub Admin</span>
          </div>
          <ul className={`navbar-menu${menuOpen ? " active" : ""}`}>
            <li>
              <NavLink to="/admin/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/candidates" className={navLinkClass}>
                Candidates
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/voters" className={navLinkClass}>
                Voters
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/election" className={navLinkClass}>
                Election Control
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/statistics" className={navLinkClass}>
                Statistics
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/results" className={navLinkClass}>
                Results
              </NavLink>
            </li>
            <li className="admin-user">
              <span id="adminName">{admin?.name || "Admin"}</span>
              <button type="button" onClick={logout} className="btn-logout">
                Logout
              </button>
            </li>
          </ul>
          <button type="button" className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="admin-container">
        <aside className="admin-sidebar">
          <div className="sidebar-menu">
            <NavLink to="/admin/dashboard" className={sideClass}>
              <span className="item-icon">📊</span>
              <span className="item-text">Dashboard</span>
            </NavLink>
            <NavLink to="/admin/candidates" className={sideClass}>
              <span className="item-icon">🎖️</span>
              <span className="item-text">Candidates</span>
            </NavLink>
            <NavLink to="/admin/voters" className={sideClass}>
              <span className="item-icon">👥</span>
              <span className="item-text">Voters</span>
            </NavLink>
            <NavLink to="/admin/election" className={sideClass}>
              <span className="item-icon">⚙️</span>
              <span className="item-text">Election Control</span>
            </NavLink>
            <NavLink to="/admin/statistics" className={sideClass}>
              <span className="item-icon">📈</span>
              <span className="item-text">Statistics</span>
            </NavLink>
            <NavLink to="/admin/results" className={sideClass}>
              <span className="item-icon">🏆</span>
              <span className="item-text">Results</span>
            </NavLink>
            <NavLink to="/admin/add-candidate" className={sideClass}>
              <span className="item-icon">➕</span>
              <span className="item-text">Add Candidate</span>
            </NavLink>
            <hr className="sidebar-divider" />
            <button type="button" className="sidebar-item" style={{ border: "none", background: "none", width: "100%", cursor: "pointer", textAlign: "left" }} onClick={logout}>
              <span className="item-icon">🚪</span>
              <span className="item-text">Logout</span>
            </button>
          </div>
        </aside>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
