/**
 * PlayerDevelopmentOutcomesPage — /app/coach/development-outcomes
 *
 * Longitudinal player development outcomes view. Skill trajectory slopes,
 * IDP alignment, position benchmarks, and what's actually working.
 *
 * Sections:
 *   1. Program VDV contribution hero (percentile bar SVG)
 *   2. Skill trajectory analysis (sparklines + slope table)
 *   3. IDP alignment analysis (gauge SVG + alignment table)
 *   4. Position competency benchmarks (compact position cards)
 *   5. Assessment calibration check (cross-program portability)
 *   6. Longitudinal player trajectory (player selector + multi-line SVG)
 */
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";

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
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

type SkillKey =
  | "ball_handling"
  | "shooting"
  | "finishing"
  | "defense"
  | "footwork"
  | "iq_reads"
  | "athleticism"
  | "conditioning";

const SKILL_LABELS: Record<SkillKey, string> = {
  ball_handling: "Ball Handling",
  shooting:      "Shooting",
  finishing:     "Finishing",
  defense:       "Defense",
  footwork:      "Footwork",
  iq_reads:      "IQ / Reads",
  athleticism:   "Athleticism",
  conditioning:  "Conditioning",
};

const SKILL_COLORS: Record<SkillKey, string> = {
  ball_handling: C.primary,
  shooting:      C.success,
  finishing:     C.warning,
  defense:       "oklch(0.65 0.15 230)",
  footwork:      "oklch(0.70 0.13 190)",
  iq_reads:      "oklch(0.68 0.18 310)",
  athleticism:   "oklch(0.72 0.14 50)",
  conditioning:  "oklch(0.65 0.12 160)",
};

interface SkillTrajectory {
  skill: SkillKey;
  slope: number;          // per assessment cycle, can be negative
  direction: "up" | "flat" | "down";
  playersImproving: number;
  avgDelta: number;
  // Sparkline data: 7 assessment-cycle averages 0–10 scale
  points: number[];
}

const SKILL_TRAJECTORIES: SkillTrajectory[] = [
  { skill: "ball_handling", slope: 0.08, direction: "flat",  playersImproving: 11, avgDelta: 0.3, points: [5.1, 5.2, 5.0, 5.3, 5.2, 5.4, 5.4] },
  { skill: "shooting",      slope: 0.22, direction: "up",    playersImproving: 15, avgDelta: 0.9, points: [4.8, 5.0, 5.3, 5.5, 5.7, 6.0, 6.2] },
  { skill: "finishing",     slope: 0.18, direction: "up",    playersImproving: 14, avgDelta: 0.7, points: [5.0, 5.1, 5.3, 5.4, 5.6, 5.7, 5.9] },
  { skill: "defense",       slope: 0.34, direction: "up",    playersImproving: 19, avgDelta: 1.8, points: [4.2, 4.6, 5.0, 5.4, 5.7, 6.0, 6.3] },
  { skill: "footwork",      slope: 0.15, direction: "up",    playersImproving: 13, avgDelta: 0.6, points: [4.9, 5.0, 5.2, 5.3, 5.5, 5.6, 5.8] },
  { skill: "iq_reads",      slope: 0.20, direction: "up",    playersImproving: 16, avgDelta: 0.8, points: [5.3, 5.4, 5.5, 5.7, 5.9, 6.0, 6.2] },
  { skill: "athleticism",   slope: 0.06, direction: "flat",  playersImproving: 10, avgDelta: 0.2, points: [6.0, 6.1, 6.0, 6.1, 6.2, 6.1, 6.2] },
  { skill: "conditioning",  slope: 0.12, direction: "up",    playersImproving: 12, avgDelta: 0.5, points: [5.5, 5.6, 5.6, 5.7, 5.8, 5.9, 6.0] },
];

interface AlignmentRow {
  player: string;
  idpFocus: SkillKey;
  mostImproved: SkillKey;
  aligned: "yes" | "close" | "no";
  note: string;
}

