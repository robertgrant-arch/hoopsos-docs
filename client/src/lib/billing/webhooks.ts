/**
 * Stripe Webhook Simulator
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §2.
 *
 * In production, `/api/webhooks/stripe` ingests Stripe events, verifies the
 * signature, deduplicates on `event.id` via `WebhookEvent`, and dispatches to
 * the right handler. Each handler mutates Postgres exactly the way these
 * functions mutate the in-memory store.
 *
 * The "production" file would be an Express/Next route handler that calls
 * these handlers — same code, different transport.
 *
 * Supported event types (per spec):
 *   • checkout.session.completed
 *   • invoice.paid
 *   • invoice.payment_failed
 *   • customer.subscription.updated
 *   • customer.subscription.deleted
 *   • charge.refunded
 *   • account.updated (Connect)
 */

import { useBillingStore } from "./store";
import {
  grantEntitlement,
  revokeEntitlement,
} from "./entitlements";
import type {
  Invoice,
  PayoutAccount,
  Subscription,
  WebhookEvent,
} from "./types";

let _seq = 0;
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

const nowIso = () => new Date().toISOString();

export type SimulatedEvent =
  | {
      type: "checkout.session.completed";
      data: {
        customerId: string;
        productId: string;
        priceId: string;
        couponCode?: string;
        seatCount?: number;
      };
    }
  | {
      type: "invoice.paid";
      data: { invoiceId?: string; subscriptionId?: string; amount?: number };
    }
  | {
      type: "invoice.payment_failed";
      data: { subscriptionId: string };
    }
  | {
      type: "customer.subscription.updated";
      data: {
        subscriptionId: string;
        cancelAtPeriodEnd?: boolean;
        seatCount?: number;
        status?: Subscription["status"];
      };
    }
  | {
      type: "customer.subscription.deleted";
      data: { subscriptionId: string };
    }
  | {
      type: "charge.refunded";
      data: { invoiceId: string; amount?: number };
    }
  | {
      type: "account.updated";
      data: {
        payoutAccountId: string;
        status: PayoutAccount["status"];
        payoutsEnabled?: boolean;
      };
    };

/**
 * Process a webhook payload. Idempotent: a duplicate `eventId` is no-op.
 * Returns the WebhookEvent record that was written (or an existing one).
 */
