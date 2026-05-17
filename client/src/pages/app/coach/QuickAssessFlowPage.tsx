import { useState, useMemo } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgeGroup = "12U" | "14U" | "16U" | "17U";
type Position = "PG" | "SG" | "SF" | "PF" | "C";

interface Player {
  id: number;
  name: string;
  position: Position;
  ageGroup: AgeGroup;
  lastAssessed: Date | null;
  prevScores: Record<string, number>;
  vdvContributing: boolean;
}

interface RecentSession {
  playerName: string;
  time: string;
}

const SKILLS = [
  "Ball Handling",
  "Shooting Form",
  "Finishing",
  "Defensive Stance",
  "Basketball IQ",
  "Court Vision",
  "Athleticism",
  "Coachability",
] as const;

type Skill = typeof SKILLS[number];

const BASKETBALL_TERMS = [
  "ball", "handle", "shoot", "form", "finish", "defense", "stance",
  "iq", "vision", "court", "athlete", "coach", "dribble", "pass",
  "shot", "layup", "post", "drive", "screen", "pick", "help", "rotation",
  "catch", "release", "footwork", "lateral", "crossover", "pull-up",
  "midrange", "three", "free throw", "hustle", "transition", "zone",
];

const CONTEXT_WORDS = [
  "today", "practice", "game", "drill", "scrimmage", "halfcourt",
  "fullcourt", "possession", "quarter", "half", "session", "versus",
  "against", "when", "while", "during", "left", "right", "off-hand",
  "pressure", "traffic", "help", "trap", "closeout", "roll",
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

const PLAYERS: Player[] = [
  {
    id: 1,
    name: "Devon Anderson",
    position: "PG",
    ageGroup: "16U",
    lastAssessed: daysAgo(2),
    prevScores: { "Ball Handling": 8.4, "Shooting Form": 7.1, "Finishing": 7.8, "Defensive Stance": 6.5, "Basketball IQ": 8.1, "Court Vision": 8.0, "Athleticism": 7.6, "Coachability": 9.0 },
    vdvContributing: true,
  },
  {
    id: 2,
    name: "Marcus Williams",
    position: "SG",
    ageGroup: "16U",
    lastAssessed: daysAgo(5),
    prevScores: { "Ball Handling": 7.0, "Shooting Form": 8.6, "Finishing": 7.2, "Defensive Stance": 7.5, "Basketball IQ": 7.8, "Court Vision": 6.9, "Athleticism": 8.2, "Coachability": 8.5 },
    vdvContributing: true,
  },
  {
    id: 3,
    name: "Jordan Thomas",
    position: "SF",
    ageGroup: "16U",
    lastAssessed: daysAgo(9),
    prevScores: { "Ball Handling": 6.5, "Shooting Form": 6.8, "Finishing": 7.5, "Defensive Stance": 7.9, "Basketball IQ": 7.2, "Court Vision": 6.7, "Athleticism": 8.5, "Coachability": 7.8 },
    vdvContributing: false,
  },
  {
    id: 4,
    name: "Caleb Harris",
    position: "PF",
    ageGroup: "16U",
    lastAssessed: daysAgo(11),
    prevScores: { "Ball Handling": 5.8, "Shooting Form": 6.2, "Finishing": 8.1, "Defensive Stance": 7.6, "Basketball IQ": 6.9, "Court Vision": 6.2, "Athleticism": 8.0, "Coachability": 8.1 },
    vdvContributing: true,
  },
  {
    id: 5,
    name: "Noah Jackson",
    position: "C",
    ageGroup: "14U",
    lastAssessed: daysAgo(14),
    prevScores: { "Ball Handling": 4.9, "Shooting Form": 5.1, "Finishing": 7.2, "Defensive Stance": 6.8, "Basketball IQ": 6.5, "Court Vision": 5.8, "Athleticism": 7.9, "Coachability": 7.5 },
    vdvContributing: false,
  },
  {
    id: 6,
    name: "Elijah Brown",
    position: "PG",
    ageGroup: "14U",
    lastAssessed: daysAgo(18),
    prevScores: { "Ball Handling": 7.8, "Shooting Form": 6.5, "Finishing": 6.9, "Defensive Stance": 6.2, "Basketball IQ": 7.5, "Court Vision": 7.8, "Athleticism": 7.2, "Coachability": 8.0 },
    vdvContributing: false,
  },
  {
    id: 7,
    name: "Isaiah Davis",
    position: "SG",
    ageGroup: "17U",
    lastAssessed: daysAgo(21),
    prevScores: { "Ball Handling": 7.3, "Shooting Form": 8.0, "Finishing": 7.4, "Defensive Stance": 6.9, "Basketball IQ": 7.6, "Court Vision": 7.1, "Athleticism": 7.8, "Coachability": 7.9 },
    vdvContributing: false,
  },
  {
    id: 8,
    name: "Malik Johnson",
    position: "SF",
    ageGroup: "17U",
    lastAssessed: null,
    prevScores: { "Ball Handling": 6.0, "Shooting Form": 6.4, "Finishing": 6.8, "Defensive Stance": 7.1, "Basketball IQ": 6.5, "Court Vision": 6.3, "Athleticism": 8.3, "Coachability": 7.2 },
    vdvContributing: false,
  },
  {
    id: 9,
    name: "Jaylen Carter",
    position: "PF",
    ageGroup: "14U",
    lastAssessed: null,
    prevScores: { "Ball Handling": 5.5, "Shooting Form": 5.8, "Finishing": 6.9, "Defensive Stance": 6.4, "Basketball IQ": 6.0, "Court Vision": 5.6, "Athleticism": 7.5, "Coachability": 7.8 },
    vdvContributing: false,
  },
  {
    id: 10,
    name: "Trevon Moore",
    position: "C",
    ageGroup: "16U",
    lastAssessed: null,
    prevScores: { "Ball Handling": 4.5, "Shooting Form": 4.8, "Finishing": 7.5, "Defensive Stance": 7.2, "Basketball IQ": 6.2, "Court Vision": 5.4, "Athleticism": 8.1, "Coachability": 7.6 },
    vdvContributing: false,
  },
  {
    id: 11,
    name: "Donovan Lee",
    position: "PG",
    ageGroup: "12U",
    lastAssessed: daysAgo(30),
    prevScores: { "Ball Handling": 6.8, "Shooting Form": 5.9, "Finishing": 6.2, "Defensive Stance": 5.8, "Basketball IQ": 6.9, "Court Vision": 6.6, "Athleticism": 6.9, "Coachability": 8.2 },
    vdvContributing: false,
  },
  {
    id: 12,
    name: "Cameron White",
    position: "SG",
    ageGroup: "12U",
    lastAssessed: daysAgo(45),
    prevScores: { "Ball Handling": 6.1, "Shooting Form": 6.8, "Finishing": 6.0, "Defensive Stance": 5.9, "Basketball IQ": 6.4, "Court Vision": 6.0, "Athleticism": 6.7, "Coachability": 7.9 },
    vdvContributing: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(date: Date | null): number {
  if (!date) return Infinity;
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

function lastAssessedColor(date: Date | null): string {
  const d = daysSince(date);
  if (d === Infinity) return MUTED;
  if (d < 7) return SUCCESS;
  if (d <= 14) return WARNING;
  return DANGER;
}

function lastAssessedLabel(date: Date | null): string {
  if (!date) return "Never assessed";
  const d = daysSince(date);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function overdueScore(p: Player): number {
  return daysSince(p.lastAssessed);
}

function getSpecificity(text: string): { label: string; color: string } {
  const lower = text.toLowerCase();
  const hasTerm = BASKETBALL_TERMS.some((t) => lower.includes(t));
  const hasContext = CONTEXT_WORDS.some((t) => lower.includes(t));
  if (text.length >= 30 && hasTerm && hasContext) {
    return { label: "Specific ✓", color: SUCCESS };
  }
  if (text.length >= 15 && hasTerm) {
    return { label: "Developing", color: WARNING };
  }
  return { label: "Generic", color: DANGER };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkillSlider({
  skill,
  value,
  prev,
  onChange,
}: {
  skill: Skill;
  value: number;
  prev: number;
  onChange: (v: number) => void;
}) {
  const stops = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "16px 20px",
        background: "var(--bg-surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{skill}</span>
        <span style={{ fontSize: 13, color: MUTED }}>was {prev.toFixed(1)}</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {stops.map((stop) => (
          <button
            key={stop}
            onClick={() => onChange(stop)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: stop <= value ? PRIMARY : "var(--border)",
              color: stop <= value ? "#fff" : "var(--text-muted)",
              fontWeight: stop === value ? 700 : 400,
              fontSize: stop === value ? 14 : 12,
              transition: "all 0.1s ease",
              transform: stop === value ? "scale(1.1)" : "scale(1)",
              position: "relative",
            }}
            aria-label={`${skill} score ${stop}`}
          >
            {stop}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckmarkAnimation() {
  return (
    <svg
      viewBox="0 0 80 80"
      width={80}
      height={80}
      style={{ display: "block", margin: "0 auto" }}
    >
      <circle
        cx={40}
        cy={40}
        r={34}
        fill="none"
        stroke={SUCCESS}
        strokeWidth={4}
        strokeDasharray={213.6}
        strokeDashoffset={0}
        style={{
          animation: "drawCircle 0.5s ease forwards",
        }}
      />
      <polyline
        points="24,41 35,52 56,30"
        fill="none"
        stroke={SUCCESS}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={44}
        strokeDashoffset={0}
        style={{
          animation: "drawCheck 0.35s 0.45s ease forwards",
        }}
      />
      <style>{`
        @keyframes drawCircle {
          from { stroke-dashoffset: 213.6; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 44; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuickAssessFlowPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [skillScores, setSkillScores] = useState<Record<string, number>>({});
  const [observationText, setObservationText] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"overdue" | "alpha">("overdue");
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  const filteredPlayers = useMemo(() => {
    let list = PLAYERS.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "overdue") {
      list = [...list].sort((a, b) => overdueScore(b) - overdueScore(a));
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [search, sort]);

  const needAssessment = PLAYERS.filter((p) => daysSince(p.lastAssessed) >= 7).length;

  function selectPlayer(player: Player) {
    setSelectedPlayer(player);
    const initialScores: Record<string, number> = {};
    SKILLS.forEach((s) => {
      initialScores[s] = Math.round(player.prevScores[s]);
    });
    setSkillScores(initialScores);
    setObservationText("");
    setStep(2);
  }

  function submitAssessment() {
    if (!selectedPlayer) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRecentSessions((prev) => [
      { playerName: selectedPlayer.name, time },
      ...prev.slice(0, 2),
    ]);
    setStep(3);
    toast.success(`Assessment saved for ${selectedPlayer.name}`);
  }

  function assessAnother() {
    setStep(1);
    setSelectedPlayer(null);
    setSkillScores({});
    setObservationText("");
    setSearch("");
  }

  const specificity = getSpecificity(observationText);

  // ── Step 1: Player Select ─────────────────────────────────────────────────

  if (step === 1) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Quick Assess"
          title="Select a Player"
          subtitle="Tap a player to begin their 4-minute assessment"
        />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
          {/* Banner */}
          <div
            style={{
              background: PRIMARY + "22",
              border: `1.5px solid ${PRIMARY}`,
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🏀</span>
            <span style={{ color: PRIMARY, fontWeight: 600, fontSize: 15 }}>
              {needAssessment} player{needAssessment !== 1 ? "s" : ""} need assessment this week
            </span>
          </div>

          {/* Search + Sort */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              type="search"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 15,
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {(["overdue", "alpha"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSort(opt)}
                  style={{
                    padding: "10px 14px",
                    background: sort === opt ? PRIMARY : "var(--bg-surface)",
                    color: sort === opt ? "#fff" : "var(--text-muted)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: sort === opt ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt === "overdue" ? "Most Overdue" : "A–Z"}
                </button>
              ))}
            </div>
          </div>

          {/* Player Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredPlayers.map((player) => {
              const color = lastAssessedColor(player.lastAssessed);
              const label = lastAssessedLabel(player.lastAssessed);
              return (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 18px",
                    minHeight: 80,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateX(0)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: PRIMARY + "33",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 16,
                      color: PRIMARY,
                    }}
                  >
                    {player.name.split(" ").map((n) => n[0]).join("")}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 3 }}>
                      {player.name}
                    </div>
                    <div style={{ fontSize: 13, color: MUTED }}>
                      {player.position} · {player.ageGroup}
                    </div>
                  </div>

                  {/* Last assessed badge */}
                  <div
                    style={{
                      padding: "5px 10px",
                      borderRadius: 20,
                      background: color + "22",
                      border: `1px solid ${color}`,
                      color: color,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </div>

                  {/* Arrow */}
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: MUTED }}>
                No players match "{search}"
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Step 2: Skill Rating ──────────────────────────────────────────────────

  if (step === 2 && selectedPlayer) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Quick Assess · Step 2 of 2"
          title={selectedPlayer.name}
          subtitle={`${selectedPlayer.position} · ${selectedPlayer.ageGroup} · Last assessed ${lastAssessedLabel(selectedPlayer.lastAssessed)}`}
          actions={
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ← Back
            </button>
          }
        />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
          {/* Skill Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {SKILLS.map((skill) => (
              <SkillSlider
                key={skill}
                skill={skill}
                value={skillScores[skill] ?? selectedPlayer.prevScores[skill]}
                prev={selectedPlayer.prevScores[skill]}
                onChange={(v) => setSkillScores((prev) => ({ ...prev, [skill]: v }))}
              />
            ))}
          </div>

          {/* Quick Note */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                marginBottom: 10,
              }}
            >
              Quick Note
            </label>
            <textarea
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              placeholder="What did you see today? Be specific about skill and context."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                fontSize: 15,
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {observationText.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: specificity.color + "22",
                    border: `1px solid ${specificity.color}`,
                    color: specificity.color,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {specificity.label}
                </span>
                {specificity.label === "Generic" && (
                  <span style={{ fontSize: 12, color: MUTED }}>
                    Add a skill name and context for a stronger observation
                  </span>
                )}
                {specificity.label === "Developing" && (
                  <span style={{ fontSize: 12, color: MUTED }}>
                    Add context (drill, game, possession) for full credit
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={submitAssessment}
            style={{
              width: "100%",
              padding: "18px 24px",
              borderRadius: 12,
              border: "none",
              background: PRIMARY,
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.3,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            Submit Assessment
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Step 3: Confirmation ──────────────────────────────────────────────────

  if (step === 3 && selectedPlayer) {
    const vdv = selectedPlayer.vdvContributing;
    return (
      <AppShell>
        <PageHeader eyebrow="Assessment Complete" title="Saved!" subtitle="Your observation is now part of the verified record" />
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "0 16px 60px",
            textAlign: "center",
          }}
        >
          {/* Animated checkmark */}
          <div style={{ marginBottom: 24 }}>
            <CheckmarkAnimation />
          </div>

          {/* Player name */}
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Assessment saved for {selectedPlayer.name}
          </h2>
          <p style={{ color: MUTED, fontSize: 15, marginBottom: 24 }}>
            {selectedPlayer.position} · {selectedPlayer.ageGroup}
          </p>

          {/* VDV Status */}
          <div
            style={{
              background: vdv ? SUCCESS + "18" : WARNING + "18",
              border: `1.5px solid ${vdv ? SUCCESS : WARNING}`,
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 28,
            }}
          >
            {vdv ? (
              <p style={{ color: SUCCESS, fontWeight: 600, fontSize: 15, margin: 0 }}>
                {selectedPlayer.name.split(" ")[0]} is contributing to VDV ✓
              </p>
            ) : (
              <p style={{ color: WARNING, fontWeight: 600, fontSize: 15, margin: 0 }}>
                1 more assessment cycle needed for VDV eligibility
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
            <button
              onClick={assessAnother}
              style={{
                flex: 1,
                padding: "15px 20px",
                borderRadius: 10,
                border: `2px solid ${PRIMARY}`,
                background: "transparent",
                color: PRIMARY,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Assess Another Player
            </button>
            <button
              onClick={() => toast.info(`Navigating to ${selectedPlayer.name}'s profile`)}
              style={{
                flex: 1,
                padding: "15px 20px",
                borderRadius: 10,
                border: "none",
                background: PRIMARY,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View {selectedPlayer.name.split(" ")[0]}'s Profile
            </button>
          </div>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: MUTED,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Done Today
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {recentSessions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {s.playerName} · {s.time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return null;
}
