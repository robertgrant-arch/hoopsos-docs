/**
 * DataQualityScorecardPage — Data/trust team's platform integrity view.
 * Route: /app/analytics/data-quality
 */
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Types & data                                                                */
/* -------------------------------------------------------------------------- */

interface KpiCard {
  label: string;
  value: number;
  target: number;
  unit: string;
  status: "success" | "warning" | "danger";
  note?: string;
}

const KPI_CARDS: KpiCard[] = [
  {
    label: "Assessment Verification Rate",
    value: 81,
    target: 85,
    unit: "%",
    status: "warning",
  },
  {
    label: "Film Corroboration Index",
    value: 58,
    target: 60,
    unit: "%",
    status: "warning",
    note: "improving",
  },
  {
    label: "IDP Completion Rate",
    value: 52,
    target: 50,
    unit: "%",
    status: "success",
  },
  {
    label: "Data Freshness (30d)",
    value: 68,
    target: 65,
    unit: "%",
    status: "success",
  },
];

interface InflationProgram {
  name: string;
  avgDelta: number;
  cycles: number;
}

const INFLATION_PROGRAMS: InflationProgram[] = [
  { name: "Elevation Basketball",  avgDelta: 2.1, cycles: 2 },
  { name: "Premier Hoops 17U",     avgDelta: 1.8, cycles: 1 },
  { name: "Capital Elite",         avgDelta: 1.6, cycles: 2 },
];

type QStatus = "green" | "amber" | "red";

interface ProgramQuality {
  name: string;
  teams: number;
  assessDensity: number;
  verifyRate: number;
  filmCorr: number;
  idpComp: number;
  dataFresh: number;
  composite: number;
  status: QStatus;
}

const PROGRAM_QUALITY: ProgramQuality[] = [
  { name: "Capital Elite",          teams: 4,  assessDensity: 38, verifyRate: 41, filmCorr: 28, idpComp: 35, dataFresh: 44, composite: 37, status: "red"   },
  { name: "Premier Hoops 17U",      teams: 3,  assessDensity: 51, verifyRate: 48, filmCorr: 33, idpComp: 42, dataFresh: 52, composite: 45, status: "red"   },
  { name: "Desert Storm AAU",       teams: 5,  assessDensity: 58, verifyRate: 54, filmCorr: 41, idpComp: 48, dataFresh: 61, composite: 52, status: "amber" },
  { name: "Elevation Basketball",   teams: 6,  assessDensity: 62, verifyRate: 57, filmCorr: 44, idpComp: 55, dataFresh: 63, composite: 56, status: "amber" },
  { name: "Midwest Prep Hoops",     teams: 4,  assessDensity: 67, verifyRate: 63, filmCorr: 51, idpComp: 60, dataFresh: 68, composite: 62, status: "amber" },
  { name: "Coastal Ballers",        teams: 3,  assessDensity: 70, verifyRate: 66, filmCorr: 55, idpComp: 64, dataFresh: 72, composite: 65, status: "amber" },
  { name: "Legacy Elite Program",   teams: 7,  assessDensity: 74, verifyRate: 71, filmCorr: 60, idpComp: 68, dataFresh: 76, composite: 70, status: "amber" },
  { name: "Rocky Mountain Select",  teams: 4,  assessDensity: 78, verifyRate: 74, filmCorr: 64, idpComp: 72, dataFresh: 80, composite: 74, status: "green" },
  { name: "Academy Hoops Co.",      teams: 5,  assessDensity: 81, verifyRate: 78, filmCorr: 68, idpComp: 77, dataFresh: 83, composite: 77, status: "green" },
  { name: "Southeast Development",  teams: 6,  assessDensity: 85, verifyRate: 82, filmCorr: 72, idpComp: 81, dataFresh: 87, composite: 81, status: "green" },
  { name: "Pacific Elite Hoops",    teams: 8,  assessDensity: 88, verifyRate: 85, filmCorr: 77, idpComp: 84, dataFresh: 90, composite: 85, status: "green" },
  { name: "Northeast Prospects",    teams: 5,  assessDensity: 92, verifyRate: 89, filmCorr: 83, idpComp: 88, dataFresh: 94, composite: 89, status: "green" },
];