export function dispatchWebhook(
  event: SimulatedEvent,
  opts?: { eventId?: string; signatureVerified?: boolean },
): WebhookEvent {
  const s = useBillingStore.getState();
  const eventId = opts?.eventId ?? newId("evt");

  // Idempotency.
  const existing = s.webhookEvents.find((e) => e.stripeEventId === eventId);
  if (existing) return existing;

  // Audit + apply.
  switch (event.type) {
    case "checkout.session.completed":
      handleCheckoutCompleted(event.data);
      break;
    case "invoice.paid":
      handleInvoicePaid(event.data);
      break;
    case "invoice.payment_failed":
      handleInvoiceFailed(event.data);
      break;
    case "customer.subscription.updated":
      handleSubscriptionUpdated(event.data);
      break;
    case "customer.subscription.deleted":
      handleSubscriptionDeleted(event.data);
      break;
    case "charge.refunded":
      handleChargeRefunded(event.data);
      break;
    case "account.updated":
      handleAccountUpdated(event.data);
      break;
  }

  const stored: WebhookEvent = {
    id: newId("wh"),
    stripeEventId: eventId,
    type: event.type,
    payload: event.data,
    processedAt: nowIso(),
    signatureVerified: opts?.signatureVerified ?? true,
  };
  useBillingStore
    .getState()
    .setWebhookEvents([stored, ...useBillingStore.getState().webhookEvents].slice(0, 200));
  return stored;
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

function handleCheckoutCompleted(d: {
  customerId: string;
  productId: string;
  priceId: string;
  couponCode?: string;
  seatCount?: number;
}): void {
  const s = useBillingStore.getState();
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const sub: Subscription = {
    id: newId("sub"),
    stripeSubscriptionId: newId("sub_stripe"),
    customerId: d.customerId,
    productId: d.productId,
    priceId: d.priceId,
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: end.toISOString(),
    cancelAtPeriodEnd: false,
    status: "ACTIVE",
    couponCode: d.couponCode,
    seatCount: d.seatCount,
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
  };
  s.setSubscriptions([sub, ...s.subscriptions]);

  // Grant the matching entitlement.
  if (d.productId === "prod_player_solo") {
    grantEntitlement(d.customerId, "PLAYER_PREMIUM", sub.id);
  } else if (d.productId === "prod_coach_pro") {
    grantEntitlement(d.customerId, "COACH_PRO", sub.id);
  } else if (d.productId === "prod_team_pro") {
    grantEntitlement(d.customerId, "TEAM_PRO_SEAT", sub.id);
  }
}

function handleInvoicePaid(d: {
  invoiceId?: string;
  subscriptionId?: string;
  amount?: number;
}): void {
  const s = useBillingStore.getState();
  if (d.invoiceId) {
    s.setInvoices(
      s.invoices.map((inv) =>
        inv.id === d.invoiceId
          ? {
              ...inv,
              status: "PAID" as const,
              amountPaid: inv.amountDue,
              paidAt: nowIso(),
            }
          : inv,
      ),
    );
  }
  if (d.subscriptionId) {
    s.setSubscriptions(
      s.subscriptions.map((sub) =>
        sub.id === d.subscriptionId
          ? { ...sub, status: "ACTIVE" as const, dunning: undefined, updatedAt: nowIso() }
          : sub,
      ),
    );
  }
}

function handleInvoiceFailed(d: { subscriptionId: string }): void {
  const s = useBillingStore.getState();
  const sub = s.subscriptions.find((x) => x.id === d.subscriptionId);
  if (!sub) return;
  s.setSubscriptions(
    s.subscriptions.map((x) =>
      x.id === d.subscriptionId
        ? {
            ...x,
            status: "PAST_DUE" as const,
            dunning: {
              failedPaymentAt: nowIso(),
              graceUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              attempts: (x.dunning?.attempts ?? 0) + 1,
            },
            updatedAt: nowIso(),
          }
        : x,
    ),
  );
  // Add an OPEN invoice if there isn't one already for this period.
  const open = s.invoices.find(
    (i) => i.subscriptionId === d.subscriptionId && i.status === "OPEN",
  );
  if (!open) {
    const inv: Invoice = {
      id: newId("inv"),
      stripeInvoiceId: newId("in_stripe"),
      subscriptionId: d.subscriptionId,
      customerId: sub.customerId,
      amountDue: sub.couponCode === "COACH50" ? 950 : 1900,
      amountPaid: 0,
      status: "OPEN",
      appliedCoupons: sub.couponCode ? [sub.couponCode] : [],
      createdAt: nowIso(),
    };
    useBillingStore.getState().setInvoices([inv, ...useBillingStore.getState().invoices]);
  }
}

function handleSubscriptionUpdated(d: {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
  seatCount?: number;
  status?: Subscription["status"];
}): void {
  const s = useBillingStore.getState();
  s.setSubscriptions(
    s.subscriptions.map((x) =>
      x.id === d.subscriptionId
        ? {
            ...x,
            cancelAtPeriodEnd: d.cancelAtPeriodEnd ?? x.cancelAtPeriodEnd,
            seatCount: d.seatCount ?? x.seatCount,
            status: d.status ?? x.status,
            updatedAt: nowIso(),
          }
        : x,
    ),
  );
}

function handleSubscriptionDeleted(d: { subscriptionId: string }): void {
  const s = useBillingStore.getState();
  const sub = s.subscriptions.find((x) => x.id === d.subscriptionId);
  if (!sub) return;
  s.setSubscriptions(
    s.subscriptions.map((x) =>
      x.id === d.subscriptionId ? { ...x, status: "CANCELED" as const, updatedAt: nowIso() } : x,
    ),
  );

  // Revoke the matching entitlement for the customer.
  if (sub.productId === "prod_player_solo") {
    revokeEntitlement(sub.customerId, "PLAYER_PREMIUM");
  } else if (sub.productId === "prod_coach_pro") {
    revokeEntitlement(sub.customerId, "COACH_PRO");
  } else if (sub.productId === "prod_team_pro") {
    revokeEntitlement(sub.customerId, "TEAM_PRO_SEAT");
  }
}

function handleChargeRefunded(d: { invoiceId: string; amount?: number }): void {
  const s = useBillingStore.getState();
  s.setInvoices(
    s.invoices.map((inv) =>
      inv.id === d.invoiceId
        ? {
            ...inv,
            refundedAmount: d.amount ?? inv.amountPaid,
            refundedAt: nowIso(),
            status: (d.amount ?? inv.amountPaid) >= inv.amountPaid ? "VOID" : inv.status,
          }
        : inv,
    ),
  );
}

function handleAccountUpdated(d: {
  payoutAccountId: string;
  status: PayoutAccount["status"];
  payoutsEnabled?: boolean;
}): void {
  const s = useBillingStore.getState();
  s.setPayouts(
    s.payouts.map((p) =>
      p.id === d.payoutAccountId
        ? {
            ...p,
            status: d.status,
            payoutsEnabled: d.payoutsEnabled ?? p.payoutsEnabled,
            updatedAt: nowIso(),
          }
        : p,
    ),
  );
}
