import { Phase, PlayerId, ResolvedFrame, Vec2 } from "./types";

/**
 * Linearly interpolate a single point along a multi-segment polyline,
 * parameterized by total path length. `t` is in [0, 1].
 */
function pointAlongPath(path: Vec2[], t: number): Vec2 {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  if (t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];

  // Pre-compute cumulative segment lengths so the player moves at a
  // constant speed regardless of how the polyline is sampled.
  let total = 0;
  const segLens: number[] = [];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const len = Math.hypot(dx, dy);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return path[path.length - 1];

  const target = total * t;
  let walked = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (walked + segLens[i] >= target) {
      const local = (target - walked) / (segLens[i] || 1);
      const a = path[i];
      const b = path[i + 1];
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    }
    walked += segLens[i];
  }
  return path[path.length - 1];
}

/**
 * Compute interpolated player positions for a given parameter `t ∈ [0, 1]`
 * across a phase. Players that participate in a `cut` or `dribble` action
 * follow that action's path; everyone else holds the position they had at
 * the start of the phase.
 *
 * `prevFrame` is the start-of-phase frame (positions before any action),
 * `nextFrame` is the end-of-phase frame (output of resolver), and `phase`
 * is the phase whose actions are being animated.
 */
export function tween(
  prevFrame: ResolvedFrame,
  nextFrame: ResolvedFrame,
  phase: Phase,
  t: number,
): Record<PlayerId, Vec2> {
  // Build a quick lookup of which player is currently being moved by which
  // action. If a player has multiple cut/dribble actions in one phase
  // (rare, but legal), use the last one — matches the resolver's behavior.
  const moversByPlayer = new Map<PlayerId, Vec2[]>();
  for (const a of phase.actions) {
    if (a.kind === "cut" || a.kind === "dribble") {
      moversByPlayer.set(a.player, a.path);
    } else if (a.kind === "handoff") {
      // Both participants converge on `at`. Treat them as moving from their
      // start position to `at` for the duration of the phase.
      const startA = prevFrame.positions[a.from];
      const startB = prevFrame.positions[a.to];
      if (startA) moversByPlayer.set(a.from, [startA, a.at]);
      if (startB) moversByPlayer.set(a.to, [startB, a.at]);
    } else if (a.kind === "screen") {
      const start = prevFrame.positions[a.screener];
      if (start) moversByPlayer.set(a.screener, [start, a.at]);
    }
    // pass: doesn't move players, only the ball — handled separately if needed.
  }

  const out: Record<PlayerId, Vec2> = {};
  const seen: Record<PlayerId, true> = {};
  const allIds: PlayerId[] = [];
  for (const k of Object.keys(prevFrame.positions)) {
    if (!seen[k]) {
      seen[k] = true;
      allIds.push(k);
    }
  }
  for (const k of Object.keys(nextFrame.positions)) {
    if (!seen[k]) {
      seen[k] = true;
      allIds.push(k);
    }
  }
  const safeT = t < 0 ? 0 : t > 1 ? 1 : t;

  for (let i = 0; i < allIds.length; i++) {
    const pid = allIds[i];
    const path = moversByPlayer.get(pid);
    if (path && path.length >= 1) {
      out[pid] = pointAlongPath(path, safeT);
      continue;
    }
    // Static player: hold the prev-frame position; if absent, use next.
    out[pid] = prevFrame.positions[pid] ?? nextFrame.positions[pid];
  }
  return out;
}
