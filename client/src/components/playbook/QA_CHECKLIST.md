# Playbook Studio QA Checklist

## Store
- [ ] Persisted playbook state loads safely after a refresh.
- [ ] Invalid persisted state falls back to defaults without throwing.
- [ ] Undo and redo work correctly across play and phase edits.
- [ ] Saving a version stores `authorName` correctly.
- [ ] Restoring a version resets the selected phase and clears selection.
- [ ] Deleting a token also removes any connected paths.
- [ ] Only one BALL exists per phase at a time.

## Canvas
- [ ] Tokens cannot be dragged outside the 800×600 canvas bounds.
- [ ] Path drawing preview appears while dragging and cancels on pointer release outside the canvas.
- [ ] Clicking an empty canvas area while in Select mode clears selection.
- [ ] Delete / Backspace removes the selected token or path.
- [ ] Escape cancels a path draw in progress.
- [ ] Paths have a larger invisible hit area for easier selection.

## Playback
- [ ] Playback continues correctly after switching browser tabs.
- [ ] Playback does not reset unexpectedly when visibility changes.
- [ ] Preview tokens interpolate correctly between consecutive phases.

## General
- [ ] `client/src/lib/mock/playbookSchema.ts` contains strict Zod schemas for Play, PlayPhase, PlayToken, PlayPath, PlayVersion, and editor types.
- [ ] `client/src/lib/playbookStore.ts`, `client/src/components/playbook/PlayCanvas.tsx`, and `client/src/components/playbook/usePlayback.ts` are updated together and compile cleanly.
