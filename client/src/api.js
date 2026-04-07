/** Base URL for API. Empty = same origin (Vite proxy in dev, Express in prod). */
export function getApiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, "");
  return "";
}

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${getApiBase()}${path}`;
}

export function voterHeaders() {
  const token = localStorage.getItem("voterToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function adminHeaders(json = true) {
  const token = localStorage.getItem("adminToken");
  const h = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (json) h["Content-Type"] = "application/json";
  return h;
}
