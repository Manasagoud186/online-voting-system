import { useCallback, useEffect, useState } from "react";
import { getApiBase, adminHeaders } from "../api.js";
import { useToast } from "../ToastContext.jsx";

export default function AdminElectionPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState("CLOSED");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timer, setTimer] = useState("--:--:--");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [extendMin, setExtendMin] = useState(30);

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/api/admin/election-status`, { headers: adminHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const st = (data.status || "CLOSED").toUpperCase();
    setStatus(st);
    setStartTime(data.startTime ? new Date(data.startTime) : null);
    setEndTime(data.endTime ? new Date(data.endTime) : null);
  }, []);

  useEffect(() => {
    load().catch((e) => showToast(e.message, "error"));
    const id = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [load, showToast]);

  useEffect(() => {
    const target =
      status === "ACTIVE" && endTime ? endTime : status === "UPCOMING" && startTime ? startTime : null;
    if (!target) {
      setTimer("--:--:--");
      return;
    }
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimer("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimer(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, startTime, endTime]);

  async function post(path, body) {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "POST",
      headers: adminHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
    return data;
  }

  async function act(label, fn) {
    try {
      await fn();
      showToast(`✅ ${label}`, "success");
      await load();
    } catch (e) {
      showToast(`❌ ${e.message}`, "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="header-title">
          <h1>Election Control</h1>
          <p>Manage election status and timing</p>
        </div>
      </div>

      <div className="control-card election-status-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2>Current Election Status</h2>
        </div>
        <div className="card-body">
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Start:</strong> {startTime ? startTime.toLocaleString() : "—"}
          </p>
          <p>
            <strong>End:</strong> {endTime ? endTime.toLocaleString() : "—"}
          </p>
          <p>
            <strong>Timer:</strong> {timer}
          </p>
        </div>
      </div>

      <div className="control-actions" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        <div className="action-card">
          <h3>Start Election</h3>
          <button type="button" className="btn btn-primary btn-large" onClick={() => act("Election started", () => post("/api/admin/election/start", {}))}>
            Start Election
          </button>
        </div>
        <div className="action-card">
          <h3>Stop Election</h3>
          <button type="button" className="btn btn-danger btn-large" onClick={() => act("Election stopped", () => post("/api/admin/election/stop"))}>
            Stop Election
          </button>
        </div>
        <div className="action-card">
          <h3>Pause</h3>
          <button type="button" className="btn btn-secondary btn-large" onClick={() => act("Paused", () => post("/api/admin/election/pause"))}>
            Pause
          </button>
        </div>
        <div className="action-card">
          <h3>Resume</h3>
          <button type="button" className="btn btn-secondary btn-large" onClick={() => act("Resumed", () => post("/api/admin/election/resume"))}>
            Resume
          </button>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 24 }}>
        <h2>Extend active election (minutes)</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input type="number" min={1} value={extendMin} onChange={(e) => setExtendMin(Number(e.target.value))} className="form-input" style={{ width: 120 }} />
          <button type="button" className="btn btn-primary" onClick={() => act("Extended", () => post("/api/admin/election/extend", { additionalMinutes: extendMin }))}>
            Extend
          </button>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 24 }}>
        <h2>Schedule election</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act("Scheduled", () => post("/api/admin/election/schedule", { startTime: scheduleStart, endTime: scheduleEnd }));
          }}
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Start (local)</label>
            <input className="form-input" type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>End (local)</label>
            <input className="form-input" type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            Schedule
          </button>
        </form>
      </div>
    </>
  );
}
