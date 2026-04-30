/**
 * EntitlementService
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §3 — 50%-off entitlement engine end-to-end.
 *
 * In production this lives at `lib/entitlements.ts` next to `lib/stripe.ts`
 * and is invoked from server actions + webhook handlers. The signature here
 * is identical so the same code paths can be lifted into Next.js API routes
 * with one import swap.
 *
 * Responsibilities:
 *   1. grant(playerUserId, source) — grant the COACH50 link entitlement,
 *      apply the coupon to the player's active subscription (or store for
 *      next checkout), and emit an audit entry.
 *   2. revoke(playerUserId, source) — flip the link to GRANDFATHERED for
 *      the rest of the current period; at period end it transitions to
 *      REVOKED and the coupon is removed at the next renewal.
 *   3. check(playerUserId) — returns the player's effective entitlement
 *      state for use in UI and pricing previews.
 *   4. recompute() — full re-derivation pass (run after webhook events).
 */

import { useBillingStore } from "./store";
import type {
  AuditAction,
  AuditEntry,
  CoachLinkEntitlement,
  Entitlement,
  EntitlementKind,
  Subscription,
} from "./types";

let _seq = 0;
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

function audit(
  action: AuditAction,
  metadata: Record<string, unknown> = {},
  subjectUserId?: string,
  actorUserId?: string,
): void {
  const s = useBillingStore.getState();
  const entry: AuditEntry = {
    id: newId("audit"),
    action,
    subjectUserId,
    actorUserId: actorUserId ?? "system",
    metadata,
    occurredAt: nowIso(),
  };
  s.setAudit([entry, ...s.audit].slice(0, 500));
}

export function getAuditLog(filter?: {
  subjectUserId?: string;
  action?: AuditAction;
  limit?: number;
}): AuditEntry[] {
  const log = useBillingStore.getState().audit;
  let out = log;
  if (filter?.subjectUserId) out = out.filter((a) => a.subjectUserId === filter.subjectUserId);
  if (filter?.action) out = out.filter((a) => a.action === filter.action);
  if (filter?.limit) out = out.slice(0, filter.limit);
  return out;
}

/* ------------------------------------------------------------------ */
/* COACH50 — Player ↔ Coach/Team link                                  */
/* ------------------------------------------------------------------ */

/** What backs the player's 50%-off discount today. */
export type CoachLinkSource = CoachLinkEntitlement["source"];

/**
 * Walk all link entitlements for `playerUserId` and return the most-favorable
 * active or grandfathered one. The 50%-off coupon is applied iff this returns
 * a row in {ACTIVE, GRANDFATHERED} state.
 */
export function findActiveCoachLink(
  playerUserId: string,
): CoachLinkEntitlement | undefined {
  const links = useBillingStore.getState().coachLinks;
  return links.find(
    (l) =>
      l.playerUserId === playerUserId &&
      (l.status === "ACTIVE" || l.status === "GRANDFATHERED"),
  );
}

/** Find the player's active solo subscription (the one COACH50 attaches to). */
function findPlayerSubscription(
  playerUserId: string,
): Subscription | undefined {
  return useBillingStore
    .getState()
    .subscriptions.find(
      (s) =>
        s.customerId === playerUserId &&
        s.productId === "prod_player_solo" &&
        s.status !== "CANCELED" &&
        s.status !== "INCOMPLETE_EXPIRED",
    );
}

/**
 * Grant the link entitlement when a player joins a roster whose coach has
 * Coach Pro OR whose team has Team Pro. Idempotent — re-granting the same
 * (player, source) pair is a no-op.
 */
