import "server-only";
import { features } from "@/lib/env";
import { activeProviders } from "@/lib/jobs/providers";
import type { Job, JobQuery } from "@/lib/jobs/types";
import type { MatchProfile } from "@/lib/validation";
import type { Lang } from "@/lib/i18n";
import { rankJobs, tooSeniorForGrad, type MatchResult, type RankOptions } from "./engine";
import { semanticRank } from "./semantic";

/**
 * Fetch jobs from all active providers for a profile, de-duplicate, and rank.
 * This is the whole matcher: live listings in, ranked matches out, nothing kept.
 * `lang` controls the language of the human-readable match reasons.
 */
export async function getMatchesForProfile(
  profile: MatchProfile,
  rankOpts: RankOptions = {},
  lang: Lang = "en",
): Promise<MatchResult[]> {
  const query: JobQuery = {
    roles: profile.targetRoles,
    skills: profile.skills,
    locations: profile.locations,
    country: profile.country,
    remoteOnly: profile.remotePref === "remote",
    limit: 50,
  };

  const providers = activeProviders();
  const settled = await Promise.allSettled(providers.map((p) => p.fetchJobs(query)));

  const byId = new Map<string, Job>();
  for (const r of settled) {
    if (r.status === "fulfilled") {
      for (const job of r.value) {
        // Drop anything without a safe http(s) apply link (finalizeJob blanks
        // unsafe URLs); a job with no link to apply is useless anyway.
        if (!job.url) continue;
        // De-dupe by id, and by a title+company key to catch cross-source repos.
        const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
        if (!byId.has(job.id) && !byId.has(key)) {
          byId.set(job.id, job);
          byId.set(key, job);
        }
      }
    }
  }
  const jobs = Array.from(new Set(byId.values()))
    .filter((j) => locationAllowed(profile, j))
    .filter((j) => !tooSeniorForGrad(profile, j)); // keep the pool grad-appropriate

  // Prefer semantic reranking (Groq) when configured; fall back to the
  // transparent lexical engine if it is off or anything goes wrong.
  if (features.groq) {
    const semantic = await semanticRank(profile, jobs, lang, rankOpts.limit ?? 10);
    if (semantic && semantic.length > 0) return semantic;
  }
  return rankJobs(profile, jobs, rankOpts, lang);
}

/**
 * Place names per country, used to keep on-site jobs relevant to the audience
 * when the user did not name a specific city. Tanzania-first (the main market).
 */
const COUNTRY_PLACES: Record<string, string[]> = {
  tz: [
    "tanzania", "dar es salaam", "dodoma", "arusha", "mwanza", "mbeya", "morogoro",
    "tanga", "zanzibar", "moshi", "tabora", "kigoma", "mtwara", "iringa", "geita",
    "shinyanga", "songea", "musoma", "bukoba", "singida", "sumbawanga", "njombe", "babati",
  ],
};

/**
 * Enforce the location rule: keep a job only if it is remote, or it sits in a
 * place the audience can actually work. "Remote only" keeps remote jobs alone.
 * Otherwise: match the user's named locations; if they named none, fall back to
 * the target country's places (so a Tanzania search does not surface on-site jobs
 * in London). Unknown countries are not filtered, to stay generally useful.
 */
function locationAllowed(profile: MatchProfile, job: Job): boolean {
  if (profile.remotePref === "remote") return job.remote;
  if (job.remote) return true; // remote is always allowed (the "unless remote" exception)
  const loc = job.location.toLowerCase();
  const places = COUNTRY_PLACES[profile.country];
  const inCountry = places ? places.some((p) => loc.includes(p)) : null;

  if (profile.locations.length > 0) {
    const cityMatch = profile.locations.some((l) => loc.includes(l.toLowerCase()));
    // Keep the named city, and for a known target market also keep other in-country
    // jobs (a Dar es Salaam search should still see roles listed only as "Tanzania").
    return inCountry === null ? cityMatch : cityMatch || inCountry;
  }
  // No explicit city: keep in-country jobs; unknown market is not over-filtered.
  return inCountry === null ? true : inCountry;
}
