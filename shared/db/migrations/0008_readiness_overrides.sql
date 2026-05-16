-- Readiness coach overrides: allow a coach to manually set a player's readiness
-- status for up to 24 h, with a mandatory note.
CREATE TABLE IF NOT EXISTS readiness_overrides (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL,
  player_id       TEXT NOT NULL,
  coach_user_id   TEXT NOT NULL,
  status          TEXT NOT NULL,   -- 'READY' | 'FLAGGED' | 'RESTRICTED'
  note            TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS readiness_overrides_org_player
  ON readiness_overrides (org_id, player_id);
