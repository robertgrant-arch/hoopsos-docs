import { pgEnum, pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ── Action type ───────────────────────────────────────────────────────────────
// Every type maps to one user-visible button in the Film-to-Action bar.
export const coachingActionTypeEnum = pgEnum("coaching_action_type", [
  "assign_clip",        // Send clip to athlete as a film-review assignment
  "recommend_drill",    // Prescribe a drill derived from this clip
  "add_to_idp",         // Link insight to the player's IDP focus area
  "add_to_wod",         // Push drill directly into a scheduled WOD
  "request_reupload",   // Ask athlete to record and submit a new rep
  "mark_addressed",     // Close the loop — no follow-up needed
]);

// ── Action status ─────────────────────────────────────────────────────────────
export const coachingActionStatusEnum = pgEnum("coaching_action_status", [
  "open",        // Created, no athlete response yet
  "in_progress", // Assignment sent / request delivered
  "resolved",    // Follow-up reviewed and confirmed; loop closed
  "dismissed",   // Coach decided not to pursue
]);

// ── coaching_actions ──────────────────────────────────────────────────────────
// Central bridge table. One row per coaching action spawned from a film clip or
// AI observation. Connects a source annotation to downstream entities
// (assignments, IDP focus areas, follow-up sessions).
export const coachingActions = pgTable("coaching_actions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),

  // Source context ─────────────────────────────────────────────────────────────
  sessionId:    text("session_id").notNull(),    // film_sessions.id
  annotationId: text("annotation_id"),           // annotations.id — nullable for session-level actions
  playerId:     text("player_id"),               // target player (null = team action)
  authorUserId: text("author_user_id").notNull(),

  // Issue context (from AI observation or coach tag) ───────────────────────────
  issueCategory: text("issue_category"),         // "Balance", "Release", "Finishing" …
  issueSeverity: text("issue_severity"),         // "minor" | "major"
  timestampMs:   integer("timestamp_ms"),        // ms into the video
  coachNote:     text("coach_note"),             // coach's framing of the action

  // Action type and status ─────────────────────────────────────────────────────
  actionType: coachingActionTypeEnum("action_type").notNull(),
  status:     coachingActionStatusEnum("status").notNull().default("open"),

  // Downstream resolution references ───────────────────────────────────────────
  assignmentId:    text("assignment_id"),        // assignments.id if action spawned one
  idpFocusAreaId:  text("idp_focus_area_id"),   // idp_focus_areas.id if linked
  followUpSessionId: text("follow_up_session_id"), // film_sessions.id for re-upload evidence

  resolvedAt:   timestamp("resolved_at"),
  resolvedNote: text("resolved_note"),           // brief note on how/why resolved

  // AI resolution quality — computed by Inngest after analyzing follow-up session
  resolutionScore: jsonb("resolution_score"),    // { originalCount, followUpCount, improvement, autoResolved }

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CoachingAction    = typeof coachingActions.$inferSelect;
export type NewCoachingAction = typeof coachingActions.$inferInsert;
