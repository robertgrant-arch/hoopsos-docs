// shared/db/schema/memberships.ts
// Membership plans, season packages, and player registrations.
// A MembershipPlan defines *what* families can register for and at what price.
// A Registration is a single player's enrollment in one plan/season.

import {
  pgTable, pgEnum, uuid, text, integer, boolean,
  timestamp, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { seasons, teams } from "./seasons";

// ── Plan type / billing cadence ───────────────────────────────────────────────

export const planTypeEnum = pgEnum("plan_type", [
  "season",      // one-time fee for the whole season
  "monthly",     // recurring monthly dues
  "annual",      // recurring annual membership
  "drop_in",     // per-session fee (camp, clinic, drop-in practice)
  "tournament",  // per-tournament fee
  "custom",      // admin-defined, no automatic billing
]);

export const planStatusEnum = pgEnum("plan_status", [
  "draft",       // not visible to families
  "active",      // visible and accepting registrations
  "archived",    // no new registrations
]);

// ── Membership Plans ──────────────────────────────────────────────────────────

export const membershipPlans = pgTable(
  "membership_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .references(() => seasons.id, { onDelete: "set null" }),

    name: text("name").notNull(),        // "Fall 2025 Varsity", "Monthly Academy Training"
    description: text("description"),
    type: planTypeEnum("type").notNull().default("season"),
    status: planStatusEnum("status").notNull().default("draft"),

    // Price in cents (USD)
    priceAmount: integer("price_amount").notNull(), // e.g. 45000 = $450.00
    // For monthly plans: how many billing cycles? null = indefinite
    billingCycles: integer("billing_cycles"),

    // Payment plan: allow installments?
    allowsPaymentPlan: boolean("allows_payment_plan").notNull().default(false),
    // Number of installments allowed (if allowsPaymentPlan)
    installmentCount: integer("installment_count"),
    // Down-payment required in cents (0 = no down-payment required)
    depositAmount: integer("deposit_amount").notNull().default(0),

    // Early-bird discount: amount in cents off before earlyBirdDeadline
    earlyBirdAmount: integer("early_bird_amount"),
    earlyBirdDeadline: timestamp("early_bird_deadline", { withTimezone: true }),

    // Sibling discount: flat amount per additional sibling
    siblingDiscountAmount: integer("sibling_discount_amount"),

    // Which teams are included (null = all teams)
    teamIds: uuid("team_ids").array(),

    // Additional per-player fees bundled in (uniform, insurance, etc.)
    includedFees: jsonb("included_fees").notNull().default([]),
    // e.g. [{ label: "Uniform", amount: 8500 }, { label: "Insurance", amount: 2500 }]

    maxEnrollment: integer("max_enrollment"), // cap per plan; null = unlimited

    // Stripe price ID (set when plan is pushed to Stripe)
    stripePriceId: text("stripe_price_id"),

    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    byOrg: index("membership_plans_org_idx").on(t.orgId),
    bySeason: index("membership_plans_season_idx").on(t.seasonId),
  }),
);

// ── Registration status ───────────────────────────────────────────────────────

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",    // submitted but not yet reviewed/accepted
  "waitlisted", // over capacity; on waitlist
  "accepted",   // approved by admin (manual review mode)
  "active",     // fully active: accepted + dues paid (or plan started)
  "cancelled",  // family cancelled
  "denied",     // admin denied
  "incomplete", // started but not finished (e.g., forms outstanding)
]);

// ── Registrations ─────────────────────────────────────────────────────────────

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .references(() => seasons.id, { onDelete: "set null" }),
    planId: uuid("plan_id")
      .references(() => membershipPlans.id, { onDelete: "set null" }),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "set null" }),

    // The player being registered
    playerId: uuid("player_id").notNull(), // FK → players.id

    // The guardian/user who submitted registration
    submittedByUserId: text("submitted_by_user_id").notNull(),

    status: registrationStatusEnum("status").notNull().default("pending"),

    // Snapshot of the effective price at registration time (cents)
    effectiveAmount: integer("effective_amount").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    // Reason for discount: "early_bird", "sibling", "scholarship", "admin_override"
    discountReason: text("discount_reason"),

    // Admin notes (internal)
    adminNotes: text("admin_notes"),

    // Timestamps
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: text("accepted_by_user_id"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledByUserId: text("cancelled_by_user_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byOrg: index("registrations_org_idx").on(t.orgId),
    bySeason: index("registrations_season_idx").on(t.seasonId),
    byPlayer: index("registrations_player_idx").on(t.playerId),
    byStatus: index("registrations_status_idx").on(t.status),
    // A player can only have one registration per plan
    playerPlanUnique: uniqueIndex("registrations_player_plan_unique").on(t.playerId, t.planId),
  }),
);

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
