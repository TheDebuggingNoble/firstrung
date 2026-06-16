import "server-only";
import { z } from "zod";

/**
 * Centralised, validated, server-only environment access.
 *
 * Everything optional. The app works with nothing set (key-less job sources,
 * email in preview mode). Adding keys upgrades each part:
 *   - RAPIDAPI_KEY : on-the-ground Tanzania (and any country) jobs via JSearch.
 *   - ADZUNA_*  : precise city/country job search (no Tanzania market).
 *   - BREVO_API_KEY or RESEND_API_KEY : real email sending.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // JSearch (RapidAPI) — aggregates Google for Jobs, supports country=tz.
  RAPIDAPI_KEY: z.string().default(""),

  // Groq (free tier) — fast LLM used to semantically rerank matches. Server-only.
  GROQ_API_KEY: z.string().default(""),

  ADZUNA_APP_ID: z.string().default(""),
  ADZUNA_APP_KEY: z.string().default(""),
  ADZUNA_COUNTRY: z.string().default("gb"),

  BREVO_API_KEY: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("onboarding@firstrung.local"),
  EMAIL_FROM_NAME: z.string().default("FirstRung"),

  // Signs the email confirmation links. Required in production when email is on.
  TOKEN_SECRET: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const features = {
  jsearch: Boolean(env.RAPIDAPI_KEY),
  groq: Boolean(env.GROQ_API_KEY),
  adzuna: Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY),
  brevo: Boolean(env.BREVO_API_KEY),
  resend: Boolean(env.RESEND_API_KEY),
  get email() {
    return this.brevo || this.resend;
  },
} as const;

// In production, refuse to send confirmation links signed with weak/absent key
// material. (In development an ephemeral key is generated, see security/tokens.)
if (env.NODE_ENV === "production" && features.email && env.TOKEN_SECRET.length < 24) {
  throw new Error("TOKEN_SECRET must be set (>=24 chars) when email is enabled in production");
}
