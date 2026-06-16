"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";

interface Match {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  source: string;
  score: number;
  reasons: string[];
}

// Major Tanzanian regions/cities, offered as suggestions for the location field.
const TZ_REGIONS = [
  "Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Mbeya", "Morogoro", "Tanga", "Zanzibar",
  "Moshi", "Iringa", "Tabora", "Kigoma", "Mtwara", "Geita", "Shinyanga", "Songea", "Musoma",
  "Bukoba", "Singida", "Njombe",
];

const splitList = (s: string): string[] =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export default function OnboardingForm() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<"idle" | "loading" | "results" | "error">("idle");
  const [message, setMessage] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "preview" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [lastProfile, setLastProfile] = useState<Record<string, unknown> | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);

    const profile = {
      field: String(fd.get("field") ?? ""),
      degreeLevel: String(fd.get("degreeLevel") ?? "bachelors"),
      targetRoles: splitList(String(fd.get("targetRoles") ?? "")),
      skills: splitList(String(fd.get("skills") ?? "")),
      locations: splitList(String(fd.get("locations") ?? "")),
      remotePref: String(fd.get("remotePref") ?? "any"),
      country: String(fd.get("country") ?? "tz").toLowerCase(),
    };

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...profile, lang }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? t("emailblock.error"));
        if (data.issues) setFieldErrors(data.issues);
        return;
      }
      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setLastProfile(profile);
      setEmailStatus("idle");
      setStatus("results");
    } catch {
      setStatus("error");
      setMessage(t("emailblock.neterror"));
    }
  }

  async function onEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lastProfile) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setEmailStatus("sending");
    setEmailMsg("");
    try {
      const res = await fetch("/api/email/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...lastProfile, email, lang }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setEmailStatus("error");
        setEmailMsg(data.error ?? t("emailblock.error"));
        return;
      }
      if (data.status === "preview") {
        setPreviewHtml(typeof data.html === "string" ? data.html : "");
        setEmailStatus("preview");
      } else {
        setEmailStatus("sent");
        setEmailMsg(t("emailblock.confirmSent", { email }));
      }
    } catch {
      setEmailStatus("error");
      setEmailMsg(t("emailblock.neterror"));
    }
  }

  const err = (name: string) =>
    fieldErrors[name]?.[0] ? <p className="mt-1 text-sm text-rose-400">{fieldErrors[name]![0]}</p> : null;

  if (status === "results") {
    const countKey = matches.length === 1 ? "results.matches_one" : "results.matches_other";
    return (
      <div className="card p-7 text-left">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">
            {matches.length > 0 ? t(countKey, { n: matches.length }) : t("results.none")}
          </h3>
          <button
            onClick={() => { setStatus("idle"); setEmailStatus("idle"); }}
            className="text-sm font-semibold text-[#ffb23e] hover:underline"
          >
            {t("results.new")}
          </button>
        </div>

        {matches.length > 0 ? (
          <>
            <ul className="mt-5 space-y-3">
              {matches.map((m, i) => (
                <li key={i} className="rounded-xl border border-[var(--line)] bg-white/[0.025] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {m.company}, {m.location}{m.remote ? `, ${t("results.remote")}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#ffb23e] px-2.5 py-1 text-xs font-bold text-[#1c1305]">
                      {m.score}
                    </span>
                  </div>
                  {m.reasons.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                      {m.reasons.map((r, j) => (
                        <li key={j} className="flex gap-2.5"><span className="dot" />{r}</li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-block text-sm font-semibold text-[#ffb23e] hover:underline"
                  >
                    {t("results.viewApply")}
                  </a>
                </li>
              ))}
            </ul>

            {/* Optional: email the top 3 with next steps */}
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-white/[0.02] p-4">
              <p className="text-sm font-semibold">{t("emailblock.title")}</p>
              {emailStatus === "sent" ? (
                <p className="mt-2 text-sm text-[#ffb23e]">{emailMsg}</p>
              ) : (
                <>
                  <form onSubmit={onEmail} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={t("emailblock.placeholder")}
                      className="field"
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === "sending"}
                      className="btn-primary shrink-0 disabled:opacity-60"
                    >
                      {emailStatus === "sending" ? t("emailblock.preparing") : t("emailblock.button")}
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-[var(--muted)]">{t("emailblock.note")}</p>
                  {emailStatus === "error" && <p className="mt-2 text-sm text-rose-400">{emailMsg}</p>}
                  {emailStatus === "preview" && (
                    <div className="mt-3">
                      <p className="text-xs text-[var(--muted)]">{t("emailblock.previewNote")}</p>
                      <iframe
                        title="Email preview"
                        sandbox=""
                        srcDoc={previewHtml}
                        className="mt-2 h-96 w-full rounded-lg border border-[var(--line)] bg-white"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">{t("results.emptyHelp")}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-7 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-200">{t("form.field")}</label>
          <input name="field" type="text" required placeholder={t("form.field.ph")} className="field mt-1" />
          {err("field")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">{t("form.degree")}</label>
          <select name="degreeLevel" defaultValue="bachelors" className="field mt-1">
            <option value="bachelors">{t("form.degree.bachelors")}</option>
            <option value="masters">{t("form.degree.masters")}</option>
            <option value="phd">{t("form.degree.phd")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">{t("form.work")}</label>
          <select name="remotePref" defaultValue="any" className="field mt-1">
            <option value="any">{t("form.work.any")}</option>
            <option value="remote">{t("form.work.remote")}</option>
            <option value="hybrid">{t("form.work.hybrid")}</option>
            <option value="onsite">{t("form.work.onsite")}</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-200">{t("form.roles")}</label>
          <input name="targetRoles" type="text" required placeholder={t("form.roles.ph")} className="field mt-1" />
          {err("targetRoles")}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-200">{t("form.skills")}</label>
          <input name="skills" type="text" placeholder={t("form.skills.ph")} className="field mt-1" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">{t("form.locations")}</label>
          <input name="locations" type="text" list="tz-regions" placeholder={t("form.locations.ph")} className="field mt-1" />
          <datalist id="tz-regions">
            {TZ_REGIONS.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">{t("form.country")}</label>
          <input name="country" type="text" defaultValue="tz" maxLength={2} placeholder="tz" className="field mt-1 lowercase" />
        </div>
      </div>

      {status === "error" && message && (
        <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {message}
        </p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-primary mt-6 w-full disabled:opacity-60">
        {status === "loading" ? t("form.submitting") : t("form.submit")}
      </button>
      <p className="mt-3 text-center text-xs text-[var(--muted)]">{t("form.trust")}</p>
    </form>
  );
}
