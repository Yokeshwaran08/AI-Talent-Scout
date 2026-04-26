// ─── Centralised Scoring ─────────────────────────────────────
import { CONFIG } from "../config";

export function computeSkillScore(requiredSkills, candidateSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 50;
  const cl = candidateSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) => cl.includes(s.toLowerCase()));
  return Math.round((matched.length / requiredSkills.length) * 100);
}

export function computeExperienceScore(required, candidateYears) {
  if (!required || required.min === undefined) return 70;
  const { min, max } = required;
  if (candidateYears >= min && candidateYears <= max) return 100;
  if (candidateYears < min) return Math.max(0, 100 - (min - candidateYears) * 20);
  return Math.max(60, 100 - (candidateYears - max) * 5);
}

export function computeLocationScore(preferred, candidateLocation) {
  if (!preferred) return 80;
  if (!candidateLocation) return 60;
  const p = preferred.toLowerCase();
  const c = candidateLocation.toLowerCase();
  if (c === "remote" || p === "remote" || p === "anywhere") return 90;
  if (c === p) return 100;
  const regions = [
    ["bangalore", "bengaluru", "mysore"],
    ["mumbai", "pune", "thane"],
    ["delhi", "noida", "gurugram", "gurgaon"],
    ["hyderabad", "secunderabad"],
    ["chennai", "coimbatore", "madurai", "trichy"],
    ["kochi", "trivandrum", "kottayam"],
  ];
  for (const group of regions) {
    if (group.includes(p) && group.includes(c)) return 75;
  }
  return 30;
}

export function computeMatchScore(skillScore, expScore, locScore) {
  return Math.round(
    CONFIG.SKILL_WEIGHT * skillScore +
    CONFIG.EXPERIENCE_WEIGHT * expScore +
    CONFIG.LOCATION_WEIGHT * locScore
  );
}

export function computeInterestScore(interestLevel) {
  const map = { High: 88, "Medium-High": 72, Medium: 58, "Medium-Low": 44, Low: 22 };
  return map[interestLevel] ?? 50;
}

export function computeFinalScore(matchScore, interestScore) {
  return Math.round(
    CONFIG.MATCH_WEIGHT * matchScore +
    CONFIG.INTEREST_WEIGHT * interestScore
  );
}

export function generateExplanation(candidate, jd) {
  const requiredSkills = jd?.skills || [];
  const cl = candidate.skills.map((s) => s.toLowerCase());
  const matchedSkills = requiredSkills.filter((s) => cl.includes(s.toLowerCase()));
  const missingSkills = requiredSkills.filter((s) => !cl.includes(s.toLowerCase()));

  const expRequired = jd?.experience;
  let experienceMatch = "Unknown";
  if (expRequired && expRequired.min !== undefined) {
    if (candidate.experience >= expRequired.min && candidate.experience <= (expRequired.max || 99)) {
      experienceMatch = "Strong";
    } else if (candidate.experience < expRequired.min) {
      experienceMatch = `Under by ${expRequired.min - candidate.experience} yr${expRequired.min - candidate.experience > 1 ? "s" : ""}`;
    } else {
      experienceMatch = "Over-qualified";
    }
  }

  const locScore = computeLocationScore(jd?.location, candidate.location);
  const locationFit =
    locScore >= 95 ? "Exact Match" :
    locScore >= 75 ? "Same Region" :
    locScore >= 60 ? "Flexible" : "Different City";

  const skillMatchPct = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : null;

  return {
    matchedSkills,
    missingSkills,
    experienceMatch,
    locationFit,
    skillMatchPct,
    totalRequired: requiredSkills.length,
    matchedCount: matchedSkills.length,
  };
}
