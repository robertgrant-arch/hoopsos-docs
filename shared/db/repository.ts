// shared/db/repository.ts
// Tenant-scoped repository facade. Every query goes through here so we can
//   1. enforce org_id scoping in code (belt + suspenders to PG RLS in PR 6),
//   2. centralize soft-delete handling (deleted_at is null filters),
//   3. give the API a stable surface that hides Drizzle details.
//
// Usage:
//   const repo = createRepository({ orgId, userId });
//   const sessions = await repo.filmSessions.list({ limit: 20 });

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb, type Db } from "./client";
import {
  analysisJobs,
  annotations,
  filmAssets,
  filmSessions,
  type NewAnalysisJob,
  type NewAnnotation,
  type NewFilmAsset,
  type NewFilmSession,
} from "./schema";

export interface RepoContext {
  orgId: string;
  userId: string;
  db?: Db;
}

export function createRepository(ctx: RepoContext) {
  const db = ctx.db ?? getDb();
  const orgScope = (col: { name: string }) =>
    eq(sql.identifier(col.name), ctx.orgId);

  return {
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
  };
}

export type Repository = ReturnType<typeof createRepository>;
