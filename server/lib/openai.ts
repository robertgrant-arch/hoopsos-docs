import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export type WodGenerationResult = {
  theme: string;
  rationale: string;
  blocks: Array<{
    block_type: string;
    drill_name: string;
    minutes: number;
    coaching_points: string[];
    success_metrics: string[];
  }>;
};

export async function generateWod(params: {
  playerName: string;
  position?: string;
  focusAreas: string[];
  targetMinutes: number;
  intensity: "low" | "medium" | "high";
  coachNotes?: string;
  wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
}): Promise<WodGenerationResult> {
  const openai = getOpenAI();

  const wearableContext = params.wearableSnapshot
    ? `\nWEARABLE DATA (today):
- Recovery: ${params.wearableSnapshot.recoveryScore ?? "unknown"}/100
- Sleep: ${params.wearableSnapshot.sleepScore ?? "unknown"}/100
- Strain: ${params.wearableSnapshot.strainScore ?? "unknown"}
${(params.wearableSnapshot.recoveryScore ?? 100) < 40 ? "⚠️ Low recovery — reduce volume, no conditioning block." : ""}
${(params.wearableSnapshot.recoveryScore ?? 100) >= 67 ? "✅ Well-recovered — full intensity is fine." : ""}` : "";

  const prompt = `You are an elite basketball skills trainer. Design a personalized daily workout (WOD) for a player.

PLAYER: ${params.playerName}${params.position ? ` (${params.position})` : ""}
FOCUS AREAS: ${params.focusAreas.join(", ")}
TARGET DURATION: ${params.targetMinutes} minutes total
INTENSITY: ${params.intensity}${wearableContext}
${params.coachNotes ? `COACH NOTES: ${params.coachNotes}` : ""}

BLOCK TYPES available: warmup, skill, shooting, finishing, footwork, defense, conditioning, competitive, recovery

RULES:
- Always start with warmup (5-8 min) and end with recovery (3-5 min)
- Block minutes must sum close to ${params.targetMinutes}
- Each block needs 2-3 short coaching cues and 1-2 measurable success metrics
- Use specific, real drill names (e.g. "Mikan Drill", "Chair Shooting Series", "2-Ball Stationary")
- Intensity ${params.intensity}: ${params.intensity === "high" ? "max effort, include conditioning block" : params.intensity === "low" ? "technical, no conditioning" : "moderate volume, optional conditioning"}

Respond with valid JSON only, matching this exact shape:
{
  "theme": "short session theme",
  "rationale": "2-3 sentence coaching rationale",
  "blocks": [
    {
      "block_type": "warmup",
      "drill_name": "specific drill name",
      "minutes": 7,
      "coaching_points": ["cue 1", "cue 2"],
      "success_metrics": ["metric 1"]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as WodGenerationResult;
}
