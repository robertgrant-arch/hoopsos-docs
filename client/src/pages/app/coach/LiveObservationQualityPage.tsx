import { useState, useRef, useEffect, useCallback } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Player {
  id: number;
  name: string;
  position: string;
}

interface ObservationExample {
  category: string;
  generic: string;
  specific: string;
}

interface WeeklyHistory {
  week: string;
  score: number;
}

interface RecentObservation {
  date: string;
  text: string;
  score: number;
}

const PLAYERS: Player[] = [
  { id: 1, name: "Devon Anderson", position: "PG" },
  { id: 2, name: "Marcus Williams", position: "SG" },
  { id: 3, name: "Jordan Thomas", position: "SF" },
  { id: 4, name: "Caleb Harris", position: "PF" },
  { id: 5, name: "Noah Jackson", position: "C" },
  { id: 6, name: "Elijah Brown", position: "PG" },
  { id: 7, name: "Isaiah Davis", position: "SG" },
  { id: 8, name: "Malik Johnson", position: "SF" },
  { id: 9, name: "Jaylen Carter", position: "PF" },
  { id: 10, name: "Trevon Moore", position: "C" },
  { id: 11, name: "Donovan Lee", position: "PG" },
  { id: 12, name: "Cameron White", position: "SG" },
];

const OBSERVATION_EXAMPLES: ObservationExample[] = [
  {
    category: "Ball Handling",
    generic: "Good ball handling today.",
    specific: "Ball handling: improved crossover under pressure in the halfcourt set — kept dribble alive vs. the trapping defense three consecutive possessions. Still loses control on the behind-the-back when moving right.",
  },
  {
    category: "Ball Handling",
    generic: "Needs to work on his dribble.",
    specific: "Dribble penetration: hesitation move timing is improving — successfully split the 2-3 zone twice in 4Q. Telegraphs the drive by dropping his shoulder early, which helped in practice but will be read at next level.",
  },
  {
    category: "Finishing",
    generic: "Missed some layups.",
    specific: "Finishing at the rim: 3 of 7 in traffic today. The misses were all off-hand layups with contact — absorbs contact well but off-hand lift is inconsistent. Better than last Tuesday's 2 of 8.",
  },
  {
    category: "Finishing",
    generic: "Good at scoring in the paint.",
    specific: "Post finishing: drop-step left is now a reliable weapon — 4 of 5 today vs. the sagging defender. Right shoulder finish still mechanical; needs more reps to trust it in-game.",
  },
  {
    category: "Defense",
    generic: "Good effort on defense today.",
    specific: "Defensive stance: improved lateral shuffle on pick-and-roll coverage — hips stayed low for the first time this week. Still tends to go over screens on the top of the key, giving shooters a clean look.",
  },
  {
    category: "Defense",
    generic: "Needs to help more on defense.",
    specific: "Help defense rotation: arrived in time on 4 of 5 drive-and-kick situations in the 3rd. On the 1 miss, started rotation too late after ball reversal — identified it himself in film review.",
  },
  {
    category: "IQ",
    generic: "Makes good decisions.",
    specific: "Decision-making in transition: chose the right pass on 6 of 8 fast breaks — correctly identified the trailer both times the primary lane was closed. Still rushes the early-2 when the defense is set.",
  },
  {
    category: "IQ",
    generic: "Needs to read the defense better.",
    specific: "Reading zone defense: struggled vs. the 2-3 in the first half — ball-moved away from the gaps instead of into them. Second half adjusted and found the high-low twice. Shows coachability on scheme adjustments.",
  },
];

const WEEKLY_HISTORY: WeeklyHistory[] = [
  { week: "Feb 23", score: 44 },
  { week: "Mar 2",  score: 47 },
  { week: "Mar 9",  score: 51 },
  { week: "Mar 16", score: 49 },
  { week: "Mar 23", score: 55 },
  { week: "Mar 30", score: 58 },
  { week: "Apr 6",  score: 62 },
  { week: "Apr 13", score: 60 },
  { week: "Apr 20", score: 65 },
  { week: "Apr 27", score: 68 },
  { week: "May 4",  score: 71 },
  { week: "May 11", score: 68 },
];

const RECENT_OBSERVATIONS_BY_PLAYER: Record<number, RecentObservation[]> = {
  1: [
    { date: "May 10", text: "Ball handling in pick-and-roll improved — kept dribble alive on the press break three times.", score: 78 },
    { date: "May 6",  text: "Good effort today.", score: 22 },
    { date: "Apr 30", text: "Crossover hesitation is working vs. sagging defenders. Telegraphs the drive to the right.", score: 71 },
  ],
  2: [
    { date: "May 12", text: "Defensive positioning on the wing improved — didn't give up baseline on 4 straight possessions.", score: 74 },
    { date: "May 5",  text: "Played well overall.", score: 18 },
    { date: "Apr 28", text: "Catch-and-shoot mechanics: feet set before catch on 7 of 9 attempts vs. last week's 4 of 9.", score: 82 },
  ],
};

