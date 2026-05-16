/**
 * ProgramHealthDashboardPage — Director's early-warning system.
 * Route: /app/director/program-health
 *
 * Sections:
 *   1. Program health score (SVG semicircle gauge + contributing factors)
 *   2. Team vitals grid (multi-team tab selector, 4×2 vital cards)
 *   3. Season timeline (SVG bar with events + assessment pacing chart)
 *   4. Warning signals (compact actionable list)
 *   5. Churn risk by player (table + sparklines)
 *   6. Coach activity breakdown (per-coach table)
 */
import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Users,
  Activity,
  Film,
  Flag,
  TrendingDown,
  TrendingUp,
  Share2,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

type Team = {
  id: string;
  label: string;
  vitals: TeamVitals;
};

type TeamVitals = {
  attendanceRate:       number;
  attendanceTarget:     number;
  assessmentDensity:    number;
  assessmentTarget:     number;
  idpOnTrack:           number;
  idpTarget:            number;
  formCompletion:       number;
  formTarget:           number;
  coachActive:          number;
  coachTotal:           number;
  parentEngagement:     number;
  parentTarget:         number;
  filmAnnotation:       number;
  filmTarget:           number;
  daysSinceAssessment:  number;
};

const TEAMS: Team[] = [
  {
    id: "16u-premier",
    label: "16U Premier",
    vitals: {
      attendanceRate: 87, attendanceTarget: 90,
      assessmentDensity: 1.2, assessmentTarget: 1.0,
      idpOnTrack: 71, idpTarget: 70,
      formCompletion: 84, formTarget: 85,
      coachActive: 3, coachTotal: 4,
      parentEngagement: 62, parentTarget: 65,
      filmAnnotation: 71, filmTarget: 65,
      daysSinceAssessment: 4,
    },
  },
  {
    id: "16u-gold",
    label: "16U Gold",
    vitals: {
      attendanceRate: 91, attendanceTarget: 90,
      assessmentDensity: 0.8, assessmentTarget: 1.0,
      idpOnTrack: 65, idpTarget: 70,
      formCompletion: 78, formTarget: 85,
      coachActive: 2, coachTotal: 2,
      parentEngagement: 58, parentTarget: 65,
      filmAnnotation: 54, filmTarget: 65,
      daysSinceAssessment: 19,
    },
  },
  {
    id: "17u-premier",
    label: "17U Premier",
    vitals: {
      attendanceRate: 84, attendanceTarget: 90,
      assessmentDensity: 1.4, assessmentTarget: 1.0,
      idpOnTrack: 79, idpTarget: 70,
      formCompletion: 91, formTarget: 85,
      coachActive: 3, coachTotal: 3,
      parentEngagement: 71, parentTarget: 65,
      filmAnnotation: 88, filmTarget: 65,
      daysSinceAssessment: 2,
    },
  },
  {
    id: "14u-select",
    label: "14U Select",
    vitals: {
      attendanceRate: 79, attendanceTarget: 90,
      assessmentDensity: 0.6, assessmentTarget: 1.0,
      idpOnTrack: 52, idpTarget: 70,
      formCompletion: 68, formTarget: 85,
      coachActive: 1, coachTotal: 2,
      parentEngagement: 44, parentTarget: 65,
      filmAnnotation: 33, filmTarget: 65,
      daysSinceAssessment: 38,
    },
  },
];

type HealthFactor = { label: string; score: number };

const HEALTH_FACTORS: HealthFactor[] = [
  { label: "Assessment Cadence",  score: 95 },
  { label: "Family Engagement",   score: 74 },
  { label: "Staff Activity",      score: 88 },
  { label: "Form Completion",     score: 82 },
  { label: "Data Quality",        score: 76 },
];

type AssessmentMonth = { month: string; count: number };

const ASSESSMENT_MONTHS: AssessmentMonth[] = [
  { month: "Sep", count: 2 },
  { month: "Oct", count: 4 },
  { month: "Nov", count: 3 },
  { month: "Dec", count: 0 },
  { month: "Jan", count: 5 },
  { month: "Feb", count: 4 },
  { month: "Mar", count: 3 },
  { month: "Apr", count: 2 },
  { month: "May", count: 1 },
];

