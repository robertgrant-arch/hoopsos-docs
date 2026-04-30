/**
 * Billing Catalog — Products, Prices, Coupons
 * --------------------------------------------------------------------------
 * Source: Prompt 16, deliverable §1.
 *
 * The shape mirrors what would live in `Product` + `Price` rows in the real
 * Postgres-backed system. Stripe ids prefixed `prod_` / `price_` mirror real
 * Stripe ids; in production these are populated by the Stripe sync job.
 */

import type { Coupon, Price, Product } from "./types";

export const products: Product[] = [
  {
    id: "prod_player_solo",
    stripeProductId: "prod_HoopPlayerSolo",
    tier: "PLAYER_SOLO",
    name: "Player",
    description:
      "Workouts of the day, AI feedback, achievements, film tools.",
    accent: "oklch(0.7 0.2 30)",
    features: [
      "Daily Workout of the Day with AI feedback",
      "Skill tree, achievements, leaderboards",
      "Film locker with on-device clipping",
      "Marketplace expert reviews ($25 each)",
      "5 AI-feedback credits / month included",
    ],
  },
  {
    id: "prod_coach_pro",
    stripeProductId: "prod_HoopCoachPro",
    tier: "COACH_PRO",
    name: "Coach Pro",
    description:
      "Practice plan builder, playbook studio, film room, roster of up to 30 athletes.",
    accent: "oklch(0.72 0.16 250)",
    features: [
      "Practice Plan Builder — drill library + custom drills",
      "Playbook Studio — multi-phase plays + quizzes",
      "Film Room with telestration & clip sharing",
      "Roster up to 30 athletes — each gets 50% off Player",
      "Assignments, attendance, reports",
    ],
  },
  {
    id: "prod_team_pro",
    stripeProductId: "prod_HoopTeamPro",
    tier: "TEAM_PRO",
    name: "Team Pro",
    description:
      "Everything in Coach Pro for the whole staff, with team-wide entitlements & 50% off for every roster athlete.",
    accent: "oklch(0.7 0.18 145)",
    features: [
      "20 athlete seats included (each at 50% off Player)",
      "$29/seat/mo over 20",
      "Multi-coach staff accounts",
      "Org-wide drill library + playbook sharing",
      "Live class hosting, expert spend pool, billing portal",
    ],
  },
  {
    id: "prod_expert_connect",
    stripeProductId: "prod_HoopExpertConnect",
    tier: "EXPERT_CONNECT",
    name: "Expert Marketplace Seller",
    description:
      "List availability, sell reviews and live sessions. 15% platform fee, weekly payouts via Stripe Connect.",
    accent: "oklch(0.78 0.16 75)",
    features: [
      "Stripe Connect Express onboarding",
      "Sell async reviews $25–$200",
      "Sell live 1:1 or group classes $10–$100",
      "15% platform fee, weekly payouts",
      "Stripe-hosted tax & 1099-K handling",
    ],
  },
  {
    id: "prod_ai_credit_pack",
    stripeProductId: "prod_HoopAICredits",
    tier: "AI_CREDIT_PACK",
    name: "AI Feedback Credits",
    description:
      "Per-clip AI feedback. Metered usage; buy packs or upgrade to a tier with included credits.",
    accent: "oklch(0.74 0.18 290)",
    features: [
      "$0.50 / clip metered",
      "Pack of 50 — $20 (save 20%)",
      "Pack of 200 — $70 (save 30%)",
      "Refilled monthly with Player Premium",
      "Export results to PDF",
    ],
  },
];

/** Prices wired into Stripe via the sync job. */
export const prices: Price[] = [
  // Player Solo
  {
    id: "price_player_solo_monthly",
    stripePriceId: "price_HoopPlayerSoloMonthly",
    productId: "prod_player_solo",
    cadence: "MONTHLY",
    amount: 1900,
    currency: "usd",
  },
  {
    id: "price_player_solo_annual",
    stripePriceId: "price_HoopPlayerSoloAnnual",
    productId: "prod_player_solo",
    cadence: "ANNUAL",
    amount: 19000,
    currency: "usd",
  },
  // Coach Pro
  {
    id: "price_coach_pro_monthly",
    stripePriceId: "price_HoopCoachProMonthly",
    productId: "prod_coach_pro",
    cadence: "MONTHLY",
    amount: 4900,
    currency: "usd",
  },
  {
    id: "price_coach_pro_annual",
    stripePriceId: "price_HoopCoachProAnnual",
    productId: "prod_coach_pro",
    cadence: "ANNUAL",
    amount: 49000,
    currency: "usd",
  },
  // Team Pro
  {
    id: "price_team_pro_monthly",
    stripePriceId: "price_HoopTeamProMonthly",
    productId: "prod_team_pro",
    cadence: "MONTHLY",
    amount: 9900,
    perExtraUnitAmount: 2900,
    includedSeats: 20,
    currency: "usd",
  },
  // AI credit packs
  {
    id: "price_ai_credit_50",
    stripePriceId: "price_HoopAICredits50",
    productId: "prod_ai_credit_pack",
    cadence: "ONE_TIME",
    amount: 2000,
    currency: "usd",
  },
  {
    id: "price_ai_credit_200",
    stripePriceId: "price_HoopAICredits200",
    productId: "prod_ai_credit_pack",
    cadence: "ONE_TIME",
    amount: 7000,
    currency: "usd",
  },
  {
    id: "price_ai_credit_metered",
    stripePriceId: "price_HoopAICreditsMetered",
    productId: "prod_ai_credit_pack",
    cadence: "METERED",
    amount: 50,
    currency: "usd",
  },
];

export const coupons: Coupon[] = [
  {
    id: "coupon_coach50",
    code: "COACH50",
    stripeCouponId: "coupon_HoopCoach50",
    percentOff: 50,
    duration: "forever",
    applicableProductIds: ["prod_player_solo"],
  },
  {
    id: "coupon_team_swap",
    code: "TEAM_SWAP_PRORATE",
    stripeCouponId: "coupon_HoopTeamSwapProrate",
    percentOff: 100,
    duration: "once",
    applicableProductIds: ["prod_team_pro"],
  },
];

/* -- helpers -- */

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
export function findProductByTier(tier: Product["tier"]): Product | undefined {
  return products.find((p) => p.tier === tier);
}
export function findPrice(id: string): Price | undefined {
  return prices.find((p) => p.id === id);
}
export function pricesForProduct(productId: string): Price[] {
  return prices.filter((p) => p.productId === productId);
}
export function findCoupon(code: string): Coupon | undefined {
  return coupons.find((c) => c.code === code);
}

/** Stripe-style "$1,900 → $19.00" helper. */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toFixed(2)}`;
}
