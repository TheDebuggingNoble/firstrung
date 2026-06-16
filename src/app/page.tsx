"use client";

import Link from "next/link";
import OnboardingForm from "@/components/OnboardingForm";
import Reveal from "@/components/Reveal";
import { Logo, LogoMark } from "@/components/Logo";
import LangToggle from "@/components/LangToggle";
import { useLang } from "@/components/LanguageProvider";

const ROLES: Record<string, string[]> = {
  en: [
    "Data Analyst", "Junior Developer", "Graduate Engineer", "Research Assistant",
    "Marketing Associate", "Business Analyst", "Lab Technician", "UX Designer",
    "Financial Analyst", "Content Writer", "QA Engineer", "Project Coordinator",
  ],
  sw: [
    "Mchambuzi wa Data", "Msanidi wa Ngazi ya Chini", "Mhandisi Mhitimu", "Msaidizi wa Utafiti",
    "Mshirika wa Masoko", "Mchambuzi wa Biashara", "Fundi wa Maabara", "Mbunifu wa UX",
    "Mchambuzi wa Fedha", "Mwandishi wa Maudhui", "Mhandisi wa Uhakiki Ubora", "Mratibu wa Mradi",
  ],
};

function TargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 13l2.5-7h11L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1z" strokeLinejoin="round" />
      <path d="M4 13h4l1.5 2.5h5L16 13h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Reasons({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
      {items.map((r) => (
        <li key={r} className="flex gap-2.5">
          <span className="dot" />
          {r}
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const { t, lang } = useLang();
  const steps = [
    { n: "01", t: "how.s1.t", d: "how.s1.d" },
    { n: "02", t: "how.s2.t", d: "how.s2.d" },
    { n: "03", t: "how.s3.t", d: "how.s3.d" },
  ];
  const features = [
    { icon: <TargetIcon />, t: "why.f1.t", d: "why.f1.d" },
    { icon: <ShieldIcon />, t: "why.f2.t", d: "why.f2.d" },
    { icon: <InboxIcon />, t: "why.f3.t", d: "why.f3.d" },
  ];
  const roles = ROLES[lang] ?? ROLES.en!;

  return (
    <main className="relative">
      <div className="grain" aria-hidden="true" />

      {/* Nav */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full px-5 py-3 glass">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] sm:flex">
            <a href="#how" className="transition hover:text-white">{t("nav.how")}</a>
            <a href="#why" className="transition hover:text-white">{t("nav.why")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <a href="#signup" className="btn-primary !px-5 !py-2.5 text-sm">{t("nav.getMatched")}</a>
          </div>
        </div>
      </header>

      {/* Hero, centered */}
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-20 text-center sm:pt-28">
        <h1 className="rise text-5xl font-bold leading-[1.05] sm:text-6xl" style={{ animationDelay: "0ms" }}>
          {t("hero.title1")}
          <br />
          <span className="accent-word">{t("hero.title2")}</span>
        </h1>

        <p className="rise mx-auto mt-6 max-w-xl text-lg text-[var(--muted)]" style={{ animationDelay: "90ms" }}>
          {t("hero.sub")}
        </p>

        <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "180ms" }}>
          <a href="#signup" className="btn-primary">{t("hero.ctaPrimary")}</a>
          <a href="#how" className="btn-ghost">{t("hero.ctaSecondary")}</a>
        </div>

        <p className="rise mt-5 text-sm text-[var(--muted)]" style={{ animationDelay: "260ms" }}>{t("hero.trust")}</p>

        {/* Illustration of how a ranked match reads */}
        <div className="rise mt-16" style={{ animationDelay: "320ms" }}>
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t("hero.sampleLabel")}</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="floaty w-[330px] card p-5 text-left" style={{ transform: "rotate(-2deg)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{t("sample1.title")}</p>
                  <p className="text-sm text-[var(--muted)]">{t("sample1.where")}</p>
                </div>
                <span className="rounded-full bg-[#ffb23e] px-2.5 py-1 text-xs font-bold text-[#1c1305]">92</span>
              </div>
              <Reasons items={[t("sample1.r1"), t("sample1.r2"), t("sample1.r3")]} />
              <div className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-center text-sm font-semibold text-white">
                {t("sample.viewApply")}
              </div>
            </div>

            <div className="floaty w-[300px] card p-5 text-left" style={{ animationDelay: "1.5s", transform: "rotate(2deg)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{t("sample2.title")}</p>
                  <p className="text-sm text-[var(--muted)]">{t("sample2.where")}</p>
                </div>
                <span className="rounded-full bg-[#ff7a45] px-2.5 py-1 text-xs font-bold text-[#1c1305]">88</span>
              </div>
              <Reasons items={[t("sample2.r1"), t("sample2.r2")]} />
            </div>
          </div>
        </div>

        {/* Role marquee */}
        <div className="mt-20">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t("marquee.label")}</p>
          <div className="marquee">
            <div className="marquee__track">
              {roles.map((r) => <span key={r} className="chip">{r}</span>)}
            </div>
            <div className="marquee__track" aria-hidden="true">
              {roles.map((r) => <span key={`${r}-2`} className="chip">{r}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb23e]">{t("how.kicker")}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{t("how.title")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="card p-7">
              <span className="font-display text-5xl font-bold text-white/10">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold">{t(s.t)}</h3>
              <p className="mt-3 text-[var(--muted)]">{t(s.d)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb23e]">{t("why.kicker")}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{t("why.title")}</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.t} delay={i * 120} className="card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffb23e]/12 text-[#ffb23e]">
                {f.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{t(f.t)}</h3>
              <p className="mt-3 text-[var(--muted)]">{t(f.d)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Signup */}
      <section id="signup" className="mx-auto max-w-3xl px-5 py-24">
        <Reveal className="text-center">
          <div className="mx-auto mb-6 flex w-fit">
            <LogoMark size={48} className="floaty" />
          </div>
          <h2 className="text-4xl font-bold sm:text-5xl">{t("signup.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">{t("signup.sub")}</p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <OnboardingForm />
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="max-w-md">{t("footer.privacy")}</p>
          <Link href="#signup" className="font-semibold text-white transition hover:text-[#ffb23e]">{t("footer.getMatched")}</Link>
        </div>
      </footer>
    </main>
  );
}
