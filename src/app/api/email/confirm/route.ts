import { NextResponse, type NextRequest } from "next/server";
import { MatchInput } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/security/ratelimit";
import { readJsonBounded } from "@/lib/security/body";
import { verifyToken } from "@/lib/security/tokens";
import { getMatchesForProfile } from "@/lib/matching/source";
import { topMatchesEmail } from "@/lib/email/template";
import { sendEmail } from "@/lib/email/transport";
import { isLang, type Lang } from "@/lib/i18n";

export const runtime = "nodejs";

interface ConfirmPayload {
  e: string;
  profile: unknown;
  lang?: Lang;
}

/**
 * POST /api/email/confirm  — double opt-in, step 2.
 *
 * Triggered by a human clicking the button on the confirm page (a POST, not the
 * GET page load, so email-scanner link prefetching cannot auto-confirm). Verifies
 * the signed token, re-runs the match, and emails the top 3.
 *
 * Security:
 *  - The recipient comes from the SIGNED token, never from the request body, so a
 *    caller cannot redirect the email to a different address.
 *  - Token is HMAC-verified (constant-time), purpose-bound, and expiry-checked.
 *  - The profile carried in the token is re-validated with the same schema.
 */
export async function POST(req: NextRequest) {
  const ipRl = rateLimit(clientKey(req.headers, "email-confirm-ip"), 10, 15 * 60_000);
  if (!ipRl.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const read = await readJsonBounded(req);
  if (!read.ok) return NextResponse.json({ ok: false, error: read.error }, { status: read.status });

  const token = typeof (read.data as { token?: unknown })?.token === "string" ? (read.data as { token: string }).token : "";
  const payload = verifyToken<ConfirmPayload>(token, "email-confirm");
  if (!payload || typeof payload.e !== "string") {
    return NextResponse.json({ ok: false, error: "This confirmation link is invalid or has expired." }, { status: 400 });
  }

  // Re-validate the profile that travelled inside the token (defense in depth).
  const profile = MatchInput.safeParse(payload.profile);
  if (!profile.success) {
    return NextResponse.json({ ok: false, error: "This confirmation link is invalid." }, { status: 400 });
  }

  const lang: Lang = isLang(payload.lang) ? payload.lang : "en";

  try {
    const matches = await getMatchesForProfile(profile.data, { minScore: 20, limit: 3 }, lang);
    const { subject, html, text } = topMatchesEmail({ matches, field: profile.data.field, lang });
    const result = await sendEmail({ to: payload.e, subject, html, text });

    if (result.mode === "sent") return NextResponse.json({ ok: true, status: "sent", count: matches.length });
    if (result.mode === "preview") return NextResponse.json({ ok: true, status: "preview", count: matches.length, html });
    return NextResponse.json({ ok: false, error: result.message }, { status: 502 });
  } catch (err) {
    console.error("[email/confirm] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not send your matches. Please try again." }, { status: 500 });
  }
}
