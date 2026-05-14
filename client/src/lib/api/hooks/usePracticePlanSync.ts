import { useEffect, useRef } from "react";
import { usePracticePlans } from "@/lib/practicePlanStore";
import type { PracticePlan } from "@/lib/mock/practice";

function pushToServer(userId: string, plans: PracticePlan[]) {
  return fetch("/api/plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, plans }),
  }).catch(() => {});
}

/**
 * Syncs the local Zustand practice-plan store to/from the server so plans
 * created on one device appear on all others.
 *
 * Flow:
 *   1. On mount: GET /api/plans?userId=xxx
 *      - Server has plans  → replace local store (phone picks up desktop plans)
 *      - Server is empty   → immediately push local plans up (bootstraps the server)
 *   2. On every plans change: debounced PUT keeps server in sync
 */
export function usePracticePlanSync(userId: string | null | undefined) {
  const plans = usePracticePlans((s) => s.plans);
  const loadFromServer = usePracticePlans((s) => s.loadFromServer);

  const hasSynced = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial pull — runs once when userId is available
  useEffect(() => {
    if (!userId || hasSynced.current) return;

    fetch(`/api/plans?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((body: { plans: PracticePlan[] | null }) => {
        hasSynced.current = true;

        if (Array.isArray(body.plans) && body.plans.length > 0) {
          // Server has plans — load them (phone gets desktop plans)
          loadFromServer(body.plans);
        } else {
          // Server is empty — push local plans up immediately.
          // We can't rely on the auto-save effect because hasSynced is a ref
          // and changing it doesn't trigger a re-render/re-run.
          const localPlans = usePracticePlans.getState().plans;
          if (localPlans.length > 0) {
            pushToServer(userId, localPlans);
          }
        }
      })
      .catch(() => {
        hasSynced.current = true; // DB unavailable — stay in localStorage mode
      });
  }, [userId, loadFromServer]);

  // Debounced auto-save on every subsequent change
  useEffect(() => {
    if (!userId || !hasSynced.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      pushToServer(userId, plans);
    }, 1500);
  }, [plans, userId]);
}
