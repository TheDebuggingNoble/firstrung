import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { EmailMatchInput } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/security/ratelimit";
import { readJsonBounded } from "@/lib/security/body";
import { createToken } from "@/lib/security/tokens";
import { confirmRequestEmail } from "@/lib/email/template";
import { sendEmail } from "@/lib/email/transport";

export const runtime = "nodejs";

/**
 * POST /api/email/request  — double opt-in, step 1.
 *
 * Validates the request and emails the address a signed confirmation link. NO
 * matches are sent here; nothing is stored. If the address did not actually
 * request this, its owner ignores the email and never hears from us again.
 *
 * Security / anti-abuse:
 *  - zod validation + bounded body read.
 *  - Per-IP (4/15min) and per-recipient (2/hour) rate limits so the confirmation
 *    email itself cannot be used to flood an inbox.
 *  - The confirmation token is HMAC-signed, purpose-bound, and expires in 24h.
 *  - We never return the token/link in the response (that would defeat opt-in).
 */
export async function POST(req: NextRequest) {
  const ipRl = rateLimit(clientKey(req.headers, "email-req-ip"), 4, 15 * 60_000);
  if (!ipRl.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const read = await readJsonBounded(req);
  if (!read.ok) return NextResponse.json({ ok: false, error: read.error }, { status: read.status });

  const parsed = EmailMatchInput.safeParse(read.data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const { email, lang, ...profile } = parsed.data;

  const addrRl = rateLimit(`email-req-addr:${email}`, 2, 60 * 60_000);
  if (!addrRl.ok) {
    return NextResponse.json(
      { ok: false, error: "A confirmation email was already sent to that address. Please check your inbox." },
      { status: 429 },
    );
  }

  try {
    // The whole request rides inside the signed token, so confirming needs no
    // server-side storage. Purpose-bound + 24h expiry.
    const token = createToken({ e: email, profile, lang, pu: "email-confirm" }, 24 * 60 * 60);
    const confirmUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/email/confirm?token=${encodeURIComponent(token)}`;

    const { subject, html, text } = confirmRequestEmail({ confirmUrl, field: profile.field, lang });
    const result = await sendEmail({ to: email, subject, html, text });

    if (result.mode === "sent") return NextResponse.json({ ok: true, status: "confirm-sent" });
    if (result.mode === "preview") return NextResponse.json({ ok: true, status: "preview", html });
    return NextResponse.json({ ok: false, error: result.message }, { status: 502 });
  } catch (err) {
    console.error("[email/request] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not send the confirmation. Please try again." }, { status: 500 });
  }
}
