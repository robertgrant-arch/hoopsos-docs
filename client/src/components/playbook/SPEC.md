# Playbook Studio — Enterprise Specification

**Status:** Approved — binding for all subsequent PRs (v2.x)
**Owners:** Coach Product, Platform, QA
**Last reviewed:** 2026-05-01

## 1. Definition of Enterprise Grade
A Playbook Studio release is "enterprise grade" when **every** acceptance criterion in this document is green in CI on `main` for two consecutive deploys. Anything less ships behind a feature flag, never to 100% of coaches.

## 2. Non-negotiables (P0 — ship-blockers)
### 2.1 Correctness
- Every persisted byte is validated against `playbookSchema.ts` (zod) on read AND write.
- Server (when added) re-validates against the same schema. No client-trusted IDs.
- Impossible UI states are unrepresentable: store is an XState machine (`idle | drafting | playing | exporting | conflict`).
- Every reducer has a property-based test (fast-check) covering 1k random inputs.

### 2.2 Reliability — zero data loss
- Storage is IndexedDB (idb-keyval), not localStorage. Quota ≥ 50 MB.
- A write-ahead log captures every drag/edit at the *interaction* level, not the *commit* level. A crashed tab recovers the last in-progress drag on reload.
- Tab-visibility-change forces a synchronous flush.
- Network failure on save retries with exponential backoff (1s, 2s, 4s, 8s, 16s; cap 5).
- Storage corruption shows recovery UI; never crashes the studio.

### 2.3 Performance budget (CI-enforced)
| Metric | Budget | Measurement |
|---|---|---|
| Drag frame time | ≤ 16 ms p95 | `performance.measure` per `pointermove` |
| Phase switch | ≤ 100 ms p95 | mark on click → paint |
| Initial studio JS chunk | ≤ 50 KB gzip | rollup-plugin-visualizer in CI |
| Largest contentful paint | ≤ 1.8 s on Fast 3G | Playwright + Lighthouse |
| Memory after 30 min session | ≤ 150 MB | Chrome perf profile in nightly |

### 2.4 Accessibility (WCAG 2.2 AA)
- All canvas tools reachable by keyboard. Tab order is visible and documented.
- ARIA: canvas has `role="application"`, every actor has `role="img"` with descriptive label.
- Live region announces phase changes and new actor placements to screen readers.
- `prefers-reduced-motion` disables play animation, replaces with stepped phases.
- Color contrast ≥ 4.5:1 for all text, ≥ 3:1 for actor outlines.
- Focus indicator visible on every interactive element (custom 2 px ring, no `outline:none` without a replacement).

### 2.5 Multi-user safety
- Optimistic concurrency via `If-Match` ETag on save.
- 409 conflict triggers UI: "Coach X edited this 2 min ago — review their changes" with side-by-side diff.
- Version-vector merge for non-conflicting fields (different actors moved by different coaches → auto-merge).
- Locking is advisory, not mandatory — a 30-min idle lock auto-releases.

### 2.6 Observability
- Sentry boundary wrapping the studio root. Every error has a stable `scope.tag("surface", "playbook-studio")`.
- Web-vitals reported per page view.
- Custom marks emitted for: `studio.load`, `phase.switch`, `actor.drag.start/end`, `play.save`, `play.export`.
- Structured logs (JSON) with `userId`, `teamId`, `playId`, `phaseId` on every action. PII scrubbed.
- Dashboards: P95 perf, error rate, save-success rate, conflict rate.

### 2.7 Security
- Server-side schema mirror (Node) re-validates every save.
- Save tokens are signed JWTs with `aud=playbook-studio`, 5-min TTL.
- Per-user save rate limit: 60/min.
- All play IDs are server-issued (UUID v7); client never invents IDs that hit the DB.
- CSP allows only self + Sentry endpoint.
- No `dangerouslySetInnerHTML` anywhere in the studio tree.

