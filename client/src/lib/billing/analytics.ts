/**
 * Billing Analytics — MRR / ARR / churn / LTV / ARPU
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §10.
 *
 * Pure functions that derive all KPIs from the in-memory billing store.
 * In production these would be SQL views / scheduled materializations.
 */

import { findPrice, findProduct } from "./catalog";
import { useBillingStore } from "./store";
import type { Subscription, SubscriptionStatus } from "./types";

export interface KPISnapshot {
  /** Monthly Recurring Revenue (cents). */
  mrr: number;
  /** Annual Recurring Revenue (cents). */
  arr: number;
  /** Active recurring subscriptions count. */
  activeSubscriptions: number;
  /** Trial / past_due / paused buckets. */
  byStatus: Record<SubscriptionStatus, number>;
  /** Subscriptions that canceled this month. */
  monthlyChurnCount: number;
  /** Churn rate (canceled / active at month start), 0..1. */
  monthlyChurnRate: number;
  /** Average Revenue Per User (cents/month). */
  arpu: number;
  /** Lifetime Value (cents) — ARPU / churn rate. */
  ltv: number;
  /** Total customers with at least one paid invoice. */
  payingCustomers: number;
  /** Total revenue this month (cents). */
  monthlyRevenue: number;
  /** Lifetime revenue (cents). */
  lifetimeRevenue: number;
  /** Mix by product. */
  productMix: { productId: string; name: string; mrr: number; subs: number }[];
  /** Marketplace gross + fees. */
  marketplaceGross: number;
  marketplacePlatformFee: number;
  marketplacePayoutsToExperts: number;
}

const STATUSES: SubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "PAUSED",
];

function mrrForSubscription(sub: Subscription): number {
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return 0;
  const price = findPrice(sub.priceId);
  if (!price) return 0;
  let amt = price.amount;
  if (price.cadence === "ANNUAL") amt = Math.round(amt / 12);
  if (price.cadence === "ONE_TIME" || price.cadence === "METERED") return 0;

  // Apply coupon (treat COACH50 as 50% off MRR contribution).
  if (sub.couponCode === "COACH50") amt = Math.round(amt * 0.5);

  // Team Pro seat overage.
  const product = findProduct(price.productId);
  if (product?.tier === "TEAM_PRO" && sub.seatCount && price.includedSeats) {
    const extra = Math.max(0, sub.seatCount - price.includedSeats);
    amt += extra * (price.perExtraUnitAmount ?? 0);
  }
  return amt;
}

export function computeKPIs(): KPISnapshot {
  const s = useBillingStore.getState();
  const subs = s.subscriptions;
  const invs = s.invoices;
  const payouts = s.payouts;

  // Status histogram.
  const byStatus: Record<SubscriptionStatus, number> = STATUSES.reduce(
    (acc, st) => ((acc[st] = 0), acc),
    {} as Record<SubscriptionStatus, number>,
  );
  for (const sub of subs) byStatus[sub.status] = (byStatus[sub.status] ?? 0) + 1;

  // MRR.
  const mrr = subs.reduce((sum, sub) => sum + mrrForSubscription(sub), 0);
  const arr = mrr * 12;

  // Active recurring subs (excluding one-off / canceled).
  const activeSubs = subs.filter(
    (sub) => sub.status === "ACTIVE" || sub.status === "TRIALING",
  );
  const activeSubscriptions = activeSubs.length;

  // Churn this month.
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthlyChurnCount = subs.filter(
    (sub) => sub.status === "CANCELED" && new Date(sub.updatedAt) >= monthAgo,
  ).length;
  const monthlyChurnRate =
    activeSubscriptions + monthlyChurnCount === 0
      ? 0
      : monthlyChurnCount / (activeSubscriptions + monthlyChurnCount);

  // ARPU = MRR / active.
  const arpu = activeSubscriptions === 0 ? 0 : Math.round(mrr / activeSubscriptions);
  const ltv = monthlyChurnRate === 0 ? arpu * 24 : Math.round(arpu / monthlyChurnRate);

  // Paying customers.
  const payingCustomers = new Set(
    invs.filter((i) => i.status === "PAID").map((i) => i.customerId),
  ).size;

  // Revenue.
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = invs
    .filter(
      (i) =>
        i.status === "PAID" &&
        i.paidAt &&
        new Date(i.paidAt) >= startOfMonth,
    )
    .reduce((sum, i) => sum + i.amountPaid, 0);
  const lifetimeRevenue = invs
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amountPaid, 0);

  // Product mix.
  const mix = new Map<string, { mrr: number; subs: number; name: string }>();
  for (const sub of subs) {
    const prod = findProduct(sub.productId);
    if (!prod) continue;
    const cur = mix.get(prod.id) ?? { mrr: 0, subs: 0, name: prod.name };
    cur.mrr += mrrForSubscription(sub);
    if (sub.status === "ACTIVE" || sub.status === "TRIALING") cur.subs += 1;
    mix.set(prod.id, cur);
  }
  const productMix = Array.from(mix.entries())
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.mrr - a.mrr);

  // Marketplace.
  const marketplaceGross = payouts.reduce((s, p) => s + p.lifetimeGrossCents, 0);
  const marketplacePlatformFee = payouts.reduce(
    (s, p) => s + p.lifetimePlatformFeeCents,
    0,
  );
  const marketplacePayoutsToExperts = payouts.reduce(
    (s, p) => s + p.lifetimeNetCents,
    0,
  );

  return {
    mrr,
    arr,
    activeSubscriptions,
    byStatus,
    monthlyChurnCount,
    monthlyChurnRate,
    arpu,
    ltv,
    payingCustomers,
    monthlyRevenue,
    lifetimeRevenue,
    productMix,
    marketplaceGross,
    marketplacePlatformFee,
    marketplacePayoutsToExperts,
  };
}
