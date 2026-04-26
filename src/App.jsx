import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import JDInput from "./components/JDInput";
import LoadingState from "./components/LoadingState";
import ResultsSection from "./components/ResultsSection";
import EmptyState from "./components/EmptyState";
import ErrorBanner from "./components/ErrorBanner";
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
  interestLevelToScore,
} from "./utils/scoring";
import "./App.css";

// ─── Pipeline ────────────────────────────────────────────────
// 1. Parse JD (LLM)  → extract skills/exp/location
// 2. Score each candidate with JS logic
// 3. Take top-N for outreach simulation (LLM)
// 4. Merge scores, rank, render

const OUTREACH_BATCH = 15; // candidates sent through LLM outreach

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [results, setResults] = useState(null);
  const [jdParsed, setJdParsed] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (jdText) => {
    if (!jdText.trim()) return;
    setError(null);
    setResults(null);
    setIsLoading(true);
    setLoadStep(0);

    try {
      // ── Step 1: Parse JD ──────────────────────────────────
      let parsed;
      try {
        parsed = await parseJobDescription(jdText);
      } catch {
        // Fallback: use JS-based extraction
        parsed = {
          title: "Open Role",
          skills: extractSkillsFromText(jdText),
          experience: extractExperienceFromText(jdText),
          location: extractLocationFromText(jdText),
          summary: jdText.slice(0, 120),
        };
      }

      // Ensure skills array populated
      if (!parsed.skills || parsed.skills.length === 0) {
        parsed.skills = extractSkillsFromText(jdText);
      }
      if (!parsed.experience || parsed.experience.min === undefined) {
        parsed.experience = extractExperienceFromText(jdText);
      }
      setJdParsed(parsed);
      setLoadStep(1);

      // ── Step 2: Score all candidates ──────────────────────
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

      // Sort by match score, take top candidates for outreach
      const sorted = [...scored].sort((a, b) => b.matchScore - a.matchScore);
      const topCandidates = sorted.slice(0, OUTREACH_BATCH);
      const rest = sorted.slice(OUTREACH_BATCH);
      setLoadStep(2);

      // ── Step 3: Simulate outreach for top candidates ──────
      const outreachResults = await Promise.allSettled(
        topCandidates.map((c) => simulateOutreach(c, parsed))
      );

      setLoadStep(3);

      // Merge outreach into candidates
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
        // Fallback interest
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

      // For rest (below OUTREACH_BATCH), apply quick interest estimate without LLM
      const enrichedRest = rest.map((c) => {
        const availMap = { open: 82, passive: 55, conditional: 68, not_looking: 18 };
        const interestScore = availMap[c.availability] ?? 50;
        const interestLevel = interestScore > 75 ? "High" : interestScore > 60 ? "Medium-High" : interestScore > 45 ? "Medium" : interestScore > 30 ? "Medium-Low" : "Low";
        return {
          ...c,
          outreach: `Hi ${c.name}, we found your profile relevant for an exciting opportunity.`,
          response: interestLevel === "High" ? "Hi, this sounds interesting! I'd love to hear more." : interestLevel === "Low" ? "Hi, I appreciate the outreach but I'm not considering a switch right now." : "Hi, thanks for reaching out. I'm open to hearing more details.",
          interestLevel,
          interestScore,
          reason: "Estimated from availability signals.",
          rankScore: calculateRankScore(c.matchScore, interestScore),
        };
      });

      const all = [...enrichedTop, ...enrichedRest].sort((a, b) => b.rankScore - a.rankScore);

      // Only show candidates with meaningful match score
      const finalResults = all.filter((c) => c.matchScore >= 10);

      setResults(finalResults.length > 0 ? finalResults : null);

      if (finalResults.length === 0) {
        setError("No strong matches found. Try refining your job description with more specific skills.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Showing fallback results.");
      // Show all candidates with basic scores
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
        <JDInput onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <div className="container-narrow">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isLoading && <LoadingState currentStep={loadStep} />}

        {!isLoading && results && (
          <ResultsSection candidates={results} jdParsed={jdParsed} />
        )}

        {!isLoading && !results && !error && <EmptyState />}
      </main>

      <Footer />
    </div>
  );
}