export function grantCoachLink(
  playerUserId: string,
  source: CoachLinkSource,
  actorUserId?: string,
): CoachLinkEntitlement {
  const s = useBillingStore.getState();

  // Idempotency check.
  const existing = s.coachLinks.find(
    (l) =>
      l.playerUserId === playerUserId && sameSource(l.source, source) && l.status !== "REVOKED",
  );
  if (existing) {
    if (existing.status === "GRANDFATHERED") {
      // Restore: player got re-rostered before the grandfather window expired.
      const restored: CoachLinkEntitlement = {
        ...existing,
        status: "ACTIVE",
        grandfatherStartedAt: undefined,
        grandfatheredUntil: undefined,
        updatedAt: nowIso(),
      };
      s.setCoachLinks(s.coachLinks.map((l) => (l.id === existing.id ? restored : l)));
      audit("COACHLINK_GRANTED", { restored: true, source }, playerUserId, actorUserId);
      applyCoach50Coupon(playerUserId, actorUserId);
      return restored;
    }
    return existing;
  }

  const link: CoachLinkEntitlement = {
    id: newId("link"),
    playerUserId,
    source,
    status: "ACTIVE",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  s.setCoachLinks([link, ...s.coachLinks]);
  audit("COACHLINK_GRANTED", { source }, playerUserId, actorUserId);
  applyCoach50Coupon(playerUserId, actorUserId);
  return link;
}

/**
 * Revoke a link. Per spec: grandfather the current billing period — the
 * player keeps 50% off through `currentPeriodEnd`, after which the coupon is
 * removed at next renewal.
 *
 * If the player has no other active links after this revoke, the coupon is
 * scheduled for removal. If they still have another active link (e.g. their
 * coach lost Coach Pro but their team has Team Pro), the coupon stays.
 */
export function revokeCoachLink(
  playerUserId: string,
  source: CoachLinkSource,
  actorUserId?: string,
): void {
  const s = useBillingStore.getState();
  const sub = findPlayerSubscription(playerUserId);
  const grandfatherUntil = sub?.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  s.setCoachLinks(
    s.coachLinks.map((l) =>
      l.playerUserId === playerUserId && sameSource(l.source, source) && l.status === "ACTIVE"
        ? {
            ...l,
            status: "GRANDFATHERED",
            grandfatherStartedAt: nowIso(),
            grandfatheredUntil: grandfatherUntil,
            updatedAt: nowIso(),
          }
        : l,
    ),
  );
  audit(
    "COACHLINK_GRANDFATHERED",
    { source, grandfatheredUntil: grandfatherUntil },
    playerUserId,
    actorUserId,
  );

  // If after this revoke the player has no other active link, schedule coupon
  // removal at next renewal.
  const stillActive = useBillingStore
    .getState()
    .coachLinks.some(
      (l) => l.playerUserId === playerUserId && l.status === "ACTIVE",
    );
  if (!stillActive) {
    audit(
      "COUPON_REMOVED",
      {
        coupon: "COACH50",
        scheduled: true,
        effectiveAt: grandfatherUntil,
        reason: "All coach/team links revoked; grandfathered to period end.",
      },
      playerUserId,
      actorUserId,
    );
  }
}

/** Final transition: GRANDFATHERED → REVOKED at period end. */
export function expireGrandfathers(now: Date = new Date()): void {
  const s = useBillingStore.getState();
  let didExpire = false;
  const next = s.coachLinks.map((l) => {
    if (
      l.status === "GRANDFATHERED" &&
      l.grandfatheredUntil &&
      new Date(l.grandfatheredUntil) <= now
    ) {
      didExpire = true;
      audit("COACHLINK_REVOKED", { reason: "Grandfather expired." }, l.playerUserId);
      return { ...l, status: "REVOKED" as const, updatedAt: now.toISOString() };
    }
    return l;
  });
  if (didExpire) {
    s.setCoachLinks(next);
    // Also remove COACH50 coupon from any subscription whose owner now has no
    // active link.
    const subs = useBillingStore.getState().subscriptions;
    const updated = subs.map((sub) => {
      if (sub.couponCode !== "COACH50") return sub;
      const stillEntitled = next.some(
        (l) =>
          l.playerUserId === sub.customerId &&
          (l.status === "ACTIVE" || l.status === "GRANDFATHERED"),
      );
      if (stillEntitled) return sub;
      audit(
        "COUPON_REMOVED",
        { coupon: "COACH50", subscriptionId: sub.id },
        sub.customerId,
      );
      return {
        ...sub,
        couponCode: undefined,
        updatedAt: now.toISOString(),
      };
    });
    s.setSubscriptions(updated);
  }
}

function applyCoach50Coupon(playerUserId: string, actorUserId?: string): void {
  const s = useBillingStore.getState();
  const sub = s.subscriptions.find(
    (x) => x.customerId === playerUserId && x.productId === "prod_player_solo",
  );
  if (!sub) {
    audit(
      "COUPON_APPLIED",
      {
        coupon: "COACH50",
        deferred: true,
        reason: "Player has no active solo subscription; will inject at next checkout.",
      },
      playerUserId,
      actorUserId,
    );
    return;
  }
  if (sub.couponCode === "COACH50") return; // Already applied.
  s.setSubscriptions(
    s.subscriptions.map((x) =>
      x.id === sub.id ? { ...x, couponCode: "COACH50", updatedAt: nowIso() } : x,
    ),
  );
  audit(
    "COUPON_APPLIED",
    { coupon: "COACH50", subscriptionId: sub.id },
    playerUserId,
    actorUserId,
  );
}

function sameSource(a: CoachLinkSource, b: CoachLinkSource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "COACH_PRO" && b.kind === "COACH_PRO")
    return a.coachUserId === b.coachUserId;
  if (a.kind === "TEAM_PRO" && b.kind === "TEAM_PRO") return a.teamId === b.teamId;
  return false;
}

