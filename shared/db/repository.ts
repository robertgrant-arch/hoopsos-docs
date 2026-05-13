// shared/db/repository.ts
// Tenant-scoped repository facade. Every query goes through here so we can
//   1. enforce org_id scoping in code (belt + suspenders to PG RLS in PR 6),
//   2. centralize soft-delete handling (deleted_at is null filters),
//   3. give the API a stable surface that hides Drizzle details.
//
// Usage:
//   const repo = createRepository({ orgId, userId });
//   const sessions = await repo.filmSessions.list({ limit: 20 });

import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
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
  };
}

export type Repository = ReturnType<typeof createRepository>;
