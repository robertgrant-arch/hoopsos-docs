/**
 * FilmAnalysisRoutes.tsx
 *
 * Route definitions for the Film AI Analysis module.
 * Drop these <Route /> elements into the existing app router
 * (see App.tsx) under the appropriate Coach HQ and Player App
 * sections. Kept separate from FilmAnalysisPages.tsx so route
 * registration is additive and easy to review.
 *
 * Routes added:
 *   /coach/film                        → FilmRoomPage
 *   /coach/film/upload                 → FilmUploadPage
 *   /coach/film/:sessionId             → FilmSessionPage
 *   /player/highlights/:playerId       → PlayerHighlightsPage
 *
 * Usage in App.tsx:
 *
 *   import { FilmAnalysisRoutes } from "@/pages/app/coach/FilmAnalysisRoutes";
 *   ...
 *   <Routes>
 *     ...existing routes...
 *     {FilmAnalysisRoutes()}
 *   </Routes>
 */

import * as React from "react";
import { Route } from "react-router-dom";
import {
  FilmRoomPage,
  FilmUploadPage,
  FilmSessionPage,
  PlayerHighlightsPage,
} from "./FilmAnalysisPages";

export function FilmAnalysisRoutes(): React.ReactNode {
  return (
    <>
      <Route path="/coach/film" element={<FilmRoomPage />} />
      <Route path="/coach/film/upload" element={<FilmUploadPage />} />
      <Route path="/coach/film/:sessionId" element={<FilmSessionPage />} />
      <Route
        path="/player/highlights/:playerId"
        element={<PlayerHighlightsPage />}
      />
    </>
  );
}

export const FILM_ANALYSIS_ROUTE_PATHS = {
  filmRoom: "/coach/film",
  filmUpload: "/coach/film/upload",
  filmSession: (sessionId: string) => `/coach/film/${sessionId}`,
  playerHighlights: (playerId: string) => `/player/highlights/${playerId}`,
} as const;
