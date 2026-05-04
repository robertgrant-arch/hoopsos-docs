/**
 * shared/film-analysis/mock.ts
 *
 * Lightweight UI-facing types and mock data for the Coach HQ Film Analysis
 * frontend module (FilmAnalysisPages.tsx + useFilmAnalysis hook).
 */

export type FilmSessionStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  timeSec: number;
}

export interface TeamGameStats {
  points: number;
  fgPct: number;
  threePct: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  pace: number;
}

export interface PlayerStatLineUI {
  playerId: string;
  playerName: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
}

export interface FilmSession {
  id: string;
  title: string;
  status: FilmSessionStatus;
  gameDate: string;
  opponent: string;
  progressPct: number;
  durationSec: number;
  teamStats: TeamGameStats;
  timeline: TimelineEvent[];
  playerStats: PlayerStatLineUI[];
  createdAt?: string;
}

export interface PlayerHighlight {
  id: string;
  playerId: string;
  kind: string;
  startSec: number;
  endSec: number;
  caption: string;
}

export interface CreateSessionInput {
  title: string;
  opponent: string;
  gameDate: string;
}

const sampleTeamStats: TeamGameStats = {
  points: 68, fgPct: 0.46, threePct: 0.38, rebounds: 34,
  assists: 16, turnovers: 11, pace: 72,
};

const sampleTimeline: TimelineEvent[] = [
  { id: "ev_1", type: "made_three", description: "#11 corner three", timeSec: 142 },
  { id: "ev_2", type: "steal", description: "#4 steal in backcourt", timeSec: 311 },
  { id: "ev_3", type: "timeout", description: "Opponent timeout", timeSec: 540 },
  { id: "ev_4", type: "made_layup", description: "#23 fast break layup", timeSec: 812 },
];

const samplePlayerStats: PlayerStatLineUI[] = [
  { playerId: "p_11", playerName: "J. Carter", minutes: 28, points: 18, rebounds: 4, assists: 6 },
  { playerId: "p_23", playerName: "M. Rivera", minutes: 26, points: 14, rebounds: 7, assists: 2 },
  { playerId: "p_4",  playerName: "D. Brooks", minutes: 22, points: 9,  rebounds: 3, assists: 5 },
];

export const mockFilmSessions: FilmSession[] = [
  {
    id: "fs_001",
    title: "vs. Eastside - Game 7",
    status: "ready",
    gameDate: "2026-04-28",
    opponent: "Eastside Eagles",
    progressPct: 100,
    durationSec: 2880,
    teamStats: sampleTeamStats,
    timeline: sampleTimeline,
    playerStats: samplePlayerStats,
  },
  {
    id: "fs_002",
    title: "vs. Northgate - Scrimmage",
    status: "processing",
    gameDate: "2026-05-01",
    opponent: "Northgate Knights",
    progressPct: 62,
    durationSec: 2400,
    teamStats: { ...sampleTeamStats, points: 54, assists: 12 },
    timeline: sampleTimeline.slice(0, 2),
    playerStats: samplePlayerStats.slice(0, 2),
  },
  {
    id: "fs_003",
    title: "vs. Westview - Practice Film",
    status: "queued",
    gameDate: "2026-05-03",
    opponent: "Westview Wolves",
    progressPct: 0,
    durationSec: 0,
    teamStats: { ...sampleTeamStats, points: 0 },
    timeline: [],
    playerStats: [],
  },
];

export const mockPlayerHighlights: PlayerHighlight[] = [
  { id: "hl_1", playerId: "p_11", kind: "made_three", startSec: 138, endSec: 152, caption: "Corner three off the swing pass." },
  { id: "hl_2", playerId: "p_11", kind: "assist", startSec: 612, endSec: 624, caption: "Drive-and-kick to the wing." },
  { id: "hl_3", playerId: "p_23", kind: "defensive_rebound", startSec: 401, endSec: 410, caption: "Boxed out and secured the board." },
  { id: "hl_4", playerId: "p_4", kind: "steal", startSec: 305, endSec: 318, caption: "Read the passing lane and finished in transition." },
];
