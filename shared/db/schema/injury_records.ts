import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const injuryStatusEnum = pgEnum("injury_status", [
  "active",      // sidelined — no full participation
  "monitoring",  // sub-injury watch — can practice with modifications
  "cleared",     // return-to-play complete
]);

export const injuryRecords = pgTable("injury_records", {
  id:                text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:             text("org_id").notNull(),
  playerId:          text("player_id").notNull(),
  description:       text("description").notNull(),    // "Left ankle sprain — Grade 1"
  bodyPart:          text("body_part"),                // "Ankle" | "Knee" | "Shoulder" …
  status:            injuryStatusEnum("status").notNull().default("active"),
  restrictions:      text("restrictions"),             // "No jumping, limited contact"
  injuredAt:         timestamp("injured_at").notNull(),
  expectedReturnAt:  timestamp("expected_return_at"),
  clearedAt:         timestamp("cleared_at"),
  clearanceNotes:    text("clearance_notes"),
  createdByUserId:   text("created_by_user_id").notNull(),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
  updatedAt:         timestamp("updated_at").defaultNow().notNull(),
  deletedAt:         timestamp("deleted_at"),
});

export type InjuryRecord    = typeof injuryRecords.$inferSelect;
export type NewInjuryRecord = typeof injuryRecords.$inferInsert;
