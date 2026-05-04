// ─────────────────────────────────────────────────────────────
// HoopsOS — Film AI Analysis: API Route Scaffolding (Phase 3)
// ─────────────────────────────────────────────────────────────
//
// Routes are namespaced under /api/film-analysis. Tenant scope comes from
// requireOrg(req) (Clerk session + org_members). Team scope uses the
// x-hoops-team-id header or session claims teamId / team_id.
// ─────────────────────────────────────────────────────────────

import type { NextFunction, Request, Response, Router } from "express";
import type {
  InitiateUploadRequest,
  CreateSessionRequest,
  SubmitReviewRequest,
  CreateExportRequest,
  EventsQueryParams,
} from "../../../shared/film-analysis/types";

import { HttpError, requireOrg } from "../../auth/tenant";
import type { FilmAnalysisService } from "./service";

function handleError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

export function registerFilmAnalysisRoutes(
  router: Router,
  service: FilmAnalysisService,
): void {
  router.post(
    "/uploads/initiate",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body: InitiateUploadRequest = req.body;

        const result = await service.initiateUpload({
          ...body,
          orgId,
          teamId,
          createdBy: userId,
        });

        res.status(201).json(result);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body: CreateSessionRequest = req.body;

        const session = await service.createSession({
          ...body,
          orgId,
          teamId,
          createdBy: userId,
        });

        res.status(201).json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const sessions = await service.listSessions(orgId, teamId);
        res.json(sessions);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const session = await service.getSessionDetail(
          orgId,
          teamId,
          req.params.id,
        );
        if (!session)
          return res.status(404).json({ error: "Session not found" });
        res.json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/jobs/latest",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const job = await service.getLatestJob(orgId, teamId, req.params.id);
        if (!job)
          return res.status(404).json({ error: "No analysis job found" });
        res.json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/sessions/:id/jobs",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const job = await service.triggerAnalysis(
          orgId,
          teamId,
          req.params.id,
          userId,
          req.body,
        );
        res.status(202).json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/stats/team",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getTeamStats(orgId, teamId, req.params.id);
        if (!stats)
          return res.status(404).json({ error: "Stats not available" });
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/stats/players",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getPlayerStats(
          orgId,
          teamId,
          req.params.id,
        );
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/events",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const query: EventsQueryParams = {
          playerId: req.query.playerId as string | undefined,
          period: req.query.period as string | undefined,
          eventType: req.query.eventType as EventsQueryParams["eventType"],
          minConfidence: req.query.minConfidence
            ? Number(req.query.minConfidence)
            : undefined,
          needsReview:
            req.query.needsReview === "true"
              ? true
              : req.query.needsReview === "false"
                ? false
                : undefined,
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const events = await service.getEvents(
          orgId,
          teamId,
          req.params.id,
          query,
        );
        res.json(events);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/highlights",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const highlights = await service.getHighlights(
          orgId,
          teamId,
          req.params.id,
        );
        res.json(highlights);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/highlights/clips",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const clip = await service.approveClip(
          orgId,
          teamId,
          userId,
          req.body,
        );
        res.status(201).json(clip);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/highlights/reels",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const reel = await service.upsertReel(
          orgId,
          teamId,
          userId,
          req.body,
        );
        res.status(201).json(reel);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/review/decisions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId =
          (req.query.sessionId as string | undefined) ??
          (req.body.sessionId as string | undefined);
        const body = {
          ...req.body,
          sessionId,
        } as SubmitReviewRequest & { sessionId?: string };
        const decision = await service.submitReview(
          orgId,
          teamId,
          userId,
          body,
        );
        res.status(201).json(decision);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/exports",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId =
          (req.query.sessionId as string | undefined) ??
          (req.body.sessionId as string | undefined);
        const body = {
          ...req.body,
          sessionId,
        } as CreateExportRequest & { sessionId?: string };
        const exportReq = await service.requestExport(
          orgId,
          teamId,
          userId,
          body,
        );
        res.status(202).json(exportReq);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );
}
