// =============================================================================
// server/modules/film-analysis/pipeline/MockPipelineAdapter.ts
// In-memory mock implementation of VideoPipelineAdapter for local development
// and integration tests. Simulates a 2-minute end-to-end pipeline with all
// 10 stages progressing realistically over wall-clock time.
//
// NEVER use this in production. The registry in PipelineAdapter.ts gates this
// behind VIDEO_PIPELINE_PROVIDER=mock.
// =============================================================================

import type { VideoPipelineAdapter } from "./PipelineAdapter";
import type {
  PipelineJobInput,
  PipelineStatusResponse,
  PipelineResults,
  PipelineJobStatusToken,
  PipelineStage,
  SegmentStatus,
} from "../../../../shared/film-analysis/types";

const STAGE_ORDER: PipelineStage[] = [
  "METADATA_EXTRACTION",
  "CALIBRATION",
  "PLAYER_DETECTION",
  "IDENTITY_TRACKING",
  "ROSTER_MAPPING",
  "POSSESSION_SEGMENTATION",
  "EVENT_CLASSIFICATION",
  "STAT_VALIDATION",
  "CLIP_BOUNDARY_GEN",
  "CONFIDENCE_SCORING",
];

interface MockJob {
  input: PipelineJobInput;
  startedAt: number;
  simulatedDurationMs: number;
  cancelled: boolean;
}

// Module-scoped store. Acceptable for the mock adapter; real adapters never
// hold per-job state in process memory.
const jobs = new Map<string, MockJob>();

export class MockPipelineAdapter implements VideoPipelineAdapter {
  async submitJob(input: PipelineJobInput): Promise<{ externalJobId: string }> {
    const externalJobId = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    jobs.set(externalJobId, {
      input,
      startedAt: Date.now(),
      simulatedDurationMs: 120_000, // 2 minute simulated run
      cancelled: false,
    });
    return { externalJobId };
  }

  async pollStatus(externalJobId: string): Promise<PipelineStatusResponse> {
    const job = jobs.get(externalJobId);
    if (!job) {
      throw new Error(`[MockPipelineAdapter] Unknown job: ${externalJobId}`);
    }

    if (job.cancelled) {
      return {
        externalJobId,
        status: "CANCELLED" satisfies PipelineJobStatusToken,
        progressPct: 0,
        currentStage: null,
        stageStatuses: {},
        estimatedCompletionMs: null,
      };
    }

    const elapsed = Date.now() - job.startedAt;
    const pct = Math.min(100, (elapsed / job.simulatedDurationMs) * 100);
    const stageIndex = Math.min(
      STAGE_ORDER.length - 1,
      Math.floor((pct / 100) * STAGE_ORDER.length)
    );
    const status: PipelineJobStatusToken = pct >= 100 ? "COMPLETE" : "RUNNING";

    const stageStatuses: Partial<Record<PipelineStage, SegmentStatus>> = {};
    STAGE_ORDER.forEach((stage, i) => {
      if (status === "COMPLETE") {
        stageStatuses[stage] = "COMPLETE";
      } else if (i < stageIndex) {
        stageStatuses[stage] = "COMPLETE";
      } else if (i === stageIndex) {
        stageStatuses[stage] = "RUNNING";
      } else {
        stageStatuses[stage] = "PENDING";
      }
    });

    return {
      externalJobId,
      status,
      progressPct: Math.round(pct),
      currentStage: status === "COMPLETE" ? null : STAGE_ORDER[stageIndex],
      stageStatuses,
      estimatedCompletionMs:
        status === "COMPLETE" ? null : job.simulatedDurationMs - elapsed,
    };
  }

  async fetchResults(externalJobId: string): Promise<PipelineResults> {
    const job = jobs.get(externalJobId);
    if (!job) {
      throw new Error(`[MockPipelineAdapter] Unknown job: ${externalJobId}`);
    }

    // Deterministic, minimal result set. Real adapters call the provider's
    // results API and normalize into our PipelineResults shape. The service
    // layer is responsible for persisting results into normalized DB tables
    // (TrackedPlayer, RosterLink, DetectedEvent, ProcessingIssue, etc.).
    return {
      trackedPlayers: [
        {
          filmSessionId: job.input.filmSessionId,
          analysisJobId: job.input.analysisJobId,
          trackingId: "track_mock_a",
          jerseyNumber: "3",
          teamSide: "HOME",
          detectionConfidence: 0.97,
          appearanceFrames: 42_000,
          thumbnailPath: null,
        },
        {
          filmSessionId: job.input.filmSessionId,
          analysisJobId: job.input.analysisJobId,
          trackingId: "track_mock_b",
          jerseyNumber: "11",
          teamSide: "HOME",
          detectionConfidence: 0.92,
          appearanceFrames: 38_500,
          thumbnailPath: null,
        },
      ],
      rosterLinks: [],
      detectedEvents: [],
      issues: [
        {
          analysisJobId: job.input.analysisJobId,
          entityType: null,
          entityId: null,
          issueCode: "LOW_LIGHT_PERIOD",
          severity: "INFO",
          message:
            "Brief low-light segment detected near tipoff. Detection confidence reduced for ~12 seconds.",
        },
      ],
    };
  }

  async cancelJob(externalJobId: string): Promise<void> {
    const job = jobs.get(externalJobId);
    if (job) job.cancelled = true;
  }
}
