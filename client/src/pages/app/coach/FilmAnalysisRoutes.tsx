/**
 * FilmAnalysisRoutes.tsx
 *
 * Route definitions for the Film AI Analysis module using wouter (same as
 * App.tsx). Paths mirror the coach film room surface.
 */

import * as React from "react";
import { Route } from "wouter";
import {
  FilmRoomPage,
  FilmUploadPage,
  FilmSessionPage,
  PlayerHighlightsPage,
} from "./FilmAnalysisPages";

export function FilmAnalysisRoutes(): React.ReactNode {
  return (
    <>
      <Route path="/coach/film" component={FilmRoomPage} />
      <Route path="/coach/film/upload" component={FilmUploadPage} />
      <Route path="/coach/film/:sessionId" component={FilmSessionPage} />
      <Route
        path="/player/highlights/:playerId"
        component={PlayerHighlightsPage}
      />
    </>
  );
}
