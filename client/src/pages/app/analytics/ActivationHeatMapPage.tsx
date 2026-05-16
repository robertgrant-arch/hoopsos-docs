/**
 * ActivationHeatMapPage — Growth team's activation funnel and cohort retention view.
 * Route: /app/analytics/activation
 */
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Types & data                                                                */
/* -------------------------------------------------------------------------- */

interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  annotation?: string;
}

const FUNNEL_STEPS: FunnelStep[] = [
  { label: "Signed up",                  count: 38, pct: 100, annotation: undefined },
  { label: "Roster imported",            count: 31, pct: 82,  annotation: "within 7 days" },
  { label: "First assessment recorded",  count: 26, pct: 68,  annotation: "within 14 days" },
  { label: "First report/export shared", count: 18, pct: 47,  annotation: "within 30 days" },
  { label: "Parent opened report",       count: 15, pct: 39,  annotation: "within 30 days" },
  { label: "Program \"activated\"",      count: 13, pct: 34,  annotation: "all 3 criteria met" },
];

interface HistogramBar {
  day: number;
  count: number;
  bucket: "early" | "mid" | "late" | "overdue";
}

const HISTOGRAM: HistogramBar[] = [
  { day: 1,  count: 2,  bucket: "early" },
  { day: 2,  count: 3,  bucket: "early" },
  { day: 3,  count: 4,  bucket: "early" },
  { day: 4,  count: 5,  bucket: "early" },
  { day: 5,  count: 7,  bucket: "early" },
  { day: 6,  count: 6,  bucket: "early" },
  { day: 7,  count: 5,  bucket: "early" },
  { day: 8,  count: 8,  bucket: "mid" },
  { day: 9,  count: 11, bucket: "mid" },  // mode
  { day: 10, count: 9,  bucket: "mid" },
  { day: 11, count: 8,  bucket: "mid" },
  { day: 12, count: 7,  bucket: "mid" },
  { day: 13, count: 5,  bucket: "mid" },
  { day: 14, count: 4,  bucket: "mid" },
  { day: 15, count: 5,  bucket: "late" },
  { day: 16, count: 4,  bucket: "late" },
  { day: 17, count: 3,  bucket: "late" },
  { day: 18, count: 3,  bucket: "late" },
  { day: 19, count: 2,  bucket: "late" },
  { day: 20, count: 2,  bucket: "late" },
  { day: 21, count: 1,  bucket: "late" },
  { day: 22, count: 2,  bucket: "overdue" },
  { day: 23, count: 1,  bucket: "overdue" },
  { day: 24, count: 2,  bucket: "overdue" },
  { day: 25, count: 1,  bucket: "overdue" },
  { day: 26, count: 1,  bucket: "overdue" },
  { day: 27, count: 1,  bucket: "overdue" },
  { day: 28, count: 0,  bucket: "overdue" },
  { day: 29, count: 1,  bucket: "overdue" },
  { day: 30, count: 0,  bucket: "overdue" },
];

const MEAN_DAY = 11.3;
const MODE_DAY = 9;

interface AcquisitionSource {
  id: string;
  label: string;
  programs: number;
  avgDaysToActivation: number;
  retention12m: number;
  note: "best" | "attention" | "good" | "neutral";
}

const SOURCES: AcquisitionSource[] = [
  { id: "referral",   label: "Referral",        programs: 11, avgDaysToActivation: 7.2,  retention12m: 68, note: "best" },
  { id: "sales",      label: "Sales-Assisted",  programs: 14, avgDaysToActivation: 9.8,  retention12m: 61, note: "good" },
  { id: "conference", label: "Conference",      programs: 8,  avgDaysToActivation: 11.4, retention12m: 57, note: "neutral" },
  { id: "self",       label: "Self-Serve",      programs: 14, avgDaysToActivation: 14.1, retention12m: 52, note: "attention" },
];

interface CohortRow {
  cohort: string;
  start: number;
  m1: number;
  m3: number;
  m6: number;
  m12: number;
  s2: number;
}

