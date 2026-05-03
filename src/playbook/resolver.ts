import { Play, Phase, ResolvedFrame, PlayerId, Vec2 } from "./types";

const last = <T,>(a: T[]): T => a[a.length - 1];

export function endFrame(phase: Phase, start: ResolvedFrame): ResolvedFrame {
  const positions: Record<PlayerId, Vec2> = { ...start.positions };
  let ballHolder = start.ballHolder;
  for (const a of phase.actions) {
    switch (a.kind) {
      case "cut":
      case "dribble":
        positions[a.player] = last(a.path);
        if (a.kind === "dribble") ballHolder = a.player;
        break;
      case "pass":
        ballHolder = a.to;
        break;
      case "screen":
        positions[a.screener] = a.at;
        break;
      case "handoff":
        positions[a.from] = a.at;
        positions[a.to] = a.at;
        ballHolder = a.to;
        break;
    }
  }
  return { positions, ballHolder };
}

export function resolvePlay(play: Play): ResolvedFrame[] {
  if (!play.phases.length) return [];
  const p0 = play.phases[0];
  if (!p0.startPositions || !p0.ballHolder)
    throw new Error("Phase 0 must define startPositions and ballHolder");
  const frames: ResolvedFrame[] = [
    { positions: p0.startPositions, ballHolder: p0.ballHolder },
  ];
  for (let i = 0; i < play.phases.length; i++) {
    frames.push(endFrame(play.phases[i], frames[i]));
  }
  return frames;
}
