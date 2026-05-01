/**
 * usePlayback — animates a play across phase transitions.
 *
 * Stable across tab blur/focus:
 *   • RAF delta is clamped (max ~64ms) so a long background freeze never
 *     fast-forwards to the end on the next wakeup frame.
 *   • document.hidden cancels the loop entirely; resume is explicit and
 *     resets the timing reference.
 *   • Phases are sorted by `order` so reorder UX matches playback.
 *   • onPhaseChange fires only on phase boundary transitions, never every
 *     frame.
 *   • Public API: play / pause / stop / seekPhase / getCursor.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Play, PlayToken } from "@/lib/mock/playbookSchema";

export type PlaybackState = {
  isPlaying: boolean;
  /** Current global cursor in [0, totalSegments]. */
  cursor: number;
  /** Interpolated tokens for the current render frame. */
  tokens: PlayToken[];
  /** Current segment index for the cursor (0-based phase index). */
  segmentIndex: number;
};

const SEGMENT_DURATION_MS = 1400;
/** Hard ceiling on per-frame elapsed time. Anything bigger is treated as a
 *  resume from background and the timer reference is reset. */
const MAX_FRAME_DELTA_MS = 64;

function interpolate(a: PlayToken[], b: PlayToken[], t: number): PlayToken[] {
  const byId = new Map(b.map((tk) => [tk.id, tk]));
  return a.map((tk) => {
    const target = byId.get(tk.id) ?? tk;
    return {
      ...tk,
      x: tk.x + (target.x - tk.x) * t,
      y: tk.y + (target.y - tk.y) * t,
    };
  });
}

export type UsePlaybackOptions = {
  onPhaseChange?: (phaseIndex: number) => void;
};

export type UsePlaybackReturn = PlaybackState & {
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setCursor: (c: number) => void;
  seekPhase: (phaseIndex: number) => void;
  getCursor: () => number;
};

export function usePlayback(
  play: Play | undefined,
  opts: UsePlaybackOptions = {},
): UsePlaybackReturn {
  const { onPhaseChange } = opts;
  const [isPlaying, setPlaying] = useState(false);
  const [cursor, setCursorState] = useState(0);
  const cursorRef = useRef(0);
  cursorRef.current = cursor;
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<number>(0);

  // Phases sorted by order — defensive, since the store guarantees it but
  // a corrupt blob could in theory feed us out-of-order data.
  const sortedPhases = useMemo(() => {
    if (!play) return [];
    return [...play.phases].sort((a, b) => a.order - b.order);
  }, [play]);

  const segments = Math.max(0, sortedPhases.length - 1);

  /* ---------- visibility handling ---------- */
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        // Pause the loop and forget the timing reference.
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTsRef.current = null;
        // We do NOT flip isPlaying here so the user's intent to be playing
        // is preserved; the loop effect will restart on visible.
      } else if (document.visibilityState === "visible") {
        lastTsRef.current = null; // reset so first frame after wake has dt=0
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /* ---------- main loop ---------- */
  useEffect(() => {
    if (!isPlaying || !play || segments <= 0) return;
    let cancelled = false;

    function loop(ts: number) {
      if (cancelled) return;
      if (document.hidden) {
        // Stay silent until visibility flips back.
        rafRef.current = null;
        lastTsRef.current = null;
        return;
      }
      const lastTs = lastTsRef.current;
      let dt = lastTs == null ? 0 : ts - lastTs;
      if (dt > MAX_FRAME_DELTA_MS) dt = 0; // resume from background
      lastTsRef.current = ts;
      const next = cursorRef.current + dt / SEGMENT_DURATION_MS;

      if (next >= segments) {
        cursorRef.current = segments;
        setCursorState(segments);
        setPlaying(false);
        lastTsRef.current = null;
        rafRef.current = null;
        return;
      }
      cursorRef.current = next;
      setCursorState(next);
      rafRef.current = requestAnimationFrame(loop);
    }

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, play, segments]);

  /* ---------- phase transition callback ---------- */
  const segmentIndex = useMemo(
    () => Math.min(Math.max(0, segments - 1), Math.max(0, Math.floor(cursor))),
    [cursor, segments],
  );
  useEffect(() => {
    if (lastPhaseRef.current !== segmentIndex) {
      lastPhaseRef.current = segmentIndex;
      onPhaseChange?.(segmentIndex);
    }
  }, [segmentIndex, onPhaseChange]);

  /* ---------- derived tokens ---------- */
  const t = cursor - segmentIndex;
  const tokens = useMemo<PlayToken[]>(() => {
    if (!sortedPhases.length) return [];
    if (segments <= 0) return sortedPhases[0].tokens;
    if (cursor >= segments) return sortedPhases[segments].tokens;
    return interpolate(
      sortedPhases[segmentIndex].tokens,
      sortedPhases[segmentIndex + 1].tokens,
      t,
    );
  }, [sortedPhases, segments, cursor, segmentIndex, t]);

  /* ---------- public API ---------- */
  const playFn = useCallback(() => {
    if (cursorRef.current >= segments) {
      cursorRef.current = 0;
      setCursorState(0);
    }
    setPlaying(true);
  }, [segments]);

  const pause = useCallback(() => setPlaying(false), []);

  const stop = useCallback(() => {
    setPlaying(false);
    cursorRef.current = 0;
    setCursorState(0);
  }, []);

  const reset = stop;

  const setCursor = useCallback((c: number) => {
    const safe = Number.isFinite(c) ? Math.max(0, Math.min(segments, c)) : 0;
    cursorRef.current = safe;
    setCursorState(safe);
  }, [segments]);

  const seekPhase = useCallback(
    (phaseIndex: number) => {
      if (!Number.isFinite(phaseIndex)) return;
      const safe = Math.max(0, Math.min(Math.max(0, sortedPhases.length - 1), Math.floor(phaseIndex)));
      cursorRef.current = safe;
      setCursorState(safe);
    },
    [sortedPhases.length],
  );

  const getCursor = useCallback(() => cursorRef.current, []);

  return {
    isPlaying,
    cursor,
    tokens,
    segmentIndex,
    play: playFn,
    pause,
    stop,
    reset,
    setCursor,
    seekPhase,
    getCursor,
  };
}
