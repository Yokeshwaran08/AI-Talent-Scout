/**
 * Pipeline Controller
 * ─────────────────────────────────────────────
 * Single entry point for the full talent-scouting pipeline.
 * App.jsx calls runPipeline() and receives ranked candidates.
 *
 * Pipeline:
 * 1. Parse JD        — extract skills, experience, location via LLM + JS fallback
 * 2. Validate        — check confidence score; block if JD is unusable
 * 3. Match candidates — score all 70 candidates; filter by MIN_MATCH_SCORE
 * 4. Simulate interest — LLM for top N, mock fallback for the rest
 * 5. Rank + insights  — compute final score, attach recruiter insight per card
 */

import { parseJD } from "./jdParser";
import { matchCandidates } from "./matcher";
import { simulateInterest } from "./interestSimulator";
import { rankCandidates, generateInsight } from "./ranker";
import { validateJD } from "../utils/helpers";
import { CANDIDATES } from "../data/candidates";
import { CONFIG } from "../config";

export async function runPipeline(jdText, onStep) {
  const report = { usedFallback: false, error: null };

  // ── Step 1: Parse ────────────────────────────────────────────
  onStep(0);
  let parsedJD;
  try {
    parsedJD = await parseJD(jdText);
  } catch (e) {
    console.warn("Pipeline: JD parse failed —", e.message);
    report.usedFallback = true;
    report.error = "JD parsing failed — using fallback extraction.";
    parsedJD = { title: null, skills: [], experience: null, location: null };
  }

  // ── Step 2: Validate ─────────────────────────────────────────
  const validation = validateJD(parsedJD, jdText);
  if (!validation.isValid) {
    return { candidates: [], parsedJD, validation, report };
  }

  // ── Step 3: Match ────────────────────────────────────────────
  onStep(1);
  let matched;
  try {
    matched = matchCandidates(CANDIDATES, parsedJD);
  } catch (e) {
    console.warn("Pipeline: matching failed —", e.message);
    report.usedFallback = true;
    matched = CANDIDATES.slice(0, 20).map((c) => ({
      ...c,
      matchScore: CONFIG.FALLBACK.MATCH_SCORE,
      skillScore: CONFIG.FALLBACK.SKILL_SCORE,
      expScore:   CONFIG.FALLBACK.EXP_SCORE,
      locScore:   CONFIG.FALLBACK.LOC_SCORE,
      explanation: {},
    }));
  }

  // ── Step 4: Simulate interest ────────────────────────────────
  onStep(2);
  let withInterest;
  try {
    withInterest = await simulateInterest(matched, parsedJD);
    if (withInterest.some((c) => c.usedFallback)) report.usedFallback = true;
  } catch (e) {
    console.warn("Pipeline: interest simulation failed —", e.message);
    report.usedFallback = true;
    withInterest = matched.map((c) => ({
      ...c,
      interestLevel:   CONFIG.FALLBACK.INTEREST_LEVEL,
      interestScore:   CONFIG.FALLBACK.INTEREST_SCORE,
      outreach:        CONFIG.FALLBACK.OUTREACH(c.name),
      response:        CONFIG.FALLBACK.RESPONSE,
      reason:          CONFIG.FALLBACK.REASON,
      interestReasons: CONFIG.FALLBACK.INTEREST_REASONS,
      usedFallback:    true,
    }));
  }

  // ── Step 5: Rank + insights ──────────────────────────────────
  onStep(3);
  const ranked = rankCandidates(withInterest).map((c) => ({
    ...c,
    insight: generateInsight(c),
  }));

  return { candidates: ranked, parsedJD, validation, report };
}
