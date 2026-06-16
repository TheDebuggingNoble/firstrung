import { z } from "zod";

/**
 * Input validation for the anonymous matcher. This is the trust boundary: every
 * field is length-capped (anti-abuse), trimmed, typed. No email, no account, no
 * consent flag, because nothing is stored and nothing is sent. You ask, you get
 * matches, and we forget you the moment the response is sent.
 */

const shortText = z.string().trim().min(1).max(120);
const list = (max: number) =>
  z
    .array(z.string().trim().min(1).max(60))
    .max(max)
    .transform((arr) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))));

export const DegreeLevel = z.enum(["bachelors", "masters", "phd"]);
export type DegreeLevel = z.infer<typeof DegreeLevel>;

export const RemotePref = z.enum(["any", "remote", "onsite", "hybrid"]);
export type RemotePref = z.infer<typeof RemotePref>;

export const MatchInput = z.object({
  field: shortText, // e.g. "Computer Science"
  degreeLevel: DegreeLevel.default("bachelors"),
  targetRoles: list(10).refine((a) => a.length > 0, "Add at least one target role"),
  skills: list(30).default([]),
  locations: list(10).default([]),
  remotePref: RemotePref.default("any"),
  country: z.string().trim().toLowerCase().length(2).default("tz"),
  // UI language; controls the language of match reasons and any email.
  lang: z.enum(["en", "sw"]).default("en"),
});

export type MatchInput = z.infer<typeof MatchInput>;

/** Same profile, plus the address to email the top matches to (used once, not stored). */
export const EmailMatchInput = MatchInput.extend({
  email: z.string().trim().toLowerCase().email().max(254),
});

export type EmailMatchInput = z.infer<typeof EmailMatchInput>;

/** The shape the matching engine scores against. */
export type MatchProfile = {
  field: string;
  degreeLevel: DegreeLevel;
  targetRoles: string[];
  skills: string[];
  locations: string[];
  remotePref: RemotePref;
  country: string;
};
