import { useState } from "react";
import { useRoute } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Brain,
  Zap,
  Shield,
  Film,
  ClipboardList,
  Calendar,
  Star,
  User,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_PLAYER = {
  id: "p1",
  name: "Marcus Davis",
  initials: "MD",
  position: "PG",
  jerseyNumber: 3,
  tier: "HS Varsity",
  gradYear: 2026,
  height: "6'1\"",
  weight: 175,
  handedness: "Right",
  yearsPlaying: 8,
  role: "Starter",
  gpa: "3.4",
  recruitingStatus: "D1 Interest",
  parentName: "James Davis",
};

const SKILLS = [
  {
    category: "Shooting",
    color: "oklch(0.65_0.18_290)",
    avg: 7.2,
    subSkills: [
      { name: "Catch & Shoot", score: 8, trend: "up", assessedAt: "May 1" },
      { name: "Off Dribble", score: 6, trend: "flat", assessedAt: "May 1" },
      { name: "Free Throw", score: 8, trend: "up", assessedAt: "May 1" },
      { name: "Pull-Up", score: 7, trend: "up", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Ball Handling",
    color: "oklch(0.72_0.17_75)",
    avg: 7.8,
    subSkills: [
      { name: "On the Move", score: 8, trend: "up", assessedAt: "May 1" },
      { name: "Pressure Handling", score: 7, trend: "up", assessedAt: "May 1" },
      { name: "Weak Hand", score: 6, trend: "flat", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Finishing",
    color: "oklch(0.68_0.22_25)",
    avg: 5.7,
    subSkills: [
      { name: "Contact Layup", score: 5, trend: "down", assessedAt: "May 1" },
      { name: "Floater", score: 6, trend: "flat", assessedAt: "Apr 15" },
      { name: "Euro Step", score: 5, trend: "flat", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Footwork",
    color: "oklch(0.75_0.18_150)",
    avg: 6.5,
    subSkills: [
      { name: "Pivot (Front/Back)", score: 7, trend: "up", assessedAt: "May 1" },
      { name: "Jab Step", score: 6, trend: "flat", assessedAt: "Apr 15" },
      { name: "Shot Fake", score: 7, trend: "up", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Defense",
    color: "oklch(0.7_0.18_200)",
    avg: 6.8,
    subSkills: [
      { name: "On-Ball", score: 7, trend: "up", assessedAt: "May 1" },
      { name: "Help Side", score: 6, trend: "flat", assessedAt: "May 1" },
      { name: "Closeouts", score: 7, trend: "up", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Decision-Making",
    color: "oklch(0.72_0.18_240)",
    avg: 7.0,
    subSkills: [
      { name: "Pick & Roll Reads", score: 7, trend: "up", assessedAt: "May 1" },
      { name: "Shot Selection", score: 7, trend: "flat", assessedAt: "May 1" },
      { name: "Pace Control", score: 7, trend: "up", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Conditioning",
    color: "oklch(0.7_0.16_60)",
    avg: 8.0,
    subSkills: [
      { name: "Lateral Quickness", score: 8, trend: "up", assessedAt: "May 1" },
      { name: "Endurance", score: 8, trend: "flat", assessedAt: "May 1" },
      { name: "Recovery Rate", score: 8, trend: "up", assessedAt: "Apr 15" },
    ],
  },
  {
    category: "Basketball IQ",
    color: "oklch(0.68_0.15_320)",
    avg: 7.5,
    subSkills: [
      { name: "Spacing", score: 8, trend: "up", assessedAt: "May 1" },
      { name: "Off-Ball Movement", score: 7, trend: "flat", assessedAt: "May 1" },
      { name: "Film Retention", score: 7, trend: "up", assessedAt: "Apr 15" },
    ],
  },
];

const FOCUS_AREAS = [
  {
    id: "fa1",
    priority: 1,
    category: "Finishing",
    subSkill: "Contact Layup",
    currentScore: 5,
    targetScore: 7,
    deadline: "Jun 15, 2025",
    rationale:
      "Weakest area relative to role. PG contact finishing limits effectiveness in the paint at D1 pace.",
    source: "coach" as const,
    progress: 28,
    drills: [
      "Left-hand wall layup series",
      "Mikan drill 3x/week",
      "Contact finishing against pad holder",
    ],
    filmClips: [
      "Turnover vs. Barnegat (contact)",
      "Missed and-1 vs. Toms River",
    ],
    milestones: [
      {
        description: "Score 6/10 on contact layup eval",
        targetDate: "May 20",
        completed: false,
      },
      {
        description: "10 consecutive wall layups each hand",
        targetDate: "Jun 1",
        completed: false,
      },
      {
        description: "Score 7/10 on contact layup eval",
        targetDate: "Jun 15",
        completed: false,
      },
    ],
  },
  {
    id: "fa2",
    priority: 2,
    category: "Shooting",
    subSkill: "Off Dribble",
    currentScore: 6,
    targetScore: 8,
    deadline: "Jul 1, 2025",
    rationale:
      "Catch-and-shoot is already a strength. Off-dribble gap limits creation at next level.",
    source: "ai" as const,
    progress: 15,
    drills: [
      "Pull-up off DHO (daily)",
      "Step-back off live dribble",
      "1-2 step pull-up form",
    ],
    filmClips: [
      "Pull-up miss vs. Lakewood (0:47)",
      "Good look off DHO vs. LBI (2:13)",
    ],
    milestones: [
      {
        description: "60% on pull-up shooting chart",
        targetDate: "Jun 1",
        completed: false,
      },
      {
        description: "Score 7/10 on off-dribble eval",
        targetDate: "Jun 15",
        completed: false,
      },
    ],
  },
  {
    id: "fa3",
    priority: 3,
    category: "Ball Handling",
    subSkill: "Weak Hand",
    currentScore: 6,
    targetScore: 8,
    deadline: "Jul 15, 2025",
    rationale:
      "Scouting reports note opponents overplay right. Weak hand development is recruiting-critical.",
    source: "coach" as const,
    progress: 40,
    drills: [
      "Left-only dribble warmup (10 min daily)",
      "Two-ball stationary drills",
      "Weak hand finishing series",
    ],
    filmClips: ["Forced right vs. Neptune (full game)"],
    milestones: [
      {
        description: "Left-only 3-cone drill under 8s",
        targetDate: "May 25",
        completed: true,
      },
      {
        description: "Score 7/10 on weak-hand eval",
        targetDate: "Jun 15",
        completed: false,
      },
    ],
  },
];

const AI_RECS = [
  {
    id: "r1",
    type: "add_focus_area",
    category: "Footwork",
    subSkill: "Drop Step (Post Entry)",
    reasoning:
      "Film review from last 4 games shows 6 failed post-entry attempts. Drop step footwork would add a dimension to half-court offense.",
    confidence: 0.82,
    status: "pending" as const,
  },
  {
    id: "r2",
    type: "increase_load",
    category: "Finishing",
    subSkill: "Contact Layup",
    reasoning:
      "Progress rate on current focus area FA1 is 14% in 3 weeks. Target pace requires 25%/week. Recommend adding one contact finishing session.",
    confidence: 0.91,
    status: "pending" as const,
  },
  {
    id: "r3",
    type: "schedule_assessment",
    category: "Conditioning",
    subSkill: "Lateral Quickness",
    reasoning:
      "Last evaluation was 6 weeks ago. Lateral quickness is a D1 recruiting benchmark. Recommend re-assessment this week.",
    confidence: 0.95,
    status: "accepted" as const,
  },
];

const REVIEWS = [
  {
    id: "rv1",
    date: "May 5, 2025",
    type: "Monthly 1-on-1",
    coachName: "Coach Williams",
    summary:
      "Strong progress on weak hand. Contact finishing still lags. Recommended adding Mikan drill. Film session showed good instincts on DHO read.",
    skillsReassessed: [
      "Finishing: Contact Layup → 5",
      "Ball Handling: Weak Hand → 6",
    ],
    nextReview: "Jun 5, 2025",
  },
  {
    id: "rv2",
    date: "Apr 7, 2025",
    type: "Monthly 1-on-1",
    coachName: "Coach Williams",
    summary:
      "Excellent effort. Pull-up improving week over week. Needs to work on finishing through contact. Great attitude in film sessions.",
    skillsReassessed: ["Shooting: Off Dribble → 6", "Finishing: Contact Layup → 5"],
    nextReview: "May 5, 2025",
  },
  {
    id: "rv3",
    date: "Mar 1, 2025",
    type: "Quarterly Assessment",
    coachName: "Coach Williams",
    summary:
      "Full 8-category assessment. Overall trajectory positive. Identified Finishing and Off-Dribble shooting as primary development targets for remainder of season.",
    skillsReassessed: ["All 8 categories"],
    nextReview: "Apr 7, 2025",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

type Tab = "Overview" | "Skills" | "Development Plan" | "AI Recommendations" | "Reviews";

const TABS: Tab[] = ["Overview", "Skills", "Development Plan", "AI Recommendations", "Reviews"];

function cssColor(raw: string) {
  // "oklch(0.65_0.18_290)" → "oklch(0.65 0.18 290)"
  return raw.replace(/_/g, " ");
}

function scoreColor(score: number) {
  if (score >= 8) return "oklch(0.75 0.18 150)";
  if (score >= 6) return "oklch(0.72 0.17 75)";
  return "oklch(0.68 0.22 25)";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkillRadar() {
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 110;
  const N = SKILLS.length;

  function pointAt(angle: number, r: number) {
    return {
      x: CENTER + r * Math.sin(angle),
      y: CENTER - r * Math.cos(angle),
    };
  }

  const rings = [2, 4, 6, 8, 10];

  const scorePoints = SKILLS.map((s, i) => {
    const angle = (2 * Math.PI * i) / N;
    const r = (s.avg / 10) * MAX_RADIUS;
    return pointAt(angle, r);
  });

  const scorePolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto"
    >
      {/* Concentric guide rings */}
      {rings.map((ring) => {
        const r = (ring / 10) * MAX_RADIUS;
        const ringPoints = Array.from({ length: N }, (_, i) => {
          const angle = (2 * Math.PI * i) / N;
          const p = pointAt(angle, r);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <g key={ring}>
            <polygon
              points={ringPoints}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              className="text-foreground"
            />
            <text
              x={CENTER + 4}
              y={CENTER - r - 3}
              fontSize={9}
              fill="currentColor"
              opacity={0.4}
              className="text-foreground"
            >
              {ring}
            </text>
          </g>
        );
      })}

      {/* Axis lines */}
      {SKILLS.map((_, i) => {
        const angle = (2 * Math.PI * i) / N;
        const outer = pointAt(angle, MAX_RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
            className="text-foreground"
          />
        );
      })}

      {/* Score polygon */}
      <polygon
        points={scorePolygon}
        fill="oklch(0.65 0.18 290 / 0.25)"
        stroke="oklch(0.65 0.18 290)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {scorePoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={cssColor(SKILLS[i].color)}
          stroke="var(--background)"
          strokeWidth={1.5}
        />
      ))}

      {/* Category labels */}
      {SKILLS.map((s, i) => {
        const angle = (2 * Math.PI * i) / N;
        const labelR = MAX_RADIUS + 22;
        const p = pointAt(angle, labelR);
        const textAnchor =
          Math.abs(p.x - CENTER) < 8
            ? "middle"
            : p.x < CENTER
            ? "end"
            : "start";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + 4}
            fontSize={9.5}
            fontWeight={600}
            textAnchor={textAnchor}
            fill={cssColor(s.color)}
          >
            {s.category}
          </text>
        );
      })}
    </svg>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.75_0.18_150)]" />;
  if (trend === "down")
    return <TrendingDown className="w-3.5 h-3.5 text-[oklch(0.68_0.22_25)]" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function SkillRow({
  name,
  score,
  trend,
  assessedAt,
}: {
  name: string;
  score: number;
  trend: string;
  assessedAt: string;
}) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-3 py-2">
      <TrendIcon trend={trend} />
      <span className="text-[13px] flex-1 min-w-0 truncate">{name}</span>
      <span className="text-[11px] text-muted-foreground shrink-0">{assessedAt}</span>
      <div
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold font-mono"
        style={{
          background: `${color.replace(")", " / 0.15)")}`,
          color,
          border: `1px solid ${color.replace(")", " / 0.35)")}`,
        }}
      >
        {score}
      </div>
      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / 10) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SkillCategoryGroup({
  category,
  color,
  avg,
  subSkills,
}: (typeof SKILLS)[0]) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: cssColor(color) }}
          />
          <span className="text-[13px] font-semibold">{category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[12px] font-mono font-bold"
            style={{ color: cssColor(color) }}
          >
            {avg.toFixed(1)}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 divide-y divide-border/50 bg-card/50">
          {subSkills.map((ss) => (
            <SkillRow key={ss.name} {...ss} />
          ))}
        </div>
      )}
    </div>
  );
}

function FocusAreaCard({ area }: { area: (typeof FOCUS_AREAS)[0] }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<number, string> = {
    1: "oklch(0.68 0.22 25)",
    2: "oklch(0.72 0.17 75)",
    3: "oklch(0.75 0.18 150)",
  };
  const pColor = priorityColors[area.priority] ?? "oklch(0.65 0.18 290)";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold font-mono shrink-0"
            style={{
              background: `${pColor.replace(")", " / 0.15)")}`,
              color: pColor,
              border: `1px solid ${pColor.replace(")", " / 0.3)")}`,
            }}
          >
            {area.priority}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold">{area.subSkill}</span>
              <span className="text-muted-foreground text-[12px]">·</span>
              <span className="text-[12px] text-muted-foreground">{area.category}</span>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 gap-1"
                style={{
                  borderColor: area.source === "ai"
                    ? "oklch(0.72 0.18 290 / 0.4)"
                    : "oklch(0.75 0.18 150 / 0.4)",
                  color: area.source === "ai"
                    ? "oklch(0.65 0.18 290)"
                    : "oklch(0.75 0.18 150)",
                }}
              >
                {area.source === "ai" ? (
                  <><Brain className="w-2.5 h-2.5" /> AI</>
                ) : (
                  <><User className="w-2.5 h-2.5" /> Coach</>
                )}
              </Badge>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              {area.rationale}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 justify-end text-[12px] font-mono font-bold">
            <span style={{ color: scoreColor(area.currentScore) }}>{area.currentScore}</span>
            <span className="text-muted-foreground">→</span>
            <span style={{ color: scoreColor(area.targetScore) }}>{area.targetScore}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />
            {area.deadline}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Progress toward goal</span>
          <span className="font-mono font-semibold text-foreground">{area.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${area.progress}%`,
              background: "oklch(0.72 0.18 290)",
            }}
          />
        </div>
      </div>

      {/* Milestones preview */}
      <div className="px-5 pb-3 flex flex-col gap-1.5">
        {area.milestones.slice(0, expanded ? undefined : 2).map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <CheckCircle2
              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                m.completed
                  ? "text-[oklch(0.75_0.18_150)]"
                  : "text-muted-foreground/40"
              }`}
            />
            <span className={m.completed ? "line-through text-muted-foreground" : ""}>
              {m.description}
            </span>
            <span className="ml-auto text-muted-foreground shrink-0">{m.targetDate}</span>
          </div>
        ))}
      </div>

      {/* Expanded: drills + film */}
      {expanded && (
        <div className="px-5 pb-4 space-y-4 border-t border-border pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Drills
            </div>
            <ul className="space-y-1">
              {area.drills.map((d, i) => (
                <li key={i} className="text-[12.5px] flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">·</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Film className="w-3 h-3" /> Film Clips
            </div>
            <ul className="space-y-1">
              {area.filmClips.map((clip, i) => (
                <li key={i}>
                  <button
                    className="text-[12.5px] text-primary hover:underline underline-offset-2 text-left"
                    onClick={() => toast.info(`Opening clip: ${clip}`)}
                  >
                    {clip}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="px-5 pb-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[12px] text-primary hover:underline underline-offset-2 flex items-center gap-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show drills & film</>
          )}
        </button>
      </div>
    </div>
  );
}

function typeLabel(type: string) {
  if (type === "add_focus_area") return "Add Focus Area";
  if (type === "increase_load") return "Increase Load";
  if (type === "schedule_assessment") return "Schedule Assessment";
  return type;
}

function typeIcon(type: string) {
  if (type === "add_focus_area") return <Target className="w-3.5 h-3.5" />;
  if (type === "increase_load") return <Zap className="w-3.5 h-3.5" />;
  if (type === "schedule_assessment") return <Calendar className="w-3.5 h-3.5" />;
  return <Sparkles className="w-3.5 h-3.5" />;
}

function AIRecommendationCard({
  rec,
  onAccept,
  onOverride,
}: {
  rec: (typeof AI_RECS)[0];
  onAccept: (id: string) => void;
  onOverride: (id: string, reason: string) => void;
}) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [reason, setReason] = useState("");

  function confirmOverride() {
    if (!reason.trim()) {
      toast.error("Please provide a reason for overriding.");
      return;
    }
    onOverride(rec.id, reason);
    setOverrideMode(false);
    setReason("");
  }

  const confidencePct = Math.round(rec.confidence * 100);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[11px] h-5 px-1.5 gap-1 border-[oklch(0.65_0.18_290_/_0.4)] text-[oklch(0.65_0.18_290)]"
            >
              {typeIcon(rec.type)}
              {typeLabel(rec.type)}
            </Badge>
            <span className="text-[12px] text-muted-foreground">
              {rec.category} · {rec.subSkill}
            </span>
          </div>
          {rec.status === "accepted" && (
            <Badge className="shrink-0 bg-[oklch(0.75_0.18_150_/_0.15)] text-[oklch(0.75_0.18_150)] border-[oklch(0.75_0.18_150_/_0.3)] border text-[11px] gap-1">
              <CheckCircle2 className="w-3 h-3" /> Accepted
            </Badge>
          )}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-semibold">
            Confidence
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${confidencePct}%`,
                background:
                  confidencePct >= 90
                    ? "oklch(0.75 0.18 150)"
                    : confidencePct >= 75
                    ? "oklch(0.72 0.17 75)"
                    : "oklch(0.68 0.22 25)",
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-foreground">
            {confidencePct}%
          </span>
        </div>

        <p className="text-[13px] text-muted-foreground leading-relaxed">{rec.reasoning}</p>

        {rec.status === "pending" && !overrideMode && (
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              className="h-8 text-[12px] bg-[oklch(0.75_0.18_150_/_0.15)] text-[oklch(0.75_0.18_150)] border border-[oklch(0.75_0.18_150_/_0.3)] hover:bg-[oklch(0.75_0.18_150_/_0.25)]"
              variant="outline"
              onClick={() => onAccept(rec.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[12px]"
              onClick={() => setOverrideMode(true)}
            >
              Override
            </Button>
          </div>
        )}

        {overrideMode && (
          <div className="mt-4 space-y-2">
            <label className="text-[12px] text-muted-foreground font-medium">
              Reason for override
            </label>
            <Textarea
              className="text-[13px] resize-none"
              rows={3}
              placeholder="Explain why you're overriding this recommendation…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-[12px]" onClick={confirmOverride}>
                Confirm Override
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-[12px]"
                onClick={() => {
                  setOverrideMode(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof REVIEWS)[0] }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold">{review.date}</span>
            <Badge variant="outline" className="text-[11px] h-5 px-1.5">
              {review.type}
            </Badge>
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3" /> {review.coachName}
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" /> Next: {review.nextReview}
          </div>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{review.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {review.skillsReassessed.map((s, i) => (
          <span
            key={i}
            className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PlayerProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_match, params] = useRoute("/app/coach/players/:id");
  const playerId = params?.id ?? MOCK_PLAYER.id;
  void playerId; // used for data fetching in production

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [recStatuses, setRecStatuses] = useState<
    Record<string, "pending" | "accepted" | "overridden">
  >(Object.fromEntries(AI_RECS.map((r) => [r.id, r.status])));

  function acceptRec(id: string) {
    setRecStatuses((prev) => ({ ...prev, [id]: "accepted" }));
    toast.success("Recommendation accepted and added to the plan.");
  }

  function overrideRec(id: string, reason: string) {
    setRecStatuses((prev) => ({ ...prev, [id]: "overridden" }));
    toast("Recommendation overridden.", { description: reason });
  }

  const recs = AI_RECS.map((r) => ({
    ...r,
    status: recStatuses[r.id] ?? r.status,
  }));

  const overallAvg = (
    SKILLS.reduce((acc, s) => acc + s.avg, 0) / SKILLS.length
  ).toFixed(1);

  return (
    <AppShell>
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* ── Player header ── */}
        <div className="flex items-start justify-between gap-6 mb-6 pb-6 border-b border-border">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-[oklch(0.72_0.18_290_/_0.15)] border border-[oklch(0.72_0.18_290_/_0.3)] flex items-center justify-center text-[22px] font-bold shrink-0 text-[oklch(0.65_0.18_290)]">
              {MOCK_PLAYER.initials}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="text-[26px] font-bold leading-none">{MOCK_PLAYER.name}</h1>
                <Badge
                  className="text-[11px] font-mono h-6 px-2"
                  style={{
                    background: "oklch(0.72 0.18 290 / 0.15)",
                    color: "oklch(0.65 0.18 290)",
                    border: "1px solid oklch(0.72 0.18 290 / 0.35)",
                  }}
                >
                  #{MOCK_PLAYER.jerseyNumber} · {MOCK_PLAYER.position}
                </Badge>
                <Badge variant="outline" className="text-[11px] h-6 px-2">
                  {MOCK_PLAYER.tier}
                </Badge>
                <Badge variant="outline" className="text-[11px] h-6 px-2">
                  {MOCK_PLAYER.role}
                </Badge>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-muted-foreground">
                <span>{MOCK_PLAYER.height} · {MOCK_PLAYER.weight} lbs</span>
                <span>·</span>
                <span>{MOCK_PLAYER.handedness}-handed</span>
                <span>·</span>
                <span>{MOCK_PLAYER.yearsPlaying} yrs playing</span>
                <span>·</span>
                <span>GPA {MOCK_PLAYER.gpa}</span>
                <span>·</span>
                <span>Class of {MOCK_PLAYER.gradYear}</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[11.5px] px-2.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "oklch(0.75 0.18 150 / 0.15)",
                    color: "oklch(0.75 0.18 150)",
                    border: "1px solid oklch(0.75 0.18 150 / 0.3)",
                  }}
                >
                  <Star className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {MOCK_PLAYER.recruitingStatus}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  Parent: {MOCK_PLAYER.parentName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-9 text-[13px]">
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Edit Plan
            </Button>
            <Button size="sm" className="h-9 text-[13px]">
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Full Assessment
            </Button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 border-b border-border mb-6 -mx-0.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bio card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Player Bio
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Position", value: MOCK_PLAYER.position },
                  { label: "Jersey", value: `#${MOCK_PLAYER.jerseyNumber}` },
                  { label: "Height", value: MOCK_PLAYER.height },
                  { label: "Weight", value: `${MOCK_PLAYER.weight} lbs` },
                  { label: "Handedness", value: MOCK_PLAYER.handedness },
                  { label: "Years Playing", value: `${MOCK_PLAYER.yearsPlaying} yrs` },
                  { label: "GPA", value: MOCK_PLAYER.gpa },
                  { label: "Grad Year", value: String(MOCK_PLAYER.gradYear) },
                  { label: "Tier", value: MOCK_PLAYER.tier },
                  { label: "Role", value: MOCK_PLAYER.role },
                  { label: "Recruiting", value: MOCK_PLAYER.recruitingStatus },
                  { label: "Parent", value: MOCK_PLAYER.parentName },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="text-[11px] text-muted-foreground">{row.label}</div>
                    <div className="text-[13px] font-semibold mt-0.5">{row.value}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-[11px] text-muted-foreground mb-1">Overall Skill Avg</div>
                <div className="text-[28px] font-bold font-mono text-[oklch(0.65_0.18_290)]">
                  {overallAvg}
                  <span className="text-[14px] text-muted-foreground font-normal ml-1">/10</span>
                </div>
              </div>
            </div>

            {/* IDP summary */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Development Focus Areas
                </div>
                {FOCUS_AREAS.map((fa) => (
                  <div key={fa.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">
                        {fa.priority}. {fa.subSkill}
                        <span className="text-muted-foreground font-normal text-[11.5px] ml-1.5">
                          ({fa.category})
                        </span>
                      </span>
                      <span className="font-mono text-[12px] text-muted-foreground">
                        {fa.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${fa.progress}%`,
                          background: "oklch(0.72 0.18 290)",
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline: {fa.deadline}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Next Review
                </div>
                <div className="text-[15px] font-semibold">{REVIEWS[0].nextReview}</div>
                <div className="text-[12.5px] text-muted-foreground">
                  {REVIEWS[0].type} with {REVIEWS[0].coachName}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Season Goals
                </div>
                {[
                  "Raise contact layup score to 7/10 by June",
                  "Develop off-dribble shooting for D1 evaluation",
                  "Strengthen weak hand for recruiting exposure",
                  "Maintain 3.4+ GPA through finals",
                ].map((goal, i) => (
                  <div key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="text-primary mt-0.5">·</span>
                    {goal}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Skills ── */}
        {activeTab === "Skills" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-4 sticky top-6">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5 mb-4">
                  <Brain className="w-3.5 h-3.5" /> Skill Radar
                </div>
                <SkillRadar />
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-[11px] text-muted-foreground mb-1">Overall Average</div>
                  <div className="text-[24px] font-bold font-mono text-[oklch(0.65_0.18_290)]">
                    {overallAvg}
                    <span className="text-[12px] text-muted-foreground font-normal ml-1">/10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {SKILLS.map((s) => (
                <SkillCategoryGroup key={s.category} {...s} />
              ))}
            </div>
          </div>
        )}

        {/* ── Development Plan ── */}
        {activeTab === "Development Plan" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-[17px] font-semibold">Individual Development Plan</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {FOCUS_AREAS.length} active focus areas · Updated May 5, 2025
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[12px]">
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Add Focus Area
              </Button>
            </div>
            {FOCUS_AREAS.map((fa) => (
              <FocusAreaCard key={fa.id} area={fa} />
            ))}
          </div>
        )}

        {/* ── AI Recommendations ── */}
        {activeTab === "AI Recommendations" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[oklch(0.65_0.18_290_/_0.3)] bg-[oklch(0.65_0.18_290_/_0.06)] px-5 py-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[oklch(0.65_0.18_290)] mt-0.5 shrink-0" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                AI analyses film sessions, assessment score trends, and D1 benchmark data to surface
                development recommendations. All suggestions require coach review and approval
                before they affect the player's development plan.
              </p>
            </div>
            {recs.map((rec) => (
              <AIRecommendationCard
                key={rec.id}
                rec={rec}
                onAccept={acceptRec}
                onOverride={overrideRec}
              />
            ))}
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === "Reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-[17px] font-semibold">Review History</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {REVIEWS.length} reviews · Next: {REVIEWS[0].nextReview}
                </p>
              </div>
              <Button size="sm" className="h-8 text-[12px]">
                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule Next Review
              </Button>
            </div>
            {REVIEWS.map((rv) => (
              <ReviewCard key={rv.id} review={rv} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default PlayerProfilePage;
