import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import JDInput from "./components/JDInput";
import LoadingState from "./components/LoadingState";
import ResultsList from "./components/ResultsList";
import EmptyState from "./components/EmptyState";
import ErrorBanner from "./components/ErrorBanner";
import JDValidationBanner from "./components/JDValidationBanner";
import Footer from "./components/Footer";
import { runPipeline } from "./services/pipeline";
import "./App.css";

const FALLBACK_WARNING = {
  message: "⚠️ AI response unavailable — showing estimated matches using fallback scoring logic. Results remain meaningful but may be less precise.",
  tooltip: "Fallback mode uses rule-based scoring for skills, experience, and location when AI is unavailable.",
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [results, setResults] = useState(null);
  const [jdParsed, setJdParsed] = useState(null);
  const [validation, setValidation] = useState(null);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState(null);

  const handleClear = useCallback(() => {
    setResults(null); setJdParsed(null);
    setValidation(null); setWarning(null); setError(null);
  }, []);

  const handleSubmit = useCallback(async (jdText) => {
    setResults(null); setJdParsed(null);
    setValidation(null); setWarning(null); setError(null);
    setIsLoading(true);

    try {
      const { candidates, parsedJD, validation: v, report } = await runPipeline(jdText, setLoadStep);
      setValidation(v);
      setJdParsed(parsedJD);

      if (report.usedFallback) {
        setWarning(FALLBACK_WARNING);
      }

      if (!v.isValid) { setIsLoading(false); return; }
      setResults(candidates.length > 0 ? candidates : null);
      if (candidates.length === 0) setError("No strong matches found. Try adding more specific skills.");
    } catch (e) {
      console.warn("Pipeline error:", e.message);
      setWarning(FALLBACK_WARNING);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <div className="app-bg" />
      <Header />
      <main className="app-main">
        <JDInput onSubmit={handleSubmit} isLoading={isLoading} onClear={handleClear} />

        {(validation || warning) && !isLoading && (
          <div className="container-narrow">
            {warning && (
              <ErrorBanner
                message={warning.message}
                tooltip={warning.tooltip}
                onDismiss={() => setWarning(null)}
                type="warning"
              />
            )}
            {validation && <JDValidationBanner validation={validation} />}
          </div>
        )}

        {error && !warning && (
          <div className="container-narrow">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isLoading && <LoadingState currentStep={loadStep} />}

        {!isLoading && results && <ResultsList candidates={results} jdParsed={jdParsed} validation={validation} />}

        {!isLoading && !results && validation?.state === "invalid" && (
          <div className="invalid-jd-empty">
            <span className="invalid-jd-emoji">🚫</span>
            <h3>No candidates generated</h3>
            <p>Reason:</p>
            <ul>{validation.missingFields.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <p className="invalid-jd-tip">👉 Try improving the job description and searching again.</p>
          </div>
        )}

        {!isLoading && !results && !validation && !error && <EmptyState />}
      </main>
      <Footer />
    </div>
  );
}
