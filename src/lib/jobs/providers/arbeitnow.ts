import "server-only";
import type { Job, JobProvider, JobQuery } from "../types";
import { finalizeJob, stripHtml } from "../normalize";

/**
 * Arbeitnow adapter. Real, live job board (Europe plus remote). No API key.
 * Docs: https://www.arbeitnow.com/api
 *
 * Security: fixed allow-listed host only (no SSRF), time-bounded request,
 * defensive parsing. The board has no search parameter, so we pull the latest
 * page and let the matching engine rank for relevance.
 */

const ARBEITNOW_HOST = "www.arbeitnow.com";

interface ArbeitnowJob {
  slug?: string;
  title?: string;
  company_name?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  location?: string;
  created_at?: number; // unix seconds
}

export const arbeitnowProvider: JobProvider = {
  name: "arbeitnow",
  async fetchJobs(_query: JobQuery): Promise<Job[]> {
    const url = new URL(`https://${ARBEITNOW_HOST}/api/job-board-api`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    let data: { data?: ArbeitnowJob[] };
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json", "user-agent": "FirstRung/1.0 (+job matcher)" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[arbeitnow] non-OK response: ${res.status}`);
        return [];
      }
      data = (await res.json()) as { data?: ArbeitnowJob[] };
    } catch (err) {
      console.warn("[arbeitnow] fetch failed:", err instanceof Error ? err.message : "unknown");
      return [];
    } finally {
      clearTimeout(timeout);
    }

    const rows = Array.isArray(data.data) ? data.data : [];
    const jobs: Job[] = [];
    for (const r of rows) {
      if (!r.title || !r.url) continue;
      const created =
        typeof r.created_at === "number" ? new Date(r.created_at * 1000).toISOString() : new Date().toISOString();
      jobs.push(
        finalizeJob({
          id: `arbeitnow:${r.slug ?? r.url}`,
          title: String(r.title),
          company: r.company_name ?? "Unknown",
          location: r.location ?? "",
          remote: Boolean(r.remote),
          description: stripHtml(r.description),
          url: String(r.url),
          source: "arbeitnow",
          postedAt: created,
        }),
      );
    }
    return jobs;
  },
};
