import React from "react";
import "./EmptyState.css";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <div className="empty-orb" />
        <span className="empty-emoji">🚀</span>
      </div>
      <h3 className="empty-heading">No candidates yet</h3>
      <p className="empty-body">
        Paste a job description above and click <strong>Find Candidates</strong> to get started.
        The AI will match, score, and rank the best profiles for you.
      </p>
      <div className="empty-steps">
        <div className="empty-step"><span>1</span> Paste JD</div>
        <div className="empty-arrow">→</div>
        <div className="empty-step"><span>2</span> AI Matches</div>
        <div className="empty-arrow">→</div>
        <div className="empty-step"><span>3</span> Ranked Shortlist</div>
      </div>
    </div>
  );
}