/* ------------------------------------------------------------------ */
/* Generic entitlements                                                */
/* ------------------------------------------------------------------ */

export function grantEntitlement(
  userId: string,
  kind: EntitlementKind,
  subscriptionId?: string,
  remainingUnits?: number,
  actorUserId?: string,
): Entitlement {
  const s = useBillingStore.getState();
  const existing = s.entitlements.find(
    (e) =>
      e.userId === userId && e.kind === kind && e.state !== "revoked",
  );
  if (existing) return existing;

  const ent: Entitlement = {
    id: newId("ent"),
    userId,
    kind,
    subscriptionId,
    remainingUnits,
    state: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  s.setEntitlements([ent, ...s.entitlements]);
  audit(
    "ENTITLEMENT_GRANTED",
    { kind, subscriptionId, remainingUnits },
    userId,
    actorUserId,
  );
  return ent;
}

export function revokeEntitlement(
  userId: string,
  kind: EntitlementKind,
  grandfatheredUntil?: string,
  actorUserId?: string,
): void {
  const s = useBillingStore.getState();
  s.setEntitlements(
    s.entitlements.map((e) =>
      e.userId === userId && e.kind === kind && e.state === "active"
        ? {
            ...e,
            state: grandfatheredUntil ? "grandfathered" : "revoked",
            grandfatheredUntil,
            updatedAt: nowIso(),
          }
        : e,
    ),
  );
  audit(
    grandfatheredUntil ? "ENTITLEMENT_GRANDFATHERED" : "ENTITLEMENT_REVOKED",
    { kind, grandfatheredUntil },
    userId,
    actorUserId,
  );
}

export function checkEntitlement(
  userId: string,
  kind: EntitlementKind,
): {
  granted: boolean;
  state: Entitlement["state"] | null;
  grandfatheredUntil?: string;
  remainingUnits?: number;
} {
  const s = useBillingStore.getState();
  const ent = s.entitlements.find(
    (e) => e.userId === userId && e.kind === kind && e.state !== "revoked",
  );
  if (!ent) return { granted: false, state: null };
  return {
    granted: true,
    state: ent.state,
    grandfatheredUntil: ent.grandfatheredUntil,
    remainingUnits: ent.remainingUnits,
  };
}

/**
 * Public API: full effective billing state for a user — useful for UI
 * banners (dunning, grandfather, plan summary).
 */
export function check(userId: string): {
  subscription: Subscription | undefined;
  hasCoach50: boolean;
  coachLink: CoachLinkEntitlement | undefined;
  entitlements: Entitlement[];
} {
  const s = useBillingStore.getState();
  const subscription = s.subscriptions.find(
    (sub) => sub.customerId === userId && sub.status !== "CANCELED",
  );
  const coachLink = findActiveCoachLink(userId);
  return {
    subscription,
    hasCoach50: subscription?.couponCode === "COACH50",
    coachLink,
    entitlements: s.entitlements.filter(
      (e) => e.userId === userId && e.state !== "revoked",
    ),
  };
}
