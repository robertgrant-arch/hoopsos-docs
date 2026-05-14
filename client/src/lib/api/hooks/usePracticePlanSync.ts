import { useEffect, useRef } from "react";
import { usePracticePlans } from "@/lib/practicePlanStore";
import { apiGet, apiPost, apiPatch } from "../client";
import type { PracticePlan as LocalPlan } from "@/lib/mock/practice";

type ServerPlan = {
  id: string;
  title: string;
  scheduledAt: string | null;
  status: string;
  durationMins: number | null;
  payload: unknown;
  coachNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

function serverToLocal(s: ServerPlan): LocalPlan {
  const p = (s.payload ?? {}) as Partial<LocalPlan>;
  const rawStatus = s.status.toUpperCase();
  const status: LocalPlan["status"] =
    rawStatus === "PUBLISHED" || rawStatus === "ARCHIVED" ? rawStatus : "DRAFT";
  return {
    id: s.id,
    title: s.title,
    date: p.date ?? s.scheduledAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    startTime: p.startTime ?? "16:00",
    budgetMin: p.budgetMin ?? s.durationMins ?? 90,
    focus: p.focus ?? s.coachNotes ?? "",
    authorId: p.authorId ?? "",
    authorName: p.authorName ?? "",
    status,
    blocks: p.blocks ?? [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function toServerPatch(plan: LocalPlan) {
  return {
    title: plan.title,
    status: plan.status.toLowerCase(),
    scheduledAt: `${plan.date}T${plan.startTime}:00`,
    durationMins: plan.budgetMin,
    coachNotes: plan.focus || null,
    payload: plan,
  };
}

/**
 * Syncs practice plans between the local Zustand store and the server API.
 *
 * On mount: fetches from /api/practice-plans and replaces local plans if the
 * server has any (so a plan created on desktop appears on mobile).
 *
 * On every plan change: debounced (1.5s) PATCH/POST to keep the server current.
 *
 * Gracefully falls back to localStorage-only mode if the API is unavailable.
 */
export function usePracticePlanSync() {
  const plans = usePracticePlans((s) => s.plans);
  const loadFromServer = usePracticePlans((s) => s.loadFromServer);
  const updatePlanId = usePracticePlans((s) => s.updatePlanId);

  const hasSynced = useRef(false);
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Maps local "plan_xxx" IDs to server-assigned IDs after first POST
  const idMap = useRef(new Map<string, string>());

  // Initial fetch — load server plans once
  useEffect(() => {
    if (hasSynced.current) return;
    apiGet<ServerPlan[]>("/practice-plans")
      .then((serverPlans) => {
        hasSynced.current = true;
        if (serverPlans.length > 0) {
          loadFromServer(serverPlans.map(serverToLocal));
        }
      })
      .catch(() => {
        hasSynced.current = true; // API unavailable — keep localStorage mode
      });
  }, [loadFromServer]);

  // Auto-save on changes (debounced per plan)
  useEffect(() => {
    if (!hasSynced.current) return;

    for (const plan of plans) {
      const existing = saveTimers.current.get(plan.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        try {
          const serverId = idMap.current.get(plan.id);
          const isLocalOnly = plan.id.startsWith("plan_") && !serverId;

          if (isLocalOnly) {
            // First save for this plan — create on server
            const created = await apiPost<ServerPlan>("/practice-plans", toServerPatch(plan));
            idMap.current.set(plan.id, created.id);
            updatePlanId(plan.id, created.id);
          } else {
            const targetId = serverId ?? plan.id;
            await apiPatch(`/practice-plans/${targetId}`, toServerPatch(plan));
          }
        } catch {
          // Silent — localStorage keeps data safe
        }
        saveTimers.current.delete(plan.id);
      }, 1500);

      saveTimers.current.set(plan.id, timer);
    }
  }, [plans, updatePlanId]);
}
