-- Opponent Scouting layer
-- Creates opponent profiles and scout reports.

CREATE TYPE IF NOT EXISTS scout_report_status AS ENUM ('draft', 'final', 'archived');

CREATE TABLE IF NOT EXISTS opponents (
  id                  TEXT PRIMARY KEY,
  org_id              TEXT NOT NULL,
  name                TEXT NOT NULL,
  abbreviation        TEXT,
  level               TEXT NOT NULL DEFAULT 'varsity',
  conference          TEXT,
  division            TEXT,
  coach_name          TEXT,
  record              JSONB,
  primary_color       TEXT,
  linked_event_ids    JSONB,
  film_session_ids    JSONB,
  notes               TEXT,
  created_by_user_id  TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS opponents_org ON opponents (org_id);

CREATE TABLE IF NOT EXISTS scout_reports (
  id                      TEXT PRIMARY KEY,
  org_id                  TEXT NOT NULL,
  opponent_id             TEXT NOT NULL REFERENCES opponents(id),
  opponent_name           TEXT NOT NULL,
  game_date               TEXT,
  linked_event_id         TEXT,
  status                  scout_report_status NOT NULL DEFAULT 'draft',
  game_plan_summary       TEXT,
  keys_to_win             JSONB,
  offense_tendencies      JSONB,
  defense_tendencies      JSONB,
  key_players             JSONB,
  matchup_notes           JSONB,
  assignments             JSONB,
  linked_clip_ids         JSONB,
  linked_practice_plan_id TEXT,
  linked_play_ids         JSONB,
  author_user_id          TEXT NOT NULL,
  author_name             TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS scout_reports_org ON scout_reports (org_id);
CREATE INDEX IF NOT EXISTS scout_reports_opponent ON scout_reports (opponent_id);