const ALIGNMENT_ROWS: AlignmentRow[] = [
  { player: "Malik Henderson",  idpFocus: "ball_handling", mostImproved: "defense",       aligned: "no",    note: "Strong defensive growth outside IDP scope — update IDP" },
  { player: "Jordan Wells",     idpFocus: "shooting",      mostImproved: "shooting",      aligned: "yes",   note: "IDP and skill gain perfectly matched" },
  { player: "Darius Cole",      idpFocus: "finishing",     mostImproved: "footwork",      aligned: "close", note: "Footwork improvement likely enabling finishing" },
  { player: "Theo Barnett",     idpFocus: "defense",       mostImproved: "defense",       aligned: "yes",   note: "IDP and skill gain perfectly matched" },
  { player: "Marcus Freeman",   idpFocus: "conditioning",  mostImproved: "conditioning",  aligned: "yes",   note: "IDP and skill gain perfectly matched" },
  { player: "Quincy Okafor",    idpFocus: "iq_reads",      mostImproved: "athleticism",   aligned: "no",    note: "Gains in athleticism — IDP focus not yet translating" },
  { player: "Elijah Torres",    idpFocus: "shooting",      mostImproved: "shooting",      aligned: "yes",   note: "IDP and skill gain matched" },
  { player: "Camden Rivera",    idpFocus: "finishing",     mostImproved: "finishing",     aligned: "yes",   note: "IDP and skill gain perfectly matched" },
];

type Position = "PG" | "SG" | "SF" | "PF" | "C";

interface PositionBenchmark {
  position: Position;
  count: number;
  onSequence: number;
  offSequence: number;
  primarySkill: SkillKey;
  primaryMin: number;
  secondarySkill: SkillKey;
  secondaryThreshold: string;
  focus: string;
}

const POSITION_BENCHMARKS: PositionBenchmark[] = [
  {
    position: "PG", count: 4, onSequence: 3, offSequence: 1,
    primarySkill: "iq_reads", primaryMin: 7.0,
    secondarySkill: "athleticism", secondaryThreshold: "before Athleticism hits 8.0",
    focus: "IQ/Reads must lead. One player is over-indexed on athleticism — redirect.",
  },
  {
    position: "SG", count: 3, onSequence: 2, offSequence: 1,
    primarySkill: "shooting", primaryMin: 6.5,
    secondarySkill: "ball_handling", secondaryThreshold: "before focusing on off-ball",
    focus: "Shooting should lead. Push catch-and-shoot fundamentals before off-ball reads.",
  },
  {
    position: "SF", count: 4, onSequence: 4, offSequence: 0,
    primarySkill: "finishing", primaryMin: 6.0,
    secondarySkill: "defense", secondaryThreshold: "alongside Finishing",
    focus: "All SFs on sequence — reinforce finishing inside the paint before range development.",
  },
  {
    position: "PF", count: 5, onSequence: 4, offSequence: 1,
    primarySkill: "footwork", primaryMin: 6.5,
    secondarySkill: "conditioning", secondaryThreshold: "before extended court time",
    focus: "Footwork is the PF foundation. One player is conditioning-focused before footwork is ready.",
  },
  {
    position: "C",  count: 7, onSequence: 6, offSequence: 1,
    primarySkill: "conditioning", primaryMin: 7.0,
    secondarySkill: "finishing", secondaryThreshold: "before Finishing development",
    focus: "Most centers on sequence. Conditioning base must be established before post-skill work.",
  },
];

interface TransferPlayer {
  name: string;
  priorProgram: string;
  correlation: number;
  status: "calibrated" | "needs-review" | "divergent";
}

const TRANSFER_PLAYERS: TransferPlayer[] = [
  { name: "Darius Cole",   priorProgram: "Tri-State Elite",   correlation: 0.82, status: "calibrated"   },
  { name: "Theo Barnett",  priorProgram: "City Hoops 16U",    correlation: 0.74, status: "calibrated"   },
  { name: "Quincy Okafor", priorProgram: "Midwest Ballers",   correlation: 0.51, status: "needs-review" },
];

interface PlayerTimeline {
  id: string;
  name: string;
  position: Position;
  skillData: Record<SkillKey, number[]>; // 6 assessment cycles
  annotations: Array<{ cycle: number; label: string }>;
}

