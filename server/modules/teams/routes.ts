/**
 * /api/teams — Team and roster management.
 *
 * Teams are sub-groups within an org (Varsity, JV, 10U, etc.).
 * Admins/coaches manage teams; all members can read.
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrg, requireOrgRole, ORG_ROLES } from "../../auth/tenant";
import slugify from "../../lib/slugify";

export function registerTeamRoutes(router: Router) {

  // ── GET /api/teams ────────────────────────────────────────────────────────
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const teamsResult = await repo.teams.list({
        seasonId: req.query.seasonId as string | undefined,
        activeOnly: req.query.activeOnly !== "false",
      });
      res.json(teamsResult);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/teams/:id ────────────────────────────────────────────────────
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const team = await repo.teams.getById(req.params.id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.json(team);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/teams ───────────────────────────────────────────────────────
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const { name, seasonId, ageGroup, gender, headCoachUserId, colorPrimary } = req.body;
      if (!name) return res.status(400).json({ error: "name is required" });

      const team = await repo.teams.create({
        name,
        slug: slugify(name),
        seasonId: seasonId ?? null,
        ageGroup: ageGroup ?? "other",
        gender: gender ?? "boys",
        headCoachUserId: headCoachUserId ?? null,
        colorPrimary: colorPrimary ?? null,
      });
      res.status(201).json(team);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /api/teams/:id ──────────────────────────────────────────────────
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const allowed = ["name","seasonId","ageGroup","gender","headCoachUserId","assistantCoachUserIds","colorPrimary","colorSecondary","logoUrl","isActive"];
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in req.body) patch[key] = req.body[key];
      }
      if (patch.name) patch.slug = slugify(patch.name as string);

      const updated = await repo.teams.update(req.params.id, patch as any);
      if (!updated) return res.status(404).json({ error: "Team not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── DELETE /api/teams/:id ─────────────────────────────────────────────────
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.teams.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/teams/:id/roster ─────────────────────────────────────────────
  router.get("/:id/roster", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const team = await repo.teams.getById(req.params.id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const roster = await repo.teams.getRoster(req.params.id);
      res.json(roster);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/teams/:id/roster ────────────────────────────────────────────
  router.post("/:id/roster", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const { playerId, jerseyNumber, status } = req.body;
      if (!playerId) return res.status(400).json({ error: "playerId is required" });

      const entry = await repo.teams.addToRoster({
        teamId: req.params.id,
        playerId,
        jerseyNumber: jerseyNumber ?? null,
        status: status ?? "active",
      });
      res.status(201).json(entry);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── DELETE /api/teams/:id/roster/:playerId ────────────────────────────────
  router.delete("/:id/roster/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      await repo.teams.removeFromRoster(req.params.id, req.params.playerId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
