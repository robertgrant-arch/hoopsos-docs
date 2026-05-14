import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";

export function registerRosterRoutes(router: Router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const players = await repo.players.list();
      res.json(players);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const player = await repo.players.getById(req.params.id);
      if (!player) return res.status(404).json({ error: "Not found" });
      res.json(player);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const player = await repo.players.create(req.body);
      res.status(201).json(player);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.players.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.players.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
