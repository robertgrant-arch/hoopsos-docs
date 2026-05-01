import { useSyncExternalStore } from 'react';
import {
  PlaybookSnapshot,
  PlaybookSnapshotSchema,
  Phase,
  PhaseId,
  Token,
  PlayPath,
} from './schema';

/**
 * Enterprise Playbook Store v2
 *
 * Tree-based undo/redo (branches preserved, not a linear stack).
 * Schema-validated optimistic edits. Telemetry marks on every transition.
 * State machine modes: idle | drafting | saving | playing | exporting | conflict.
 *
 * NOTE: This is the SPEC-compliant scaffold matching the Manus v2 architecture
 * brief. Replace with full XState v5 actor implementation in follow-up commit.
 */

export type StoreMode = 'idle' | 'drafting' | 'saving' | 'playing' | 'exporting' | 'conflict';

export interface HistoryNode {
  id: string;
  parentId: string | null;
  childIds: string[];
  snapshot: PlaybookSnapshot;
  createdAt: number;
  label?: string;
}

export interface PlaybookState {
  mode: StoreMode;
  current: PlaybookSnapshot;
  history: Record<string, HistoryNode>;
  currentNodeId: string;
  rootNodeId: string;
}

type Listener = () => void;

function telemetry(event: string, payload?: Record<string, unknown>) {
  if (typeof performance !== 'undefined' && 'mark' in performance) {
    try { performance.mark('playbook:' + event); } catch { /* noop */ }
  }
  if (typeof console !== 'undefined' && (globalThis as any).__PLAYBOOK_DEBUG__) {
    console.debug('[playbook]', event, payload);
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'h_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class PlaybookStore {
  private state: PlaybookState;
  private listeners = new Set<Listener>();

  constructor(initial: PlaybookSnapshot) {
    PlaybookSnapshotSchema.parse(initial);
    const rootId = makeId();
    const root: HistoryNode = {
      id: rootId,
      parentId: null,
      childIds: [],
      snapshot: initial,
      createdAt: Date.now(),
      label: 'init',
    };
    this.state = {
      mode: 'idle',
      current: initial,
      history: { [rootId]: root },
      currentNodeId: rootId,
      rootNodeId: rootId,
    };
    telemetry('init');
  }

  getState = (): PlaybookState => this.state;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private emit() {
    Array.from(this.listeners).forEach(l => l());
  }

  private setMode(mode: StoreMode) {
    if (this.state.mode === mode) return;
    this.state = { ...this.state, mode };
    telemetry('mode:' + mode);
    this.emit();
  }

  private commitSnapshot(next: PlaybookSnapshot, label?: string) {
    PlaybookSnapshotSchema.parse(next);
    const id = makeId();
    const parent = this.state.history[this.state.currentNodeId];
    const node: HistoryNode = { id, parentId: parent.id, childIds: [], snapshot: next, createdAt: Date.now(), label };
    parent.childIds.push(id);
    this.state = {
      ...this.state,
      current: next,
      history: { ...this.state.history, [parent.id]: parent, [id]: node },
      currentNodeId: id,
    };
    telemetry('commit', { label });
    this.emit();
  }

  beginDraft = () => this.setMode('drafting');
  beginSave = () => this.setMode('saving');
  beginPlay = () => this.setMode('playing');
  beginExport = () => this.setMode('exporting');
  flagConflict = () => this.setMode('conflict');
  resolveToIdle = () => this.setMode('idle');

  setActivePhase = (phaseId: PhaseId | null) => {
    const next: PlaybookSnapshot = {
      ...this.state.current,
      editorState: { ...this.state.current.editorState, activePhaseId: phaseId },
    };
    this.commitSnapshot(next, 'set-active-phase');
  };

  upsertPhase = (phase: Phase) => {
    const phases = this.state.current.play.phases;
    const idx = phases.findIndex(p => p.id === phase.id);
    const nextPhases = idx >= 0 ? phases.map(p => (p.id === phase.id ? phase : p)) : [...phases, phase];
    const next: PlaybookSnapshot = {
      ...this.state.current,
      play: { ...this.state.current.play, phases: nextPhases },
    };
    this.commitSnapshot(next, 'upsert-phase');
  };

  upsertToken = (phaseId: PhaseId, token: Token) => {
    const next = mapPhase(this.state.current, phaseId, p => {
      const idx = p.tokens.findIndex(t => t.id === token.id);
      const tokens = idx >= 0 ? p.tokens.map(t => (t.id === token.id ? token : t)) : [...p.tokens, token];
      return { ...p, tokens };
    });
    this.commitSnapshot(next, 'upsert-token');
  };

  upsertPath = (phaseId: PhaseId, pathItem: PlayPath) => {
    const next = mapPhase(this.state.current, phaseId, p => {
      const idx = p.paths.findIndex(x => x.id === pathItem.id);
      const paths = idx >= 0 ? p.paths.map(x => (x.id === pathItem.id ? pathItem : x)) : [...p.paths, pathItem];
      return { ...p, paths };
    });
    this.commitSnapshot(next, 'upsert-path');
  };

  undo = () => {
    const node = this.state.history[this.state.currentNodeId];
    if (!node.parentId) return;
    const parent = this.state.history[node.parentId];
    this.state = { ...this.state, current: parent.snapshot, currentNodeId: parent.id };
    telemetry('undo');
    this.emit();
  };

  redo = (childId?: string) => {
    const node = this.state.history[this.state.currentNodeId];
    if (node.childIds.length === 0) return;
    const target = childId && node.childIds.includes(childId) ? childId : node.childIds[node.childIds.length - 1];
    const child = this.state.history[target];
    this.state = { ...this.state, current: child.snapshot, currentNodeId: child.id };
    telemetry('redo', { branch: childId ?? null });
    this.emit();
  };

  canUndo = (): boolean => this.state.history[this.state.currentNodeId].parentId !== null;
  canRedo = (): boolean => this.state.history[this.state.currentNodeId].childIds.length > 0;
}

function mapPhase(snap: PlaybookSnapshot, phaseId: PhaseId, fn: (p: Phase) => Phase): PlaybookSnapshot {
  return {
    ...snap,
    play: { ...snap.play, phases: snap.play.phases.map(p => (p.id === phaseId ? fn(p) : p)) },
  };
}

// React hook
let __singleton: PlaybookStore | null = null;
export function getPlaybookStore(initial?: PlaybookSnapshot): PlaybookStore {
  if (!__singleton) {
    if (!initial) throw new Error('getPlaybookStore: must provide initial snapshot on first call');
    __singleton = new PlaybookStore(initial);
  }
  return __singleton;
}
export function usePlaybookStore<T>(selector: (s: PlaybookState) => T): T {
  const store = getPlaybookStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));
}
export const usePlaybookCanUndo = () => usePlaybookStore(s => s.history[s.currentNodeId].parentId !== null);
export const usePlaybookCanRedo = () => usePlaybookStore(s => s.history[s.currentNodeId].childIds.length > 0);
