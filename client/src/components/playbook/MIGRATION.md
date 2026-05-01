# Playbook Studio v2 — Migration Notes

This document captures the changes made in the enterprise rewrite pass.

## Why
The v1 Playbook Studio shipped with a broken draw-mode. Selecting **Pass /
Cut / Dribble / Screen / Handoff** and clicking two tokens did not reliably
create the action. Several other correctness issues (no undo/redo, hardcoded
author name, unsafe persistence, no schema validation on save) were also
addressed.

## Root cause of the broken draw tools
In `PlayCanvas.tsx`, the `Stage`'s `onMouseDown` handler ran on every
mousedown — including mousedowns *on tokens* — because mousedown bubbles
from a Konva `Group` up to the `Stage`. For path tools, the handler fell
through to:

```ts
if (drawing) setDrawing(null);
```

So clicking the second token cleared the in-flight draft *before* the
token's `onClick` fired. The token-click handler then saw an empty draft
and started a brand-new draft from the second token. The action never got
committed.

The new version stops mousedown from bubbling on tokens
(`e.cancelBubble = true`) and only acts on the Stage when the target is
the stage itself or the named `court-bg` rect.

## Schema (`@/lib/mock/playbookSchema.ts`)

`playbookSchema.ts` is now the single source of truth for the playbook
domain. Token / path / phase / play / version schemas are validated at
runtime via zod. Editor types — `EditorMode`, `SelectionState`,
`PendingPathDraft`, `UndoEntry` — are also defined here. The mock
`playbook.ts` re-exports the inferred types so existing imports keep
working.

Additive optional fields (backward compatible):

| Type      | New optional field              |
|-----------|---------------------------------|
| PlayToken | `locked`, `role`, `teamSide`    |
| PlayPath  | `controlX`, `controlY`, `label`, `locked` |
| PlayPhase | `thumbnailDataUrl`              |

Safe-parse helpers exported: `safeParsePlay`, `safeParsePlaySnapshot`,
`safeParsePersistedPlaybook`, `safeParsePlayVersion`,
`assertPlaySnapshot`.

## Persistence (`@/lib/playbookStore.ts`)

- localStorage is wrapped in a `try/catch` `StateStorage` adapter.
  Sandboxed iframes, private mode, quota-exceeded, and SSR all flow
  through silently — hydration cannot crash the editor.
- The persisted blob is validated against `persistedPlaybookSchema` on
  hydration. Invalid blobs are dropped and the store falls back to the
  default initial state.
- `selectedPhaseId` is re-bound on hydration if the persisted ID points
  at a play that no longer exists.
- `editorMode`, `pendingPathDraft`, `undoStack`, `redoStack`, and the
  transient selection are *not* persisted; they reset to safe defaults
  on every hydration so a stale draft cannot wedge the canvas.

Schema version bumped from 1 → 2.

## Author name

`saveVersion` no longer hardcodes `"Coach Daniels"`. It reads
`store.authorName`. The Studio renders an `Your name` input next to the
Save button. If `authorName` is empty/whitespace, the version is recorded
as `"Unknown coach"`.

## Undo / Redo

Every mutation that touches phase tokens, paths, phase metadata, play
metadata, or restores a version captures an `UndoEntry` (the play's
state *before* the mutation) and pushes it onto `undoStack`. New edits
clear `redoStack`. The stack is capped at 50 entries (oldest dropped
first). `Cmd/Ctrl+Z` triggers `undo`, `Cmd/Ctrl+Shift+Z` and
`Cmd/Ctrl+Y` trigger `redo`. The toolbar exposes ↶ / ↷ buttons.

## Canvas — deterministic state machine

`PlayCanvas` reads `editorMode` directly. Behavior:

- `SELECT` — drag tokens (clamped to court bounds), click to select,
  click path to select.
- `ADD_OFFENSE | ADD_DEFENSE | ADD_BALL | ADD_CONE` — empty-stage click
  drops a token. ADD_BALL re-positions the existing ball if one exists.
- `DRAW_PASS | DRAW_DRIBBLE | DRAW_CUT | DRAW_SCREEN | DRAW_HANDOFF` —
  click first token, click second token, action is committed.

Reliability changes:

- Token mousedown sets `e.cancelBubble = true` so it never reaches the
  Stage handler.
- Stage handler ignores any event whose target is not the stage or the
  `court-bg` rect.
- Window-level `mouseup` cancels in-flight drafts when the pointer is
  released outside the canvas (no more stuck ghost lines).
- Mode change cancels any pending draft (no PASS draft leaking into a
  CUT click).
- Escape cancels the draft, then returns to SELECT.
- Path hit-stroke is 20px so selection is forgiving.
- Quadratic bezier control point uses a perpendicular offset (≤60px)
  proportional to chord length so curves read as curves.
- Arrowheads use the actual end-tangent, not the chord.
- SCREEN end-cap line is rotated to the path's tangent.

## Token rules

- BALL is at-most-one per phase. The store rejects a duplicate add
  silently. ADD_BALL mode interprets a click on an empty area as
  *reposition the existing ball* if one exists.
- Deleting a token cascade-deletes any path with that token as start or
  end.
- Token drag is clamped to `[0, STAGE_W] × [0, STAGE_H]` both during
  drag and on drop.
- `locked` tokens cannot be dragged.

## Playback (`usePlayback`)

- Phases are sorted by `phase.order` defensively.
- RAF delta is clamped at 64ms — anything larger is treated as a
  background-tab wakeup and the timing reference is reset.
- `document.visibilitychange` cancels the loop when hidden and resets
  the timer when visible. The loop also self-cancels if it observes
  `document.hidden` during a frame.
- Public API: `play / pause / stop / reset / setCursor / seekPhase /
  getCursor`.
- `onPhaseChange` fires only on phase boundary transitions.

## Files removed (zero imports — were dead code)

- `client/src/lib/playbook/schema.ts`
- `client/src/lib/playbook/store.ts`
- `client/src/lib/playbook/persistence.ts`

These were a parallel v2 scaffold that was never wired in. Each file is
now a single-line `export {}` deprecation stub because the workspace
filesystem disallowed deletion in-session; they are safe to remove on
your next clean checkout.

## Keyboard shortcuts (final)

| Key                | Action                              |
|--------------------|-------------------------------------|
| `V`                | SELECT                              |
| `O`                | ADD_OFFENSE                         |
| `X`                | ADD_DEFENSE                         |
| `B`                | ADD_BALL                            |
| `K`                | ADD_CONE                            |
| `P`                | DRAW_PASS                           |
| `D`                | DRAW_DRIBBLE                        |
| `C`                | DRAW_CUT                            |
| `S`                | DRAW_SCREEN                         |
| `H`                | DRAW_HANDOFF                        |
| `Delete` / `Backspace` | Remove selected token or path   |
| `Cmd/Ctrl + Z`     | Undo                                |
| `Cmd/Ctrl + Shift + Z` / `Cmd/Ctrl + Y` | Redo           |
| `Esc`              | Cancel draft / return to SELECT     |

Shortcuts are suppressed when an `INPUT`, `TEXTAREA`, or
`contenteditable` element has focus.
