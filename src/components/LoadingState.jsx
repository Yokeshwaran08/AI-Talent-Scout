import React, { useEffect, useState } from "react";
import "./LoadingState.css";

const STEPS = [
  { icon: "📄", text: "Analysing Job Description..." },
  { icon: "🧠", text: "Matching candidates..." },
  { icon: "💬", text: "Simulating interest conversations..." },
  { icon: "📊", text: "Ranking shortlist..." },
];

export default function LoadingState({ currentStep = 0 }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="loading-wrapper">
      <div className="loading-card">
        <div className="loading-orb" />
        <h3 className="loading-heading">Working on it{dots}</h3>
        <div className="loading-steps">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className={`loading-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
              >
                <div className="step-icon-wrap">
                  {isDone ? "✅" : isActive ? <span className="mini-spinner" /> : step.icon}
                </div>
                <span className="step-text">{step.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
