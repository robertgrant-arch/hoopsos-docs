/**
 * WarningMetricsDashboardPage — Product team's early warning system.
 * Route: /app/analytics/warnings
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

type Severity = "critical" | "monitoring" | "healthy";

interface GhostingProgram {
  name: string;
  daysSinceLogin: number;
  renewalDate: string;
}

interface FilmDecliningProgram {
  name: string;
  correlation: number;
}

interface SingleCoachProgram {
  name: string;
  dependencyPct: number;
}

interface HealthMetric {
  label: string;
  current: string | number;
  threshold: string | number;
  unit?: string;
}

interface WeeklyWarning {
  week: number;
  count: number;
  annotation?: string;
}

const GHOSTING_PROGRAMS: GhostingProgram[] = [
  { name: "Desert Storm AAU",    daysSinceLogin: 52, renewalDate: "Jun 15, 2026" },
  { name: "Midwest Prep Hoops",  daysSinceLogin: 47, renewalDate: "Jul 3, 2026"  },
];

const FILM_DECLINING_PROGRAMS: FilmDecliningProgram[] = [
  { name: "Capital Elite",        correlation: 0.28 },
  { name: "Premier Hoops 17U",    correlation: 0.34 },
  { name: "Elevation Basketball", correlation: 0.38 },
];

const SINGLE_COACH_PROGRAMS: SingleCoachProgram[] = [
  { name: "Northeast Prospects",   dependencyPct: 94 },
  { name: "Academy Hoops Co.",     dependencyPct: 88 },
  { name: "Coastal Ballers",       dependencyPct: 81 },
  { name: "Legacy Elite Program",  dependencyPct: 78 },
  { name: "Rocky Mountain Select", dependencyPct: 77 },
  { name: "Southeast Development", dependencyPct: 76 },
  { name: "Pacific Elite Hoops",   dependencyPct: 76 },
  { name: "Desert Storm AAU",      dependencyPct: 75 },
];

const HEALTHY_METRICS: HealthMetric[] = [
  { label: "Avg session length",               current: "22 min",    threshold: "> 10 min" },
  { label: "Assessment completion on schedule", current: "78%",       threshold: "> 60%" },
  { label: "Recruiter platform DAU",            current: 142,         threshold: "> 100" },
  { label: "Parent portal open rate",           current: "61%",       threshold: "> 50%" },
  { label: "IDP generation rate",               current: "52%",       threshold: "> 40%" },
  { label: "Film upload latency (median)",      current: "2.1 days",  threshold: "< 7 days" },
  { label: "Email deliverability",              current: "98.2%",     threshold: "> 95%" },
  { label: "API p95 latency",                   current: "184 ms",    threshold: "< 500 ms" },
  { label: "Mobile crash-free session rate",    current: "99.4%",     threshold: "> 99%" },
  { label: "Stripe webhook success rate",       current: "99.8%",     threshold: "> 99%" },
  { label: "Player profile completion avg",     current: "71%",       threshold: "> 60%" },
  { label: "Recruiter access acceptance rate",  current: "74%",       threshold: "> 65%" },
];

const WARNING_TREND: WeeklyWarning[] = [
  { week: 1,  count: 4 },
  { week: 2,  count: 3 },
  { week: 3,  count: 5 },
  { week: 4,  count: 4 },
  { week: 5,  count: 3 },
  { week: 6,  count: 9, annotation: "Score import batch error — resolved" },
  { week: 7,  count: 6 },
  { week: 8,  count: 5 },
  { week: 9,  count: 5 },
  { week: 10, count: 4 },
  { week: 11, count: 5 },
  { week: 12, count: 5 },
];

interface AlertThreshold {
  warning: string;
  currentThreshold: string;
  currentValue: string;
  status: "critical" | "monitoring" | "healthy";
  editable: boolean;
}

const INITIAL_THRESHOLDS: AlertThreshold[] = [
  { warning: "Score Inflation",          currentThreshold: "> 1.2 delta / cycle", currentValue: "1.8 delta",   status: "critical",   editable: true },
  { warning: "Director Ghosting",        currentThreshold: "45+ days no login",   currentValue: "52 days",     status: "critical",   editable: true },
  { warning: "Film-Assess Decoupling",   currentThreshold: "Correlation < 0.40",  currentValue: "0.41",        status: "monitoring", editable: true },
  { warning: "Recruiter Response Time",  currentThreshold: "> 72 hours median",   currentValue: "58 hours",    status: "monitoring", editable: true },
  { warning: "Single-Coach Dependency",  currentThreshold: "> 75% one coach",     currentValue: "8 programs",  status: "monitoring", editable: true },
  { warning: "Assessment Verification",  currentThreshold: "< 75% verify rate",   currentValue: "81%",         status: "healthy",    editable: true },
  { warning: "Data Freshness",           currentThreshold: "< 60% programs 30d",  currentValue: "68%",         status: "healthy",    editable: true },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function severityColor(s: Severity | AlertThreshold["status"]): string {
  if (s === "critical")   return DANGER;
  if (s === "monitoring") return WARNING;
  return SUCCESS;
}

function severityLabel(s: Severity): string {
  if (s === "critical")   return "CRITICAL";
  if (s === "monitoring") return "MONITORING";
  return "HEALTHY";
}

/* -------------------------------------------------------------------------- */
/* Warning Card                                                                */
/* -------------------------------------------------------------------------- */

