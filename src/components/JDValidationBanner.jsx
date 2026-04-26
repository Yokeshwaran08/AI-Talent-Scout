import React from "react";
import "./JDValidationBanner.css";

export default function JDValidationBanner({ validation }) {
  if (!validation) return null;

  const { state, confidence, missingFields, message } = validation;

  const config = {
    good: {
      icon: "✅",
      label: "Good JD",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.07)",
      border: "rgba(34,197,94,0.25)",
      barColor: "#22c55e",
    },
    partial: {
      icon: "⚠️",
      label: "Partial JD",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
      border: "rgba(245,158,11,0.25)",
      barColor: "#f59e0b",
    },
    invalid: {
      icon: "🚫",
      label: "Invalid JD",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.07)",
      border: "rgba(239,68,68,0.25)",
      barColor: "#ef4444",
    },
  };

  const c = config[state];

  return (
    <div
      className="jd-validation-banner"
      style={{ background: c.bg, borderColor: c.border }}
    >
      {/* Top row */}
      <div className="jdv-top">
        <div className="jdv-left">
          <span className="jdv-icon">{c.icon}</span>
          <div>
            <div className="jdv-label" style={{ color: c.color }}>{c.label}</div>
            <div className="jdv-message">{message}</div>
          </div>
        </div>

        {/* Confidence score */}
        <div className="jdv-confidence">
          <div className="jdv-conf-value" style={{ color: c.color }}>
            {confidence}%
          </div>
          <div className="jdv-conf-label">JD Confidence</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="jdv-bar-track">
        <div
          className="jdv-bar-fill"
          style={{ width: `${confidence}%`, background: c.barColor }}
        />
      </div>

      {/* Missing fields — only show if something's missing */}
      {missingFields && missingFields.length > 0 && (
        <div className="jdv-missing">
          <span className="jdv-missing-label">Missing:</span>
          <ul className="jdv-missing-list">
            {missingFields.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Invalid state — extra help text */}
      {state === "invalid" && (
        <div className="jdv-hint">
          Try including: role title, required skills (e.g. React, Python), and experience level.
        </div>
      )}
    </div>
  );
}
