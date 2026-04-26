// ─── Pipeline Controller ─────────────────────────────────────
// Single entry point for the full talent-scouting pipeline.
// App.jsx calls runPipeline() and gets back ranked candidates.

import { parseJD } from "./jdParser";
import { matchCandidates } from "./matcher";
import { simulateInterest } from "./interestSimulator";
import { rankCandidates, generateInsight } from "./ranker";
import { validateJD } from "../utils/helpers";
import { CANDIDATES } from "../data/candidates";

export async function runPipeline(jdText, onStep) {
  const report = { usedFallback: false, error: null };

  // Step 1: Parse
  onStep(0);
  let parsedJD;
  try {
    parsedJD = await parseJD(jdText);
  } catch (e) {
    console.warn("Pipeline: JD parse failed", e.message);
    report.usedFallback = true;
    report.error = "JD parsing failed — using fallback extraction.";
    parsedJD = { title: null, skills: [], experience: null, location: null };
  }

  // Step 2: Validate
  const validation = validateJD(parsedJD, jdText);
  if (!validation.isValid) {
    return { candidates: [], parsedJD, validation, report };
  }

  // Step 3: Match
  onStep(1);
  let matched;
  try {
    matched = matchCandidates(CANDIDATES, parsedJD);
  } catch (e) {
    console.warn("Pipeline: matching failed", e.message);
    report.usedFallback = true;
    matched = CANDIDATES.slice(0, 20).map((c) => ({ ...c, matchScore: 40, skillScore: 40, expScore: 70, locScore: 80, explanation: {} }));
  }

  // Step 4: Simulate interest
  onStep(2);
  let withInterest;
  try {
    withInterest = await simulateInterest(matched, parsedJD);
    const anyFallback = withInterest.some((c) => c.usedFallback);
    if (anyFallback) report.usedFallback = true;
  } catch (e) {
    console.warn("Pipeline: interest simulation failed", e.message);
    report.usedFallback = true;
    withInterest = matched.map((c) => ({
      ...c,
      interestLevel: "Medium",
      interestScore: 50,
      outreach: `Hi ${c.name}, we have an opportunity that matches your profile.`,
      response: "Thanks for reaching out. I'd be happy to learn more.",
      reason: "Estimated (API unavailable)",
      interestReasons: ["Score estimated due to API issue"],
      usedFallback: true,
    }));
  }

  // Step 5: Rank and add insights
  onStep(3);
  const ranked = rankCandidates(withInterest).map((c) => ({
    ...c,
    insight: generateInsight(c),
  }));

  return { candidates: ranked, parsedJD, validation, report };
}
