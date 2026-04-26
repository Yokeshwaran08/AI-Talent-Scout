import React from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message, onDismiss, type = "error" }) {
  const isWarning = type === "warning";
  return (
    <div className={`error-banner ${isWarning ? "warning" : ""}`}>
      <span className="error-icon">{isWarning ? "⚠️" : "⚠️"}</span>
      <span className="error-msg">{message}</span>
      {onDismiss && <button className="error-dismiss" onClick={onDismiss}>✕</button>}
    </div>
  );
}
