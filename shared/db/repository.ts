// shared/db/repository.ts
// Tenant-scoped repository facade. Every query goes through here so we can
//   1. enforce org_id scoping in code (belt + suspenders to PG RLS in PR 6),
//   2. centralize soft-delete handling (deleted_at is null filters),
//   3. give the API a stable surface that hides Drizzle details.
//
// Usage:
//   const repo = createRepository({ orgId, userId });
//   const sessions = await repo.filmSessions.list({ limit: 20 });

import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, type Db } from "./client";
import {
  analysisJobs,
  annotations,
  assignments,
  eventAttendance,
  eventAvailability,
  events,
  filmAssets,
  filmSessions,
  messageThreads,
  messages,
  orgMembers,
  players,
  practicePlans,
  readinessCheckins,
  wearableConnections,
  wearableMetrics,
  wearableSharing,
  playerNotes,
  skillAssessments,
  injuryRecords,
  readinessOverrides,
  idpFocusAreas,
  idpMilestones,
  idpDrillLinks,
  idpComments,
  coachingActions,
  playerGuardians,
  announcements,
  waiverTemplates,
  waiverSignatures,
  seasons,
  teams,
  teamRoster,
  membershipPlans,
  registrations,
  invoices,
  invoiceItems,
  payments,
  paymentPlans,
  type NewSeason,
  type NewTeam,
  type NewTeamRoster,
  type NewMembershipPlan,
  type NewRegistration,
  type NewInvoice,
  type NewInvoiceItem,
  type NewPayment,
  type NewPaymentPlan,
  type NewReadinessOverride,
  type NewAnnouncement,
  type NewWaiverSignature,
  type NewAnalysisJob,
  type NewAnnotation,
  type NewAssignment,
  type NewEvent,
  type NewEventAttendance,
  type NewEventAvailability,
  type NewFilmAsset,
  type NewFilmSession,
  type NewMessage,
  type NewMessageThread,
  type NewPracticePlan,
  type NewPlayer,
  type NewReadinessCheckin,
  type NewWearableConnection,
  type NewWearableMetric,
  type NewWearableSharing,
  type NewPlayerNote,
  type NewSkillAssessment,
  type NewInjuryRecord,
  type NewIdpFocusArea,
  type NewIdpMilestone,
  type NewIdpDrillLink,
  type NewIdpComment,
  type NewCoachingAction,
} from "./schema";

export interface RepoContext {
  orgId: string;
  userId: string;
  db?: Db;
}

