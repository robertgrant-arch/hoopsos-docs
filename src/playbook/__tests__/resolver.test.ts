import { it, expect } from "vitest";
import { resolvePlay } from "../resolver";
import { Play } from "../types";

const base = (): Play => ({
  schema: "v2",
  id: "t",
  name: "t",
  version: "v0.1",
  phases: [
    {
      id: "p0",
      label: "ENTRY",
      startPositions: {
        "1": { x: 0.5, y: 0.4 },
        "2": { x: 0.05, y: 0.65 },
        "3": { x: 0.95, y: 0.65 },
        "4": { x: 0.31, y: 0.8 },
        "5": { x: 0.69, y: 0.8 },
      },
      ballHolder: "1",
      actions: [],
    },
    { id: "p1", label: "READ 1", actions: [] },
    { id: "p2", label: "READ 2", actions: [] },
  ],
});

it("cutter ends at the cut endpoint in next phase", () => {
  const play = base();
  play.phases[0].actions.push({
    kind: "cut",
    player: "1",
    path: [
      { x: 0.5, y: 0.4 },
      { x: 0.95, y: 0.65 },
    ],
    style: "straight",
  });
  expect(resolvePlay(play)[1].positions["1"]).toEqual({ x: 0.95, y: 0.65 });
});

it("ball follows pass", () => {
  const play = base();
  play.phases[0].actions.push({ kind: "pass", from: "1", to: "3" });
  expect(resolvePlay(play)[1].ballHolder).toBe("3");
});

it("editing earlier phase propagates downstream", () => {
  const play = base();
  play.phases[0].actions.push({
    kind: "cut",
    player: "2",
    path: [
      { x: 0.05, y: 0.65 },
      { x: 0.5, y: 0.5 },
    ],
    style: "straight",
  });
  play.phases[1].actions.push({
    kind: "cut",
    player: "2",
    path: [
      { x: 0.5, y: 0.5 },
      { x: 0.69, y: 0.8 },
    ],
    style: "curve",
  });
  expect(resolvePlay(play)[2].positions["2"]).toEqual({ x: 0.69, y: 0.8 });
});

it("handoff moves both players and ball", () => {
  const play = base();
  play.phases[0].actions.push({
    kind: "handoff",
    from: "1",
    to: "4",
    at: { x: 0.31, y: 0.8 },
  });
  const f = resolvePlay(play)[1];
  expect(f.positions["1"]).toEqual({ x: 0.31, y: 0.8 });
  expect(f.positions["4"]).toEqual({ x: 0.31, y: 0.8 });
  expect(f.ballHolder).toBe("4");
});
