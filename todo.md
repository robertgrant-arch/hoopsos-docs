# HoopsOS Product Build — TODO

## Phase 1: Mock data layer
- [ ] Write `lib/mock/roles.ts` — 6 demo users (athlete/coach/teamAdmin/expert/parent/superAdmin)
- [ ] Write `lib/mock/teams.ts` — Texas Elite org with 2 teams + seasons
- [ ] Write `lib/mock/roster.ts` — 12 athletes with profiles, avatars, stats
- [ ] Write `lib/mock/workouts.ts` — workout templates + today's WOD + assignments
- [ ] Write `lib/mock/videos.ts` — uploads with AI analyses + issues + coach reviews
- [ ] Write `lib/mock/clips.ts` — film room clips with timestamp comments + assignments
- [ ] Write `lib/mock/plays.ts` — one full playbook with 3 plays + 5-frame sequences
- [ ] Write `lib/mock/experts.ts` — 6 experts with offers (review/consult/class/course)
- [ ] Write `lib/mock/courses.ts` — 8 courses across included/premium tiers
- [ ] Write `lib/mock/live.ts` — 12 upcoming live events + 3 replays
- [ ] Write `lib/mock/billing.ts` — plans, subscriptions, discount grants
- [ ] Write `lib/mock/notifications.ts` — mixed inbox with behavioral + transactional
- [ ] Write `lib/mock/audit.ts` — AuditLog entries for admin surface
- [ ] Write `lib/auth.ts` — localStorage-backed role switcher with `useRole()` hook

## Phase 2: Marketing site
- [ ] `/` — homepage hero + audience pivot + metrics + live showcase + pricing teaser
- [ ] `/players` — athlete-focused hero + AI mechanics + 50% callout
- [ ] `/coaches` — Coach HQ + Film Room + Playbook Studio + compliance
- [ ] `/teams` — org plan + 50% rule diagram + demo CTA
- [ ] `/experts` — MasterClass grid + apply-to-teach
- [ ] `/pricing` — tiered matrix + annual toggle + 50% rule fine print
- [ ] `/live` — Peloton poster grid
- [ ] `/about`, `/legal`, `/contact`

## Phase 3: Auth shell
- [ ] Role switcher modal (list of 6 demo users, click to impersonate)
- [ ] `(app)/layout` with `AppTopBar` + role-aware sidebar
- [ ] Route guards that redirect to `/signin` if no role

## Phases 4–13: Product surfaces
- [ ] Player App: dashboard / wod / uploads / uploads/[id] / skills / achievements
- [ ] Coach HQ: dashboard / roster / queue / queue/[id] (telestration) / assignments / practice-plans / library / messages / bookings / learn
- [ ] Team: org dashboard / teams/[id] / invite / billing / settings
- [ ] Marketplace: / / experts / experts/[slug] / offers/[id] / bookings/[id] / apply / payouts
- [ ] Film Room: / / rooms/[id] / rooms/[id]/clips/[id] / rooms/[id]/assignments / player-inbox
- [ ] Playbook Studio: / / plays/[id] (editor) / plays/[id]/study / plays/[id]/quiz
- [ ] Live: / / [id] / [id]/room / [id]/replay
- [ ] Learn: / / courses/[id] / courses/[id]/lessons/[id] / my
- [ ] Billing: / / checkout-success / settings
- [ ] Admin: / / users/[id] / subscriptions / moderation / audit / jobs / flags

## Phase 14: Docs integration
- [ ] Move docs to `/docs/*` with existing chapter index working
- [ ] Add "Docs" link to marketing top nav

## Phase 15: QA
- [ ] Visit every route — no 404s, no TS errors
- [ ] Save checkpoint

## Phase 16: Completion roadmap doc
- [ ] Write `hoopsos_completion_roadmap.md` — production checklist
