import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-badge">
          <span className="pulse-dot" />
          AI-Powered
        </div>
        <h1 className="header-title">
          <span className="header-icon">⚡</span>
          AI Talent Scout
        </h1>
        <p className="header-tagline">
          Find, engage, and rank candidates — intelligently.
        </p>
      </div>
      <div className="header-glow" />
    </header>
  );
}
