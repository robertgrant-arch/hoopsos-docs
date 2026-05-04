// shared/db/schema/film_sessions.ts
// A film_session is the user-facing unit: "I uploaded a game on Friday."
// It owns 1..N film_assets and 0..N analysis_jobs.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { filmSessionKindEnum, filmSessionStatusEnum } from "./_enums";

export const filmSessions = pgTable(
  "film_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id").notNull(),

    title: text("title").notNull(),
    description: text("description"),
    kind: filmSessionKindEnum("kind").notNull().default("game"),
    status: filmSessionStatusEnum("status").notNull().default("draft"),

    // Optional context for game/scout sessions.
    opponent: text("opponent"),
    homeAway: text("home_away"), // "home" | "away" | "neutral"
    season: text("season"),
    playedAt: timestamp("played_at", { withTimezone: true }),

    // Cached duration of the primary asset, filled in by the transcode job.
    durationSeconds: integer("duration_seconds"),

    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    byOrg: index("film_sessions_org_idx").on(t.orgId),
    byOrgStatus: index("film_sessions_org_status_idx").on(t.orgId, t.status),
    byOrgPlayedAt: index("film_sessions_org_played_at_idx").on(
      t.orgId,
      t.playedAt,
    ),
  }),
);

export type FilmSession = typeof filmSessions.$inferSelect;
export type NewFilmSession = typeof filmSessions.$inferInsert;
