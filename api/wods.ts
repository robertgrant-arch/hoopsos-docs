import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.json({ openai_key_set: !!process.env.OPENAI_API_KEY });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { playerName, position, focusAreas, targetMinutes, intensity, coachNotes, wearableSnapshot } =
    (req.body ?? {}) as {
      playerName?: string;
      position?: string;
      focusAreas?: string[];
      targetMinutes?: number;
      intensity?: "low" | "medium" | "high";
      coachNotes?: string;
      wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
    };

  if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
    return res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
  }

  const mins = Math.min(Math.max(targetMinutes, 15), 120);

  const wearableContext = wearableSnapshot
    ? `\nWEARABLE DATA:\n- Recovery: ${wearableSnapshot.recoveryScore ?? "unknown"}/100\n- Sleep: ${wearableSnapshot.sleepScore ?? "unknown"}/100${(wearableSnapshot.recoveryScore ?? 100) < 40 ? "\n⚠️ Low recovery — reduce volume, skip conditioning." : ""}`
    : "";

  const prompt = `You are an elite basketball skills trainer. Design a personalized daily workout (WOD).

PLAYER: ${playerName}${position ? ` (${position})` : ""}
FOCUS AREAS: ${focusAreas.join(", ")}
TARGET DURATION: ${mins} minutes
INTENSITY: ${intensity}${wearableContext}
${coachNotes ? `COACH NOTES: ${coachNotes}` : ""}

BLOCK TYPES: warmup, skill, shooting, finishing, footwork, defense, conditioning, competitive, recovery

RULES:
- Start with warmup (5-8 min), end with recovery (3-5 min)
- Block minutes must sum to approximately ${mins}
- 2-3 coaching cues and 1-2 measurable success metrics per block
- Use specific real drill names (e.g. "Mikan Drill", "Chair Shooting Series")
- Intensity ${intensity}: ${intensity === "high" ? "include conditioning, max effort" : intensity === "low" ? "technical focus only, no conditioning" : "moderate, optional conditioning"}

Return ONLY valid JSON:
{
  "theme": "short session theme",
  "rationale": "2-3 sentence coaching rationale",
  "blocks": [
    {
      "block_type": "warmup",
      "drill_name": "drill name",
      "minutes": 7,
      "coaching_points": ["cue 1", "cue 2"],
      "success_metrics": ["metric 1"]
    }
  ]
}`;

  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    return res.json(JSON.parse(text));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[wods]", message);
    return res.status(500).json({ error: message });
  }
}
