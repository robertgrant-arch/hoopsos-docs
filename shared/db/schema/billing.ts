// shared/db/schema/billing.ts
// Club-level billing: invoices, line items, payments, and payment plans.
// Designed to work with or without Stripe — cash/check payments can be
// recorded manually by admins; Stripe payment intents integrate via
// stripePaymentIntentId / stripeInvoiceId fields.

import {
  pgTable, pgEnum, uuid, text, integer, boolean,
  timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { seasons } from "./seasons";
import { registrations } from "./memberships";

// ── Invoice status ────────────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",       // being built, not sent
  "open",        // sent to family; awaiting payment
  "paid",        // fully settled
  "partial",     // partially paid
  "overdue",     // past due date and unpaid
  "void",        // cancelled, no amount owed
  "refunded",    // payment reversed
  "write_off",   // admin wrote off the balance
]);

// ── Payment method ────────────────────────────────────────────────────────────

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe_card",
  "stripe_ach",
  "cash",
  "check",
  "zelle",
  "venmo",
  "paypal",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",    // initiated but not confirmed
  "succeeded",  // confirmed
  "failed",     // failed (card declined, etc.)
  "refunded",   // reversed
  "disputed",   // chargeback in progress
]);

// ── Invoices ──────────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .references(() => seasons.id, { onDelete: "set null" }),
    registrationId: uuid("registration_id")
      .references(() => registrations.id, { onDelete: "set null" }),

    // The player / family this invoice is for
    playerId: uuid("player_id").notNull(),
    guardianUserId: text("guardian_user_id"), // null if admin-generated

    // Human-readable invoice number: "INV-2025-0042"
    invoiceNumber: text("invoice_number").notNull(),

    status: invoiceStatusEnum("status").notNull().default("draft"),

    // All amounts in cents
    subtotal: integer("subtotal").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    amountDue: integer("amount_due").notNull().default(0), // totalAmount - amountPaid

    dueDate: timestamp("due_date", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    // Memo shown to families
    memo: text("memo"),
    // Internal admin notes
    adminNotes: text("admin_notes"),

    // Stripe integration
    stripeInvoiceId: text("stripe_invoice_id"),
    stripeCustomerId: text("stripe_customer_id"),

    // Is this invoice part of a payment plan?
    paymentPlanId: uuid("payment_plan_id"), // FK → paymentPlans.id (self-ref avoided)
    installmentNumber: integer("installment_number"), // 1 of 3, 2 of 3, etc.

    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byOrg: index("invoices_org_idx").on(t.orgId),
    byPlayer: index("invoices_player_idx").on(t.playerId),
    bySeason: index("invoices_season_idx").on(t.seasonId),
    byStatus: index("invoices_status_idx").on(t.status),
    byDueDate: index("invoices_due_date_idx").on(t.dueDate),
    byStripeInvoice: index("invoices_stripe_idx").on(t.stripeInvoiceId),
  }),
);

// ── Invoice Line Items ────────────────────────────────────────────────────────

export const invoiceItemTypeEnum = pgEnum("invoice_item_type", [
  "membership",     // season or monthly membership fee
  "registration",   // one-time registration/tryout fee
  "tournament",     // tournament entry fee
  "camp",           // camp or clinic fee
  "uniform",        // uniform / equipment
  "insurance",      // player insurance
  "late_fee",       // late payment fee
  "discount",       // negative: discount applied
  "credit",         // negative: credit/scholarship applied
  "other",
]);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),

    type: invoiceItemTypeEnum("type").notNull().default("membership"),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmount: integer("unit_amount").notNull(), // cents; negative for credits
    totalAmount: integer("total_amount").notNull(), // quantity * unitAmount

    // Link back to a plan or event if applicable
    membershipPlanId: uuid("membership_plan_id"),
    eventId: uuid("event_id"),

    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byInvoice: index("invoice_items_invoice_idx").on(t.invoiceId),
    byOrg: index("invoice_items_org_idx").on(t.orgId),
  }),
);

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    playerId: uuid("player_id").notNull(),
    guardianUserId: text("guardian_user_id"),

    amount: integer("amount").notNull(), // cents
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Stripe fields
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),

    // Manual payment tracking
    referenceNote: text("reference_note"), // e.g. "Check #1042", "Zelle conf: XYZ"
    recordedByUserId: text("recorded_by_user_id"), // who logged it (for manual)

    paidAt: timestamp("paid_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),

    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byOrg: index("payments_org_idx").on(t.orgId),
    byInvoice: index("payments_invoice_idx").on(t.invoiceId),
    byPlayer: index("payments_player_idx").on(t.playerId),
    byStripe: index("payments_stripe_pi_idx").on(t.stripePaymentIntentId),
  }),
);

// ── Payment Plans ─────────────────────────────────────────────────────────────
// A payment plan schedules how a total amount is split across installments.
// Each installment generates its own Invoice when it comes due.

export const paymentPlanStatusEnum = pgEnum("payment_plan_status", [
  "active",
  "completed",    // all installments paid
  "defaulted",    // missed payment(s)
  "cancelled",
]);

export const paymentPlans = pgTable(
  "payment_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .references(() => registrations.id, { onDelete: "set null" }),
    playerId: uuid("player_id").notNull(),

    totalAmount: integer("total_amount").notNull(), // cents; full amount
    installmentCount: integer("installment_count").notNull(),
    status: paymentPlanStatusEnum("status").notNull().default("active"),

    // First payment (deposit) may differ from equal installments
    depositAmount: integer("deposit_amount").notNull().default(0),

    // Schedule: array of {dueDate: ISO, amount: cents}
    schedule: jsonb("schedule").notNull().default([]),

    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byOrg: index("payment_plans_org_idx").on(t.orgId),
    byPlayer: index("payment_plans_player_idx").on(t.playerId),
    byRegistration: index("payment_plans_registration_idx").on(t.registrationId),
  }),
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type NewPaymentPlan = typeof paymentPlans.$inferInsert;
