/**
 * useFilmAnalysis.ts
 *
 * React hook providing the Coach HQ Film Room and Player Highlights pages
 * with film session data, mutations, and player highlight lookups.
 *
 * Currently backed by the shared mock layer (shared/film-analysis/mock).
 * To switch to the real backend, replace the mock-data imports with
 * `fetch("/api/film/sessions")` calls (or SWR/React Query) — the public
 * shape of this hook is intentionally fetch-friendly.
 */

import * as React from "react";
import {
  mockFilmSessions,
  mockPlayerHighlights,
} from "@shared/film-analysis/mock";
import type {
  FilmSession,
  PlayerHighlight,
  CreateSessionInput,
} from "@shared/film-analysis/types";

interface UseFilmAnalysisResult {
  sessions: FilmSession[];
  isLoading: boolean;
  error: Error | null;
  getSession: (id: string) => FilmSession | undefined;
  getPlayerHighlights: (playerId: string) => PlayerHighlight[];
  createSession: (input: CreateSessionInput) => Promise<FilmSession>;
}

export function useFilmAnalysis(): UseFilmAnalysisResult {
  const [sessions, setSessions] = React.useState<FilmSession[]>(mockFilmSessions);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  const getSession = React.useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  );

  const getPlayerHighlights = React.useCallback(
    (playerId: string) =>
      mockPlayerHighlights.filter((h) => h.playerId === playerId),
    []
  );

  const createSession = React.useCallback(
    async (input: CreateSessionInput): Promise<FilmSession> => {
      const newSession: FilmSession = {
        id: `session_${Date.now()}`,
        title: input.title,
        opponent: input.opponent,
        gameDate: input.gameDate,
        status: "processing",
        progressPct: 5,
        createdAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      // Simulate processing pipeline progress.
      simulateProgress(newSession.id, setSessions);
      return newSession;
    },
    []
  );

  return {
    sessions,
    isLoading,
    error,
    getSession,
    getPlayerHighlights,
    createSession,
  };
}

function simulateProgress(
  id: string,
  setSessions: React.Dispatch<React.SetStateAction<FilmSession[]>>
) {
  let pct = 5;
  const interval = setInterval(() => {
    pct += 15;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              progressPct: Math.min(pct, 100),
              status: pct >= 100 ? "ready" : "processing",
            }
          : s
      )
    );
    if (pct >= 100) clearInterval(interval);
  }, 1500);
}
