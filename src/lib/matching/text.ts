/**
 * Tiny, dependency-free text utilities for lexical matching.
 *
 * We deliberately avoid paid embedding APIs. This keeps FirstRung free and the
 * scoring fully transparent/explainable — every point in a match score traces
 * back to a concrete signal the user can see (no opaque vectors).
 */

const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or our that the to we with you your will can role job work team".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

/**
 * Fraction of `needles` tokens that appear in the `haystack` set (recall of the
 * user's intent within the job text). 0..1.
 */
export function coverage(needles: string[], haystack: Set<string>): number {
  if (needles.length === 0) return 0;
  let hits = 0;
  for (const n of needles) if (haystack.has(n)) hits++;
  return hits / needles.length;
}

/** Which of `needles` were found — used to explain the match to the user. */
export function matchedTerms(needles: string[], haystack: Set<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of needles) {
    if (haystack.has(n) && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
