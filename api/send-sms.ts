/**
 * POST /api/send-sms
 * ----------------------------------------------------------------------------
 * Vercel serverless function that texts a Practice Plan share link to a phone
 * number via Twilio Programmable Messaging.
 *
 * Required environment variables (set in Vercel → Project → Settings → Env):
 *   TWILIO_ACCOUNT_SID     - Account SID from console.twilio.com
 *   TWILIO_AUTH_TOKEN      - Auth Token (rotate any value committed to git)
 *   TWILIO_FROM_NUMBER     - E.164 sender, e.g. "+18885551234" (10DLC-registered)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import twilio from "twilio";

function toE164(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
const rlBucket = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rlBucket.get(key) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  rlBucket.set(key, hits);
  return hits.length > RL_MAX;
}

function safeJson(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({
      ok: false,
      error: "twilio_not_configured",
      hint: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in Vercel env.",
    });
  }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) ?? {};
  const phoneRaw = String((body as any).phone ?? "");
  const link = String((body as any).link ?? "");
  const planTitle = String((body as any).planTitle ?? "a practice plan").slice(0, 80);
  const senderName = String((body as any).senderName ?? "Your coach").slice(0, 60);

  const to = toE164(phoneRaw);
  if (!to) return res.status(400).json({ ok: false, error: "invalid_phone" });
  if (!link || !isSafeUrl(link)) {
    return res.status(400).json({ ok: false, error: "invalid_link" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "rate_limited" });
  }

  const text = `${senderName} shared the practice plan "${planTitle}" with you on HoopsOS: ${link}`;

  try {
    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({ to, from: fromNumber, body: text });
    return res.status(200).json({ ok: true, sid: result.sid, status: result.status, to });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "twilio_error";
    console.error("send-sms failure:", message);
    return res.status(502).json({ ok: false, error: "twilio_send_failed" });
  }
}
