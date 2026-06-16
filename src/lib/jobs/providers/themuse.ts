import "server-only";
import type { Job, JobProvider, JobQuery } from "../types";
import { detectRemote, finalizeJob, stripHtml } from "../normalize";

/**
 * The Muse adapter. Real jobs with genuine city locations and an entry-level
 * filter. No API key required.
 * Docs: https://www.themuse.com/developers/api/v2
 *
 * To make city search work key-lessly we map the user's 2-letter country to the
 * country name The Muse uses (e.g. "London" + gb -> "London, United Kingdom"),
 * and pass each location form as a repeatable `location` filter (OR semantics).
 *
 * Security: fixed allow-listed host only (no SSRF), time-bounded, defensive
 * parsing, HTML stripped from descriptions.
 */

const MUSE_HOST = "www.themuse.com";

const COUNTRY_NAME: Record<string, string> = {
  gb: "United Kingdom",
  uk: "United Kingdom",
  us: "United States",
  ca: "Canada",
  au: "Australia",
  ie: "Ireland",
  de: "Germany",
  fr: "France",
  nl: "Netherlands",
  es: "Spain",
  it: "Italy",
  pt: "Portugal",
  in: "India",
  sg: "Singapore",
  za: "South Africa",
  ae: "United Arab Emirates",
};

interface MuseJob {
  name?: string;
  contents?: string;
  publication_date?: string;
  refs?: { landing_page?: string };
  company?: { name?: string };
  locations?: Array<{ name?: string }>;
  levels?: Array<{ name?: string }>;
}

export const themuseProvider: JobProvider = {
  name: "themuse",
  async fetchJobs(query: JobQuery): Promise<Job[]> {
    const url = new URL(`https://${MUSE_HOST}/api/public/jobs`);
    url.searchParams.set("page", "1");
    // Entry-level focus for new grads.
    url.searchParams.append("level", "Entry Level");
    url.searchParams.append("level", "Internship");

    const countryName = COUNTRY_NAME[query.country];
    for (const loc of query.locations.slice(0, 3)) {
      url.searchParams.append("location", loc);
      if (countryName) url.searchParams.append("location", `${loc}, ${countryName}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    let data: { results?: MuseJob[] };
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json", "user-agent": "FirstRung/1.0 (+job matcher)" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[themuse] non-OK response: ${res.status}`);
        return [];
      }
      data = (await res.json()) as { results?: MuseJob[] };
    } catch (err) {
      console.warn("[themuse] fetch failed:", err instanceof Error ? err.message : "unknown");
      return [];
    } finally {
      clearTimeout(timeout);
    }

    const rows = Array.isArray(data.results) ? data.results : [];
    const jobs: Job[] = [];
    for (const r of rows) {
      const urlRef = r.refs?.landing_page;
      if (!r.name || !urlRef) continue;
      const title = String(r.name);
      const description = stripHtml(r.contents);
      const locNames = (r.locations ?? []).map((l) => l?.name ?? "").filter(Boolean);
      const isRemote =
        locNames.some((n) => /flexible|remote/i.test(n)) || detectRemote(title, description, locNames.join(" "));
      const location = locNames.find((n) => !/flexible|remote/i.test(n)) || locNames[0] || "Remote";
      jobs.push(
        finalizeJob({
          id: `themuse:${urlRef}`,
          title,
          company: r.company?.name ?? "Unknown",
          location,
          remote: isRemote,
          description,
          url: String(urlRef),
          source: "themuse",
          postedAt: r.publication_date ?? new Date().toISOString(),
        }),
      );
    }
    return jobs;
  },
};