const COHORTS: CohortRow[] = [
  { cohort: "Nov '25", start: 32, m1: 97, m3: 88, m6: 75, m12: 62, s2: 48 },
  { cohort: "Dec '25", start: 28, m1: 96, m3: 86, m6: 71, m12: 58, s2: 44 },
  { cohort: "Jan '26", start: 35, m1: 97, m3: 89, m6: 74, m12: 59, s2: 0  },
  { cohort: "Feb '26", start: 41, m1: 95, m3: 84, m6: 69, m12: 0,  s2: 0  },
  { cohort: "Mar '26", start: 38, m1: 94, m3: 82, m6: 0,  m12: 0,  s2: 0  },
  { cohort: "Apr '26", start: 47, m1: 96, m3: 0,  m6: 0,  m12: 0,  s2: 0  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function bucketColor(b: HistogramBar["bucket"]): string {
  switch (b) {
    case "early":   return SUCCESS;
    case "mid":     return PRIMARY;
    case "late":    return WARNING;
    case "overdue": return DANGER;
  }
}

function retentionColor(pct: number): string {
  if (pct === 0)   return "oklch(0.30 0.01 260)";
  if (pct >= 85)   return SUCCESS;
  if (pct >= 70)   return "oklch(0.74 0.14 140)";
  if (pct >= 55)   return WARNING;
  return DANGER;
}

function sourceNoteLabel(note: AcquisitionSource["note"]): { label: string; color: string } {
  switch (note) {
    case "best":      return { label: "Best performing source", color: SUCCESS };
    case "attention": return { label: "Needs attention",        color: DANGER  };
    case "good":      return { label: "Strong performer",       color: PRIMARY };
    case "neutral":   return { label: "Developing",             color: WARNING };
  }
}

/* -------------------------------------------------------------------------- */
/* Funnel Chart (SVG trapezoids)                                               */
/* -------------------------------------------------------------------------- */

function FunnelChart() {
  const W = 520;
  const STEP_H = 64;
  const GAP = 8;
  const TOP_MAX_W = W;
  const BOT_MAX_W = W * 0.34;

  const biggestDropIdx = 2; // step 2→3 (68%→47%)

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${FUNNEL_STEPS.length * (STEP_H + GAP) - GAP + 24}`}
        className="w-full max-w-[560px] mx-auto"
        aria-label="Activation funnel chart"
      >
        {FUNNEL_STEPS.map((step, i) => {
          const topW = TOP_MAX_W - (TOP_MAX_W - BOT_MAX_W) * (i / (FUNNEL_STEPS.length - 1));
          const botW = TOP_MAX_W - (TOP_MAX_W - BOT_MAX_W) * ((i + 1) / (FUNNEL_STEPS.length - 1));
          const y = i * (STEP_H + GAP);
          const topX = (W - topW) / 2;
          const botX = (W - botW) / 2;
          const opacity = 0.4 + (step.pct / 100) * 0.6;

          return (
            <g key={step.label}>
              {/* Trapezoid */}
              <path
                d={`M ${topX} ${y} L ${topX + topW} ${y} L ${botX + botW} ${y + STEP_H} L ${botX} ${y + STEP_H} Z`}
                fill={PRIMARY}
                fillOpacity={opacity}
              />
              {/* Step label */}
              <text
                x={W / 2}
                y={y + 22}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                {step.label}
              </text>
              {/* Count + pct */}
              <text
                x={W / 2}
                y={y + 40}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                opacity="0.9"
              >
                {step.count} programs · {step.pct}%
              </text>
              {/* Annotation */}
              {step.annotation && (
                <text
                  x={W / 2}
                  y={y + 56}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9.5"
                  opacity="0.75"
                >
                  {step.annotation}
                </text>
              )}

              {/* Drop-off label between steps */}
              {i < FUNNEL_STEPS.length - 1 && (
                <text
                  x={W - 8}
                  y={y + STEP_H + GAP / 2 + 4}
                  textAnchor="end"
                  fill={DANGER}
                  fontSize="10"
                  fontWeight="600"
                >
                  ↓ {FUNNEL_STEPS[i].pct - FUNNEL_STEPS[i + 1].pct}% dropped here
                </text>
              )}
            </g>
          );
        })}

        {/* Biggest drop annotation */}
        {(() => {
          const y = biggestDropIdx * (STEP_H + GAP) + STEP_H + 4;
          return (
            <g>
              <line
                x1={W * 0.72}
                y1={y}
                x2={W - 4}
                y2={y - 12}
                stroke={DANGER}
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <text x={W - 4} y={y - 24} textAnchor="end" fill={DANGER} fontSize="9" fontWeight="600">
                Assessment barrier —
              </text>
              <text x={W - 4} y={y - 13} textAnchor="end" fill={DANGER} fontSize="9">
                coaches need onboarding nudge at Day 7
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Histogram                                                                   */
/* -------------------------------------------------------------------------- */

function AssessmentHistogram() {
  const W = 560;
  const H = 160;
  const PAD_L = 32;
  const PAD_B = 28;
  const PAD_T = 16;
  const chartW = W - PAD_L - 8;
  const chartH = H - PAD_B - PAD_T;
  const maxCount = Math.max(...HISTOGRAM.map((b) => b.count));
  const barW = chartW / HISTOGRAM.length - 1;

  const meanX = PAD_L + (MEAN_DAY / 30) * chartW;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px] mx-auto" aria-label="Days to first assessment histogram">
        {/* Y gridlines */}
        {[0, 4, 8, 12].map((v) => {
          const y = PAD_T + chartH - (v / maxCount) * chartH;
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="oklch(0.35 0.01 260)" strokeWidth="0.5" />
              <text x={PAD_L - 4} y={y + 3} textAnchor="end" fill="oklch(0.55 0.02 260)" fontSize="8">{v}</text>
            </g>
          );
        })}

        {/* Bars */}
        {HISTOGRAM.map((bar, i) => {
          const x = PAD_L + i * (barW + 1);
          const bh = (bar.count / maxCount) * chartH;
          const y = PAD_T + chartH - bh;
          return (
            <rect
              key={bar.day}
              x={x}
              y={y}
              width={barW}
              height={bh}
              fill={bucketColor(bar.bucket)}
              fillOpacity="0.85"
              rx="1"
            />
          );
        })}

        {/* Mean line */}
        <line x1={meanX} y1={PAD_T} x2={meanX} y2={PAD_T + chartH} stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={meanX + 3} y={PAD_T + 10} fill="white" fontSize="9" fontWeight="600">
          Mean {MEAN_DAY}d
        </text>

        {/* X axis labels */}
        {[0, 5, 10, 15, 20, 25, 30].map((d) => {
          const x = PAD_L + (d / 30) * chartW;
          return (
            <text key={d} x={x} y={H - 6} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
              {d}
            </text>
          );
        })}
        <text x={W / 2} y={H - 0} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
          Days after signup
        </text>

        {/* Legend */}
        {[
          { label: "< 7d",  color: SUCCESS },
          { label: "7–14d", color: PRIMARY },
          { label: "14–21d",color: WARNING },
          { label: "21+d",  color: DANGER  },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(${PAD_L + i * 80}, ${PAD_T + 2})`}>
            <rect width="8" height="8" fill={item.color} rx="1" />
            <text x="11" y="8" fill="oklch(0.65 0.02 260)" fontSize="8">{item.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Source bar chart                                                            */
/* -------------------------------------------------------------------------- */

function SourceRetentionChart({ sources }: { sources: AcquisitionSource[] }) {
  const maxVal = 100;
  const W = 400;
  const ROW_H = 28;
  const LABEL_W = 110;
  const BAR_MAX = W - LABEL_W - 48;

  return (
    <svg
      viewBox={`0 0 ${W} ${sources.length * ROW_H + 12}`}
      className="w-full max-w-[440px]"
      aria-label="Retention rate by source"
    >
      {sources.map((s, i) => {
        const y = i * ROW_H + 6;
        const barW = (s.retention12m / maxVal) * BAR_MAX;
        const isHighest = s.retention12m === Math.max(...sources.map((x) => x.retention12m));
        return (
          <g key={s.id}>
            <text x={0} y={y + 14} fill="oklch(0.75 0.02 260)" fontSize="11">{s.label}</text>
            <rect x={LABEL_W} y={y + 2} width={barW} height={18} fill={isHighest ? SUCCESS : PRIMARY} fillOpacity="0.85" rx="3" />
            <text x={LABEL_W + barW + 5} y={y + 15} fill="oklch(0.75 0.02 260)" fontSize="10" fontWeight="600">
              {s.retention12m}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Cohort retention table with inline bars                                    */
/* -------------------------------------------------------------------------- */

function CohortTable() {
  const cols: { key: keyof CohortRow; label: string }[] = [
    { key: "m1",  label: "Month 1" },
    { key: "m3",  label: "Month 3" },
    { key: "m6",  label: "Month 6" },
    { key: "m12", label: "Month 12" },
    { key: "s2",  label: "Season 2" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Cohort
            </th>
            <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold w-16">
              Start
            </th>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COHORTS.map((row, ri) => (
            <tr key={row.cohort} className={`border-b border-[var(--border)] ${ri % 2 === 0 ? "bg-[var(--bg-surface)]" : ""}`}>
              <td className="px-4 py-3 text-[var(--text-primary)] font-medium text-[13px]">{row.cohort}</td>
              <td className="px-3 py-3 text-right text-[var(--text-muted)] text-[12px]">{row.start}</td>
              {cols.map((c) => {
                const val = row[c.key] as number;
                return (
                  <td key={c.key} className="px-3 py-3">
                    {val === 0 ? (
                      <span className="text-[var(--text-muted)] text-[11px] opacity-40">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[12px] font-semibold" style={{ color: retentionColor(val) }}>
                          {val}%
                        </span>
                        <svg width="48" height="6" viewBox="0 0 48 6">
                          <rect width="48" height="6" fill="oklch(0.25 0.01 260)" rx="3" />
                          <rect width={val * 0.48} height="6" fill={retentionColor(val)} rx="3" />
                        </svg>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ActivationHeatMapPage() {
  const [activeSource, setActiveSource] = useState<string>("referral");
  const selected = SOURCES.find((s) => s.id === activeSource) ?? SOURCES[0];
  const noteInfo = sourceNoteLabel(selected.note);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Growth Intelligence"
          title="Activation Heat Map"
          subtitle="From signup to activated program — where we win and where we lose"
        />

        {/* ── Section 1: Funnel ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Activation Funnel — Last 30 Days
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              38 new programs entered the funnel. 13 fully activated (34%).
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <FunnelChart />
          </div>
        </section>

        {/* ── Section 2: Histogram ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Days to First Assessment — Distribution
            </h2>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <AssessmentHistogram />
            <p className="mt-4 text-[13px] text-[var(--text-muted)] max-w-2xl">
              <span className="font-semibold text-[var(--text-primary)]">Mode: Day {MODE_DAY}</span>
              {" · "}
              <span className="font-semibold text-[var(--text-primary)]">Mean: {MEAN_DAY} days</span>
              {" · "}
              <span style={{ color: SUCCESS }} className="font-semibold">Target: &lt; 7 days</span>
            </p>
            <p className="mt-2 text-[12px] text-[var(--text-muted)] max-w-2xl">
              Programs that assess within 7 days have{" "}
              <span className="font-semibold text-[var(--text-primary)]">2.4× the 12-month retention</span>{" "}
              of those that wait 14+.
            </p>
          </div>
        </section>

        {/* ── Section 3: Activation by Source ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activation by Source</h2>
          </div>

          {/* Source tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSource(s.id)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={
                  activeSource === s.id
                    ? { background: PRIMARY, color: "white" }
                    : {
                        background: "var(--bg-surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Selected source card */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--text-primary)]">{selected.label}</h3>
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-full"
                  style={{
                    color: noteInfo.color,
                    background: `${noteInfo.color.replace(")", " / 0.12)")}`,
                  }}
                >
                  {noteInfo.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div className="text-[24px] font-bold text-[var(--text-primary)]">{selected.programs}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Programs</div>
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div className="text-[24px] font-bold text-[var(--text-primary)]">{selected.avgDaysToActivation}d</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Avg activation</div>
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div
                    className="text-[24px] font-bold"
                    style={{ color: retentionColor(selected.retention12m) }}
                  >
                    {selected.retention12m}%
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">12m retention</div>
                </div>
              </div>
            </div>

            {/* Comparison bar chart */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-[12px] text-[var(--text-muted)] mb-4 font-medium uppercase tracking-wider">
                12-Month Retention by Source
              </p>
              <SourceRetentionChart sources={SOURCES} />
            </div>
          </div>
        </section>

        {/* ── Section 4: Cohort Retention Waterfall ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Program Retention by Signup Cohort
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Each row is a cohort. Bars show remaining % at each time milestone. Gray = not yet reached.
            </p>
          </div>
          <CohortTable />
        </section>

        {/* ── Section 5: Leading Indicators ── */}
        <section>
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-[var(--border)]"
              style={{ background: `${PRIMARY.replace(")", " / 0.08)")}` }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: PRIMARY }}
              >
                Research Finding
              </div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
                The 3 activation behaviors that predict 12-month retention
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                Derived from cohort analysis of 289 programs over 18 months.
              </p>
            </div>

            {/* Findings */}
            <div className="bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
              {[
                {
                  n: 1,
                  icon: "⚡",
                  title: "Assessment cadence regularity",
                  body: "Programs that record their first assessment within 7 days of roster import retain at 2.4× the rate of programs that wait 14+ days. The window of habit formation is narrow.",
                  confidence: "Based on 189 programs with ≥ 6 months of history",
                  color: SUCCESS,
                },
                {
                  n: 2,
                  icon: "👁",
                  title: "Parent report open in Month 1",
                  body: "When at least one parent opens a shared report in the first 30 days, program churn drops 38%. Parent engagement is a leading indicator for director commitment.",
                  confidence: "Based on 142 programs with parent portal enabled",
                  color: PRIMARY,
                },
                {
                  n: 3,
                  icon: "🏅",
                  title: "Director activation within 14 days",
                  body: "A director who logs in within 2 weeks of signup predicts 3× retention over 12 months. Director-owned programs drive culture change, not just roster tracking.",
                  confidence: "Based on 217 programs with director accounts",
                  color: WARNING,
                },
              ].map((f) => (
                <div key={f.n} className="flex gap-4 p-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0 mt-0.5"
                    style={{ background: `${f.color.replace(")", " / 0.12)")}` }}
                  >
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: f.color }}
                      >
                        #{f.n}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] text-[14px]">{f.title}</span>
                    </div>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{f.body}</p>
                    <p className="text-[11px] mt-2 font-medium" style={{ color: f.color }}>
                      {f.confidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
