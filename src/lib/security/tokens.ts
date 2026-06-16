import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Stateless, tamper-proof signed tokens (no database needed).
 *
 * A token is base64url(payloadJson) + "." + base64url(HMAC-SHA256). The payload
 * carries an expiry (`x`) and a purpose (`pu`), so a leaked token cannot be
 * replayed past its lifetime or used for a different action. Verification is
 * constant-time to avoid signature timing oracles.
 *
 * Used for the email double opt-in: the confirmation link carries the request
 * (email + search), signed, so we can trust it on click without storing anything.
 */

const DEV_FALLBACK_SECRET = randomBytes(48).toString("base64url");

function secret(): string {
  // In production env.ts requires a real TOKEN_SECRET; in dev we fall back to an
  // ephemeral one (tokens simply reset if the dev server restarts).
  return env.TOKEN_SECRET || DEV_FALLBACK_SECRET;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function createToken(payload: Record<string, unknown>, ttlSeconds: number): string {
  const body = { ...payload, x: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payloadB64 = b64url(JSON.stringify(body));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken<T = Record<string, unknown>>(token: string, purpose: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payloadB64, sig] = parts;

  // Constant-time signature comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payloadB64));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (payload.pu !== purpose) return null;
  const x = payload.x;
  if (typeof x !== "number" || x < Math.floor(Date.now() / 1000)) return null;
  return payload as T;
}
