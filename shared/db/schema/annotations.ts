// shared/db/schema/annotations.ts
// Time-anchored notes/tags/plays attached to a film_session, written by
// coaches, players, or AI jobs. Optionally points back to the analysis_job
// that produced it for traceability.

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
import { analysisJobs } from "./analysis_jobs";
import { annotationKindEnum, annotationSourceEnum } from "./_enums";

export const annotations = pgTable(
  "annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => filmSessions.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => analysisJobs.id, {
      onDelete: "set null",
    }),

    kind: annotationKindEnum("kind").notNull(),
    source: annotationSourceEnum("source").notNull().default("coach"),
    authorUserId: text("author_user_id"),

    // Time range on the master timeline, in milliseconds.
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms"),

    label: text("label"),
    body: text("body"),

    // Free-form structured data: shot coords, player ids, play tags, etc.
    data: jsonb("data").notNull().default({}),
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
    bySession: index("annotations_session_idx").on(t.sessionId),
    bySessionTime: index("annotations_session_time_idx").on(
      t.sessionId,
      t.startMs,
    ),
    bySessionKind: index("annotations_session_kind_idx").on(
      t.sessionId,
      t.kind,
    ),
  }),
);

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;
