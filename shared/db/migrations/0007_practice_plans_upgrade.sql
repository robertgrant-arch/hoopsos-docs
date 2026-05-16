-- Practice Plans phase-2 upgrade: outcome-driven fields
-- All ADD COLUMN IF NOT EXISTS so the migration is safe to re-run.

ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS actual_duration_mins  INTEGER;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS objectives            JSONB;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS target_group          JSONB;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS skill_emphasis        JSONB;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS planned_intensity     TEXT;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS opponent_name         TEXT;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS linked_event_id       TEXT;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS reflection            JSONB;
ALTER TABLE practice_plans ADD COLUMN IF NOT EXISTS follow_up_action_ids  JSONB;
