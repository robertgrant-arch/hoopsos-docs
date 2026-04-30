/**
 * Playback hook — animates a play across all phases.
 *
 * Strategy: for each consecutive pair of phases, interpolate every token's
 * (x,y) from frame N to N+1. Uses requestAnimationFrame.
 */
import { useEffect, useRef, useState } from "react";
import type { Play, PlayToken } from "@/lib/mock/playbook";

export type PlaybackState = {
  isPlaying: boolean;
  /** Current "global" time in [0, totalSegments] where each segment is one phase transition. */
  cursor: number;
  /** Current rendered tokens (interpolated). */
  tokens: PlayToken[];
  /** Index of the phase we're currently *into* (segment from phase[i] → phase[i+1]). */
  segmentIndex: number;
};

const SEGMENT_DURATION_MS = 1400;

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

export function usePlayback(play: Play | undefined): PlaybackState & {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setCursor: (c: number) => void;
} {
  const [isPlaying, setPlaying] = useState(false);
  const [cursor, setCursorState] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const segments = (play?.phases.length ?? 1) - 1;

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !play) return;
    function loop(ts: number) {
      const last = lastTsRef.current ?? ts;
      const dt = ts - last;
      lastTsRef.current = ts;
      setCursorState((prev) => {
        const next = prev + dt / SEGMENT_DURATION_MS;
        if (next >= segments) {
          setPlaying(false);
          lastTsRef.current = null;
          return segments;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [isPlaying, play, segments]);

  const segmentIndex = Math.min(segments - 1, Math.max(0, Math.floor(cursor)));
  const t = cursor - segmentIndex;

  let tokens: PlayToken[] = play?.phases[0]?.tokens ?? [];
  if (play && play.phases.length > 0) {
    if (segments <= 0) {
      tokens = play.phases[0].tokens;
    } else if (cursor >= segments) {
      tokens = play.phases[segments].tokens;
    } else {
      tokens = interpolate(play.phases[segmentIndex].tokens, play.phases[segmentIndex + 1].tokens, t);
    }
  }

  return {
    isPlaying,
    cursor,
    tokens,
    segmentIndex,
    play: () => {
      if (cursor >= segments) setCursorState(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    reset: () => {
      setPlaying(false);
      setCursorState(0);
    },
    setCursor: (c) => setCursorState(c),
  };
}
