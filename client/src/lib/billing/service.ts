/**
 * Billing Service — public API used by UI
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §4, §6, §7, §8.
 *
 * In production this file is `lib/stripe.ts` and calls the real Stripe SDK.
 * Here it shims the same surface area against the in-memory store + webhook
 * simulator. Every method either:
 *   • mutates the store directly (then audits), OR
 *   • emits a simulated webhook (then the webhook handler mutates).
 *
 * UI never imports `webhooks.ts` or `store.ts` directly — only `service.ts`.
 */

import { findCoupon, findPrice, findProduct } from "./catalog";
import {
  grantEntitlement,
  revokeEntitlement,
  grantCoachLink,
  revokeCoachLink,
} from "./entitlements";
import { useBillingStore } from "./store";
import { dispatchWebhook } from "./webhooks";
import type { Invoice, Seat, Subscription } from "./types";

let _seq = 0;
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

export interface CheckoutInput {
  customerId: string;
  priceId: string;
  /** Optional explicit coupon (e.g. promo). Engine-applied COACH50 is auto. */
  couponCode?: string;
  /** TEAM_PRO only — number of seats. */
  seatCount?: number;
}

export interface CheckoutResult {
  subscription: Subscription;
  invoice: Invoice;
  hostedUrl: string;
}

/**
 * Simulates Stripe Checkout: creates a subscription + paid invoice, applies
 * the engine's COACH50 if eligible, and emits the
 * `checkout.session.completed` + `invoice.paid` webhooks.
 */
export function createCheckout(input: CheckoutInput): CheckoutResult {
  const price = findPrice(input.priceId);
  if (!price) throw new Error(`Unknown price ${input.priceId}`);
  const product = findProduct(price.productId);
  if (!product) throw new Error(`Unknown product ${price.productId}`);

  // 50%-off engine: if buying Player Solo and a COACH_PRO/TEAM_PRO link exists,
  // auto-apply COACH50.
  let coupon = input.couponCode;
  if (product.tier === "PLAYER_SOLO") {
    const s = useBillingStore.getState();
    const link = s.coachLinks.find(
      (l) => l.playerUserId === input.customerId && l.status !== "REVOKED",
    );
    if (link) coupon = "COACH50";
  }

  // Compute effective amount.
  const couponObj = coupon ? findCoupon(coupon) : undefined;
  const baseAmount = price.amount;
  const seatAmount =
    product.tier === "TEAM_PRO" && input.seatCount && price.includedSeats
      ? Math.max(0, input.seatCount - price.includedSeats) *
        (price.perExtraUnitAmount ?? 0)
      : 0;
  const grossDue = baseAmount + seatAmount;
  const netDue = couponObj
    ? Math.round(grossDue * (1 - couponObj.percentOff / 100))
    : grossDue;

  // Dispatch checkout.session.completed (creates Subscription + Entitlement).
  dispatchWebhook({
    type: "checkout.session.completed",
    data: {
      customerId: input.customerId,
      productId: product.id,
      priceId: price.id,
      couponCode: coupon,
      seatCount: input.seatCount,
    },
  });

  // Find the just-created subscription.
  const sub = useBillingStore
    .getState()
    .subscriptions.find(
      (s) => s.customerId === input.customerId && s.productId === product.id,
    )!;

  // Mint the invoice and immediately pay it (Stripe-hosted Checkout = paid up front).
  const invoice: Invoice = {
    id: newId("inv"),
    stripeInvoiceId: newId("in_stripe"),
    subscriptionId: sub.id,
    customerId: input.customerId,
    amountDue: netDue,
    amountPaid: netDue,
    status: "PAID",
    appliedCoupons: coupon ? [coupon] : [],
    createdAt: nowIso(),
    paidAt: nowIso(),
  };
  const s = useBillingStore.getState();
  s.setInvoices([invoice, ...s.invoices]);

  dispatchWebhook({
    type: "invoice.paid",
    data: { invoiceId: invoice.id, subscriptionId: sub.id, amount: netDue },
  });

  return {
    subscription: sub,
    invoice,
    hostedUrl: `https://checkout.stripe.com/c/pay/${sub.stripeSubscriptionId}`,
  };
}

/* ------------------------------------------------------------------ */
/* Customer Portal                                                     */
/* ------------------------------------------------------------------ */

export function openPortal(customerId: string): { hostedUrl: string } {
  // In production this hits `stripe.billingPortal.sessions.create`.
  return {
    hostedUrl: `https://billing.stripe.com/p/session/${customerId}_${Date.now()}`,
  };
}

export function cancelAtPeriodEnd(subscriptionId: string): Subscription {
  dispatchWebhook({
    type: "customer.subscription.updated",
    data: { subscriptionId, cancelAtPeriodEnd: true },
  });
  return useBillingStore
    .getState()
    .subscriptions.find((s) => s.id === subscriptionId)!;
}

