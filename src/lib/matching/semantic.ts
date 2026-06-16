import "server-only";
import { env } from "@/lib/env";
import type { Job } from "@/lib/jobs/types";
import type { MatchProfile } from "@/lib/validation";
import type { Lang } from "@/lib/i18n";
import type { MatchResult } from "./engine";

/**
 * Semantic reranking with Groq (free tier, fast Llama inference).
 *
 * The lexical engine only matches on shared words; this lets the model judge
 * meaning, so "Data Analyst" also matches "Business Intelligence Associate", and
 * English and Swahili titles line up. It returns the best matches with a one-line
 * reason in the user's language.
 *
 * Robustness: returns null on ANY problem (no key, network, bad JSON, timeout),
 * so the caller falls back to the transparent lexical ranking. Never throws.
 *
 * Privacy: this sends the search profile (no name/email) and short public job
 * snippets to Groq, a third party. Documented in SECURITY.md.
 *
 * Security: only the fixed Groq host is ever called (no SSRF); the request is
 * time-bounded; the model output is parsed defensively and indices are validated.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_CANDIDATES = 40;

interface LlmMatch {
  i: number;
  score: number;
  reason: string;
}

export async function semanticRank(
  profile: MatchProfile,
  jobs: Job[],
  lang: Lang,
  limit: number,
): Promise<MatchResult[] | null> {
  if (!env.GROQ_API_KEY || jobs.length === 0) return null;

  // Bound the token budget: newest first, capped. We send a diverse recent set
  // (not the lexical top) so the model can surface synonym matches lexical misses.
  const candidates = [...jobs]
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, MAX_CANDIDATES);

  const language = lang === "sw" ? "Swahili" : "English";
  const list = candidates
    .map((j, i) => `${i}. ${j.title} | ${j.company} | ${j.location}${j.remote ? " | remote" : ""} | ${j.description.slice(0, 200)}`)
    .join("\n");

  const sys =
    "You are a job-matching assistant for new university graduates (Tanzania-focused). " +
    "Given a candidate profile and a numbered list of job postings, select only the postings whose ROLE genuinely " +
    "matches the candidate's target roles or closely related titles in their field. Understand synonyms across " +
    "English and Swahili. Be strict: do NOT include unrelated roles (for example office assistant, sales, customer " +
    "service, content writing) just because a skill word appears, and exclude clearly senior or high-experience " +
    "roles. If nothing fits well, return an empty list. Respond with strict JSON only.";

  const user =
    `Candidate profile:\n` +
    `- Field of study: ${profile.field}\n` +
    `- Degree level: ${profile.degreeLevel}\n` +
    `- Target roles: ${profile.targetRoles.join(", ") || "(any)"}\n` +
    `- Skills: ${profile.skills.join(", ") || "(none given)"}\n` +
    `- Locations: ${profile.locations.join(", ") || "(any)"}\n` +
    `- Work style: ${profile.remotePref}\n\n` +
    `Job postings:\n${list}\n\n` +
    `Return JSON of this exact shape:\n` +
    `{"matches":[{"i":<index from the list>,"score":<integer 0-100 fit>,"reason":"<one short sentence>"}]}\n` +
    `Include only genuinely relevant postings, best first, at most ${limit}. ` +
    `Each "reason" MUST be written in ${language}.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${env.GROQ_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`[semantic] Groq non-OK: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as { matches?: LlmMatch[] };
    const rows = Array.isArray(parsed.matches) ? parsed.matches : [];

    const seen = new Set<number>();
    const results: MatchResult[] = [];
    for (const r of rows) {
      const i = Number(r.i);
      if (!Number.isInteger(i) || i < 0 || i >= candidates.length || seen.has(i)) continue;
      seen.add(i);
      const score = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));
      const reason = typeof r.reason === "string" ? r.reason.slice(0, 160) : "";
      results.push({ job: candidates[i]!, score, reasons: reason ? [reason] : [], excluded: false });
    }
    if (results.length === 0) return null;

    return results
      .filter((m) => m.score >= 45) // precision over recall: only confident fits
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (err) {
    console.warn("[semantic] failed:", err instanceof Error ? err.message : "unknown");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
