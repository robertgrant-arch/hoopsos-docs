import { useEffect, useRef } from "react";
import { usePracticePlans } from "@/lib/practicePlanStore";
import type { PracticePlan } from "@/lib/mock/practice";

/**
 * Syncs the local Zustand practice-plan store to/from the server so plans
 * created on one device appear on all others.
 *
 * Uses /api/plans — a standalone Neon function that requires no Clerk auth,
 * just a userId string. Falls back silently to localStorage if the DB is
 * unavailable (returns 503).
 *
 * Call this once inside CoachPracticePlanBuilder, passing the current user's id.
 */
export function usePracticePlanSync(userId: string | null | undefined) {
  const plans = usePracticePlans((s) => s.plans);
  const loadFromServer = usePracticePlans((s) => s.loadFromServer);

  const hasSynced = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount (or when userId becomes available): pull from server
  useEffect(() => {
    if (!userId || hasSynced.current) return;

    fetch(`/api/plans?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((body: { plans: PracticePlan[] | null }) => {
        hasSynced.current = true;
        if (Array.isArray(body.plans) && body.plans.length > 0) {
          loadFromServer(body.plans);
        }
      })
      .catch(() => {
        hasSynced.current = true; // DB unavailable — stay in localStorage mode
      });
  }, [userId, loadFromServer]);

  // Debounced auto-save: write the whole plans array on every change
  useEffect(() => {
    if (!userId || !hasSynced.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plans }),
      }).catch(() => {}); // silent — localStorage is still there as fallback
    }, 1500);
  }, [plans, userId]);
}
