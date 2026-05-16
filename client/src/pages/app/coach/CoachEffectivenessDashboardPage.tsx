/**
 * CoachEffectivenessDashboardPage — /app/coach/effectiveness
 *
 * The coach's own effectiveness metrics — a mirror showing how their coaching
 * behaviors correlate with player outcomes. Data-driven coaching self-reflection.
 *
 * Sections:
 *   1. Effectiveness score hero (SVG donut gauge, 4-segment ring)
 *   2. Behavioral metrics grid (2×4 cards, 8 coaching behaviors)
 *   3. Outcome correlations (3 cards: behavior → outcome → confidence)
 *   4. Player-level effectiveness table (sortable, toast on row click)
 *   5. Benchmark radar chart (octagon, coach vs. program average)
 *   6. Module recommendations (2 cards for lagging metrics)
 */
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary: "oklch(0.72 0.18 290)",
  success: "oklch(0.75 0.12 140)",
  warning: "oklch(0.78 0.16 75)",
  danger:  "oklch(0.68 0.22 25)",
  muted:   "oklch(0.55 0.02 260)",
  blue:    "oklch(0.65 0.15 230)",
  teal:    "oklch(0.70 0.13 190)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

type Status = "strong" | "developing" | "lagging";
type TrendDir = "up" | "down" | "flat";

interface BehaviorMetric {
  name: string;
  value: string;
  unit: string;
  benchmark: string;
  benchmarkNote: string;
  trend: TrendDir;
  delta: string;
  status: Status;
  insight: string;
  lowerIsBetter?: boolean;
}

const BEHAVIOR_METRICS: BehaviorMetric[] = [
  {
    name: "Assessment Cadence Regularity",
    value: "0.21",
    unit: "CV",
    benchmark: "0.35",
    benchmarkNote: "lower = more regular",
    trend: "up",
    delta: "−0.04",
    status: "strong",
    insight: "Your assessment timing is highly consistent — players know when to expect evaluations.",
    lowerIsBetter: true,
  },
  {
    name: "Feedback Loop Closure Rate",
    value: "73%",
    unit: "",
    benchmark: "58%",
    benchmarkNote: "program avg",
    trend: "up",
    delta: "+6%",
    status: "strong",
    insight: "Most feedback you give leads to a documented follow-up — rare at this level.",
  },
  {
    name: "Film Annotation Rate",
    value: "68%",
    unit: "of sessions",
    benchmark: "55%",
    benchmarkNote: "program avg",
    trend: "up",
    delta: "+4%",
    status: "strong",
    insight: "You're annotating more film than most coaches — players can review your specific cues.",
  },
  {
    name: "Observation Specificity",
    value: "71%",
    unit: "specific",
    benchmark: "60%",
    benchmarkNote: "program avg",
    trend: "flat",
    delta: "+1%",
    status: "strong",
    insight: "Your observations reference exact mechanics or game situations, not just outcomes.",
  },
  {
    name: "IDP Goal Quality",
    value: "3.8",
    unit: "skills/IDP",
    benchmark: "2.9",
    benchmarkNote: "program avg",
    trend: "down",
    delta: "−0.2",
    status: "developing",
    insight: "Strong breadth, but top-quartile coaches hit 5+ skills. Consider deeper goal specificity.",
  },
  {
    name: "Coach Education Engagement",
    value: "4",
    unit: "modules",
    benchmark: "2",
    benchmarkNote: "program avg",
    trend: "up",
    delta: "+1",
    status: "strong",
    insight: "You're doubling the platform average on continuing education — that investment shows.",
  },
  {
    name: "Player Benchmarking Usage",
    value: "18 of 23",
    unit: "players",
    benchmark: "12",
    benchmarkNote: "program avg",
    trend: "up",
    delta: "+3",
    status: "strong",
    insight: "Benchmarking most of your roster means development targets are data-backed, not intuition.",
  },
  {
    name: "Response Time to Player Activity",
    value: "1.4",
    unit: "days avg",
    benchmark: "2.1",
    benchmarkNote: "program avg",
    trend: "up",
    delta: "−0.3 days",
    status: "strong",
    insight: "Faster response builds trust — players feel seen when you react to their activity quickly.",
    lowerIsBetter: true,
  },
];

interface PlayerRow {
  id: string;
  name: string;
  position: string;
  assessments: number;
  avgSkillDelta: number;
  idpOnTrack: boolean;
  coachObs: number;
  filmSessions: number;
  coachability: number;
  vdvContributing: boolean;
}

