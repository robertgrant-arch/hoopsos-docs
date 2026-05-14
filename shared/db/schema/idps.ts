import { pgEnum, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const idpStatusEnum = pgEnum("idp_status", ["active", "paused", "completed", "archived"]);

export const idps = pgTable("idps", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  playerId: text("player_id").notNull(),
  season: text("season").notNull(),           // "2024-25"
  status: idpStatusEnum("status").notNull().default("active"),
  coachId: text("coach_id").notNull(),
  payload: jsonb("payload"),                  // focus areas, goals, training load, milestones
  aiRecommendations: jsonb("ai_recommendations").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Idp = typeof idps.$inferSelect;
export type NewIdp = typeof idps.$inferInsert;
