import { Navigate, useLocation } from "react-router-dom";

export function VoterProtected({ children }) {
  const token = localStorage.getItem("voterToken");
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export function AdminProtected({ children }) {
  const token = localStorage.getItem("adminToken");
  const expiry = localStorage.getItem("adminTokenExpiry");
  const loc = useLocation();
  if (!token) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  if (expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminTokenExpiry");
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
