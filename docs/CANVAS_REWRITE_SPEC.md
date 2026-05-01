# Playbook Studio v2 — Canvas Drag Rewrite (PR #6 spec)

## Goal
Replace `client/src/components/playbook/PlayCanvas.tsx` with an enterprise-grade interactive canvas wired to the v2 store (`client/src/lib/playbook/store.ts`) and persistence (`client/src/lib/playbook/persistence.ts`). Existing prop API of PlayCanvas MUST remain a drop-in replacement for callers in `client/src/pages/app/coach/PlaybookStudio.tsx`.

## Non-negotiable behaviors (P0)
1. **Drag a player token to move it.** Pointer-down on a numbered token (Offense O, Defense X) when tool=Select begins a drag; pointer-move shows live ghost; pointer-up commits MOVE_PLAYER {tokenId, from, to} action through the v2 store reducer with snap to 0.5ft grid.
2. **Pass arrow.** Tool=Pass: pointer-down on source player, pointer-move shows live arrow, pointer-up on target player commits ADD_PASS {fromTokenId, toTokenId}.
3. **Dribble arrow.** Tool=Dribble: pointer-down on a player, drag traces a polyline (sample at 60Hz, simplify to <=12 points via Ramer-Douglas-Peucker eps=0.25ft), pointer-up commits ADD_DRIBBLE {tokenId, points[]}.
4. **Cut arrow.** Tool=Cut: same as dribble but commits ADD_CUT.
5. **Screen.** Tool=Screen: pointer-down on screener, pointer-up on user; commits ADD_SCREEN {screenerTokenId, userTokenId}.
6. **DHO Handoff.** Tool=DHO: pointer-down on giver, pointer-up on receiver; commits ADD_HANDOFF.
7. **Place new tokens.** Tool=Offense/Defense/Ball/Cone: click empty court → ADD_TOKEN with auto-incrementing jersey number.
8. **Selection.** Tool=Select + click on token = SELECT_TOKEN. Click empty = CLEAR_SELECTION. Shift+click = multi-select.
9. **Delete/Backspace** removes selected.
10. **Esc** cancels active drag (no commit).
11. **Undo/Redo** via Cmd+Z / Cmd+Shift+Z; reducer keeps a 50-step ring buffer.
12. **Keyboard tool shortcuts** V/O/X/B/K/P/D/C/S/H map to Select/Offense/Defense/Ball/Cone/Pass/Dribble/Cut/Screen/Handoff.
13. **Persistence round-trip:** every committed action triggers debounced (250ms) write to IndexedDB; reload restores exact state.
14. **Touch + pen + mouse** all work via Pointer Events; passive:false on the SVG to prevent scroll on touch drag.
15. **a11y:** each token has role="button", aria-label="Player N", focusable; arrow keys nudge selected token by 0.5ft.

## Architecture
- New hook `client/src/components/playbook/useCanvasDrag.ts` (state machine: idle → arming → dragging → committing → idle; cancellable).
- PlayCanvas becomes a thin SVG renderer; all interaction goes through useCanvasDrag.
- Coordinate system: court-space ft (0..50 x 0..47); SVG viewBox matches; conversion helpers `screenToCourt(e, svgRef)` and `courtToScreen(pt)`.
- Hit testing: per-token circle r=1.5ft; per-arrow within 0.4ft of polyline.

## Tests (Vitest + @testing-library/react + fast-check)
- pointer-down/move/up on token commits MOVE_PLAYER once, with snapped coords
- pass arrow requires drop on a *player*, otherwise no-op
- escape during drag emits NO action
- undo after MOVE returns prior coords (property-based, 200 random drags)
- persistence: write, reload simulated store, assert deep-equal

## Acceptance gate
- `pnpm tsc --noEmit` clean
- `pnpm test` green (canvas suite >= 25 tests)
- `pnpm build` clean
- Vercel preview: a human (or Playwright spec `tests/e2e/canvas.spec.ts`) can drag player O1 from (25,25) to (30,28) and reload sees it persisted.

## Out of scope for PR #6
- Phase timeline scrubbing (PR #7)
- Animation playback (PR #8)
- Multiplayer cursors (PR #9)
