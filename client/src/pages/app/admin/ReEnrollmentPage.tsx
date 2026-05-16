/**
 * ReEnrollmentPage — Season retention and re-enrollment management.
 * Route: /app/admin/re-enrollment
 *
 * Intelligence-driven view of who's coming back, who's at risk, and
 * what to do about it — not just a form tracker.
 */
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  Calendar,
  BarChart2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED_FG = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type EnrollmentStatus = "confirmed" | "pending" | "at_risk" | "departed";
type RiskLevel = "high" | "medium";

interface PlayerEnrollment {
  id:              string;
  name:            string;
  ageGroup:        string;
  status:          EnrollmentStatus;
  parentName:      string;
  parentEmail:     string;
  lastContact:     string;
  formSent:        boolean;
  depositPaid:     boolean;
}

interface ChurnRiskPlayer {
  id:        string;
  name:      string;
  ageGroup:  string;
  riskLevel: RiskLevel;
  signals:   string[];
  action:    string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PLAYERS: PlayerEnrollment[] = [
  { id: "p1",  name: "Marcus Williams",  ageGroup: "17U",   status: "confirmed",  parentName: "Keisha Williams",  parentEmail: "keisha@email.com",    lastContact: "2026-05-10", formSent: true,  depositPaid: true  },
  { id: "p2",  name: "Jordan Hayes",     ageGroup: "17U",   status: "confirmed",  parentName: "Leon Hayes",       parentEmail: "leon@email.com",       lastContact: "2026-05-08", formSent: true,  depositPaid: true  },
  { id: "p3",  name: "Devon Clark",      ageGroup: "17U",   status: "confirmed",  parentName: "Brenda Clark",     parentEmail: "brenda@email.com",     lastContact: "2026-05-12", formSent: true,  depositPaid: true  },
  { id: "p4",  name: "Tyler Brooks",     ageGroup: "17U",   status: "pending",    parentName: "Kevin Brooks",     parentEmail: "kevin@email.com",      lastContact: "2026-05-02", formSent: true,  depositPaid: false },
  { id: "p5",  name: "Caleb Torres",     ageGroup: "15U",   status: "confirmed",  parentName: "Michelle Torres",  parentEmail: "michelle@email.com",   lastContact: "2026-05-11", formSent: true,  depositPaid: true  },
  { id: "p6",  name: "Noah Jackson",     ageGroup: "15U",   status: "confirmed",  parentName: "Tamara Jackson",   parentEmail: "tamara@email.com",     lastContact: "2026-05-09", formSent: true,  depositPaid: true  },
  { id: "p7",  name: "Ethan Murphy",     ageGroup: "15U",   status: "confirmed",  parentName: "Greg Murphy",      parentEmail: "greg@email.com",       lastContact: "2026-05-07", formSent: true,  depositPaid: true  },
  { id: "p8",  name: "Isaiah Carter",    ageGroup: "15U",   status: "at_risk",    parentName: "Monica Carter",    parentEmail: "monica@email.com",     lastContact: "2026-04-18", formSent: false, depositPaid: false },
  { id: "p9",  name: "Liam Peterson",    ageGroup: "15U",   status: "confirmed",  parentName: "James Peterson",   parentEmail: "james@email.com",      lastContact: "2026-05-13", formSent: true,  depositPaid: true  },
  { id: "p10", name: "Darius Evans",     ageGroup: "Adult", status: "confirmed",  parentName: "Self",             parentEmail: "darius@email.com",     lastContact: "2026-05-10", formSent: true,  depositPaid: true  },
  { id: "p11", name: "Cameron White",    ageGroup: "Adult", status: "pending",    parentName: "Self",             parentEmail: "cameron@email.com",    lastContact: "2026-05-01", formSent: true,  depositPaid: false },
  { id: "p12", name: "Aiden Ross",       ageGroup: "17U",   status: "at_risk",    parentName: "Patricia Ross",    parentEmail: "patricia@email.com",   lastContact: "2026-04-20", formSent: false, depositPaid: false },
  { id: "p13", name: "Jaylen Foster",    ageGroup: "17U",   status: "departed",   parentName: "Angela Foster",    parentEmail: "angela@email.com",     lastContact: "2026-04-30", formSent: false, depositPaid: false },
  { id: "p14", name: "Kyle Bennett",     ageGroup: "15U",   status: "confirmed",  parentName: "Sandra Bennett",   parentEmail: "sandra@email.com",     lastContact: "2026-05-14", formSent: true,  depositPaid: true  },
];

const CHURN_RISK_PLAYERS: ChurnRiskPlayer[] = [
  {
    id:        "p8",
    name:      "Isaiah Carter",
    ageGroup:  "15U",
    riskLevel: "high",
    signals: [
      "Missed 4 of last 6 practices",
      "No parent app login in 30 days",
      "IDP engagement dropped significantly",
    ],
    action: "Schedule parent call before re-enrollment opens",
  },
  {
    id:        "p12",
    name:      "Aiden Ross",
    ageGroup:  "17U",
    riskLevel: "medium",
    signals: [
      "Missed 2 of last 4 practices",
      "Last check-in was 18 days ago",
    ],
    action: "Send personal note from coach — attendance pattern needs a conversation",
  },
];

const SEASON_RETENTION_DATA = [
  { season: "Spring '25", rate: 78, players: 11 },
  { season: "Fall '25",   rate: 82, players: 13 },
  { season: "Spring '26", rate: 85, players: 12 },
  { season: "Fall '26",   rate: 85, players: 14 },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const STATUS_META: Record<EnrollmentStatus, { label: string; color: string }> = {
  confirmed: { label: "Confirmed",  color: SUCCESS  },
  pending:   { label: "Pending",    color: WARNING  },
  at_risk:   { label: "At Risk",    color: DANGER   },
  departed:  { label: "Departed",   color: MUTED_FG },
};

const RISK_META: Record<RiskLevel, { color: string }> = {
  high:   { color: DANGER  },
  medium: { color: WARNING },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Retention hero                                                              */
/* -------------------------------------------------------------------------- */

function RetentionHero({ players }: { players: PlayerEnrollment[] }) {
  const confirmed = players.filter((p) => p.status === "confirmed").length;
  const likely    = players.filter((p) => p.status === "pending").length;
  const atRisk    = players.filter((p) => p.status === "at_risk").length;
  const departed  = players.filter((p) => p.status === "departed").length;
  const total     = players.length;
  const rate      = Math.round(((confirmed + likely) / (total - departed)) * 100);

  const stats = [
    { label: "Confirmed returning", value: confirmed, color: SUCCESS  },
    { label: "Likely returning",    value: likely,    color: WARNING  },
    { label: "At churn risk",       value: atRisk,    color: DANGER   },
    { label: "Departed",            value: departed,  color: MUTED_FG },
  ];

  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{
        background: `${SUCCESS.replace(")", " / 0.05)")}`,
        borderColor: `${SUCCESS.replace(")", " / 0.25)")}`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: SUCCESS }}>
            Season Retention
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[56px] font-black leading-none" style={{ color: SUCCESS }}>
              {rate}%
            </div>
            <div className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: SUCCESS }}>
              <TrendingUp className="w-4 h-4" />
              +3pp vs last season
            </div>
          </div>
          <div className="text-[13px] mt-1.5" style={{ color: MUTED_FG }}>
            Overall retention rate — Fall 2026
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] font-semibold mb-2" style={{ color: MUTED_FG }}>
              {s.label}
            </div>
            <div className="text-[32px] font-black leading-none" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Churn risk section                                                          */
