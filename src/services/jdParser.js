// ─── JD Parser Service ───────────────────────────────────────
import { callLLM, parseLLMJson } from "../utils/llmService";
import { extractSkills, extractExperience, extractLocation } from "../utils/helpers";
import { CONFIG } from "../config";

const SYSTEM = `You are a job description parser. Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "Job Title or null",
  "skills": ["skill1", "skill2"],
  "experience": { "min": 2, "max": 5 },
  "location": "City or Remote or null",
  "summary": "One sentence summary"
}`;

export async function parseJD(jdText) {
  try {
    const text = await callLLM(SYSTEM, `Parse this JD:\n\n${jdText}`, CONFIG.MAX_TOKENS_PARSE);
    const parsed = parseLLMJson(text);
    if (!parsed) throw new Error("Invalid JSON from LLM");

    // Fill gaps with JS extraction as safety net
    if (!parsed.skills || parsed.skills.length === 0) parsed.skills = extractSkills(jdText);
    if (!parsed.experience || parsed.experience.min === undefined) parsed.experience = extractExperience(jdText);
    if (!parsed.location) parsed.location = extractLocation(jdText);

    return parsed;
  } catch (e) {
    console.warn("JD parse LLM failed, using JS fallback:", e.message);
    return {
      title: null,
      skills: extractSkills(jdText),
      experience: extractExperience(jdText),
      location: extractLocation(jdText),
      summary: jdText.slice(0, 120),
    };
  }
}
