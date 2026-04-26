// ─────────────────────────────────────────────
// OpenAI API Service
// ─────────────────────────────────────────────
// API calls route through the local proxy (proxy-server.js)
// to keep the API key server-side and avoid CORS issues.
//
// Proxy URL:  http://localhost:3001/api/v1/chat/completions
// Direct URL: https://api.openai.com/v1/chat/completions  (CORS-blocked in browser)

const API_URL = "http://localhost:3001/api/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // Fast, cheap, capable — ideal for hackathon use

async function callOpenAI(systemPrompt, userPrompt, maxTokens = 1000) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse a Job Description using OpenAI to extract structured info.
 * Returns a parsed object with title, skills, experience, location, summary.
 */
export async function parseJobDescription(jdText) {
  const system = `You are a job description parser. Extract structured information from job descriptions.
Return ONLY valid JSON with no markdown fences, no explanation, no extra text. Use this exact format:
{
  "title": "Job Title",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": { "min": 2, "max": 5 },
  "location": "City name, or Remote, or null",
  "summary": "One sentence summary of what the role does"
}`;

  const text = await callOpenAI(system, `Parse this job description:\n\n${jdText}`, 600);
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      title: "Open Role",
      skills: [],
      experience: { min: 0, max: 99 },
      location: null,
      summary: jdText.slice(0, 120),
    };
  }
}

/**
 * Simulate an AI recruiter reaching out to a candidate and getting a reply.
 * Returns outreach message, candidate response, interest level, score, and reason.
 */
export async function simulateOutreach(candidate, jdParsed) {
  const system = `You are an AI recruiter simulating realistic candidate outreach conversations.
Return ONLY valid JSON with no markdown fences, no explanation. Use this exact format:
{
  "outreach": "The AI recruiter message sent to the candidate (1-2 sentences, personalized to their background)",
  "response": "The candidate's realistic simulated reply (1-2 sentences, first person)",
  "interestLevel": "High|Medium-High|Medium|Medium-Low|Low",
  "score": <integer between 10 and 95>,
  "reason": "One sentence explaining the interest level"
}

Scoring rules:
- High (80-95): candidate is actively looking, role aligns well, enthusiastic reply
- Medium-High (65-79): open to the right opportunity, asks about details
- Medium (50-64): not actively looking but intrigued, non-committal
- Medium-Low (35-49): busy, not sure the role fits, hesitant
- Low (10-34): recently joined elsewhere, not considering a switch

Availability signal for this candidate: "${candidate.availability}"
Use this as a strong hint for the interest level.`;

  const prompt = `Candidate details:
- Name: ${candidate.name}
- Current role: ${candidate.role} at ${candidate.currentCompany}
- Experience: ${candidate.experience} years
- Skills: ${candidate.skills.join(", ")}
- Location: ${candidate.location}

Job being offered:
- Title: ${jdParsed.title || "Software Engineer"}
- Key skills required: ${(jdParsed.skills || []).slice(0, 5).join(", ")}
- Location: ${jdParsed.location || "flexible"}`;

  try {
    const text = await callOpenAI(system, prompt, 400);
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    parsed.score = parseInt(parsed.score) || 55;
    return parsed;
  } catch {
    // Fallback per availability — never crashes the pipeline
    const fallbackMap = {
      open: {
        interestLevel: "High",
        score: 85,
        outreach: `Hi ${candidate.name}, your ${candidate.role} background caught our eye for a ${jdParsed.title || "role"} we're hiring. Interested in a quick chat?`,
        response: "Hi! This sounds well-aligned with where I want to go. I'd love to learn more about the role.",
        reason: "Candidate is actively open to new opportunities.",
      },
      passive: {
        interestLevel: "Medium",
        score: 58,
        outreach: `Hi ${candidate.name}, came across your profile for a ${jdParsed.title || "role"}. Worth a 15-min conversation?`,
        response: "Hi, thanks for reaching out. I'm not actively searching but I'm open to hearing more details.",
        reason: "Candidate is passively open but needs more convincing.",
      },
      conditional: {
        interestLevel: "Medium-High",
        score: 70,
        outreach: `Hi ${candidate.name}, we have an exciting ${jdParsed.title || "opportunity"} that aligns with your experience at ${candidate.currentCompany}.`,
        response: "Sounds interesting! I'd be open depending on the scope and flexibility. Happy to connect.",
        reason: "Candidate is conditionally interested — role and terms need to align.",
      },
      not_looking: {
        interestLevel: "Low",
        score: 18,
        outreach: `Hi ${candidate.name}, we have a ${jdParsed.title || "role"} that closely matches your profile. Would you be open to a conversation?`,
        response: "Hi, appreciate the message. I recently joined a new company and am not considering a switch at the moment.",
        reason: "Candidate recently changed jobs and is not available.",
      },
    };
    return fallbackMap[candidate.availability] || fallbackMap.passive;
  }
}
