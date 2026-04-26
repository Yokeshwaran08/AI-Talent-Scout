// ─── Central Configuration ───────────────────────────────────
// All magic numbers and weights live here. Change once, affects everywhere.

export const CONFIG = {
  // Scoring weights
  SKILL_WEIGHT: 0.6,
  EXPERIENCE_WEIGHT: 0.3,
  LOCATION_WEIGHT: 0.1,
  MATCH_WEIGHT: 0.7,
  INTEREST_WEIGHT: 0.3,

  // Pipeline limits
  TOP_LLM_LIMIT: 10,       // candidates sent to LLM for outreach simulation
  INITIAL_RENDER: 10,       // cards shown on first render
  MIN_MATCH_SCORE: 10,      // candidates below this are excluded from results

  // OpenAI
  MODEL: "gpt-4o-mini",
  MAX_TOKENS_PARSE: 600,
  MAX_TOKENS_OUTREACH: 400,

  // Confidence thresholds
  CONFIDENCE_GOOD: 70,
  CONFIDENCE_INVALID: 0,
};
