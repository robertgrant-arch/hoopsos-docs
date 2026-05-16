/**
 * /api/admin — Admin dashboard aggregations.
 *
 * Owner and admin roles only. Returns operational KPIs:
 * - Registration pipeline summary
 * - Revenue / billing summary
 * - Attendance rates
 * - Outstanding forms/waivers
 * - Team overview
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrgRole, ORG_ROLES } from "../../auth/tenant";

export function registerAdminRoutes(router: Router) {

  // ── GET /api/admin/overview ───────────────────────────────────────────────
  // Single endpoint for the admin dashboard hero metrics
  router.get("/overview", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const seasonId = req.query.seasonId as string | undefined;

      // Fetch in parallel
      const [
        registrationCounts,
        revenueSummary,
        teams,
        waiverTemplates,
        players,
        recentRegistrations,
        overdueInvoices,
      ] = await Promise.all([
        repo.registrations.countByStatus(seasonId),
        repo.invoices.revenueSummary(seasonId),
        repo.teams.list({ seasonId, activeOnly: true }),
        repo.waivers.listTemplates(),
        repo.players.listActive(),
        repo.registrations.list({ seasonId, status: "pending" }),
        repo.invoices.list({ overdue: true, seasonId }),
      ]);

      // Roll up registration counts into a map
      const regMap: Record<string, number> = {};
      for (const r of registrationCounts) {
        regMap[r.status] = r.count;
      }

      const totalRegistered = Object.values(regMap).reduce((a, b) => a + b, 0);

      res.json({
        registrations: {
          total: totalRegistered,
          pending: regMap.pending ?? 0,
          active: regMap.active ?? 0,
          waitlisted: regMap.waitlisted ?? 0,
          accepted: regMap.accepted ?? 0,
        },
        billing: revenueSummary,
        teams: {
          count: teams.length,
          list: teams.map((t) => ({ id: t.id, name: t.name, ageGroup: t.ageGroup, gender: t.gender })),
        },
        roster: {
          totalPlayers: players.length,
        },
        waivers: {
          templateCount: waiverTemplates.length,
          requiredCount: waiverTemplates.filter((w) => w.required).length,
        },
        alerts: {
          pendingRegistrations: recentRegistrations.length,
          overdueInvoices: overdueInvoices.length,
          overdueAmount: overdueInvoices.reduce((s, i) => s + (i.amountDue ?? 0), 0),
        },
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/admin/attendance ─────────────────────────────────────────────
  // Attendance rate summary across all events in a date range
  router.get("/attendance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      // Get recent events (last 30 days)
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentEvents = await repo.events.list({ from, limit: 100 });

      // For each event, fetch attendance summary
      const summaries = await Promise.all(
        recentEvents.map(async (evt) => {
          const att = await repo.eventAttendance.listForEvent(evt.id);
          const present = att.filter((a) => a.status === "present" || a.status === "late").length;
          const total = att.length;
          return {
            eventId: evt.id,
            eventTitle: evt.title,
            eventType: evt.type,
            date: evt.startsAt,
            present,
            total,
            rate: total > 0 ? Math.round((present / total) * 100) : null,
          };
        })
      );

      const overallPresent = summaries.reduce((s, e) => s + e.present, 0);
      const overallTotal = summaries.reduce((s, e) => s + e.total, 0);

      res.json({
        overall: {
          present: overallPresent,
          total: overallTotal,
          rate: overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : null,
          eventCount: summaries.length,
        },
        events: summaries.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()),
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/admin/compliance ─────────────────────────────────────────────
  // Waiver/form completion status across the roster
  router.get("/compliance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const [players, templates] = await Promise.all([
        repo.players.listActive(),
        repo.waivers.listTemplates(),
      ]);

      const requiredTemplates = templates.filter((t) => t.required);

      if (requiredTemplates.length === 0 || players.length === 0) {
        return res.json({
          compliant: 0,
          incomplete: 0,
          total: players.length,
          requiredForms: requiredTemplates.length,
          players: [],
        });
      }

      // Check signatures for each player
      const playerStatuses = await Promise.all(
        players.map(async (p) => {
          const sigs = await repo.waivers.listSignaturesForPlayer(p.id);
          const signedTemplateIds = new Set(
            sigs.filter((s) => s.status === "signed").map((s) => s.templateId)
          );
          const missing = requiredTemplates.filter((t) => !signedTemplateIds.has(t.id));
          return {
            playerId: p.id,
            playerName: p.name,
            compliant: missing.length === 0,
            missingForms: missing.map((t) => t.title),
            missingCount: missing.length,
          };
        })
      );

      const compliant = playerStatuses.filter((p) => p.compliant).length;

      res.json({
        compliant,
        incomplete: players.length - compliant,
        total: players.length,
        requiredForms: requiredTemplates.length,
        players: playerStatuses,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/admin/billing/aging ──────────────────────────────────────────
  // Accounts receivable aging report
  router.get("/billing/aging", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);

      const openInvoices = await repo.invoices.list({ status: "open" });
      const partialInvoices = await repo.invoices.list({ status: "partial" });
      const allOpen = [...openInvoices, ...partialInvoices];

      const now = Date.now();

      const buckets = {
        current: { count: 0, amount: 0 },      // not yet overdue
        days1_30: { count: 0, amount: 0 },
        days31_60: { count: 0, amount: 0 },
        days61_90: { count: 0, amount: 0 },
        days90plus: { count: 0, amount: 0 },
      };

      for (const inv of allOpen) {
        const due = inv.dueDate ? new Date(inv.dueDate).getTime() : now;
        const daysPast = Math.max(0, Math.floor((now - due) / 86400000));
        const amount = inv.amountDue;

        if (daysPast === 0) buckets.current.count++, buckets.current.amount += amount;
        else if (daysPast <= 30) buckets.days1_30.count++, buckets.days1_30.amount += amount;
        else if (daysPast <= 60) buckets.days31_60.count++, buckets.days31_60.amount += amount;
        else if (daysPast <= 90) buckets.days61_90.count++, buckets.days61_90.amount += amount;
        else buckets.days90plus.count++, buckets.days90plus.amount += amount;
      }

      res.json({ buckets, total: allOpen.length, totalOutstanding: allOpen.reduce((s, i) => s + i.amountDue, 0) });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
