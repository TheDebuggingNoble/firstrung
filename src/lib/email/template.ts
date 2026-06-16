import { escapeHtml, safeUrl } from "@/lib/security/html";
import type { MatchResult } from "@/lib/matching/engine";
import { t, type Lang } from "@/lib/i18n";

/**
 * The emails, in the recipient's chosen language. ALL dynamic values pass through
 * escapeHtml / safeUrl because job content comes from third-party feeds and is
 * untrusted. Match reasons arrive already localized from the matching engine.
 */

function cleanField(field: string): string {
  // Strip control characters / newlines before the value goes near a Subject
  // header (header-injection hygiene, even via the provider JSON APIs).
  return String(field).replace(/[\r\n\t]+/g, " ").trim().slice(0, 60);
}

function reasonList(reasons: string[]): string {
  if (reasons.length === 0) return "";
  return `<ul style="margin:10px 0 0;padding-left:18px;color:#5b5448;font-size:14px">${reasons
    .map((r) => `<li style="margin:3px 0">${escapeHtml(r)}</li>`)
    .join("")}</ul>`;
}

function matchBlock(lang: Lang, m: MatchResult, i: number): string {
  const job = m.job;
  const where = `${escapeHtml(job.company)}, ${escapeHtml(job.location)}${job.remote ? `, ${escapeHtml(t(lang, "email.remote"))}` : ""}`;
  return `
  <tr><td style="padding:0 0 14px">
    <table width="100%" style="border:1px solid #e7e1d4;border-radius:12px;background:#ffffff">
      <tr><td style="padding:18px">
        <table width="100%"><tr>
          <td style="vertical-align:top">
            <div style="font-size:12px;color:#9a907c;font-family:monospace">${escapeHtml(t(lang, "email.no"))} ${i + 1}</div>
            <div style="font-size:17px;font-weight:700;color:#1c1305;margin-top:2px">${escapeHtml(job.title)}</div>
            <div style="font-size:14px;color:#7a7263;margin-top:2px">${where}</div>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap">
            <span style="display:inline-block;background:#ffb23e;color:#1c1305;font-weight:700;border-radius:999px;padding:3px 11px;font-size:13px">${m.score}</span>
          </td>
        </tr></table>
        ${reasonList(m.reasons.slice(0, 3))}
        <a href="${safeUrl(job.url)}" style="display:inline-block;margin-top:14px;background:#1c1305;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(t(lang, "email.viewApply"))}</a>
      </td></tr>
    </table>
  </td></tr>`;
}

export function confirmRequestEmail(opts: {
  confirmUrl: string;
  field: string;
  lang: Lang;
}): { subject: string; html: string; text: string } {
  const { lang } = opts;
  const field = escapeHtml(cleanField(opts.field));
  const url = safeUrl(opts.confirmUrl);
  const subject = t(lang, "email.confirm.subject");
  const html = `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif">
  <table width="100%"><tr><td align="center" style="padding:32px 12px">
    <table width="100%" style="max-width:520px;background:#fff;border-radius:14px;border:1px solid #e7e1d4">
      <tr><td style="padding:28px">
        <div style="font-size:20px;font-weight:800;color:#1c1305">FirstRung</div>
        <p style="color:#4a4334;font-size:15px;line-height:1.6">${t(lang, "email.confirm.body", { field: `<strong>${field}</strong>` })}</p>
        <p style="margin:22px 0">
          <a href="${url}" style="background:#ffb23e;color:#1c1305;text-decoration:none;padding:11px 20px;border-radius:9px;font-weight:700;font-size:15px">${escapeHtml(t(lang, "email.confirm.button"))}</a>
        </p>
        <p style="color:#9a907c;font-size:13px;line-height:1.6">${escapeHtml(t(lang, "email.confirm.ignore"))}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${t(lang, "email.confirm.subject")}\n\n${t(lang, "email.confirm.body", { field: cleanField(opts.field) })}\n${opts.confirmUrl}\n\n${t(lang, "email.confirm.ignore")}`;
  return { subject, html, text };
}

export function topMatchesEmail(opts: {
  matches: MatchResult[];
  field: string;
  lang: Lang;
}): { subject: string; html: string; text: string } {
  const { lang } = opts;
  const top = opts.matches.slice(0, 3);
  const field = cleanField(opts.field);
  const subject =
    top.length > 0
      ? t(lang, top.length === 1 ? "email.top.subject_one" : "email.top.subject_other", { n: top.length, field })
      : t(lang, "email.top.subjectNone");

  const steps = [
    t(lang, "email.step1"),
    t(lang, "email.step2"),
    t(lang, "email.step3"),
    t(lang, "email.step4"),
  ];
  const stepsHtml = steps
    .map(
      (s, i) =>
        `<tr><td style="padding:6px 0;color:#4a4334;font-size:14px"><span style="color:#c8631f;font-weight:700">${i + 1}.</span> ${escapeHtml(s)}</td></tr>`,
    )
    .join("");

  const intro = t(lang, top.length === 1 ? "email.top.intro_one" : "email.top.intro_other");

  const html = `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif">
  <table width="100%"><tr><td align="center" style="padding:28px 12px">
    <table width="100%" style="max-width:560px">
      <tr><td style="padding:0 4px 14px">
        <span style="font-size:20px;font-weight:800;color:#1c1305">FirstRung</span>
      </td></tr>
      <tr><td style="padding:0 4px 18px;color:#4a4334;font-size:15px">${escapeHtml(intro)}</td></tr>
      ${top.map((m, i) => matchBlock(lang, m, i)).join("") || `<tr><td style="color:#7a7263;font-size:14px;padding:6px 4px 16px">${escapeHtml(t(lang, "email.top.none"))}</td></tr>`}
      <tr><td style="padding:10px 4px 6px">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9a907c">${escapeHtml(t(lang, "email.top.howTo"))}</div>
        <table width="100%" style="margin-top:6px">${stepsHtml}</table>
      </td></tr>
      <tr><td style="padding:18px 4px 0;color:#9a907c;font-size:12px;line-height:1.6">${escapeHtml(t(lang, "email.top.footer"))}</td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text =
    `FirstRung: ${subject}\n\n` +
    top
      .map(
        (m, i) =>
          `${i + 1}. ${m.job.title} ${lang === "sw" ? "kwa" : "at"} ${m.job.company}, ${m.job.location}${m.job.remote ? `, ${t(lang, "email.remote")}` : ""}\n   ${m.score}. ${m.reasons.join("; ")}\n   ${m.job.url}`,
      )
      .join("\n\n") +
    `\n\n${t(lang, "email.top.howTo")}:\n` +
    steps.map((s, i) => `${i + 1}. ${s}`).join("\n") +
    `\n\n${t(lang, "email.top.footer")}`;

  return { subject, html, text };
}
