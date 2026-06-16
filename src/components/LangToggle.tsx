"use client";

import { useLang } from "./LanguageProvider";

/** EN / SW switch. Shows both, highlights the active one, flips on click. */
export default function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex items-center rounded-full border border-[var(--line)] bg-white/[0.03] p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1 transition ${lang === "en" ? "bg-[#ffb23e] text-[#1c1305]" : "text-[var(--muted)] hover:text-white"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("sw")}
        aria-pressed={lang === "sw"}
        className={`rounded-full px-2.5 py-1 transition ${lang === "sw" ? "bg-[#ffb23e] text-[#1c1305]" : "text-[var(--muted)] hover:text-white"}`}
      >
        SW
      </button>
    </div>
  );
}
