import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const eventTypeEnum = pgEnum("event_type", ["practice", "game", "scrimmage", "film_session", "optional", "tournament", "team_meal"]);
export const eventStatusEnum = pgEnum("event_status", ["scheduled", "in_progress", "completed", "cancelled"]);
export const availabilityResponseEnum = pgEnum("availability_response", ["yes", "no", "maybe"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);

export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  type: eventTypeEnum("type").notNull().default("practice"),
  status: eventStatusEnum("status").notNull().default("scheduled"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  location: text("location"),
  homeAway: text("home_away"),                // "home" | "away" | "neutral"
  opponent: text("opponent"),
  notes: text("notes"),
  availabilityDeadline: timestamp("availability_deadline"),
  filmSessionId: text("film_session_id"),
  practicePlanId: text("practice_plan_id"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const eventAvailability = pgTable("event_availability", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  eventId: text("event_id").notNull(),
  playerId: text("player_id").notNull(),
  orgId: text("org_id").notNull(),
  response: availabilityResponseEnum("response").notNull(),
  note: text("note"),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
});

export const eventAttendance = pgTable("event_attendance", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  eventId: text("event_id").notNull(),
  playerId: text("player_id").notNull(),
  orgId: text("org_id").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  note: text("note"),
  recordedByUserId: text("recorded_by_user_id").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAvailability = typeof eventAvailability.$inferSelect;
export type NewEventAvailability = typeof eventAvailability.$inferInsert;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type NewEventAttendance = typeof eventAttendance.$inferInsert;
