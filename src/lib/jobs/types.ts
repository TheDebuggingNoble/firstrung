export type Seniority = "internship" | "entry" | "mid" | "senior" | "lead" | "unknown";

/** The single normalised shape every provider must produce. */
export interface Job {
  id: string; // stable, provider-prefixed (e.g. "adzuna:12345")
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  source: string;
  postedAt: string; // ISO date
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  /** Heuristic seniority parsed from title/description (see matching/engine). */
  seniority: Seniority;
  /** Minimum years of experience demanded, if detectable. */
  minYearsExperience?: number;
}

export interface JobQuery {
  roles: string[];
  skills: string[];
  locations: string[];
  country: string;
  remoteOnly: boolean;
  limit: number;
}

export interface JobProvider {
  name: string;
  fetchJobs(query: JobQuery): Promise<Job[]>;
}
