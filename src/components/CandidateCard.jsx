import React, { useState } from "react";
import "./CandidateCard.css";

const INTEREST_CONFIG = {
  High: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", emoji: "🔥" },
  "Medium-High": { color: "#84cc16", bg: "rgba(132,204,22,0.1)", emoji: "⚡" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", emoji: "🟡" },
  "Medium-Low": { color: "#f97316", bg: "rgba(249,115,22,0.1)", emoji: "🔶" },
  Low: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", emoji: "🔴" },
};

function ScoreBar({ value, color }) {
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export default function CandidateCard({ candidate, rank, requiredSkills = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const {
    name, role, skills, experience, location, currentCompany,
    matchScore, interestScore, rankScore,
    interestLevel, outreach, response, reason, explanation,
  } = candidate;

  const interest = INTEREST_CONFIG[interestLevel] || INTEREST_CONFIG["Medium"];
  const candidateLower = skills.map((s) => s.toLowerCase());
  const req = requiredSkills.map((s) => s.toLowerCase());

  return (
    <article className={`cand-card ${shortlisted ? "shortlisted" : ""}`} style={{ animationDelay: `${rank * 0.07}s` }}>
      {/* Rank badge */}
      <div className="rank-badge">#{rank}</div>

      {/* Header */}
      <div className="cand-header">
        <div className="cand-avatar" data-initials={name.split(" ").map(n=>n[0]).join("").slice(0,2)}>
          {name.split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div className="cand-meta">
          <h3 className="cand-name">{name}</h3>
          <p className="cand-role">{role}</p>
          <div className="cand-tags">
            <span className="meta-tag">📍 {location}</span>
            <span className="meta-tag">💼 {experience} yr{experience !== 1 ? "s" : ""}</span>
            <span className="meta-tag">🏢 {currentCompany}</span>
          </div>
        </div>
        <div className="cand-rank-score">
          <span className="rank-score-val">{rankScore}%</span>
          <span className="rank-score-label">Overall</span>
        </div>
      </div>

      {/* Scores */}
      <div className="scores-row">
        <div className="score-block">
          <div className="score-label">🧠 Match Score</div>
          <div className="score-value">{matchScore}%</div>
          <ScoreBar value={matchScore} color="#6366f1" />
        </div>
        <div className="score-divider" />
        <div className="score-block">
          <div className="score-label">❤️ Interest Score</div>
          <div className="score-value" style={{ color: interest.color }}>
            {interest.emoji} {interestLevel}
            <span className="score-num"> ({interestScore}%)</span>
          </div>
          <ScoreBar value={interestScore} color={interest.color} />
        </div>
      </div>

      {/* Skills */}
      <div className="skills-section">
        <div className="section-label">📊 Skills</div>
        <div className="skills-chips">
          {skills.map((skill) => {
            const matched = req.length === 0 || req.includes(skill.toLowerCase());
            return (
              <span key={skill} className={`skill-chip ${matched && req.length > 0 ? "matched" : ""} ${!matched && req.length > 0 ? "missing" : ""}`}>
                {req.length > 0 && (req.includes(skill.toLowerCase()) ? "✔ " : "")}
                {skill}
              </span>
            );
          })}
          {req.filter(r => !candidateLower.includes(r)).map(r => (
            <span key={r} className="skill-chip not-present">✖ {requiredSkills.find(s=>s.toLowerCase()===r) || r}</span>
          ))}
        </div>
      </div>

      {/* Why selected */}
      {explanation && explanation.length > 0 && (
        <div className="why-section">
          <div className="section-label">📝 Why Selected</div>
          <ul className="why-list">
            {explanation.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}

      {/* Expandable: Outreach */}
      {expanded && (
        <div className="outreach-section">
          <div className="section-label">💬 AI Outreach</div>
          <div className="outreach-bubble ai-bubble">
            <span className="bubble-label">AI</span>
            <p>{outreach}</p>
          </div>
          <div className="outreach-bubble cand-bubble">
            <span className="bubble-label">{name.split(" ")[0]}</span>
            <p>"{response}"</p>
          </div>
          <div className="interest-reason" style={{ background: interest.bg, borderColor: interest.color }}>
            <strong style={{ color: interest.color }}>{interest.emoji} {interestLevel} Interest</strong>
            <span> — {reason}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="cand-actions">
        <button className="btn-expand" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide Conversation ↑" : "View Conversation ↓"}
        </button>
        <button
          className={`btn-shortlist ${shortlisted ? "active" : ""}`}
          onClick={() => setShortlisted(!shortlisted)}
        >
          {shortlisted ? "✅ Shortlisted" : "⭐ Shortlist"}
        </button>
      </div>
    </article>
  );
}
