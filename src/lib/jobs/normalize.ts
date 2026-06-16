import type { Job, Seniority } from "./types";

/**
 * Heuristics that turn raw text into the structured signals our matcher needs.
 * These power the "entry-level truth filter" — FirstRung's standout feature.
 */

const SENIORITY_PATTERNS: Array<[Seniority, RegExp]> = [
  ["internship", /\b(intern|internship|placement|industrial year)\b/i],
  ["lead", /\b(lead|principal|head of|director|staff engineer|vp)\b/i],
  ["senior", /\b(senior|sr\.?|experienced|expert)\b/i],
  ["mid", /\b(mid[- ]?level|intermediate|ii\b|2\+ years)\b/i],
  ["entry", /\b(graduate|grad|junior|jr\.?|entry[- ]?level|trainee|associate|no experience)\b/i],
];

export function inferSeniority(title: string, description: string): Seniority {
  const hay = `${title}\n${description}`;
  // Order matters: more senior signals win to avoid mislabelling "senior" roles
  // that also say "graduate scheme open to all".
  for (const [level, re] of SENIORITY_PATTERNS) {
    if (re.test(hay)) return level;
  }
  return "unknown";
}

/**
 * Detect the minimum years of experience demanded. Catches the infamous
 * "entry-level role requiring 5+ years" listings so we can down-rank them.
 */
export function detectMinYears(text: string): number | undefined {
  let max = 0;
  const re = /(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b/gi;
  for (const m of text.matchAll(re)) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max && n <= 30) max = n;
  }
  return max > 0 ? max : undefined;
}

export function detectRemote(title: string, description: string, location: string): boolean {
  return /\b(remote|work from home|wfh|fully distributed|anywhere)\b/i.test(
    `${title} ${description} ${location}`,
  );
}

/** Clamp/trim free text so a hostile provider can't blow up our pipeline. */
export function clampText(s: unknown, max: number): string {
  const str = String(s ?? "").replace(/\s+/g, " ").trim();
  return str.length > max ? str.slice(0, max) : str;
}

/**
 * Return the URL only if it is a well-formed http(s) URL, else "".
 *
 * Apply links come from third-party feeds. Without this, a feed could supply a
 * `javascript:` or `data:` URL that would execute when rendered into an href and
 * clicked (stored XSS). We reject anything that is not plain http/https.
 */
export function httpUrlOrEmpty(raw: unknown): string {
  try {
    const u = new URL(String(raw));
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* not a valid URL */
  }
  return "";
}

/**
 * Strip HTML from third-party descriptions before we tokenize them. Job feeds
 * return rich HTML; we only want readable text for matching, and removing tags
 * also drops any markup a feed might try to smuggle through our pipeline.
 */
export function stripHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function finalizeJob(partial: Omit<Job, "seniority" | "minYearsExperience">): Job {
  const title = clampText(partial.title, 200);
  const description = clampText(partial.description, 5000);
  return {
    ...partial,
    title,
    company: clampText(partial.company, 200),
    location: clampText(partial.location, 200),
    // Only ever carry a safe http(s) apply link; invalid ones become "" and the
    // job is dropped downstream (see matching/source.ts).
    url: httpUrlOrEmpty(partial.url),
    description,
    seniority: inferSeniority(title, description),
    minYearsExperience: detectMinYears(`${title} ${description}`),
  };
}
