/**
 * EnterpriseExpansionPage — Growth team's view of club-level expansion, NDR, and network effects.
 * Route: /app/analytics/enterprise
 */
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const NDR_TREND = [98, 100, 103, 106, 109, 112]; // Q1–Q6
const NDR_QUARTERS = ["Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"];

interface ExpansionMetric {
  label: string;
  value: string;
  target?: string;
  note: string;
  spark: number[];
  status: "success" | "warning" | "danger" | "neutral";
}

const EXPANSION_METRICS: ExpansionMetric[] = [
  {
    label: "Avg Teams per Org",
    value: "2.4",
    target: "3.0",
    note: "Accounts expanding past single-team",
    spark: [1.3, 1.5, 1.7, 1.9, 2.1, 2.2, 2.3, 2.4],
    status: "warning",
  },
  {
    label: "Director Activation Rate",
    value: "61%",
    target: "75%",
    note: "% of club accounts with active director-level users",
    spark: [42, 45, 49, 52, 55, 57, 59, 61],
    status: "warning",
  },
  {
    label: "Cross-Team Data Usage",
    value: "38%",
    target: "50%",
    note: "% of directors comparing analytics across their teams",
    spark: [18, 22, 25, 28, 31, 33, 36, 38],
    status: "warning",
  },
  {
    label: "Seat Expansion Rate",
    value: "34%",
    target: "40%",
    note: "Accounts that added seats in the last 90 days",
    spark: [24, 26, 27, 29, 30, 31, 33, 34],
    status: "warning",
  },
  {
    label: "Feature Breadth / Program",
    value: "4.2",
    target: "5.5",
    note: "of 7 feature areas active — improving from 2.8",
    spark: [2.8, 3.1, 3.4, 3.6, 3.8, 4.0, 4.1, 4.2],
    status: "warning",
  },
  {
    label: "Referral Rate",
    value: "31%",
    target: "35%",
    note: "New programs that trace to an existing-program referral",
    spark: [18, 21, 22, 24, 26, 27, 29, 31],
    status: "success",
  },
];

interface ExpansionStage {
  stage: string;
  desc: string;
  programs: number;
  avgARR: number;
  featureAdoption: number;
  color: string;
}

const EXPANSION_STAGES: ExpansionStage[] = [
  { stage: "Single Team",  desc: "1 team",    programs: 18, avgARR: 1200,  featureAdoption: 2.1, color: PRIMARY  },
  { stage: "Multi-Team",   desc: "2–3 teams", programs: 16, avgARR: 3100,  featureAdoption: 3.4, color: SUCCESS  },
  { stage: "Club",         desc: "4–8 teams", programs: 9,  avgARR: 7400,  featureAdoption: 5.2, color: WARNING  },
  { stage: "Enterprise",   desc: "8+ teams",  programs: 4,  avgARR: 18600, featureAdoption: 8.3, color: DANGER   },
];

interface ReferralRow {
  program: string;
  tier: "Premier" | "Gold" | "Silver";
  referred: number;
  referralValue: number;
  status: "active" | "churned";
}

const REFERRAL_TABLE: ReferralRow[] = [
  { program: "Elevation Basketball",    tier: "Premier", referred: 4, referralValue: 19200,  status: "active"  },
  { program: "Tri-State Hoops Academy", tier: "Premier", referred: 3, referralValue: 14400,  status: "active"  },
  { program: "Capital City Athletics",  tier: "Gold",    referred: 2, referralValue: 7800,   status: "active"  },
  { program: "Midwest Elite Program",   tier: "Gold",    referred: 2, referralValue: 6400,   status: "active"  },
  { program: "Lakeshore Basketball",    tier: "Silver",  referred: 1, referralValue: 2100,   status: "churned" },
  { program: "Southwest Hoops Club",    tier: "Gold",    referred: 1, referralValue: 3200,   status: "active"  },
];

interface WaterfallBar {
  label: string;
  value: number;
  type: "base" | "up" | "down" | "final";
}

