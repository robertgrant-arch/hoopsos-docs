/**
 * Billing & Monetization — Type Model
 * --------------------------------------------------------------------------
 * Source: Prompt 16. Mirrors the Prisma schema 1:1 so swapping the in-memory
 * store for a real Postgres-backed Prisma client is a drop-in change.
 *
 * Naming + field shapes match Stripe's own object model so the in-memory
 * webhook simulator can replay real Stripe webhook payloads without
 * translation.
 */

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export type ProductTier =
  | "PLAYER_SOLO"
  | "PLAYER_COACH_LINKED" // 50%-off via COACH50
  | "COACH_PRO"
  | "TEAM_PRO"
  | "EXPERT_CONNECT" // marketplace seller account
  | "AI_CREDIT_PACK"
  | "EXPERT_REVIEW"
  | "MASTERCLASS_BUNDLE"
  | "LIVE_CLASS"
  | "COURSE_BUNDLE";

export type Cadence = "MONTHLY" | "ANNUAL" | "ONE_TIME" | "METERED";

export interface Product {
  id: string;
  stripeProductId: string;
  tier: ProductTier;
  name: string;
  description: string;
  /** Marketing bullet points used on the pricing page. */
  features: string[];
  /** Hex (or oklch()) color used for the pricing card accent. */
  accent: string;
}

export interface Price {
  id: string;
  stripePriceId: string;
  productId: string;
  cadence: Cadence;
  /** Cents (USD). For metered prices, this is the per-unit price. */
  amount: number;
  /** For TEAM_PRO seat overage: per-extra-seat price in cents. */
  perExtraUnitAmount?: number;
  /** Number of seats included in the base price (TEAM_PRO only). */
  includedSeats?: number;
  currency: "usd";
}

/* ------------------------------------------------------------------ */
/* Subscriptions / invoices                                            */
/* ------------------------------------------------------------------ */

export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAUSED";

export interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  customerId: string; // app user (player/coach/teamAdmin/expert)
  productId: string;
  priceId: string;
  /** ISO timestamps. */
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  status: SubscriptionStatus;
  /** Coupon code currently applied (e.g. "COACH50"). */
  couponCode?: string;
  /** Seats purchased on this subscription (TEAM_PRO only). */
  seatCount?: number;
  /** Past-due dunning state. */
  dunning?: {
    failedPaymentAt: string;
    graceUntil: string; // 7 days after failure
    attempts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  subscriptionId: string;
  /** App user id of the athlete occupying the seat. */
  occupantUserId?: string;
  /** When the seat was claimed. Null if vacant. */
  claimedAt?: string;
  status: "ASSIGNED" | "VACANT" | "PENDING_INVITE";
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  subscriptionId?: string;
  customerId: string;
  amountDue: number; // cents
  amountPaid: number;
  status: "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  /** Coupons applied at invoice generation. */
  appliedCoupons: string[];
  createdAt: string;
  paidAt?: string;
  /** For refunds. */
  refundedAmount?: number;
  refundedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Entitlements                                                        */
/* ------------------------------------------------------------------ */

export type EntitlementKind =
  | "PLAYER_PREMIUM"
  | "COACH_PRO"
  | "TEAM_PRO_SEAT"
  | "EXPERT_SELLER"
  | "AI_CREDITS"
  | "MASTERCLASS"
  | "COURSE";

export interface Entitlement {
  id: string;
  /** Owner of the entitlement. */
  userId: string;
  kind: EntitlementKind;
  /** Optional subscription that backs this entitlement. */
  subscriptionId?: string;
  /** For metered AI credits. */
  remainingUnits?: number;
  /** Optional grandfather period — entitlement valid until this date even
   * after the underlying subscription / link is removed. */
  grandfatheredUntil?: string;
  /** "active" while the underlying source is good, "grandfathered" while in
   * the grace tail, "revoked" once fully removed. */
  state: "active" | "grandfathered" | "revoked";
  createdAt: string;
  updatedAt: string;
}

/**
 * Tracks the "this player's coach has Coach Pro / their team has Team Pro"
 * relationship that grants the COACH50 50%-off coupon to the player's solo
 * subscription.
 *
 * One row per player ↔ source pair. The EntitlementService walks these rows
 * to decide whether a player qualifies for COACH50.
 */
export interface CoachLinkEntitlement {
  id: string;
  playerUserId: string;
  /** Source granting the link: a coach with Coach Pro, OR a team with Team Pro. */
  source:
    | { kind: "COACH_PRO"; coachUserId: string }
    | { kind: "TEAM_PRO"; teamId: string };
  status: "ACTIVE" | "GRANDFATHERED" | "REVOKED";
  /** When status transitioned to GRANDFATHERED. */
  grandfatherStartedAt?: string;
  /** End of grandfather window — usually equals subscription's
   * currentPeriodEnd. After this the player loses 50% off and the coupon is
   * removed at next renewal. */
  grandfatheredUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Webhooks / coupons / payouts                                        */
/* ------------------------------------------------------------------ */

/**
 * Idempotency table — never process the same Stripe event id twice.
 */
export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  type: string; // e.g. "invoice.paid"
  payload: unknown;
  processedAt: string;
  signatureVerified: boolean;
}

export interface Coupon {
  id: string;
  /** e.g. "COACH50" */
  code: string;
  stripeCouponId: string;
  percentOff: number;
  /** "forever" | "once" | "repeating" — mirrors Stripe's `duration`. */
  duration: "forever" | "once" | "repeating";
  durationInMonths?: number;
  /** Restrict which products the coupon may apply to. */
  applicableProductIds: string[];
}

/**
 * Stripe Connect express account for a marketplace expert.
 */
export interface PayoutAccount {
  id: string;
  expertUserId: string;
  stripeAccountId: string;
  status: "PENDING" | "ENABLED" | "RESTRICTED" | "REJECTED";
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** What Stripe needs from the expert before it'll release funds. */
  requirements: string[];
  /** Lifetime totals. */
  lifetimeGrossCents: number;
  lifetimePlatformFeeCents: number;
  lifetimeNetCents: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export type AuditAction =
  | "ENTITLEMENT_GRANTED"
  | "ENTITLEMENT_REVOKED"
  | "ENTITLEMENT_GRANDFATHERED"
  | "COACHLINK_GRANTED"
  | "COACHLINK_REVOKED"
  | "COACHLINK_GRANDFATHERED"
  | "COUPON_APPLIED"
  | "COUPON_REMOVED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_RESUMED"
  | "INVOICE_PAID"
  | "INVOICE_FAILED"
  | "INVOICE_REFUNDED"
  | "SEAT_ADDED"
  | "SEAT_REMOVED"
  | "SEAT_SWAPPED"
  | "WEBHOOK_RECEIVED"
  | "PAYOUT_INITIATED";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  /** The user the action concerns (player, coach, team admin, expert). */
  subjectUserId?: string;
  /** Actor that triggered it ("system" for webhook-driven, else user id). */
  actorUserId?: string;
  /** Free-form structured payload. */
  metadata: Record<string, unknown>;
  occurredAt: string;
}

/* ------------------------------------------------------------------ */
/* Demo wiring                                                         */
/* ------------------------------------------------------------------ */

export interface AICreditMeter {
  userId: string;
  /** Credits remaining. */
  balance: number;
  /** Lifetime usage. */
  totalConsumed: number;
  /** Last refill date. */
  lastRefilledAt?: string;
}
