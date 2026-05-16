import { pgEnum, pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const playerNoteTypeEnum = pgEnum("player_note_type", [
  "coach",
  "academic",
  "health",
  "behavioral",
  "recruiting",
  "general",
]);

export const playerNotes = pgTable("player_notes", {
  id:                text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:             text("org_id").notNull(),
  playerId:          text("player_id").notNull(),
  noteType:          playerNoteTypeEnum("note_type").notNull().default("coach"),
  body:              text("body").notNull(),
  isPinned:          boolean("is_pinned").notNull().default(false),
  createdByUserId:   text("created_by_user_id").notNull(),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
  updatedAt:         timestamp("updated_at").defaultNow().notNull(),
  deletedAt:         timestamp("deleted_at"),
});

export type PlayerNote    = typeof playerNotes.$inferSelect;
export type NewPlayerNote = typeof playerNotes.$inferInsert;
