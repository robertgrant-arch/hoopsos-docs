import { inngest } from "../client";
import { analyzeFilmSession } from "../../lib/gemini";
import { getDb } from "@shared/db/client";
import { filmSessions, filmAssets, annotations } from "@shared/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const analyzeFilmFn = inngest.createFunction(
  {
    id: "analyze-film-session",
    name: "Analyze Film Session with Gemini",
    retries: 2,
  },
  { event: "film/asset.ready" },
  async ({ event, step }) => {
    const { sessionId, orgId, muxPlaybackId, durationSecs } = event.data;

    // Step 1: Load session + asset metadata
    const sessionData = await step.run("load-session", async () => {
      const db = getDb();
      const [session] = await db
        .select()
        .from(filmSessions)
        .where(and(eq(filmSessions.id, sessionId), eq(filmSessions.orgId, orgId)))
        .limit(1);
      return session ?? null;
    });

    if (!sessionData) throw new Error(`Session ${sessionId} not found`);

    // Step 2: Run Gemini analysis
    const analysis = await step.run("gemini-analysis", async () => {
      return analyzeFilmSession({
        sessionTitle: sessionData.title,
        sessionType: sessionData.kind ?? "game",
        opponent: sessionData.opponent ?? undefined,
        date: sessionData.playedAt ? String(sessionData.playedAt).split("T")[0] : undefined,
        playerNames: [],  // TODO: load from org roster
        durationSecs: durationSecs ?? 0,
      });
    });

    // Step 3: Save AI summary to film session
    await step.run("save-summary", async () => {
      const db = getDb();
      await db
        .update(filmSessions)
        .set({
          payload: {
            ...(sessionData.payload as object ?? {}),
            aiSummary: analysis.summary,
            aiObservations: analysis.keyObservations,
            aiStatus: "complete",
            aiAnalyzedAt: new Date().toISOString(),
          },
          status: "ready",
        })
        .where(eq(filmSessions.id, sessionId));
    });

    // Step 4: Create annotations for each teachable clip
    await step.run("create-annotations", async () => {
      const db = getDb();
      const annotationRows = analysis.teachableClips.map((clip) => ({
        id: nanoid(),
        sessionId,
        orgId,
        startMs: Math.round(clip.startSec * 1000),
        endMs: Math.round(clip.endSec * 1000),
        kind: clip.category as any,
        source: "ai" as const,
        payload: {
          note: clip.note,
          playerName: clip.playerName,
          sentiment: clip.sentiment,
          teachable: clip.teachable,
          aiGenerated: true,
          coachReviewed: false,
          suggestedFocusAreas: analysis.suggestedFocusAreas,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (annotationRows.length > 0) {
        await db.insert(annotations).values(annotationRows);
      }
    });

    return { sessionId, clipsCreated: analysis.teachableClips.length, summary: analysis.summary };
  }
);