/* -------------------------------------------------------------------------- */

function ChurnRiskSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-[11px] uppercase tracking-[0.10em] font-semibold" style={{ color: MUTED_FG }}>
          Churn risk signals
        </div>
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${DANGER.replace(")", " / 0.12)")}`, color: DANGER }}
        >
          {CHURN_RISK_PLAYERS.length} players
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CHURN_RISK_PLAYERS.map((player) => {
          const riskColor = RISK_META[player.riskLevel].color;
          return (
            <div
              key={player.id}
              className="rounded-xl border bg-card p-4 space-y-3"
              style={{ borderColor: `${riskColor.replace(")", " / 0.30)")}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-bold">{player.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>{player.ageGroup}</div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.10em] shrink-0"
                  style={{
                    background: `${riskColor.replace(")", " / 0.12)")}`,
                    color: riskColor,
                    border: `1px solid ${riskColor.replace(")", " / 0.28)")}`,
                  }}
                >
                  {player.riskLevel} risk
                </span>
              </div>

              <div className="space-y-1.5">
                {player.signals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: riskColor }} />
                    <span style={{ color: MUTED_FG }}>{signal}</span>
                  </div>
                ))}
              </div>

              <div
                className="rounded-lg px-3 py-2.5 text-[12px] leading-relaxed"
                style={{ background: `${riskColor.replace(")", " / 0.07)")}` }}
              >
                <span className="font-semibold" style={{ color: riskColor }}>Recommended: </span>
                <span style={{ color: MUTED_FG }}>{player.action}</span>
              </div>

              <button
                onClick={() => toast.success(`Outreach logged for ${player.name}`)}
                className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  minHeight: 40,
                  background: `${riskColor.replace(")", " / 0.10)")}`,
                  color: riskColor,
                  border: `1px solid ${riskColor.replace(")", " / 0.25)")}`,
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Log outreach
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Re-enrollment table                                                         */
/* -------------------------------------------------------------------------- */

