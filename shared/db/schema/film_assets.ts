// shared/db/schema/film_assets.ts
// Storage-side artifacts for a film_session: source upload, transcoded
// renditions, thumbnails, sprites, captions. PR 2 wires this up to S3 + Mux.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { filmSessions } from "./film_sessions";
import { filmAssetKindEnum, filmAssetStatusEnum } from "./_enums";

export const filmAssets = pgTable(
  "film_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => filmSessions.id, { onDelete: "cascade" }),

    kind: filmAssetKindEnum("kind").notNull(),
    status: filmAssetStatusEnum("status").notNull().default("pending"),

    // Provider-agnostic storage pointers. For S3 we set storageProvider="s3"
    // and storageKey to the object key. For Mux we store the asset id in
    // providerId and the playback id in playbackId.
    storageProvider: text("storage_provider"), // "s3" | "mux" | "r2"
    storageBucket: text("storage_bucket"),
    storageKey: text("storage_key"),
    providerId: text("provider_id"),
    playbackId: text("playback_id"),

    // Media metadata (filled in once known).
    mimeType: text("mime_type"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    durationSeconds: integer("duration_seconds"),
    width: integer("width"),
    height: integer("height"),
    checksumSha256: text("checksum_sha256"),

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
    bySession: index("film_assets_session_idx").on(t.sessionId),
    bySessionKind: index("film_assets_session_kind_idx").on(
      t.sessionId,
      t.kind,
    ),
    byOrgStatus: index("film_assets_org_status_idx").on(t.orgId, t.status),
  }),
);

export type FilmAsset = typeof filmAssets.$inferSelect;
export type NewFilmAsset = typeof filmAssets.$inferInsert;
