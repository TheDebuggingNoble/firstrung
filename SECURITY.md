# Security model — FirstRung

FirstRung is an anonymous job matcher. The strongest privacy control is
architectural: **it stores nothing.** No database, no account, no cookie, no
session. The one piece of PII it touches is an email address, and only when the
user explicitly asks to be emailed their matches; that address is used once to
send and is never persisted.

## Assets & trust boundaries
- **No stored data.** A profile (degree, field, target roles, optional email)
  lives only for the duration of one request and is never written to disk.
- **Two secrets**: the email-provider API key (`BREVO_API_KEY` / `RESEND_API_KEY`)
  and the `TOKEN_SECRET` that signs confirmation links. Both are server-only, never
  shipped to the browser, and kept out of git via `.gitignore`. Production refuses
  to boot with a weak/absent `TOKEN_SECRET` when email is enabled.
- **Trust boundary 1**: the browser to our API. All input is untrusted.
- **Trust boundary 2**: third-party job feeds to our pipeline to the page and the
  emails we send. Listing content (titles, descriptions, **apply URLs**) is
  untrusted and may contain markup or injection attempts.

## Threats and mitigations

| # | Threat | Mitigation | Where |
|---|--------|-----------|-------|
| 1 | Malformed / oversized input | **zod** validation, every field length-capped & typed; request bodies are read with a **16 KB hard cap** before parsing (memory-DoS guard) | `lib/validation.ts`, `lib/security/body.ts`, `api/*` |
| 2 | Abuse / scraping of the matcher | Per-IP **rate limiting** (12 / 5 min) | `lib/security/ratelimit.ts`, `api/match` |
| 3 | **Unsolicited / spoofed email (mail-bomb)** via the email form | **Double opt-in**: step 1 emails a signed confirmation link only; the matches are sent in step 2 **only when a human POSTs** the confirm (not on the GET page load, so email-scanner prefetch cannot auto-confirm). The recipient is read from the **signed token**, never the request body, so it cannot be redirected. The confirmation email itself is rate-limited per IP (4/15min) and per address (2/hour). | `api/email/request`, `api/email/confirm`, `email/confirm` page, `lib/security/tokens.ts` |
| 4 | **XSS via untrusted apply URL** (a feed returning `javascript:`/`data:` rendered into an `href`) | URLs are validated to **http(s) only** at ingest (`httpUrlOrEmpty` in `finalizeJob`); URL-less jobs are dropped; the API response re-applies `safeUrl` (defense in depth); the email template uses `safeUrl` | `lib/jobs/normalize.ts`, `matching/source.ts`, `api/match`, `lib/email/template.ts` |
| 5 | Untrusted feed HTML reaching the page or inbox | Feed HTML is **stripped** before use; React escapes all page text; the email template **HTML-escapes** every dynamic value | `lib/jobs/normalize.ts`, `lib/security/html.ts`, `lib/email/template.ts` |
| 6 | Email header injection via the Subject | The user-supplied field is **stripped of CR/LF/tabs** and clamped before going in the subject (we also use providers' JSON APIs, not raw SMTP) | `lib/email/template.ts` |
| 7 | SSRF via job fetching / AI calls | Every outbound call goes to a **fixed allow-listed host** (themuse, remotive, arbeitnow, jsearch.p.rapidapi.com, adzuna, api.groq.com, brevo/resend); user input only ever rides in encoded query params or JSON bodies, never the host | `lib/jobs/providers/*`, `lib/matching/semantic.ts`, `lib/email/transport.ts` |
| 12 | Third-party data exposure (semantic matching) | When `GROQ_API_KEY` is set, the search profile (no name/email) plus short public job snippets are sent to Groq for reranking. No PII leaves us at match time. Leaving the key unset keeps matching fully local (lexical). API keys are server-only, never shipped to the browser | `lib/matching/semantic.ts`, `lib/env.ts` |
| 8 | Slow / hostile feed hanging a request | Every provider call is **time-bounded** (9s abort), parsed defensively; a bad item is skipped, a bad feed returns empty | `lib/jobs/providers/*` |
| 9 | Secret leakage to the client | `server-only` import guard on every secret-touching module; only `NEXT_PUBLIC_*` is exposed; `.env*.local` git-ignored | `lib/env.ts`, `lib/email/*` |
| 10 | Clickjacking / MIME sniffing / mixed content | **Security headers**: CSP, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, HSTS, locked `Permissions-Policy` | `src/middleware.ts` |
| 11 | Reflected content in the email preview | Preview HTML renders in a **`sandbox=""` iframe** (scripts disabled) and contains only escaped, server-generated content | `components/OnboardingForm.tsx` |
| 12 | Framework fingerprinting | `poweredByHeader: false` | `next.config.mjs` |
| 13 | Supply-chain / attack surface | **Minimal dependencies** (next, react, zod); no email/HTTP SDKs, plain `fetch` | `package.json` |

## Residual risks & accepted trade-offs (honest)
- **The confirmation email still goes to the typed address.** That single,
  rate-limited "did you ask for this?" message is the one thing an address owner
  can receive unsolicited; the actual matches never send without their click.
  This is standard double opt-in behaviour.
- **Confirm links are replayable until they expire.** A leaked confirmation link
  can be POSTed again within its 24h window to re-send to the same (fixed,
  signed-in) address. Mitigated by the 24h expiry and the per-IP confirm limit;
  true one-time use would require server-side storage, which we deliberately avoid.
- **Rate limiting is per-process / in-memory.** Effective on a single instance;
  it resets on restart and is not shared across instances. For scale, move the
  `rateLimit()` store to Upstash Redis (free tier) behind the same interface.
- **Client IP comes from `X-Forwarded-For`.** Behind a trusted platform proxy
  (Vercel, etc.) this is fine; if the app is ever exposed without a trusted proxy,
  XFF can be spoofed to evade the rate limiter. It gates abuse, not authz.
- **CSP allows `'unsafe-inline'` for styles** (Tailwind's injected `<style>`) and,
  in development only, `'unsafe-eval'` for HMR. Production script policy is `'self'`.
- **Email deliverability**: sending from a plain gmail address (no domain auth)
  can land in spam. Verify a domain + SPF/DKIM in the provider for inbox placement.

## Dependency advisories (reviewed, not ignored)
We pin **Next.js 14.2.35** (latest patched 14.x). `npm audit` flags two issues
whose only listed fix is a major upgrade to Next 16 (which also pulls React 19):
- The **high** Next advisories (Image Optimizer `remotePatterns` DoS, unbounded
  `next/image` cache, rewrites request smuggling) are **not applicable**: the app
  uses no `next/image` and defines no rewrites.
- The **moderate** is `postcss` **bundled inside Next** (a build-time CSS-stringify
  issue); our own top-level `postcss` is already on a patched version.

We deliberately do **not** run `npm audit fix --force`, which would ship a Next
14 -> 16 + React 18 -> 19 migration unreviewed and risk breaking the build. That
migration is tracked as dedicated work. Run `npm audit` in CI to stay aware.

## Outbound data
Outbound calls go only to the allow-listed job hosts and the email provider, over
HTTPS, without cookies/credentials. The only user data sent out is a search
keyword (from target roles + skills) to the job APIs and, when the user opts in,
their email address plus their match results to the email provider.
