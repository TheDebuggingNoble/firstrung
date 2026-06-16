import "server-only";
import { env, features } from "@/lib/env";

/**
 * Email transport with three modes, chosen automatically:
 *   1. Brevo  (BREVO_API_KEY)  : free tier, can email anyone from a verified
 *      sender without owning a domain. Tried first.
 *   2. Resend (RESEND_API_KEY) : needs a verified domain to email arbitrary
 *      recipients.
 *   3. Preview : no provider configured. The email is NOT sent; we return its
 *      HTML so the app can show the user exactly what would arrive.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendResult =
  | { mode: "sent"; provider: "brevo" | "resend" }
  | { mode: "preview"; html: string }
  | { mode: "error"; message: string };

export async function sendEmail(msg: OutgoingEmail): Promise<SendResult> {
  if (features.brevo) return sendViaBrevo(msg);
  if (features.resend) return sendViaResend(msg);
  // No provider: hand the rendered email back for an in-page preview.
  return { mode: "preview", html: msg.html };
}

async function sendViaBrevo(msg: OutgoingEmail): Promise<SendResult> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM },
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[email/brevo] ${res.status} ${body.slice(0, 160)}`);
      return { mode: "error", message: "Could not send the email. Please try again." };
    }
    return { mode: "sent", provider: "brevo" };
  } catch (err) {
    console.warn("[email/brevo] failed:", err instanceof Error ? err.message : "unknown");
    return { mode: "error", message: "Could not send the email. Please try again." };
  }
}

async function sendViaResend(msg: OutgoingEmail): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[email/resend] ${res.status} ${body.slice(0, 160)}`);
      return { mode: "error", message: "Could not send the email. Please try again." };
    }
    return { mode: "sent", provider: "resend" };
  } catch (err) {
    console.warn("[email/resend] failed:", err instanceof Error ? err.message : "unknown");
    return { mode: "error", message: "Could not send the email. Please try again." };
  }
}
