// shared/db/schema/seasons.ts
// Season and team tables: the organisational backbone of club operations.
// A season anchors registrations, invoices, and schedule segments.
// A team is a named group of players within an org (Varsity, JV, 10U, etc.).

import {
  pgTable, pgEnum, uuid, text, timestamp, boolean,
  integer, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

// ── Season status ─────────────────────────────────────────────────────────────

export const seasonStatusEnum = pgEnum("season_status", [
  "draft",       // being set up, not visible to families
  "open",        // registration is open
  "active",      // season is running
  "completed",   // season ended
  "archived",    // soft-hidden from UI
]);

// ── Seasons ───────────────────────────────────────────────────────────────────

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // "Fall 2025 AAU", "Spring 2026 Travel"
    slug: text("slug").notNull(),
    status: seasonStatusEnum("status").notNull().default("draft"),
    description: text("description"),

    // Date window the season covers (games / practices)
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    // Registration window (can differ from season dates)
    registrationOpensAt: timestamp("registration_opens_at", { withTimezone: true }),
    registrationClosesAt: timestamp("registration_closes_at", { withTimezone: true }),

    // Capacity cap (null = unlimited)
    maxRoster: integer("max_roster"),

    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    byOrg: index("seasons_org_idx").on(t.orgId),
    orgSlugUnique: uniqueIndex("seasons_org_slug_unique").on(t.orgId, t.slug),
  }),
);

// ── Teams ─────────────────────────────────────────────────────────────────────

export const teamAgeGroupEnum = pgEnum("team_age_group", [
  "u8", "u10", "u12", "u13", "u14", "u15", "u16", "u17",
  "u18", "varsity", "jv", "freshman", "adult", "other",
]);

export const teamGenderEnum = pgEnum("team_gender", [
  "boys", "girls", "co_ed", "open",
]);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .references(() => seasons.id, { onDelete: "set null" }),

    name: text("name").notNull(), // "Varsity Boys", "10U Tigers"
    slug: text("slug").notNull(),
    ageGroup: teamAgeGroupEnum("age_group").notNull().default("other"),
    gender: teamGenderEnum("gender").notNull().default("boys"),

    headCoachUserId: text("head_coach_user_id"),
    assistantCoachUserIds: text("assistant_coach_user_ids").array().notNull().default([]),

    colorPrimary: text("color_primary"),   // hex
    colorSecondary: text("color_secondary"),
    logoUrl: text("logo_url"),

    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    byOrg: index("teams_org_idx").on(t.orgId),
    bySeason: index("teams_season_idx").on(t.seasonId),
    orgSlugUnique: uniqueIndex("teams_org_slug_unique").on(t.orgId, t.slug),
  }),
);

// ── Team roster (player ↔ team membership) ───────────────────────────────────

export const teamRosterStatusEnum = pgEnum("team_roster_status", [
  "active", "inactive", "tryout", "suspended",
]);

export const teamRoster = pgTable(
  "team_roster",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").notNull(), // FK → players.id (no circular import)
    jerseyNumber: text("jersey_number"),
    status: teamRosterStatusEnum("status").notNull().default("active"),
    addedByUserId: text("added_by_user_id").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (t) => ({
    byTeam: index("team_roster_team_idx").on(t.teamId),
    byPlayer: index("team_roster_player_idx").on(t.playerId),
    teamPlayerUnique: uniqueIndex("team_roster_team_player_unique").on(t.teamId, t.playerId),
  }),
);

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamRoster = typeof teamRoster.$inferSelect;
export type NewTeamRoster = typeof teamRoster.$inferInsert;
