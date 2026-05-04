import { createRepository } from "@shared/db";
import type { FilmSession as FilmSessionRow } from "@shared/db/schema/film_sessions";
import type { AnalysisJob as DbAnalysisJobRow } from "@shared/db/schema/analysis_jobs";
import type { Annotation as AnnotationRow } from "@shared/db/schema/annotations";
import {
  AnalysisJobStatus,
  AnalysisStage,
  DetectedEventType,
  ExportFormat,
  ExportStatus,
  ExportTargetType,
  FilmSessionKind,
  HighlightCandidateStatus,
  HomeAway,
  ReelVisibility,
  type AnalysisJob,
  type CreateExportRequest,
  type CreateSessionRequest,
  type DetectedEvent,
  type EventsQueryParams,
  type ExportRequest,
  type FilmSession,
  type HighlightCandidate,
  type HighlightClip,
  type HighlightReel,
  type InitiateUploadRequest,
  type InitiateUploadResponse,
  type PlayerStatLine,
  type ReviewDecision,
  type SubmitReviewRequest,
  type TeamStatSummary,
} from "../../../shared/film-analysis/types";
import { HttpError } from "../../auth/tenant";
import type { FilmAnalysisService } from "./service";

function asPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function teamScopeMatches(session: FilmSessionRow, teamId: string): boolean {
  const team = asPayload(session.payload).teamId;
  if (typeof team !== "string" || team.length === 0) return true;
  return team === teamId;
}

function dbKindToApi(kind: string): FilmSessionKind {
  if (kind === "practice") return FilmSessionKind.Practice;
  if (kind === "scrimmage") return FilmSessionKind.Scrimmage;
  return FilmSessionKind.Game;
}

function apiKindToDb(kind: FilmSessionKind): FilmSessionRow["kind"] {
  const v = kind as string;
  if (v === "practice") return "practice";
  if (v === "scrimmage") return "scrimmage";
  if (v === "game") return "game";
  return "other";
}

function parseHomeAway(v: string | null | undefined): HomeAway {
  if (v === "away") return HomeAway.Away;
  if (v === "neutral") return HomeAway.Neutral;
  return HomeAway.Home;
}

function homeAwayToDb(ha: HomeAway): string {
  return ha as unknown as string;
}

function mapJobStatus(db: string): AnalysisJobStatus {
  switch (db) {
    case "queued":
      return AnalysisJobStatus.Queued;
    case "running":
      return AnalysisJobStatus.Running;
    case "retrying":
      return AnalysisJobStatus.Partial;
    case "succeeded":
      return AnalysisJobStatus.Succeeded;
    case "failed":
      return AnalysisJobStatus.Failed;
    case "cancelled":
      return AnalysisJobStatus.Cancelled;
    default:
      return AnalysisJobStatus.Queued;
  }
}

function syntheticQueuedJob(
  session: FilmSessionRow,
  orgId: string,
  teamId: string,
): AnalysisJob {
  return {
    id: `pending-job-${session.id}`,
    orgId,
    teamId,
    createdBy: session.createdByUserId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    version: 1,
    deletedAt: null,
    sessionId: session.id,
    providerId: "hoopsos-db",
    modelVersion: "pr2",
    status: AnalysisJobStatus.Queued,
    stage: AnalysisStage.Ingest,
    progressPct: 0,
    startedAt: null,
    finishedAt: null,
    errorCode: null,
    errorMessage: null,
    parentJobId: null,
  };
}

function mapDbJobToApi(
  row: DbAnalysisJobRow,
  ctx: { orgId: string; teamId: string; userId: string },
): AnalysisJob {
  const payload = asPayload(row.payload);
  const stage =
    (payload.stage as AnalysisStage | undefined) ?? AnalysisStage.Ingest;
  const progressPct =
    typeof payload.progressPct === "number"
      ? payload.progressPct
      : row.status === "succeeded"
        ? 100
        : 0;
  return {
    id: row.id,
    orgId: ctx.orgId,
    teamId: ctx.teamId,
    createdBy:
      (typeof payload.createdByUserId === "string" && payload.createdByUserId) ||
      ctx.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    sessionId: row.sessionId,
    providerId: (payload.providerId as string) ?? "hoopsos-db",
    modelVersion: (payload.modelVersion as string) ?? "pr2",
    status: mapJobStatus(row.status),
    stage,
    progressPct,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    errorCode: row.lastError ? "job_error" : null,
    errorMessage: row.lastError ?? null,
    parentJobId:
      typeof payload.parentJobId === "string" ? payload.parentJobId : null,
  };
}

