import React, { useState } from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message, tooltip, onDismiss, type = "error" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isWarning = type === "warning";

  return (
    <div className={`error-banner ${isWarning ? "warning" : ""}`}>
      <span className="error-icon">⚠️</span>
      <span className="error-msg">
        {message}
        {tooltip && (
          <span className="tooltip-wrap">
            <button
              className="tooltip-trigger"
              onClick={() => setShowTooltip((v) => !v)}
              aria-label="More info"
            >
              ℹ
            </button>
            {showTooltip && (
              <span className="tooltip-box">
                {tooltip}
              </span>
            )}
          </span>
        )}
      </span>
      {onDismiss && (
        <button className="error-dismiss" onClick={onDismiss}>✕</button>
      )}
    </div>
  );
}
