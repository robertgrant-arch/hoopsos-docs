import { pgEnum, pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const scoutReportStatusEnum = pgEnum("scout_report_status", [
  "draft",
  "final",
  "archived",
]);

export const scoutReports = pgTable("scout_reports", {
  id:              text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:           text("org_id").notNull(),
  opponentId:      text("opponent_id").notNull(),       // → opponents.id
  opponentName:    text("opponent_name").notNull(),
  gameDate:        text("game_date"),                    // ISO "YYYY-MM-DD"
  linkedEventId:   text("linked_event_id"),              // → events.id
  status:          scoutReportStatusEnum("status").notNull().default("draft"),

  // Game plan
  gamePlanSummary: text("game_plan_summary"),
  keysToWin:       jsonb("keys_to_win"),                 // string[]

  // Tendencies — JSONB arrays so no join tables needed for HS/AAU scale
  offenseTendencies: jsonb("offense_tendencies"),        // ScoutTendency[]
  defenseTendencies: jsonb("defense_tendencies"),        // ScoutTendency[]

  // Personnel
  keyPlayers:      jsonb("key_players"),                 // ScoutKeyPlayer[]
  matchupNotes:    jsonb("matchup_notes"),               // MatchupNote[]

  // Assignments
  assignments:     jsonb("assignments"),                 // ScoutAssignment[]

  // Linked content
  linkedClipIds:        jsonb("linked_clip_ids"),        // string[]
  linkedPracticePlanId: text("linked_practice_plan_id"),
  linkedPlayIds:        jsonb("linked_play_ids"),        // string[] — scout-team plays

  authorUserId:    text("author_user_id").notNull(),
  authorName:      text("author_name").notNull(),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
  deletedAt:       timestamp("deleted_at"),
});

export type ScoutReport    = typeof scoutReports.$inferSelect;
export type NewScoutReport = typeof scoutReports.$inferInsert;
