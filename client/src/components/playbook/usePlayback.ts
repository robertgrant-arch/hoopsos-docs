/**
 * Playback hook — animates a play across phase transitions.
 *
 * Uses requestAnimationFrame with stable time tracking so hidden tab
 * visibility does not desynchronize playback.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Play, PlayToken } from "@/lib/mock/playbook";

export type PlaybackState = {
  isPlaying: boolean;
  /** Current global cursor in [0, totalSegments]. */
  cursor: number;
  /** Interpolated tokens for the current render frame. */
  tokens: PlayToken[];
  /** Current segment index for the cursor. */
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

  const segments = Math.max(0, (play?.phases.length ?? 1) - 1);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastTsRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!isPlaying || !play) return;

    function loop(ts: number) {
      const lastTs = lastTsRef.current ?? ts;
      lastTsRef.current = ts;
      setCursorState((prev) => {
        const next = prev + (ts - lastTs) / SEGMENT_DURATION_MS;
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
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, play, segments]);

  const segmentIndex = useMemo(() => Math.min(segments - 1, Math.max(0, Math.floor(cursor))), [cursor, segments]);
  const t = cursor - segmentIndex;

  const tokens = useMemo<PlayToken[]>(() => {
    if (!play?.phases.length) return [];
    if (segments <= 0) return play.phases[0].tokens;
    if (cursor >= segments) return play.phases[segments].tokens;
    return interpolate(play.phases[segmentIndex].tokens, play.phases[segmentIndex + 1].tokens, t);
  }, [play, segments, cursor, segmentIndex, t]);

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
