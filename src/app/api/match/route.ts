import { NextResponse, type NextRequest } from "next/server";
import { MatchInput } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/security/ratelimit";
import { readJsonBounded } from "@/lib/security/body";
import { safeUrl } from "@/lib/security/html";
import { getMatchesForProfile } from "@/lib/matching/source";

export const runtime = "nodejs";

/**
 * POST /api/match
 *
 * Anonymous job matcher. Validates the request, fetches live listings from the
 * job providers, ranks them, and returns the matches. Nothing is stored, no
 * email is collected, no cookie is set. The request is forgotten once answered.
 *
 * Security:
 *  - Strict zod validation at the trust boundary, every field length-capped.
 *  - Per-IP rate limiting (the route fans out to external job APIs, so we keep
 *    it modest to stay polite to them and resistant to abuse).
 *  - Providers only call fixed allow-listed hosts (no SSRF).
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req.headers, "match"), 12, 5 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many searches. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const read = await readJsonBounded(req);
  if (!read.ok) return NextResponse.json({ ok: false, error: read.error }, { status: read.status });

  const parsed = MatchInput.safeParse(read.data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const matches = await getMatchesForProfile(parsed.data, { minScore: 20, limit: 12 }, parsed.data.lang);
    return NextResponse.json({
      ok: true,
      count: matches.length,
      matches: matches.map((m) => ({
        title: m.job.title,
        company: m.job.company,
        location: m.job.location,
        remote: m.job.remote,
        url: safeUrl(m.job.url), // defense-in-depth: only http(s) reaches the client
        source: m.job.source,
        score: m.score,
        reasons: m.reasons.slice(0, 3),
      })),
    });
  } catch (err) {
    console.error("[match] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not reach the job sources. Please try again." }, { status: 502 });
  }
}
