/**
 * AbsenceManagementPage — /app/coach/absences
 *
 * Absence reporting, pattern detection, and coach acknowledgment workflow.
 */
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Download,
  Plus,
  Filter,
  ChevronDown,
  Clock,
  XCircle,
  TrendingDown,
  UserCheck,
  Calendar,
  Clipboard,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type AbsenceStatus = "excused" | "unexcused" | "pending";
type AbsenceReason = "illness" | "school" | "family" | "travel" | "unexcused" | "other";
type EventType = "practice" | "game" | "team-meeting" | "film-session";

interface AbsenceRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerInitials: string;
  team: string;
  date: string;
  eventType: EventType;
  eventName: string;
  reason: AbsenceReason;
  reasonNote: string;
  status: AbsenceStatus;
  reportedBy: string;
  reportedAt: string;
  acknowledgedBy?: string;
  needsResponse: boolean;
}

interface PatternAlert {
  playerId: string;
  playerName: string;
  playerInitials: string;
  team: string;
  pattern: string;
  absenceCount: number;
  windowDays: number;
  lastAbsence: string;
  trendData: number[]; // attendance % per week (last 6 weeks)
  recommendedAction: string;
  severity: "moderate" | "high";
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ABSENCE_LOG: AbsenceRecord[] = [
  {
    id: "a1", playerId: "p1", playerName: "Tyler Brooks", playerInitials: "TB",
    team: "17U", date: "May 13, 2026", eventType: "practice", eventName: "Tuesday Practice",
    reason: "illness", reasonNote: "Reported fever — staying home per school policy",
    status: "excused", reportedBy: "Jennifer Brooks (parent)", reportedAt: "May 13, 8:30 AM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a2", playerId: "p2", playerName: "DeShawn Morris", playerInitials: "DM",
    team: "17U", date: "May 12, 2026", eventType: "film-session", eventName: "Film Review",
    reason: "unexcused", reasonNote: "No notice provided",
    status: "unexcused", reportedBy: "Coach Webb (logged)", reportedAt: "May 12, 4:15 PM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a3", playerId: "p3", playerName: "Noah Rivera", playerInitials: "NR",
    team: "Wings", date: "May 14, 2026", eventType: "practice", eventName: "Wednesday Practice",
    reason: "school", reasonNote: "Science fair presentation — parent notified ahead of time",
    status: "excused", reportedBy: "Maria Rivera (parent)", reportedAt: "May 12, 8:00 AM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a4", playerId: "p4", playerName: "Kwame Johnson", playerInitials: "KJ",
    team: "Bigs", date: "May 15, 2026", eventType: "practice", eventName: "Thursday Practice",
    reason: "family", reasonNote: "Family medical appointment",
    status: "pending", reportedBy: "Kwame Johnson (player)", reportedAt: "May 15, 6:00 AM",
    needsResponse: true,
  },
  {
    id: "a5", playerId: "p2", playerName: "DeShawn Morris", playerInitials: "DM",
    team: "17U", date: "May 10, 2026", eventType: "practice", eventName: "Saturday Practice",
    reason: "unexcused", reasonNote: "No notice — no response to check-in messages",
    status: "unexcused", reportedBy: "Coach Webb (logged)", reportedAt: "May 10, 3:00 PM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a6", playerId: "p5", playerName: "Isaiah Peters", playerInitials: "IP",
    team: "15U", date: "May 15, 2026", eventType: "game", eventName: "vs. Riverside Prep",
    reason: "illness", reasonNote: "Stomach virus — doctor's note submitted",
    status: "pending", reportedBy: "Denise Peters (parent)", reportedAt: "May 15, 7:45 AM",
    needsResponse: true,
  },
  {
    id: "a7", playerId: "p6", playerName: "Carlos Ruiz", playerInitials: "CR",
    team: "Guards", date: "May 14, 2026", eventType: "practice", eventName: "Wednesday Practice",
    reason: "travel", reasonNote: "Family out of town — notified 5 days in advance",
    status: "excused", reportedBy: "Carlos Ruiz (player)", reportedAt: "May 9, 2:00 PM",
    acknowledgedBy: "Coach Simmons", needsResponse: false,
  },
  {
    id: "a8", playerId: "p1", playerName: "Tyler Brooks", playerInitials: "TB",
    team: "17U", date: "May 8, 2026", eventType: "practice", eventName: "Friday Practice",
    reason: "illness", reasonNote: "Continued illness",
    status: "excused", reportedBy: "Jennifer Brooks (parent)", reportedAt: "May 8, 7:00 AM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a9", playerId: "p2", playerName: "DeShawn Morris", playerInitials: "DM",
    team: "17U", date: "May 7, 2026", eventType: "film-session", eventName: "Film Review",
    reason: "unexcused", reasonNote: "Second consecutive missed film session",
    status: "unexcused", reportedBy: "Coach Webb (logged)", reportedAt: "May 7, 5:00 PM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a10", playerId: "p7", playerName: "Malik Thompson", playerInitials: "MT",
    team: "15U", date: "May 13, 2026", eventType: "practice", eventName: "Tuesday Practice",
    reason: "other", reasonNote: "Transportation issue — no way to get to practice",
    status: "pending", reportedBy: "Malik Thompson (player)", reportedAt: "May 13, 3:45 PM",
    needsResponse: true,
  },
  {
    id: "a11", playerId: "p8", playerName: "Jerome Casey", playerInitials: "JC",
    team: "Wings", date: "May 12, 2026", eventType: "practice", eventName: "Monday Practice",
    reason: "family", reasonNote: "Family commitment",
    status: "excused", reportedBy: "Parent (email)", reportedAt: "May 11, 9:00 PM",
    acknowledgedBy: "Coach Torres", needsResponse: false,
  },
  {
    id: "a12", playerId: "p3", playerName: "Noah Rivera", playerInitials: "NR",
    team: "Wings", date: "May 6, 2026", eventType: "practice", eventName: "Wednesday Practice",
    reason: "illness", reasonNote: "Cold",
    status: "excused", reportedBy: "Maria Rivera (parent)", reportedAt: "May 6, 7:30 AM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a13", playerId: "p1", playerName: "Tyler Brooks", playerInitials: "TB",
    team: "17U", date: "May 5, 2026", eventType: "film-session", eventName: "Film Review",
    reason: "school", reasonNote: "Study hall conflict",
    status: "excused", reportedBy: "Tyler Brooks (player)", reportedAt: "May 4, 6:00 PM",
    acknowledgedBy: "Coach Webb", needsResponse: false,
  },
  {
    id: "a14", playerId: "p4", playerName: "Kwame Johnson", playerInitials: "KJ",
    team: "Bigs", date: "May 10, 2026", eventType: "practice", eventName: "Saturday Practice",
    reason: "family", reasonNote: "Sibling graduation ceremony",
    status: "excused", reportedBy: "Parent (text)", reportedAt: "May 9, 11:00 AM",
    acknowledgedBy: "Coach Simmons", needsResponse: false,
  },
  {
    id: "a15", playerId: "p9", playerName: "Dante Williams", playerInitials: "DW",
    team: "Guards", date: "May 15, 2026", eventType: "practice", eventName: "Thursday Practice",
    reason: "unexcused", reasonNote: "No communication received",
    status: "pending", reportedBy: "Coach Torres (logged)", reportedAt: "May 15, 4:30 PM",
    needsResponse: true,
  },
];

const PATTERN_ALERTS: PatternAlert[] = [
  {
    playerId: "p1",
    playerName: "Tyler Brooks",
    playerInitials: "TB",
    team: "17U",
    pattern: "3 absences in 14 days",
    absenceCount: 3,
    windowDays: 14,
    lastAbsence: "May 13",
    trendData: [100, 95, 90, 85, 75, 80],
    recommendedAction: "Schedule wellness check-in — pattern emerging pre-tournament",
    severity: "moderate",
  },
  {
    playerId: "p2",
    playerName: "DeShawn Morris",
    playerInitials: "DM",
    team: "17U",
    pattern: "Missed 3 consecutive film sessions — no communication",
    absenceCount: 3,
    windowDays: 21,
    lastAbsence: "May 12",
    trendData: [95, 95, 80, 65, 60, 55],
    recommendedAction: "Direct one-on-one meeting needed — engagement risk flagged",
    severity: "high",
  },
  {
    playerId: "p3",
    playerName: "Noah Rivera",
    playerInitials: "NR",
    team: "Wings",
    pattern: "2 absences in 10 days — both excused",
    absenceCount: 2,
    windowDays: 10,
    lastAbsence: "May 14",
    trendData: [100, 100, 95, 90, 90, 85],
    recommendedAction: "Monitor — absences are excused but frequency is climbing",
    severity: "moderate",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const REASON_LABELS: Record<AbsenceReason, string> = {
  illness:   "Illness",
  school:    "School",
  family:    "Family",
  travel:    "Travel",
  unexcused: "Unexcused",
  other:     "Other",
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  practice:      "Practice",
  game:          "Game",
  "team-meeting": "Team Meeting",
  "film-session": "Film Session",
};

function statusStyle(status: AbsenceStatus): React.CSSProperties {
  switch (status) {
    case "excused":
      return { background: "oklch(0.75 0.12 140 / 0.12)", color: "oklch(0.75 0.12 140)", border: "1px solid oklch(0.75 0.12 140 / 0.25)" };
    case "unexcused":
      return { background: "oklch(0.68 0.22 25 / 0.12)", color: "oklch(0.68 0.22 25)", border: "1px solid oklch(0.68 0.22 25 / 0.25)" };
    case "pending":
      return { background: "oklch(0.78 0.16 75 / 0.12)", color: "oklch(0.78 0.16 75)", border: "1px solid oklch(0.78 0.16 75 / 0.25)" };
  }
}

function statusIcon(status: AbsenceStatus) {
  switch (status) {
    case "excused":   return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "unexcused": return <XCircle className="w-3.5 h-3.5" />;
    case "pending":   return <Clock className="w-3.5 h-3.5" />;
  }
}

function reasonStyle(reason: AbsenceReason): React.CSSProperties {
  switch (reason) {
    case "illness":   return { background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)" };
    case "unexcused": return { background: "oklch(0.68 0.22 25 / 0.10)", color: "oklch(0.68 0.22 25)" };
    case "school":    return { background: "oklch(0.75 0.12 140 / 0.10)", color: "oklch(0.75 0.12 140)" };
    default:          return { background: "oklch(0.65 0.02 260 / 0.10)", color: "oklch(0.60 0.02 260)" };
  }
}

/* Tiny sparkline SVG for attendance trend */
function TrendSparkline({ data }: { data: number[] }) {
  const w = 80, h = 32, pad = 2;
  const min = Math.min(...data) - 5;
  const max = 102;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = data.map((v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const last = data[data.length - 1];
  const trend = last < 80 ? "oklch(0.68 0.22 25)" : last < 90 ? "oklch(0.78 0.16 75)" : "oklch(0.75 0.12 140)";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={trend} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === data.length - 1 ? 3 : 1.5} fill={trend} />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Report Absence Modal                                                        */
/* -------------------------------------------------------------------------- */

function ReportAbsenceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [player, setPlayer] = useState("");
  const [event, setEvent] = useState("");
  const [reason, setReason] = useState<AbsenceReason>("illness");
  const [notes, setNotes] = useState("");
  const [excused, setExcused] = useState(false);

  const players = ["Tyler Brooks", "DeShawn Morris", "Noah Rivera", "Kwame Johnson", "Isaiah Peters", "Carlos Ruiz", "Malik Thompson", "Jerome Casey", "Dante Williams"];
  const events = ["Thursday Practice", "Saturday Game vs. Riverside", "Film Session", "Team Meeting", "Friday Practice"];

  function handleSubmit() {
    if (!player || !event) {
      toast.error("Please select a player and event.");
      return;
    }
    toast.success("Absence logged", {
      description: `${player} — ${event} · ${excused ? "Excused" : "Unexcused"}`,
    });
    onClose();
    setPlayer("");
    setEvent("");
    setReason("illness");
    setNotes("");
    setExcused(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="w-4 h-4" style={{ color: "oklch(0.72 0.18 290)" }} />
            Log Absence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div>
            <label className="text-[12px] font-medium block mb-1">Player</label>
            <select
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">Select player…</option>
              {players.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-1">Event missed</label>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">Select event…</option>
              {events.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-1">Reason category</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(REASON_LABELS) as [AbsenceReason, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setReason(val)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                  style={
                    reason === val
                      ? { background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.35)" }
                      : { borderColor: "oklch(0.20 0.01 260)", color: "oklch(0.60 0.02 260)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-1">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context…"
              className="text-[12px] resize-none min-h-[72px]"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={excused}
              onChange={(e) => setExcused(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-[13px] font-medium">Mark as excused</span>
          </label>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} style={{ background: "oklch(0.72 0.18 290)", color: "white" }}>
              Log Absence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* FollowUpModal                                                               */
/* -------------------------------------------------------------------------- */

function FollowUpModal({
  open,
  playerName,
  onClose,
}: {
  open: boolean;
  playerName: string;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState("");

  function handleSend() {
    if (!msg.trim()) return;
    toast.success(`Message sent to ${playerName}`);
    onClose();
    setMsg("");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Follow-up: {playerName}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={`Hey ${playerName.split(" ")[0]}, wanted to check in about your recent absence…`}
          className="text-[13px] resize-none min-h-[100px] mt-2"
        />
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend} className="gap-1.5" style={{ background: "oklch(0.72 0.18 290)", color: "white" }}>
            <Send className="w-3.5 h-3.5" /> Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* StatsBar                                                                    */
/* -------------------------------------------------------------------------- */

function StatsBar() {
  const stats = [
    { label: "Total absences this month", value: "15", sub: "across all teams", color: "oklch(0.72 0.18 290)" },
    { label: "Unexcused", value: "4", sub: "require follow-up", color: "oklch(0.68 0.22 25)" },
    { label: "Attendance rate", value: "91%", sub: "this month · +2% vs. last", color: "oklch(0.75 0.12 140)" },
    { label: "Players with 3+ absences", value: "2", sub: "Tyler Brooks, DeShawn Morris", color: "oklch(0.78 0.16 75)" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[12px] font-medium mt-0.5">{s.label}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PendingResponseSection                                                      */
/* -------------------------------------------------------------------------- */

function PendingResponseSection() {
  const pending = ABSENCE_LOG.filter((a) => a.needsResponse);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [followUpId, setFollowUpId] = useState<string | null>(null);

  function acknowledge(id: string, playerName: string) {
    setAcknowledged((p) => new Set(p).add(id));
    toast.success(`Absence acknowledged`, { description: `${playerName} · Marked as reviewed` });
  }

  const followUpRecord = pending.find((a) => a.id === followUpId);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: "oklch(0.68 0.22 25)" }}
        />
        <h2 className="font-semibold text-[15px]">Pending Response</h2>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "oklch(0.68 0.22 25 / 0.12)", color: "oklch(0.68 0.22 25)" }}
        >
          {pending.length - acknowledged.size}
        </span>
        <p className="text-[12px] text-muted-foreground ml-1">Absences that need coach acknowledgment</p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-border p-6 text-center text-muted-foreground text-[13px]">
          All absences are acknowledged.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((ab) => {
            const done = acknowledged.has(ab.id);
            return (
              <div
                key={ab.id}
                className="rounded-xl border bg-card p-4 flex items-start gap-4 transition-opacity"
                style={{
                  borderColor: done ? "oklch(0.75 0.12 140 / 0.30)" : "oklch(0.68 0.22 25 / 0.25)",
                  opacity: done ? 0.6 : 1,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                  style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
                >
                  {ab.playerInitials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px]">{ab.playerName}</span>
                        <span className="text-[11px] text-muted-foreground">{ab.team}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        Missed{" "}
                        <span className="font-medium text-foreground">{ab.eventName}</span>
                        {" · "}{ab.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={reasonStyle(ab.reason)}>
                        {REASON_LABELS[ab.reason]}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                    <span className="font-medium">Reported by:</span> {ab.reportedBy} · {ab.reportedAt}
                  </p>
                  {ab.reasonNote && (
                    <p className="text-[12px] bg-muted/50 rounded-lg px-3 py-2 mt-2 border border-border">
                      "{ab.reasonNote}"
                    </p>
                  )}

                  {!done && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => acknowledge(ab.id, ab.playerName)}
                        className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all"
                        style={{
                          background: "oklch(0.75 0.12 140 / 0.10)",
                          color: "oklch(0.75 0.12 140)",
                          borderColor: "oklch(0.75 0.12 140 / 0.25)",
                        }}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => setFollowUpId(ab.id)}
                        className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Follow up
                      </button>
                    </div>
                  )}

                  {done && (
                    <div className="flex items-center gap-1.5 mt-2 text-[12px]" style={{ color: "oklch(0.75 0.12 140)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledged by you
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {followUpRecord && (
        <FollowUpModal
          open={!!followUpId}
          playerName={followUpRecord.playerName}
          onClose={() => setFollowUpId(null)}
        />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* PatternAlertsSection                                                        */
/* -------------------------------------------------------------------------- */

function PatternAlertsSection() {
  function handleCheckIn(name: string) {
    toast.success(`Check-in scheduled`, { description: `${name} · Notification sent` });
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.78 0.16 75)" }} />
        <h2 className="font-semibold text-[15px]">Pattern Alerts</h2>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "oklch(0.78 0.16 75 / 0.12)", color: "oklch(0.78 0.16 75)" }}
        >
          {PATTERN_ALERTS.length}
        </span>
        <p className="text-[12px] text-muted-foreground ml-1">Players showing concerning attendance patterns</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PATTERN_ALERTS.map((alert) => (
          <div
            key={alert.playerId}
            className="rounded-xl border bg-card p-4"
            style={{
              borderColor: alert.severity === "high"
                ? "oklch(0.68 0.22 25 / 0.30)"
                : "oklch(0.78 0.16 75 / 0.25)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                  style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
                >
                  {alert.playerInitials}
                </div>
                <div>
                  <div className="font-semibold text-[13px]">{alert.playerName}</div>
                  <div className="text-[11px] text-muted-foreground">{alert.team}</div>
                </div>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                style={
                  alert.severity === "high"
                    ? { background: "oklch(0.68 0.22 25 / 0.12)", color: "oklch(0.68 0.22 25)" }
                    : { background: "oklch(0.78 0.16 75 / 0.12)", color: "oklch(0.78 0.16 75)" }
                }
              >
                {alert.severity}
              </span>
            </div>

            <p className="text-[13px] font-medium mb-1">{alert.pattern}</p>
            <p className="text-[11px] text-muted-foreground mb-3">Last absence: {alert.lastAbsence}</p>

            {/* Attendance trend sparkline */}
            <div className="flex items-center gap-3 mb-3">
              <TrendSparkline data={alert.trendData} />
              <div className="text-[11px] text-muted-foreground">
                <span className="block font-medium">6-week trend</span>
                <span>{alert.trendData[alert.trendData.length - 1]}% this week</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg px-3 py-2 text-[11px] text-muted-foreground border border-border mb-3">
              <span className="font-semibold text-foreground">Recommended:</span> {alert.recommendedAction}
            </div>

            <button
              onClick={() => handleCheckIn(alert.playerName)}
              className="w-full py-2 text-[12px] font-medium rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule check-in
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* AbsenceLogSection                                                           */
/* -------------------------------------------------------------------------- */

function AbsenceLogSection() {
  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | "all">("all");
  const [filterReason, setFilterReason] = useState<AbsenceReason | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return ABSENCE_LOG.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterReason !== "all" && a.reason !== filterReason) return false;
      if (search && !a.playerName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterStatus, filterReason, search]);

  function handleExport() {
    toast.success("Export started", { description: "Absence log CSV will download shortly" });
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-[15px]">Absence Log</h2>
          <span className="text-[11px] text-muted-foreground">({filtered.length} records)</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5 text-[12px]">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player…"
          className="text-[12px] w-40 h-8"
        />

        <div className="flex gap-1.5 flex-wrap">
          {(["all", "pending", "excused", "unexcused"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all capitalize"
              style={
                filterStatus === s
                  ? { background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.30)" }
                  : { borderColor: "oklch(0.20 0.01 260)", color: "oklch(0.60 0.02 260)" }
              }
            >
              {s === "all" ? "All statuses" : s}
            </button>
          ))}
        </div>

        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value as AbsenceReason | "all")}
          className="text-[11px] bg-background border border-border rounded-lg px-2 py-1 outline-none"
        >
          <option value="all">All reasons</option>
          {(Object.entries(REASON_LABELS) as [AbsenceReason, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Player</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reason</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Acknowledged by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((ab) => (
                <tr key={ab.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}
                      >
                        {ab.playerInitials}
                      </div>
                      <div>
                        <div className="font-medium">{ab.playerName}</div>
                        <div className="text-[10px] text-muted-foreground">{ab.team}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ab.date}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div>{ab.eventName}</div>
                    <div className="text-[10px] text-muted-foreground">{EVENT_TYPE_LABELS[ab.eventType]}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={reasonStyle(ab.reason)}>
                      {REASON_LABELS[ab.reason]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
                      style={statusStyle(ab.status)}
                    >
                      {statusIcon(ab.status)}
                      <span className="capitalize">{ab.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {ab.acknowledgedBy ?? (
                      <span className="text-[11px]" style={{ color: "oklch(0.78 0.16 75)" }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground text-[13px]">
                    No absence records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* AbsenceManagementPage                                                       */
/* -------------------------------------------------------------------------- */

export default function AbsenceManagementPage() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <PageHeader
          eyebrow="Coach · Team"
          title="Absence Management"
          subtitle="Track attendance, review patterns, and respond to reported absences across your roster."
          actions={
            <Button
              size="sm"
              onClick={() => setReportOpen(true)}
              className="gap-1.5"
              style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Log Absence
            </Button>
          }
        />

        <StatsBar />
        <PendingResponseSection />
        <PatternAlertsSection />
        <AbsenceLogSection />

        <ReportAbsenceModal open={reportOpen} onClose={() => setReportOpen(false)} />
      </div>
    </AppShell>
  );
}
