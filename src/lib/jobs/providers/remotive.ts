import "server-only";
import type { Job, JobProvider, JobQuery } from "../types";
import { detectRemote, finalizeJob, stripHtml } from "../normalize";

/**
 * Remotive adapter. Real, live remote jobs. No API key required.
 * Docs: https://remotive.com/api/remote-jobs
 *
 * Security:
 *  - We only ever call the fixed, allow-listed Remotive host, so no
 *    user-controlled URL is fetched (no SSRF from this path).
 *  - User input goes in the encoded `search` query param only, never the host.
 *  - The call is time-bounded and the response defensively parsed; any
 *    malformed item is skipped rather than trusted.
 */

const REMOTIVE_HOST = "remotive.com";

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  publication_date?: string;
  description?: string;
}

export const remotiveProvider: JobProvider = {
  name: "remotive",
  async fetchJobs(query: JobQuery): Promise<Job[]> {
    const search = [...query.roles, ...query.skills].slice(0, 6).join(" ").slice(0, 120);
    const url = new URL(`https://${REMOTIVE_HOST}/api/remote-jobs`);
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("limit", String(Math.min(Math.max(query.limit, 1), 50)));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    let data: { jobs?: RemotiveJob[] };
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json", "user-agent": "FirstRung/1.0 (+job matcher)" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[remotive] non-OK response: ${res.status}`);
        return [];
      }
      data = (await res.json()) as { jobs?: RemotiveJob[] };
    } catch (err) {
      console.warn("[remotive] fetch failed:", err instanceof Error ? err.message : "unknown");
      return [];
    } finally {
      clearTimeout(timeout);
    }

    const rows = Array.isArray(data.jobs) ? data.jobs : [];
    const jobs: Job[] = [];
    for (const r of rows) {
      if (!r.title || !r.url) continue;
      const title = String(r.title);
      const description = stripHtml(r.description);
      const location = r.candidate_required_location || "Remote";
      jobs.push(
        finalizeJob({
          id: `remotive:${r.id ?? r.url}`,
          title,
          company: r.company_name ?? "Unknown",
          location,
          remote: true, // every Remotive listing is remote
          description,
          url: String(r.url),
          source: "remotive",
          postedAt: r.publication_date ?? new Date().toISOString(),
        }),
      );
    }
    return jobs;
  },
};
