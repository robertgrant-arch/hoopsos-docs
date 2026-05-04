// =============================================================================
// server/modules/film-analysis/schema.ts
// Zod validation schemas for the Film Analysis API surface.
// Used by routes.ts via the validateBody middleware.
// =============================================================================

import { z } from "zod";

export const createAssetSchema = z.object({
  filename: z.string().min(1).max(512),
  fileSizeBytes: z.number().int().positive().max(10_737_418_240),
  mimeType: z.enum([
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ]),
  teamId: z.string().min(1),
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const createSessionSchema = z.object({
  filmAssetId: z.string().min(1),
  teamId: z.string().min(1),
  name: z.string().min(1).max(256),
  sessionType: z.enum(["GAME", "PRACTICE", "SCRIMMAGE", "TRAINING"]),
  gameDate: z.string().date().optional(),
  opponent: z.string().max(128).optional(),
  venue: z.string().max(256).optional(),
  homeTeamSide: z.enum(["LEFT", "RIGHT"]).optional(),
  notes: z.string().max(2048).optional(),
  triggerAnalysis: z.boolean().default(true),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const submitReviewSchema = z.object({
  decisions: z
    .array(
      z.object({
        entityType: z.enum([
          "DETECTED_EVENT",
          "STAT_ATTRIBUTION",
          "TRACKED_PLAYER",
          "ROSTER_LINK",
        ]),
        entityId: z.string().min(1),
        decision: z.enum(["APPROVED", "CORRECTED", "REJECTED"]),
        correctedValue: z.record(z.string(), z.unknown()).optional(),
        notes: z.string().max(1024).optional(),
      })
    )
    .min(1)
    .max(500),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const createReelSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(1024).optional(),
  subjectRosterMemberId: z.string().optional(),
  clipIds: z.array(z.string()).min(1).max(100),
});
export type CreateReelInput = z.infer<typeof createReelSchema>;

export const updateReelSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(1024).optional(),
  clipIds: z.array(z.string()).min(1).max(100).optional(),
  isPublished: z.boolean().optional(),
});
export type UpdateReelInput = z.infer<typeof updateReelSchema>;

export const exportRequestSchema = z.object({
  exportType: z.enum(["REEL_VIDEO", "CLIP_VIDEO", "STATS_PDF", "STATS_JSON"]),
  sourceId: z.string().min(1),
});
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

export const eventFilterSchema = z.object({
  playerId: z.string().optional(),
  period: z.coerce.number().int().min(1).max(8).optional(),
  eventTypes: z.array(z.string()).optional(),
  teamSide: z.enum(["HOME", "AWAY", "UNKNOWN"]).optional(),
  reviewStatus: z
    .enum(["PENDING", "APPROVED", "CORRECTED", "REJECTED"])
    .optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type EventFilterInput = z.infer<typeof eventFilterSchema>;

export const correctEventSchema = z.object({
  eventType: z.string().optional(),
  primaryTrackedPlayerId: z.string().nullable().optional(),
  secondaryTrackedPlayerId: z.string().nullable().optional(),
  notes: z.string().max(1024).optional(),
});
export type CorrectEventInput = z.infer<typeof correctEventSchema>;
