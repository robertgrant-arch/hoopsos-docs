import { pgEnum, pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const practicePlanStatusEnum = pgEnum("practice_plan_status", ["draft", "published", "completed", "archived"]);

export const practicePlans = pgTable("practice_plans", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: practicePlanStatusEnum("status").notNull().default("draft"),
  location: text("location"),
  durationMins: integer("duration_mins"),
  payload: jsonb("payload"),                  // full plan blocks/drills shape from Zustand
  coachNotes: text("coach_notes"),
  postPracticeNotes: text("post_practice_notes"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type PracticePlan = typeof practicePlans.$inferSelect;
export type NewPracticePlan = typeof practicePlans.$inferInsert;
