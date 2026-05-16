-- Migration: add 'telestration' to annotation_kind enum
ALTER TYPE annotation_kind ADD VALUE IF NOT EXISTS 'telestration';
