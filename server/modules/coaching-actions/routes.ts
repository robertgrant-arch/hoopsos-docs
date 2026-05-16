import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";
import { inngest } from "../../inngest/client";

// ── Coaching Actions API ───────────────────────────────────────────────────────
//
// Every endpoint here closes one leg of the Film-to-Action loop:
//
//   POST /                          Create an action from a clip observation
//   GET  /player/:playerId          All actions for an athlete (profile timeline)
//   GET  /session/:sessionId        All actions for a film session
//   GET  /open                      All open actions (coach dashboard)
//   PATCH /:id/status               Transition status (in_progress → resolved etc.)
//   PATCH /:id/resolve              Convenience: mark resolved with optional note
//   PATCH /:id/dismiss              Convenience: dismiss without closing loop

export function registerCoachingActionRoutes(router: Router) {

  // Create a coaching action from a clip / observation
  router.post("/", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);

      const {
        sessionId, annotationId, playerId,
        issueCategory, issueSeverity, timestampMs, coachNote,
        actionType,
      } = req.body as {
        sessionId:     string;
        annotationId?: string;
        playerId?:     string;
        issueCategory?: string;
        issueSeverity?: string;
        timestampMs?:   number;
        coachNote?:     string;
        actionType:    "assign_clip" | "recommend_drill" | "add_to_idp" | "add_to_wod" | "request_reupload" | "mark_addressed";
      };

      if (!sessionId || !actionType) {
        return res.status(400).json({ error: "sessionId and actionType required" });
      }

      // mark_addressed resolves immediately — no downstream entity needed
      const action = await repo.coachingActions.create({
        sessionId,
        annotationId,
        playerId,
        issueCategory,
        issueSeverity,
        timestampMs,
        coachNote,
        actionType,
        status: actionType === "mark_addressed" ? "resolved" : "open",
        ...(actionType === "mark_addressed" ? { resolvedAt: new Date(), resolvedNote: "Marked addressed by coach" } : {}),
      });

      // Emit event so the notification function can alert the player
      await inngest.send({
        name: "coaching-action/created",
        data: {
          actionId: action.id,
          orgId: ctx.orgId,
          actionType,
          playerId: playerId ?? null,
          sessionId,
          coachNote,
          issueCategory,
          authorUserId: ctx.userId,
        },
      });

      res.status(201).json(action);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Get all actions for a player — used by the athlete profile timeline
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const limit = Math.min(Number(req.query.limit ?? 100), 200);
      const actions = await repo.coachingActions.listForPlayer(req.params.playerId, limit);
      res.json(actions);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Get all actions for a session — used by the film session detail side panel
  router.get("/session/:sessionId", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const actions = await repo.coachingActions.listForSession(req.params.sessionId);
      res.json(actions);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Get open actions for the current player (used by athlete re-upload flow)
  router.get("/player/me", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const { actionType, status } = req.query as { actionType?: string; status?: string };
      const all = await repo.coachingActions.listForPlayer(ctx.userId, 100);
      let filtered = all;
      if (actionType) filtered = filtered.filter((a: any) => a.actionType === actionType);
      if (status)     filtered = filtered.filter((a: any) => a.status === status);
      res.json(filtered);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // All open actions — coach dashboard / queue badge counts
  router.get("/open", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const actions = await repo.coachingActions.listOpen();
      res.json(actions);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Generic status transition
  router.patch("/:id/status", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, assignmentId, idpFocusAreaId, followUpSessionId, resolvedNote } = req.body as {
        status: "open" | "in_progress" | "resolved" | "dismissed";
        assignmentId?: string;
        idpFocusAreaId?: string;
        followUpSessionId?: string;
        resolvedNote?: string;
      };
      if (!status) return res.status(400).json({ error: "status required" });
      await repo.coachingActions.updateStatus(req.params.id, status, {
        assignmentId, idpFocusAreaId, followUpSessionId, resolvedNote,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Resolve — record evidence and close the loop
  router.patch("/:id/resolve", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      const { resolvedNote, followUpSessionId } = req.body as {
        resolvedNote?: string;
        followUpSessionId?: string;
      };
      await repo.coachingActions.updateStatus(req.params.id, "resolved", {
        resolvedNote, followUpSessionId,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Dismiss — coach decided not to pursue
  router.patch("/:id/dismiss", async (req, res) => {
    try {
      const ctx  = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.coachingActions.updateStatus(req.params.id, "dismissed");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
