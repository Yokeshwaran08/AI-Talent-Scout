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
      <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function CandidateCard({ candidate, rank, requiredSkills = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const {
    name, role, skills, experience, location, currentCompany,
    matchScore, interestScore, rankScore,
    interestLevel, outreach, response, reason, interestReasons,
    explanation, insight,
  } = candidate;

  const interest = INTEREST_CONFIG[interestLevel] || INTEREST_CONFIG["Medium"];
  const exp = explanation || {};

  return (
    <article className={`cand-card ${shortlisted ? "shortlisted" : ""}`}
      style={{ animationDelay: `${rank * 0.06}s` }}>

      {/* Top row: rank badge left, overall score right — no overlap */}
      <div className="card-top-row">
        <span className="rank-badge">#{rank}</span>
        <div className="cand-rank-score">
          <span className="rank-score-val">{rankScore}%</span>
          <span className="rank-score-label">Overall</span>
        </div>
      </div>

      {/* Header: avatar + name/role/tags */}
      <div className="cand-header">
        <div className="cand-avatar">
          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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

      {/* Match Breakdown */}
      <div className="breakdown-section">
        <div className="section-label">🧠 Match Breakdown</div>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="bd-key">Skills Match</span>
            <span className="bd-val">
              {exp.matchedCount ?? "—"}/{exp.totalRequired ?? "—"}
              {exp.skillMatchPct != null ? ` (${exp.skillMatchPct}%)` : ""}
            </span>
          </div>
          <div className="breakdown-item">
            <span className="bd-key">Experience Fit</span>
            <span className={`bd-val ${exp.experienceMatch === "Strong" ? "good" : exp.experienceMatch?.startsWith("Under") ? "warn" : ""}`}>
              {exp.experienceMatch ?? "—"}
            </span>
          </div>
          <div className="breakdown-item">
            <span className="bd-key">Location Fit</span>
            <span className={`bd-val ${exp.locationFit === "Exact Match" ? "good" : exp.locationFit === "Different City" ? "warn" : ""}`}>
              {exp.locationFit ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="skills-section">
        <div className="section-label">📊 Skills</div>
        <div className="skills-chips">
          {skills.map((skill, i) => {
            const req = requiredSkills.map(s => s.toLowerCase());
            const matched = req.length > 0 && req.includes(skill.toLowerCase());
            return (
              <span key={`${skill}-${i}`} className={`skill-chip ${matched ? "matched" : ""}`}>
                {matched ? "✔ " : ""}{skill}
              </span>
            );
          })}
          {requiredSkills
            .filter(r => !skills.map(s => s.toLowerCase()).includes(r.toLowerCase()))
            .map((r, i) => (
              <span key={`missing-${i}`} className="skill-chip not-present">✖ {r}</span>
            ))}
        </div>
      </div>

      {/* Recruiter Insight */}
      {insight && (
        <div className="insight-section">
          <div className="section-label">💡 Recruiter Insight</div>
          <p className="insight-text">{insight}</p>
        </div>
      )}

      {/* Expanded: Outreach + Interest Reasons */}
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
          <div className="interest-why" style={{ background: interest.bg, borderColor: interest.color }}>
            <div className="iw-header">
              <strong style={{ color: interest.color }}>{interest.emoji} {interestLevel} Interest</strong>
            </div>
            <div className="iw-reason-label">Reason:</div>
            <ul className="iw-reasons">
              {(interestReasons && interestReasons.length > 0 ? interestReasons : [reason]).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
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