// ─── Scoring logic ────────────────────────────────────────────────────────────

const SKILL_TERMS = [
  "ball handling", "dribble", "crossover", "shooting", "shot", "layup", "finish",
  "defense", "defensive", "stance", "positioning", "rotation", "footwork",
  "passing", "decision", "iq", "read", "post", "pivot", "screen",
];

const CONTEXT_TERMS = [
  "pick-and-roll", "zone", "press", "drive", "penetration", "transition",
  "halfcourt", "fast break", "post", "off-ball", "closeout", "help side",
  "in traffic", "vs.", "against", "in the", "during", "at the",
];

const ACTION_TERMS = [
  "crossover", "drop-step", "lateral", "shuffle", "absorbs", "splits", "rotates",
  "hesitation", "catch", "set", "arrives", "chose", "identified", "adjusted",
  "found", "reads", "telegraphs", "loses", "misses", "converts", "finishes",
];

const DIRECTION_TERMS = [
  "improved", "better than", "worse than", "first time", "still", "consistently",
  "three times", "4 of", "3 of", "vs. last week", "this week", "more than",
  "less than", "compared to", "up from", "down from", "same as", "like last",
];

function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function computeScore(text: string): { score: number; criteria: boolean[] } {
  if (!text.trim()) return { score: 0, criteria: [false, false, false, false] };

  const criteria = [
    containsAny(text, SKILL_TERMS),
    containsAny(text, CONTEXT_TERMS),
    containsAny(text, ACTION_TERMS),
    containsAny(text, DIRECTION_TERMS),
  ];

  const metCount = criteria.filter(Boolean).length;
  const baseScore = (metCount / 4) * 75;
  const lengthBonus = Math.min(25, Math.floor(text.trim().split(/\s+/).length / 4));
  const score = Math.min(100, Math.round(baseScore + lengthBonus));

  return { score, criteria };
}

function getQualityLabel(score: number): string {
  if (score >= 85) return "Elite Observation";
  if (score >= 70) return "Specific";
  if (score >= 40) return "Developing";
  return "Generic";
}

function getScoreColor(score: number): string {
  if (score >= 70) return SUCCESS;
  if (score >= 40) return WARNING;
  return DANGER;
}

// ─── SVG Arc Gauge ────────────────────────────────────────────────────────────

function ArcGauge({ score }: { score: number }) {
  const R = 60;
  const CX = 80;
  const CY = 80;
  const STROKE = 14;

  // Half-circle: from 180deg to 0deg (left to right)
  const angle = (score / 100) * Math.PI; // 0 = left end, PI = right end
  const startX = CX - R;
  const startY = CY;
  const endX = CX + Math.cos(Math.PI - angle) * R;
  const endY = CY - Math.sin(Math.PI - angle) * R;

  const color = getScoreColor(score);
  const largeArc = angle > Math.PI / 2 ? 1 : 0;

  const filledPath =
    score === 0
      ? ""
      : `M ${startX} ${startY} A ${R} ${R} 0 ${largeArc} 1 ${endX} ${endY}`;

  const trackPath = `M ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY}`;

  return (
    <svg viewBox="0 0 160 100" width={160} height={100} style={{ overflow: "visible" }}>
      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="var(--border)"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {score > 0 && (
        <path
          d={filledPath}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      )}
      {/* Score text */}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={28} fontWeight={800} fill={color}>
        {score}
      </text>
      <text x={CX} y={CY + 14} textAnchor="middle" fontSize={11} fill={MUTED}>
        / 100
      </text>
      {/* End labels */}
      <text x={CX - R - 6} y={CY + 18} fontSize={9} fill={MUTED} textAnchor="middle">0</text>
      <text x={CX + R + 6} y={CY + 18} fontSize={9} fill={MUTED} textAnchor="middle">100</text>
    </svg>
  );
}

// ─── Confetti SVG ─────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI;
    const dist = 30 + Math.random() * 20;
    return {
      x: 12 + Math.cos(angle) * dist,
      y: 12 + Math.sin(angle) * dist,
      color: [SUCCESS, PRIMARY, WARNING, "#fff"][i % 4],
    };
  });

  return (
    <svg width={24} height={24} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle" }}>
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={p.color} opacity={0.85} />
      ))}
      <circle cx={12} cy={12} r={3} fill={SUCCESS} />
    </svg>
  );
}

// ─── History Chart ────────────────────────────────────────────────────────────