function EnrollmentTable({ players }: { players: PlayerEnrollment[] }) {
  const [filter, setFilter] = useState<EnrollmentStatus | "all">("all");

  const filtered = filter === "all" ? players : players.filter((p) => p.status === filter);

  const filterOptions: Array<{ value: EnrollmentStatus | "all"; label: string }> = [
    { value: "all",       label: "All"       },
    { value: "confirmed", label: "Confirmed" },
    { value: "pending",   label: "Pending"   },
    { value: "at_risk",   label: "At Risk"   },
    { value: "departed",  label: "Departed"  },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.10em] font-semibold" style={{ color: MUTED_FG }}>
          Re-enrollment status
        </div>
        <div className="flex gap-1.5">
          {filterOptions.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: active ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                  color:      active ? PRIMARY : MUTED_FG,
                  border:     active
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                    : "1px solid oklch(0.22 0.01 260)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Player", "Age", "Status", "Parent", "Last Contact", "Form", "Deposit", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{ color: MUTED_FG }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((player, i) => {
                const meta  = STATUS_META[player.status];
                const isLast = i === filtered.length - 1;
                return (
                  <tr
                    key={player.id}
                    className={`${!isLast ? "border-b border-border" : ""} bg-background hover:bg-card transition-colors`}
                  >
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">{player.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: MUTED_FG }}>{player.ageGroup}</td>
                    <td className="px-3 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                        style={{
                          background: `${meta.color.replace(")", " / 0.12)")}`,
                          color: meta.color,
                          border: `1px solid ${meta.color.replace(")", " / 0.25)")}`,
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: MUTED_FG }}>
                      <span title={player.parentEmail}>{player.parentName}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: MUTED_FG }}>
                      {formatDate(player.lastContact)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {player.formSent
                        ? <CheckCircle2 className="w-4 h-4 inline" style={{ color: SUCCESS }} />
                        : <span style={{ color: MUTED_FG }}>—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {player.depositPaid
                        ? <CheckCircle2 className="w-4 h-4 inline" style={{ color: SUCCESS }} />
                        : <span style={{ color: MUTED_FG }}>—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {player.status !== "departed" && player.status !== "confirmed" && (
                          <button
                            onClick={() => toast.success(`Invite sent to ${player.parentName}`)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                            style={{ background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY, minHeight: 28 }}
                          >
                            Send invite
                          </button>
                        )}
                        {player.status === "pending" && (
                          <button
                            onClick={() => toast.success(`${player.name} marked as confirmed`)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                            style={{ background: `${SUCCESS.replace(")", " / 0.10)")}`, color: SUCCESS, minHeight: 28 }}
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => toast.success(`Note logged for ${player.name}`)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{ background: "oklch(0.18 0.005 260)", color: MUTED_FG, minHeight: 28 }}
                        >
                          Note
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Open/close controls                                                         */
/* -------------------------------------------------------------------------- */

function EnrollmentControls() {
  const [isOpen, setIsOpen]       = useState(false);
  const [deadline, setDeadline]   = useState("2026-06-15");

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="text-[14px] font-bold">Re-enrollment Controls</div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] font-semibold">
            Re-enrollment portal
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
            {isOpen
              ? "Families can currently submit their re-enrollment"
              : "Portal is closed — families cannot re-enroll yet"}
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            toast.success(isOpen ? "Re-enrollment portal closed" : "Re-enrollment portal opened");
          }}
          className="relative w-14 h-7 rounded-full transition-all shrink-0"
          style={{ background: isOpen ? SUCCESS : "oklch(0.22 0.01 260)" }}
        >
          <div
            className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
            style={{ left: isOpen ? "calc(100% - 22px)" : "4px" }}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Re-enrollment deadline
        </label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" style={{ color: MUTED_FG }} />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
          />
        </div>
      </div>

      <button
        onClick={() => toast.success("Re-enrollment invites sent to all pending families!")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all"
        style={{
          minHeight: 48,
          background: PRIMARY,
          color: "oklch(0.98 0.005 290)",
        }}
      >
        <Send className="w-4 h-4" />
        Send re-enrollment invite to all pending families
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Season-over-season SVG bar chart                                           */
/* -------------------------------------------------------------------------- */

function RetentionChart() {
  const maxRate = 100;
  const barW    = 40;
  const gapW    = 24;
  const chartH  = 120;
  const totalW  = SEASON_RETENTION_DATA.length * (barW + gapW) - gapW;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" style={{ color: PRIMARY }} />
        <div className="text-[14px] font-bold">Season-over-Season Retention</div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW + 20} ${chartH + 48}`}
          width={totalW + 20}
          height={chartH + 48}
          style={{ display: "block", minWidth: totalW + 20 }}
        >
          {/* Gridlines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = chartH - (pct / maxRate) * chartH;
            return (
              <g key={pct}>
                <line
                  x1={0}
                  y1={y}
                  x2={totalW + 20}
                  y2={y}
                  stroke="oklch(0.22 0.01 260)"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={y - 3}
                  fontSize={9}
                  fill="oklch(0.45 0.01 260)"
                  fontFamily="monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {SEASON_RETENTION_DATA.map((d, i) => {
            const x    = 10 + i * (barW + gapW);
            const barH = (d.rate / maxRate) * chartH;
            const y    = chartH - barH;
            const isLast = i === SEASON_RETENTION_DATA.length - 1;
            const color  = isLast ? PRIMARY : SUCCESS;

            return (
              <g key={d.season}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={`${color.replace(")", " / 0.75)")}`}
                />
                {isLast && (
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={6}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                  />
                )}

                {/* Rate label */}
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="700"
                  fill={color}
                  fontFamily="system-ui"
                >
                  {d.rate}%
                </text>

                {/* Season label */}
                <text
                  x={x + barW / 2}
                  y={chartH + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="oklch(0.55 0.02 260)"
                  fontFamily="system-ui"
                >
                  {d.season}
                </text>

                {/* Player count */}
                <text
                  x={x + barW / 2}
                  y={chartH + 32}
                  textAnchor="middle"
                  fontSize={9}
                  fill="oklch(0.45 0.01 260)"
                  fontFamily="monospace"
                >
                  {d.players}p
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-[11px]" style={{ color: MUTED_FG }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: `${SUCCESS.replace(")", " / 0.75)")}` }} />
          Prior seasons
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: `${PRIMARY.replace(")", " / 0.75)")}` }} />
          Current (Fall 2026)
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function ReEnrollmentPage() {
  const [players] = useState<PlayerEnrollment[]>(PLAYERS);

  const confirmed = players.filter((p) => p.status === "confirmed").length;
  const total     = players.filter((p) => p.status !== "departed").length;
  const rate      = Math.round((confirmed / total) * 100);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          eyebrow="Admin"
          title="Re-Enrollment"
          subtitle="Intelligence-driven retention management — know who's coming back and act before it's too late."
          actions={
            <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: SUCCESS }}>
              <TrendingUp className="w-4 h-4" />
              {rate}% confirmed
            </div>
          }
        />

        {/* Retention hero */}
        <RetentionHero players={players} />

        {/* Churn risk */}
        <ChurnRiskSection />

        {/* Enrollment table */}
        <EnrollmentTable players={players} />

        {/* Controls */}
        <EnrollmentControls />

        {/* Chart */}
        <RetentionChart />
      </div>
    </AppShell>
  );
}
