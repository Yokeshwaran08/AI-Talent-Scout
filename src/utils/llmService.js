// ─── LLM Service ─────────────────────────────────────────────
// Single point of contact for all OpenAI API calls.
// Reuse callLLM() everywhere — never call fetch directly.

import { CONFIG } from "../config";

const API_URL = "http://localhost:3001/api/v1/chat/completions";

/**
 * Core LLM call with timeout protection.
 * Aborts automatically after CONFIG.LLM_TIMEOUT_MS milliseconds.
 * Throws on non-OK responses or timeout so callers can catch and fallback.
 */
export async function callLLM(systemPrompt, userPrompt, maxTokens = 1000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.LLM_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
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
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(`LLM request timed out after ${CONFIG.LLM_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Safely parse LLM response as JSON.
 * Strips markdown fences before parsing. Returns null on failure.
 */
export function parseLLMJson(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}
