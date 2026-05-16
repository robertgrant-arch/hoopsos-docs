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
  durationMins: integer("duration_mins"),           // planned duration
  actualDurationMins: integer("actual_duration_mins"), // filled post-practice
  payload: jsonb("payload"),                        // full plan blocks/drills (Zustand shape)
  coachNotes: text("coach_notes"),
  postPracticeNotes: text("post_practice_notes"),

  // Outcome-driven metadata (Prompt 8 phase 2 upgrade)
  objectives:       jsonb("objectives"),            // PracticeObjective[]
  targetGroup:      jsonb("target_group"),          // PracticeTargetGroup
  skillEmphasis:    jsonb("skill_emphasis"),        // Record<categoryId, weight 0–100>
  plannedIntensity: text("planned_intensity"),      // "RECOVERY"|"MODERATE"|"HIGH"|"MAX"
  opponentName:     text("opponent_name"),          // game-prep context
  linkedEventId:    text("linked_event_id"),        // events.id

  // Post-practice structured reflection
  reflection: jsonb("reflection"),                 // PracticeReflection (whatWorked, drillFeedback…)
  followUpActionIds: jsonb("follow_up_action_ids"), // string[] coaching_actions.id

  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type PracticePlan = typeof practicePlans.$inferSelect;
export type NewPracticePlan = typeof practicePlans.$inferInsert;
