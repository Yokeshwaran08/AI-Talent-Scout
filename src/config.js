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
  TOP_LLM_LIMIT: 10,
  INITIAL_RENDER: 10,
  MIN_MATCH_SCORE: 10,

  // OpenAI
  MODEL: "gpt-4o-mini",
  MAX_TOKENS_PARSE: 600,
  MAX_TOKENS_OUTREACH: 400,

  // LLM timeout (ms) — aborts fetch if no response within this time
  LLM_TIMEOUT_MS: 8000,

  // Confidence thresholds
  CONFIDENCE_GOOD: 70,
  CONFIDENCE_INVALID: 0,

  // Fallback defaults used when any pipeline step fails
  FALLBACK: {
    MATCH_SCORE: 40,
    SKILL_SCORE: 40,
    EXP_SCORE: 70,
    LOC_SCORE: 80,
    INTEREST_SCORE: 50,
    INTEREST_LEVEL: "Medium",
    OUTREACH: (name) => `Hi ${name}, we have an opportunity that matches your profile.`,
    RESPONSE: "Thanks for reaching out. I'd be happy to learn more.",
    REASON: "Estimated (API unavailable)",
    INTEREST_REASONS: ["Score estimated due to API issue"],
  },
};