type TimelineEvent = {
  label: string;
  type: "start" | "end" | "assessment" | "tournament" | "tryout" | "current";
  monthIndex: number; // 0 = Sep, 8 = May
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  { label: "Season Start",   type: "start",      monthIndex: 0   },
  { label: "Assessment #1",  type: "assessment", monthIndex: 0.5 },
  { label: "Assessment #2",  type: "assessment", monthIndex: 1.5 },
  { label: "Assessment #3",  type: "assessment", monthIndex: 2.5 },
  { label: "Holiday Break",  type: "tournament", monthIndex: 3   },
  { label: "Assessment #4",  type: "assessment", monthIndex: 4   },
  { label: "Assessment #5",  type: "assessment", monthIndex: 5   },
  { label: "Tryouts",        type: "tryout",     monthIndex: 5.5 },
  { label: "Assessment #6",  type: "assessment", monthIndex: 6.5 },
  { label: "Tournament",     type: "tournament", monthIndex: 7   },
  { label: "Today",          type: "current",    monthIndex: 7.5 },
  { label: "Season End",     type: "end",        monthIndex: 8   },
];

type Warning = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  context: string;
  action: string;
};

const WARNINGS: Warning[] = [
  {
    id: "w1",
    severity: "high",
    title: "3 players haven't been assessed in 6 weeks",
    context: "Their profiles are going stale and IDP data may be inaccurate.",
    action: "Schedule assessment",
  },
  {
    id: "w2",
    severity: "medium",
    title: "Parent report open rate dropped to 62% this month",
    context: "Down from 78% in February — subject line may need improvement.",
    action: "Resend with better subject line",
  },
  {
    id: "w3",
    severity: "low",
    title: "Coach Thompson hasn't logged a film annotation in 18 days",
    context: "Film annotation rate drops when one coach goes silent.",
    action: "Check in with coach",
  },
];

type ChurnPlayer = {
  id: string;
  name: string;
  ageGroup: string;
  attendanceTrend: number[]; // last 6 sessions
  daysSinceCoachInteraction: number;
  idpStatus: "on-track" | "behind" | "at-risk";
  riskLevel: "high" | "medium" | "low";
};

const CHURN_PLAYERS: ChurnPlayer[] = [
  {
    id: "cp1",
    name: "Marcus T.",
    ageGroup: "16U",
    attendanceTrend: [1, 1, 0, 1, 0, 0],
    daysSinceCoachInteraction: 21,
    idpStatus: "behind",
    riskLevel: "high",
  },
  {
    id: "cp2",
    name: "Devon R.",
    ageGroup: "14U",
    attendanceTrend: [1, 0, 1, 0, 1, 0],
    daysSinceCoachInteraction: 16,
    idpStatus: "at-risk",
    riskLevel: "high",
  },
  {
    id: "cp3",
    name: "Isaiah W.",
    ageGroup: "16U",
    attendanceTrend: [1, 1, 1, 1, 0, 1],
    daysSinceCoachInteraction: 8,
    idpStatus: "behind",
    riskLevel: "medium",
  },
  {
    id: "cp4",
    name: "Jaylen M.",
    ageGroup: "17U",
    attendanceTrend: [0, 1, 1, 0, 0, 1],
    daysSinceCoachInteraction: 19,
    idpStatus: "on-track",
    riskLevel: "medium",
  },
];

type CoachActivity = {
  id: string;
  name: string;
  role: string;
  assessments: number;
  observations: number;
  filmAnnotations: number;
  educationModules: number;
  lastActive: string;
  activityPct: number; // share of all activity
};

const COACH_ACTIVITY: CoachActivity[] = [
  {
    id: "ca1",
    name: "Coach Grant",
    role: "Head Coach",
    assessments: 48,
    observations: 62,
    filmAnnotations: 41,
    educationModules: 7,
    lastActive: "Today",
    activityPct: 52,
  },
  {
    id: "ca2",
    name: "Coach Thompson",
    role: "Assistant Coach",
    assessments: 14,
    observations: 21,
    filmAnnotations: 3,
    educationModules: 2,
    lastActive: "18 days ago",
    activityPct: 16,
  },
  {
    id: "ca3",
    name: "Coach Rivera",
    role: "Skills Trainer",
    assessments: 31,
    observations: 27,
    filmAnnotations: 22,
    educationModules: 5,
    lastActive: "2 days ago",
    activityPct: 28,
  },
  {
    id: "ca4",
    name: "Coach Patel",
    role: "Strength Coach",
    assessments: 4,
    observations: 9,
    filmAnnotations: 1,
    educationModules: 1,
    lastActive: "6 days ago",
    activityPct: 4,
  },
];