const PLAYER_ROWS: PlayerRow[] = [
  { id: "p01", name: "Malik Henderson",  position: "PG", assessments: 6, avgSkillDelta: 1.8, idpOnTrack: true,  coachObs: 14, filmSessions: 8,  coachability: 8.7, vdvContributing: true  },
  { id: "p02", name: "Jordan Wells",     position: "SG", assessments: 5, avgSkillDelta: 1.5, idpOnTrack: true,  coachObs: 11, filmSessions: 6,  coachability: 8.2, vdvContributing: true  },
  { id: "p03", name: "Darius Cole",      position: "SF", assessments: 6, avgSkillDelta: 1.3, idpOnTrack: false, coachObs: 9,  filmSessions: 4,  coachability: 7.4, vdvContributing: true  },
  { id: "p04", name: "Theo Barnett",     position: "PF", assessments: 4, avgSkillDelta: 1.1, idpOnTrack: true,  coachObs: 10, filmSessions: 5,  coachability: 7.8, vdvContributing: true  },
  { id: "p05", name: "Marcus Freeman",   position: "C",  assessments: 5, avgSkillDelta: 0.9, idpOnTrack: true,  coachObs: 8,  filmSessions: 3,  coachability: 7.1, vdvContributing: false },
  { id: "p06", name: "Quincy Okafor",    position: "PG", assessments: 4, avgSkillDelta: 0.7, idpOnTrack: false, coachObs: 6,  filmSessions: 2,  coachability: 6.4, vdvContributing: false },
  { id: "p07", name: "Elijah Torres",    position: "SG", assessments: 3, avgSkillDelta: 0.5, idpOnTrack: false, coachObs: 5,  filmSessions: 1,  coachability: 6.1, vdvContributing: false },
  { id: "p08", name: "Camden Rivera",    position: "SF", assessments: 5, avgSkillDelta: 1.6, idpOnTrack: true,  coachObs: 12, filmSessions: 7,  coachability: 8.9, vdvContributing: true  },
];

