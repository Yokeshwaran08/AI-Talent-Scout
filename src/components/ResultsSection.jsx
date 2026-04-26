import React, { useState } from "react";
import CandidateCard from "./CandidateCard";
import "./ResultsSection.css";

const SORT_OPTIONS = [
  { value: "rank", label: "Overall Rank" },
  { value: "match", label: "Match Score" },
  { value: "interest", label: "Interest Score" },
];

const INTEREST_FILTER = ["All", "High", "Medium-High", "Medium", "Medium-Low", "Low"];

export default function ResultsSection({ candidates, jdParsed }) {
  const [sortBy, setSortBy] = useState("rank");
  const [filterInterest, setFilterInterest] = useState("All");
  const [showCount, setShowCount] = useState(10);

  const filtered = candidates.filter((c) =>
    filterInterest === "All" ? true : c.interestLevel === filterInterest
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rank") return (b.rankScore ?? 0) - (a.rankScore ?? 0);
    if (sortBy === "match") return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    if (sortBy === "interest") return (b.interestScore ?? 0) - (a.interestScore ?? 0);
    return 0;
  });

  const visible = sorted.slice(0, showCount);
  const requiredSkills = jdParsed?.skills || [];

  return (
    <section className="results-section">
      {/* Section title */}
      <div className="results-header">
        <div>
          <h2 className="results-title">🎯 Top Matching Candidates</h2>
          <p className="results-subtitle">
            {candidates.length} candidates scored • Ranked by combined match + interest
          </p>
        </div>
        {jdParsed?.title && (
          <div className="jd-parsed-tag">
            <span>Role:</span> {jdParsed.title}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="control-group">
          <span className="control-label">Sort by</span>
          <div className="btn-group">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-btn ${sortBy === opt.value ? "active" : ""}`}
                onClick={() => { setSortBy(opt.value); setShowCount(10); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span className="control-label">Filter Interest</span>
          <select
            className="filter-select"
            value={filterInterest}
            onChange={(e) => { setFilterInterest(e.target.value); setShowCount(10); }}
          >
            {INTEREST_FILTER.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {["High", "Medium-High", "Medium", "Low"].map((level) => {
          const count = candidates.filter((c) =>
            c.interestLevel === level ||
            (level === "Low" && ["Low", "Medium-Low"].includes(c.interestLevel))
          ).length;
          const colors = { High: "#22c55e", "Medium-High": "#84cc16", Medium: "#f59e0b", Low: "#ef4444" };
          return (
            <div
              key={level}
              className="stat-chip"
              style={{ borderColor: `${colors[level]}33`, background: `${colors[level]}0d` }}
            >
              <span style={{ color: colors[level] }}>{count}</span>
              <span className="stat-label">{level}</span>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="empty-results">
          <p>😔 No candidates match the current filter.</p>
          <button onClick={() => { setFilterInterest("All"); setShowCount(10); }}>
            Clear Filter
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="cards-list" key={sortBy + filterInterest}>
        {visible.map((candidate, i) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            rank={i + 1}
            requiredSkills={requiredSkills}
          />
        ))}
      </div>

      {/* Load more */}
      {sorted.length > showCount && (
        <div className="load-more-wrap">
          <button className="btn-load-more" onClick={() => setShowCount((n) => n + 10)}>
            Load {Math.min(10, sorted.length - showCount)} more candidates
          </button>
        </div>
      )}
    </section>
  );
}
