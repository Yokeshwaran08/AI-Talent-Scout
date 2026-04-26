import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import JDInput from "./components/JDInput";
import LoadingState from "./components/LoadingState";
import ResultsSection from "./components/ResultsSection";
import EmptyState from "./components/EmptyState";
import ErrorBanner from "./components/ErrorBanner";
import JDValidationBanner from "./components/JDValidationBanner";
import Footer from "./components/Footer";
import { CANDIDATES } from "./data/candidates";
import { parseJobDescription, simulateOutreach } from "./utils/api";
import {
  extractSkillsFromText,
  extractExperienceFromText,
  extractLocationFromText,
  calculateSkillMatchScore,
  calculateExperienceScore,
  calculateLocationScore,
  calculateMatchScore,
  calculateRankScore,
  buildExplanation,
  validateJD,
} from "./utils/scoring";
import "./App.css";

const OUTREACH_BATCH = 15;

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [results, setResults] = useState(null);
  const [jdParsed, setJdParsed] = useState(null);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);

  const handleClear = useCallback(() => {
    setResults(null);
    setJdParsed(null);
    setError(null);
    setValidation(null);
  }, []);

  const handleSubmit = useCallback(async (jdText) => {
    if (!jdText.trim()) return;
    setError(null);
    setResults(null);
    setValidation(null);
    setIsLoading(true);
    setLoadStep(0);

    try {
      // ── Step 1: Parse JD ──────────────────────────────────
      let parsed;
      try {
        parsed = await parseJobDescription(jdText);
      } catch {
        parsed = {
          title: null,
          skills: extractSkillsFromText(jdText),
          experience: extractExperienceFromText(jdText),
          location: extractLocationFromText(jdText),
          summary: jdText.slice(0, 120),
        };
      }

      // Fill in any blanks with JS-based extraction
      if (!parsed.skills || parsed.skills.length === 0) {
        parsed.skills = extractSkillsFromText(jdText);
      }
      if (!parsed.experience || parsed.experience.min === undefined) {
        parsed.experience = extractExperienceFromText(jdText);
      }

      // ── Step 2: Validate the JD ───────────────────────────
      const jdValidation = validateJD(parsed, jdText);
      setValidation(jdValidation);

      // ── BLOCK: Invalid JD — stop here ─────────────────────
      if (!jdValidation.isValid) {
        setIsLoading(false);
        return;
      }

      setJdParsed(parsed);
      setLoadStep(1);

      // ── Step 3: Score all candidates ──────────────────────
      const scored = CANDIDATES.map((c) => {
        const skillScore = calculateSkillMatchScore(parsed.skills, c.skills);
        const expScore = calculateExperienceScore(parsed.experience, c.experience);
        const locScore = calculateLocationScore(parsed.location, c.location);
        const matchScore = calculateMatchScore(skillScore, expScore, locScore);
        const explanation = buildExplanation(
          parsed.skills, c.skills, parsed.experience, c.experience, matchScore, locScore
        );
        return { ...c, skillScore, expScore, locScore, matchScore, explanation };
      });

      const sortedByMatch = [...scored].sort((a, b) => b.matchScore - a.matchScore);
      const topCandidates = sortedByMatch.slice(0, OUTREACH_BATCH);
      const rest = sortedByMatch.slice(OUTREACH_BATCH);
      setLoadStep(2);

      // ── Step 4: Simulate outreach for top candidates ──────
      const outreachResults = await Promise.allSettled(
        topCandidates.map((c) => simulateOutreach(c, parsed))
      );

      setLoadStep(3);

      const enrichedTop = topCandidates.map((c, i) => {
        const result = outreachResults[i];
        if (result.status === "fulfilled") {
          const { outreach, response, interestLevel, score, reason } = result.value;
          return {
            ...c,
            outreach,
            response,
            interestLevel,
            interestScore: score,
            reason,
            rankScore: calculateRankScore(c.matchScore, score),
          };
        }
        const fallbackScore = c.matchScore > 70 ? 75 : c.matchScore > 50 ? 55 : 30;
        return {
          ...c,
          outreach: `Hi ${c.name}, we have an exciting opportunity that matches your profile.`,
          response: "Thanks for reaching out. I'd be open to learning more about this role.",
          interestLevel: fallbackScore > 70 ? "High" : fallbackScore > 50 ? "Medium" : "Low",
          interestScore: fallbackScore,
          reason: "Score estimated based on availability.",
          rankScore: calculateRankScore(c.matchScore, fallbackScore),
        };
      });

      const enrichedRest = rest.map((c) => {
        const availMap = { open: 82, passive: 55, conditional: 68, not_looking: 18 };
        const interestScore = availMap[c.availability] ?? 50;
        const interestLevel =
          interestScore > 75 ? "High" :
          interestScore > 60 ? "Medium-High" :
          interestScore > 45 ? "Medium" :
          interestScore > 30 ? "Medium-Low" : "Low";
        return {
          ...c,
          outreach: `Hi ${c.name}, we found your profile relevant for an exciting opportunity.`,
          response:
            interestLevel === "High" ? "Hi, this sounds interesting! I'd love to hear more." :
            interestLevel === "Low" ? "Hi, I appreciate the outreach but I'm not considering a switch right now." :
            "Hi, thanks for reaching out. I'm open to hearing more details.",
          interestLevel,
          interestScore,
          reason: "Estimated from availability signals.",
          rankScore: calculateRankScore(c.matchScore, interestScore),
        };
      });

      const all = [...enrichedTop, ...enrichedRest].sort((a, b) => b.rankScore - a.rankScore);
      const finalResults = all.filter((c) => c.matchScore >= 10);

      setResults(finalResults.length > 0 ? finalResults : null);

      if (finalResults.length === 0) {
        setError("No strong matches found. Try refining your job description with more specific skills.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Showing fallback results.");
      const fallback = CANDIDATES.map((c) => ({
        ...c,
        matchScore: Math.floor(Math.random() * 40 + 30),
        interestScore: Math.floor(Math.random() * 50 + 30),
        rankScore: Math.floor(Math.random() * 40 + 30),
        interestLevel: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
        outreach: `Hi ${c.name}, we have an opportunity that matches your profile.`,
        response: "Thanks for reaching out. I'd be happy to learn more.",
        reason: "Estimated score (API unavailable).",
        explanation: ["API unavailable — using fallback scoring"],
      })).sort((a, b) => b.rankScore - a.rankScore);
      setResults(fallback);
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

        {/* JD Validation Banner — shown after every submit */}
        {validation && !isLoading && (
          <div className="container-narrow">
            <JDValidationBanner validation={validation} />
          </div>
        )}

        {error && (
          <div className="container-narrow">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isLoading && <LoadingState currentStep={loadStep} />}

        {!isLoading && results && (
          <ResultsSection candidates={results} jdParsed={jdParsed} validation={validation} />
        )}

        {/* Invalid JD empty state */}
        {!isLoading && !results && validation?.state === "invalid" && (
          <div className="invalid-jd-empty">
            <span className="invalid-jd-emoji">🚫</span>
            <h3>No candidates generated</h3>
            <p>Reason:</p>
            <ul>
              {validation.missingFields.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <p className="invalid-jd-tip">👉 Try improving the job description and searching again.</p>
          </div>
        )}

        {!isLoading && !results && !error && !validation && <EmptyState />}
      </main>

      <Footer />
    </div>
  );
}
