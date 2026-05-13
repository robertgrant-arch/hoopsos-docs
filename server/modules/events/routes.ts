import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";
import { inngest } from "../../inngest/client";

export function registerEventRoutes(router: Router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const from = req.query.from
        ? new Date(req.query.from as string)
        : undefined;
      const items = await repo.events.list({ from });
      res.json(items);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.events.getById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.events.create(req.body);
      res.status(201).json(item);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.events.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.events.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/availability", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { response, note } = req.body as { response: string; note?: string };
      const record = await repo.eventAvailability.upsert({
        eventId: req.params.id,
        playerId: ctx.userId,
        response: response as any,
        note,
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/:id/availability", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.eventAvailability.listForEvent(req.params.id);
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { records } = req.body as {
        records: Array<{ playerId: string; status: string; note?: string }>;
      };
      const saved = await repo.eventAttendance.upsertBulk(
        req.params.id,
        records.map((r) => ({
          playerId: r.playerId,
          status: r.status as "present" | "absent" | "late" | "excused",
          note: r.note,
          recordedByUserId: ctx.userId,
        })),
      );

      // After saving attendance...
      const absentPlayers = records
        .filter((r: any) => r.status === "absent")
        .map((r: any) => ({
          playerId: r.playerId,
          playerName: r.playerName ?? r.playerId,
          parentPhone: r.parentPhone,
          parentEmail: r.parentEmail,
        }));

      if (absentPlayers.length > 0) {
        try {
          await inngest.send({
            name: "attendance/submitted",
            data: {
              eventId: req.params.id,
              orgId: ctx.orgId,
              eventTitle: "Practice", // TODO: load event title from DB
              eventDate: new Date().toLocaleDateString(),
              absentPlayers,
              coachUserId: ctx.userId,
            },
          });
        } catch (err) {
          console.warn("Inngest event failed:", err);
        }
      }

      res.status(201).json(saved);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.eventAttendance.listForEvent(req.params.id);
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
