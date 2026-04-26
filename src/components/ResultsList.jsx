import React, { useState, useMemo } from "react";
import CandidateCard from "./CandidateCard";
import { SORT_OPTIONS, INTEREST_FILTERS, filterCandidates, sortCandidates } from "../utils/sort";
import { CONFIG } from "../config";
import "./ResultsList.css";

export default function ResultsList({ candidates, jdParsed, validation }) {
  const [sortBy, setSortBy] = useState("rank");
  const [filterInterest, setFilterInterest] = useState("All");
  const [showCount, setShowCount] = useState(CONFIG.INITIAL_RENDER);

  // Memoised — only recalculates when candidates, filter, or sort changes
  const filtered = useMemo(
    () => filterCandidates(candidates, filterInterest),
    [candidates, filterInterest]
  );

  const sorted = useMemo(
    () => sortCandidates(filtered, sortBy),
    [filtered, sortBy]
  );

  const visible = sorted.slice(0, showCount);
  const requiredSkills = jdParsed?.skills || [];

  const handleSort = (val) => { setSortBy(val); setShowCount(CONFIG.INITIAL_RENDER); };
  const handleFilter = (e) => { setFilterInterest(e.target.value); setShowCount(CONFIG.INITIAL_RENDER); };

  return (
    <section className="results-section">
      {/* Header */}
      <div className="results-header">
        <div>
          <h2 className="results-title">🎯 Top Matching Candidates</h2>
          <p className="results-subtitle">
            {candidates.length} candidates scored • Ranked by combined match + interest
          </p>
        </div>
        {jdParsed?.title && (
          <div className="jd-parsed-tag"><span>Role:</span> {jdParsed.title}</div>
        )}
      </div>

      {/* Partial JD warning */}
      {validation?.state === "partial" && (
        <div className="partial-warning">
          ⚠️ Low-confidence results — limited JD info detected. Results based on partial matching.
        </div>
      )}

      {/* Controls */}
      <div className="controls-bar">
        <div className="control-group">
          <span className="control-label">Sort by</span>
          <div className="btn-group">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-btn ${sortBy === opt.value ? "active" : ""}`}
                onClick={() => handleSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span className="control-label">Filter Interest</span>
          <select className="filter-select" value={filterInterest} onChange={handleFilter}>
            {INTEREST_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {["High", "Medium-High", "Medium", "Low"].map((level) => {
          const count = filterCandidates(candidates, level).length;
          const colors = { High: "#22c55e", "Medium-High": "#84cc16", Medium: "#f59e0b", Low: "#ef4444" };
          return (
            <div key={level} className="stat-chip"
              style={{ borderColor: `${colors[level]}33`, background: `${colors[level]}0d` }}>
              <span style={{ color: colors[level] }}>{count}</span>
              <span className="stat-label">{level}</span>
            </div>
          );
        })}
      </div>

      {/* Empty filter state */}
      {visible.length === 0 && (
        <div className="empty-results">
          <p>😔 No candidates match the current filter.</p>
          <button onClick={() => { setFilterInterest("All"); setShowCount(CONFIG.INITIAL_RENDER); }}>
            Clear Filter
          </button>
        </div>
      )}

      {/* Cards — first INITIAL_RENDER shown immediately */}
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
