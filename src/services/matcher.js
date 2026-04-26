// ─── Candidate Matcher Service ───────────────────────────────
import {
  computeSkillScore,
  computeExperienceScore,
  computeLocationScore,
  computeMatchScore,
  generateExplanation,
} from "../utils/scoring";
import { CONFIG } from "../config";

export function matchCandidates(candidates, jd) {
  const scored = candidates.map((c) => {
    const skillScore = computeSkillScore(jd.skills, c.skills);
    const expScore = computeExperienceScore(jd.experience, c.experience);
    const locScore = computeLocationScore(jd.location, c.location);
    const matchScore = computeMatchScore(skillScore, expScore, locScore);
    const explanation = generateExplanation(c, jd);

    return { ...c, skillScore, expScore, locScore, matchScore, explanation };
  });

  return scored
    .filter((c) => c.matchScore >= CONFIG.MIN_MATCH_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore);
}
