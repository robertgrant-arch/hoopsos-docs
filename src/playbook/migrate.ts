import { Play, Phase, Action } from "./types";
import { resolvePlay } from "./resolver";

type OldArrow = {
  playerId: string;
  points: { x: number; y: number }[];
  type: "cut" | "dribble";
};

type OldPhase = {
  id: string;
  label: string;
  positions: Record<string, { x: number; y: number }>;
  ballHolder: string;
  arrows?: OldArrow[];
};

type OldPlay = {
  id: string;
  name: string;
  version?: string;
  phases: OldPhase[];
  formation?: string;
};

export function migrate(old: OldPlay): Play {
  const phases: Phase[] = old.phases.map((p, i) => {
    const actions: Action[] = (p.arrows ?? []).map((arr) =>
      arr.type === "cut"
        ? { kind: "cut", player: arr.playerId, path: arr.points, style: "straight" }
        : { kind: "dribble", player: arr.playerId, path: arr.points },
    );
    return {
      id: p.id,
      label: p.label,
      actions,
      ...(i === 0
        ? { startPositions: p.positions, ballHolder: p.ballHolder }
        : {}),
    };
  });

  const play: Play = {
    schema: "v2",
    id: old.id,
    name: old.name,
    version: old.version ?? "v0.2",
    phases,
    formation: old.formation,
  };

  // Backfill drift between explicit per-phase positions in the legacy data
  // and the positions our resolver derives from actions. If a player's stored
  // position diverges by more than 1% of the court, append a synthetic cut to
  // the *previous* phase so the resolver lands them at the right spot.
  const frames = resolvePlay(play);
  for (let i = 1; i < old.phases.length; i++) {
    const stored = old.phases[i].positions;
    const resolved = frames[i].positions;
    for (const pid of Object.keys(stored)) {
      const s = stored[pid];
      const r = resolved[pid];
      if (!r || Math.hypot(s.x - r.x, s.y - r.y) > 0.01) {
        play.phases[i - 1].actions.push({
          kind: "cut",
          player: pid,
          path: [r ?? s, s],
          style: "straight",
        });
      }
    }
  }
  return play;
}