function mapSessionRowToApi(
  row: FilmSessionRow,
  teamId: string,
  primaryAssetId: string,
): FilmSession {
  const playedAt =
    row.playedAt?.toISOString() ?? row.createdAt.toISOString();
  return {
    id: row.id,
    orgId: row.orgId,
    teamId,
    createdBy: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    assetId: primaryAssetId,
    kind: dbKindToApi(row.kind),
    opponentTeamId: null,
    opponentName: row.opponent ?? null,
    playedAt,
    homeAway: parseHomeAway(row.homeAway),
    rosterSnapshotId: null,
    notes: row.description ?? null,
    title: row.title,
  };
}

async function primaryAssetIdForSession(
  repo: ReturnType<typeof createRepository>,
  sessionId: string,
  fallbackFromPayload?: string,
): Promise<string> {
  if (fallbackFromPayload) return fallbackFromPayload;
  const assets = await repo.filmAssets.listForSession(sessionId);
  const primary =
    assets.find((a) => a.kind === "source") ?? assets[0] ?? null;
  return primary?.id ?? sessionId;
}

function annotationToEvent(
  row: AnnotationRow,
  ctx: { orgId: string; teamId: string; sessionId: string },
): DetectedEvent | null {
  const data = asPayload(row.data);
  const type = data.eventType as DetectedEventType | undefined;
  if (!type) return null;
  return {
    id: row.id,
    orgId: ctx.orgId,
    teamId: ctx.teamId,
    createdBy: row.authorUserId ?? "system",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    sessionId: ctx.sessionId,
    segmentId: (data.segmentId as string) ?? "seg_root",
    tMs: row.startMs,
    endMs: row.endMs ?? null,
    type,
    primaryPlayerId: (data.primaryPlayerId as string) ?? null,
    primaryPlayerName: (data.primaryPlayerName as string) ?? null,
    assistPlayerId: (data.assistPlayerId as string) ?? null,
    assistPlayerName: (data.assistPlayerName as string) ?? null,
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    needsReview: Boolean(data.needsReview),
    providerEventId: (data.providerEventId as string) ?? null,
  };
}

function parseHighlightPayload(
  row: AnnotationRow,
  ctx: { orgId: string; teamId: string },
): { part: string } & Record<string, unknown> {
  const data = asPayload(row.data);
  const part =
    (data.highlightPart as string) ||
    (row.kind === "highlight" ? "candidate" : "");
  return { part, ...data, orgId: ctx.orgId, teamId: ctx.teamId };
}

