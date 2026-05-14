// POST /api/wods/generate
// Standalone — no Express/Clerk/Inngest. Direct fetch to OpenAI.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel environment variables" });
  }

  const body = req.body ?? {};
  const { playerName, position, focusAreas, targetMinutes, intensity, coachNotes, wearableSnapshot } = body;

  if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
    return res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
  }

  const mins = Math.min(Math.max(Number(targetMinutes), 15), 120);

  // Map each focus area to the block_type it should produce AND example drills.
  // This drives what the model is ALLOWED to generate.
  const FOCUS_MAP = {
    "Ball handling":      { type: "skill",        drills: "Two-Ball Dribble, Cone Weave, Spider Dribble, Hesitation Series, Between-the-Legs Combo, Figure-8 Dribble" },
    "Shooting":           { type: "shooting",     drills: "Spot Shooting, Catch-and-Shoot Series, Pull-Up Ladder, Corner 3s, Mid-Range Pull-Up, Free Throw Routine" },
    "Finishing":          { type: "finishing",    drills: "Mikan Drill, Euro Step Series, Floater Series, Reverse Layup Progression, Power Layup Combo, Contact Finishing" },
    "Footwork":           { type: "footwork",     drills: "Defensive Slide Ladder, Jab Step Series, Rocker Step Drill, Drop Step Work, Pivot Series, Agility Ladder" },
    "Defense":            { type: "defense",      drills: "Closeout Drill, On-Ball Defense Circuit, Shell Drill, Charge/Hedge Footwork, Deny-the-Ball Drill" },
    "Post moves":         { type: "skill",        drills: "Drop Step Series, Up-and-Under, Hook Shot Progression, Post Seal Work, Hi-Lo Feed Reads, Baby Hook" },
    "Playmaking":         { type: "skill",        drills: "Pick-and-Roll Read Progressions, Dribble-Drive Angles, Kick-Out Reads, DHO Series, Drive-and-Dish Drill" },
    "Off-ball movement":  { type: "skill",        drills: "Backdoor Cut Series, UCLA Cut, V-Cut Shooting, Cross-Screen Reads, Curl/Fade Options" },
    "Conditioning":       { type: "conditioning", drills: "17s, Full-Court Sprints, Suicide Runs, Press-Break Sprints, Shell-Drill Transitions" },
    "IQ & reads":         { type: "competitive",  drills: "1-on-1 Read Constraints, 2-on-2 Scramble, 3-on-3 Half-Court, Advantage/Disadvantage Drill" },
  };

  // Build the allowed block types and drill guidance from the selected focus areas
  const focusDetails = focusAreas.map((f) => FOCUS_MAP[f] ?? { type: "skill", drills: f });
  const allowedTypes = [...new Set(["warmup", ...focusDetails.map((d) => d.type), "recovery"])];
  const workMinutes = mins - 10; // subtract warmup (~6) + recovery (~4)
  const minsPerFocus = Math.round(workMinutes / focusAreas.length);

  const focusGuide = focusAreas.map((f, i) => {
    const detail = focusDetails[i];
    return `  • ${f} (${minsPerFocus} min) → block_type "${detail.type}" — use drills like: ${detail.drills}`;
  }).join("\n");

  const wearableContext = wearableSnapshot
    ? `\nWEARABLE DATA:\n- Recovery: ${wearableSnapshot.recoveryScore ?? "unknown"}/100\n- Sleep: ${wearableSnapshot.sleepScore ?? "unknown"}/100${(wearableSnapshot.recoveryScore ?? 100) < 40 ? "\n⚠️ Low recovery — reduce volume, skip any conditioning block." : ""}`
    : "";

  const prompt = `You are an elite basketball skills trainer. Design a tightly focused workout that trains EXACTLY what was requested.

PLAYER: ${playerName}${position ? ` (${position})` : ""}
REQUESTED FOCUS: ${focusAreas.join(" + ")}
TOTAL DURATION: ${mins} minutes
INTENSITY: ${intensity}${wearableContext}
${coachNotes ? `COACH INSTRUCTIONS: ${coachNotes}` : ""}

TIME STRUCTURE:
- Block 1: Warmup — 5–7 min (dynamic movement, activation)
- Middle blocks: ${workMinutes} min total, split across the requested focus areas:
${focusGuide}
- Last block: Recovery — 3–5 min (cool-down, static stretch)

ALLOWED BLOCK TYPES: ${allowedTypes.join(", ")}
⛔ STRICT RULE: Every non-warmup/recovery block MUST use one of the focus-mapped block types above. Do NOT add defense, conditioning, competitive, or any other block type unless it appears in the allowed list. The player asked specifically for ${focusAreas.join(" and ")} — build the entire session around that.

QUALITY RULES:
- Block minutes must sum to exactly ${mins}
- Use real, named basketball drills (not generic descriptions)
- 2–3 specific technique cues per block (not motivational language)
- 1–2 measurable success metrics per block (make %, rep count, time target)
- Intensity ${intensity}: ${intensity === "high" ? "push pace and volume within the focus areas — no rest-heavy blocks" : intensity === "low" ? "slow it down, emphasize form over speed, no conditioning blocks" : "moderate tempo, one optional higher-effort block near the end"}
- The session theme and rationale must directly reference ${focusAreas.join(" and ")}

Return ONLY valid JSON (no markdown, no extra text):
{
  "theme": "short theme that names the focus areas",
  "rationale": "2–3 sentences explaining why these specific drills address ${focusAreas.join(" and ")}",
  "blocks": [
    {
      "block_type": "warmup",
      "drill_name": "specific drill name",
      "minutes": 6,
      "coaching_points": ["specific technique cue 1", "specific technique cue 2"],
      "success_metrics": ["specific measurable metric"]
    }
  ]
}`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(500).json({ error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 300)}` });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    return res.json(JSON.parse(text));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};
