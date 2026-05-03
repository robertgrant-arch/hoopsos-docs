import { it, expect } from "vitest";
import { migrate } from "../migrate";
import { loadPlay, assertV2 } from "../load";
import { resolvePlay } from "../resolver";
import type { Play } from "../types";

const v1Fixture = {
  id: "legacy",
  name: "Legacy Horns",
  version: "v0.1",
  formation: "horns",
  phases: [
    {
      id: "p0",
      label: "ENTRY",
      positions: {
        "1": { x: 0.5, y: 0.4 },
        "2": { x: 0.05, y: 0.65 },
        "3": { x: 0.95, y: 0.65 },
        "4": { x: 0.31, y: 0.8 },
        "5": { x: 0.69, y: 0.8 },
      },
      ballHolder: "1",
      arrows: [
        { playerId: "1", points: [{ x: 0.5, y: 0.4 }, { x: 0.95, y: 0.65 }], type: "cut" as const },
      ],
    },
    {
      id: "p1",
      label: "READ 1",
      positions: {
        // Player 1 ended the cut, so resolver puts them at (0.95, 0.65). No drift.
        "1": { x: 0.95, y: 0.65 },
        // Player 2 drifts — legacy stored explicit position with no arrow recorded.
        "2": { x: 0.50, y: 0.50 },
        "3": { x: 0.95, y: 0.65 },
        "4": { x: 0.31, y: 0.8 },
        "5": { x: 0.69, y: 0.8 },
      },
      ballHolder: "1",
      arrows: [],
    },
  ],
};

it("migrate(v1Fixture) yields a valid v2 play that resolves without throwing", () => {
  const v2 = migrate(v1Fixture);
  expect(v2.schema).toBe("v2");
  expect(v2.id).toBe("legacy");
  expect(v2.name).toBe("Legacy Horns");
  // Phase 0 carries startPositions + ballHolder; later phases must not.
  expect(v2.phases[0].startPositions).toBeDefined();
  expect(v2.phases[0].ballHolder).toBe("1");
  expect(v2.phases[1].startPositions).toBeUndefined();
  expect(v2.phases[1].ballHolder).toBeUndefined();
  expect(() => resolvePlay(v2)).not.toThrow();
});

it("migrate backfills drift via synthetic cuts on the prior phase", () => {
  const v2 = migrate(v1Fixture);
  // Player 2 drifted from (0.05, 0.65) to (0.50, 0.50) with no arrow — the
  // migrator should have added a synthetic cut on phase 0 to land them there.
  const phase0Cuts = v2.phases[0].actions.filter(
    (a) => a.kind === "cut" && a.player === "2",
  );
  expect(phase0Cuts.length).toBe(1);
  const finalFrame = resolvePlay(v2)[2];
  expect(finalFrame.positions["2"]).toEqual({ x: 0.5, y: 0.5 });
});

it("loadPlay(v2Play) is identity — same reference, schema stays 'v2'", () => {
  const v2: Play = {
    schema: "v2",
    id: "x",
    name: "x",
    version: "v0.1",
    phases: [
      {
        id: "p0",
        label: "ENTRY",
        startPositions: { "1": { x: 0.5, y: 0.5 } },
        ballHolder: "1",
        actions: [],
      },
    ],
  };
  const out = loadPlay(v2);
  expect(out).toBe(v2); // same reference
  expect(out.schema).toBe("v2");
});

it("loadPlay(legacyRaw) routes through migrate and returns a v2 play", () => {
  const out = loadPlay(v1Fixture);
  expect(out.schema).toBe("v2");
  expect(out.id).toBe("legacy");
});

it("assertV2 throws on missing schema", () => {
  expect(() => assertV2({} as Play)).toThrow(/non-v2/);
});

it("assertV2 throws on old schema", () => {
  // Deliberately constructing an off-spec value to prove the runtime guard.
  const bogus = { schema: "v1", id: "x", name: "x", version: "x", phases: [] } as unknown as Play;
  expect(() => assertV2(bogus)).toThrow(/non-v2/);
});

it("assertV2 throws on null / undefined", () => {
  expect(() => assertV2(null as unknown as Play)).toThrow(/non-v2/);
  expect(() => assertV2(undefined as unknown as Play)).toThrow(/non-v2/);
});
