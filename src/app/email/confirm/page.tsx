import Link from "next/link";
import { verifyToken } from "@/lib/security/tokens";
import { LogoMark } from "@/components/Logo";
import ConfirmSend from "@/components/ConfirmSend";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface Payload {
  e: string;
  profile?: { field?: string };
  lang?: Lang;
}

/**
 * Double opt-in landing (GET). It only VERIFIES the token and renders a confirm
 * button; it never sends. Sending happens on the button's POST, so an email
 * client prefetching this link cannot auto-send anything. Text is shown in the
 * language the user chose when they requested it (carried in the signed token).
 */
export default function ConfirmPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  const payload = verifyToken<Payload>(token, "email-confirm");
  const lang: Lang = isLang(payload?.lang) ? payload!.lang! : "en";
  const fieldRaw = typeof payload?.profile?.field === "string" ? payload.profile.field : "";
  const field = fieldRaw ? `${fieldRaw} ` : "";

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 text-center">
        <LogoMark size={40} />
        <div className="mt-6 w-full rounded-2xl border border-[var(--line)] bg-white/[0.02] p-8">
          {payload ? (
            <>
              <h1 className="text-2xl font-bold">{t(lang, "confirm.title")}</h1>
              <p className="mt-3 text-[var(--muted)]">{t(lang, "confirm.body", { field, email: payload.e })}</p>
              <ConfirmSend token={token} lang={lang} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{t(lang, "confirm.invalidTitle")}</h1>
              <p className="mt-3 text-[var(--muted)]">{t(lang, "confirm.invalidBody")}</p>
              <Link href="/#signup" className="mt-6 inline-block font-semibold text-[#ffb23e] hover:underline">
                {t(lang, "confirm.back")}
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