interface WarningCardProps {
  severity: "critical" | "monitoring";
  title: string;
  children: React.ReactNode;
}

function WarningCard({ severity, title, children }: WarningCardProps) {
  const color = severityColor(severity);
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
      style={{ borderLeftColor: color, borderLeftWidth: "4px" }}
    >
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
          style={{ color, background: `${color.replace(")", " / 0.12)")}` }}
        >
          {severityLabel(severity)}
        </span>
        <h3 className="font-semibold text-[var(--text-primary)] text-[14px]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Warning trend line chart                                                    */
/* -------------------------------------------------------------------------- */

function WarningTrendChart() {
  const W = 560;
  const H = 140;
  const PAD_L = 28;
  const PAD_B = 28;
  const PAD_T = 16;
  const chartW = W - PAD_L - 12;
  const chartH = H - PAD_B - PAD_T;
  const maxCount = Math.max(...WARNING_TREND.map((w) => w.count));
  const stepX = chartW / (WARNING_TREND.length - 1);

  const points = WARNING_TREND.map((w, i) => {
    const x = PAD_L + i * stepX;
    const y = PAD_T + chartH - (w.count / (maxCount + 1)) * chartH;
    return { x, y, ...w };
  });

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Goal line at 2
  const goalY = PAD_T + chartH - (2 / (maxCount + 1)) * chartH;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full max-w-[600px]" aria-label="Warning count trend over 12 weeks">
        {/* Grid lines */}
        {[0, 3, 6, 9].map((v) => {
          const y = PAD_T + chartH - (v / (maxCount + 1)) * chartH;
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={W - 12} y2={y} stroke="oklch(0.30 0.01 260)" strokeWidth="0.5" />
              <text x={PAD_L - 4} y={y + 3} textAnchor="end" fill="oklch(0.55 0.02 260)" fontSize="8">{v}</text>
            </g>
          );
        })}

        {/* Goal line */}
        <line x1={PAD_L} y1={goalY} x2={W - 12} y2={goalY} stroke={SUCCESS} strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.5" />
        <text x={W - 14} y={goalY - 3} textAnchor="end" fill={SUCCESS} fontSize="8" opacity="0.7">Goal: 2</text>

        {/* Area fill */}
        <polygon
          points={`${PAD_L},${PAD_T + chartH} ${polyPoints} ${PAD_L + (WARNING_TREND.length - 1) * stepX},${PAD_T + chartH}`}
          fill={WARNING}
          fillOpacity="0.08"
        />

        {/* Line */}
        <polyline points={polyPoints} fill="none" stroke={WARNING} strokeWidth="2" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p) => (
          <circle key={p.week} cx={p.x} cy={p.y} r="3.5" fill={p.count >= 7 ? DANGER : WARNING} stroke="oklch(0.15 0.01 260)" strokeWidth="1.5" />
        ))}

        {/* Spike annotation */}
        {(() => {
          const spike = points.find((p) => p.week === 6)!;
          return (
            <g>
              <line x1={spike.x} y1={spike.y - 6} x2={spike.x} y2={PAD_T + 2} stroke={DANGER} strokeWidth="1" strokeDasharray="3 2" />
              <text x={spike.x + 4} y={PAD_T + 10} fill={DANGER} fontSize="8" fontWeight="600">
                Score import batch error
              </text>
              <text x={spike.x + 4} y={PAD_T + 19} fill="oklch(0.55 0.02 260)" fontSize="7.5">
                — resolved
              </text>
            </g>
          );
        })()}

        {/* X axis labels */}
        {points.map((p) => (
          <text key={p.week} x={p.x} y={H + 10} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
            W{p.week}
          </text>
        ))}
        <text x={W / 2} y={H + 22} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="8">
          Past 12 weeks
        </text>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function WarningMetricsDashboardPage() {
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [thresholdExpanded, setThresholdExpanded] = useState(false);
  const [thresholds, setThresholds] = useState(INITIAL_THRESHOLDS);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleSaveThreshold(idx: number) {
    setThresholds((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, currentThreshold: editValue } : t))
    );
    setEditingIdx(null);
    toast.success("Threshold updated. Changes take effect at next hourly check.");
  }

  function handleStartEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(thresholds[idx].currentThreshold);
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Risk Monitoring"
          title="Warning Metrics"
          subtitle="Early signals of product failure — act before they show in churn"
          actions={
            <button
              onClick={() => toast.info("Alert configuration panel opening...")}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{ background: PRIMARY, color: "white" }}
            >
              Configure Alerts
            </button>
          }
        />

        {/* ── Section 1: Summary strip ── */}
        <section>
          <div
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4 flex flex-wrap items-center gap-4 sm:gap-8"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: `${DANGER.replace(")", " / 0.15)")}`, color: DANGER }}
              >
                2
              </div>
              <span className="text-[13px] font-semibold" style={{ color: DANGER }}>🔴 Critical</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
              >
                3
              </div>
              <span className="text-[13px] font-semibold" style={{ color: WARNING }}>🟡 Monitoring</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
              >
                12
              </div>
              <span className="text-[13px] font-semibold" style={{ color: SUCCESS }}>🟢 Healthy</span>
            </div>
            <div className="ml-auto text-[12px] text-[var(--text-muted)]">
              Last checked: <span className="font-medium text-[var(--text-primary)]">6 minutes ago</span>
            </div>
          </div>
        </section>

        {/* ── Section 2: Active warnings ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Warnings</h2>

          {/* Warning 1 — Inflation */}
          <WarningCard severity="critical" title="Score Inflation Detected — 3 Programs">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">Avg delta</div>
                  <div className="text-[22px] font-bold" style={{ color: DANGER }}>1.8 pts</div>
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">Threshold</div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">&gt; 1.2</div>
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">Affected</div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">3</div>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">
                  Affected programs
                </p>
                <p className="text-[13px] text-[var(--text-primary)]">
                  Elevation Basketball · Premier Hoops 17U · Capital Elite
                </p>
              </div>

              <div
                className="rounded-xl p-3 text-[12px]"
                style={{ background: `${DANGER.replace(")", " / 0.06)")}` }}
              >
                <p className="font-semibold text-[var(--text-primary)] mb-1">Recommended action</p>
                <p className="text-[var(--text-muted)]">
                  Contact CSM for each program — review with coach whether scores reflect genuine improvement
                  or grade inflation. Schedule calibration session.
                </p>
                <p className="mt-2 font-semibold" style={{ color: DANGER }}>
                  CRITICAL — Score inflation visible to recruiters destroys platform credibility.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {["Mark as Investigating", "Dismiss with Note", "Assign to CSM"].map((label) => (
                  <button
                    key={label}
                    onClick={() => toast.info(`Action: ${label}`)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                    style={
                      label === "Assign to CSM"
                        ? { background: DANGER, color: "white" }
                        : {
                            background: "var(--bg-base)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </WarningCard>

          {/* Warning 2 — Director Ghosting */}
          <WarningCard severity="critical" title="Director Ghosting — 2 Programs at Churn Risk">
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--text-muted)]">
                2 directors have not logged in for 45+ days while in-season. Historically, this precedes churn within 60 days.
              </p>

              <div className="space-y-2">
                {GHOSTING_PROGRAMS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between bg-[var(--bg-base)] rounded-xl px-4 py-3 gap-4"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">{p.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Renewal: {p.renewalDate}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[20px] font-bold" style={{ color: DANGER }}>
                        {p.daysSinceLogin}d
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">since login</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toast.success("Re-engagement sequence triggered for 2 directors.")}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{ background: DANGER, color: "white" }}
                >
                  Send re-engagement sequence
                </button>
                <button
                  onClick={() => toast.info("Dismissed with note.")}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Dismiss with Note
                </button>
              </div>
            </div>
          </WarningCard>

          {/* Warning 3 — Film-Assessment Decoupling */}
          <WarningCard severity="monitoring" title="Film-Assessment Decoupling — Approaching Boundary">
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-0.5">Current correlation</div>
                  <div className="text-[28px] font-bold" style={{ color: WARNING }}>0.41</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-0.5">Threshold</div>
                  <div className="text-[28px] font-bold text-[var(--text-primary)]">0.40</div>
                </div>
                <div className="flex-1">
                  <svg width="100%" height="10" viewBox="0 0 200 10">
                    <rect width="200" height="10" fill="oklch(0.25 0.01 260)" rx="5" />
                    <rect width={0.41 * 200} height="10" fill={WARNING} rx="5" />
                    {/* threshold marker */}
                    <rect x={0.40 * 200 - 1} y="0" width="2" height="10" fill={DANGER} />
                  </svg>
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-0.5">
                    <span>0.0</span>
                    <span style={{ color: DANGER }}>0.40 threshold</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-[var(--text-muted)]">
                Approaching the boundary where recruiting profiles become untrustworthy. Programs with lowest correlation:
              </p>

              <div className="space-y-1.5">
                {FILM_DECLINING_PROGRAMS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between bg-[var(--bg-base)] rounded-lg px-4 py-2.5"
                  >
                    <span className="text-[13px] text-[var(--text-primary)]">{p.name}</span>
                    <span className="font-bold text-[13px]" style={{ color: p.correlation < 0.35 ? DANGER : WARNING }}>
                      {p.correlation.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("Marked as investigating.")}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
                >
                  Mark as Investigating
                </button>
              </div>
            </div>
          </WarningCard>

          {/* Warning 4 — Recruiter Response Time */}
          <WarningCard severity="monitoring" title="Recruiter Request Ghosting — Median Response Approaching Limit">
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-0.5">Median response time</div>
                  <div className="text-[28px] font-bold" style={{ color: WARNING }}>58 hrs</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-0.5">Alert threshold</div>
                  <div className="text-[28px] font-bold text-[var(--text-primary)]">72 hrs</div>
                </div>
              </div>

              <p className="text-[13px] text-[var(--text-muted)]">
                If families stop responding to access requests, college coaches will stop using the platform.
                Response rates have been trending up 3 hours/week for the past 4 weeks.
              </p>

              <div className="rounded-xl p-3" style={{ background: `${WARNING.replace(")", " / 0.06)")}` }}>
                <p className="text-[12px] font-semibold" style={{ color: WARNING }}>
                  At current trajectory, we breach 72hr threshold in ~2 weeks.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("Scheduled family nudge campaign for 3 pending requests.")}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
                >
                  Schedule family nudge campaign
                </button>
              </div>
            </div>
          </WarningCard>

          {/* Warning 5 — Single-Coach Dependency */}
          <WarningCard severity="monitoring" title="Single-Coach Dependency — 8 Programs at Risk">
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--text-muted)]">
                8 programs where one coach accounts for &gt; 75% of all assessments. If that coach leaves,
                the program's data goes sparse immediately — putting both development tracking and recruiting profiles at risk.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SINGLE_COACH_PROGRAMS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between bg-[var(--bg-base)] rounded-lg px-3 py-2.5"
                  >
                    <span className="text-[12px] text-[var(--text-primary)]">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <svg width="48" height="6" viewBox="0 0 48 6">
                        <rect width="48" height="6" fill="oklch(0.25 0.01 260)" rx="3" />
                        <rect width={p.dependencyPct * 0.48} height="6" fill={p.dependencyPct >= 90 ? DANGER : WARNING} rx="3" />
                      </svg>
                      <span className="font-bold text-[12px]" style={{ color: p.dependencyPct >= 90 ? DANGER : WARNING }}>
                        {p.dependencyPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("CSM task list generated for 8 programs.")}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
                >
                  Generate CSM task list
                </button>
              </div>
            </div>
          </WarningCard>
        </section>

        {/* ── Section 3: Healthy metrics accordion ── */}
        <section>
          <button
            onClick={() => setHealthExpanded((p) => !p)}
            className="w-full flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-left transition-colors hover:bg-[var(--bg-base)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
              >
                12
              </div>
              <span className="font-semibold text-[var(--text-primary)]">
                12 metrics currently healthy. Click to expand.
              </span>
            </div>
            <span className="text-[var(--text-muted)] text-[18px]">{healthExpanded ? "▲" : "▼"}</span>
          </button>

          {healthExpanded && (
            <div className="mt-2 rounded-2xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Metric</th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Current</th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Threshold</th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {HEALTHY_METRICS.map((m, i) => (
                    <tr
                      key={m.label}
                      className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "bg-[var(--bg-base)]" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-[var(--text-primary)]">{m.label}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-[var(--text-primary)]">{m.current}</td>
                      <td className="px-4 py-2.5 text-center text-[var(--text-muted)]">{m.threshold}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: SUCCESS, background: `${SUCCESS.replace(")", " / 0.12)")}` }}
                        >
                          ✓ Healthy
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 4: Warning trend chart ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Warning Count — 12 Week Trend</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Goal is trending down. A spike at Week 6 was caused by a score import batch error — now resolved.
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <WarningTrendChart />
          </div>
        </section>

        {/* ── Section 5: Configure thresholds ── */}
        <section>
          <button
            onClick={() => setThresholdExpanded((p) => !p)}
            className="w-full flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-left transition-colors hover:bg-[var(--bg-base)]"
          >
            <div>
              <span className="font-semibold text-[var(--text-primary)]">Configure Alert Thresholds</span>
              <span className="ml-2 text-[12px] text-[var(--text-muted)]">— edit threshold values for each warning</span>
            </div>
            <span className="text-[var(--text-muted)] text-[18px]">{thresholdExpanded ? "▲" : "▼"}</span>
          </button>

          {thresholdExpanded && (
            <div className="mt-2 rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[640px]">
                  <thead>
                    <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                      {["Warning", "Current Threshold", "Current Value", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((t, i) => {
                      const color = severityColor(t.status);
                      const isEditing = editingIdx === i;
                      return (
                        <tr key={t.warning} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "bg-[var(--bg-base)]" : ""}`}>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{t.warning}</td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-2 py-1 rounded-lg text-[12px] bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[oklch(0.72_0.18_290)]"
                                autoFocus
                              />
                            ) : (
                              <span className="text-[var(--text-muted)]">{t.currentThreshold}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color }}>{t.currentValue}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                              style={{ color, background: `${color.replace(")", " / 0.12)")}` }}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveThreshold(i)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                                  style={{ background: PRIMARY, color: "white" }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingIdx(null)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-muted)]"
                                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(i)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-base)]">
                <p className="text-[12px] text-[var(--text-muted)] italic">
                  Changes take effect at next hourly check.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
