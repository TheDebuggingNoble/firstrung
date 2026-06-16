/**
 * HTML-escape untrusted text before interpolating into email templates.
 *
 * Email clients render HTML; a job title or company name scraped from the web is
 * untrusted input. Escaping here prevents HTML/script injection into the emails
 * we send (stored-XSS-style payloads riding through our pipeline into inboxes).
 */
export function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Allow only http(s) URLs in links we emit. Blocks javascript:, data:, etc.
 * Returns a safe fallback ("#") for anything suspicious.
 */
export function safeUrl(raw: unknown): string {
  try {
    const u = new URL(String(raw));
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* fall through */
  }
  return "#";
}
