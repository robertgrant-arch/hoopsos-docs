// shared/db/schema/analysis_jobs.ts
// Tracks Inngest-driven AI/vision pipeline runs against a film_session.
// Each job has its own status, retry counter, and a jsonb result blob.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { filmSessions } from "./film_sessions";
import { analysisJobKindEnum, analysisJobStatusEnum } from "./_enums";

export const analysisJobs = pgTable(
  "analysis_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => filmSessions.id, { onDelete: "cascade" }),

    kind: analysisJobKindEnum("kind").notNull(),
    status: analysisJobStatusEnum("status").notNull().default("queued"),

    // Inngest run id and event id, so we can deep-link from the dashboard.
    inngestRunId: text("inngest_run_id"),
    inngestEventId: text("inngest_event_id"),

    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),

    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),

    // Pipeline output (shot chart json, play breakdown, etc.).
    result: jsonb("result"),
    payload: jsonb("payload").notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    bySession: index("analysis_jobs_session_idx").on(t.sessionId),
    bySessionKind: index("analysis_jobs_session_kind_idx").on(
      t.sessionId,
      t.kind,
    ),
    byOrgStatus: index("analysis_jobs_org_status_idx").on(t.orgId, t.status),
  }),
);

export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type NewAnalysisJob = typeof analysisJobs.$inferInsert;
