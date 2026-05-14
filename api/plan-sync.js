// GET  /api/plans?userId=xxx       → { plans: [...] | null }
// PUT  /api/plans  body:{userId,plans} → { ok: true }
//
// Standalone — no Express/Clerk. Connects directly to Neon.
// Uses the practice_plans table: stores one special sync-blob row per user
// (id="sync_<userId>") so device A writes, device B reads the same row.
// Returns 503 when DATABASE_URL is absent so the client stays in localStorage mode.

import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return res.status(503).json({ error: "sync_unavailable" });
  }

  const userId =
    req.method === "GET"
      ? req.query?.userId
      : (req.body?.userId ?? null);

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId required" });
  }

  const syncId = `sync_${userId}`;

  try {
    const sql = neon(DATABASE_URL);

    if (req.method === "GET") {
      const rows = await sql`
        SELECT payload FROM practice_plans
        WHERE id = ${syncId} AND deleted_at IS NULL
        LIMIT 1
      `;
      return res.json({ plans: rows[0]?.payload ?? null });
    }

    if (req.method === "PUT") {
      const plans = req.body?.plans;
      if (!Array.isArray(plans)) {
        return res.status(400).json({ error: "plans must be an array" });
      }

      await sql`
        INSERT INTO practice_plans (
          id, org_id, title, status, payload,
          created_by_user_id, created_at, updated_at
        ) VALUES (
          ${syncId}, ${userId}, '__sync_blob__', 'draft',
          ${JSON.stringify(plans)}::jsonb,
          ${userId}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          payload    = EXCLUDED.payload,
          updated_at = NOW()
      `;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    // DB not reachable or table doesn't exist — client falls back to localStorage
    return res.status(503).json({ error: "sync_unavailable", detail: String(err) });
  }
}
