-- Migration: 0010_portals
-- Adds: announcements table, waiver_templates table, waiver_signatures table

-- ── Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('normal', 'urgent', 'info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE waiver_category AS ENUM ('waiver', 'consent', 'medical', 'media', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE waiver_status AS ENUM ('pending', 'signed', 'expired', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Announcements ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL,
  team_id          TEXT,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  priority         announcement_priority NOT NULL DEFAULT 'normal',
  pinned           BOOLEAN NOT NULL DEFAULT FALSE,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  audience_roles   TEXT[],
  author_user_id   TEXT NOT NULL,
  author_name      TEXT NOT NULL,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS announcements_org
  ON announcements (org_id, published_at DESC)
  WHERE deleted_at IS NULL;

-- ── Waiver templates ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waiver_templates (
  id                    TEXT PRIMARY KEY,
  org_id                TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  category              waiver_category NOT NULL,
  body_markdown         TEXT NOT NULL DEFAULT '',
  required              BOOLEAN NOT NULL DEFAULT TRUE,
  expires_after_days    TEXT,
  created_by_user_id    TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS waiver_templates_org
  ON waiver_templates (org_id)
  WHERE deleted_at IS NULL;

-- ── Waiver signatures ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waiver_signatures (
  id                    TEXT PRIMARY KEY,
  template_id           TEXT NOT NULL REFERENCES waiver_templates(id),
  org_id                TEXT NOT NULL,
  signed_by_user_id     TEXT NOT NULL,
  player_id             TEXT NOT NULL,
  status                waiver_status NOT NULL DEFAULT 'pending',
  signed_at             TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  ip_address            TEXT,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waiver_signatures_org_player
  ON waiver_signatures (org_id, player_id);

CREATE INDEX IF NOT EXISTS waiver_signatures_parent
  ON waiver_signatures (signed_by_user_id);
