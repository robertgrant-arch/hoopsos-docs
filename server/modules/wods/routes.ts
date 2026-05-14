import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { generateWod } from "../../lib/openai";

export function registerWodRoutes(router: Router) {
  router.post("/generate", async (req, res, next) => {
    try {
      requireOrg(req);
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
    } catch (err) {
      next(err);
    }
  });
}
