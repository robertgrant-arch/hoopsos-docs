import { Router } from "express";
import { generateWod } from "../../lib/openai";

export function registerWodRoutes(router: Router) {
  // Diagnostic — returns env var presence without exposing values
  router.get("/health", (_req, res) => {
    res.json({
      openai_key_set: !!process.env.OPENAI_API_KEY,
      openai_model: process.env.OPENAI_MODEL ?? "gpt-4o (default)",
    });
  });

  router.post("/generate", async (req, res) => {
    try {
      const {
        playerName,
        position,
        focusAreas,
        targetMinutes,
        intensity,
        coachNotes,
        wearableSnapshot,
      } = req.body as {
        playerName: string;
        position?: string;
        focusAreas: string[];
        targetMinutes: number;
        intensity: "low" | "medium" | "high";
        coachNotes?: string;
        wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
      };

      if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
        res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
        return;
      }

      const result = await generateWod({
        playerName,
        position,
        focusAreas,
        targetMinutes: Math.min(Math.max(targetMinutes, 15), 120),
        intensity,
        coachNotes,
        wearableSnapshot,
      });

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number }).status ?? 500;
      console.error("[WOD generate]", message);
      res.status(status).json({ error: message });
    }
  });
}
