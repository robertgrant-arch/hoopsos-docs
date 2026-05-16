import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const opponents = pgTable("opponents", {
  id:            text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:         text("org_id").notNull(),
  name:          text("name").notNull(),
  abbreviation:  text("abbreviation"),
  level:         text("level").notNull().default("varsity"), // varsity|jv|aau|academy|club
  conference:    text("conference"),
  division:      text("division"),
  coachName:     text("coach_name"),
  record:        jsonb("record"),              // { wins, losses }
  primaryColor:  text("primary_color"),        // OKLCH or hex for team chip
  // Denormalised link arrays (in production, use join tables)
  linkedEventIds:      jsonb("linked_event_ids"),       // string[]
  filmSessionIds:      jsonb("film_session_ids"),        // string[]
  notes:         text("notes"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
  deletedAt:     timestamp("deleted_at"),
});

export type Opponent    = typeof opponents.$inferSelect;
export type NewOpponent = typeof opponents.$inferInsert;