const WATERFALL: WaterfallBar[] = [
  { label: "Starting ARR",     value: 892000, type: "base"  },
  { label: "+ Seat Expansion", value: 64000,  type: "up"    },
  { label: "+ Team Additions", value: 88000,  type: "up"    },
  { label: "+ Feature Upgrades",value: 31000, type: "up"    },
  { label: "− Churn",          value: -41000, type: "down"  },
  { label: "− Downgrades",     value: -12000, type: "down"  },
  { label: "Ending ARR",       value: 1022000,type: "final" },
];

interface ScatterPoint {
  x: number; // days to first director login
  y: number; // 12-month retention %
  size: number;
}

const SCATTER_POINTS: ScatterPoint[] = [
  { x: 1,  y: 91, size: 4 }, { x: 2,  y: 88, size: 4 }, { x: 3,  y: 85, size: 5 },
  { x: 4,  y: 87, size: 4 }, { x: 5,  y: 84, size: 5 }, { x: 6,  y: 83, size: 4 },
  { x: 7,  y: 80, size: 5 }, { x: 8,  y: 81, size: 4 }, { x: 9,  y: 78, size: 6 },
  { x: 10, y: 76, size: 5 }, { x: 11, y: 77, size: 4 }, { x: 12, y: 74, size: 5 },
  { x: 14, y: 78, size: 5 }, { x: 15, y: 65, size: 4 }, { x: 17, y: 62, size: 4 },
  { x: 18, y: 60, size: 5 }, { x: 19, y: 58, size: 4 }, { x: 21, y: 55, size: 5 },
  { x: 23, y: 52, size: 4 }, { x: 25, y: 51, size: 5 }, { x: 28, y: 48, size: 4 },
  { x: 30, y: 49, size: 4 }, { x: 33, y: 44, size: 5 }, { x: 35, y: 42, size: 4 },
  { x: 38, y: 40, size: 4 }, { x: 42, y: 38, size: 5 }, { x: 45, y: 36, size: 4 },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function statusColor(s: ExpansionMetric["status"]): string {
  switch (s) {
    case "success": return SUCCESS;
    case "warning": return WARNING;
    case "danger":  return DANGER;
    default:        return PRIMARY;
  }
}

function tierColor(t: ReferralRow["tier"]): string {
  switch (t) {
    case "Premier": return PRIMARY;
    case "Gold":    return WARNING;
    case "Silver":  return "oklch(0.72 0.04 260)";
  }
}

/* -------------------------------------------------------------------------- */
/* NDR Line Chart                                                              */
/* -------------------------------------------------------------------------- */

function NDRLineChart() {
  const W = 560;
  const H = 160;
  const PAD_L = 48;
  const PAD_R = 24;
  const PAD_T = 20;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const minVal = 90;
  const maxVal = 128;

  function toX(i: number) {
    return PAD_L + (i / (NDR_TREND.length - 1)) * chartW;
  }
  function toY(v: number) {
    return PAD_T + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  }

  const points = NDR_TREND.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaPath = `M ${toX(0)} ${toY(NDR_TREND[0])} ` +
    NDR_TREND.map((v, i) => `L ${toX(i)} ${toY(v)}`).join(" ") +
    ` L ${toX(NDR_TREND.length - 1)} ${H - PAD_B} L ${PAD_L} ${H - PAD_B} Z`;

  const y100 = toY(100);
  const y120 = toY(120);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="NDR trend over 6 quarters">
      <defs>
        <linearGradient id="ndr-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.22" />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y gridlines */}
      {[90, 95, 100, 105, 110, 115, 120, 125].map((v) => (
        <g key={v}>
          <line x1={PAD_L} y1={toY(v)} x2={W - PAD_R} y2={toY(v)}
            stroke="oklch(0.30 0.01 260)" strokeWidth="0.5" />
          <text x={PAD_L - 5} y={toY(v) + 3} textAnchor="end"
            fill="oklch(0.50 0.02 260)" fontSize="9">{v}%</text>
        </g>
      ))}

      {/* Reference line: 100% breakeven */}
      <line x1={PAD_L} y1={y100} x2={W - PAD_R} y2={y100}
        stroke={SUCCESS} strokeWidth="1.2" strokeDasharray="5 3" />
      <text x={W - PAD_R + 2} y={y100 + 3} fill={SUCCESS} fontSize="9" fontWeight="600">100%</text>

      {/* Reference line: 120% target */}
      <line x1={PAD_L} y1={y120} x2={W - PAD_R} y2={y120}
        stroke={WARNING} strokeWidth="1.2" strokeDasharray="5 3" />
      <text x={W - PAD_R + 2} y={y120 + 3} fill={WARNING} fontSize="9" fontWeight="600">120%</text>

      {/* Area fill */}
      <path d={areaPath} fill="url(#ndr-area)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {NDR_TREND.map((v, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(v)} r="4" fill={PRIMARY} />
          <circle cx={toX(i)} cy={toY(v)} r="2.5" fill="white" />
          <text x={toX(i)} y={toY(v) - 8} textAnchor="middle"
            fill="oklch(0.80 0.02 260)" fontSize="9" fontWeight="600">{v}%</text>
        </g>
      ))}

      {/* X labels */}
      {NDR_QUARTERS.map((q, i) => (
        <text key={q} x={toX(i)} y={H - 6} textAnchor="middle"
          fill="oklch(0.50 0.02 260)" fontSize="9">{q}</text>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini Sparkline                                                              */
/* -------------------------------------------------------------------------- */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 60;
  const H = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  function toX(i: number) { return (i / (data.length - 1)) * W; }
  function toY(v: number) { return H - 2 - ((v - min) / range) * (H - 4); }

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  return (
    <svg width={W} height={H} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Expansion Metrics Grid                                                      */
/* -------------------------------------------------------------------------- */

function ExpansionMetricCard({ m }: { m: ExpansionMetric }) {
  const color = statusColor(m.status);
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider leading-tight">{m.label}</span>
        <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: color }} />
      </div>
      <div className="flex items-end gap-3">
        <span className="text-[32px] font-bold leading-none text-[var(--text-primary)]">{m.value}</span>
        {m.target && (
          <span className="text-[12px] text-[var(--text-muted)] mb-1">/ {m.target} target</span>
        )}
      </div>
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{m.note}</p>
      <div className="flex items-center justify-between">
        <Sparkline data={m.spark} color={color} />
        <span className="text-[10px] text-[var(--text-muted)]">8-week trend</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Expansion Stage Chart                                                       */
/* -------------------------------------------------------------------------- */

function StageChart() {
  const total = EXPANSION_STAGES.reduce((acc, s) => acc + s.programs, 0);
  const maxARR = Math.max(...EXPANSION_STAGES.map((s) => s.avgARR));

  return (
    <div className="space-y-4">
      {EXPANSION_STAGES.map((stage, i) => {
        const widthPct = (stage.programs / total) * 100;
        const arrPct = (stage.avgARR / maxARR) * 100;

        return (
          <div key={stage.stage} className="bg-[var(--bg-base)] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                  style={{ color: stage.color, background: `${stage.color.replace(")", " / 0.12)")}` }}
                >
                  Stage {i + 1}
                </span>
                <div>
                  <div className="text-[14px] font-bold text-[var(--text-primary)]">{stage.stage}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{stage.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap text-right">
                <div>
                  <div className="text-[20px] font-bold text-[var(--text-primary)]">{stage.programs}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Programs</div>
                </div>
                <div>
                  <div className="text-[20px] font-bold" style={{ color: stage.color }}>{fmt(stage.avgARR)}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Avg ARR</div>
                </div>
                <div>
                  <div className="text-[20px] font-bold text-[var(--text-primary)]">{stage.featureAdoption}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Features active</div>
                </div>
              </div>
            </div>

            {/* Program count bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-16 shrink-0">Programs</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-surface)]">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%`, background: stage.color }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">{widthPct.toFixed(0)}%</span>
            </div>

            {/* ARR bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-16 shrink-0">Avg ARR</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-surface)]">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${arrPct}%`, background: stage.color, opacity: 0.6 }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Waterfall Chart                                                             */
/* -------------------------------------------------------------------------- */

function WaterfallChart() {
  const W = 580;
  const H = 200;
  const PAD_L = 60;
  const PAD_B = 36;
  const PAD_T = 20;
  const PAD_R = 12;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Compute running totals for stacked positioning
  const maxVal = 1_100_000;
  const minVal = 0;
  const range = maxVal - minVal;

  const barWidth = (chartW / WATERFALL.length) * 0.65;
  const gap = chartW / WATERFALL.length;

  let running = 0;
  const bars = WATERFALL.map((bar) => {
    const base = bar.type === "base" || bar.type === "final" ? 0 : running;
    const value = bar.type === "down" ? Math.abs(bar.value) : bar.value;
    const y = bar.type === "down"
      ? PAD_T + chartH - ((running) / range) * chartH
      : PAD_T + chartH - ((base + value) / range) * chartH;
    const height = (value / range) * chartH;

    const color = bar.type === "final" ? PRIMARY
      : bar.type === "down" ? DANGER
      : bar.type === "base" ? "oklch(0.45 0.05 260)"
      : SUCCESS;

    if (bar.type !== "final") running += bar.value;

    return { ...bar, y, height: Math.max(height, 2), color, base };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="ARR waterfall chart">
      {/* Y gridlines */}
      {[0, 250000, 500000, 750000, 1000000].map((v) => {
        const y = PAD_T + chartH - (v / range) * chartH;
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="oklch(0.28 0.01 260)" strokeWidth="0.5" />
            <text x={PAD_L - 5} y={y + 3} textAnchor="end"
              fill="oklch(0.50 0.02 260)" fontSize="8.5">{`$${v / 1000}K`}</text>
          </g>
        );
      })}

      {/* Connector lines */}
      {bars.map((bar, i) => {
        if (i === bars.length - 1 || bar.type === "final") return null;
        const thisRight = PAD_L + i * gap + barWidth;
        const nextLeft  = PAD_L + (i + 1) * gap;
        const connY = bar.type === "down" ? bar.y + bar.height : bar.y;
        return (
          <line key={`conn-${i}`} x1={thisRight} y1={connY} x2={nextLeft} y2={connY}
            stroke="oklch(0.35 0.01 260)" strokeWidth="0.8" strokeDasharray="3 2" />
        );
      })}

      {/* Bars */}
      {bars.map((bar, i) => {
        const x = PAD_L + i * gap;
        return (
          <g key={bar.label}>
            <rect x={x} y={bar.y} width={barWidth} height={bar.height}
              fill={bar.color} fillOpacity="0.85" rx="2" />
            {/* Value label above/below bar */}
            <text
              x={x + barWidth / 2}
              y={bar.type === "down" ? bar.y + bar.height + 11 : bar.y - 4}
              textAnchor="middle"
              fill={bar.color}
              fontSize="8.5"
              fontWeight="700"
            >
              {bar.type === "down" ? `−${fmt(Math.abs(bar.value))}` : fmt(Math.abs(bar.value))}
            </text>
            {/* X label */}
            <text
              x={x + barWidth / 2}
              y={H - 4}
              textAnchor="middle"
              fill="oklch(0.55 0.02 260)"
              fontSize="8"
            >
              {bar.label.replace(/^[+−] /, "").replace(" ARR", "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Director Activation Scatter                                                 */
/* -------------------------------------------------------------------------- */

function DirectorScatter() {
  const W = 480;
  const H = 200;
  const PAD_L = 40;
  const PAD_B = 32;
  const PAD_T = 16;
  const PAD_R = 16;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxX = 50;
  const minY = 30;
  const maxY = 100;

  function toX(v: number) { return PAD_L + (v / maxX) * chartW; }
  function toY(v: number) { return PAD_T + chartH - ((v - minY) / (maxY - minY)) * chartH; }

  const thresholdX = toX(14);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Director activation scatter plot">
      {/* Grid */}
      {[40, 50, 60, 70, 80, 90, 100].map((v) => (
        <g key={v}>
          <line x1={PAD_L} y1={toY(v)} x2={W - PAD_R} y2={toY(v)}
            stroke="oklch(0.28 0.01 260)" strokeWidth="0.5" />
          <text x={PAD_L - 4} y={toY(v) + 3} textAnchor="end"
            fill="oklch(0.50 0.02 260)" fontSize="8">{v}%</text>
        </g>
      ))}
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <text key={v} x={toX(v)} y={H - 6} textAnchor="middle"
          fill="oklch(0.50 0.02 260)" fontSize="8">{v}d</text>
      ))}

      {/* Threshold line at day 14 */}
      <line x1={thresholdX} y1={PAD_T} x2={thresholdX} y2={H - PAD_B}
        stroke={WARNING} strokeWidth="1.5" strokeDasharray="5 3" />
      <text x={thresholdX + 4} y={PAD_T + 10} fill={WARNING} fontSize="8" fontWeight="700">14-day threshold</text>

      {/* Zone labels */}
      <text x={thresholdX - 8} y={PAD_T + 24} textAnchor="end" fill={SUCCESS} fontSize="9" fontWeight="600">78% retention</text>
      <text x={thresholdX + 8} y={PAD_T + 24} fill={DANGER} fontSize="9" fontWeight="600">51% retention</text>

      {/* Scatter points */}
      {SCATTER_POINTS.map((pt, i) => {
        const color = pt.x <= 14 ? SUCCESS : DANGER;
        return (
          <circle key={i} cx={toX(pt.x)} cy={toY(pt.y)} r={pt.size}
            fill={color} fillOpacity="0.55" stroke={color} strokeWidth="0.8" />
        );
      })}

      {/* Trend line (approximate) */}
      <line
        x1={toX(1)} y1={toY(90)}
        x2={toX(48)} y2={toY(34)}
        stroke="oklch(0.65 0.02 260)" strokeWidth="1" strokeDasharray="6 3" />

      {/* Axis labels */}
      <text x={W / 2} y={H - 0} textAnchor="middle" fill="oklch(0.50 0.02 260)" fontSize="9">
        Days to first director login
      </text>
      <text x={8} y={H / 2} textAnchor="middle" fill="oklch(0.50 0.02 260)" fontSize="9"
        transform={`rotate(-90, 8, ${H / 2})`}>12-mo retention %</text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function EnterpriseExpansionPage() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-12">
        <PageHeader
          eyebrow="Enterprise Intelligence"
          title="Enterprise Expansion"
          subtitle="Club-level growth, seat expansion, and network effect metrics"
        />

        {/* ── Section 1: NDR Hero ── */}
        <section>
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: `${PRIMARY.replace(")", " / 0.06)")}` }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                {/* NDR hero number */}
                <div className="shrink-0">
                  <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)] mb-1">
                    Net Dollar Retention
                  </div>
                  <div
                    className="text-[72px] sm:text-[96px] font-black leading-none"
                    style={{ color: PRIMARY }}
                  >
                    112%
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)] mt-3 max-w-xs leading-relaxed">
                    Programs that stay are spending more. This is the compounding growth engine.
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 sm:mt-6">
                  {[
                    { color: SUCCESS, label: "100% breakeven expansion" },
                    { color: WARNING, label: "120% target NDR" },
                    { color: PRIMARY, label: "Actual NDR trajectory" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="w-5 h-0.5 shrink-0" style={{ background: item.color }} />
                      <span className="text-[11px] text-[var(--text-muted)]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NDR line chart */}
              <div className="mt-6">
                <NDRLineChart />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Expansion Metrics Grid ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Expansion Metrics</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Six signals that predict whether an account will expand or plateau.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPANSION_METRICS.map((m) => (
              <ExpansionMetricCard key={m.label} m={m} />
            ))}
          </div>
        </section>

        {/* ── Section 3: Accounts by Expansion Stage ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Accounts by Expansion Stage</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Where programs are today — and the revenue opportunity in moving them up.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <StageChart />

            <div
              className="mt-6 rounded-xl p-4 border border-[var(--border)]"
              style={{ background: `${PRIMARY.replace(")", " / 0.07)")}` }}
            >
              <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: PRIMARY }}>
                Key Insight
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                Enterprise accounts (8+ teams) have{" "}
                <span className="font-semibold text-[var(--text-primary)]">4× the feature adoption</span> and{" "}
                <span className="font-semibold text-[var(--text-primary)]">94% season-2 retention</span>
                {" "}— but represent only 9% of total accounts. Expanding Club-tier accounts to Enterprise is the single highest-leverage motion.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Referral Network ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">The Referral Network</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Programs referred by existing customers retain at 2.1× the rate of self-serve signups.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Referring Program", "Tier", "Referred", "Referral Value", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REFERRAL_TABLE.map((row, ri) => (
                    <tr key={row.program}
                      className={`border-b border-[var(--border)] ${ri % 2 === 0 ? "bg-[var(--bg-base)]" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] text-[13px]">{row.program}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: tierColor(row.tier), background: `${tierColor(row.tier).replace(")", " / 0.12)")}` }}
                        >
                          {row.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)] font-bold text-[13px]">{row.referred}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)] text-[13px]">{fmt(row.referralValue)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={
                            row.status === "active"
                              ? { color: SUCCESS, background: `${SUCCESS.replace(")", " / 0.12)")}` }
                              : { color: DANGER, background: `${DANGER.replace(")", " / 0.12)")}` }
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)]">
              <p className="text-[12px] text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-primary)]">Referral is our highest-quality acquisition channel.</span>{" "}
                Programs referred by existing customers retain at 2.1× the rate of self-serve signups and activate 3.4 days faster on average.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 5: Seat Expansion Waterfall ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">How Accounts Grow — ARR Waterfall</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Current quarter net ARR movement. Each bar shows a component of expansion or contraction.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <WaterfallChart />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Seat expansion",    value: "+$64K",  color: SUCCESS  },
                { label: "Team additions",    value: "+$88K",  color: SUCCESS  },
                { label: "Feature upgrades",  value: "+$31K",  color: SUCCESS  },
                { label: "Net ARR growth",    value: "+$130K", color: PRIMARY  },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--bg-base)] rounded-xl p-3 text-center">
                  <div className="text-[20px] font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 6: Director Activation Impact ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Director Activation Impact</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Earlier director activation strongly predicts 12-month retention. Each point is a program.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <DirectorScatter />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div
                className="rounded-xl p-4 border border-[var(--border)]"
                style={{ background: `${SUCCESS.replace(")", " / 0.08)")}` }}
              >
                <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: SUCCESS }}>
                  Within 14 days
                </div>
                <div className="text-[28px] font-bold" style={{ color: SUCCESS }}>78%</div>
                <div className="text-[12px] text-[var(--text-muted)]">12-month retention rate</div>
              </div>
              <div
                className="rounded-xl p-4 border border-[var(--border)]"
                style={{ background: `${DANGER.replace(")", " / 0.08)")}` }}
              >
                <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: DANGER }}>
                  After 14 days
                </div>
                <div className="text-[28px] font-bold" style={{ color: DANGER }}>51%</div>
                <div className="text-[12px] text-[var(--text-muted)]">12-month retention rate</div>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-[var(--text-muted)] leading-relaxed">
              <span className="font-semibold text-[var(--text-primary)]">Recommendation:</span>{" "}
              Trigger a dedicated director onboarding sequence at Day 3 post-signup. A director who experiences
              the analytics dashboard before Day 7 is 2.8× more likely to be active at Month 6.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
