// ─── Interest Simulator Service ──────────────────────────────
import { callLLM, parseLLMJson } from "../utils/llmService";
import { CONFIG } from "../config";

const SYSTEM = `You are an AI recruiter simulating realistic outreach. Return ONLY valid JSON:
{
  "outreach": "Recruiter message (1-2 sentences, personalized)",
  "response": "Candidate reply (1-2 sentences, first person)",
  "interestLevel": "High|Medium-High|Medium|Low",
  "score": <integer 10-95>,
  "reason": "One sentence reason",
  "interestReasons": ["reason 1", "reason 2"]
}
Scoring: High 80-95 (actively looking, great fit), Medium-High 65-79 (open to right role),
Medium 50-64 (not looking but intrigued), Low 10-34 (recently joined/not available).`;

function mockInterest(candidate) {
  const availMap = { open: 85, passive: 58, conditional: 70, not_looking: 18 };
  const score = availMap[candidate.availability] ?? 50;
  const interestLevel = score > 75 ? "High" : score > 60 ? "Medium-High" : score > 45 ? "Medium" : "Low";
  const reasonsMap = {
    High: ["Actively exploring new opportunities", "Role aligns strongly with current skills"],
    "Medium-High": ["Open to the right opportunity", "Compensation and growth potential matter"],
    Medium: ["Not actively looking but open to conversations", "Needs more details before deciding"],
    Low: ["Recently joined a new company", "Not considering a switch at this time"],
  };
  return {
    ...candidate,
    outreach: `Hi ${candidate.name}, we have an exciting opportunity matching your ${candidate.role} background.`,
    response: interestLevel === "High"
      ? "Hi! This sounds really aligned with what I'm looking for. I'd love to learn more."
      : interestLevel === "Low"
      ? "Thanks for reaching out. I recently joined a new role and am not considering a switch."
      : "Thanks for reaching out. I'm open to hearing more about the opportunity.",
    interestLevel,
    interestScore: score,
    reason: reasonsMap[interestLevel][0],
    interestReasons: reasonsMap[interestLevel],
    usedFallback: true,
  };
}

async function simulateOne(candidate, jd) {
  const prompt = `Candidate: ${candidate.name}, ${candidate.role} at ${candidate.currentCompany}, ${candidate.experience} yrs, skills: ${candidate.skills.slice(0,5).join(", ")}, location: ${candidate.location}, availability: ${candidate.availability}
Role: ${jd.title || "Software Engineer"}, skills: ${(jd.skills || []).slice(0,5).join(", ")}, location: ${jd.location || "flexible"}`;

  try {
    const text = await callLLM(SYSTEM, prompt, CONFIG.MAX_TOKENS_OUTREACH);
    const parsed = parseLLMJson(text);
    if (!parsed) throw new Error("Invalid JSON");
    return {
      ...candidate,
      outreach: parsed.outreach,
      response: parsed.response,
      interestLevel: parsed.interestLevel,
      interestScore: parseInt(parsed.score) || 55,
      reason: parsed.reason,
      interestReasons: parsed.interestReasons || [parsed.reason],
      usedFallback: false,
    };
  } catch (e) {
    console.warn(`Outreach LLM failed for ${candidate.name}, using mock:`, e.message);
    return mockInterest(candidate);
  }
}

export async function simulateInterest(candidates, jd) {
  const top = candidates.slice(0, CONFIG.TOP_LLM_LIMIT);
  const rest = candidates.slice(CONFIG.TOP_LLM_LIMIT);

  // LLM for top candidates, mock for the rest — protects against rate limits
  const withLLM = await Promise.all(top.map((c) => simulateOne(c, jd)));
  const withMock = rest.map(mockInterest);

  return [...withLLM, ...withMock];
}
