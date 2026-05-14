import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Webhook routes MUST be registered before express.json() so that
  // express.raw() inside registerWebhookRoutes can capture the raw body
  // for Mux HMAC signature verification.
  const webhookRouter = express.Router();
  registerWebhookRoutes(webhookRouter);
  app.use("/webhooks", webhookRouter);

  // Parse JSON bodies for all API routes.
  app.use(express.json());

  // Clerk session middleware — populates getAuth(req) for requireOrg().
  // Must run before any route that calls requireOrg().
  app.use(clerkMiddleware());

  // Film analysis API — mounted before static files so the catch-all doesn't swallow it.
  const filmRouter = express.Router();
  registerFilmAnalysisRoutes(filmRouter, new DbFilmAnalysisService());
  app.use("/api/film-analysis", filmRouter);

  // Me route
  const meRouter = express.Router();
  registerMeRoute(meRouter);
  app.use("/api", meRouter);

  // Roster
  const rosterRouter = express.Router();
  registerRosterRoutes(rosterRouter);
  app.use("/api/roster", rosterRouter);

  // Assignments
  const assignmentsRouter = express.Router();
  registerAssignmentRoutes(assignmentsRouter);
  app.use("/api/assignments", assignmentsRouter);

  // Practice plans
  const practicePlansRouter = express.Router();
  registerPracticePlanRoutes(practicePlansRouter);
  app.use("/api/practice-plans", practicePlansRouter);

  // Events
  const eventsRouter = express.Router();
  registerEventRoutes(eventsRouter);
  app.use("/api/events", eventsRouter);

  // Readiness check-ins
  const readinessRouter = express.Router();
  registerReadinessRoutes(readinessRouter);
  app.use("/api/readiness", readinessRouter);

  // Messaging (threads + SMS)
  const messagingRouter = express.Router();
  registerMessagingRoutes(messagingRouter);
  app.use("/api/messages", messagingRouter);

  // Inngest serve handler — must be before static files so the catch-all doesn't swallow it
  app.use(
    "/api/inngest",
    serve({
      client: inngest,
      functions: [analyzeFilmFn, readinessAlertFn, attendanceNotifyFn],
    })
  );

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
