import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const readinessOverrides = pgTable("readiness_overrides", {
  id:           text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:        text("org_id").notNull(),
  playerId:     text("player_id").notNull(),
  coachUserId:  text("coach_user_id").notNull(),
  status:       text("status").notNull(),  // "READY" | "FLAGGED" | "RESTRICTED"
  note:         text("note"),
  expiresAt:    timestamp("expires_at").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export type ReadinessOverride     = typeof readinessOverrides.$inferSelect;
export type NewReadinessOverride  = typeof readinessOverrides.$inferInsert;
