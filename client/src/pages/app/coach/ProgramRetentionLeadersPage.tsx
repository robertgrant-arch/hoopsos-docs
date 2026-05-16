/**
 * ProgramRetentionLeadersPage — /app/coach/retention-leaders
 *
 * Identifies which of the coach's players are most engaged and at risk of
 * leaving the program. Feeds into retention strategy.
 *
 * Sections:
 *   1. Retention health summary (3 large stat cards)
 *   2. Engagement signal table (all players, risk flags, "Take action" modal)
 *   3. At-Risk Action Modal (sparkline, risk signals, actions, log)
 *   4. Multi-season retention tracking (season-over-season commitment view)
 */
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  MessageSquare,
  ClipboardList,
  Film,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Save,
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock data
// ─────────────────────────────────────────────────────────────────────────────

type RiskFlag = "engaged" | "drifting" | "at_risk";
type IDPStatus = "on_track" | "behind";
type CoachabilityTrend = "up" | "down" | "flat";

interface RiskSignal {
  message: string;
  severity: "warning" | "critical";
}

interface PlayerEngagement {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  attendanceRate: number;          // 0–100 last 30 days
  idpStatus: IDPStatus;
  filmSessions: number;
  daysSinceCoachInteraction: number;
  coachability: number;            // 0–10
  coachabilityTrend: CoachabilityTrend;
  riskFlag: RiskFlag;
  // Sparkline: attendance % last 8 weeks
  attendanceHistory: number[];
  riskSignals: RiskSignal[];
  season: number;                  // 1 = first season, 2+ = returning
  priorSeasonCoachability?: number;
  priorSeasonAttendance?: number;
}

