# ADR 0001: Film Analysis Stack

**Status:** Accepted (2026-05-04)
**Context:** PR roadmap to replace mock Film Analysis with production infrastructure (PRs 1–6).

## Decisions

### 1. Asset ingestion: Mux Direct Upload
Mux handles transcoding, adaptive HLS, thumbnails, and signed playback URLs out of the box. Rejected S3 multipart presigned uploads because that path requires us to also build/operate the transcoding + streaming pipeline.

**Implementation surface (PR 3):**
- POST /api/film/uploads returns Mux Direct Upload URL + film_assets row in pending
- POST /api/webhooks/mux verifies Mux-Signature, transitions assets to ready, persists mux_asset_id, playback_id, duration_ms

### 2. Job queue: Inngest
Durable retries, step functions for multi-stage AI pipelines, native Vercel integration, generous free tier. Rejected Vercel Cron + Postgres queue (too brittle for AI retries) and Trigger.dev (Inngest DX wins for this shape).

**Implementation surface (PR 4):**
- inngest/client.ts — Inngest client
- inngest/functions/analyze-film.ts — step.run(call-gemini), step.run(persist-annotations)
- POST /api/inngest — Inngest serve handler
- Trigger: mux/asset.ready event from webhook handler

### 3. AI analysis: Google Gemini 2.5 Pro
Native multimodal video understanding (accepts video URLs directly, no frame extraction), 1M-token context for long film, lowest cost per video minute among frontier models.

**Implementation surface (PR 4):**
- server/film-analysis/gemini.ts — thin wrapper, takes Mux signed playback URL, returns structured Annotation[]
- Schema-constrained output via Gemini JSON mode

### 4. Tenancy: Clerk session claims to org_id
Clerk already in stack. Resolve org_id from auth().orgId server-side; org_members table is source of truth for roles.

**Implementation surface (PR 2):**
- server/auth/tenant.ts — requireOrg(req) returns { userId, orgId, role }
- All @shared/db repository calls scoped by orgId

## Required Vercel Environment Variables

See .env.example. At minimum for prod:
- DATABASE_URL, DATABASE_URL_UNPOOLED (Neon)
- CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SIGNING_SECRET
- MUX_TOKEN_ID, MUX_TOKEN_SECRET, MUX_WEBHOOK_SIGNING_SECRET
- INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
- GEMINI_API_KEY

## Remaining PR Roadmap

- PR 1.5b feat/film-realize-1.5b-drizzle-deps: Deps + db scripts + .env.example + this ADR (current)
- PR 2 feat/film-realize-2-backend-repos: Replace server/film-analysis mocks with @shared/db + Clerk tenant scoping
- PR 3 feat/film-realize-3-mux-ingestion: Mux Direct Upload + webhook handler
- PR 4 feat/film-realize-4-inngest-gemini: Inngest analyze-film function + Gemini wrapper
- PR 5 feat/film-realize-5-client-wiring: Replace client mocks with real API calls + loading/error states
- PR 6 feat/film-realize-6-cleanup: Delete mock files, finalize README/runbook

## Migration runbook (local)

    pnpm install
    pnpm db:generate    # produces shared/db/migrations/0000_init.sql
    pnpm db:migrate     # applies against DATABASE_URL_UNPOOLED

Commit the generated shared/db/migrations/*.sql files. Vercel deploys do not run migrations — run pnpm db:migrate from a trusted environment with the prod DATABASE_URL_UNPOOLED.
