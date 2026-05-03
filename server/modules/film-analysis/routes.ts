// ─────────────────────────────────────────────────────────────
// HoopsOS — Film AI Analysis: API Route Scaffolding (Phase 3)
// ─────────────────────────────────────────────────────────────
//
// This file defines the Express-style route scaffolding for the
// Film Analysis API surface. All routes are namespaced under
// /api/film-analysis and scoped by orgId/teamId from auth context.
//
// Backend dependencies (DB, queue, object storage) are abstracted
// behind service interfaces so the module can run against mock data
// during early development.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, Router } from 'express';
import type {
  InitiateUploadRequest, InitiateUploadResponse,
  CreateSessionRequest, SubmitReviewRequest, CreateExportRequest,
  EventsQueryParams,
  FilmSession, AnalysisJob, DetectedEvent,
  PlayerStatLine, TeamStatSummary,
  HighlightCandidate, HighlightClip, HighlightReel,
  ReviewDecision, ExportRequest,
} from '../../../shared/film-analysis/types';

import { FilmAnalysisService } from './service';

// ── Route registration ───────────────────────────────────────

export function registerFilmAnalysisRoutes(router: Router, service: FilmAnalysisService): void {

  // ── Upload ───────────────────────────────────────────────

  /** POST /api/film-analysis/uploads/initiate */
  router.post('/uploads/initiate', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const body: InitiateUploadRequest = req.body;

    const result = await service.initiateUpload({
      ...body,
      orgId,
      teamId,
      createdBy: userId,
    });

    res.status(201).json(result);
  });

  // ── Sessions ─────────────────────────────────────────────

  /** POST /api/film-analysis/sessions */
  router.post('/sessions', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const body: CreateSessionRequest = req.body;

    const session = await service.createSession({
      ...body,
      orgId,
      teamId,
      createdBy: userId,
    });

    res.status(201).json(session);
  });

  /** GET /api/film-analysis/sessions */
  router.get('/sessions', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const sessions = await service.listSessions(orgId, teamId);
    res.json(sessions);
  });

  /** GET /api/film-analysis/sessions/:id */
  router.get('/sessions/:id', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const session = await service.getSessionDetail(orgId, teamId, req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  });

  // ── Analysis Jobs ────────────────────────────────────────

  /** GET /api/film-analysis/sessions/:id/jobs/latest */
  router.get('/sessions/:id/jobs/latest', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const job = await service.getLatestJob(orgId, teamId, req.params.id);
    if (!job) return res.status(404).json({ error: 'No analysis job found' });
    res.json(job);
  });

  /** POST /api/film-analysis/sessions/:id/jobs — trigger analysis or rerun */
  router.post('/sessions/:id/jobs', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const job = await service.triggerAnalysis(orgId, teamId, req.params.id, userId, req.body);
    res.status(202).json(job);
  });

  // ── Stats ────────────────────────────────────────────────

  /** GET /api/film-analysis/sessions/:id/stats/team */
  router.get('/sessions/:id/stats/team', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const stats = await service.getTeamStats(orgId, teamId, req.params.id);
    if (!stats) return res.status(404).json({ error: 'Stats not available' });
    res.json(stats);
  });

  /** GET /api/film-analysis/sessions/:id/stats/players */
  router.get('/sessions/:id/stats/players', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const stats = await service.getPlayerStats(orgId, teamId, req.params.id);
    res.json(stats);
  });

  // ── Events ───────────────────────────────────────────────

  /** GET /api/film-analysis/sessions/:id/events */
  router.get('/sessions/:id/events', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const query: EventsQueryParams = {
      playerId: req.query.playerId as string | undefined,
      period: req.query.period as string | undefined,
      eventType: req.query.eventType as any,
      minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined,
      needsReview: req.query.needsReview === 'true' ? true : req.query.needsReview === 'false' ? false : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const events = await service.getEvents(orgId, teamId, req.params.id, query);
    res.json(events);
  });

  // ── Highlights ───────────────────────────────────────────

  /** GET /api/film-analysis/sessions/:id/highlights */
  router.get('/sessions/:id/highlights', async (req: Request, res: Response) => {
    const { orgId, teamId } = req.authContext;
    const highlights = await service.getHighlights(orgId, teamId, req.params.id);
    res.json(highlights);
  });

  /** POST /api/film-analysis/highlights/clips — approve/trim clip */
  router.post('/highlights/clips', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const clip = await service.approveClip(orgId, teamId, userId, req.body);
    res.status(201).json(clip);
  });

  /** POST /api/film-analysis/highlights/reels — create/update reel */
  router.post('/highlights/reels', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const reel = await service.upsertReel(orgId, teamId, userId, req.body);
    res.status(201).json(reel);
  });

  // ── Review ───────────────────────────────────────────────

  /** POST /api/film-analysis/review/decisions */
  router.post('/review/decisions', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const body: SubmitReviewRequest = req.body;
    const decision = await service.submitReview(orgId, teamId, userId, body);
    res.status(201).json(decision);
  });

  // ── Export ───────────────────────────────────────────────

  /** POST /api/film-analysis/exports */
  router.post('/exports', async (req: Request, res: Response) => {
    const { orgId, teamId, userId } = req.authContext;
    const body: CreateExportRequest = req.body;
    const exportReq = await service.requestExport(orgId, teamId, userId, body);
    res.status(202).json(exportReq);
  });
}

// ── Auth context type augmentation ───────────────────────────

declare global {
  namespace Express {
    interface Request {
      authContext: {
        orgId: string;
        teamId: string;
        userId: string;
        roles: string[];
      };
    }
  }
}