export class DbFilmAnalysisService implements FilmAnalysisService {
  async initiateUpload(
    input: InitiateUploadRequest & {
      orgId: string;
      teamId: string;
      createdBy: string;
    },
  ): Promise<InitiateUploadResponse> {
    const repo = createRepository({
      orgId: input.orgId,
      userId: input.createdBy,
    });
    const session = await repo.filmSessions.create({
      title: `Upload: ${input.filename}`,
      kind: "game",
      status: "uploading",
      payload: {
        teamId: input.teamId,
        pendingUpload: true,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
    });
    const asset = await repo.filmAssets.create({
      sessionId: session.id,
      kind: "source",
      status: "pending",
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      payload: {},
    });
    await repo.filmSessions.update(session.id, {
      payload: {
        ...asPayload(session.payload),
        teamId: input.teamId,
        primaryFilmAssetId: asset.id,
      },
    });
    return {
      assetId: asset.id,
      uploadUrl:
        "https://api.mux.com/video/v1/uploads/direct-upload-url-pending-pr3",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };
  }

  async createSession(
    input: CreateSessionRequest & {
      orgId: string;
      teamId: string;
      createdBy: string;
    },
  ): Promise<FilmSession> {
    const repo = createRepository({
      orgId: input.orgId,
      userId: input.createdBy,
    });
    const asset = await repo.filmAssets.getById(input.assetId);
    if (!asset) throw new HttpError(404, "Asset not found");
    const sessionRow = await repo.filmSessions.getById(asset.sessionId);
    if (!sessionRow) throw new HttpError(404, "Session not found");
    if (!teamScopeMatches(sessionRow, input.teamId)) {
      throw new HttpError(403, "Team mismatch for session");
    }
    const mergedPayload = {
      ...asPayload(sessionRow.payload),
      teamId: input.teamId,
      pendingUpload: false,
      primaryFilmAssetId: input.assetId,
    };
    await repo.filmSessions.update(asset.sessionId, {
      title: input.title,
      kind: apiKindToDb(input.kind),
      status: "draft",
      opponent: input.opponentName ?? null,
      homeAway: homeAwayToDb(input.homeAway),
      playedAt: input.playedAt ? new Date(input.playedAt) : null,
      description: input.notes ?? null,
      payload: mergedPayload,
    });
    const updated = await repo.filmSessions.getById(asset.sessionId);
    if (!updated) throw new HttpError(500, "Session update failed");
    const aid = await primaryAssetIdForSession(
      repo,
      updated.id,
      input.assetId,
    );
    return mapSessionRowToApi(updated, input.teamId, aid);
  }

  async listSessions(
    orgId: string,
    teamId: string,
  ): Promise<Array<FilmSession & { job: AnalysisJob }>> {
    const repo = createRepository({ orgId, userId: "system" });
    const rows = await repo.filmSessions.list({ limit: 100 });
    const out: Array<FilmSession & { job: AnalysisJob }> = [];
    for (const row of rows) {
      if (!teamScopeMatches(row, teamId)) continue;
      const jobs = await repo.analysisJobs.listForSession(row.id);
      const jobRow = jobs[0];
      const aid = await primaryAssetIdForSession(
        repo,
        row.id,
        typeof asPayload(row.payload).primaryFilmAssetId === "string"
          ? (asPayload(row.payload).primaryFilmAssetId as string)
          : undefined,
      );
      const session = mapSessionRowToApi(row, teamId, aid);
      const job = jobRow
        ? mapDbJobToApi(jobRow, { orgId, teamId, userId: row.createdByUserId })
        : syntheticQueuedJob(row, orgId, teamId);
      out.push({ ...session, job });
    }
    return out;
  }

  async getSessionDetail(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<(FilmSession & { job: AnalysisJob }) | null> {
    const repo = createRepository({ orgId, userId: "system" });
    const row = await repo.filmSessions.getById(sessionId);
    if (!row || !teamScopeMatches(row, teamId)) return null;
    const jobs = await repo.analysisJobs.listForSession(sessionId);
    const jobRow = jobs[0];
    const aid = await primaryAssetIdForSession(
      repo,
      row.id,
      typeof asPayload(row.payload).primaryFilmAssetId === "string"
        ? (asPayload(row.payload).primaryFilmAssetId as string)
        : undefined,
    );
    const session = mapSessionRowToApi(row, teamId, aid);
    const job = jobRow
      ? mapDbJobToApi(jobRow, { orgId, teamId, userId: row.createdByUserId })
      : syntheticQueuedJob(row, orgId, teamId);
    return { ...session, job };
  }

  async getLatestJob(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<AnalysisJob | null> {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return null;
    const jobs = await repo.analysisJobs.listForSession(sessionId);
    const row = jobs[0];
    if (!row) return null;
    return mapDbJobToApi(row, {
      orgId,
      teamId,
      userId: session.createdByUserId,
    });
  }

  async triggerAnalysis(
    orgId: string,
    teamId: string,
    sessionId: string,
    userId: string,
    _options?: { fromStage?: string },
  ): Promise<AnalysisJob> {
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.analysisJobs.enqueue({
      sessionId,
      kind: "ingest",
      payload: {
        teamId,
        createdByUserId: userId,
        stage: AnalysisStage.Ingest,
        progressPct: 0,
        providerId: "hoopsos-ingest",
        modelVersion: "pr2",
      },
    });
    return mapDbJobToApi(row, { orgId, teamId, userId });
  }

  async getTeamStats(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<TeamStatSummary | null> {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return null;
    const derivedAt = new Date().toISOString();
    return {
      id: `team-stats-${sessionId}`,
      orgId,
      teamId,
      createdBy: session.createdByUserId,
      createdAt: derivedAt,
      updatedAt: derivedAt,
      version: 1,
      deletedAt: null,
      sessionId,
      teamName: session.title,
      pts: 0,
      ast: 0,
      reb: 0,
      oreb: 0,
      dreb: 0,
      stl: 0,
      blk: 0,
      to: 0,
      fls: 0,
      fg: 0,
      fga: 0,
      tp: 0,
      tpa: 0,
      ft: 0,
      fta: 0,
      pace: null,
      offRtg: null,
      defRtg: null,
      derivedAt,
    };
  }

  async getPlayerStats(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<PlayerStatLine[]> {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return [];
    return [];
  }

  async getEvents(
    orgId: string,
    teamId: string,
    sessionId: string,
    query: EventsQueryParams,
  ): Promise<DetectedEvent[]> {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return [];
    const rows = await repo.annotations.listForSession(sessionId);
    let events = rows
      .map((r) =>
        annotationToEvent(r, { orgId, teamId, sessionId }),
      )
      .filter((e): e is DetectedEvent => e !== null);
    if (query.playerId) {
      events = events.filter((e) => e.primaryPlayerId === query.playerId);
    }
    if (query.eventType) {
      events = events.filter((e) => e.type === query.eventType);
    }
    if (query.needsReview !== undefined) {
      events = events.filter((e) => e.needsReview === query.needsReview);
    }
    if (query.minConfidence !== undefined) {
      events = events.filter((e) => e.confidence >= query.minConfidence!);
    }
    return events;
  }

  async getHighlights(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<{
    candidates: HighlightCandidate[];
    clips: HighlightClip[];
    reels: HighlightReel[];
  }> {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      return { candidates: [], clips: [], reels: [] };
    }
    const rows = await repo.annotations.listForSession(sessionId);
    const candidates: HighlightCandidate[] = [];
    const clips: HighlightClip[] = [];
    const reels: HighlightReel[] = [];
    for (const row of rows) {
      if (row.kind !== "highlight") continue;
      const hp = parseHighlightPayload(row, { orgId, teamId });
      if (hp.part === "candidate") {
        candidates.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          sessionId,
          playerId: (hp.playerId as string) ?? null,
          playerName: (hp.playerName as string) ?? null,
          eventIds: (hp.eventIds as string[]) ?? [],
          startMs: row.startMs,
          endMs: row.endMs ?? row.startMs,
          score: typeof hp.score === "number" ? hp.score : 0,
          reason: typeof hp.reason === "string" ? hp.reason : "",
          status:
            (hp.status as HighlightCandidateStatus) ??
            HighlightCandidateStatus.Proposed,
          thumbnailUri: (hp.thumbnailUri as string) ?? null,
        });
      } else if (hp.part === "clip") {
        clips.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          candidateId: (hp.candidateId as string) ?? "unknown",
          mediaRef: {
            assetId: (hp.assetId as string) ?? sessionId,
            startMs: row.startMs,
            endMs: row.endMs ?? row.startMs,
          },
          coachNotes: (hp.coachNotes as string) ?? null,
          approvedBy: (hp.approvedBy as string) ?? null,
          approvedAt: (hp.approvedAt as string) ?? null,
          title: (hp.title as string) ?? undefined,
        });
      } else if (hp.part === "reel") {
        reels.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          playerId: (hp.playerId as string) ?? null,
          playerName: (hp.playerName as string) ?? null,
          clipIds: (hp.clipIds as string[]) ?? [],
          title: (hp.title as string) ?? "Reel",
          visibility:
            (hp.visibility as ReelVisibility) ?? ReelVisibility.Team,
          publishedAt: (hp.publishedAt as string) ?? null,
        });
      }
    }
    return { candidates, clips, reels };
  }

  async approveClip(
    orgId: string,
    teamId: string,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<HighlightClip> {
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) throw new HttpError(400, "sessionId is required");
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const now = new Date().toISOString();
    const row = await repo.annotations.create({
      sessionId,
      kind: "highlight",
      source: "coach",
      authorUserId: userId,
      startMs: typeof body.startMs === "number" ? body.startMs : 0,
      endMs: typeof body.endMs === "number" ? body.endMs : null,
      label: "clip",
      body: typeof body.title === "string" ? body.title : null,
      data: {
        highlightPart: "clip",
        candidateId: body.candidateId,
        assetId: body.assetId,
        coachNotes: body.coachNotes,
        title: body.title,
        approvedBy: userId,
        approvedAt: now,
      },
      payload: {},
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      candidateId: (body.candidateId as string) ?? "unknown",
      mediaRef: {
        assetId: (body.assetId as string) ?? sessionId,
        startMs: row.startMs,
        endMs: row.endMs ?? row.startMs,
      },
      coachNotes: (body.coachNotes as string) ?? null,
      approvedBy: userId,
      approvedAt: now,
      title: body.title as string | undefined,
    };
  }

  async upsertReel(
    orgId: string,
    teamId: string,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<HighlightReel> {
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) throw new HttpError(400, "sessionId is required");
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.annotations.create({
      sessionId,
      kind: "highlight",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "reel",
      body: typeof body.title === "string" ? body.title : null,
      data: {
        highlightPart: "reel",
        id: body.id,
        title: body.title,
        description: body.description,
        clipIds: body.clipIds,
        isPublished: body.isPublished,
        visibility: body.visibility,
      },
      payload: {},
    });
    return {
      id: (body.id as string) || row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      playerId: (body.subjectRosterMemberId as string) ?? null,
      playerName: null,
      clipIds: (body.clipIds as string[]) ?? [],
      title: (body.title as string) ?? "Reel",
      visibility: ReelVisibility.Team,
      publishedAt: null,
    };
  }

  async submitReview(
    orgId: string,
    teamId: string,
    userId: string,
    body: SubmitReviewRequest & { sessionId?: string },
  ): Promise<ReviewDecision> {
    const repo = createRepository({ orgId, userId });
    const sessionId = body.sessionId;
    if (!sessionId) {
      throw new HttpError(400, "sessionId is required on review payload");
    }
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const decidedAt = new Date().toISOString();
    const row = await repo.annotations.create({
      sessionId,
      kind: "note",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "review_decision",
      body: body.reason ?? null,
      data: {
        targetType: body.targetType,
        targetId: body.targetId,
        after: body.after,
      },
      payload: {},
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      targetType: body.targetType,
      targetId: body.targetId,
      before: {},
      after: body.after,
      decidedBy: userId,
      decidedAt,
      reason: body.reason ?? null,
    };
  }

  async requestExport(
    orgId: string,
    teamId: string,
    userId: string,
    body: CreateExportRequest & { sessionId?: string },
  ): Promise<ExportRequest> {
    const repo = createRepository({ orgId, userId });
    const sessionId = body.sessionId;
    if (!sessionId) {
      throw new HttpError(400, "sessionId is required on export payload");
    }
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.annotations.create({
      sessionId,
      kind: "note",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "export_request",
      body: null,
      data: {
        exportType: body.targetType,
        sourceId: body.targetId,
        format: body.format,
      },
      payload: {},
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      targetType: body.targetType as ExportTargetType,
      targetId: body.targetId,
      format: body.format as ExportFormat,
      status: ExportStatus.Pending,
      resultUri: null,
      requestedBy: userId,
    };
  }
}
