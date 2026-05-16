-- Migration 0011: link guardian accounts to player_guardians rows
--
-- Adds guardian_user_id so that every /api/parent/* endpoint can validate
-- "does this authenticated Clerk user have a guardian relationship with
-- the requested player?" before returning any player data.
--
-- The column is nullable because existing guardian records were created
-- before account linking was supported.  The constraint is enforced at the
-- application layer: if guardian_user_id IS NULL the parent portal API
-- returns 403 ("Account not linked yet") until an admin or coach links it.

ALTER TABLE player_guardians
  ADD COLUMN IF NOT EXISTS guardian_user_id TEXT;

-- Speeds up the access-check query:
--   WHERE guardian_user_id = $1 AND player_id = $2 AND org_id = $3
CREATE INDEX IF NOT EXISTS player_guardians_user_player
  ON player_guardians (guardian_user_id, player_id)
  WHERE deleted_at IS NULL;
