-- Migration: add 'add_to_wod' to coaching_action_type enum
-- Postgres 9.6+ supports ADD VALUE IF NOT EXISTS without a transaction restart.
ALTER TYPE coaching_action_type ADD VALUE IF NOT EXISTS 'add_to_wod' BEFORE 'request_reupload';