const TIMELINE_PLAYERS: PlayerTimeline[] = [
  {
    id: "p01",
    name: "Malik Henderson",
    position: "PG",
    skillData: {
      ball_handling: [5.0, 5.1, 5.3, 5.2, 5.5, 5.7],
      shooting:      [4.5, 4.7, 4.8, 5.0, 5.2, 5.4],
      finishing:     [4.8, 5.0, 5.2, 5.3, 5.5, 5.8],
      defense:       [4.2, 4.8, 5.4, 5.8, 6.2, 6.5],
      footwork:      [5.0, 5.1, 5.2, 5.4, 5.5, 5.7],
      iq_reads:      [5.5, 5.6, 5.8, 6.0, 6.1, 6.3],
      athleticism:   [6.0, 6.1, 6.0, 6.2, 6.2, 6.3],
      conditioning:  [5.5, 5.6, 5.7, 5.8, 5.9, 6.0],
    },
    annotations: [
      { cycle: 1, label: "IDP updated" },
      { cycle: 3, label: "Tournament" },
      { cycle: 5, label: "Defense focus" },
    ],
  },
  {
    id: "p02",
    name: "Jordan Wells",
    position: "SG",
    skillData: {
      ball_handling: [5.2, 5.3, 5.3, 5.4, 5.4, 5.5],
      shooting:      [5.8, 6.1, 6.4, 6.7, 7.0, 7.3],
      finishing:     [5.0, 5.2, 5.3, 5.5, 5.6, 5.8],
      defense:       [5.0, 5.1, 5.2, 5.3, 5.4, 5.5],
      footwork:      [5.1, 5.2, 5.3, 5.4, 5.5, 5.6],
      iq_reads:      [5.4, 5.5, 5.6, 5.7, 5.8, 6.0],
      athleticism:   [5.8, 5.9, 6.0, 6.0, 6.1, 6.2],
      conditioning:  [5.6, 5.7, 5.7, 5.8, 5.9, 6.0],
    },
    annotations: [
      { cycle: 2, label: "Shooting camp" },
      { cycle: 4, label: "IDP updated" },
    ],
  },
  {
    id: "p08",
    name: "Camden Rivera",
    position: "SF",
    skillData: {
      ball_handling: [5.0, 5.1, 5.2, 5.3, 5.4, 5.5],
      shooting:      [5.3, 5.4, 5.5, 5.6, 5.8, 6.0],
      finishing:     [5.5, 5.8, 6.1, 6.4, 6.7, 7.0],
      defense:       [5.2, 5.4, 5.5, 5.7, 5.8, 6.0],
      footwork:      [5.4, 5.6, 5.8, 6.0, 6.2, 6.4],
      iq_reads:      [5.5, 5.6, 5.7, 5.8, 5.9, 6.1],
      athleticism:   [6.1, 6.2, 6.2, 6.3, 6.4, 6.5],
      conditioning:  [5.8, 5.9, 6.0, 6.1, 6.2, 6.3],
    },
    annotations: [
      { cycle: 0, label: "IDP started" },
      { cycle: 3, label: "Injury" },
      { cycle: 4, label: "Return" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Program VDV Hero
// ─────────────────────────────────────────────────────────────────────────────

function VDVPercentileBar() {
  // Platform distribution: approximate percentile positions
  const PROGRAM_PCT = 65; // this program is in 65th percentile
  const PLATFORM_AVG = 49;

  return (
    <div className="relative mt-4">
      {/* Background gradient bar */}
      <div className="h-6 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.01 260)" }}>
        {/* Distribution "fill" gradient */}
        <div
          className="h-full rounded-full"
          style={{
            width: "100%",
            background: `linear-gradient(to right, ${C.danger.replace(")", " / 0.4)")}, ${C.warning.replace(")", " / 0.4)")}, ${C.success.replace(")", " / 0.4)")})`,
          }}
        />
      </div>

      {/* Platform average marker */}
      <div
        className="absolute top-0 h-6 flex flex-col items-center"
        style={{ left: `${PLATFORM_AVG}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-0.5 h-6 bg-[var(--text-muted)] opacity-60" />
      </div>
      <div
        className="absolute -top-5 text-[9px] text-[var(--text-muted)] whitespace-nowrap"
        style={{ left: `${PLATFORM_AVG}%`, transform: "translateX(-50%)" }}
      >
        Platform avg
      </div>

      {/* This program marker */}
      <div
        className="absolute top-0 h-6 flex flex-col items-center"
        style={{ left: `${PROGRAM_PCT}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-1 h-6 rounded-full" style={{ background: C.primary }} />
      </div>
      <div
        className="absolute -top-5 text-[10px] font-bold whitespace-nowrap"
        style={{ left: `${PROGRAM_PCT}%`, transform: "translateX(-50%)", color: C.primary }}
      >
        Your program
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5 text-[9px] text-[var(--text-muted)]">
        <span>0th</span>
        <span>25th</span>
        <span>50th</span>
        <span>75th</span>
        <span>100th</span>
      </div>
    </div>
  );
}

function ProgramVDVHero() {
  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: `${C.primary.replace(")", " / 0.30)")}`,
        background: `${C.primary.replace(")", " / 0.05)")}`,
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-[var(--text-muted)] mb-3">
        Verified Development Velocity — Season Contribution
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <div className="flex items-end gap-2">
            <span className="font-bold text-[56px] leading-none font-mono" style={{ color: C.primary }}>64%</span>
            <span className="text-[14px] text-[var(--text-muted)] mb-2">of your players are verifiably improving</span>
          </div>
          <div className="text-[13px] text-[var(--text-muted)] mt-1">
            Platform average: <strong className="text-[var(--text-primary)]">61%</strong>
            {" · "}
            <span style={{ color: C.success }}>Your program is in the top 35% of programs on Verified Development Velocity</span>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-6 uppercase tracking-[0.1em]">
          Platform distribution — VDV percentile
        </div>
        <VDVPercentileBar />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Skill Trajectory Sparklines
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const W  = 80;
  const H  = 40;
  const minV = Math.min(...points);
  const maxV = Math.max(...points);
  const range = Math.max(maxV - minV, 0.5);

  const pathD = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - ((v - minV) / range) * (H - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {(() => {
        const last  = points[points.length - 1];
        const x     = W;
        const y     = H - ((last - minV) / range) * (H - 4) - 2;
        return <circle cx={x} cy={y} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

function slopeColor(slope: number, dir: SkillTrajectory["direction"]): string {
  if (dir === "down")        return C.danger;
  if (dir === "flat")        return C.muted;
  if (slope >= 0.25)         return C.success;
  return C.primary;
}

function SkillTrajectoryTable() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Skill Trajectory Slopes — 14-Week Season</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Per-assessment-cycle slope across all rostered players. Positive = program-wide growth.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[180px_96px_80px_80px_120px_90px] gap-3 px-5 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
          {["Skill", "Sparkline", "Slope", "Dir", "Players ↑", "Avg Δ"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-[var(--border)]">
          {SKILL_TRAJECTORIES.map((st) => {
            const col = slopeColor(st.slope, st.direction);
            const DirIcon = st.direction === "up" ? TrendingUp : st.direction === "down" ? TrendingDown : Minus;
            return (
              <div key={st.skill} className="grid grid-cols-[180px_96px_80px_80px_120px_90px] gap-3 px-5 py-3 items-center">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{SKILL_LABELS[st.skill]}</span>
                <Sparkline points={st.points} color={col} />
                <span className="font-mono font-bold text-[14px]" style={{ color: col }}>
                  {st.slope > 0 ? "+" : ""}{st.slope.toFixed(2)}
                </span>
                <DirIcon className="w-4 h-4" style={{ color: col }} />
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 rounded-full bg-[var(--bg-base)] flex-1 max-w-[60px]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(st.playersImproving / 23) * 100}%`, background: col }}
                    />
                  </div>
                  <span className="text-[12px] font-mono text-[var(--text-muted)]">{st.playersImproving}/23</span>
                </div>
                <span className="font-mono font-bold text-[13px]" style={{ color: col }}>
                  {st.avgDelta > 0 ? "+" : ""}{st.avgDelta.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Callout */}
      <div
        className="mt-4 rounded-xl border p-4 flex items-start gap-3"
        style={{ borderColor: `${C.blue.replace(")", " / 0.30)")}`, background: `${C.blue.replace(")", " / 0.05)")}` }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.blue }} />
        <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">
          <strong>Defense is your program's signature strength</strong> — 81% of players improved, average delta +1.8.{" "}
          Ball handling has been flat for 3 cycles — consider a dedicated drill block in the next practice block.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — IDP Alignment Analysis
// ─────────────────────────────────────────────────────────────────────────────

function AlignmentGauge({ pct }: { pct: number }) {
  const R     = 50;
  const STROKE = 10;
  const CIRC  = 2 * Math.PI * R;
  const dash  = (pct / 100) * CIRC;
  const color = pct >= 70 ? C.success : pct >= 55 ? C.warning : C.danger;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={120} height={120} viewBox="0 0 120 120" aria-label="IDP alignment gauge">
        <circle cx={60} cy={60} r={R} fill="none" stroke="oklch(0.22 0.01 260)" strokeWidth={STROKE} />
        <circle
          cx={60} cy={60} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x={60} y={55} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight={800} fill="oklch(0.92 0.01 260)" fontFamily="inherit">
          {pct}%
        </text>
        <text x={60} y={73} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={C.muted} fontFamily="inherit">
          aligned
        </text>
      </svg>
      <div className="text-[11px] text-[var(--text-muted)]">Target: 70%+</div>
    </div>
  );
}

const ALIGNMENT_COLORS: Record<AlignmentRow["aligned"], string> = {
  yes:   C.success,
  close: C.warning,
  no:    C.danger,
};

const ALIGNMENT_LABELS: Record<AlignmentRow["aligned"], string> = {
  yes:   "Aligned",
  close: "Close",
  no:    "Misaligned",
};

function IDPAlignmentSection() {
  const alignedCount = ALIGNMENT_ROWS.filter((r) => r.aligned === "yes").length;
  const pct          = Math.round((alignedCount / ALIGNMENT_ROWS.length) * 100);
  const misaligned   = ALIGNMENT_ROWS.filter((r) => r.aligned === "no").length;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Are Players Developing Where We're Focusing?</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Comparison of each player's IDP focus area vs. where they actually improved most this season.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Gauge + summary */}
        <div className="shrink-0 flex flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <AlignmentGauge pct={pct} />
          <div className="text-center max-w-[180px]">
            <div className="text-[14px] font-bold text-[var(--text-primary)]">{pct}% IDP Alignment</div>
            <div className="text-[12px] text-[var(--text-muted)] mt-1">
              {alignedCount} of {ALIGNMENT_ROWS.length} players gaining in their focus area
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-3 px-4 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
            {["Player", "IDP Focus", "Most Improved", "Aligned?"].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ALIGNMENT_ROWS.map((row) => {
              const col = ALIGNMENT_COLORS[row.aligned];
              return (
                <div key={row.player} className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-3 px-4 py-3 items-center">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{row.player}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">{SKILL_LABELS[row.idpFocus]}</span>
                  <span className="text-[12px] text-[var(--text-primary)]">{SKILL_LABELS[row.mostImproved]}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
                    style={{ background: `${col.replace(")", " / 0.12)")}`, color: col }}
                  >
                    {ALIGNMENT_LABELS[row.aligned]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insight box */}
      {misaligned > 0 && (
        <div
          className="mt-4 rounded-xl border p-4 flex items-start gap-3"
          style={{ borderColor: `${C.warning.replace(")", " / 0.30)")}`, background: `${C.warning.replace(")", " / 0.05)")}` }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.warning }} />
          <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">
            <strong>{misaligned} players</strong> have strong gains in skills outside their IDP focus.
            This could mean the IDP needs updating or they're developing opportunistically — worth a 1-on-1 to understand why.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Position Competency Benchmarks
// ─────────────────────────────────────────────────────────────────────────────

function PositionCard({ bench }: { bench: PositionBenchmark }) {
  const seqPct = Math.round((bench.onSequence / bench.count) * 100);
  const col    = seqPct >= 80 ? C.success : seqPct >= 60 ? C.warning : C.danger;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col gap-3">
      {/* Position badge + count */}
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px]"
          style={{ background: `${C.primary.replace(")", " / 0.12)")}`, color: C.primary }}
        >
          {bench.position}
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[var(--text-muted)]">{bench.count} players</div>
          <div className="text-[12px] font-semibold" style={{ color: col }}>{seqPct}% on sequence</div>
        </div>
      </div>

      {/* Sequence bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>On sequence: {bench.onSequence}</span>
          <span>Off: {bench.offSequence}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-base)]">
          <div className="h-full rounded-full" style={{ width: `${seqPct}%`, background: col }} />
        </div>
      </div>

      {/* Primary skill */}
      <div className="text-[11px] text-[var(--text-muted)]">
        Primary: <span className="font-semibold text-[var(--text-primary)]">{SKILL_LABELS[bench.primarySkill]}</span>
        {" "}should reach {bench.primaryMin} {bench.secondaryThreshold}
      </div>

      {/* Focus */}
      <div
        className="rounded-lg px-3 py-2 text-[11.5px] leading-snug text-[var(--text-primary)]"
        style={{ background: "oklch(0.18 0.01 260)" }}
      >
        {bench.focus}
      </div>
    </div>
  );
}

function PositionBenchmarks() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Position Benchmarks — How Your Players Stack Up</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Expected competency sequence per position. Are your players developing primary skills before secondary ones?
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {POSITION_BENCHMARKS.map((b) => (
          <PositionCard key={b.position} bench={b} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Assessment Calibration Check
// ─────────────────────────────────────────────────────────────────────────────

const CALIB_STATUS: Record<TransferPlayer["status"], { color: string; label: string }> = {
  "calibrated":   { color: C.success, label: "Well-calibrated" },
  "needs-review": { color: C.warning, label: "Needs review"    },
  "divergent":    { color: C.danger,  label: "Divergent"       },
};

function CalibrationSection() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Assessment Calibration Check</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          For players who joined from another program — correlation between prior assessments and your initial evaluation.
          High correlation (r &gt; 0.7) signals well-calibrated assessments across programs.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.5fr_100px_140px] gap-3 px-5 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
          {["Player", "Prior Program", "Correlation (r)", "Status"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[var(--border)]">
          {TRANSFER_PLAYERS.map((p) => {
            const cs = CALIB_STATUS[p.status];
            return (
              <div key={p.name} className="grid grid-cols-[1.5fr_1.5fr_100px_140px] gap-3 px-5 py-3 items-center">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="text-[12px] text-[var(--text-muted)]">{p.priorProgram}</span>
                <span className="font-mono font-bold text-[14px]" style={{ color: cs.color }}>
                  {p.correlation.toFixed(2)}
                </span>
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit"
                  style={{ background: `${cs.color.replace(")", " / 0.12)")}`, color: cs.color }}
                >
                  {cs.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mt-4 rounded-xl border p-4 flex items-start gap-3"
        style={{ borderColor: `${C.primary.replace(")", " / 0.25)")}`, background: `${C.primary.replace(")", " / 0.04)")}` }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.primary }} />
        <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
          When assessments are calibrated across programs, it signals the platform's data is trustworthy — a key factor in recruiter credibility.
          Review Quincy Okafor's prior assessment with the sending program to understand the scoring difference.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Longitudinal Player Trajectory (multi-line SVG)
// ─────────────────────────────────────────────────────────────────────────────

const VISIBLE_SKILLS: SkillKey[] = ["ball_handling", "shooting", "finishing", "defense", "footwork", "iq_reads", "athleticism", "conditioning"];

function MultiLineChart({ player }: { player: PlayerTimeline }) {
  const W   = 560;
  const H   = 240;
  const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const CYCLES = 6;
  const MIN_Y  = 3.5;
  const MAX_Y  = 9.0;

  function xPos(i: number): number {
    return PAD.left + (i / (CYCLES - 1)) * (W - PAD.left - PAD.right);
  }

  function yPos(v: number): number {
    return PAD.top + ((MAX_Y - v) / (MAX_Y - MIN_Y)) * (H - PAD.top - PAD.bottom);
  }

  // Y-axis grid lines
  const yTicks = [4, 5, 6, 7, 8, 9];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }} aria-label={`${player.name} skill trajectories`}>
      {/* Y grid lines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left} y1={yPos(v)}
            x2={W - PAD.right} y2={yPos(v)}
            stroke="oklch(0.30 0.01 260)"
            strokeWidth={0.7}
            strokeDasharray="3 3"
          />
          <text
            x={PAD.left - 6} y={yPos(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fill={C.muted}
            fontFamily="inherit"
          >
            {v}
          </text>
        </g>
      ))}

      {/* X-axis cycle labels */}
      {Array.from({ length: CYCLES }, (_, i) => (
        <text
          key={i}
          x={xPos(i)}
          y={H - PAD.bottom + 14}
          textAnchor="middle"
          fontSize={9}
          fill={C.muted}
          fontFamily="inherit"
        >
          Wk {(i + 1) * 2}
        </text>
      ))}

      {/* Skill lines */}
      {VISIBLE_SKILLS.map((sk) => {
        const vals  = player.skillData[sk];
        const color = SKILL_COLORS[sk];
        const pathD = vals
          .map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`)
          .join(" ");
        return (
          <path
            key={sk}
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        );
      })}

      {/* Annotation markers */}
      {player.annotations.map((ann) => {
        const x = xPos(ann.cycle);
        return (
          <g key={ann.label}>
            <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom} stroke="oklch(0.65 0.02 260)" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
            <text
              x={x}
              y={PAD.top - 4}
              textAnchor="middle"
              fontSize={8.5}
              fill="oklch(0.65 0.02 260)"
              fontFamily="inherit"
            >
              {ann.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LongitudinalTrajectory() {
  const [selectedId, setSelectedId] = useState<string>(TIMELINE_PLAYERS[0].id);
  const player = TIMELINE_PLAYERS.find((p) => p.id === selectedId) ?? TIMELINE_PLAYERS[0];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Longitudinal Player Trajectories</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Full development story for one player — all 8 skills across all assessment cycles with key moment annotations.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-5">
        {/* Player selector */}
        <div className="flex gap-2 flex-wrap">
          {TIMELINE_PLAYERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="px-4 py-2 rounded-lg border text-[13px] font-semibold transition-all"
              style={
                p.id === selectedId
                  ? { borderColor: C.primary, background: `${C.primary.replace(")", " / 0.12)")}`, color: C.primary }
                  : { borderColor: "var(--border)", background: "transparent", color: "var(--text-muted)" }
              }
            >
              {p.name} <span className="text-[11px] opacity-70">({p.position})</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: 480 }}>
            <MultiLineChart player={player} />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {VISIBLE_SKILLS.map((sk) => (
            <div key={sk} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded-full" style={{ background: SKILL_COLORS[sk] }} />
              <span className="text-[10px] text-[var(--text-muted)]">{SKILL_LABELS[sk]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PlayerDevelopmentOutcomesPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto space-y-10">
        <PageHeader
          eyebrow="Development Science"
          title="Player Development Outcomes"
          subtitle="Skill trajectories, IDP alignment, and position benchmarks — what the data actually shows"
          actions={
            <a
              href="/app/coach/effectiveness"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-[var(--border)] font-semibold text-[12.5px] hover:bg-[var(--bg-base)] transition"
            >
              <TrendingUp className="w-4 h-4" /> Coach Effectiveness
            </a>
          }
        />

        {/* 1 — VDV hero */}
        <ProgramVDVHero />

        {/* 2 — Skill trajectories */}
        <SkillTrajectoryTable />

        {/* 3 — IDP alignment */}
        <IDPAlignmentSection />

        {/* 4 — Position benchmarks */}
        <PositionBenchmarks />

        {/* 5 — Calibration check */}
        <CalibrationSection />

        {/* 6 — Longitudinal trajectory */}
        <LongitudinalTrajectory />
      </div>
    </AppShell>
  );
}
