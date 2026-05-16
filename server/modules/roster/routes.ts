import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository, getDb, schema } from "@shared/db";
import { and, desc, eq, isNull, asc } from "drizzle-orm";

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

  // ── Aggregate profile ────────────────────────────────────────────────────
  // Returns player + guardians + latest IDP + attendance stats +
  // recent assignments + 14-day readiness + active injuries + recent notes.

  router.get("/:id/profile", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const db   = getDb();
      const { players, playerGuardians, idps, eventAttendance, events,
              assignments, readinessCheckins, injuryRecords, playerNotes } = schema;

      const player = await repo.players.getById(req.params.id);
      if (!player) return res.status(404).json({ error: "Not found" });

      const [guardians, latestIdp, recentAttendance, recentAssignments,
             recentReadiness, activeInjuries, pinnedNotes] = await Promise.all([
        // Guardians
        db.select().from(playerGuardians)
          .where(and(eq(playerGuardians.orgId, ctx.orgId),
                     eq(playerGuardians.playerId, req.params.id),
                     isNull(playerGuardians.deletedAt)))
          .orderBy(desc(playerGuardians.isPrimary)),

        // Latest IDP
        db.select().from(idps)
          .where(and(eq(idps.orgId, ctx.orgId),
                     eq(idps.playerId, req.params.id),
                     isNull(idps.deletedAt)))
          .orderBy(desc(idps.createdAt))
          .limit(1),

        // Last 20 attendance records (joined with event for type/title)
        db.select({
            id: eventAttendance.id,
            status: eventAttendance.status,
            note: eventAttendance.note,
            recordedAt: eventAttendance.recordedAt,
            eventId: eventAttendance.eventId,
            eventTitle: events.title,
            eventType: events.type,
            eventStartsAt: events.startsAt,
          })
          .from(eventAttendance)
          .leftJoin(events, eq(eventAttendance.eventId, events.id))
          .where(and(eq(eventAttendance.orgId, ctx.orgId),
                     eq(eventAttendance.playerId, req.params.id)))
          .orderBy(desc(events.startsAt))
          .limit(20),

        // Recent assignments
        repo.assignments.list({ playerId: req.params.id }),

        // 14-day readiness
        repo.readiness.listForPlayer(req.params.id, 14),

        // Active / monitoring injuries
        db.select().from(injuryRecords)
          .where(and(eq(injuryRecords.orgId, ctx.orgId),
                     eq(injuryRecords.playerId, req.params.id),
                     isNull(injuryRecords.deletedAt)))
          .orderBy(desc(injuryRecords.injuredAt))
          .limit(10),

        // Recent notes
        repo.playerNotes.listForPlayer(req.params.id, 10),
      ]);

      // Attendance stats
      const present  = recentAttendance.filter(r => r.status === "present").length;
      const late     = recentAttendance.filter(r => r.status === "late").length;
      const absent   = recentAttendance.filter(r => r.status === "absent").length;
      const excused  = recentAttendance.filter(r => r.status === "excused").length;
      const total    = recentAttendance.length;
      const attendanceRate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : null;

      // Assignment compliance
      const reviewed   = recentAssignments.filter(a => a.status === "reviewed").length;
      const submitted  = recentAssignments.filter(a => a.status === "submitted").length;
      const overdue    = recentAssignments.filter(a => a.status === "overdue").length;
      const totalAssign = recentAssignments.length;
      const compliance = totalAssign > 0
        ? Math.round(((reviewed + submitted) / totalAssign) * 100) : null;

      res.json({
        player,
        guardians,
        latestIdp: latestIdp[0] ?? null,
        attendance: recentAttendance,
        attendanceStats: { present, late, absent, excused, total, attendanceRate },
        assignments: recentAssignments.slice(0, 10),
        assignmentStats: { reviewed, submitted, overdue, total: totalAssign, compliance },
        readiness: recentReadiness,
        injuries: activeInjuries,
        notes: pinnedNotes,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Notes ────────────────────────────────────────────────────────────────

  router.get("/:id/notes", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const notes = await repo.playerNotes.listForPlayer(req.params.id);
      res.json(notes);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/notes", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { body, noteType, isPinned } = req.body as {
        body: string;
        noteType?: string;
        isPinned?: boolean;
      };
      if (!body?.trim()) return res.status(400).json({ error: "body required" });
      const note = await repo.playerNotes.create({
        playerId: req.params.id,
        body,
        noteType: (noteType as any) ?? "coach",
        isPinned: isPinned ?? false,
      });
      res.status(201).json(note);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id/notes/:noteId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.playerNotes.softDelete(req.params.noteId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id/notes/:noteId/pin", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.playerNotes.togglePin(req.params.noteId, !!req.body.isPinned);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Skill assessments ────────────────────────────────────────────────────

  router.get("/:id/skill-assessments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const data = await repo.skillAssessments.listForPlayer(req.params.id);
      res.json(data);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/skill-assessments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, score, season, notes } = req.body as {
        category: string;
        subSkill: string;
        score: number;
        season?: string;
        notes?: string;
      };
      if (!category || !subSkill || score == null) {
        return res.status(400).json({ error: "category, subSkill, score required" });
      }
      if (score < 1 || score > 10) {
        return res.status(400).json({ error: "score must be 1–10" });
      }
      const row = await repo.skillAssessments.create({
        playerId: req.params.id,
        category,
        subSkill,
        score,
        season,
        notes,
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Injury records ───────────────────────────────────────────────────────

  router.get("/:id/injuries", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const data = await repo.injuryRecords.listForPlayer(req.params.id);
      res.json(data);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/injuries", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { description, bodyPart, status, restrictions, injuredAt, expectedReturnAt } = req.body as {
        description: string;
        bodyPart?: string;
        status?: "active" | "monitoring" | "cleared";
        restrictions?: string;
        injuredAt: string;
        expectedReturnAt?: string;
      };
      if (!description || !injuredAt) {
        return res.status(400).json({ error: "description and injuredAt required" });
      }
      const row = await repo.injuryRecords.create({
        playerId: req.params.id,
        description,
        bodyPart,
        status: status ?? "active",
        restrictions,
        injuredAt: new Date(injuredAt),
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : undefined,
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id/injuries/:injuryId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, restrictions, expectedReturnAt, clearedAt, clearanceNotes } = req.body as {
        status?: "active" | "monitoring" | "cleared";
        restrictions?: string;
        expectedReturnAt?: string;
        clearedAt?: string;
        clearanceNotes?: string;
      };
      await repo.injuryRecords.update(req.params.injuryId, {
        status,
        restrictions,
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : undefined,
        clearedAt: clearedAt ? new Date(clearedAt) : undefined,
        clearanceNotes,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── IDP (Individual Development Plans) ───────────────────────────────────
  // GET  /:id/idp          — active IDP with focus areas + milestones + drills + comments
  // POST /:id/idp          — create new IDP for the player
  // POST /:id/idp/generate — auto-generate focus areas from skill assessment gaps
  // POST /:id/idp/:idpId/focus-areas           — add focus area
  // PATCH /:id/idp/:idpId/focus-areas/:faId    — update focus area
  // DELETE /:id/idp/:idpId/focus-areas/:faId   — remove focus area
  // POST /:id/idp/:idpId/focus-areas/:faId/milestones          — add milestone
  // PATCH /:id/idp/:idpId/focus-areas/:faId/milestones/:mId    — complete/uncomplete
  // POST /:id/idp/:idpId/focus-areas/:faId/drills              — link drill
  // DELETE /:id/idp/:idpId/focus-areas/:faId/drills/:dlId      — unlink drill
  // POST /:id/idp/:idpId/comments              — add coach comment
  // DELETE /:id/idp/:idpId/comments/:cId       — delete comment

  router.get("/:id/idp", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db  = getDb();
      const { idps } = schema;

      // Fetch active IDP
      const idpRows = await db
        .select()
        .from(idps)
        .where(
          and(
            eq(idps.orgId, ctx.orgId),
            eq(idps.playerId, req.params.id),
            isNull(idps.deletedAt),
          ),
        )
        .orderBy(desc(idps.createdAt))
        .limit(1);

      const idp = idpRows[0] ?? null;
      if (!idp) return res.json({ idp: null, focusAreas: [], comments: [] });

      const repo = createRepository(ctx);
      const [focusAreas, comments] = await Promise.all([
        repo.idpFocusAreas.listForIdp(idp.id),
        repo.idpComments.listForIdp(idp.id),
      ]);

      // Hydrate focus areas with milestones and drill links in parallel
      const hydrated = await Promise.all(
        focusAreas.map(async (fa) => {
          const [milestones, drills] = await Promise.all([
            repo.idpMilestones.listForFocusArea(fa.id),
            repo.idpDrillLinks.listForFocusArea(fa.id),
          ]);
          return { ...fa, milestones, drills };
        }),
      );

      res.json({ idp, focusAreas: hydrated, comments });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/idp", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db  = getDb();
      const { idps } = schema;
      const { season } = req.body as { season?: string };

      const [row] = await db
        .insert(idps)
        .values({
          orgId: ctx.orgId,
          playerId: req.params.id,
          season: season ?? new Date().getFullYear() + "-" + String(new Date().getFullYear() + 1).slice(-2),
          coachId: ctx.userId,
          status: "active",
        })
        .returning();

      res.status(201).json(row);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Generate focus areas from skill assessment gaps
  router.post("/:id/idp/generate", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const db   = getDb();
      const { idps } = schema;
      const { idpId } = req.body as { idpId: string };

      if (!idpId) return res.status(400).json({ error: "idpId required" });

      // Fetch latest skill assessments, group by category, get lowest avg scores
      const assessments = await repo.skillAssessments.listForPlayer(req.params.id, 200);

      // Average score per category
      const byCategory: Record<string, { total: number; count: number; subSkills: Record<string, number[]> }> = {};
      for (const a of assessments) {
        if (!byCategory[a.category]) {
          byCategory[a.category] = { total: 0, count: 0, subSkills: {} };
        }
        byCategory[a.category].total += a.score;
        byCategory[a.category].count += 1;
        const existing = byCategory[a.category].subSkills[a.subSkill] ?? [];
        byCategory[a.category].subSkills[a.subSkill] = [...existing, a.score];
      }

      // Find worst sub-skills across all categories (lowest average)
      const subSkillScores: Array<{ category: string; subSkill: string; avg: number }> = [];
      for (const [category, data] of Object.entries(byCategory)) {
        for (const [subSkill, scores] of Object.entries(data.subSkills)) {
          const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
          subSkillScores.push({ category, subSkill, avg });
        }
      }
      subSkillScores.sort((a, b) => a.avg - b.avg);

      // Take top 3 weakest and create focus areas
      const top3 = subSkillScores.slice(0, 3);
      const created = [];
      for (let i = 0; i < top3.length; i++) {
        const item = top3[i];
        const fa = await repo.idpFocusAreas.create({
          idpId,
          playerId: req.params.id,
          priority: i + 1,
          category: item.category,
          subSkill: item.subSkill,
          currentScore: Math.round(item.avg),
          targetScore: Math.min(Math.round(item.avg) + 2, 10),
          status: "active",
        });
        created.push(fa);
      }

      res.status(201).json({ generated: created.length, focusAreas: created });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/idp/:idpId/focus-areas", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, priority, emoji, currentScore, targetScore, deadline, coachNotes } = req.body as {
        category: string;
        subSkill: string;
        priority?: number;
        emoji?: string;
        currentScore?: number;
        targetScore?: number;
        deadline?: string;
        coachNotes?: string;
      };
      if (!category || !subSkill) {
        return res.status(400).json({ error: "category and subSkill required" });
      }
      const fa = await repo.idpFocusAreas.create({
        idpId: req.params.idpId,
        playerId: req.params.id,
        category,
        subSkill,
        priority: priority ?? 1,
        emoji: emoji ?? "🏀",
        currentScore,
        targetScore,
        deadline,
        coachNotes,
        status: "active",
      });
      res.status(201).json(fa);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id/idp/:idpId/focus-areas/:faId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, priority, emoji, currentScore, targetScore, deadline, status, coachNotes } = req.body;
      await repo.idpFocusAreas.update(req.params.faId, {
        category, subSkill, priority, emoji, currentScore, targetScore, deadline, status, coachNotes,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id/idp/:idpId/focus-areas/:faId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpFocusAreas.softDelete(req.params.faId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/idp/:idpId/focus-areas/:faId/milestones", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { title, dueDate } = req.body as { title: string; dueDate?: string };
      if (!title?.trim()) return res.status(400).json({ error: "title required" });
      const m = await repo.idpMilestones.create({
        focusAreaId: req.params.faId,
        idpId: req.params.idpId,
        title,
        dueDate,
      });
      res.status(201).json(m);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/:id/idp/:idpId/focus-areas/:faId/milestones/:mId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { completed } = req.body as { completed: boolean };
      if (completed) {
        await repo.idpMilestones.complete(req.params.mId);
      } else {
        await repo.idpMilestones.unComplete(req.params.mId);
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/idp/:idpId/focus-areas/:faId/drills", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { drillId, drillTitle, reps, frequency } = req.body as {
        drillId?: string;
        drillTitle: string;
        reps?: string;
        frequency?: string;
      };
      if (!drillTitle?.trim()) return res.status(400).json({ error: "drillTitle required" });
      const dl = await repo.idpDrillLinks.create({
        focusAreaId: req.params.faId,
        idpId: req.params.idpId,
        drillId,
        drillTitle,
        reps,
        frequency,
      });
      res.status(201).json(dl);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id/idp/:idpId/focus-areas/:faId/drills/:dlId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpDrillLinks.softDelete(req.params.dlId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/:id/idp/:idpId/comments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { body, type, focusAreaId, linkedFilmSessionId } = req.body as {
        body: string;
        type?: "weekly_review" | "film_note" | "assessment" | "general";
        focusAreaId?: string;
        linkedFilmSessionId?: string;
      };
      if (!body?.trim()) return res.status(400).json({ error: "body required" });
      const comment = await repo.idpComments.create({
        idpId: req.params.idpId,
        body,
        type: type ?? "general",
        focusAreaId,
        linkedFilmSessionId,
      });
      res.status(201).json(comment);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/:id/idp/:idpId/comments/:cId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpComments.softDelete(req.params.cId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Attendance history ───────────────────────────────────────────────────

  router.get("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db  = getDb();
      const { eventAttendance, events } = schema;
      const limit = Math.min(Number(req.query.limit ?? 50), 200);

      const rows = await db
        .select({
          id: eventAttendance.id,
          status: eventAttendance.status,
          note: eventAttendance.note,
          recordedAt: eventAttendance.recordedAt,
          eventId: eventAttendance.eventId,
          eventTitle: events.title,
          eventType: events.type,
          eventStartsAt: events.startsAt,
          opponent: events.opponent,
        })
        .from(eventAttendance)
        .leftJoin(events, eq(eventAttendance.eventId, events.id))
        .where(
          and(
            eq(eventAttendance.orgId, ctx.orgId),
            eq(eventAttendance.playerId, req.params.id),
          ),
        )
        .orderBy(desc(events.startsAt))
        .limit(limit);

      res.json(rows);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
