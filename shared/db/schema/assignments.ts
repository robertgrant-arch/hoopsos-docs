import { pgEnum, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const assignmentStatusEnum = pgEnum("assignment_status", ["draft", "assigned", "in_progress", "submitted", "reviewed", "overdue"]);

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  dueAt: timestamp("due_at"),
  createdByUserId: text("created_by_user_id").notNull(),
  playerId: text("player_id"),
  filmClipId: text("film_clip_id"),           // annotation id from annotations table
  practicePlanId: text("practice_plan_id"),
  idpFocusAreaId: text("idp_focus_area_id"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: text("reviewed_by_user_id"),
  payload: jsonb("payload"),                  // { drills, reps, notes, submissionData }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
