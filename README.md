# FirstRung 🪜

> An anonymous job matcher for new graduates. Tell it your degree and the roles
> you want, and it ranks live openings to your profile in seconds, each with the
> reason it fits. No account, no email, nothing stored.

This is a working app built **security-first** on **free, key-less services**.
It runs with zero configuration and zero secrets.

See [SECURITY.md](SECURITY.md) for the threat model and controls.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Fill in the form, press **Show my matches**, and you get real, live listings
ranked to your profile with direct links to apply. Nothing is saved.

## How it works

```
Form  ──►  POST /api/match  ──►  validate (zod)  ──►  fetch live jobs
                                                  │     (Remotive + Arbeitnow,
                                                  │      no API key needed)
                                                  ├──►  rank + explain (matching engine)
                                                  └──►  return matches  (nothing stored)
```

- **Anonymous by design.** The matcher takes a profile, returns matches, and
  forgets the request. No database, no cookie, no email, no account.
- **Real data, free.** Listings come from [Remotive](https://remotive.com) and
  [Arbeitnow](https://www.arbeitnow.com), both free and key-less.
- **Explainable matching** (`src/lib/matching/`): no paid embeddings, every score
  component is a visible signal, and the **entry level truth filter** down-ranks
  and excludes "entry level, 5+ years required" listings.

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Start the app |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | Strict TypeScript check |

## Project layout

```
src/
  app/
    page.tsx              # landing page
    api/match/route.ts    # the matcher: validated, rate-limited, stores nothing
  lib/
    security/             # rate limiting, HTML escaping
    jobs/                 # provider adapters (Remotive, Arbeitnow) + normalisation
    matching/             # transparent scoring engine + the truth filter
    validation.ts         # zod input schema (no PII collected)
  components/             # form + landing UI
```

## Email my top 3 (optional, double opt-in)

After a search you can ask FirstRung to email your top 3 matches with next-step
guidance. It uses **double opt-in** and stays storage-free:

1. You enter an email. We send that address a signed confirmation link (no
   matches yet, nothing stored).
2. You click it and confirm. Only then do we re-run the match and email the top 3.

The whole request rides inside an HMAC-signed, 24h-expiring token, so confirming
needs no database. Sending happens on a human POST (not the link's GET load), so
email-scanner prefetching cannot auto-confirm. Set `BREVO_API_KEY` (or
`RESEND_API_KEY`) and `TOKEN_SECRET` to send for real; without a provider the
emails render as an in-page preview.

**Recurring digests** (emailing matches over days) are intentionally not built:
that needs to remember who to email, i.e. a database. The matching engine and
providers drop straight in behind a stored profile when you want it.