export function createRepository(ctx: RepoContext) {
  const db = ctx.db ?? getDb();

  return {
    orgMembers: {
      async getMembership() {
        const rows = await db
          .select()
          .from(orgMembers)
          .where(
            and(
              eq(orgMembers.orgId, ctx.orgId),
              eq(orgMembers.userId, ctx.userId),
              isNull(orgMembers.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
    },

    filmSessions: {
      async list(opts: { limit?: number; offset?: number } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const offset = opts.offset ?? 0;
        return db
          .select()
          .from(filmSessions)
          .where(
            and(
              eq(filmSessions.orgId, ctx.orgId),
              isNull(filmSessions.deletedAt),
            ),
          )
          .orderBy(desc(filmSessions.createdAt))
          .limit(limit)
          .offset(offset);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(filmSessions)
          .where(
            and(
              eq(filmSessions.id, id),
              eq(filmSessions.orgId, ctx.orgId),
              isNull(filmSessions.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewFilmSession, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(filmSessions)
          .values({
            ...input,
            orgId: ctx.orgId,
            createdByUserId: ctx.userId,
          })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(filmSessions)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(filmSessions.id, id),
              eq(filmSessions.orgId, ctx.orgId),
            ),
          );
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof filmSessions.$inferInsert,
            | "title"
            | "description"
            | "kind"
            | "status"
            | "opponent"
            | "homeAway"
            | "playedAt"
            | "payload"
          >
        >,
      ) {
        await db
          .update(filmSessions)
          .set({ ...patch, updatedAt: new Date() })
          .where(
            and(eq(filmSessions.id, id), eq(filmSessions.orgId, ctx.orgId)),
          );
      },
    },

    filmAssets: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(filmAssets)
          .where(
            and(
              eq(filmAssets.sessionId, sessionId),
              eq(filmAssets.orgId, ctx.orgId),
              isNull(filmAssets.deletedAt),
            ),
          );
      },
      async create(input: Omit<NewFilmAsset, "orgId">) {
        const [row] = await db
          .insert(filmAssets)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(filmAssets)
          .where(
            and(
              eq(filmAssets.id, id),
              eq(filmAssets.orgId, ctx.orgId),
              isNull(filmAssets.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof filmAssets.$inferInsert,
            | "sessionId"
            | "status"
            | "mimeType"
            | "sizeBytes"
            | "payload"
          >
        >,
      ) {
        await db
          .update(filmAssets)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(filmAssets.id, id), eq(filmAssets.orgId, ctx.orgId)));
      },
    },

    analysisJobs: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(analysisJobs)
          .where(
            and(
              eq(analysisJobs.sessionId, sessionId),
              eq(analysisJobs.orgId, ctx.orgId),
              isNull(analysisJobs.deletedAt),
            ),
          )
          .orderBy(desc(analysisJobs.createdAt));
      },
      async enqueue(input: Omit<NewAnalysisJob, "orgId" | "status">) {
        const [row] = await db
          .insert(analysisJobs)
          .values({ ...input, orgId: ctx.orgId, status: "queued" })
          .returning();
        return row;
      },
    },

    annotations: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(annotations)
          .where(
            and(
              eq(annotations.sessionId, sessionId),
              eq(annotations.orgId, ctx.orgId),
              isNull(annotations.deletedAt),
            ),
          )
          .orderBy(annotations.startMs);
      },
      async create(input: Omit<NewAnnotation, "orgId">) {
        const [row] = await db
          .insert(annotations)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
    },

    players: {
      async list(opts: { limit?: number; offset?: number } = {}) {
        const limit = Math.min(opts.limit ?? 100, 500);
        const offset = opts.offset ?? 0;
        return db
          .select()
          .from(players)
          .where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt)))
          .orderBy(players.name)
          .limit(limit)
          .offset(offset);
      },
      async listActive() {
        return db
          .select()
          .from(players)
          .where(
            and(
              eq(players.orgId, ctx.orgId),
              eq(players.status, "active"),
              isNull(players.deletedAt),
            ),
          )
          .orderBy(players.name);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(players)
          .where(
            and(
              eq(players.id, id),
              eq(players.orgId, ctx.orgId),
              isNull(players.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewPlayer, "orgId">) {
        const [row] = await db
          .insert(players)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof players.$inferInsert,
            | "name"
            | "position"
            | "jerseyNumber"
            | "grade"
            | "status"
            | "role"
            | "height"
            | "weight"
            | "parentGuardianName"
            | "parentGuardianEmail"
            | "medicalNotes"
          >
        >,
      ) {
        await db
          .update(players)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(players.id, id), eq(players.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(players)
          .set({ deletedAt: new Date() })
          .where(and(eq(players.id, id), eq(players.orgId, ctx.orgId)));
      },
    },

    events: {
      async list(opts: { limit?: number; from?: Date } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const conditions = [
          eq(events.orgId, ctx.orgId),
          isNull(events.deletedAt),
        ];
        if (opts.from) {
          conditions.push(gte(events.startsAt, opts.from));
        }
        return db
          .select()
          .from(events)
          .where(and(...conditions))
          .orderBy(events.startsAt)
          .limit(limit);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(events)
          .where(
            and(
              eq(events.id, id),
              eq(events.orgId, ctx.orgId),
              isNull(events.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewEvent, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(events)
          .values({
            ...input,
            orgId: ctx.orgId,
            createdByUserId: ctx.userId,
          })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof events.$inferInsert,
            "title" | "status" | "startsAt" | "endsAt" | "location" | "notes"
          >
        >,
      ) {
        await db
          .update(events)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(events.id, id), eq(events.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(events)
          .set({ deletedAt: new Date() })
          .where(and(eq(events.id, id), eq(events.orgId, ctx.orgId)));
      },
      /** Upcoming events from now onwards (used by parent portal). */
      async listUpcoming(limit = 50) {
        return db
          .select()
          .from(events)
          .where(
            and(
              eq(events.orgId, ctx.orgId),
              isNull(events.deletedAt),
              gte(events.startsAt, new Date()),
            ),
          )
          .orderBy(events.startsAt)
          .limit(limit);
      },
      /** Attendance records for a specific player (used by parent portal). */
      async listAttendanceForPlayer(playerId: string, limit = 50) {
        return db
          .select({
            id: eventAttendance.id,
            eventId: eventAttendance.eventId,
            playerId: eventAttendance.playerId,
            status: eventAttendance.status,
            note: eventAttendance.note,
            recordedAt: eventAttendance.recordedAt,
            eventTitle: events.title,
            eventDate: events.startsAt,
          })
          .from(eventAttendance)
          .innerJoin(events, eq(eventAttendance.eventId, events.id))
          .where(
            and(
              eq(eventAttendance.orgId, ctx.orgId),
              eq(eventAttendance.playerId, playerId),
            ),
          )
          .orderBy(desc(events.startsAt))
          .limit(limit);
      },
      /** Upsert an availability/RSVP for a player (used by parent portal). */
      async upsertAvailability(input: {
        playerId: string;
        eventId: string;
        status: "available" | "unavailable" | "maybe";
        note?: string;
        respondedByUserId: string;
      }) {
        const [row] = await db
          .insert(eventAvailability)
          .values({
            eventId: input.eventId,
            playerId: input.playerId,
            orgId: ctx.orgId,
            response: input.status as any,
            note: input.note,
            respondedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [eventAvailability.eventId, eventAvailability.playerId],
            set: {
              response: input.status as any,
              note: input.note,
              respondedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
    },

    eventAvailability: {
      async listForEvent(eventId: string) {
        return db
          .select()
          .from(eventAvailability)
          .where(
            and(
              eq(eventAvailability.eventId, eventId),
              eq(eventAvailability.orgId, ctx.orgId),
            ),
          );
      },
      async upsert(input: Omit<NewEventAvailability, "orgId">) {
        const [row] = await db
          .insert(eventAvailability)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [eventAvailability.eventId, eventAvailability.playerId],
            set: {
              response: input.response,
              note: input.note,
              respondedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
    },

    eventAttendance: {
      async listForEvent(eventId: string) {
        return db
          .select()
          .from(eventAttendance)
          .where(
            and(
              eq(eventAttendance.eventId, eventId),
              eq(eventAttendance.orgId, ctx.orgId),
            ),
          );
      },
      async upsertBulk(
        eventId: string,
        records: Array<{
          playerId: string;
          status: "present" | "absent" | "late" | "excused";
          note?: string;
          recordedByUserId: string;
        }>,
      ) {
        if (records.length === 0) return [];
        const values = records.map((r) => ({
          eventId,
          playerId: r.playerId,
          orgId: ctx.orgId,
          status: r.status,
          note: r.note,
          recordedByUserId: r.recordedByUserId,
        }));
        return db
          .insert(eventAttendance)
          .values(values)
          .onConflictDoUpdate({
            target: [eventAttendance.eventId, eventAttendance.playerId],
            set: {
              status: sql`excluded.status`,
              note: sql`excluded.note`,
              recordedByUserId: sql`excluded.recorded_by_user_id`,
              recordedAt: new Date(),
            },
          })
          .returning();
      },
    },

    assignments: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(assignments)
          .where(
            and(
              eq(assignments.orgId, ctx.orgId),
              eq(assignments.playerId, playerId),
              isNull(assignments.deletedAt),
            ),
          )
          .orderBy(desc(assignments.createdAt));
      },
      async list(opts: { playerId?: string; status?: string } = {}) {
        const conditions = [
          eq(assignments.orgId, ctx.orgId),
          isNull(assignments.deletedAt),
        ];
        if (opts.playerId) {
          conditions.push(eq(assignments.playerId, opts.playerId));
        }
        if (opts.status) {
          conditions.push(
            eq(assignments.status, opts.status as "draft" | "submitted" | "overdue" | "in_progress" | "assigned" | "reviewed"),
          );
        }
        return db
          .select()
          .from(assignments)
          .where(and(...conditions))
          .orderBy(desc(assignments.createdAt));
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(assignments)
          .where(
            and(
              eq(assignments.id, id),
              eq(assignments.orgId, ctx.orgId),
              isNull(assignments.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewAssignment, "orgId">) {
        const [row] = await db
          .insert(assignments)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof assignments.$inferInsert,
            | "status"
            | "submittedAt"
            | "reviewedAt"
            | "reviewedByUserId"
            | "payload"
          >
        >,
      ) {
        await db
          .update(assignments)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(assignments.id, id), eq(assignments.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(assignments)
          .set({ deletedAt: new Date() })
          .where(and(eq(assignments.id, id), eq(assignments.orgId, ctx.orgId)));
      },
      async complianceByPlayer() {
        const rows = await db
          .select({
            playerId: assignments.playerId,
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where ${assignments.status} in ('submitted','reviewed'))::int`,
          })
          .from(assignments)
          .where(and(eq(assignments.orgId, ctx.orgId), isNull(assignments.deletedAt)))
          .groupBy(assignments.playerId);
        return rows.map((r) => ({
          playerId: r.playerId,
          total: r.total,
          completed: r.completed,
          rate: r.total > 0 ? r.completed / r.total : 0,
        }));
      },
    },

    practicePlans: {
      async list(opts: { limit?: number } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        return db
          .select()
          .from(practicePlans)
          .where(
            and(eq(practicePlans.orgId, ctx.orgId), isNull(practicePlans.deletedAt)),
          )
          .orderBy(desc(practicePlans.createdAt))
          .limit(limit);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(practicePlans)
          .where(
            and(
              eq(practicePlans.id, id),
              eq(practicePlans.orgId, ctx.orgId),
              isNull(practicePlans.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewPracticePlan, "orgId">) {
        const [row] = await db
          .insert(practicePlans)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof practicePlans.$inferInsert,
            | "title"
            | "status"
            | "payload"
            | "coachNotes"
            | "postPracticeNotes"
            | "scheduledAt"
          >
        >,
      ) {
        await db
          .update(practicePlans)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(practicePlans.id, id), eq(practicePlans.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(practicePlans)
          .set({ deletedAt: new Date() })
          .where(and(eq(practicePlans.id, id), eq(practicePlans.orgId, ctx.orgId)));
      },
    },

    readiness: {
      async listToday(date?: Date) {
        const d = date ?? new Date();
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return db
          .select()
          .from(readinessCheckins)
          .where(
            and(
              eq(readinessCheckins.orgId, ctx.orgId),
              gte(readinessCheckins.checkedInAt, start),
              sql`${readinessCheckins.checkedInAt} <= ${end}`,
            ),
          )
          .orderBy(desc(readinessCheckins.checkedInAt));
      },
      async listForPlayer(playerId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        return db
          .select()
          .from(readinessCheckins)
          .where(
            and(
              eq(readinessCheckins.orgId, ctx.orgId),
              eq(readinessCheckins.playerId, playerId),
              gte(readinessCheckins.checkedInAt, since),
            ),
          )
          .orderBy(desc(readinessCheckins.checkedInAt));
      },
      async create(input: Omit<NewReadinessCheckin, "orgId">) {
        const [row] = await db
          .insert(readinessCheckins)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
    },

    messages: {
      async listThreads() {
        return db
          .select()
          .from(messageThreads)
          .where(
            and(eq(messageThreads.orgId, ctx.orgId), isNull(messageThreads.deletedAt)),
          )
          .orderBy(desc(messageThreads.createdAt));
      },
      async getThread(threadId: string) {
        const rows = await db
          .select()
          .from(messageThreads)
          .where(
            and(
              eq(messageThreads.id, threadId),
              eq(messageThreads.orgId, ctx.orgId),
              isNull(messageThreads.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async createThread(input: Omit<NewMessageThread, "orgId">) {
        const [row] = await db
          .insert(messageThreads)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async listMessages(threadId: string) {
        return db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.threadId, threadId),
              eq(messages.orgId, ctx.orgId),
              isNull(messages.deletedAt),
            ),
          )
          .orderBy(messages.sentAt);
      },
      async createMessage(input: Omit<NewMessage, "orgId">) {
        const [row] = await db
          .insert(messages)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
    },

    wearableConnections: {
      async list(opts: { playerId?: string } = {}) {
        const conditions = [
          eq(wearableConnections.orgId, ctx.orgId),
          isNull(wearableConnections.deletedAt),
        ];
        if (opts.playerId) {
          conditions.push(eq(wearableConnections.playerId, opts.playerId));
        }
        return db
          .select()
          .from(wearableConnections)
          .where(and(...conditions))
          .orderBy(desc(wearableConnections.createdAt));
      },
      async getByPlayer(playerId: string) {
        return db
          .select()
          .from(wearableConnections)
          .where(
            and(
              eq(wearableConnections.orgId, ctx.orgId),
              eq(wearableConnections.playerId, playerId),
              isNull(wearableConnections.deletedAt),
            ),
          )
          .orderBy(desc(wearableConnections.createdAt));
      },
      async upsertConnection(input: Omit<NewWearableConnection, "orgId">) {
        const [row] = await db
          .insert(wearableConnections)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [
              wearableConnections.orgId,
              wearableConnections.playerId,
              wearableConnections.provider,
            ],
            set: {
              status: input.status ?? "pending",
              providerUserId: input.providerUserId,
              accessToken: input.accessToken,
              refreshToken: input.refreshToken,
              tokenExpiresAt: input.tokenExpiresAt,
              updatedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "connected" | "disconnected" | "error" | "pending",
        extra?: { lastSyncedAt?: Date },
      ) {
        await db
          .update(wearableConnections)
          .set({
            status,
            ...(extra?.lastSyncedAt ? { lastSyncedAt: extra.lastSyncedAt } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(wearableConnections.id, id),
              eq(wearableConnections.orgId, ctx.orgId),
            ),
          );
      },
      async disconnect(id: string) {
        await db
          .update(wearableConnections)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(wearableConnections.id, id),
              eq(wearableConnections.orgId, ctx.orgId),
            ),
          );
      },
    },

    wearableMetrics: {
      async getLatest(playerId: string) {
        // Most recent row per provider — fetch last 7 days and let app dedupe by provider
        const since = new Date();
        since.setDate(since.getDate() - 7);
        return db
          .select()
          .from(wearableMetrics)
          .where(
            and(
              eq(wearableMetrics.orgId, ctx.orgId),
              eq(wearableMetrics.playerId, playerId),
              gte(wearableMetrics.recordedDate, since.toISOString().slice(0, 10)),
            ),
          )
          .orderBy(desc(wearableMetrics.recordedDate))
          .limit(20);
      },
      async getHistory(playerId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        return db
          .select()
          .from(wearableMetrics)
          .where(
            and(
              eq(wearableMetrics.orgId, ctx.orgId),
              eq(wearableMetrics.playerId, playerId),
              gte(wearableMetrics.recordedDate, since.toISOString().slice(0, 10)),
            ),
          )
          .orderBy(desc(wearableMetrics.recordedDate));
      },
      async upsert(input: Omit<NewWearableMetric, "orgId">) {
        const [row] = await db
          .insert(wearableMetrics)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [
              wearableMetrics.playerId,
              wearableMetrics.provider,
              wearableMetrics.recordedDate,
            ],
            set: {
              recoveryScore: input.recoveryScore,
              hrv: input.hrv,
              restingHr: input.restingHr,
              sleepScore: input.sleepScore,
              sleepDurationMins: input.sleepDurationMins,
              deepSleepMins: input.deepSleepMins,
              remSleepMins: input.remSleepMins,
              strainScore: input.strainScore,
              steps: input.steps,
              activeCalories: input.activeCalories,
              rawPayload: input.rawPayload,
            },
          })
          .returning();
        return row;
      },
    },

    wearableSharing: {
      async get(playerId: string) {
        const rows = await db
          .select()
          .from(wearableSharing)
          .where(
            and(
              eq(wearableSharing.orgId, ctx.orgId),
              eq(wearableSharing.playerId, playerId),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async upsert(
        playerId: string,
        settings: Partial<
          Pick<
            NewWearableSharing,
            | "shareRecovery"
            | "shareSleep"
            | "shareStrain"
            | "shareHeartRate"
            | "shareWithCoaches"
            | "shareWithTeam"
          >
        >,
      ) {
        const [row] = await db
          .insert(wearableSharing)
          .values({ playerId, orgId: ctx.orgId, ...settings })
          .onConflictDoUpdate({
            target: [wearableSharing.orgId, wearableSharing.playerId],
            set: { ...settings, updatedAt: new Date() },
          })
          .returning();
        return row;
      },
      async canCoachView(playerId: string): Promise<boolean> {
        const rows = await db
          .select({ shareWithCoaches: wearableSharing.shareWithCoaches })
          .from(wearableSharing)
          .where(
            and(
              eq(wearableSharing.orgId, ctx.orgId),
              eq(wearableSharing.playerId, playerId),
            ),
          )
          .limit(1);
        return rows[0]?.shareWithCoaches ?? false;
      },
    },

    playerNotes: {
      async listForPlayer(playerId: string, limit = 50) {
        return db
          .select()
          .from(playerNotes)
          .where(
            and(
              eq(playerNotes.orgId, ctx.orgId),
              eq(playerNotes.playerId, playerId),
              isNull(playerNotes.deletedAt),
            ),
          )
          .orderBy(desc(playerNotes.createdAt))
          .limit(Math.min(limit, 200));
      },
      async create(input: Omit<NewPlayerNote, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(playerNotes)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(playerNotes)
          .set({ deletedAt: new Date() })
          .where(and(eq(playerNotes.id, id), eq(playerNotes.orgId, ctx.orgId)));
      },
      async togglePin(id: string, isPinned: boolean) {
        await db
          .update(playerNotes)
          .set({ isPinned, updatedAt: new Date() })
          .where(and(eq(playerNotes.id, id), eq(playerNotes.orgId, ctx.orgId)));
      },
    },

    skillAssessments: {
      async listForPlayer(playerId: string, limit = 100) {
        return db
          .select()
          .from(skillAssessments)
          .where(
            and(
              eq(skillAssessments.orgId, ctx.orgId),
              eq(skillAssessments.playerId, playerId),
            ),
          )
          .orderBy(desc(skillAssessments.assessedAt))
          .limit(Math.min(limit, 500));
      },
      async create(input: Omit<NewSkillAssessment, "orgId" | "assessedByUserId">) {
        const [row] = await db
          .insert(skillAssessments)
          .values({ ...input, orgId: ctx.orgId, assessedByUserId: ctx.userId })
          .returning();
        return row;
      },
    },

    injuries: {
      async listActive() {
        return db
          .select()
          .from(injuryRecords)
          .where(
            and(
              eq(injuryRecords.orgId, ctx.orgId),
              isNull(injuryRecords.deletedAt),
            ),
          )
          .orderBy(desc(injuryRecords.injuredAt));
      },
    },

    injuryRecords: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(injuryRecords)
          .where(
            and(
              eq(injuryRecords.orgId, ctx.orgId),
              eq(injuryRecords.playerId, playerId),
              isNull(injuryRecords.deletedAt),
            ),
          )
          .orderBy(desc(injuryRecords.injuredAt));
      },
      async create(input: Omit<NewInjuryRecord, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(injuryRecords)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof injuryRecords.$inferInsert,
            "status" | "restrictions" | "expectedReturnAt" | "clearedAt" | "clearanceNotes"
          >
        >,
      ) {
        await db
          .update(injuryRecords)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(injuryRecords.id, id), eq(injuryRecords.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(injuryRecords)
          .set({ deletedAt: new Date() })
          .where(and(eq(injuryRecords.id, id), eq(injuryRecords.orgId, ctx.orgId)));
      },
    },

    idpFocusAreas: {
      async listForIdp(idpId: string) {
        return db
          .select()
          .from(idpFocusAreas)
          .where(
            and(
              eq(idpFocusAreas.idpId, idpId),
              eq(idpFocusAreas.orgId, ctx.orgId),
              isNull(idpFocusAreas.deletedAt),
            ),
          )
          .orderBy(idpFocusAreas.priority);
      },
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(idpFocusAreas)
          .where(
            and(
              eq(idpFocusAreas.playerId, playerId),
              eq(idpFocusAreas.orgId, ctx.orgId),
              isNull(idpFocusAreas.deletedAt),
            ),
          )
          .orderBy(idpFocusAreas.priority);
      },
      async create(input: Omit<NewIdpFocusArea, "orgId">) {
        const [row] = await db
          .insert(idpFocusAreas)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof idpFocusAreas.$inferInsert,
            | "priority"
            | "category"
            | "subSkill"
            | "emoji"
            | "currentScore"
            | "targetScore"
            | "deadline"
            | "status"
            | "coachNotes"
          >
        >,
      ) {
        await db
          .update(idpFocusAreas)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(idpFocusAreas.id, id), eq(idpFocusAreas.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(idpFocusAreas)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpFocusAreas.id, id), eq(idpFocusAreas.orgId, ctx.orgId)));
      },
    },

    idpMilestones: {
      async listForFocusArea(focusAreaId: string) {
        return db
          .select()
          .from(idpMilestones)
          .where(
            and(
              eq(idpMilestones.focusAreaId, focusAreaId),
              eq(idpMilestones.orgId, ctx.orgId),
            ),
          )
          .orderBy(idpMilestones.createdAt);
      },
      async create(input: Omit<NewIdpMilestone, "orgId">) {
        const [row] = await db
          .insert(idpMilestones)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async complete(id: string) {
        await db
          .update(idpMilestones)
          .set({ completedAt: new Date() })
          .where(and(eq(idpMilestones.id, id), eq(idpMilestones.orgId, ctx.orgId)));
      },
      async unComplete(id: string) {
        await db
          .update(idpMilestones)
          .set({ completedAt: null })
          .where(and(eq(idpMilestones.id, id), eq(idpMilestones.orgId, ctx.orgId)));
      },
    },

    idpDrillLinks: {
      async listForFocusArea(focusAreaId: string) {
        return db
          .select()
          .from(idpDrillLinks)
          .where(
            and(
              eq(idpDrillLinks.focusAreaId, focusAreaId),
              eq(idpDrillLinks.orgId, ctx.orgId),
              isNull(idpDrillLinks.deletedAt),
            ),
          )
          .orderBy(idpDrillLinks.createdAt);
      },
      async create(input: Omit<NewIdpDrillLink, "orgId">) {
        const [row] = await db
          .insert(idpDrillLinks)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(idpDrillLinks)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpDrillLinks.id, id), eq(idpDrillLinks.orgId, ctx.orgId)));
      },
    },

    idpComments: {
      async listForIdp(idpId: string) {
        return db
          .select()
          .from(idpComments)
          .where(
            and(
              eq(idpComments.idpId, idpId),
              eq(idpComments.orgId, ctx.orgId),
              isNull(idpComments.deletedAt),
            ),
          )
          .orderBy(desc(idpComments.createdAt));
      },
      async create(input: Omit<NewIdpComment, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(idpComments)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(idpComments)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpComments.id, id), eq(idpComments.orgId, ctx.orgId)));
      },
    },

    coachingActions: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(coachingActions)
          .where(and(eq(coachingActions.sessionId, sessionId), eq(coachingActions.orgId, ctx.orgId)))
          .orderBy(desc(coachingActions.createdAt));
      },
      async listForPlayer(playerId: string, limit = 50) {
        return db
          .select()
          .from(coachingActions)
          .where(and(eq(coachingActions.playerId, playerId), eq(coachingActions.orgId, ctx.orgId)))
          .orderBy(desc(coachingActions.createdAt))
          .limit(Math.min(limit, 200));
      },
      async listOpen() {
        return db
          .select()
          .from(coachingActions)
          .where(
            and(
              eq(coachingActions.orgId, ctx.orgId),
              eq(coachingActions.status, "open"),
            ),
          )
          .orderBy(desc(coachingActions.createdAt));
      },
      async create(input: Omit<NewCoachingAction, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(coachingActions)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "open" | "in_progress" | "resolved" | "dismissed",
        patch?: { assignmentId?: string; idpFocusAreaId?: string; followUpSessionId?: string; resolvedNote?: string },
      ) {
        await db
          .update(coachingActions)
          .set({
            status,
            updatedAt: new Date(),
            ...(status === "resolved" ? { resolvedAt: new Date() } : {}),
            ...patch,
          })
          .where(and(eq(coachingActions.id, id), eq(coachingActions.orgId, ctx.orgId)));
      },
    },

    readinessOverrides: {
      async listActive(orgId: string) {
        return db
          .select()
          .from(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, orgId),
              gte(readinessOverrides.expiresAt, new Date()),
            ),
          );
      },
      async upsert(input: Omit<NewReadinessOverride, "id" | "createdAt">) {
        const existing = await db
          .select()
          .from(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, input.orgId),
              eq(readinessOverrides.playerId, input.playerId),
            ),
          )
          .limit(1);
        if (existing[0]) {
          const [row] = await db
            .update(readinessOverrides)
            .set({ status: input.status, note: input.note, expiresAt: input.expiresAt, coachUserId: input.coachUserId })
            .where(eq(readinessOverrides.id, existing[0].id))
            .returning();
          return row;
        }
        const [row] = await db
          .insert(readinessOverrides)
          .values(input)
          .returning();
        return row;
      },
      async remove(orgId: string, playerId: string) {
        await db
          .delete(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, orgId),
              eq(readinessOverrides.playerId, playerId),
            ),
          );
      },
    },

    // ── Guardian / parent-child relationships ─────────────────────────────────

    guardians: {
      /** All guardian rows for a specific player (coach / admin view). */
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.playerId, playerId),
              isNull(playerGuardians.deletedAt),
            ),
          );
      },
      /** All players the authenticated guardian user can access. */
      async listPlayersForGuardian(guardianUserId: string) {
        return db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.guardianUserId, guardianUserId),
              isNull(playerGuardians.deletedAt),
            ),
          );
      },
      /** Single access-check: returns the row or null. */
      async findRelationship(guardianUserId: string, playerId: string) {
        const [row] = await db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.guardianUserId, guardianUserId),
              eq(playerGuardians.playerId, playerId),
              isNull(playerGuardians.deletedAt),
            ),
          )
          .limit(1);
        return row ?? null;
      },
      async linkUser(guardianId: string, guardianUserId: string) {
        await db
          .update(playerGuardians)
          .set({ guardianUserId })
          .where(
            and(
              eq(playerGuardians.id, guardianId),
              eq(playerGuardians.orgId, ctx.orgId),
            ),
          );
      },
    },

    // ── Announcements ─────────────────────────────────────────────────────────

    announcements: {
      /**
       * List announcements visible to a given org role.
       * audienceRoles IS NULL means "everyone"; otherwise the role must appear in the array.
       * This filter runs IN THE DATABASE — never send restricted rows to the client.
       */
      async listForRole(role: string) {
        return db
          .select()
          .from(announcements)
          .where(
            and(
              eq(announcements.orgId, ctx.orgId),
              isNull(announcements.deletedAt),
              sql`(${announcements.audienceRoles} IS NULL OR ${role} = ANY(${announcements.audienceRoles}))`,
            ),
          )
          .orderBy(desc(announcements.publishedAt));
      },
      async create(input: Omit<NewAnnouncement, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(announcements)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async pin(id: string, pinned: boolean) {
        await db
          .update(announcements)
          .set({ pinned, updatedAt: new Date() })
          .where(
            and(
              eq(announcements.id, id),
              eq(announcements.orgId, ctx.orgId),
            ),
          );
      },
      async softDelete(id: string) {
        await db
          .update(announcements)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(announcements.id, id),
              eq(announcements.orgId, ctx.orgId),
            ),
          );
      },
    },

    // ── Waivers ───────────────────────────────────────────────────────────────

    waivers: {
      async listTemplates() {
        return db
          .select()
          .from(waiverTemplates)
          .where(
            and(
              eq(waiverTemplates.orgId, ctx.orgId),
              isNull(waiverTemplates.deletedAt),
            ),
          );
      },
      async listSignaturesForPlayer(playerId: string) {
        return db
          .select()
          .from(waiverSignatures)
          .where(
            and(
              eq(waiverSignatures.orgId, ctx.orgId),
              eq(waiverSignatures.playerId, playerId),
            ),
          );
      },
      async signWaiver(input: Omit<NewWaiverSignature, "orgId">) {
        // Upsert: if already signed, refresh the timestamp & ip
        const [existing] = await db
          .select({ id: waiverSignatures.id })
          .from(waiverSignatures)
          .where(
            and(
              eq(waiverSignatures.orgId, ctx.orgId),
              eq(waiverSignatures.templateId, input.templateId),
              eq(waiverSignatures.playerId, input.playerId),
              eq(waiverSignatures.signedByUserId, ctx.userId),
            ),
          )
          .limit(1);

        if (existing) {
          const [row] = await db
            .update(waiverSignatures)
            .set({
              status: "signed",
              signedAt: new Date(),
              ipAddress: input.ipAddress,
              userAgent: input.userAgent,
              updatedAt: new Date(),
            })
            .where(eq(waiverSignatures.id, existing.id))
            .returning();
          return row;
        }

        const [row] = await db
          .insert(waiverSignatures)
          .values({ ...input, orgId: ctx.orgId, signedByUserId: ctx.userId })
          .returning();
        return row;
      },
    },

    // ── Seasons ──────────────────────────────────────────────────────────────

    seasons: {
      async list(opts: { includeArchived?: boolean } = {}) {
        const conditions = [
          eq(seasons.orgId, ctx.orgId),
          isNull(seasons.deletedAt),
        ];
        if (!opts.includeArchived) {
          // Exclude archived seasons by default
          conditions.push(sql`${seasons.status} != 'archived'`);
        }
        return db
          .select()
          .from(seasons)
          .where(and(...conditions))
          .orderBy(desc(seasons.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(seasons)
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId), isNull(seasons.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewSeason, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(seasons)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Pick<NewSeason, "name" | "slug" | "status" | "description" | "startsAt" | "endsAt" | "registrationOpensAt" | "registrationClosesAt" | "maxRoster">>) {
        const [row] = await db
          .update(seasons)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(seasons)
          .set({ deletedAt: new Date() })
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId)));
      },
    },

    // ── Teams ─────────────────────────────────────────────────────────────────

    teams: {
      async list(opts: { seasonId?: string; activeOnly?: boolean } = {}) {
        const conditions = [
          eq(teams.orgId, ctx.orgId),
          isNull(teams.deletedAt),
        ];
        if (opts.seasonId) conditions.push(eq(teams.seasonId, opts.seasonId));
        if (opts.activeOnly) conditions.push(eq(teams.isActive, true));
        return db.select().from(teams).where(and(...conditions)).orderBy(teams.name);
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId), isNull(teams.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewTeam, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(teams)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Omit<NewTeam, "orgId" | "createdByUserId" | "createdAt">>) {
        const [row] = await db
          .update(teams)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(teams)
          .set({ deletedAt: new Date() })
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId)));
      },
      // Roster management
      async getRoster(teamId: string) {
        return db
          .select()
          .from(teamRoster)
          .where(and(eq(teamRoster.teamId, teamId), eq(teamRoster.orgId, ctx.orgId), isNull(teamRoster.removedAt)));
      },
      async addToRoster(input: Omit<NewTeamRoster, "orgId" | "addedByUserId">) {
        const [row] = await db
          .insert(teamRoster)
          .values({ ...input, orgId: ctx.orgId, addedByUserId: ctx.userId })
          .onConflictDoUpdate({
            target: [teamRoster.teamId, teamRoster.playerId],
            set: { status: input.status ?? "active", removedAt: null, addedAt: new Date() },
          })
          .returning();
        return row;
      },
      async removeFromRoster(teamId: string, playerId: string) {
        await db
          .update(teamRoster)
          .set({ removedAt: new Date() })
          .where(and(eq(teamRoster.teamId, teamId), eq(teamRoster.playerId, playerId), eq(teamRoster.orgId, ctx.orgId)));
      },
    },

    // ── Membership Plans ──────────────────────────────────────────────────────

    membershipPlans: {
      async list(opts: { seasonId?: string; status?: string } = {}) {
        const conditions = [
          eq(membershipPlans.orgId, ctx.orgId),
          isNull(membershipPlans.deletedAt),
        ];
        if (opts.seasonId) conditions.push(eq(membershipPlans.seasonId, opts.seasonId));
        if (opts.status) conditions.push(sql`${membershipPlans.status} = ${opts.status}`);
        return db.select().from(membershipPlans).where(and(...conditions)).orderBy(membershipPlans.createdAt);
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(membershipPlans)
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId), isNull(membershipPlans.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewMembershipPlan, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(membershipPlans)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Omit<NewMembershipPlan, "orgId" | "createdByUserId" | "createdAt">>) {
        const [row] = await db
          .update(membershipPlans)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(membershipPlans)
          .set({ deletedAt: new Date() })
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId)));
      },
    },

    // ── Registrations ─────────────────────────────────────────────────────────

    registrations: {
      async list(opts: { seasonId?: string; status?: string; playerId?: string } = {}) {
        const conditions = [eq(registrations.orgId, ctx.orgId)];
        if (opts.seasonId) conditions.push(eq(registrations.seasonId, opts.seasonId));
        if (opts.status) conditions.push(sql`${registrations.status} = ${opts.status}`);
        if (opts.playerId) conditions.push(eq(registrations.playerId, opts.playerId));
        return db.select().from(registrations).where(and(...conditions)).orderBy(desc(registrations.submittedAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(registrations)
          .where(and(eq(registrations.id, id), eq(registrations.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewRegistration, "orgId" | "submittedByUserId">) {
        const [row] = await db
          .insert(registrations)
          .values({ ...input, orgId: ctx.orgId, submittedByUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "accepted" | "denied" | "waitlisted" | "cancelled" | "active" | "incomplete",
        opts: { adminNotes?: string; acceptedByUserId?: string } = {},
      ) {
        const patch: Record<string, unknown> = {
          status,
          updatedAt: new Date(),
          ...(opts.adminNotes ? { adminNotes: opts.adminNotes } : {}),
        };
        if (status === "accepted") {
          patch.acceptedAt = new Date();
          patch.acceptedByUserId = opts.acceptedByUserId ?? ctx.userId;
        }
        if (status === "cancelled") {
          patch.cancelledAt = new Date();
          patch.cancelledByUserId = ctx.userId;
        }
        const [row] = await db
          .update(registrations)
          .set(patch)
          .where(and(eq(registrations.id, id), eq(registrations.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Count by status for dashboard KPIs */
      async countByStatus(seasonId?: string) {
        const conditions = [eq(registrations.orgId, ctx.orgId)];
        if (seasonId) conditions.push(eq(registrations.seasonId, seasonId));
        return db
          .select({
            status: registrations.status,
            count: sql<number>`count(*)::int`,
          })
          .from(registrations)
          .where(and(...conditions))
          .groupBy(registrations.status);
      },
    },

    // ── Invoices ──────────────────────────────────────────────────────────────

    invoices: {
      async list(opts: { playerId?: string; status?: string; seasonId?: string; overdue?: boolean } = {}) {
        const conditions = [eq(invoices.orgId, ctx.orgId)];
        if (opts.playerId) conditions.push(eq(invoices.playerId, opts.playerId));
        if (opts.status) conditions.push(sql`${invoices.status} = ${opts.status}`);
        if (opts.seasonId) conditions.push(eq(invoices.seasonId, opts.seasonId));
        if (opts.overdue) {
          conditions.push(
            sql`${invoices.status} IN ('open','partial')`,
            lte(invoices.dueDate, new Date()),
          );
        }
        return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async getWithItems(id: string) {
        const invoice = await this.getById(id);
        if (!invoice) return null;
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, id))
          .orderBy(invoiceItems.sortOrder);
        return { ...invoice, items };
      },
      async create(input: Omit<NewInvoice, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(invoices)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async addItem(item: Omit<NewInvoiceItem, "orgId">) {
        const [row] = await db
          .insert(invoiceItems)
          .values({ ...item, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: typeof invoices.status._.data, paidAmount?: number) {
        const patch: Record<string, unknown> = { status, updatedAt: new Date() };
        if (paidAmount !== undefined) {
          patch.amountPaid = paidAmount;
          // Recalculate amount_due via returning and caller updates
        }
        if (status === "paid") patch.paidAt = new Date();
        const [row] = await db
          .update(invoices)
          .set(patch)
          .where(and(eq(invoices.id, id), eq(invoices.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Recalculate amountDue after a payment is applied */
      async applyPayment(invoiceId: string, paymentAmount: number) {
        const [row] = await db
          .update(invoices)
          .set({
            amountPaid: sql`amount_paid + ${paymentAmount}`,
            amountDue: sql`GREATEST(0, amount_due - ${paymentAmount})`,
            status: sql`CASE
              WHEN amount_paid + ${paymentAmount} >= total_amount THEN 'paid'::invoice_status
              WHEN amount_paid + ${paymentAmount} > 0 THEN 'partial'::invoice_status
              ELSE status
            END`,
            paidAt: sql`CASE WHEN amount_paid + ${paymentAmount} >= total_amount THEN now() ELSE paid_at END`,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Revenue summary for admin dashboard */
      async revenueSummary(seasonId?: string) {
        const conditions = [eq(invoices.orgId, ctx.orgId)];
        if (seasonId) conditions.push(eq(invoices.seasonId, seasonId));
        const [row] = await db
          .select({
            totalBilled: sql<number>`coalesce(sum(total_amount),0)::int`,
            totalCollected: sql<number>`coalesce(sum(amount_paid),0)::int`,
            totalOutstanding: sql<number>`coalesce(sum(amount_due),0)::int`,
            overdueCount: sql<number>`count(*) filter (where status = 'overdue')::int`,
            openCount: sql<number>`count(*) filter (where status IN ('open','partial'))::int`,
            paidCount: sql<number>`count(*) filter (where status = 'paid')::int`,
          })
          .from(invoices)
          .where(and(...conditions));
        return row;
      },
    },

    // ── Payments ──────────────────────────────────────────────────────────────

    payments: {
      async listForInvoice(invoiceId: string) {
        return db
          .select()
          .from(payments)
          .where(and(eq(payments.invoiceId, invoiceId), eq(payments.orgId, ctx.orgId)))
          .orderBy(desc(payments.createdAt));
      },
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(payments)
          .where(and(eq(payments.playerId, playerId), eq(payments.orgId, ctx.orgId)))
          .orderBy(desc(payments.createdAt));
      },
      async record(input: Omit<NewPayment, "orgId">) {
        const [row] = await db
          .insert(payments)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: "succeeded" | "failed" | "refunded" | "disputed", opts: { failureReason?: string } = {}) {
        const patch: Record<string, unknown> = { status, updatedAt: new Date() };
        if (status === "succeeded") patch.paidAt = new Date();
        if (status === "failed") {
          patch.failedAt = new Date();
          patch.failureReason = opts.failureReason;
        }
        const [row] = await db
          .update(payments)
          .set(patch)
          .where(and(eq(payments.id, id), eq(payments.orgId, ctx.orgId)))
          .returning();
        return row;
      },
    },

    // ── Payment Plans ─────────────────────────────────────────────────────────

    paymentPlans: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(paymentPlans)
          .where(and(eq(paymentPlans.playerId, playerId), eq(paymentPlans.orgId, ctx.orgId)))
          .orderBy(desc(paymentPlans.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(paymentPlans)
          .where(and(eq(paymentPlans.id, id), eq(paymentPlans.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewPaymentPlan, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(paymentPlans)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: "active" | "completed" | "defaulted" | "cancelled") {
        const [row] = await db
          .update(paymentPlans)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(paymentPlans.id, id), eq(paymentPlans.orgId, ctx.orgId)))
          .returning();
        return row;
      },
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
