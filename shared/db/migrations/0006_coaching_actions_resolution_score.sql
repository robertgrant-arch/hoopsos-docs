-- Migration: add resolution_score JSONB to coaching_actions
-- Stores AI-computed quality metrics when a follow-up session auto-resolves an action.
-- { originalCount: number, followUpCount: number, improvement: number, autoResolved: boolean }

ALTER TABLE coaching_actions ADD COLUMN IF NOT EXISTS resolution_score JSONB;
