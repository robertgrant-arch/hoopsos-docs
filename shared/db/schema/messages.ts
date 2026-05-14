import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const threadTypeEnum = pgEnum("thread_type", ["broadcast", "dm", "parent_dm", "staff"]);

export const messageThreads = pgTable("message_threads", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  type: threadTypeEnum("type").notNull(),
  title: text("title"),
  participantIds: text("participant_ids").array().notNull().default([]),
  createdByUserId: text("created_by_user_id").notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  threadId: text("thread_id").notNull(),
  senderUserId: text("sender_user_id").notNull(),
  body: text("body").notNull(),
  readBy: text("read_by").array().notNull().default([]),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type MessageThread = typeof messageThreads.$inferSelect;
export type NewMessageThread = typeof messageThreads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
