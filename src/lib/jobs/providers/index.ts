import "server-only";
import { features } from "@/lib/env";
import type { JobProvider } from "../types";
import { jsearchProvider } from "./jsearch";
import { themuseProvider } from "./themuse";
import { remotiveProvider } from "./remotive";
import { arbeitnowProvider } from "./arbeitnow";
import { adzunaProvider } from "./adzuna";

/**
 * Live job sources.
 *  - JSearch: on-the-ground Tanzania (and any country) jobs, added when a free
 *    RapidAPI key is set. This is the primary local source for the TZ audience.
 *  - The Muse: real city locations + entry-level filter, key-less.
 *  - Remotive: remote roles open worldwide (relevant to TZ grads), key-less.
 *  - Arbeitnow: extra remote coverage, key-less.
 *  - Adzuna: precise city/country search (no TZ market), added when keyed.
 */
export function activeProviders(): JobProvider[] {
  const providers: JobProvider[] = [];
  if (features.jsearch) providers.push(jsearchProvider);
  providers.push(themuseProvider, remotiveProvider, arbeitnowProvider);
  if (features.adzuna) providers.push(adzunaProvider);
  return providers;
}
