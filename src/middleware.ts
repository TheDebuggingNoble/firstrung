import { NextResponse, type NextRequest } from "next/server";

/**
 * Defense-in-depth HTTP security headers applied to every response.
 *
 * - Content-Security-Policy: locks script/style/connect to our own origin.
 *   In development we must permit 'unsafe-eval'/'unsafe-inline' for Next.js HMR;
 *   production gets the strict policy.
 * - HSTS: force HTTPS (only meaningful once served over TLS).
 * - X-Frame-Options / frame-ancestors: clickjacking protection.
 * - X-Content-Type-Options: stop MIME sniffing.
 * - Referrer-Policy / Permissions-Policy: minimise leakage & disable APIs we
 *   never use (camera, mic, geolocation).
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  const isDev = process.env.NODE_ENV !== "production";

  const scriptSrc = isDev ? "'self' 'unsafe-eval' 'unsafe-inline'" : "'self'";
  const styleSrc = "'self' 'unsafe-inline'"; // Tailwind injects a style tag

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  if (!isDev) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export const config = {
  // Apply to everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
