import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";
import { inngest } from "../../inngest/client";

export function registerReadinessRoutes(router: Router) {
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { fatigue, sleep, soreness, mood, note } = req.body as {
        fatigue: number;
        sleep: number;
        soreness: number;
        mood?: number;
        note?: string;
      };
      const flagged = fatigue >= 7 || sleep <= 5 || soreness >= 7;
      const record = await repo.readiness.create({
        playerId: ctx.userId,
        fatigue,
        sleep,
        soreness,
        mood,
        note,
        flagged,
      });

      if (flagged) {
        try {
          await inngest.send({
            name: "readiness/flagged",
            data: {
              checkinId: record.id,
              orgId: ctx.orgId,
              playerId: ctx.userId,
              playerName: "Unknown",
              coachUserId: ctx.userId, // This is the player's user — TODO: look up coach
              fatigue,
              sleep,
              soreness,
              note,
            },
          });
        } catch (err) {
          // Don't fail the request if Inngest isn't configured
          console.warn("Inngest not available:", err);
        }
      }

      res.status(201).json(record);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/today", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.readiness.listToday();
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const days = req.query.days ? Number(req.query.days) : 30;
      const records = await repo.readiness.listForPlayer(req.params.playerId, days);
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
