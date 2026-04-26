import React from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner">
      <span className="error-icon">⚠️</span>
      <span className="error-msg">{message}</span>
      {onDismiss && (
        <button className="error-dismiss" onClick={onDismiss}>✕</button>
      )}
    </div>
  );
}
