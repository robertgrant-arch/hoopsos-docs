export type PlayerId = string;
export type Vec2 = { x: number; y: number };
export type CutStyle = "straight" | "curve" | "vcut" | "lcut" | "backdoor" | "flare";
export type Action =
  | { kind: "cut";     player: PlayerId; path: Vec2[]; style: CutStyle }
  | { kind: "dribble"; player: PlayerId; path: Vec2[] }
  | { kind: "pass";    from: PlayerId; to: PlayerId }
  | { kind: "screen";  screener: PlayerId; for: PlayerId; at: Vec2 }
  | { kind: "handoff"; from: PlayerId; to: PlayerId; at: Vec2 };
export type Phase = {
  id: string;
  label: string;
  startPositions?: Record<PlayerId, Vec2>;
  ballHolder?: PlayerId;
  actions: Action[];
};
export type Play = {
  schema: "v2";
  id: string;
  name: string;
  version: string;
  phases: Phase[];
  formation?: string;
};
export type ResolvedFrame = {
  positions: Record<PlayerId, Vec2>;
  ballHolder: PlayerId;
};
