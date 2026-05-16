import { pgEnum, pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ── Focus area status ────────────────────────────────────────────────────────
export const idpFocusAreaStatusEnum = pgEnum("idp_focus_area_status", [
  "draft",
  "active",
  "completed",
  "paused",
]);

// ── IDP comment type ─────────────────────────────────────────────────────────
export const idpCommentTypeEnum = pgEnum("idp_comment_type", [
  "weekly_review",
  "film_note",
  "assessment",
  "general",
]);

// ── Focus areas ──────────────────────────────────────────────────────────────
// One row per skill area within an IDP. Replaces the JSONB focus-areas array
// in idps.payload so milestones and drill links can be proper FK relations.
export const idpFocusAreas = pgTable("idp_focus_areas", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  idpId: text("idp_id").notNull(),           // FK → idps.id
  playerId: text("player_id").notNull(),
  priority: integer("priority").notNull().default(1),   // 1 = highest
  category: text("category").notNull(),                 // "Shooting", "Finishing" …
  subSkill: text("sub_skill").notNull(),                // "Contact Layup"
  emoji: text("emoji").default("🏀"),
  currentScore: integer("current_score"),               // 1-10 snapshot at creation
  targetScore: integer("target_score"),                 // 1-10 goal
  deadline: text("deadline"),                           // ISO date string "2025-06-15"
  status: idpFocusAreaStatusEnum("status").notNull().default("active"),
  coachNotes: text("coach_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type IdpFocusArea = typeof idpFocusAreas.$inferSelect;
export type NewIdpFocusArea = typeof idpFocusAreas.$inferInsert;

// ── Milestones ───────────────────────────────────────────────────────────────
export const idpMilestones = pgTable("idp_milestones", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  focusAreaId: text("focus_area_id").notNull(),         // FK → idp_focus_areas.id
  idpId: text("idp_id").notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date"),                            // ISO date string
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type IdpMilestone = typeof idpMilestones.$inferSelect;
export type NewIdpMilestone = typeof idpMilestones.$inferInsert;

// ── Drill links ──────────────────────────────────────────────────────────────
// Connects a focus area to a drill from the drill library. drillId is a soft
// reference to the library (no FK enforcement — library is client-side mock for now).
export const idpDrillLinks = pgTable("idp_drill_links", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  focusAreaId: text("focus_area_id").notNull(),
  idpId: text("idp_id").notNull(),
  drillId: text("drill_id"),                            // ref to drill library id (nullable = custom)
  drillTitle: text("drill_title").notNull(),
  reps: text("reps"),                                   // "5 sets of 10", "50 reps each side"
  frequency: text("frequency"),                         // "daily", "3x per week"
  isDueToday: boolean("is_due_today").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type IdpDrillLink = typeof idpDrillLinks.$inferSelect;
export type NewIdpDrillLink = typeof idpDrillLinks.$inferInsert;

// ── Comments ─────────────────────────────────────────────────────────────────
// Coach comments on a focus area or the IDP overall. Film-note type carries
// optional links to film sessions/annotations.
export const idpComments = pgTable("idp_comments", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  idpId: text("idp_id").notNull(),
  focusAreaId: text("focus_area_id"),                   // null = IDP-level comment
  authorUserId: text("author_user_id").notNull(),
  type: idpCommentTypeEnum("type").notNull().default("general"),
  body: text("body").notNull(),
  linkedFilmSessionId: text("linked_film_session_id"),
  linkedAnnotationId: text("linked_annotation_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type IdpComment = typeof idpComments.$inferSelect;
export type NewIdpComment = typeof idpComments.$inferInsert;
