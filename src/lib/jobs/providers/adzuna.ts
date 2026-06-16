import "server-only";
import { env } from "@/lib/env";
import type { Job, JobProvider, JobQuery } from "../types";
import { detectRemote, finalizeJob, stripHtml } from "../normalize";

/**
 * Adzuna adapter (free tier, needs a free app_id + app_key).
 * Docs: https://developer.adzuna.com/
 *
 * This is the precise location source: it searches by `where` (city) inside a
 * country market, so on-site jobs in the user's city come back accurately.
 * Activates only when ADZUNA_APP_ID and ADZUNA_APP_KEY are set.
 *
 * Security: only the fixed allow-listed Adzuna host is ever called (no SSRF);
 * user input goes in encoded query params; time-bounded; defensively parsed.
 */

const ADZUNA_HOST = "api.adzuna.com";
const ALLOWED_COUNTRIES = new Set([
  "gb", "us", "au", "at", "br", "ca", "de", "es", "fr", "in", "it", "nl", "nz", "pl", "sg", "za",
]);

interface AdzunaResult {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
}

export const adzunaProvider: JobProvider = {
  name: "adzuna",
  async fetchJobs(query: JobQuery): Promise<Job[]> {
    const country = ALLOWED_COUNTRIES.has(query.country) ? query.country : env.ADZUNA_COUNTRY;
    const what = [...query.roles, ...query.skills].slice(0, 6).join(" ").slice(0, 200);
    const where = query.locations[0]?.slice(0, 80) ?? "";

    const url = new URL(`https://${ADZUNA_HOST}/v1/api/jobs/${encodeURIComponent(country)}/search/1`);
    url.searchParams.set("app_id", env.ADZUNA_APP_ID);
    url.searchParams.set("app_key", env.ADZUNA_APP_KEY);
    url.searchParams.set("results_per_page", String(Math.min(Math.max(query.limit, 1), 50)));
    url.searchParams.set("what", what);
    if (where) url.searchParams.set("where", where);
    url.searchParams.set("max_days_old", "30");
    url.searchParams.set("content-type", "application/json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    let data: { results?: AdzunaResult[] };
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[adzuna] non-OK response: ${res.status}`);
        return [];
      }
      data = (await res.json()) as { results?: AdzunaResult[] };
    } catch (err) {
      console.warn("[adzuna] fetch failed:", err instanceof Error ? err.message : "unknown");
      return [];
    } finally {
      clearTimeout(timeout);
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const jobs: Job[] = [];
    for (const r of results) {
      if (!r.title || !r.redirect_url) continue;
      const title = String(r.title);
      const description = stripHtml(r.description);
      const location = r.location?.display_name ?? "";
      jobs.push(
        finalizeJob({
          id: `adzuna:${r.id ?? r.redirect_url}`,
          title,
          company: r.company?.display_name ?? "Unknown",
          location,
          remote: detectRemote(title, description, location),
          description,
          url: String(r.redirect_url),
          source: "adzuna",
          postedAt: r.created ?? new Date().toISOString(),
        }),
      );
    }
    return jobs;
  },
};