export function resumeSubscription(subscriptionId: string): Subscription {
  dispatchWebhook({
    type: "customer.subscription.updated",
    data: { subscriptionId, cancelAtPeriodEnd: false, status: "ACTIVE" },
  });
  return useBillingStore
    .getState()
    .subscriptions.find((s) => s.id === subscriptionId)!;
}

export function pauseSubscription(subscriptionId: string): Subscription {
  dispatchWebhook({
    type: "customer.subscription.updated",
    data: { subscriptionId, status: "PAUSED" },
  });
  return useBillingStore
    .getState()
    .subscriptions.find((s) => s.id === subscriptionId)!;
}

/* ------------------------------------------------------------------ */
/* Seats (Team Pro)                                                    */
/* ------------------------------------------------------------------ */

export function addSeat(subscriptionId: string, occupantUserId?: string): Seat {
  const s = useBillingStore.getState();
  const seat: Seat = {
    id: newId("seat"),
    subscriptionId,
    occupantUserId,
    status: occupantUserId ? "ASSIGNED" : "VACANT",
    claimedAt: occupantUserId ? nowIso() : undefined,
  };
  s.setSeats([seat, ...s.seats]);

  // Emit subscription.updated with bumped seat count.
  const sub = s.subscriptions.find((x) => x.id === subscriptionId);
  if (sub) {
    const seatsForSub = s.seats.filter((x) => x.subscriptionId === subscriptionId).length + 1;
    dispatchWebhook({
      type: "customer.subscription.updated",
      data: { subscriptionId, seatCount: seatsForSub },
    });
  }
  return seat;
}

export function removeSeat(seatId: string): void {
  const s = useBillingStore.getState();
  const seat = s.seats.find((x) => x.id === seatId);
  if (!seat) return;
  s.setSeats(s.seats.filter((x) => x.id !== seatId));
  const seatsForSub = s.seats.filter(
    (x) => x.subscriptionId === seat.subscriptionId && x.id !== seatId,
  ).length;
  dispatchWebhook({
    type: "customer.subscription.updated",
    data: { subscriptionId: seat.subscriptionId, seatCount: seatsForSub },
  });
}

export function swapSeat(seatId: string, newOccupantUserId: string): void {
  const s = useBillingStore.getState();
  s.setSeats(
    s.seats.map((seat) =>
      seat.id === seatId
        ? {
            ...seat,
            occupantUserId: newOccupantUserId,
            status: "ASSIGNED" as const,
            claimedAt: nowIso(),
          }
        : seat,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Refunds                                                             */
/* ------------------------------------------------------------------ */

export function refundInvoice(invoiceId: string, amount?: number): void {
  dispatchWebhook({ type: "charge.refunded", data: { invoiceId, amount } });
}

/* ------------------------------------------------------------------ */
/* Roster events — wire from Coach HQ / Team Mgmt UI                   */
/* ------------------------------------------------------------------ */

export function onRosterJoin(
  playerUserId: string,
  source: { kind: "COACH_PRO"; coachUserId: string } | { kind: "TEAM_PRO"; teamId: string },
  actorUserId?: string,
): void {
  grantCoachLink(playerUserId, source, actorUserId);
}

export function onRosterRemove(
  playerUserId: string,
  source: { kind: "COACH_PRO"; coachUserId: string } | { kind: "TEAM_PRO"; teamId: string },
  actorUserId?: string,
): void {
  revokeCoachLink(playerUserId, source, actorUserId);
}

/* ------------------------------------------------------------------ */
/* AI credits (metered)                                                */
/* ------------------------------------------------------------------ */

export function consumeAICredit(userId: string, amount = 1): boolean {
  const s = useBillingStore.getState();
  const meter = s.aiCredits.find((m) => m.userId === userId);
  if (!meter || meter.balance < amount) return false;
  s.setAICredits(
    s.aiCredits.map((m) =>
      m.userId === userId
        ? {
            ...m,
            balance: m.balance - amount,
            totalConsumed: m.totalConsumed + amount,
          }
        : m,
    ),
  );
  return true;
}

export function refillAICredits(userId: string, amount: number): void {
  const s = useBillingStore.getState();
  const meter = s.aiCredits.find((m) => m.userId === userId);
  if (meter) {
    s.setAICredits(
      s.aiCredits.map((m) =>
        m.userId === userId
          ? { ...m, balance: m.balance + amount, lastRefilledAt: nowIso() }
          : m,
      ),
    );
  } else {
    s.setAICredits([
      ...s.aiCredits,
      { userId, balance: amount, totalConsumed: 0, lastRefilledAt: nowIso() },
    ]);
  }
}

/* ------------------------------------------------------------------ */
/* Re-export for convenience                                           */
/* ------------------------------------------------------------------ */

export { grantCoachLink, revokeCoachLink, grantEntitlement, revokeEntitlement };
