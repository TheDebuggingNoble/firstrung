import "server-only";
import type { NextRequest } from "next/server";

const MAX_BODY_BYTES = 16 * 1024; // 16 KB is plenty for our small JSON payloads

type Read = { ok: true; data: unknown } | { ok: false; status: number; error: string };

/**
 * Read and JSON-parse a request body with a hard size cap.
 *
 * Route handlers do not bound body size by default, so a client could stream a
 * very large body and force us to buffer it (memory DoS). We reject anything
 * over MAX_BODY_BYTES by Content-Length and again by the actual text length.
 */
export async function readJsonBounded(req: NextRequest): Promise<Read> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "Request body too large" };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request body" };
  }
  if (raw.length > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "Request body too large" };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request body" };
  }
}