// Radar axes: 8 coaching behaviors, normalized 0–100
const RADAR_AXES = [
  { label: "Assessment\nCadence",   coach: 88, avg: 65 },
  { label: "Feedback\nClosure",     coach: 73, avg: 58 },
  { label: "Film\nAnnotation",      coach: 68, avg: 55 },
  { label: "Obs\nSpecificity",      coach: 71, avg: 60 },
  { label: "IDP\nQuality",          coach: 62, avg: 58 },
  { label: "Education\nEngagement", coach: 80, avg: 40 },
  { label: "Benchmarking\nUsage",   coach: 78, avg: 52 },
  { label: "Response\nTime",        coach: 83, avg: 60 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Effectiveness Score Hero (SVG donut gauge)
// ─────────────────────────────────────────────────────────────────────────────

interface GaugeSegment {
  label: string;
  score: number;
  max: number;
  color: string;
}

const GAUGE_SEGMENTS: GaugeSegment[] = [
  { label: "Assessment Consistency", score: 22, max: 25, color: C.primary },
  { label: "Feedback Loop Closure",  score: 18, max: 25, color: C.success },
  { label: "Film Engagement",        score: 19, max: 25, color: C.teal },
  { label: "IDP Quality",            score: 17, max: 25, color: C.warning },
];

function EffectivenessGauge() {
  const TOTAL_SCORE = 76;
  const MAX_SCORE   = 100;
  const R           = 80;
  const STROKE      = 14;
  const CX          = 100;
  const CY          = 100;
  const CIRC        = 2 * Math.PI * R;
  const GAP         = 4; // gap between segments in degrees

  // Build segments: each segment spans proportional arc minus gap
  let runningAngle = -90; // start top
  const segmentArcs = GAUGE_SEGMENTS.map((seg) => {
    const totalAngle = (seg.score / MAX_SCORE) * 360;
    const gapAngle   = GAP;
    const drawAngle  = Math.max(0, totalAngle - gapAngle);
    const startAngle = runningAngle;
    runningAngle += totalAngle;
    const startRad  = (startAngle * Math.PI) / 180;
    const endAngle  = startAngle + drawAngle;
    const endRad    = (endAngle  * Math.PI) / 180;
    const x1 = CX + R * Math.cos(startRad);
    const y1 = CY + R * Math.sin(startRad);
    const x2 = CX + R * Math.cos(endRad);
    const y2 = CY + R * Math.sin(endRad);
    const largeArc = drawAngle > 180 ? 1 : 0;
    return { ...seg, x1, y1, x2, y2, largeArc, drawAngle };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
      {/* SVG gauge */}
      <div className="shrink-0">
        <svg width={200} height={200} viewBox="0 0 200 200" aria-label="Coach effectiveness gauge">
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="oklch(0.22 0.01 260)"
            strokeWidth={STROKE}
          />
          {/* Segments */}
          {segmentArcs.map((seg) => {
            if (seg.drawAngle <= 0) return null;
            return (
              <path
                key={seg.label}
                d={`M ${seg.x1} ${seg.y1} A ${R} ${R} 0 ${seg.largeArc} 1 ${seg.x2} ${seg.y2}`}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
            );
          })}
          {/* Center score */}
          <text
            x={CX} y={CY - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={36}
            fontWeight={800}
            fill="oklch(0.92 0.01 260)"
            fontFamily="inherit"
          >
            {TOTAL_SCORE}
          </text>
          <text
            x={CX} y={CY + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fill={C.muted}
            fontFamily="inherit"
          >
            / 100
          </text>
          <text
            x={CX} y={CY + 30}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={C.muted}
            fontFamily="inherit"
          >
            effectiveness
          </text>
        </svg>
      </div>

      {/* Legend + meta */}
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          {GAUGE_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
              <div className="flex-1 text-[13px] text-[var(--text-primary)]">{seg.label}</div>
              <div className="font-mono text-[14px] font-bold" style={{ color: seg.color }}>
                {seg.score}<span className="text-[11px] font-normal text-[var(--text-muted)]">/{seg.max}</span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg px-4 py-3 text-[12px] text-[var(--text-muted)]"
          style={{ background: "oklch(0.18 0.01 260)" }}
        >
          Based on <strong className="text-[var(--text-primary)]">23 assessed players</strong> · 14-week season · Elevation Basketball 16U Premier
        </div>
      </div>
    </div>
  );
}

function EffectivenessHero() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-[var(--text-muted)] mb-1">
          Coach Effectiveness Score
        </div>
        <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Season Overview</h2>
      </div>
      <EffectivenessGauge />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Behavioral Metrics Grid (2×4)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  strong:     { color: C.success, label: "Strong"     },
  developing: { color: C.warning, label: "Developing" },
  lagging:    { color: C.danger,  label: "Lagging"    },
};

function TrendBadge({ trend, delta }: { trend: TrendDir; delta: string }) {
  if (trend === "up")   return (
    <span className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: C.success }}>
      <ChevronUp className="w-3.5 h-3.5" />{delta}
    </span>
  );
  if (trend === "down") return (
    <span className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: C.danger }}>
      <ChevronDown className="w-3.5 h-3.5" />{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: C.muted }}>
      <Minus className="w-3.5 h-3.5" />{delta}
    </span>
  );
}

function BehaviorCard({ metric }: { metric: BehaviorMetric }) {
  const st = STATUS_CONFIG[metric.status];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-semibold text-[var(--text-muted)] leading-tight">
          {metric.name}
        </div>
        <div
          className="shrink-0 w-2.5 h-2.5 rounded-full mt-0.5"
          style={{ background: st.color }}
          title={st.label}
        />
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span className="font-bold text-[26px] leading-none font-mono text-[var(--text-primary)]">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-[12px] text-[var(--text-muted)] mb-0.5">{metric.unit}</span>
        )}
      </div>

      {/* Benchmark + trend */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-[var(--text-muted)]">
          Benchmark: <span className="font-mono font-semibold text-[var(--text-primary)]">{metric.benchmark}</span>
          {metric.benchmarkNote && (
            <span className="text-[10px] ml-1 opacity-70">({metric.benchmarkNote})</span>
          )}
        </div>
        <TrendBadge trend={metric.trend} delta={metric.delta} />
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: `${st.color.replace(")", " / 0.12)")}`,
            color: st.color,
          }}
        >
          {st.label}
        </span>
      </div>

      {/* Insight */}
      <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-2">
        {metric.insight}
      </p>
    </div>
  );
}

