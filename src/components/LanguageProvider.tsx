"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANG, isLang, t as translate, type Lang } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<LangCtx | null>(null);
const STORAGE_KEY = "firstrung.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start at DEFAULT_LANG so the server and first client render match
  // (no hydration mismatch); restore the saved choice right after mount.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (isLang(saved) && saved !== lang) setLangState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, "meta.title");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable, fine */
    }
  }, []);

  const toggle = useCallback(() => setLang(lang === "en" ? "sw" : "en"), [lang, setLang]);
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);

  return <Ctx.Provider value={{ lang, setLang, toggle, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
