import { it, expect } from "vitest";
import { tween } from "../animate";
import type { Phase, ResolvedFrame } from "../types";

const prev: ResolvedFrame = {
  positions: {
    "1": { x: 0, y: 0 },
    "2": { x: 0.5, y: 0.5 },
  },
  ballHolder: "1",
};

const next: ResolvedFrame = {
  positions: {
    "1": { x: 1, y: 0 },
    "2": { x: 0.5, y: 0.5 },
  },
  ballHolder: "1",
};

it("tween at t=0 returns prev positions for movers", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        style: "straight",
      },
    ],
  };
  const f = tween(prev, next, phase, 0);
  expect(f["1"]).toEqual({ x: 0, y: 0 });
});

it("tween at t=0.5 returns midpoint for a straight cut", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        style: "straight",
      },
    ],
  };
  const f = tween(prev, next, phase, 0.5);
  expect(f["1"].x).toBeCloseTo(0.5);
  expect(f["1"].y).toBeCloseTo(0);
});

it("tween at t=1 lands at the cut endpoint", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        style: "straight",
      },
    ],
  };
  const f = tween(prev, next, phase, 1);
  expect(f["1"]).toEqual({ x: 1, y: 0 });
});

it("non-mover players hold prev position throughout", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        style: "straight",
      },
    ],
  };
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const f = tween(prev, next, phase, t);
    expect(f["2"]).toEqual({ x: 0.5, y: 0.5 });
  }
});

it("multi-segment polyline interpolates by arc length", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        // L-shape: down 1, right 1 (total length 2)
        path: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
        style: "straight",
      },
    ],
  };
  // Midpoint by arc length is at (0, 1) — exactly the corner.
  const f = tween(prev, next, phase, 0.5);
  expect(f["1"].x).toBeCloseTo(0);
  expect(f["1"].y).toBeCloseTo(1);
});

it("tween clamps t outside [0, 1]", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [
      {
        kind: "cut",
        player: "1",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        style: "straight",
      },
    ],
  };
  expect(tween(prev, next, phase, -1)["1"]).toEqual({ x: 0, y: 0 });
  expect(tween(prev, next, phase, 2)["1"]).toEqual({ x: 1, y: 0 });
});

it("handoff moves both participants to the at-point", () => {
  const phase: Phase = {
    id: "p",
    label: "P",
    actions: [{ kind: "handoff", from: "1", to: "2", at: { x: 0.7, y: 0.7 } }],
  };
  const f = tween(prev, next, phase, 1);
  expect(f["1"]).toEqual({ x: 0.7, y: 0.7 });
  expect(f["2"]).toEqual({ x: 0.7, y: 0.7 });
});
