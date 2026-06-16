import type { Job } from "@/lib/jobs/types";
import type { MatchProfile } from "@/lib/validation";
import { t, type Lang } from "@/lib/i18n";
import { coverage, matchedTerms, tokenize, tokenSet } from "./text";

/**
 * Transparent, explainable match scoring (0..100).
 *
 * Every component is a visible signal so we can tell the user why a job
 * matched, the core product differentiator. No black-box embeddings.
 *
 * Weights:
 *   role/title  40   how well the job maps to the user's target roles
 *   field/skills 30  overlap of the user's field + skills with the job text
 *   seniority    15  entry-level fit (the "truth filter")
 *   location     10  location / remote preference
 *   recency       5  freshness boost
 */

export interface MatchResult {
  job: Job;
  score: number; // 0..100
  reasons: string[];
  excluded: boolean; // true => never show (e.g. clearly too senior for a new grad)
}

const W = { role: 40, field: 30, seniority: 15, location: 10, recency: 5 } as const;

const seniorityRank: Record<Job["seniority"], number> = {
  internship: 0,
  entry: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  unknown: 1.5,
};

function degreeYearsCap(profile: MatchProfile): number {
  // How many years of experience is plausible for this grad to be asked for.
  if (profile.degreeLevel === "phd") return 3;
  if (profile.degreeLevel === "masters") return 2;
  return 1; // bachelor's: the core audience
}

/**
 * True if a job is clearly out of reach for a new grad (senior/lead title, or it
 * demands years of experience well past what the degree implies). Used to filter
 * the candidate pool before semantic reranking, so the LLM never sees them.
 */
export function tooSeniorForGrad(profile: MatchProfile, job: Job): boolean {
  const cap = degreeYearsCap(profile);
  if (typeof job.minYearsExperience === "number" && job.minYearsExperience >= cap + 3) return true;
  return seniorityRank[job.seniority] >= seniorityRank.senior;
}

export function scoreJob(profile: MatchProfile, job: Job, lang: Lang = "en"): MatchResult {
  const reasons: string[] = [];
  let excluded = false;

  const jobTokens = tokenSet(`${job.title} ${job.description}`);
  const titleTokens = tokenSet(job.title);

  // 1) Role match — weight the title heavily, description as support.
  const roleTokens = profile.targetRoles.flatMap((r) => tokenize(r));
  const roleTitleCov = coverage(roleTokens, titleTokens);
  const roleBodyCov = coverage(roleTokens, jobTokens);
  const roleScore = W.role * (0.7 * roleTitleCov + 0.3 * roleBodyCov);
  const roleHits = matchedTerms(roleTokens, jobTokens);
  if (roleHits.length) {
    const top = profile.targetRoles.find((r) =>
      tokenize(r).some((t) => roleHits.includes(t)),
    );
    if (top) reasons.push(t(lang, "reason.role", { role: top }));
  }

  // 2) Field + skills overlap.
  const fieldSkillTokens = [...tokenize(profile.field), ...profile.skills.flatMap((s) => tokenize(s))];
  const fieldCov = coverage(fieldSkillTokens, jobTokens);
  const fieldScore = W.field * fieldCov;
  const skillHits = matchedTerms(profile.skills.flatMap((s) => tokenize(s)), jobTokens);
  if (skillHits.length) reasons.push(t(lang, "reason.skills", { list: unique(skillHits).slice(0, 4).join(", ") }));

  // 3) Seniority / entry-level truth filter.
  const cap = degreeYearsCap(profile);
  let seniorityScore: number = W.seniority;
  const jobRank = seniorityRank[job.seniority];
  if (job.seniority === "entry" || job.seniority === "internship") {
    reasons.push(t(lang, "reason.entry"));
  }
  // The infamous "entry-level but 5+ years required" case.
  if (typeof job.minYearsExperience === "number" && job.minYearsExperience > cap + 1) {
    seniorityScore = 0;
    reasons.push(t(lang, "reason.years", { n: job.minYearsExperience }));
    if (job.minYearsExperience >= cap + 3) excluded = true;
  } else if (jobRank >= seniorityRank.senior) {
    seniorityScore = 0;
    excluded = true; // senior/lead role: out of scope for a new grad
  } else if (jobRank === seniorityRank.mid) {
    seniorityScore = W.seniority * 0.4;
  }

  // 4) Location / remote.
  let locationScore = 0;
  const wantsRemote = profile.remotePref === "remote";
  if (wantsRemote) {
    locationScore = job.remote ? W.location : 0;
    if (job.remote) reasons.push(t(lang, "reason.remotePref"));
  } else if (profile.locations.length === 0 || profile.remotePref === "any") {
    locationScore = W.location * 0.7;
  } else {
    const loc = job.location.toLowerCase();
    const hit = profile.locations.find((l) => loc.includes(l.toLowerCase()));
    if (hit) {
      locationScore = W.location;
      reasons.push(t(lang, "reason.inArea", { area: hit }));
    } else if (job.remote) {
      locationScore = W.location * 0.8;
      reasons.push(t(lang, "reason.remoteOption"));
    }
  }

  // 5) Recency.
  const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 864e5;
  const recencyScore = W.recency * Math.max(0, 1 - ageDays / 30);
  if (ageDays <= 3) reasons.push(t(lang, "reason.fresh"));

  const score = clamp(Math.round(roleScore + fieldScore + seniorityScore + locationScore + recencyScore));

  return { job, score, reasons: dedupe(reasons), excluded };
}

export interface RankOptions {
  /** Minimum score to include at all. */
  minScore?: number;
  /** Score above which a match is "strong" and warrants an instant alert. */
  strongScore?: number;
  limit?: number;
}

export function rankJobs(
  profile: MatchProfile,
  jobs: Job[],
  opts: RankOptions = {},
  lang: Lang = "en",
): MatchResult[] {
  const minScore = opts.minScore ?? 25;
  const limit = opts.limit ?? 10;
  return jobs
    .map((j) => scoreJob(profile, j, lang))
    .filter((m) => !m.excluded && m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
