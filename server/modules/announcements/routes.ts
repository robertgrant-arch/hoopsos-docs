/**
 * /api/announcements — Org announcement endpoints.
 *
 * Security fix #4: audience filtering runs SERVER-SIDE.
 * The GET route accepts the caller's org role from their verified session and
 * applies the audienceRoles filter in the database query.  We never send rows
 * the caller is not entitled to see and then rely on the client to hide them.
 *
 * Role access:
 *   GET  /              — any authenticated org member (filtered by their role)
 *   POST /              — coach, owner, admin only
 *   PATCH /:id          — coach, owner, admin only
 *   DELETE /:id         — owner, admin only
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrg, requireOrgRole, ORG_ROLES } from "../../auth/tenant";

export function registerAnnouncementRoutes(router: Router) {

  // ── GET /api/announcements ───────────────────────────────────────────────
  // Returns announcements whose audienceRoles includes the caller's role,
  // OR where audienceRoles IS NULL (meaning "everyone in the org").
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);

      const items = await repo.announcements.listForRole(ctx.role);
      res.json(items);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/announcements ──────────────────────────────────────────────
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(
        req,
        ORG_ROLES.COACH,
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMIN,
      );
      const repo = createRepository(ctx);

      const {
        title, body, priority, pinned, tags,
        audienceRoles, teamId, expiresAt,
        authorName,
      } = req.body as {
        title: string;
        body: string;
        priority?: "normal" | "urgent" | "info";
        pinned?: boolean;
        tags?: string[];
        audienceRoles?: string[] | null;
        teamId?: string;
        expiresAt?: string;
        authorName: string;
      };

      if (!title || !body || !authorName) {
        return res.status(400).json({ error: "title, body, and authorName required" });
      }

      const announcement = await repo.announcements.create({
        title,
        body,
        priority: priority ?? "normal",
        pinned: pinned ?? false,
        tags: tags ?? [],
        audienceRoles: audienceRoles ?? null,
        teamId: teamId ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorName,
        publishedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      });
      res.status(201).json(announcement);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /api/announcements/:id/pin ────────────────────────────────────
  router.patch("/:id/pin", async (req, res) => {
    try {
      const ctx = await requireOrgRole(
        req,
        ORG_ROLES.COACH,
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMIN,
      );
      const repo = createRepository(ctx);
      const { pinned } = req.body as { pinned: boolean };
      await repo.announcements.pin(req.params.id, pinned ?? true);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── DELETE /api/announcements/:id ───────────────────────────────────────
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.announcements.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
