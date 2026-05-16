import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Point-in-time skill scores recorded by a coach during an assessment session.
 * Multiple rows per player/subSkill build a historical trend line.
 */
export const skillAssessments = pgTable("skill_assessments", {
  id:                 text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:              text("org_id").notNull(),
  playerId:           text("player_id").notNull(),
  assessedByUserId:   text("assessed_by_user_id").notNull(),
  season:             text("season"),               // "2024-25"
  category:           text("category").notNull(),   // "Shooting" | "Ball Handling" | etc.
  subSkill:           text("sub_skill").notNull(),  // "Catch & Shoot" | etc.
  score:              integer("score").notNull(),    // 1–10
  notes:              text("notes"),
  assessedAt:         timestamp("assessed_at").defaultNow().notNull(),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
});

export type SkillAssessment    = typeof skillAssessments.$inferSelect;
export type NewSkillAssessment = typeof skillAssessments.$inferInsert;
