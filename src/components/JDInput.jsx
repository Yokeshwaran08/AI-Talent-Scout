import React, { useState } from "react";
import "./JDInput.css";

const SAMPLE_JD = `We are looking for a Senior Frontend Developer with 3+ years of experience in React, TypeScript, and Redux. 

The ideal candidate should have:
- Strong proficiency in React and modern JavaScript (ES6+)
- Experience with Redux or similar state management
- Familiarity with GraphQL and REST APIs
- Experience with Jest and testing best practices
- Location: Bangalore or Remote

Nice to have: Next.js, performance optimization, design systems.`;

export default function JDInput({ onSubmit, isLoading }) {
  const [jd, setJd] = useState("");

  const handleSubmit = () => {
    if (!jd.trim()) return;
    onSubmit(jd.trim());
  };

  const handleSample = () => setJd(SAMPLE_JD);

  return (
    <section className="jd-section">
      <div className="jd-card">
        <div className="jd-card-header">
          <span className="jd-icon">📄</span>
          <div>
            <h2 className="jd-title">Paste Job Description</h2>
            <p className="jd-subtitle">AI will extract skills, match candidates, and simulate outreach</p>
          </div>
        </div>

        <textarea
          className="jd-textarea"
          placeholder="Paste job description here (skills, experience, location…)"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={10}
          disabled={isLoading}
        />

        <div className="jd-actions">
          <button className="btn-sample" onClick={handleSample} disabled={isLoading}>
            Load Sample JD
          </button>
          <button
            className="btn-find"
            onClick={handleSubmit}
            disabled={isLoading || !jd.trim()}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" /> Processing...
              </span>
            ) : (
              <>🔍 Find Candidates</>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
