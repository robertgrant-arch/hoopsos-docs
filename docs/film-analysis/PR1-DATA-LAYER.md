# PR 1 — Film Analysis Data Layer

Goal: replace shared/film-analysis/mock.ts with a real Postgres-backed data layer behind a feature flag, without breaking the live UI.

Stack: Neon Postgres + Drizzle ORM + drizzle-kit migrations. Tenancy enforced via org_id on every row in the repo layer; PG RLS deferred to PR 6.

Tables: orgs, org_memberships, film_sessions, film_assets, film_events, film_pipeline_runs, consent_records, audit_log, usage_meter.

Feature flag FILM_ANALYSIS_DATA_SOURCE in {mock, db}, default mock. UI behavior is unchanged in PR 1.

Migration runbook (post-merge): provision Neon, set DATABASE_URL + DATABASE_URL_UNPOOLED in Vercel, run pnpm db:generate && pnpm db:migrate locally or in a Codespace.

Out of scope (later PRs): real upload endpoint + Inngest (PR 2), Mux (PR 3), Hudl/Roboflow analysis adapter (PR 4), Stripe metered billing (PR 5), RLS + parental consent UX (PR 6).
