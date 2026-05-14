import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { registerFilmAnalysisRoutes } from "./modules/film-analysis/routes";
import { DbFilmAnalysisService } from "./modules/film-analysis/service";
import { registerMeRoute } from "./routes/me";
import { registerRosterRoutes } from "./modules/roster/routes";
import { registerAssignmentRoutes } from "./modules/assignments/routes";
import { registerPracticePlanRoutes } from "./modules/practice-plans/routes";
import { registerEventRoutes } from "./modules/events/routes";
import { registerReadinessRoutes } from "./modules/readiness/routes";
import { registerMessagingRoutes } from "./modules/messaging/routes";
import { registerWebhookRoutes } from "./routes/webhooks";
import { inngest } from "./inngest/client";
import { analyzeFilmFn, readinessAlertFn, attendanceNotifyFn } from "./inngest";

export function createApp() {
  const app = express();

  // Webhooks MUST be registered before express.json() so express.raw()
  // inside registerWebhookRoutes can capture the raw body for Mux HMAC verification.
  const webhookRouter = express.Router();
  registerWebhookRoutes(webhookRouter);
  app.use("/webhooks", webhookRouter);

  app.use(express.json());
  app.use(clerkMiddleware());

  const filmRouter = express.Router();
  registerFilmAnalysisRoutes(filmRouter, new DbFilmAnalysisService());
  app.use("/api/film-analysis", filmRouter);

  const meRouter = express.Router();
  registerMeRoute(meRouter);
  app.use("/api", meRouter);

  const rosterRouter = express.Router();
  registerRosterRoutes(rosterRouter);
  app.use("/api/roster", rosterRouter);

  const assignmentsRouter = express.Router();
  registerAssignmentRoutes(assignmentsRouter);
  app.use("/api/assignments", assignmentsRouter);

  const practicePlansRouter = express.Router();
  registerPracticePlanRoutes(practicePlansRouter);
  app.use("/api/practice-plans", practicePlansRouter);

  const eventsRouter = express.Router();
  registerEventRoutes(eventsRouter);
  app.use("/api/events", eventsRouter);

  const readinessRouter = express.Router();
  registerReadinessRoutes(readinessRouter);
  app.use("/api/readiness", readinessRouter);

  const messagingRouter = express.Router();
  registerMessagingRoutes(messagingRouter);
  app.use("/api/messages", messagingRouter);

  app.use(
    "/api/inngest",
    serve({
      client: inngest,
      functions: [analyzeFilmFn, readinessAlertFn, attendanceNotifyFn],
    }),
  );

  return app;
}
