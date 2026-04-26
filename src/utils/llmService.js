// ─── LLM Service ─────────────────────────────────────────────
// Single point of contact for all OpenAI API calls.
// Reuse this function everywhere — never call fetch directly.

import { CONFIG } from "../config";

const API_URL = "http://localhost:3001/api/v1/chat/completions";

/**
 * Core LLM call. Returns the text content of the first choice.
 * Throws on non-OK responses so callers can catch and fallback.
 */
export async function callLLM(systemPrompt, userPrompt, maxTokens = 1000) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CONFIG.MODEL,
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
 * Parse LLM response as JSON safely.
 * Strips markdown fences before parsing.
 */
export function parseLLMJson(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}
