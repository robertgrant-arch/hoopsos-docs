import {
  pgEnum,
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const wearableProviderEnum = pgEnum("wearable_provider", [
  "apple_health",
  "whoop",
  "garmin",
  "oura",
]);

export const wearableConnectionStatusEnum = pgEnum("wearable_connection_status", [
  "connected",
  "disconnected",
  "error",
  "pending",
]);

// A player's linked device account for a wearable provider.
export const wearableConnections = pgTable("wearable_connections", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  playerId: text("player_id").notNull(),
  provider: wearableProviderEnum("provider").notNull(),
  status: wearableConnectionStatusEnum("status").notNull().default("pending"),
  providerUserId: text("provider_user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type WearableConnection = typeof wearableConnections.$inferSelect;
export type NewWearableConnection = typeof wearableConnections.$inferInsert;

// Daily snapshot — one row per player per date per provider.
export const wearableMetrics = pgTable(
  "wearable_metrics",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    orgId: text("org_id").notNull(),
    playerId: text("player_id").notNull(),
    connectionId: text("connection_id").notNull(),
    provider: text("provider").notNull(),
    recordedDate: date("recorded_date").notNull(),
    recoveryScore: integer("recovery_score"),         // 0-100 (WHOOP/Oura recovery)
    hrv: numeric("hrv"),                              // HRV in ms
    restingHr: integer("resting_hr"),                 // bpm
    sleepScore: integer("sleep_score"),               // 0-100
    sleepDurationMins: integer("sleep_duration_mins"),
    deepSleepMins: integer("deep_sleep_mins"),
    remSleepMins: integer("rem_sleep_mins"),
    strainScore: numeric("strain_score"),             // WHOOP strain 0-21, or normalized
    steps: integer("steps"),
    activeCalories: integer("active_calories"),
    rawPayload: jsonb("raw_payload"),                 // full provider response
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniquePerDay: unique("wearable_metrics_player_provider_date_key").on(
      t.playerId,
      t.provider,
      t.recordedDate,
    ),
  }),
);

export type WearableMetric = typeof wearableMetrics.$inferSelect;
export type NewWearableMetric = typeof wearableMetrics.$inferInsert;

// Player privacy settings — one row per player (upserted).
export const wearableSharing = pgTable(
  "wearable_sharing",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    orgId: text("org_id").notNull(),
    playerId: text("player_id").notNull(),
    shareRecovery: boolean("share_recovery").notNull().default(false),
    shareSleep: boolean("share_sleep").notNull().default(false),
    shareStrain: boolean("share_strain").notNull().default(false),
    shareHeartRate: boolean("share_heart_rate").notNull().default(false),
    shareWithCoaches: boolean("share_with_coaches").notNull().default(false),
    shareWithTeam: boolean("share_with_team").notNull().default(false),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniquePerPlayer: unique("wearable_sharing_org_player_key").on(t.orgId, t.playerId),
  }),
);

export type WearableSharing = typeof wearableSharing.$inferSelect;
export type NewWearableSharing = typeof wearableSharing.$inferInsert;
