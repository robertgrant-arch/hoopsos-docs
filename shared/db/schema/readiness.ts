import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const readinessCheckins = pgTable("readiness_checkins", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  playerId: text("player_id").notNull(),
  fatigue: integer("fatigue").notNull(),      // 1–10
  sleep: integer("sleep").notNull(),          // hours
  soreness: integer("soreness").notNull(),    // 1–10
  mood: integer("mood"),                      // 1–10, optional
  note: text("note"),
  flagged: boolean("flagged").notNull().default(false),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReadinessCheckin = typeof readinessCheckins.$inferSelect;
export type NewReadinessCheckin = typeof readinessCheckins.$inferInsert;