function HistoryLineChart() {
  const W = 640;
  const H = 140;
  const PAD = { top: 16, right: 20, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const minScore = 30;
  const maxScore = 100;

  const pts = WEEKLY_HISTORY.map((d, i) => ({
    x: PAD.left + (i / (WEEKLY_HISTORY.length - 1)) * innerW,
    y: PAD.top + ((maxScore - d.score) / (maxScore - minScore)) * innerH,
    score: d.score,
    week: d.week,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath = [
    `M ${pts[0].x} ${pts[0].y}`,
    ...pts.slice(1).map((p) => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`,
    `L ${pts[0].x} ${PAD.top + innerH}`,
    "Z",
  ].join(" ");

  // Y gridlines
  const yTicks = [40, 60, 80, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      {yTicks.map((tick) => {
        const y = PAD.top + ((maxScore - tick) / (maxScore - minScore)) * innerH;
        return (
          <g key={tick}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>{tick}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={PRIMARY} opacity={0.08} />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={PRIMARY} strokeWidth={2.5} strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={PRIMARY} stroke="var(--bg-surface)" strokeWidth={2} />
        </g>
      ))}

      {/* X labels (every other) */}
      {pts.filter((_, i) => i % 2 === 0).map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={9.5} fill={MUTED}>
          {p.week}
        </text>
      ))}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveObservationQualityPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(1);
  const [sessionType, setSessionType] = useState<"practice" | "game">("practice");
  const [sessionContext, setSessionContext] = useState("");
  const [observationText, setObservationText] = useState("");
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [exampleCategory, setExampleCategory] = useState("Defense");
  const [savedObservations, setSavedObservations] = useState<RecentObservation[]>([]);

  const { score, criteria } = computeScore(observationText);
  const qualityLabel = getQualityLabel(score);
  const scoreColor = getScoreColor(score);
  const isElite = qualityLabel === "Elite Observation";
  const showSuggestions = score < 70 && observationText.trim().length > 10;

  const suggestions: string[] = [];
  if (!criteria[0]) suggestions.push("Mention a specific skill — what exactly were they working on? (ball handling, finishing, defensive stance…)");
  if (!criteria[1]) suggestions.push("Add game or practice context — what was the situation? (pick-and-roll, vs. zone, in transition…)");
  if (!criteria[2]) suggestions.push("Describe a specific action — what did they actually do? (crossover, drop-step, help rotation…)");
  if (!criteria[3]) suggestions.push("Include a direction or comparison — better or worse than before? How many times?");

  const criteriaLabels = [
    "Mentions a specific skill (ball handling, shooting, defense, etc.)",
    "Includes game/practice context (in the drive, on the pick-and-roll, vs. zone defense)",
    "Describes a specific action (crossover, drop-step, help rotation)",
    "Includes direction or comparison (improved vs. last week, still telegraphs, better than Tuesday)",
  ];

  const selectedPlayer = PLAYERS.find((p) => p.id === selectedPlayerId) ?? PLAYERS[0];
  const playerObservations = savedObservations.length > 0
    ? savedObservations
    : (RECENT_OBSERVATIONS_BY_PLAYER[selectedPlayerId] ?? []);

  const today = "May 16, 2026";

  const handleSave = () => {
    if (!observationText.trim()) {
      toast.error("Please write an observation before saving.");
      return;
    }
    const newObs: RecentObservation = {
      date: "May 16",
      text: observationText.trim(),
      score,
    };
    setSavedObservations((prev) => [newObs, ...prev].slice(0, 3));
    setObservationText("");
    toast.success(`Observation saved to ${selectedPlayer.name}'s profile`);
  };

  const handleSaveAndAssess = () => {
    if (!observationText.trim()) {
      toast.error("Please write an observation before saving.");
      return;
    }
    handleSave();
    toast(`Navigating to quick assess flow for ${selectedPlayer.name}`);
  };

  const categories = Array.from(new Set(OBSERVATION_EXAMPLES.map((e) => e.category)));
  const filteredExamples = OBSERVATION_EXAMPLES.filter((e) => e.category === exampleCategory);

  const lastWeekScore = WEEKLY_HISTORY[WEEKLY_HISTORY.length - 2].score;
  const thisWeekScore = WEEKLY_HISTORY[WEEKLY_HISTORY.length - 1].score;
  const improvementNote = "You've improved your specificity score by 14 points in the last 60 days";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Coach Tools"
        title="Live Observation Quality"
        subtitle="Write better observations in real time — feedback as you type"
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 64px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── Section 1: Observation Entry ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20 }}>
            New Observation
          </h2>

          {/* Controls row */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            {/* Player selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Player
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  minWidth: 180,
                }}
              >
                {PLAYERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Date
              </label>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  color: MUTED,
                  fontSize: 13.5,
                }}
              >
                {today}
              </div>
            </div>

            {/* Practice / Game toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Session Type
              </label>
              <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                {(["practice", "game"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSessionType(type)}
                    style={{
                      padding: "8px 16px",
                      background: sessionType === type ? PRIMARY : "var(--bg-surface)",
                      color: sessionType === type ? "#fff" : MUTED,
                      fontWeight: 600,
                      fontSize: 13,
                      border: "none",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Context note */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Session Context (optional)
              </label>
              <input
                type="text"
                value={sessionContext}
                onChange={(e) => setSessionContext(e.target.value)}
                placeholder="e.g. Semifinal vs. Riverside, focused on defense"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={observationText}
            onChange={(e) => setObservationText(e.target.value)}
            placeholder="Describe what you saw today. Focus on a specific skill, context, and what you noticed..."
            style={{
              width: "100%",
              minHeight: 200,
              padding: "14px 16px",
              borderRadius: 10,
              border: `2px solid ${score > 0 ? scoreColor : "var(--border)"}`,
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.7,
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.25s ease",
              boxSizing: "border-box",
            }}
          />

          {/* Real-time feedback panel */}
          <div
            style={{
              marginTop: 12,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              gap: 32,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Arc gauge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <ArcGauge score={score} />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: scoreColor,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isElite && <ConfettiBurst />}
                {qualityLabel}
                {isElite && <ConfettiBurst />}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>Specificity Score</div>
            </div>

            {/* Criteria checklist */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Criteria
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {criteriaLabels.map((label, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, color: criteria[i] ? SUCCESS : "var(--border)", flexShrink: 0, marginTop: -1 }}>
                      {criteria[i] ? "☑" : "☐"}
                    </span>
                    <span style={{ fontSize: 12.5, color: criteria[i] ? "var(--text-primary)" : MUTED, lineHeight: 1.5 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestion panel */}
          {showSuggestions && (
            <div
              style={{
                marginTop: 12,
                background: "var(--bg-base)",
                border: `1px solid ${WARNING}`,
                borderRadius: 10,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: WARNING, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                To improve this observation:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: WARNING, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Example of a more specific version:</div>
                  <p style={{ fontSize: 12.5, color: MUTED, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
                    "Defensive positioning: lateral shuffle improved vs. pick-and-roll coverage — hips stayed low for the first time this week. Still tends to go over screens at the top."
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Save buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={handleSave}
              style={{
                padding: "11px 24px",
                borderRadius: 9,
                background: PRIMARY,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13.5,
                border: "none",
                cursor: "pointer",
              }}
            >
              Save Observation
            </button>
            <button
              onClick={handleSaveAndAssess}
              style={{
                padding: "11px 24px",
                borderRadius: 9,
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: 13.5,
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Save + Assess Skills
            </button>
          </div>

          {/* Last 3 observations for this player */}
          {playerObservations.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, marginBottom: 10 }}>
                Last 3 observations — {selectedPlayer.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {playerObservations.slice(0, 3).map((obs, i) => {
                  const obsColor = getScoreColor(obs.score);
                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderLeft: `3px solid ${obsColor}`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: obsColor }}>{obs.score}</span>
                        <span style={{ fontSize: 9, color: MUTED }}>score</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: MUTED, marginBottom: 3 }}>{obs.date}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>{obs.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 2: Examples Library ── */}
        <section>
          <button
            onClick={() => setExamplesOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: examplesOpen ? 16 : 0,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Learn from Great Observations
            </h2>
            <span style={{ fontSize: 18, color: MUTED, transition: "transform 0.2s", transform: examplesOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
              ›
            </span>
          </button>

          {examplesOpen && (
            <div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExampleCategory(cat)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 7,
                      background: exampleCategory === cat ? PRIMARY : "var(--bg-surface)",
                      color: exampleCategory === cat ? "#fff" : MUTED,
                      fontWeight: 600,
                      fontSize: 12.5,
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {filteredExamples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: DANGER,
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Generic
                      </span>
                      <span style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>{ex.generic}</span>
                    </div>
                    <div style={{ padding: "12px 16px", display: "flex", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: SUCCESS,
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          flexShrink: 0,
                        }}
                      >
                        Specific
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{ex.specific}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3: Observation Quality History ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Your Observation Quality History
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 16 }}>
            Average specificity score per week — last 12 weeks.
          </p>

          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px 16px" }}>
            <HistoryLineChart />

            <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: PRIMARY }}>{thisWeekScore}</div>
                <div style={{ fontSize: 11, color: MUTED }}>This week</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: MUTED }}>{lastWeekScore}</div>
                <div style={{ fontSize: 11, color: MUTED }}>Last week</div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: "var(--bg-base)",
                  border: `1px solid ${SUCCESS}`,
                  borderRadius: 8,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>📈</span>
                <span style={{ fontSize: 13.5, color: SUCCESS, fontWeight: 600 }}>{improvementNote}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
