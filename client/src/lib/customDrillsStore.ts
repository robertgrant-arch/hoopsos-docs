/**
 * Custom Drills store
 * --------------------------------------------------------------------------
 * Source of truth: Prompt 16 addendum.
 *
 * Coaches can author their own drills in the Practice Plan Builder. A custom
 * drill carries the same shape as the global drill library, plus ownership
 * metadata (`ownerCoachId`, `orgId`, `isCustom`, `visibility`).
 *
 * The store is persisted to localStorage so drills survive page refresh —
 * mirrors the "real" Postgres-backed CRUD that lives in the schema doc.
 *
 * Visibility rules:
 *   • private  → only the authoring coach sees it
 *   • org      → every coach in the same org sees it
 *   • public   → every coach in the platform sees it (admin-curated)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Drill, DrillIntensity, DrillSurface, DrillVisibility } from "@/lib/mock/practice";

export type CustomDrillInput = {
  title: string;
  description: string;
  categoryId: string;
  defaultDurationMin: number;
  intensity: DrillIntensity;
  surface: DrillSurface;
  minPlayers: number;
  maxPlayers: number;
  equipment: string[];
  coachesNeeded: number;
  videoUrl?: string;
  diagramUrl?: string;
  coachingPoints: string[];
  tags: string[];
  visibility: DrillVisibility;
};

type CustomDrillsState = {
  drills: Drill[];
  /** Create a new custom drill owned by the given coach. */
  create: (
    input: CustomDrillInput,
    ownerCoachId: string,
    orgId?: string,
  ) => Drill;
  /** Patch an existing custom drill (owner or org-admin only — UI enforces). */
  update: (drillId: string, patch: Partial<CustomDrillInput>) => void;
  /** Delete a custom drill (does NOT touch plans that already embed it). */
  remove: (drillId: string) => void;
  /** Lookup. */
  byId: (drillId: string) => Drill | undefined;
  /** All drills the given coach can see. */
  forCoach: (coachId: string, orgId?: string) => Drill[];
};

let _seq = 0;
const newId = () => `drl_custom_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

export const useCustomDrillsStore = create<CustomDrillsState>()(
  persist(
    (set, get) => ({
      drills: [],

      create: (input, ownerCoachId, orgId) => {
        const now = new Date().toISOString();
        const drill: Drill = {
          id: newId(),
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          defaultDurationMin: input.defaultDurationMin,
          intensity: input.intensity,
          surface: input.surface,
          minPlayers: input.minPlayers,
          maxPlayers: input.maxPlayers,
          equipment: input.equipment,
          coachesNeeded: input.coachesNeeded,
          videoUrl: input.videoUrl,
          diagramUrl: input.diagramUrl,
          coachingPoints: input.coachingPoints,
          tags: input.tags,
          ownerCoachId,
          orgId,
          isCustom: true,
          visibility: input.visibility,
          createdAt: now,
          updatedAt: now,
        };
        set({ drills: [drill, ...get().drills] });
        return drill;
      },

      update: (drillId, patch) => {
        set({
          drills: get().drills.map((d) =>
            d.id === drillId
              ? { ...d, ...patch, updatedAt: new Date().toISOString() }
              : d,
          ),
        });
      },

      remove: (drillId) => {
        set({ drills: get().drills.filter((d) => d.id !== drillId) });
      },

      byId: (drillId) => get().drills.find((d) => d.id === drillId),

      forCoach: (coachId, orgId) =>
        get().drills.filter((d) => {
          if (d.visibility === "public") return true;
          if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
          if (d.ownerCoachId === coachId) return true;
          return false;
        }),
    }),
    { name: "hoopsos.customDrills.v1" },
  ),
);


/* -------------------------------------------------------------------------- */
/* Unified lookup                                                              */
/* -------------------------------------------------------------------------- */

import { drillLibrary, findDrill as findGlobalDrill } from "@/lib/mock/practice";

/**
 * Resolve a drill id against (a) the global library and (b) any custom drills
 * persisted in this store. Returns `undefined` if not found anywhere.
 */
export function resolveDrill(drillId: string): Drill | undefined {
  return findGlobalDrill(drillId) ?? useCustomDrillsStore.getState().byId(drillId);
}

/**
 * Hook returning the merged list of drills available to a coach: global + their
 * private + their org's + public.
 */
export function useDrillsForCoach(coachId: string, orgId?: string): Drill[] {
  const customs = useCustomDrillsStore((s) => s.forCoach(coachId, orgId));
  return [...customs, ...drillLibrary];
}
