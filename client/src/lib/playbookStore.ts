/**
 * Playbook editing store. Holds all plays, phases, tokens, paths, versions.
 * Persisted to localStorage so edits survive a page reload.
 *
 * In production this maps to:
 *   PUT /api/plays/:id           (update meta)
 *   POST /api/plays/:id/phases   (insert phase)
 *   PUT /api/plays/:id/phases/:phaseId  (update tokens/paths)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  allPlays,
  clonePhaseFromFormation,
  type Play,
  type PlayPath,
  type PlayPhase,
  type PlayToken,
  type PhaseLabel,
  type CourtType,
} from "@/lib/mock/playbook";

export type PlayVersion = {
  id: string;
  label: string;
  savedAt: string;
  authorName: string;
  snapshot: Play;
};

type PlaybookState = {
  plays: Play[];
  versionHistory: Record<string, PlayVersion[]>; // playId → versions

  // selection / editor
  selectedPlayId: string | null;
  selectedPhaseId: string | null;
  selectedTokenId: string | null;
  selectedPathId: string | null;

  setSelectedPlay: (id: string | null) => void;
  setSelectedPhase: (id: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  setSelectedPath: (id: string | null) => void;

  // play CRUD
  createPlay: (overrides?: Partial<Play>) => string;
  duplicatePlay: (id: string) => string;
  deletePlay: (id: string) => void;
  updatePlayMeta: (id: string, patch: Partial<Play>) => void;

  // phases
  addPhase: (playId: string, fromFormationId?: string) => string;
  duplicatePhase: (playId: string, phaseId: string) => string;
  deletePhase: (playId: string, phaseId: string) => void;
  updatePhase: (playId: string, phaseId: string, patch: Partial<PlayPhase>) => void;
  reorderPhase: (playId: string, fromIndex: number, toIndex: number) => void;

  // tokens
  addToken: (playId: string, phaseId: string, token: Omit<PlayToken, "id">) => void;
  updateToken: (playId: string, phaseId: string, tokenId: string, patch: Partial<PlayToken>) => void;
  removeToken: (playId: string, phaseId: string, tokenId: string) => void;

  // paths
  addPath: (playId: string, phaseId: string, path: Omit<PlayPath, "id">) => string;
  updatePath: (playId: string, phaseId: string, pathId: string, patch: Partial<PlayPath>) => void;
  removePath: (playId: string, phaseId: string, pathId: string) => void;

  // versioning
  saveVersion: (playId: string, label?: string) => void;
  restoreVersion: (playId: string, versionId: string) => void;

  // resets
  resetAll: () => void;
};

function bumpUpdated(p: Play): Play {
  return { ...p, updatedAt: new Date().toISOString() };
}

export const usePlaybook = create<PlaybookState>()(
  persist(
    (set, get) => ({
      plays: JSON.parse(JSON.stringify(allPlays)),
      versionHistory: {},
      selectedPlayId: allPlays[0]?.id ?? null,
      selectedPhaseId: allPlays[0]?.phases[0]?.id ?? null,
      selectedTokenId: null,
      selectedPathId: null,

      setSelectedPlay: (id) => {
        const play = id ? get().plays.find((p) => p.id === id) : null;
        set({
          selectedPlayId: id,
          selectedPhaseId: play?.phases[0]?.id ?? null,
          selectedTokenId: null,
          selectedPathId: null,
        });
      },
      setSelectedPhase: (id) => set({ selectedPhaseId: id, selectedTokenId: null, selectedPathId: null }),
      setSelectedToken: (id) => set({ selectedTokenId: id, selectedPathId: null }),
      setSelectedPath: (id) => set({ selectedPathId: id, selectedTokenId: null }),

      createPlay: (overrides = {}) => {
        const id = `play_${nanoid(6)}`;
        const now = new Date().toISOString();
        const newPlay: Play = {
          id,
          playbookId: "pb_varsity",
          title: "Untitled Play",
          description: "",
          courtType: "HALF",
          category: "PRIMARY",
          tags: [],
          createdAt: now,
          updatedAt: now,
          versionLabel: "v0.1",
          phases: [
            {
              id: `ph_${nanoid(5)}`,
              order: 0,
              phase: "ENTRY" as PhaseLabel,
              notes: "Starting alignment.",
              tokens: clonePhaseFromFormation("fmt_5out").tokens,
              paths: [],
            },
          ],
          ...overrides,
        };
        set({ plays: [newPlay, ...get().plays], selectedPlayId: id, selectedPhaseId: newPlay.phases[0].id });
        return id;
      },

      duplicatePlay: (id) => {
        const src = get().plays.find((p) => p.id === id);
        if (!src) return id;
        const newId = `play_${nanoid(6)}`;
        const now = new Date().toISOString();
        const copy: Play = {
          ...JSON.parse(JSON.stringify(src)),
          id: newId,
          title: `${src.title} (copy)`,
          createdAt: now,
          updatedAt: now,
          phases: src.phases.map((ph) => ({
            ...JSON.parse(JSON.stringify(ph)),
            id: `ph_${nanoid(5)}`,
          })),
        };
        set({ plays: [copy, ...get().plays], selectedPlayId: newId, selectedPhaseId: copy.phases[0]?.id ?? null });
        return newId;
      },

      deletePlay: (id) => {
        const next = get().plays.filter((p) => p.id !== id);
        const newSel = next[0] ?? null;
        set({
          plays: next,
          selectedPlayId: newSel?.id ?? null,
          selectedPhaseId: newSel?.phases[0]?.id ?? null,
        });
      },

      updatePlayMeta: (id, patch) => {
        set({
          plays: get().plays.map((p) => (p.id === id ? bumpUpdated({ ...p, ...patch }) : p)),
        });
      },

      addPhase: (playId, fromFormationId) => {
        const phaseId = `ph_${nanoid(5)}`;
        set({
          plays: get().plays.map((p) => {
            if (p.id !== playId) return p;
            const last = p.phases[p.phases.length - 1];
            const base =
              fromFormationId
                ? clonePhaseFromFormation(fromFormationId)
                : { tokens: JSON.parse(JSON.stringify(last?.tokens ?? [])), paths: [] };
            const phase: PlayPhase = {
              id: phaseId,
              order: p.phases.length,
              phase: "READ_1" as PhaseLabel,
              notes: "",
              tokens: base.tokens,
              paths: base.paths,
            };
            return bumpUpdated({ ...p, phases: [...p.phases, phase] });
          }),
          selectedPhaseId: phaseId,
        });
        return phaseId;
      },

      duplicatePhase: (playId, phaseId) => {
        const newId = `ph_${nanoid(5)}`;
        set({
          plays: get().plays.map((p) => {
            if (p.id !== playId) return p;
            const idx = p.phases.findIndex((ph) => ph.id === phaseId);
            if (idx === -1) return p;
            const src = p.phases[idx];
            const copy: PlayPhase = {
              ...JSON.parse(JSON.stringify(src)),
              id: newId,
              order: idx + 1,
              notes: src.notes ? `${src.notes} (copy)` : "",
            };
            const phases = [...p.phases.slice(0, idx + 1), copy, ...p.phases.slice(idx + 1)].map((ph, i) => ({
              ...ph,
              order: i,
            }));
            return bumpUpdated({ ...p, phases });
          }),
          selectedPhaseId: newId,
        });
        return newId;
      },

      deletePhase: (playId, phaseId) => {
        let nextPhase: string | null = null;
        set({
          plays: get().plays.map((p) => {
            if (p.id !== playId) return p;
            if (p.phases.length <= 1) return p; // keep at least one
            const idx = p.phases.findIndex((ph) => ph.id === phaseId);
            const phases = p.phases.filter((ph) => ph.id !== phaseId).map((ph, i) => ({ ...ph, order: i }));
            nextPhase = phases[Math.max(0, idx - 1)]?.id ?? null;
            return bumpUpdated({ ...p, phases });
          }),
        });
        if (nextPhase) set({ selectedPhaseId: nextPhase });
      },

      updatePhase: (playId, phaseId, patch) => {
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, ...patch } : ph)),
                })
          ),
        });
      },

      reorderPhase: (playId, fromIndex, toIndex) => {
        set({
          plays: get().plays.map((p) => {
            if (p.id !== playId) return p;
            const phases = [...p.phases];
            const [m] = phases.splice(fromIndex, 1);
            phases.splice(toIndex, 0, m);
            return bumpUpdated({ ...p, phases: phases.map((ph, i) => ({ ...ph, order: i })) });
          }),
        });
      },

      addToken: (playId, phaseId, token) => {
        const id = `tk_${nanoid(5)}`;
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id === phaseId ? { ...ph, tokens: [...ph.tokens, { ...token, id }] } : ph
                  ),
                })
          ),
          selectedTokenId: id,
        });
      },

      updateToken: (playId, phaseId, tokenId, patch) => {
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id !== phaseId
                      ? ph
                      : { ...ph, tokens: ph.tokens.map((t) => (t.id === tokenId ? { ...t, ...patch } : t)) }
                  ),
                })
          ),
        });
      },

      removeToken: (playId, phaseId, tokenId) => {
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id !== phaseId
                      ? ph
                      : {
                          ...ph,
                          tokens: ph.tokens.filter((t) => t.id !== tokenId),
                          paths: ph.paths.filter((pa) => pa.startTokenId !== tokenId && pa.endTokenId !== tokenId),
                        }
                  ),
                })
          ),
          selectedTokenId: null,
        });
      },

      addPath: (playId, phaseId, path) => {
        const id = `pa_${nanoid(5)}`;
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id === phaseId ? { ...ph, paths: [...ph.paths, { ...path, id }] } : ph
                  ),
                })
          ),
          selectedPathId: id,
        });
        return id;
      },

      updatePath: (playId, phaseId, pathId, patch) => {
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id !== phaseId
                      ? ph
                      : { ...ph, paths: ph.paths.map((pa) => (pa.id === pathId ? { ...pa, ...patch } : pa)) }
                  ),
                })
          ),
        });
      },

      removePath: (playId, phaseId, pathId) => {
        set({
          plays: get().plays.map((p) =>
            p.id !== playId
              ? p
              : bumpUpdated({
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id !== phaseId ? ph : { ...ph, paths: ph.paths.filter((pa) => pa.id !== pathId) }
                  ),
                })
          ),
          selectedPathId: null,
        });
      },

      saveVersion: (playId, label) => {
        const play = get().plays.find((p) => p.id === playId);
        if (!play) return;
        const v: PlayVersion = {
          id: `v_${nanoid(5)}`,
          label: label ?? `v${(get().versionHistory[playId]?.length ?? 0) + 1}`,
          savedAt: new Date().toISOString(),
          authorName: "Coach Daniels",
          snapshot: JSON.parse(JSON.stringify(play)),
        };
        set({
          versionHistory: {
            ...get().versionHistory,
            [playId]: [v, ...(get().versionHistory[playId] ?? [])],
          },
          plays: get().plays.map((p) => (p.id === playId ? bumpUpdated({ ...p, versionLabel: v.label }) : p)),
        });
      },

      restoreVersion: (playId, versionId) => {
        const v = (get().versionHistory[playId] ?? []).find((x) => x.id === versionId);
        if (!v) return;
        set({
          plays: get().plays.map((p) => (p.id === playId ? { ...v.snapshot, updatedAt: new Date().toISOString() } : p)),
          selectedPhaseId: v.snapshot.phases[0]?.id ?? null,
        });
      },

      resetAll: () =>
        set({
          plays: JSON.parse(JSON.stringify(allPlays)),
          versionHistory: {},
          selectedPlayId: allPlays[0]?.id ?? null,
          selectedPhaseId: allPlays[0]?.phases[0]?.id ?? null,
        }),
    }),
    {
      name: "hoopsos-playbook",
      version: 1,
    }
  )
);

export type { CourtType };
