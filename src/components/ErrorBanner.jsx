import React, { useState } from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message, tooltip, onDismiss, type = "error" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isWarning = type === "warning";

  // Strip any leading emoji/whitespace so the banner icon is the only one shown
  const cleanMessage = typeof message === "string"
    ? message.replace(/^[⚠️\s]+/, "").trim()
    : message;

  return (
    <div className={`error-banner ${isWarning ? "warning" : ""}`}>
      <span className="error-icon">⚠️</span>

      <span className="error-msg">{cleanMessage}</span>

      {tooltip && (
        <div className="tooltip-wrap">
          <button
            className="tooltip-trigger"
            onClick={() => setShowTooltip((v) => !v)}
            aria-label="More info"
          >
            ℹ
          </button>
          {showTooltip && (
            <div className="tooltip-box">
              {tooltip}
            </div>
          )}
        </div>
      )}

      {onDismiss && (
        <button className="error-dismiss" onClick={onDismiss}>✕</button>
      )}
    </div>
  );
}
