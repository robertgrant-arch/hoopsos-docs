import { pgEnum, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const waiverCategoryEnum = pgEnum("waiver_category", [
  "waiver", "consent", "medical", "media", "emergency",
]);

export const waiverStatusEnum = pgEnum("waiver_status", [
  "pending", "signed", "expired", "voided",
]);

// Template: what the org creates and manages
export const waiverTemplates = pgTable("waiver_templates", {
  id:          text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:       text("org_id").notNull(),
  title:       text("title").notNull(),
  description: text("description").notNull(),
  category:    waiverCategoryEnum("category").notNull(),
  bodyMarkdown: text("body_markdown").notNull().default(""),
  required:    boolean("required").notNull().default(true),
  expiresAfterDays: text("expires_after_days"), // e.g. "365" for annual
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
  deletedAt:   timestamp("deleted_at"),
});

// Instance: one signature record per player/guardian per template
export const waiverSignatures = pgTable("waiver_signatures", {
  id:           text("id").primaryKey().$defaultFn(() => nanoid()),
  templateId:   text("template_id").notNull(),
  orgId:        text("org_id").notNull(),
  signedByUserId: text("signed_by_user_id").notNull(), // parent or guardian
  playerId:     text("player_id").notNull(),
  status:       waiverStatusEnum("status").notNull().default("pending"),
  signedAt:     timestamp("signed_at"),
  expiresAt:    timestamp("expires_at"),
  ipAddress:    text("ip_address"),
  userAgent:    text("user_agent"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export type WaiverTemplate    = typeof waiverTemplates.$inferSelect;
export type NewWaiverTemplate = typeof waiverTemplates.$inferInsert;
export type WaiverSignature   = typeof waiverSignatures.$inferSelect;
export type NewWaiverSignature = typeof waiverSignatures.$inferInsert;
