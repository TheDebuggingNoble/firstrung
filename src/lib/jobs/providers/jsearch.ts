import "server-only";
import { env } from "@/lib/env";
import type { Job, JobProvider, JobQuery } from "../types";
import { finalizeJob, stripHtml } from "../normalize";

/**
 * JSearch (RapidAPI) adapter. Aggregates Google for Jobs, which covers Tanzanian
 * boards, company career pages and more, with a real `country` filter. This is
 * the on-the-ground source for Tanzania. Activates only when RAPIDAPI_KEY is set
 * (free tier). Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * Security: only the fixed allow-listed JSearch host is ever called (no SSRF);
 * user input goes in encoded query params; the call is time-bounded; the response
 * is parsed defensively and bad items are skipped.
 */

const JSEARCH_HOST = "jsearch.p.rapidapi.com";

interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_apply_link?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_posted_at_datetime_utc?: string;
  job_description?: string;
}

export const jsearchProvider: JobProvider = {
  name: "jsearch",
  async fetchJobs(query: JobQuery): Promise<Job[]> {
    // Roles + location make the cleanest Google-for-Jobs query; piling skills in
    // over-narrows it. Location defaults to the country for a broad TZ sweep.
    const what = query.roles.slice(0, 3).join(" ").slice(0, 80);
    const where = query.locations[0]?.slice(0, 60) ?? "Tanzania";
    const search = `${what || "graduate"} in ${where}`.slice(0, 160);

    const url = new URL(`https://${JSEARCH_HOST}/search`);
    url.searchParams.set("query", search);
    url.searchParams.set("page", "1");
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("date_posted", "month");
    if (query.country) url.searchParams.set("country", query.country);

    // The free-tier gateway returns intermittent 5xx; one retry smooths it out.
    let data: { data?: JSearchJob[] } | null = null;
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 600));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "X-RapidAPI-Key": env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": JSEARCH_HOST,
            accept: "application/json",
          },
          cache: "no-store",
        });
        if (!res.ok) {
          console.warn(`[jsearch] non-OK response: ${res.status}${attempt === 0 ? " (retrying)" : ""}`);
          if (res.status >= 500) continue; // transient gateway error: retry
          return [];
        }
        data = (await res.json()) as { data?: JSearchJob[] };
      } catch (err) {
        console.warn("[jsearch] fetch failed:", err instanceof Error ? err.message : "unknown");
      } finally {
        clearTimeout(timeout);
      }
    }
    if (!data) return [];

    const rows = Array.isArray(data.data) ? data.data : [];
    const jobs: Job[] = [];
    for (const r of rows) {
      if (!r.job_title || !r.job_apply_link) continue;
      const location = [r.job_city, r.job_country].filter(Boolean).join(", ") || r.job_country || "";
      jobs.push(
        finalizeJob({
          id: `jsearch:${r.job_id ?? r.job_apply_link}`,
          title: String(r.job_title),
          company: r.employer_name ?? "Unknown",
          location,
          remote: Boolean(r.job_is_remote),
          description: stripHtml(r.job_description),
          url: String(r.job_apply_link),
          source: "jsearch",
          postedAt: r.job_posted_at_datetime_utc ?? new Date().toISOString(),
        }),
      );
    }
    return jobs;
  },
};
