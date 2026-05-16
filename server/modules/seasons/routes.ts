/**
 * /api/seasons — Season and team management.
 *
 * Season and team management is restricted to admins, owners, and coaches.
 * Read access is available to all org members.
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrg, requireOrgRole, ORG_ROLES, HttpError } from "../../auth/tenant";
import slugify from "../../lib/slugify";

export function registerSeasonRoutes(router: Router) {

  // ── GET /api/seasons ──────────────────────────────────────────────────────
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const includeArchived = req.query.includeArchived === "true";
      const seasons = await repo.seasons.list({ includeArchived });
      res.json(seasons);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/seasons/:id ──────────────────────────────────────────────────
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const season = await repo.seasons.getById(req.params.id);
      if (!season) return res.status(404).json({ error: "Season not found" });
      res.json(season);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/seasons ─────────────────────────────────────────────────────
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const { name, description, startsAt, endsAt, registrationOpensAt, registrationClosesAt, maxRoster } = req.body;
      if (!name) return res.status(400).json({ error: "name is required" });

      const slug = slugify(name);
      const season = await repo.seasons.create({
        name,
        slug,
        description,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt) : undefined,
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt) : undefined,
        maxRoster: maxRoster ?? null,
      });
      res.status(201).json(season);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /api/seasons/:id ────────────────────────────────────────────────
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const allowed = ["name", "description", "status", "startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt", "maxRoster"];
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in req.body) {
          patch[key] = ["startsAt","endsAt","registrationOpensAt","registrationClosesAt"].includes(key) && req.body[key]
            ? new Date(req.body[key])
            : req.body[key];
        }
      }
      if (patch.name) patch.slug = slugify(patch.name as string);

      const updated = await repo.seasons.update(req.params.id, patch as any);
      if (!updated) return res.status(404).json({ error: "Season not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── DELETE /api/seasons/:id ───────────────────────────────────────────────
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.seasons.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/seasons/:id/teams ────────────────────────────────────────────
  router.get("/:id/teams", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const season = await repo.seasons.getById(req.params.id);
      if (!season) return res.status(404).json({ error: "Season not found" });
      const teamsResult = await repo.teams.list({ seasonId: req.params.id });
      res.json(teamsResult);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/seasons/:id/registrations (summary) ──────────────────────────
  router.get("/:id/registrations/summary", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const counts = await repo.registrations.countByStatus(req.params.id);
      res.json(counts);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
