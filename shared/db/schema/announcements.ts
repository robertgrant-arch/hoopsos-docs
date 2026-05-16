import { pgEnum, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const announcementPriorityEnum = pgEnum("announcement_priority", [
  "normal", "urgent", "info",
]);

export const announcements = pgTable("announcements", {
  id:          text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:       text("org_id").notNull(),
  teamId:      text("team_id"),
  title:       text("title").notNull(),
  body:        text("body").notNull(),
  priority:    announcementPriorityEnum("priority").notNull().default("normal"),
  pinned:      boolean("pinned").notNull().default(false),
  tags:        text("tags").array().notNull().default([]),
  // Audience scoping: null = entire org; array of role strings narrows
  audienceRoles: text("audience_roles").array(),
  authorUserId: text("author_user_id").notNull(),
  authorName:   text("author_name").notNull(),
  publishedAt:  timestamp("published_at").defaultNow().notNull(),
  expiresAt:    timestamp("expires_at"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
  deletedAt:    timestamp("deleted_at"),
});

export type Announcement    = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
