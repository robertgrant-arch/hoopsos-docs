import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";

const VALID_PROVIDERS = ["apple_health", "whoop", "garmin", "oura"] as const;
type WearableProvider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(p: string): p is WearableProvider {
  return (VALID_PROVIDERS as readonly string[]).includes(p);
}

export function registerWearableRoutes(router: Router) {
  // ── Player self-service routes ──────────────────────────────────────────

  router.get("/me/connections", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const connections = await repo.wearableConnections.list({ playerId: ctx.userId });
      res.json(connections);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/me/metrics", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const metrics = await repo.wearableMetrics.getLatest(ctx.userId);
      res.json(metrics);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/me/metrics/history", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const days = req.query.days ? Number(req.query.days) : 30;
      const history = await repo.wearableMetrics.getHistory(ctx.userId, days);
      res.json(history);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/me/sharing", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const sharing = await repo.wearableSharing.get(ctx.userId);
      res.json(sharing ?? {
        shareRecovery: false,
        shareSleep: false,
        shareStrain: false,
        shareHeartRate: false,
        shareWithCoaches: false,
        shareWithTeam: false,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/me/sharing", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const {
        shareRecovery,
        shareSleep,
        shareStrain,
        shareHeartRate,
        shareWithCoaches,
        shareWithTeam,
      } = req.body as {
        shareRecovery?: boolean;
        shareSleep?: boolean;
        shareStrain?: boolean;
        shareHeartRate?: boolean;
        shareWithCoaches?: boolean;
        shareWithTeam?: boolean;
      };
      const updated = await repo.wearableSharing.upsert(ctx.userId, {
        ...(shareRecovery !== undefined ? { shareRecovery } : {}),
        ...(shareSleep !== undefined ? { shareSleep } : {}),
        ...(shareStrain !== undefined ? { shareStrain } : {}),
        ...(shareHeartRate !== undefined ? { shareHeartRate } : {}),
        ...(shareWithCoaches !== undefined ? { shareWithCoaches } : {}),
        ...(shareWithTeam !== undefined ? { shareWithTeam } : {}),
      });
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/connect/:provider", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { provider } = req.params;
      if (!isValidProvider(provider)) {
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
      }
      const repo = createRepository(ctx);
      const connection = await repo.wearableConnections.upsertConnection({
        playerId: ctx.userId,
        provider,
        status: "pending",
      });
      res.status(201).json({
        connectionId: connection.id,
        authUrl: null,
        message: "OAuth flow coming soon — connection created in pending state",
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/disconnect/:provider", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { provider } = req.params;
      if (!isValidProvider(provider)) {
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
      }
      const repo = createRepository(ctx);
      const connections = await repo.wearableConnections.getByPlayer(ctx.userId);
      const match = connections.find((c) => c.provider === provider);
      if (!match) {
        return res.status(404).json({ error: "Connection not found" });
      }
      await repo.wearableConnections.disconnect(match.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Coach route ──────────────────────────────────────────────────────────

  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { playerId } = req.params;
      const repo = createRepository(ctx);
      const allowed = await repo.wearableSharing.canCoachView(playerId);
      if (!allowed) {
        return res.status(403).json({ error: "Player has not shared wearable data" });
      }
      const metrics = await repo.wearableMetrics.getLatest(playerId);
      res.json(metrics);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