const PLAYERS: PlayerEngagement[] = [
  {
    id: "p01",
    name: "Malik Henderson",
    position: "PG",
    gradYear: 2027,
    attendanceRate: 96,
    idpStatus: "on_track",
    filmSessions: 8,
    daysSinceCoachInteraction: 1,
    coachability: 8.7,
    coachabilityTrend: "up",
    riskFlag: "engaged",
    attendanceHistory: [95, 97, 96, 98, 96, 95, 97, 96],
    riskSignals: [],
    season: 3,
    priorSeasonCoachability: 8.1,
    priorSeasonAttendance: 92,
  },
  {
    id: "p02",
    name: "Jordan Wells",
    position: "SG",
    gradYear: 2027,
    attendanceRate: 94,
    idpStatus: "on_track",
    filmSessions: 6,
    daysSinceCoachInteraction: 2,
    coachability: 8.2,
    coachabilityTrend: "flat",
    riskFlag: "engaged",
    attendanceHistory: [92, 94, 95, 93, 94, 95, 93, 94],
    riskSignals: [],
    season: 2,
    priorSeasonCoachability: 7.9,
    priorSeasonAttendance: 89,
  },
  {
    id: "p08",
    name: "Camden Rivera",
    position: "SF",
    gradYear: 2026,
    attendanceRate: 91,
    idpStatus: "on_track",
    filmSessions: 7,
    daysSinceCoachInteraction: 1,
    coachability: 8.9,
    coachabilityTrend: "up",
    riskFlag: "engaged",
    attendanceHistory: [89, 90, 91, 92, 90, 91, 92, 91],
    riskSignals: [],
    season: 2,
    priorSeasonCoachability: 8.3,
    priorSeasonAttendance: 85,
  },
  {
    id: "p04",
    name: "Theo Barnett",
    position: "PF",
    gradYear: 2028,
    attendanceRate: 85,
    idpStatus: "on_track",
    filmSessions: 5,
    daysSinceCoachInteraction: 4,
    coachability: 7.8,
    coachabilityTrend: "up",
    riskFlag: "engaged",
    attendanceHistory: [82, 84, 85, 86, 84, 85, 86, 85],
    riskSignals: [],
    season: 1,
  },
  {
    id: "p03",
    name: "Darius Cole",
    position: "SF",
    gradYear: 2027,
    attendanceRate: 80,
    idpStatus: "behind",
    filmSessions: 4,
    daysSinceCoachInteraction: 7,
    coachability: 7.4,
    coachabilityTrend: "down",
    riskFlag: "drifting",
    attendanceHistory: [89, 87, 84, 83, 81, 80, 79, 80],
    riskSignals: [
      { message: "Attendance has dropped from 89% to 80% in 6 weeks", severity: "warning" },
      { message: "IDP progress stalled — no activity in 2 weeks",     severity: "warning" },
    ],
    season: 1,
  },
  {
    id: "p05",
    name: "Marcus Freeman",
    position: "C",
    gradYear: 2026,
    attendanceRate: 77,
    idpStatus: "on_track",
    filmSessions: 3,
    daysSinceCoachInteraction: 9,
    coachability: 7.1,
    coachabilityTrend: "down",
    riskFlag: "drifting",
    attendanceHistory: [85, 83, 81, 80, 78, 77, 76, 77],
    riskSignals: [
      { message: "Attendance declining for 5 consecutive weeks", severity: "warning" },
      { message: "Last coach interaction was 9 days ago",        severity: "warning" },
    ],
    season: 2,
    priorSeasonCoachability: 7.8,
    priorSeasonAttendance: 88,
  },
  {
    id: "p06",
    name: "Quincy Okafor",
    position: "PG",
    gradYear: 2028,
    attendanceRate: 64,
    idpStatus: "behind",
    filmSessions: 2,
    daysSinceCoachInteraction: 18,
    coachability: 6.4,
    coachabilityTrend: "down",
    riskFlag: "at_risk",
    attendanceHistory: [91, 85, 78, 72, 68, 64, 61, 64],
    riskSignals: [
      { message: "Attendance dropped from 91% to 64% in 4 weeks", severity: "critical" },
      { message: "No IDP activity in 3 weeks",                    severity: "critical" },
      { message: "Last coach interaction was 18 days ago",         severity: "warning"  },
    ],
    season: 1,
  },
  {
    id: "p07",
    name: "Elijah Torres",
    position: "SG",
    gradYear: 2027,
    attendanceRate: 58,
    idpStatus: "behind",
    filmSessions: 1,
    daysSinceCoachInteraction: 22,
    coachability: 6.1,
    coachabilityTrend: "down",
    riskFlag: "at_risk",
    attendanceHistory: [88, 82, 76, 70, 65, 60, 56, 58],
    riskSignals: [
      { message: "Attendance collapsed from 88% to 58% in 5 weeks", severity: "critical" },
      { message: "Film sessions: only 1 this season",               severity: "warning"  },
      { message: "No IDP activity in 4 weeks",                      severity: "critical" },
      { message: "Last coach interaction was 22 days ago",           severity: "critical" },
    ],
    season: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Risk flag config
// ─────────────────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskFlag, { label: string; color: string; dot: string }> = {
  engaged: { label: "Engaged",  color: C.success, dot: "🟢" },
  drifting:{ label: "Drifting", color: C.warning, dot: "🟡" },
  at_risk: { label: "At Risk",  color: C.danger,  dot: "🔴" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Retention Health Summary
// ─────────────────────────────────────────────────────────────────────────────

function RetentionSummary() {
  const total    = PLAYERS.length;
  const engaged  = PLAYERS.filter((p) => p.riskFlag === "engaged").length;
  const drifting = PLAYERS.filter((p) => p.riskFlag === "drifting").length;
  const atRisk   = PLAYERS.filter((p) => p.riskFlag === "at_risk").length;

  const cards = [
    {
      label:    "Strong Engagement",
      sub:      "Coachability > 8.0 · Attendance > 90%",
      value:    engaged,
      pct:      Math.round((engaged / total) * 100),
      color:    C.success,
      icon:     "✓",
    },
    {
      label:    "Moderate Risk",
      sub:      "Coachability 6.5–8.0 · Attendance 75–90%",
      value:    drifting,
      pct:      Math.round((drifting / total) * 100),
      color:    C.warning,
      icon:     "~",
    },
    {
      label:    "At Risk",
      sub:      "Coachability < 6.5 or Attendance < 75%",
      value:    atRisk,
      pct:      Math.round((atRisk / total) * 100),
      color:    C.danger,
      icon:     "!",
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border p-5 flex flex-col gap-3"
          style={{
            borderColor: `${card.color.replace(")", " / 0.30)")}`,
            background:  `${card.color.replace(")", " / 0.05)")}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold text-[var(--text-muted)]">{card.label}</div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[15px]"
              style={{ background: `${card.color.replace(")", " / 0.15)")}`, color: card.color }}
            >
              {card.icon}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-bold text-[42px] leading-none font-mono" style={{ color: card.color }}>
              {card.value}
            </span>
            <span className="text-[14px] text-[var(--text-muted)] mb-1">
              players · {card.pct}%
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{card.sub}</div>
          {/* Proportion bar */}
          <div className="h-1.5 rounded-full bg-[var(--bg-base)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${card.pct}%`, background: card.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Engagement Signal Table
// ─────────────────────────────────────────────────────────────────────────────

function AttendanceBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? C.success : rate >= 75 ? C.warning : C.danger;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 rounded-full bg-[var(--bg-base)] w-16">
        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="font-mono text-[12px] font-semibold" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
}

function CoachabilityCell({ score, trend }: { score: number; trend: CoachabilityTrend }) {
  const color = score >= 8 ? C.success : score >= 7 ? C.warning : C.danger;
  const Icon  = trend === "up" ? ChevronUp : trend === "down" ? ChevronDown : Minus;
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono font-bold text-[14px]" style={{ color }}>{score.toFixed(1)}</span>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
  );
}

function EngagementTable({ onActionClick }: { onActionClick: (p: PlayerEngagement) => void }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Engagement Signal Overview</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Real-time engagement health across your roster. Click "Take Action" on at-risk players.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.8fr_60px_60px_100px_90px_70px_80px_100px_100px] gap-2 px-4 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
          {[
            "Player", "Pos", "Grad", "Attendance", "IDP", "Film",
            "Last Contact", "Coachability", "Risk",
          ].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-[var(--border)]">
          {PLAYERS.map((p) => {
            const rf  = RISK_CONFIG[p.riskFlag];
            const isAtRisk = p.riskFlag === "at_risk";
            return (
              <div
                key={p.id}
                className="grid grid-cols-[1.8fr_60px_60px_100px_90px_70px_80px_100px_100px] gap-2 px-4 py-3 items-center"
                style={isAtRisk ? { background: `${C.danger.replace(")", " / 0.04)")}` } : {}}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{p.name}</span>
                  {p.season > 1 && (
                    <span className="text-[10px] text-[var(--text-muted)]">Season {p.season}</span>
                  )}
                </div>
                <span className="text-[12px] font-mono font-bold text-[var(--text-muted)]">{p.position}</span>
                <span className="text-[12px] text-[var(--text-muted)]">'{String(p.gradYear).slice(2)}</span>
                <AttendanceBar rate={p.attendanceRate} />
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                  style={
                    p.idpStatus === "on_track"
                      ? { background: `${C.success.replace(")", " / 0.12)")}`, color: C.success }
                      : { background: `${C.warning.replace(")", " / 0.12)")}`, color: C.warning }
                  }
                >
                  {p.idpStatus === "on_track" ? "On track" : "Behind"}
                </span>
                <span className="font-mono text-[13px] text-[var(--text-primary)]">{p.filmSessions}</span>
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: p.daysSinceCoachInteraction > 14 ? C.danger : p.daysSinceCoachInteraction > 7 ? C.warning : C.muted }}
                >
                  {p.daysSinceCoachInteraction}d ago
                </span>
                <CoachabilityCell score={p.coachability} trend={p.coachabilityTrend} />
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${rf.color.replace(")", " / 0.12)")}`, color: rf.color }}
                  >
                    {rf.dot} {rf.label}
                  </span>
                  {isAtRisk && (
                    <button
                      onClick={() => onActionClick(p)}
                      className="shrink-0 h-6 px-2 rounded text-[10px] font-bold transition hover:opacity-80"
                      style={{ background: `${C.danger.replace(")", " / 0.15)")}`, color: C.danger }}
                    >
                      Act
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// At-Risk Action Modal
// ─────────────────────────────────────────────────────────────────────────────

function AttendanceSparkline({ history }: { history: number[] }) {
  const W   = 280;
  const H   = 60;
  const PAD = 6;
  const minV = Math.min(...history) - 2;
  const maxV = Math.max(...history) + 2;

  function xPos(i: number): number {
    return PAD + (i / (history.length - 1)) * (W - PAD * 2);
  }

  function yPos(v: number): number {
    return PAD + ((maxV - v) / (maxV - minV)) * (H - PAD * 2);
  }

  const pathD = history
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`)
    .join(" ");

  // Fill under line
  const fillD = `${pathD} L ${xPos(history.length - 1)} ${H} L ${xPos(0)} ${H} Z`;

  const color = history[history.length - 1] < 75 ? C.danger : C.warning;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="Attendance trend">
      <defs>
        <linearGradient id="atRiskGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#atRiskGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Week labels */}
      {history.map((_, i) => (
        <text
          key={i}
          x={xPos(i)}
          y={H}
          textAnchor="middle"
          fontSize={8}
          fill={C.muted}
          fontFamily="inherit"
        >
          W{i + 1}
        </text>
      ))}
    </svg>
  );
}

const ACTION_OPTIONS = [
  { icon: MessageSquare, label: "1-on-1 check-in",         desc: "Schedule a conversation to understand what's happening." },
  { icon: ClipboardList, label: "Adjust IDP goals",        desc: "Simplify or reset development focus to rebuild buy-in." },
  { icon: Bell,          label: "Parent notification",     desc: "Send a flag to the parent/guardian about engagement drop." },
  { icon: Film,          label: "Review film together",    desc: "Invite player to a film session — low-pressure re-engagement." },
];

function AtRiskModal({ player, onClose }: { player: PlayerEngagement; onClose: () => void }) {
  const [logText, setLogText]         = useState("");
  const [savedAction, setSavedAction] = useState(false);

  function handleSave() {
    if (!logText.trim()) {
      toast.error("Please describe the action taken before saving.");
      return;
    }
    setSavedAction(true);
    toast.success(`Action logged for ${player.name}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 0.60)" }}>
      <div
        className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.12em] font-mono mb-0.5"
              style={{ color: C.danger }}
            >
              At-Risk Intervention
            </div>
            <h2 className="font-bold text-[18px] text-[var(--text-primary)]">{player.name}</h2>
            <div className="text-[12px] text-[var(--text-muted)]">
              {player.position} · Class of '{String(player.gradYear).slice(2)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-base)] transition"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Attendance sparkline */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-[var(--text-muted)] mb-3">
              Attendance trend — last 8 weeks
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: `${C.danger.replace(")", " / 0.25)")}`, background: "oklch(0.14 0.005 260)" }}
            >
              <AttendanceSparkline history={player.attendanceHistory} />
            </div>
          </div>

          {/* Risk signals */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-[var(--text-muted)] mb-2">
              Risk signals
            </div>
            <div className="space-y-2">
              {player.riskSignals.map((sig, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                  style={{
                    background: sig.severity === "critical"
                      ? `${C.danger.replace(")", " / 0.08)")}`
                      : `${C.warning.replace(")", " / 0.08)")}`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: sig.severity === "critical" ? C.danger : C.warning }}
                  />
                  <span className="text-[12.5px] text-[var(--text-primary)]">{sig.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested actions */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-[var(--text-muted)] mb-2">
              Suggested actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_OPTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => toast.info(`"${action.label}" selected — log it below after completing`)}
                  className="flex flex-col gap-1.5 p-3 rounded-xl border border-[var(--border)] text-left hover:border-[var(--text-muted)] transition-colors"
                >
                  <action.icon className="w-4 h-4" style={{ color: C.primary }} />
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">{action.label}</span>
                  <span className="text-[10.5px] text-[var(--text-muted)] leading-snug">{action.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Log action */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-[var(--text-muted)] mb-2">
              Log action taken
            </div>
            {savedAction ? (
              <div
                className="rounded-xl border flex items-center gap-2.5 px-4 py-3"
                style={{ borderColor: `${C.success.replace(")", " / 0.30)")}`, background: `${C.success.replace(")", " / 0.08)")}` }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: C.success }} />
                <span className="text-[13px] text-[var(--text-primary)]">Action logged successfully</span>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Describe what you did or plan to do with this player…"
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--text-muted)] transition"
                />
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition hover:brightness-110"
                  style={{ background: C.primary }}
                >
                  <Save className="w-4 h-4" /> Save action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Multi-Season Retention Tracking
// ─────────────────────────────────────────────────────────────────────────────

function SeasonTrendSparkline({ prior, current, color }: { prior: number; current: number; color: string }) {
  const W = 64;
  const H = 28;
  const points: [number, number][] = [
    [0,  H - (prior   / 100) * H + 2],
    [W,  H - (current / 100) * H + 2],
  ];
  const d = `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={points[0][0]} cy={points[0][1]} r={2.5} fill={color} opacity={0.5} />
      <circle cx={points[1][0]} cy={points[1][1]} r={2.5} fill={color} />
    </svg>
  );
}

function MultiSeasonRetention() {
  const returners = PLAYERS.filter((p) => p.season > 1 && p.priorSeasonCoachability !== undefined);

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px] text-[var(--text-primary)]">Season-Over-Season Player Retention</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          For players in their 2nd+ season — are they deepening commitment or coasting?
        </p>
      </div>

      {/* Callout stat */}
      <div
        className="rounded-xl border mb-5 p-4 flex items-center gap-3"
        style={{ borderColor: `${C.primary.replace(")", " / 0.25)")}`, background: `${C.primary.replace(")", " / 0.05)")}` }}
      >
        <TrendingUp className="w-5 h-5 shrink-0" style={{ color: C.primary }} />
        <p className="text-[13px] text-[var(--text-primary)]">
          <strong>Players with 2+ seasons have 23% higher development velocity</strong> — the data compounds. Retaining players year-over-year is one of your highest-leverage coaching decisions.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_60px_80px_100px_100px_100px_120px] gap-3 px-5 py-2.5 bg-[var(--bg-base)] border-b border-[var(--border)]">
          {["Player", "Pos", "Season", "Prev Att%", "Curr Att%", "Coachability Δ", "Commitment"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-[var(--border)]">
          {returners.map((p) => {
            const coachDelta = p.coachability - (p.priorSeasonCoachability ?? p.coachability);
            const attDelta   = p.attendanceRate - (p.priorSeasonAttendance ?? p.attendanceRate);
            const deepening  = coachDelta >= 0 && attDelta >= 0;
            const coasting   = coachDelta < -0.5 || attDelta < -5;
            const trendColor = deepening ? C.success : coasting ? C.danger : C.warning;
            const trendLabel = deepening ? "Deepening" : coasting ? "Coasting" : "Steady";

            return (
              <div key={p.id} className="grid grid-cols-[1.5fr_60px_80px_100px_100px_100px_120px] gap-3 px-5 py-3 items-center">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="text-[12px] font-mono text-[var(--text-muted)]">{p.position}</span>
                <span className="text-[12px] text-[var(--text-muted)]">Year {p.season}</span>

                {/* Prior attendance sparkline */}
                <div className="flex items-center gap-1.5">
                  <SeasonTrendSparkline
                    prior={p.priorSeasonAttendance ?? p.attendanceRate}
                    current={p.attendanceRate}
                    color={trendColor}
                  />
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    {p.priorSeasonAttendance}%
                  </span>
                </div>

                <span className="font-mono font-bold text-[13px]" style={{ color: p.attendanceRate >= 90 ? C.success : p.attendanceRate >= 75 ? C.warning : C.danger }}>
                  {p.attendanceRate}%
                </span>

                {/* Coachability delta */}
                <div className="flex items-center gap-1">
                  {coachDelta >= 0
                    ? <TrendingUp className="w-3.5 h-3.5" style={{ color: C.success }} />
                    : <TrendingDown className="w-3.5 h-3.5" style={{ color: C.danger }} />
                  }
                  <span className="font-mono font-bold text-[13px]" style={{ color: coachDelta >= 0 ? C.success : C.danger }}>
                    {coachDelta >= 0 ? "+" : ""}{coachDelta.toFixed(1)}
                  </span>
                </div>

                {/* Commitment label */}
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit"
                  style={{ background: `${trendColor.replace(")", " / 0.12)")}`, color: trendColor }}
                >
                  {trendLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight box */}
      <div
        className="mt-4 rounded-xl border p-4 flex items-start gap-3"
        style={{ borderColor: `${C.warning.replace(")", " / 0.30)")}`, background: `${C.warning.replace(")", " / 0.05)")}` }}
      >
        <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.warning }} />
        <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">
          <strong>Marcus Freeman (Year 2)</strong> shows declining attendance and coachability vs. last season.
          Long-tenured players who start disengaging can signal burnout or unmet development expectations — worth a deeper 1-on-1.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProgramRetentionLeadersPage() {
  const [activePlayer, setActivePlayer] = useState<PlayerEngagement | null>(null);

  const atRiskCount = useMemo(() => PLAYERS.filter((p) => p.riskFlag === "at_risk").length, []);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto space-y-10">
        <PageHeader
          eyebrow="Program Health"
          title="Retention Leaders & At-Risk Players"
          subtitle="Engagement signals that predict whether players stay or leave the program"
          actions={
            atRiskCount > 0 ? (
              <div
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold"
                style={{ background: `${C.danger.replace(")", " / 0.12)")}`, color: C.danger }}
              >
                <Bell className="w-4 h-4" />
                {atRiskCount} player{atRiskCount !== 1 ? "s" : ""} need attention
              </div>
            ) : undefined
          }
        />

        {/* 1 — Health summary */}
        <RetentionSummary />

        {/* 2 — Engagement table */}
        <EngagementTable onActionClick={setActivePlayer} />

        {/* 3 — Multi-season retention */}
        <MultiSeasonRetention />
      </div>

      {/* At-Risk Modal */}
      {activePlayer && (
        <AtRiskModal
          player={activePlayer}
          onClose={() => setActivePlayer(null)}
        />
      )}
    </AppShell>
  );
}
