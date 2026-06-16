# FirstRung 🪜

> The job-hunt copilot for new graduates. You tell us your degree and what you
> want to do; we watch the entire job market for you and bring matched roles to
> your inbox — pre-tailored and ready to apply.

The name = the first rung of the career ladder. The hardest step is the first
one.

---

## The core promise
A bachelor's grad signs up once, describes themselves, and then never has to
"check job boards" again. Relevant, entry-level-appropriate roles come to *them*,
ranked by fit, with the application already half-done.

## Who it's for (v1)
Bachelor's-degree graduates (0–2 years experience) actively job-hunting. Narrow
focus on purpose: their needs are homogeneous (entry-level filtering, no-experience
anxiety, CV is thin), which lets us be genuinely better than a generic aggregator.

---

## How it actually works (the honest architecture)

"Constantly scrape the web" is the dream, but raw scraping is fragile, often
against ToS, and gets IP-banned fast. The robust version is a **hybrid feed**:

1. **Aggregator APIs first** (legal, reliable, free/cheap tiers): Adzuna, Jooble,
   USAJobs, Reed, The Muse, Arbeitnow, Greenhouse/Lever/Ashby/Workable public
   job APIs (these power thousands of company career pages).
2. **Targeted scraping second**: a curated list of company career pages that
   don't expose APIs, scraped politely (rate-limited, cached, robots-aware).
3. **Normalize** everything into one job schema (title, company, location,
   remote, salary, seniority, posted_at, source_url, description).
4. **Match with meaning, not keywords**: embed the user's profile and each job
   description; rank by semantic similarity + rules (seniority cap, location,
   visa). An LLM writes a one-line "why this matches you."
5. **Deliver smartly** (see below).

## Delivery — the part most people get wrong
"Email for *each* job" = inbox spam = instant unsubscribe. Instead:

- **Instant alert** only for high-confidence matches (score above a threshold).
- **Daily/weekly digest** for the rest, ranked, one clean email.
- Every email has **one-click apply** and a "more like this / less like this"
  feedback loop that retrains the user's match profile.

---

## What makes it stand out (the moat)

These are the differentiators vs. LinkedIn/Indeed/Glassdoor:

1. **Match score + plain-English reason.** Not "1,000 results" — "7 strong fits,
   here's why each one is for you."
2. **Auto-tailored application kit.** On request, generate a CV variant and cover
   letter tuned to *that* job from the user's master profile. This is the killer
   feature for grads who don't know how to tailor.
3. **Entry-level truth filter.** Aggressively strip out fake "entry-level, 5 yrs
   required" listings — a notorious grad frustration. Flag salary transparency.
4. **One profile, many applications.** Store the master profile once; autofill
   Greenhouse/Lever/Workable forms (they share predictable field structures).
5. **Application tracker built in.** Applied / interviewing / rejected, with
   nudges to follow up. Turns the tool from "alerts" into a career command center.
6. **Ghost-job & scam detection.** Down-rank reposted-forever listings and known
   scam patterns. Trust = retention.
7. **Salary & company insight inline.** Glassdoor-style context so grads don't
   undersell themselves.

## Nice-to-have / later
- "Skill gap" hints: this role wants X, here's a 2-hour course.
- Referral finder: do you have a LinkedIn connection at this company?
- Interview prep generated from the actual job description.
- Cohort/leaderboard gamification to keep momentum during a demoralizing search.

---

## Hard problems to design around (be honest up front)
- **Email deliverability**: transactional email needs a real provider (Resend,
  Postmark, SES) + SPF/DKIM or everything lands in spam.
- **Scraping legality/fragility**: lean on APIs; treat scraping as a fallback.
- **Match quality cold-start**: first emails must be good or users churn. Ask a
  few sharp onboarding questions instead of relying on degree alone.
- **Privacy/GDPR**: storing CVs + emails = real PII obligations. Easy unsubscribe,
  data export/delete from day one.
- **Cost control**: embeddings + LLM tailoring cost money; cache embeddings,
  generate tailored docs only on user click, not for every job.

---

## Suggested v1 scope (ship this first, not everything)
1. Onboarding: degree, field, target roles, locations, remote pref, email, CV upload.
2. Ingestion from **2–3 aggregator APIs** (start with Adzuna + Greenhouse/Lever).
3. Semantic matching + score.
4. Daily digest email with top matches + match reasons + apply links.
5. Unsubscribe + preference center.

Everything else (tailored CVs, autofill, tracker) is v2+. Prove the core loop:
*good matches → opened email → clicked apply.*

## Suggested stack
- **Frontend**: Next.js (React) + Tailwind.
- **Backend/DB/Auth**: Supabase (Postgres + pgvector for embeddings + auth).
- **Jobs/cron**: scheduled worker to pull APIs + send digests.
- **Email**: Resend or Postmark.
- **AI**: a hosted LLM for match-reasoning and CV/cover-letter tailoring; embeddings for ranking.

## Name candidates (if FirstRung doesn't land)
FirstRung · GradPilot · Hatch · Stepping Stone · Alumnly · Kickoff · Rung
