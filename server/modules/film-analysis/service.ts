// ─────────────────────────────────────────────────────────────
// HoopsOS — Film AI Analysis: Service Interface + Mock Implementation
// ─────────────────────────────────────────────────────────────

import type {
  InitiateUploadRequest, InitiateUploadResponse,
  CreateSessionRequest, SubmitReviewRequest, CreateExportRequest,
  EventsQueryParams,
  FilmSession, AnalysisJob, DetectedEvent,
  PlayerStatLine, TeamStatSummary,
  HighlightCandidate, HighlightClip, HighlightReel,
  ReviewDecision, ExportRequest,
} from '../../../shared/film-analysis/types';

// ── Service Interface ────────────────────────────────────────

export interface FilmAnalysisService {
  // Upload
  initiateUpload(input: InitiateUploadRequest & { orgId: string; teamId: string; createdBy: string }): Promise<InitiateUploadResponse>;

  // Sessions
  createSession(input: CreateSessionRequest & { orgId: string; teamId: string; createdBy: string }): Promise<FilmSession>;
  listSessions(orgId: string, teamId: string): Promise<Array<FilmSession & { job: AnalysisJob }>>;
  getSessionDetail(orgId: string, teamId: string, sessionId: string): Promise<(FilmSession & { job: AnalysisJob }) | null>;

  // Jobs
  getLatestJob(orgId: string, teamId: string, sessionId: string): Promise<AnalysisJob | null>;
  triggerAnalysis(orgId: string, teamId: string, sessionId: string, userId: string, options?: { fromStage?: string }): Promise<AnalysisJob>;

  // Stats
  getTeamStats(orgId: string, teamId: string, sessionId: string): Promise<TeamStatSummary | null>;
  getPlayerStats(orgId: string, teamId: string, sessionId: string): Promise<PlayerStatLine[]>;

  // Events
  getEvents(orgId: string, teamId: string, sessionId: string, query: EventsQueryParams): Promise<DetectedEvent[]>;

  // Highlights
  getHighlights(orgId: string, teamId: string, sessionId: string): Promise<{ candidates: HighlightCandidate[]; clips: HighlightClip[]; reels: HighlightReel[] }>;
  approveClip(orgId: string, teamId: string, userId: string, body: any): Promise<HighlightClip>;
  upsertReel(orgId: string, teamId: string, userId: string, body: any): Promise<HighlightReel>;

  // Review
  submitReview(orgId: string, teamId: string, userId: string, body: SubmitReviewRequest): Promise<ReviewDecision>;

  // Export
  requestExport(orgId: string, teamId: string, userId: string, body: CreateExportRequest): Promise<ExportRequest>;
}

// ── Mock Implementation (dev/local only) ─────────────────────

import {
  mockSessionsList, mockAnalysisJob, mockTeamStats, mockPlayerStats,
  mockEvents, mockHighlightCandidates, mockHighlightClips, mockHighlightReel,
  mockFilmSession, mockReviewDecisions,
} from '../../../shared/film-analysis/mock-data';

import {
  UploadStatus, AnalysisJobStatus, AnalysisStage,
  ExportStatus, ReviewTargetType,
} from '../../../shared/film-analysis/types';

export class MockFilmAnalysisService implements FilmAnalysisService {

  async initiateUpload(input: any): Promise<InitiateUploadResponse> {
    return {
      assetId: `asset_${Date.now()}`,
      uploadUrl: `https://storage.example.com/upload/${Date.now()}?token=mock`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async createSession(input: any): Promise<FilmSession> {
    return {
      ...mockFilmSession,
      id: `session_${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      deletedAt: null,
    };
  }

  async listSessions(_orgId: string, _teamId: string) {
    return mockSessionsList;
  }

  async getSessionDetail(_orgId: string, _teamId: string, sessionId: string) {
    return mockSessionsList.find(s => s.id === sessionId) || mockSessionsList[0];
  }

  async getLatestJob(_orgId: string, _teamId: string, _sessionId: string) {
    return mockAnalysisJob;
  }

  async triggerAnalysis(_orgId: string, _teamId: string, sessionId: string, userId: string, _options?: any): Promise<AnalysisJob> {
    return {
      ...mockAnalysisJob,
      id: `job_${Date.now()}`,
      sessionId,
      status: AnalysisJobStatus.Queued,
      stage: AnalysisStage.Ingest,
      progressPct: 0,
      createdBy: userId,
      startedAt: null,
      finishedAt: null,
    };
  }

  async getTeamStats(_orgId: string, _teamId: string, _sessionId: string) {
    return mockTeamStats;
  }

  async getPlayerStats(_orgId: string, _teamId: string, _sessionId: string) {
    return mockPlayerStats;
  }

  async getEvents(_orgId: string, _teamId: string, _sessionId: string, query: EventsQueryParams) {
    let events = [...mockEvents];
    if (query.playerId) events = events.filter(e => e.primaryPlayerId === query.playerId);
    if (query.eventType) events = events.filter(e => e.type === query.eventType);
    if (query.needsReview !== undefined) events = events.filter(e => e.needsReview === query.needsReview);
    if (query.minConfidence !== undefined) events = events.filter(e => e.confidence >= query.minConfidence!);
    return events;
  }

  async getHighlights(_orgId: string, _teamId: string, _sessionId: string) {
    return {
      candidates: mockHighlightCandidates,
      clips: mockHighlightClips,
      reels: [mockHighlightReel],
    };
  }

  async approveClip(_orgId: string, _teamId: string, userId: string, body: any): Promise<HighlightClip> {
    return {
      ...mockHighlightClips[0],
      id: `clip_${Date.now()}`,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      ...body,
    };
  }

  async upsertReel(_orgId: string, _teamId: string, userId: string, body: any): Promise<HighlightReel> {
    return {
      ...mockHighlightReel,
      id: body.id || `reel_${Date.now()}`,
      createdBy: userId,
      ...body,
    };
  }

  async submitReview(_orgId: string, _teamId: string, userId: string, body: SubmitReviewRequest): Promise<ReviewDecision> {
    return {
      id: `rd_${Date.now()}`,
      orgId: _orgId,
      teamId: _teamId,
      targetType: body.targetType,
      targetId: body.targetId,
      before: {},
      after: body.after,
      decidedBy: userId,
      decidedAt: new Date().toISOString(),
      reason: body.reason || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      version: 1,
      deletedAt: null,
    };
  }

  async requestExport(_orgId: string, _teamId: string, userId: string, body: CreateExportRequest): Promise<ExportRequest> {
    return {
      id: `exp_${Date.now()}`,
      orgId: _orgId,
      teamId: _teamId,
      targetType: body.targetType,
      targetId: body.targetId,
      format: body.format,
      status: ExportStatus.Pending,
      resultUri: null,
      requestedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      version: 1,
      deletedAt: null,
    };
  }
}
