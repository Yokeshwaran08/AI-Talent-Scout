// ─── Ranker Service ──────────────────────────────────────────
import { computeFinalScore } from "../utils/scoring";

export function rankCandidates(candidates) {
  return candidates
    .map((c) => ({
      ...c,
      rankScore: computeFinalScore(c.matchScore, c.interestScore ?? 50),
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

export function generateInsight(candidate) {
  const { matchScore, interestLevel, interestScore, explanation } = candidate;
  const { experienceMatch, locationFit, matchedSkills } = explanation || {};

  if (matchScore >= 75 && interestLevel === "High") {
    return "Highly likely to convert — strong skill alignment, active interest, and ideal experience fit.";
  }
  if (matchScore >= 60 && ["High", "Medium-High"].includes(interestLevel)) {
    return "Strong candidate — good technical match and expressed interest in the role.";
  }
  if (matchScore >= 75 && interestLevel === "Medium") {
    return "Excellent technical fit but may need a compelling offer to move — currently passive.";
  }
  if (matchScore < 50 && interestLevel === "High") {
    return "High enthusiasm but skill gaps present — consider for a junior variant of this role.";
  }
  if (interestLevel === "Low") {
    return "Low availability signal — recently placed or not open to switch. Revisit in 3-6 months.";
  }
  return "Moderate fit — worth an exploratory conversation to assess alignment.";
}
