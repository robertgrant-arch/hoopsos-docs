/**
 * FilmAnalysisRoutes.tsx
 *
 * Optional wouter routes aligned with App.tsx paths. Prefer registering
 * these in App.tsx (as today); this file is for copy-paste / experiments.
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
      <Route path="/app/coach/film" component={FilmRoomPage} />
      <Route path="/app/coach/film/upload" component={FilmUploadPage} />
      <Route path="/app/coach/film/sessions/:id" component={FilmSessionPage} />
      <Route
        path="/app/player/highlights/:playerId"
        component={PlayerHighlightsPage}
      />
      <Route path="/app/player/highlights" component={PlayerHighlightsPage} />
    </>
  );
}
