"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

/**
 * The human action of double opt-in. Posts the signed token to /api/email/confirm
 * to actually send the matches. Because the send happens on this click (a POST),
 * not on the page's GET load, email-scanner link prefetching cannot trigger it.
 * Language is fixed by the token (what the user chose at request time).
 */
export default function ConfirmSend({ token, lang }: { token: string; lang: Lang }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "preview" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  async function onConfirm() {
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/email/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setMsg(data.error ?? t(lang, "confirm.error"));
        return;
      }
      if (data.status === "preview") {
        setPreviewHtml(typeof data.html === "string" ? data.html : "");
        setState("preview");
      } else {
        setState("sent");
      }
    } catch {
      setState("error");
      setMsg(t(lang, "confirm.neterror"));
    }
  }

  if (state === "sent") {
    return <p className="mt-6 text-[#ffb23e]">{t(lang, "confirm.sent")}</p>;
  }

  if (state === "preview") {
    return (
      <div className="mt-6 text-left">
        <p className="text-sm text-[var(--muted)]">{t(lang, "confirm.previewNote")}</p>
        <iframe
          title="Matches email preview"
          sandbox=""
          srcDoc={previewHtml}
          className="mt-2 h-96 w-full rounded-lg border border-[var(--line)] bg-white"
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button onClick={onConfirm} disabled={state === "sending"} className="btn-primary disabled:opacity-60">
        {state === "sending" ? t(lang, "confirm.sending") : t(lang, "confirm.button")}
      </button>
      {state === "error" && <p className="mt-3 text-sm text-rose-400">{msg}</p>}
    </div>
  );
}