### 2.8 Test coverage
- Unit (vitest): 100% of zod schemas, 100% of store reducers, 100% of utility math (court coords, path interpolation).
- Integration (Playwright): every user-facing flow in `QA_CHECKLIST.md` is an automated test.
- Visual regression: Playwright screenshots on Chromium + WebKit + Firefox at 3 viewports (mobile/tablet/desktop). Diff threshold 0.1%.
- Property tests (fast-check): undo/redo round-trip, schema parse/serialize round-trip, store-action commutativity where applicable.
- Mutation testing (Stryker): ≥ 80% mutation score on store + schema modules.
- CI fails the PR if coverage drops > 0.5% or any budget regresses.

## 3. Should-haves (P1 — ship-quality)
- Undo/redo with branching history (tree, not stack), persisted across reload.
- Real-time presence: see other coaches' cursors as ghosts.
- Export: PNG, animated GIF, MP4 (server-side ffmpeg), JSON (the validated schema).
- Import: paste a play JSON, schema-validated before merge.
- Templates: starter formations (5-out, horns, box, stack) with one-click insert.
- Print stylesheet: a phase-by-phase whiteboard PDF view.

## 4. Architecture
```
client/src/
  components/playbook/
    PlaybookStudio.tsx        # root, error boundary, feature-flag gate
    PlayCanvas.tsx            # presentational, all gestures via PointerEvents
    PlayCanvas.gestures.ts    # pure handlers, unit-tested
    PhaseTimeline.tsx
    Toolbar.tsx
    ConflictDialog.tsx
    PlaybookErrorBoundary.tsx
    SPEC.md                   # this file
    MIGRATION.md
    QA_CHECKLIST.md
  lib/playbook/
    schema.ts                 # zod, single source of truth
    store.ts                  # XState machine + selectors
    persistence.ts            # idb + WAL
    sync.ts                   # server save/load, conflict detection
    telemetry.ts              # web-vitals + custom marks
  hooks/
    usePlayback.ts            # rAF, reduced-motion aware
    usePresence.ts            # other coaches' cursors
server/playbook/
  schema.ts                   # mirrors client schema, single source of truth via shared package
  routes.ts                   # save, load, list, conflict
```

## 5. Rollout plan
1. **PR #4** — Persistence (idb + WAL). Behind `flag: playbook.persistence.v2`. Internal only.
2. **PR #5** — XState store. Behind same flag. Internal only.
3. **PR #6** — Canvas hardening (PointerEvents, keyboard, a11y).
4. **PR #7** — Observability + perf budget CI gate.
5. **PR #8** — Multi-user + server schema mirror.
6. **Staged rollout:** 10% of teams → watch dashboards 48h → 50% → watch 48h → 100%. Kill switch wired throughout.
7. **GA:** flag removed only after two clean weeks at 100%.

## 6. Anti-regression rules
- No PR may reduce test coverage of `client/src/lib/playbook/**` or `client/src/components/playbook/**`.
- No PR may introduce `as any`, `@ts-ignore`, or `eslint-disable` in the studio tree without a linked ticket and an expiry date.
- No PR may bypass the zod schema. If the schema needs to change, the schema change is its own PR with a migration.
- No PR labeled `playbook-studio` may merge without a coach-product reviewer AND a platform reviewer.
- "Minimal working version" is not an acceptable PR description for this surface. Either it meets the spec or it ships behind a flag.

## 7. Open questions (resolve before PR #4)
- IndexedDB library: `idb` (raw) vs `idb-keyval` (KV) vs `dexie` (ORM). Lean: `idb` for control.
- State machine: XState v5 (heavy) vs Zustand + reducer (light). Lean: XState v5 for the explicit modes.
- Server: extend existing Express, or split into a dedicated playbook service. Lean: extend, split when QPS > 50.
- Telemetry: Sentry + Datadog vs Sentry + custom OTLP. Lean: Sentry + OTLP → Datadog.

## 8. Acceptance sign-off
This spec is binding once merged. PRs #4–#8 must each cite the section(s) they satisfy in the PR body and check off the corresponding boxes in `QA_CHECKLIST.md`.
