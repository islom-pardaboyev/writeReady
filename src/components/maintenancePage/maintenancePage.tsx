import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-07-20T10:00:00Z");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimeLeft() {
  const diff = Math.max(0, TARGET_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hrs:  Math.floor((diff % 86400000) / 3600000),
    min:  Math.floor((diff % 3600000) / 60000),
    sec:  Math.floor((diff % 60000) / 1000),
  };
}

export default function MaintenancePage() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: "2rem 1.5rem",
      textAlign: "center",
    }}>

      {/* Icon */}
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        background: "white", border: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "2rem", fontSize: "36px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        🔧
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#0f172a", margin: "0 0 0.75rem" }}>
        We're tuning things up
      </h1>
      <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.7", maxWidth: "420px", margin: "0 auto 2.5rem" }}>
        WriteReady is undergoing scheduled maintenance to bring you a faster, more reliable experience. We'll be back shortly.
      </p>

      {/* Date card */}
      <div style={{
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: "16px", padding: "1.25rem 2rem",
        display: "flex", alignItems: "center", gap: "1.5rem",
        marginBottom: "2.5rem", flexWrap: "wrap", justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            Maintenance started
          </p>
          <p style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
            June 15, 2026 · 02:00 UTC
          </p>
        </div>
        <div style={{ width: "1px", height: "40px", background: "#e2e8f0" }} />
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            Estimated completion
          </p>
          <p style={{ fontSize: "15px", fontWeight: "600", color: "#6366f1", margin: 0 }}>
            July 20, 2026 · 10:00 UTC
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", alignItems: "center", marginBottom: "2.5rem" }}>
        {[
          { val: time.days, label: "days" },
          { val: time.hrs,  label: "hours" },
          { val: time.min,  label: "min" },
          { val: time.sec,  label: "sec" },
        ].map((unit, i) => (
          <div key={unit.label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "36px", fontWeight: "700", color: "#0f172a",
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: "12px", padding: "12px 18px",
                minWidth: "70px", lineHeight: 1,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                {pad(unit.val)}
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {unit.label}
              </p>
            </div>
            {i < 3 && (
              <span style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "18px" }}>:</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ width: "300px", marginBottom: "0.5rem" }}>
        <div style={{
          height: "6px", background: "#e2e8f0",
          borderRadius: "3px", overflow: "hidden",
        }}>
          <div style={{
            width: "30%", height: "100%",
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius: "3px",
          }} />
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
          30% complete
        </p>
      </div>

      {/* Status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2rem" }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#f59e0b",
          boxShadow: "0 0 0 3px rgba(245,158,11,0.2)",
        }} />
        <span style={{ fontSize: "13px", color: "#94a3b8" }}>Maintenance in progress</span>
      </div>
    </div>
  );
}