interface FilmSkillRow {
  skill: string;
  avgScore: number;
  clipsTagged: number;
  corroboration: "strong" | "weak" | "none";
  trend: "up" | "flat" | "down";
}

const FILM_SKILLS: FilmSkillRow[] = [
  { skill: "Ball Handling",      avgScore: 6.4, clipsTagged: 312, corroboration: "strong", trend: "up"   },
  { skill: "Finishing",          avgScore: 5.9, clipsTagged: 287, corroboration: "strong", trend: "flat" },
  { skill: "Shooting Form",      avgScore: 6.1, clipsTagged: 198, corroboration: "weak",   trend: "up"   },
  { skill: "Defensive Stance",   avgScore: 5.4, clipsTagged: 144, corroboration: "weak",   trend: "down" },
  { skill: "Transition Play",    avgScore: 6.7, clipsTagged: 89,  corroboration: "none",   trend: "flat" },
  { skill: "IQ / Decision-Make", avgScore: 7.1, clipsTagged: 76,  corroboration: "none",   trend: "flat" },
  { skill: "Rebounding",         avgScore: 5.8, clipsTagged: 221, corroboration: "strong", trend: "up"   },
  { skill: "Passing Vision",     avgScore: 6.3, clipsTagged: 104, corroboration: "weak",   trend: "flat" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function statusColor(s: "success" | "warning" | "danger" | QStatus): string {
  if (s === "success" || s === "green") return SUCCESS;
  if (s === "warning" || s === "amber") return WARNING;
  return DANGER;
}

function corrLabel(c: FilmSkillRow["corroboration"]): { text: string; color: string } {
  if (c === "strong") return { text: "Strong ✓",    color: SUCCESS };
  if (c === "weak")   return { text: "Weak ⚠",      color: WARNING };
  return                      { text: "No evidence", color: DANGER  };
}

function trendIcon(t: FilmSkillRow["trend"]): string {
  if (t === "up")   return "↑";
  if (t === "down") return "↓";
  return "→";
}

function trendColor(t: FilmSkillRow["trend"]): string {
  if (t === "up")   return SUCCESS;
  if (t === "down") return DANGER;
  return "oklch(0.55 0.02 260)";
}

/* -------------------------------------------------------------------------- */
/* Mini progress bar                                                           */
/* -------------------------------------------------------------------------- */

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const color =
    pct >= 0.75 ? SUCCESS
    : pct >= 0.55 ? WARNING
    : DANGER;

  return (
    <svg width="48" height="8" viewBox="0 0 48 8" aria-hidden="true">
      <rect width="48" height="8" fill="oklch(0.25 0.01 260)" rx="4" />
      <rect width={48 * pct} height="8" fill={color} rx="4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill score distribution SVG                                               */
/* -------------------------------------------------------------------------- */

const THIS_MONTH_DIST = [2, 5, 8, 14, 22, 30, 35, 28, 18, 10];
const LAST_QTR_DIST   = [4, 8, 13, 22, 32, 36, 28, 18, 8,  4];

function ScoreDistributionChart() {
  const W = 480;
  const H = 140;
  const PAD_L = 24;
  const PAD_B = 28;
  const PAD_T = 16;
  const chartW = W - PAD_L - 8;
  const chartH = H - PAD_B - PAD_T;
  const maxVal = Math.max(...THIS_MONTH_DIST, ...LAST_QTR_DIST);
  const step = chartW / 9;

  function pathFromData(data: number[], color: string, fill: boolean) {
    const pts = data.map((v, i) => {
      const x = PAD_L + i * step;
      const y = PAD_T + chartH - (v / maxVal) * chartH;
      return `${x},${y}`;
    });
    const d = `M ${pts.join(" L ")}`;
    if (fill) {
      const lastX = PAD_L + 9 * step;
      const baseY = PAD_T + chartH;
      return (
        <path
          d={`${d} L ${lastX} ${baseY} L ${PAD_L} ${baseY} Z`}
          fill={color}
          fillOpacity="0.12"
          stroke="none"
        />
      );
    }
    return <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[520px]" aria-label="Skill score distribution">
      {/* Fill areas */}
      {pathFromData(LAST_QTR_DIST, "oklch(0.65 0.02 260)", true)}
      {pathFromData(THIS_MONTH_DIST, PRIMARY, true)}
      {/* Lines */}
      {pathFromData(LAST_QTR_DIST, "oklch(0.60 0.02 260)", false)}
      {pathFromData(THIS_MONTH_DIST, PRIMARY, false)}

      {/* X axis labels */}
      {[1,2,3,4,5,6,7,8,9,10].map((v, i) => (
        <text key={v} x={PAD_L + i * step} y={H - 6} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
          {v}
        </text>
      ))}
      <text x={W / 2} y={H} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
        Skill Score (1–10)
      </text>

      {/* Legend */}
      <g transform={`translate(${PAD_L}, ${PAD_T})`}>
        <rect width="10" height="3" fill={PRIMARY} rx="1" />
        <text x="13" y="5" fill="oklch(0.70 0.02 260)" fontSize="9">This month</text>
      </g>
      <g transform={`translate(${PAD_L + 80}, ${PAD_T})`}>
        <rect width="10" height="3" fill="oklch(0.60 0.02 260)" rx="1" />
        <text x="13" y="5" fill="oklch(0.70 0.02 260)" fontSize="9">Last quarter</text>
      </g>

      {/* Shift annotation arrow */}
      <text x={W - 10} y={PAD_T + 20} textAnchor="end" fill={WARNING} fontSize="9" fontWeight="600">
        ← Slight right shift
      </text>
      <text x={W - 10} y={PAD_T + 30} textAnchor="end" fill={WARNING} fontSize="8">
        detected
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut chart for observation specificity                                     */
/* -------------------------------------------------------------------------- */

function ObservationDonut() {
  const R = 52;
  const CX = 70;
  const CY = 70;
  const specificPct = 0.62;
  const targetPct = 0.75;

  const circumference = 2 * Math.PI * R;
  const specificLen = circumference * specificPct;
  const targetLen   = circumference * targetPct;

  return (
    <svg viewBox="0 0 180 140" className="w-[180px] h-[140px]" aria-label="Observation specificity donut chart">
      {/* BG ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="oklch(0.25 0.01 260)" strokeWidth="16" />
      {/* Target ring (faint) */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={SUCCESS}
        strokeOpacity="0.20"
        strokeWidth="16"
        strokeDasharray={`${targetLen} ${circumference - targetLen}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
      {/* Actual specific */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={SUCCESS}
        strokeWidth="16"
        strokeDasharray={`${specificLen} ${circumference - specificLen}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
      {/* Generic */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={DANGER}
        strokeWidth="16"
        strokeOpacity="0.6"
        strokeDasharray={`${circumference * (1 - specificPct)} ${circumference * specificPct}`}
        strokeDashoffset={circumference * (0.25 - specificPct)}
        strokeLinecap="round"
      />

      {/* Center labels */}
      <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">62%</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="oklch(0.60 0.02 260)" fontSize="8">specific</text>

      {/* Legend */}
      <g transform="translate(136, 28)">
        <rect width="10" height="10" fill={SUCCESS} rx="2" />
        <text x="13" y="9" fill="oklch(0.70 0.02 260)" fontSize="9">Specific</text>
        <text x="13" y="19" fill="oklch(0.55 0.02 260)" fontSize="8">62%</text>
        <rect y="28" width="10" height="10" fill={DANGER} fillOpacity="0.6" rx="2" />
        <text x="13" y="38" fill="oklch(0.70 0.02 260)" fontSize="9">Generic</text>
        <text x="13" y="48" fill="oklch(0.55 0.02 260)" fontSize="8">38%</text>
        <rect y="58" width="10" height="6" fill={SUCCESS} fillOpacity="0.25" rx="1" />
        <text x="13" y="66" fill="oklch(0.55 0.02 260)" fontSize="8">Target 75%</text>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

type FilterTab = "all" | "red" | "amber" | "green";

export default function DataQualityScorecardPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const filteredPrograms = PROGRAM_QUALITY.filter((p) => {
    if (filterTab === "all") return true;
    return p.status === filterTab;
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Data Trust"
          title="Data Quality Scorecard"
          subtitle="Integrity of the platform's development data — the foundation of recruiting credibility"
        />

        {/* ── Section 1: KPI Cards ── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPI_CARDS.map((card) => {
              const color = statusColor(card.status);
              const pct = card.value;
              return (
                <div
                  key={card.label}
                  className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3"
                >
                  <p className="text-[12px] text-[var(--text-muted)] font-medium leading-snug">{card.label}</p>
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-[32px] font-bold leading-none" style={{ color }}>
                        {card.value}
                      </span>
                      <span className="text-[14px] text-[var(--text-muted)] mb-0.5">{card.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <svg width="100%" height="4" viewBox="0 0 100 4">
                        <rect width="100" height="4" fill="oklch(0.25 0.01 260)" rx="2" />
                        <rect width={pct} height="4" fill={color} rx="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Target: {card.target}{card.unit}</span>
                    {card.note && (
                      <span className="font-semibold" style={{ color: SUCCESS }}>
                        {card.note}
                      </span>
                    )}
                    <span
                      className="font-semibold capitalize px-2 py-0.5 rounded-full"
                      style={{
                        color,
                        background: `${color.replace(")", " / 0.12)")}`,
                      }}
                    >
                      {card.status === "success" ? "✓ On track" : "↓ Below"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 2: Inflation Detector ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Skill Score Distribution — Inflation Monitor
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Comparing this month's score distribution to last quarter. Right-shift indicates inflation.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 space-y-6">
            <ScoreDistributionChart />

            {/* Inflation alert */}
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: DANGER,
                background: `${DANGER.replace(")", " / 0.06)")}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: DANGER, background: `${DANGER.replace(")", " / 0.12)")}` }}
                >
                  Inflation Alert
                </span>
                <span className="text-[13px] text-[var(--text-muted)]">
                  3 programs with avg delta &gt; 1.5 points in a single cycle
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px]">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 px-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Program</th>
                      <th className="text-center py-2 px-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Avg Delta</th>
                      <th className="text-center py-2 px-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Cycles</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {INFLATION_PROGRAMS.map((p) => (
                      <tr key={p.name} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2.5 px-3 text-[13px] text-[var(--text-primary)] font-medium">{p.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-[13px]" style={{ color: DANGER }}>
                            +{p.avgDelta.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[13px] text-[var(--text-muted)]">{p.cycles}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => toast.info(`Opening investigation for ${p.name}`)}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-80"
                            style={{
                              background: `${DANGER.replace(")", " / 0.12)")}`,
                              color: DANGER,
                            }}
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[12px] text-[var(--text-muted)] mt-3 italic">
                Score inflation without corresponding VDV increase signals grade inflating, which destroys recruiting profile credibility.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Program Quality Scorecard ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Program Quality Scores</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Sorted by composite score ascending. Worst performers shown first.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              { id: "all",   label: "All" },
              { id: "red",   label: "🔴 Critical" },
              { id: "amber", label: "🟡 Amber" },
              { id: "green", label: "🟢 Green" },
            ] as { id: FilterTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={
                  filterTab === tab.id
                    ? { background: PRIMARY, color: "white" }
                    : {
                        background: "var(--bg-surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-[12px] min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  {[
                    "Program Name", "Teams", "Assess", "Verify", "Film", "IDP", "Fresh", "Composite", "Status", "Action"
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((p, i) => {
                  const sc = statusColor(p.status);
                  return (
                    <tr
                      key={p.name}
                      className={`border-b border-[var(--border)] ${i % 2 === 0 ? "bg-[var(--bg-base)]" : ""}`}
                    >
                      <td className="px-3 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{p.name}</td>
                      <td className="px-3 py-3 text-[var(--text-muted)] text-center">{p.teams}</td>

                      {/* Mini bar cells */}
                      {([
                        p.assessDensity, p.verifyRate, p.filmCorr, p.idpComp, p.dataFresh
                      ] as number[]).map((val, vi) => (
                        <td key={vi} className="px-3 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-medium text-[var(--text-primary)]">{val}%</span>
                            <MiniBar value={val} />
                          </div>
                        </td>
                      ))}

                      <td className="px-3 py-3">
                        <span className="text-[14px] font-bold" style={{ color: sc }}>{p.composite}</span>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                          style={{
                            color: sc,
                            background: `${sc.replace(")", " / 0.12)")}`,
                          }}
                        >
                          {p.status === "red" ? "Critical" : p.status === "amber" ? "Amber" : "Green"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <button
                          onClick={() =>
                            toast.info(
                              p.status === "red"
                                ? `Assigning CSM to ${p.name}`
                                : `Opening details for ${p.name}`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-75 whitespace-nowrap"
                          style={{
                            background: p.status === "red"
                              ? `${DANGER.replace(")", " / 0.12)")}`
                              : `${PRIMARY.replace(")", " / 0.10)")}`,
                            color: p.status === "red" ? DANGER : PRIMARY,
                          }}
                        >
                          {p.status === "red" ? "Assign CSM" : "View Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Section 4: Film-Assessment Correlation ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Film Corroborates Assessment: Skill-Level Analysis
            </h2>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Skill", "Avg Assessment Score", "Film Clips Tagged", "Corroboration", "Trend"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FILM_SKILLS.map((row, i) => {
                    const corr = corrLabel(row.corroboration);
                    return (
                      <tr
                        key={row.skill}
                        className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "bg-[var(--bg-base)]" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.skill}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">{row.avgScore.toFixed(1)}</span>
                            <svg width="40" height="6" viewBox="0 0 40 6">
                              <rect width="40" height="6" fill="oklch(0.25 0.01 260)" rx="3" />
                              <rect width={row.avgScore * 4} height="6" fill={PRIMARY} fillOpacity="0.75" rx="3" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{row.clipsTagged}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold" style={{ color: corr.color }}>{corr.text}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[14px]" style={{ color: trendColor(row.trend) }}>
                            {trendIcon(row.trend)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-base)]">
              <p className="text-[12px] text-[var(--text-muted)] italic max-w-2xl">
                When film evidence matches assessment scores, recruiter trust increases. When they diverge, it signals either inconsistent coaching or unmeasured growth.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 5: Observation Quality ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Coach Observation Specificity
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Specific observations reference a skill category. Generic ones don't. Current: 62% specific. Target: 75%.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Donut */}
              <div className="shrink-0">
                <ObservationDonut />
                <p className="text-[11px] text-[var(--text-muted)] text-center mt-2">
                  Current vs 75% target
                </p>
              </div>

              {/* Examples */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Generic */}
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <div
                      className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ background: `${DANGER.replace(")", " / 0.10)")}`, color: DANGER }}
                    >
                      Generic (low quality)
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        "Good effort today.",
                        "Needs to work harder.",
                        "Great game, keep it up.",
                      ].map((ex) => (
                        <div
                          key={ex}
                          className="text-[12px] text-[var(--text-muted)] px-3 py-2 rounded-lg italic"
                          style={{ background: "var(--bg-base)" }}
                        >
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specific */}
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <div
                      className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ background: `${SUCCESS.replace(")", " / 0.10)")}`, color: SUCCESS }}
                    >
                      Specific (high quality)
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        "Ball handling: crossover improved, still telegraphing behind-the-back.",
                        "Finishing: showed soft touch on right-hand layup vs drop step.",
                        "Defensive stance: hips too high off screen on pick-and-roll coverage.",
                      ].map((ex) => (
                        <div
                          key={ex}
                          className="text-[12px] text-[var(--text-muted)] px-3 py-2 rounded-lg italic"
                          style={{ background: "var(--bg-base)" }}
                        >
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[12px] text-[var(--text-muted)] mt-4 italic">
                  Generic observations reduce the predictive value of the coaching record for development analysis.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