function BehavioralMetricsGrid() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Coaching Behavior Metrics</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          How your coaching actions compare to the platform benchmark for coaches at this level.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {BEHAVIOR_METRICS.map((m) => (
          <BehaviorCard key={m.name} metric={m} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Outcome Correlations
// ─────────────────────────────────────────────────────────────────────────────

type ConfidenceLevel = "high" | "moderate" | "emerging";

interface CorrelationCard {
  behavior: string;
  outcome: string;
  confidence: ConfidenceLevel;
}

const CORRELATIONS: CorrelationCard[] = [
  {
    behavior: "Your consistent weekly assessment cadence",
    outcome: "Correlates with 0.8 higher skill delta per player vs. coaches who assess monthly.",
    confidence: "high",
  },
  {
    behavior: "Players whose IDP goals you reviewed 3+ times",
    outcome: "Improved defense 1.4× faster than players with single-review IDPs.",
    confidence: "high",
  },
  {
    behavior: "Players whose film sessions you annotated within 48 hours",
    outcome: "Showed 22% higher coachability index than players who received late or no annotations.",
    confidence: "moderate",
  },
];

const CONF_STYLES: Record<ConfidenceLevel, { label: string; color: string }> = {
  high:     { label: "High confidence",     color: C.success },
  moderate: { label: "Moderate confidence", color: C.warning },
  emerging: { label: "Emerging signal",     color: C.muted   },
};

function OutcomeCorrelations() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">What Your Behaviors Predict</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Correlations specific to your program — what your coaching actions are associated with in your players' data.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {CORRELATIONS.map((c, i) => {
          const cs = CONF_STYLES[c.confidence];
          return (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col gap-4"
            >
              {/* Behavior */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-[var(--text-muted)] mb-1.5">
                  Your behavior
                </div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">
                  {c.behavior}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <ArrowRight className="w-4 h-4 mx-2 text-[var(--text-muted)]" />
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Outcome */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-[var(--text-muted)] mb-1.5">
                  Player outcome
                </div>
                <p className="text-[13px] text-[var(--text-primary)] leading-snug">{c.outcome}</p>
              </div>

              {/* Confidence badge */}
              <div className="mt-auto pt-2 border-t border-[var(--border)]">
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${cs.color.replace(")", " / 0.12)")}`,
                    color: cs.color,
                  }}
                >
                  {cs.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Player-Level Effectiveness Table
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<PlayerRow, "avgSkillDelta" | "coachability" | "assessments">;

function PlayerTable() {
  const [sortKey, setSortKey]   = useState<SortKey>("avgSkillDelta");
  const [sortAsc, setSortAsc]   = useState(false);

  const sorted = useMemo(() => {
    return [...PLAYER_ROWS].sort((a, b) =>
      sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey],
    );
  }, [sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = col === sortKey;
    return (
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
      >
        {label}
        {active ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Player Outcomes This Season</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Click a row to open the full player development report.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_60px_80px_90px_90px_80px_80px_90px_80px] gap-2 px-4 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">Player</span>
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">Pos</span>
          <SortBtn col="assessments" label="Assessments" />
          <SortBtn col="avgSkillDelta" label="Avg Δ Skill" />
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">IDP Track</span>
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">Coach Obs</span>
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">Film</span>
          <SortBtn col="coachability" label="Coachability" />
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)]">VDV</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => toast.info(`Full player development report at /app/coach/players/${p.id}`)}
              className="w-full grid grid-cols-[2fr_60px_80px_90px_90px_80px_80px_90px_80px] gap-2 px-4 py-3 text-left hover:bg-[var(--bg-base)] transition-colors"
            >
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{p.name}</span>
              <span className="text-[12px] font-mono font-bold text-[var(--text-muted)] self-center">{p.position}</span>
              <span className="text-[13px] font-mono self-center text-[var(--text-primary)]">{p.assessments}</span>
              <span
                className="text-[14px] font-bold font-mono self-center"
                style={{ color: p.avgSkillDelta >= 1.2 ? C.success : p.avgSkillDelta >= 0.7 ? C.warning : C.danger }}
              >
                +{p.avgSkillDelta.toFixed(1)}
              </span>
              <span className="self-center">
                {p.idpOnTrack ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.success.replace(")", " / 0.12)")}`, color: C.success }}>On Track</span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.warning.replace(")", " / 0.12)")}`, color: C.warning }}>Behind</span>
                )}
              </span>
              <span className="text-[13px] font-mono self-center text-[var(--text-primary)]">{p.coachObs}</span>
              <span className="text-[13px] font-mono self-center text-[var(--text-primary)]">{p.filmSessions}</span>
              <span
                className="text-[13px] font-bold font-mono self-center"
                style={{ color: p.coachability >= 8 ? C.success : p.coachability >= 7 ? C.warning : C.danger }}
              >
                {p.coachability.toFixed(1)}
              </span>
              <span className="self-center">
                {p.vdvContributing ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: C.success }} />
                ) : (
                  <Minus className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Benchmark Radar Chart (octagon)
// ─────────────────────────────────────────────────────────────────────────────

function polarToXY(angleDeg: number, r: number, cx: number, cy: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function RadarChart() {
  const N    = RADAR_AXES.length;
  const CX   = 200;
  const CY   = 200;
  const MAX_R = 150;
  const RINGS = 4;

  // Build polygon points
  function buildPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const angle = (360 / N) * i;
        const r     = (v / 100) * MAX_R;
        const [x, y] = polarToXY(angle, r, CX, CY);
        return `${x},${y}`;
      })
      .join(" ");
  }

  const coachPts = buildPoints(RADAR_AXES.map((a) => a.coach));
  const avgPts   = buildPoints(RADAR_AXES.map((a) => a.avg));

  // Grid rings
  const ringLines: Array<{ points: string; opacity: number }> = Array.from({ length: RINGS }, (_, ri) => {
    const r = ((ri + 1) / RINGS) * MAX_R;
    const pts = Array.from({ length: N }, (__, i) => {
      const angle = (360 / N) * i;
      const [x, y] = polarToXY(angle, r, CX, CY);
      return `${x},${y}`;
    }).join(" ");
    return { points: pts, opacity: 0.12 + ri * 0.04 };
  });

  // Axis lines and labels
  const axes = RADAR_AXES.map((a, i) => {
    const angle = (360 / N) * i;
    const [x2, y2] = polarToXY(angle, MAX_R, CX, CY);
    const labelR   = MAX_R + 28;
    const [lx, ly] = polarToXY(angle, labelR, CX, CY);
    return { ...a, x2, y2, lx, ly, angle };
  });

  const outperform = ["Assessment Cadence", "Film Annotation", "Response Time"];
  const grow       = ["IDP Quality", "Obs Specificity"];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Benchmark Comparison</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Your coaching behaviors vs. the program average for coaches at similar level.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* SVG radar */}
          <div className="shrink-0 w-full max-w-[420px]">
            <svg viewBox="0 0 400 400" width="100%" aria-label="Coaching behavior radar chart">
              {/* Grid rings */}
              {ringLines.map((ring, ri) => (
                <polygon
                  key={ri}
                  points={ring.points}
                  fill="none"
                  stroke="oklch(0.55 0.02 260)"
                  strokeWidth={0.8}
                  opacity={ring.opacity}
                />
              ))}

              {/* Axis spokes */}
              {axes.map((ax) => (
                <line
                  key={ax.label}
                  x1={CX} y1={CY}
                  x2={ax.x2} y2={ax.y2}
                  stroke="oklch(0.45 0.01 260)"
                  strokeWidth={0.8}
                  opacity={0.4}
                />
              ))}

              {/* Program average — dashed fill */}
              <polygon
                points={avgPts}
                fill={`${C.muted.replace(")", " / 0.10)")}`}
                stroke={C.muted}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />

              {/* Coach polygon — solid fill */}
              <polygon
                points={coachPts}
                fill={`${C.primary.replace(")", " / 0.18)")}`}
                stroke={C.primary}
                strokeWidth={2}
              />

              {/* Coach dot markers */}
              {RADAR_AXES.map((ax, i) => {
                const angle = (360 / N) * i;
                const r     = (ax.coach / 100) * MAX_R;
                const [x, y] = polarToXY(angle, r, CX, CY);
                return (
                  <circle
                    key={ax.label}
                    cx={x} cy={y} r={3.5}
                    fill={C.primary}
                    stroke="oklch(0.10 0.005 260)"
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Axis labels */}
              {axes.map((ax) => {
                const lines = ax.label.split("\n");
                return (
                  <text
                    key={ax.label}
                    x={ax.lx}
                    y={ax.ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9.5}
                    fill="oklch(0.65 0.02 260)"
                    fontFamily="inherit"
                  >
                    {lines.map((line, li) => (
                      <tspan key={li} x={ax.lx} dy={li === 0 ? (lines.length > 1 ? "-0.6em" : "0") : "1.2em"}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                );
              })}

              {/* Legend */}
              <g transform="translate(10, 380)">
                <circle cx={8} cy={5} r={5} fill={`${C.primary.replace(")", " / 0.18)")}`} stroke={C.primary} strokeWidth={1.5} />
                <text x={18} y={5} dominantBaseline="middle" fontSize={9} fill="oklch(0.60 0.02 260)" fontFamily="inherit">You</text>
                <rect x={52} y={1} width={12} height={8} fill={`${C.muted.replace(")", " / 0.10)")}`} stroke={C.muted} strokeWidth={1} strokeDasharray="3 2" rx={1} />
                <text x={68} y={5} dominantBaseline="middle" fontSize={9} fill="oklch(0.60 0.02 260)" fontFamily="inherit">Program avg</text>
              </g>
            </svg>
          </div>

          {/* Outperform / grow lists */}
          <div className="flex-1 space-y-5">
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: `${C.success.replace(")", " / 0.30)")}`, background: `${C.success.replace(")", " / 0.05)")}` }}
            >
              <div className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.success }}>
                You outperform in
              </div>
              {outperform.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.success }} />
                  {item}
                </div>
              ))}
            </div>

            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: `${C.warning.replace(")", " / 0.30)")}`, background: `${C.warning.replace(")", " / 0.05)")}` }}
            >
              <div className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.warning }}>
                Areas to grow
              </div>
              {grow.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: C.warning }} />
                  {item}
                </div>
              ))}
            </div>

            <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Percentile values are normalized against coaches at 14U–17U premier level with 20+ assessed players this season.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Module Recommendations
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleRec {
  id: string;
  title: string;
  why: string;
  duration: string;
  accentColor: string;
  href: string;
}

const MODULE_RECS: ModuleRec[] = [
  {
    id: "idp_advanced",
    title: "Advanced IDP Goal Design",
    why: "Your IDP goal specificity is 2.1 skills/player below the top-quartile benchmark. Top coaches target measurable sub-skills, not broad categories.",
    duration: "42 min",
    accentColor: C.warning,
    href: "/app/learn/courses/idp_advanced",
  },
  {
    id: "obs_specificity",
    title: "Coaching Observation Frameworks",
    why: "Observation specificity plateaued at +1% this month. This module covers structured frameworks that increase actionable observation rate.",
    duration: "28 min",
    accentColor: C.primary,
    href: "/app/learn/courses/obs_specificity",
  },
];

function ModuleRecommendations() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Recommended for You</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Based on your developing metrics — the highest-leverage modules for your current gaps.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {MODULE_RECS.map((mod) => (
          <div
            key={mod.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden flex"
          >
            {/* Color thumb */}
            <div
              className="w-14 shrink-0 flex items-center justify-center"
              style={{ background: `${mod.accentColor.replace(")", " / 0.15)")}` }}
            >
              <BookOpen className="w-6 h-6" style={{ color: mod.accentColor }} />
            </div>
            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-2">
              <div className="font-semibold text-[14px] text-[var(--text-primary)] leading-snug">{mod.title}</div>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{mod.why}</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[11px] text-[var(--text-muted)]">{mod.duration}</span>
                <a
                  href={mod.href}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: mod.accentColor }}
                >
                  Start module <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CoachEffectivenessDashboardPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto space-y-10">
        <PageHeader
          eyebrow="Coach Intelligence"
          title="Your Effectiveness Dashboard"
          subtitle="How your coaching behaviors connect to player outcomes — data from your program this season"
          actions={
            <div className="flex items-center gap-2">
              <a
                href="/app/coach/impact-report"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-[var(--border)] font-semibold text-[12.5px] hover:bg-[var(--bg-base)] transition"
              >
                <TrendingUp className="w-4 h-4" /> Impact Report
              </a>
            </div>
          }
        />

        {/* 1 — Hero gauge */}
        <EffectivenessHero />

        {/* 2 — Behavior metrics */}
        <BehavioralMetricsGrid />

        {/* 3 — Outcome correlations */}
        <OutcomeCorrelations />

        {/* 4 — Player table */}
        <PlayerTable />

        {/* 5 — Radar benchmark */}
        <RadarChart />

        {/* 6 — Module recommendations */}
        <ModuleRecommendations />
      </div>
    </AppShell>
  );
}