/* -------------------------------------------------------------------------- */
/* Helper utilities                                                            */
/* -------------------------------------------------------------------------- */

function factorColor(score: number): string {
  if (score >= 85) return SUCCESS;
  if (score >= 70) return PRIMARY;
  if (score >= 50) return WARNING;
  return DANGER;
}

function vitalStatus(value: number, target: number, higherBetter = true): "good" | "warn" | "bad" {
  const ratio = higherBetter ? value / target : target / value;
  if (ratio >= 1)    return "good";
  if (ratio >= 0.92) return "warn";
  return "bad";
}

function statusColor(s: "good" | "warn" | "bad") {
  if (s === "good") return SUCCESS;
  if (s === "warn") return WARNING;
  return DANGER;
}

function daysBadgeColor(days: number) {
  if (days < 14) return SUCCESS;
  if (days <= 30) return WARNING;
  return DANGER;
}

function riskColor(r: "high" | "medium" | "low") {
  if (r === "high")   return DANGER;
  if (r === "medium") return WARNING;
  return SUCCESS;
}

function coachStatusColor(a: CoachActivity) {
  if (a.lastActive === "Today" || a.lastActive.includes("2 days") || a.lastActive.includes("6 days")) return SUCCESS;
  if (a.lastActive.includes("18")) return WARNING;
  return MUTED;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

/** SVG semicircle gauge, 0–100. */
function HealthGauge({ score }: { score: number }) {
  const W = 260;
  const H = 140;
  const cx = W / 2;
  const cy = H - 10;
  const r  = 110;

  function polarToXY(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  }

  // Semicircle goes 0° (right) → 180° (left)
  // We map score 0–100 → 0°–180°
  const pct = score / 100;

  function arcPath(startDeg: number, endDeg: number) {
    const s = polarToXY(startDeg);
    const e = polarToXY(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  }

  const zones = [
    { startPct: 0,    endPct: 0.5,  color: DANGER  },
    { startPct: 0.5,  endPct: 0.7,  color: WARNING },
    { startPct: 0.7,  endPct: 0.85, color: SUCCESS },
    { startPct: 0.85, endPct: 1.0,  color: PRIMARY },
  ];

  const needleAngle = pct * 180; // 0 → right, 180 → left
  const needleTip   = polarToXY(needleAngle);

  let gaugeColor = DANGER;
  if (score >= 85) gaugeColor = PRIMARY;
  else if (score >= 70) gaugeColor = SUCCESS;
  else if (score >= 50) gaugeColor = WARNING;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label={`Health score ${score} of 100`}>
      {/* Background track */}
      <path d={arcPath(0, 180)} fill="none" stroke="oklch(0.22 0.005 260)" strokeWidth={18} strokeLinecap="round" />

      {/* Colored zone arcs */}
      {zones.map((z, i) => {
        const sDeg = z.startPct * 180;
        const eDeg = z.endPct   * 180;
        return (
          <path
            key={i}
            d={arcPath(sDeg, eDeg)}
            fill="none"
            stroke={z.color}
            strokeWidth={18}
            strokeLinecap="butt"
            opacity={0.22}
          />
        );
      })}

      {/* Filled progress arc */}
      <path
        d={arcPath(0, needleAngle)}
        fill="none"
        stroke={gaugeColor}
        strokeWidth={18}
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke={gaugeColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={7} fill={gaugeColor} />

      {/* Score label */}
      <text x={cx} y={cy - 22} textAnchor="middle" fontSize={36} fontWeight={700} fill="oklch(0.96 0.003 260)" fontFamily="Oswald, system-ui">
        {score}
      </text>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={12} fill={MUTED} fontFamily="Inter, system-ui">
        / 100
      </text>
    </svg>
  );
}

/** Mini horizontal progress bar. */
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-1.5 rounded-full w-full" style={{ background: "oklch(0.22 0.005 260)" }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

/** SVG sparkline for attendance trend (1 = present, 0 = absent). */
function AttendanceSparkline({ trend }: { trend: number[] }) {
  const W = 64;
  const H = 22;
  const n = trend.length;
  const pts = trend.map((v, i) => {
    const x = (i / (n - 1)) * (W - 4) + 2;
    const y = v === 1 ? 4 : H - 4;
    return `${x},${y}`;
  });

  return (
    <svg width={W} height={H} aria-hidden>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={trend[trend.length - 1] === 0 ? DANGER : SUCCESS}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {trend.map((v, i) => {
        const x = (i / (n - 1)) * (W - 4) + 2;
        const y = v === 1 ? 4 : H - 4;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            fill={v === 1 ? SUCCESS : DANGER}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

/** Season timeline SVG. */
function SeasonTimeline() {
  const W   = 800;
  const H   = 60;
  const PAD = 24;
  const lineY = 30;

  function xForMonth(monthIndex: number) {
    return PAD + (monthIndex / 8) * (W - PAD * 2);
  }

  const eventColors: Record<TimelineEvent["type"], string> = {
    start:      SUCCESS,
    end:        MUTED,
    assessment: PRIMARY,
    tournament: WARNING,
    tryout:     "oklch(0.65 0.15 230)",
    current:    DANGER,
  };

  return (
    <div className="overflow-x-auto">
      <svg
        width={W}
        height={H + 28}
        viewBox={`0 0 ${W} ${H + 28}`}
        aria-label="Season timeline"
        style={{ minWidth: W }}
      >
        {/* Season months */}
        {["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"].map((m, i) => (
          <text
            key={m}
            x={xForMonth(i)}
            y={H + 22}
            textAnchor="middle"
            fontSize={9.5}
            fill={MUTED}
            fontFamily="Inter, system-ui"
          >
            {m}
          </text>
        ))}

        {/* Timeline bar */}
        <rect x={PAD} y={lineY - 2} width={W - PAD * 2} height={4} rx={2} fill="oklch(0.22 0.005 260)" />

        {/* Events */}
        {TIMELINE_EVENTS.map((ev) => {
          const x   = xForMonth(ev.monthIndex);
          const col = eventColors[ev.type];
          const isAssessment = ev.type === "assessment";
          const isCurrent    = ev.type === "current";

          return (
            <g key={ev.label}>
              {isCurrent ? (
                <>
                  <line x1={x} y1={6} x2={x} y2={lineY + 6} stroke={col} strokeWidth={2} strokeDasharray="3 2" />
                  <circle cx={x} cy={lineY} r={6} fill={col} opacity={0.9} />
                  <text x={x} y={16} textAnchor="middle" fontSize={8} fill={col} fontFamily="Inter, system-ui" fontWeight={600}>
                    Today
                  </text>
                </>
              ) : isAssessment ? (
                <circle cx={x} cy={lineY} r={5} fill={col} opacity={0.85} />
              ) : (
                <>
                  <circle cx={x} cy={lineY} r={6} fill={col} opacity={0.9} />
                  <text x={x} y={lineY - 10} textAnchor="middle" fontSize={8} fill={col} fontFamily="Inter, system-ui">
                    {ev.label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Assessment pacing SVG bar chart. */
function PacingChart({ months }: { months: AssessmentMonth[] }) {
  const W       = 480;
  const H       = 80;
  const barW    = 32;
  const maxVal  = Math.max(...months.map((m) => m.count), 1);
  const spacing = (W - 16) / months.length;

  return (
    <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ minWidth: 280 }}>
      {months.map((m, i) => {
        const barH  = m.count === 0 ? 0 : Math.max(6, (m.count / maxVal) * (H - 8));
        const x     = i * spacing + spacing / 2 - barW / 2 + 8;
        const y     = H - barH;
        const color = m.count === 0 ? DANGER : SUCCESS;

        return (
          <g key={m.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.82} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={9} fill={MUTED} fontFamily="Inter, system-ui">
              {m.month}
            </text>
            {m.count > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="oklch(0.96 0.003 260)" fontFamily="Inter, system-ui">
                {m.count}
              </text>
            )}
            {m.count === 0 && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill={DANGER} fontFamily="Inter, system-ui" fontWeight={600}>
                !
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** One vital sign card. */
function VitalCard({
  label,
  value,
  target,
  unit = "%",
  higherBetter = true,
  sublabel,
  note,
}: {
  label: string;
  value: number | string;
  target?: number;
  unit?: string;
  higherBetter?: boolean;
  sublabel?: string;
  note?: string;
}) {
  const numVal = typeof value === "number" ? value : parseFloat(value as string);
  const status = target !== undefined ? vitalStatus(numVal, target, higherBetter) : "good";
  const col    = statusColor(status);
  const met    = status === "good";

  return (
    <div className="rounded-xl border border-border bg-[var(--bg-surface,theme(colors.card.DEFAULT))] p-4 flex flex-col gap-2">
      <div className="text-[11px] text-[var(--text-muted,theme(colors.muted.foreground))] font-medium leading-tight">
        {label}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[28px] font-bold leading-none" style={{ color: col, fontFamily: "Oswald, system-ui" }}>
          {value}
        </span>
        <span className="text-[13px] text-[var(--text-muted,theme(colors.muted.foreground))] mb-0.5">{unit}</span>
      </div>
      {target !== undefined && (
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[var(--text-muted,theme(colors.muted.foreground))]">
            target {target}{unit}
          </span>
          {met ? (
            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: SUCCESS }} />
          ) : (
            <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: col }} />
          )}
        </div>
      )}
      {sublabel && (
        <div className="text-[12px] font-medium" style={{ color: col }}>
          {sublabel}
        </div>
      )}
      {note && (
        <div className="text-[11px] text-[var(--text-muted,theme(colors.muted.foreground))]">{note}</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ProgramHealthDashboardPage() {
  const [activeTeamId, setActiveTeamId] = useState<string>(TEAMS[0].id);
  const activeTeam = TEAMS.find((t) => t.id === activeTeamId) ?? TEAMS[0];
  const v = activeTeam.vitals;

  const HEALTH_SCORE = 82;

  // Detect single-coach dependency (>70% of activity from one coach)
  const totalActivity = COACH_ACTIVITY.reduce(
    (s, c) => s + c.assessments + c.observations + c.filmAnnotations,
    0,
  );
  const dependencyCoach = COACH_ACTIVITY.find(
    (c) => (c.assessments + c.observations + c.filmAnnotations) / totalActivity > 0.7,
  );

  function handleAction(msg: string) {
    toast.success(msg);
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        <PageHeader
          eyebrow="Program Intelligence"
          title="Program Health Dashboard"
          subtitle="Vital signs for your program — catch issues before they become problems"
          actions={
            <button
              onClick={() => handleAction("Dashboard link copied to clipboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))] hover:bg-muted/40 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share with Staff
            </button>
          }
        />

        {/* ── Section 1: Health Score ───────────────────────────────────────── */}
        <section aria-labelledby="health-score-heading">
          <h2 id="health-score-heading" className="text-[15px] font-semibold mb-4">
            Program Health Score
          </h2>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              {/* Gauge */}
              <div className="flex flex-col items-center gap-2">
                <HealthGauge score={HEALTH_SCORE} />
                <div className="text-[14px] font-semibold text-center">Program Health Score</div>
                <div className="text-[13px] text-muted-foreground text-center">
                  Strong. <span style={{ color: WARNING }}>2 areas to watch.</span>
                </div>

                {/* Zone legend */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {[
                    { label: "Excellent", color: PRIMARY,  range: "85–100" },
                    { label: "Good",      color: SUCCESS,  range: "70–85"  },
                    { label: "Caution",   color: WARNING,  range: "50–70"  },
                    { label: "Critical",  color: DANGER,   range: "0–50"   },
                  ].map((z) => (
                    <div key={z.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: z.color }} />
                      {z.label} ({z.range})
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributing factors */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-3">
                  Contributing Factors
                </div>
                {HEALTH_FACTORS.map((f) => {
                  const col = factorColor(f.score);
                  return (
                    <div key={f.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium">{f.label}</span>
                        <span className="font-mono text-[12px]" style={{ color: col }}>
                          {f.score}/100
                        </span>
                      </div>
                      <ProgressBar value={f.score} color={col} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Team Vitals ────────────────────────────────────────── */}
        <section aria-labelledby="team-vitals-heading">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 id="team-vitals-heading" className="text-[15px] font-semibold">
              Team Vitals
            </h2>
            {/* Team tab strip */}
            <div className="flex flex-wrap gap-2">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTeamId(t.id)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border"
                  style={
                    activeTeamId === t.id
                      ? { background: `${PRIMARY.replace(")", " / 0.15)")}`, color: PRIMARY, borderColor: `${PRIMARY.replace(")", " / 0.30)")}` }
                      : { background: "oklch(0.18 0.005 260)", color: MUTED, borderColor: "oklch(0.25 0.005 260)" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <VitalCard
              label="Attendance Rate (last 30 days)"
              value={v.attendanceRate}
              target={v.attendanceTarget}
            />
            <VitalCard
              label="Assessment Density (per player/month)"
              value={v.assessmentDensity}
              target={v.assessmentTarget}
              unit="x"
            />
            <VitalCard
              label="IDP On-Track Rate"
              value={v.idpOnTrack}
              target={v.idpTarget}
            />
            <VitalCard
              label="Form Completion Rate"
              value={v.formCompletion}
              target={v.formTarget}
            />
            <VitalCard
              label="Coach Activity"
              value={v.coachActive}
              unit=" active"
              sublabel={`${v.coachActive} of ${v.coachTotal} coaches active this week`}
            />
            <VitalCard
              label="Parent Engagement Rate"
              value={v.parentEngagement}
              target={v.parentTarget}
              note="Opened last report"
            />
            <VitalCard
              label="Film Annotation Rate"
              value={v.filmAnnotation}
              target={v.filmTarget}
              note="Of sessions annotated"
            />
            <VitalCard
              label="Days Since Last Assessment"
              value={v.daysSinceAssessment}
              unit="d"
              sublabel={
                v.daysSinceAssessment < 14
                  ? "Good — within 2 weeks"
                  : v.daysSinceAssessment <= 30
                  ? "Overdue — check schedule"
                  : "Critical — assess immediately"
              }
              higherBetter={false}
              target={14}
            />
          </div>

          {/* Days since assessment color note */}
          <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
            <span><span style={{ color: SUCCESS }}>●</span> {"<"}14d good</span>
            <span><span style={{ color: WARNING }}>●</span> 14–30d caution</span>
            <span><span style={{ color: DANGER }}>●</span> {">"}30d critical</span>
          </div>
        </section>

        {/* ── Section 3: Season Timeline ────────────────────────────────────── */}
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="text-[15px] font-semibold mb-4">
            Season Timeline
          </h2>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
              {[
                { label: "Season Start/End",  color: SUCCESS },
                { label: "Assessment",        color: PRIMARY  },
                { label: "Tournament/Event",  color: WARNING  },
                { label: "Tryouts",           color: "oklch(0.65 0.15 230)" },
                { label: "Today",             color: DANGER   },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            <SeasonTimeline />

            {/* Assessment pacing */}
            <div>
              <div className="text-[13px] font-semibold mb-3">
                Assessment Pacing
                <span className="text-[12px] text-muted-foreground font-normal ml-2">
                  Assessments per month — flag: months with 0
                </span>
              </div>
              <div className="overflow-x-auto">
                <PacingChart months={ASSESSMENT_MONTHS} />
              </div>
              {ASSESSMENT_MONTHS.some((m) => m.count === 0) && (
                <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: DANGER }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  December had no assessments recorded — consider scheduling a make-up cycle.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 4: Warning Signals ────────────────────────────────────── */}
        <section aria-labelledby="warnings-heading">
          <h2 id="warnings-heading" className="text-[15px] font-semibold mb-4">
            Things to Address
          </h2>

          <div className="space-y-3">
            {WARNINGS.map((w) => {
              const sevColor =
                w.severity === "high"
                  ? DANGER
                  : w.severity === "medium"
                  ? WARNING
                  : "oklch(0.65 0.15 230)";

              return (
                <div
                  key={w.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 sm:mt-0"
                    style={{ background: sevColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold leading-snug">{w.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{w.context}</div>
                  </div>
                  <button
                    onClick={() => handleAction(`Action triggered: ${w.action}`)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                  >
                    {w.action}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 5: Churn Risk ─────────────────────────────────────────── */}
        <section aria-labelledby="churn-heading">
          <h2 id="churn-heading" className="text-[15px] font-semibold mb-4">
            Players at Risk of Leaving the Program
          </h2>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      Player
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      Attendance Trend
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      Days Since Interaction
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      IDP Status
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      Risk
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {CHURN_PLAYERS.map((p, i) => {
                    const rc = riskColor(p.riskLevel);
                    const idpColors: Record<ChurnPlayer["idpStatus"], string> = {
                      "on-track": SUCCESS,
                      behind:     WARNING,
                      "at-risk":  DANGER,
                    };
                    return (
                      <tr
                        key={p.id}
                        className={i < CHURN_PLAYERS.length - 1 ? "border-b border-border" : ""}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">{p.ageGroup}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <AttendanceSparkline trend={p.attendanceTrend} />
                          <div className="text-[10px] text-muted-foreground mt-1">Last 6 sessions</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="font-mono font-semibold text-[13px]"
                            style={{ color: p.daysSinceCoachInteraction > 14 ? DANGER : WARNING }}
                          >
                            {p.daysSinceCoachInteraction}d
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              background: `${idpColors[p.idpStatus].replace(")", " / 0.14)")}`,
                              color:       idpColors[p.idpStatus],
                            }}
                          >
                            {p.idpStatus.replace("-", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="flex items-center gap-1 font-semibold text-[12px]"
                            style={{ color: rc }}
                          >
                            {p.riskLevel === "high" && <TrendingDown className="w-3.5 h-3.5" />}
                            {p.riskLevel === "medium" && <Activity className="w-3.5 h-3.5" />}
                            {p.riskLevel === "low" && <TrendingUp className="w-3.5 h-3.5" />}
                            {p.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleAction(`${p.name} flagged for 1-on-1 conversation`)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                          >
                            Flag for 1-on-1
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Section 6: Coach Activity ─────────────────────────────────────── */}
        <section aria-labelledby="coach-activity-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="coach-activity-heading" className="text-[15px] font-semibold">
              Staff Engagement This Season
            </h2>
            {dependencyCoach && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                style={{
                  color:        WARNING,
                  borderColor:  `${WARNING.replace(")", " / 0.35)")}`,
                  background:   `${WARNING.replace(")", " / 0.10)")}`,
                }}
              >
                <AlertTriangle className="w-3 h-3" />
                Single-coach dependency warning
              </span>
            )}
          </div>

          {dependencyCoach && (
            <div
              className="rounded-xl border px-4 py-3 text-[13px] mb-4"
              style={{
                borderColor: `${WARNING.replace(")", " / 0.30)")}`,
                background:  `${WARNING.replace(")", " / 0.07)")}`,
                color:       WARNING,
              }}
            >
              <strong>{dependencyCoach.name}</strong> accounts for {dependencyCoach.activityPct}% of all
              staff activity — over the 70% threshold. Coach absences could significantly impact the program.
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Coach", "Role", "Assessments", "Observations", "Film Annotations", "Education", "Last Active"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {COACH_ACTIVITY.map((c, i) => {
                    const statusCol = coachStatusColor(c);
                    return (
                      <tr
                        key={c.id}
                        className={i < COACH_ACTIVITY.length - 1 ? "border-b border-border" : ""}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: statusCol }}
                            />
                            <span className="font-semibold">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{c.role}</td>
                        <td className="px-4 py-3.5 font-mono">{c.assessments}</td>
                        <td className="px-4 py-3.5 font-mono">{c.observations}</td>
                        <td className="px-4 py-3.5 font-mono">{c.filmAnnotations}</td>
                        <td className="px-4 py-3.5 font-mono">{c.educationModules}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-[12px] font-medium"
                            style={{ color: statusCol }}
                          >
                            {c.lastActive}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-border flex flex-wrap gap-4 text-[11px] text-muted-foreground">
              <span><span style={{ color: SUCCESS }}>●</span> Active (within 7 days)</span>
              <span><span style={{ color: WARNING }}>●</span> Light (7–21 days)</span>
              <span><span style={{ color: MUTED }}>●</span> Inactive (21+ days)</span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
