// Standalone WOD generator — no Express/Clerk/Inngest dependencies.
// Plain JS avoids TypeScript compilation issues on Vercel.

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.json({ openai_key_set: !!process.env.OPENAI_API_KEY, ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in Vercel environment variables" });
  }

  const body = req.body ?? {};
  const { playerName, position, focusAreas, targetMinutes, intensity, coachNotes, wearableSnapshot } = body;

  if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
    return res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
  }

  const mins = Math.min(Math.max(Number(targetMinutes), 15), 120);

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[wods] OpenAI error", response.status, errText);
      return res.status(500).json({ error: `OpenAI API error ${response.status}: ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    return res.json(JSON.parse(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[wods]", message);
    return res.status(500).json({ error: message });
  }
};
