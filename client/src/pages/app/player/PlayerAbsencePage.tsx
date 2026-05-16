/**
 * PlayerAbsencePage — Player-facing absence reporting.
 * Route: /app/player/absence
 *
 * Simple, structured, 30-second absence reporting with attendance history.
 */
import { useState } from "react";
import {
  CalendarX,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronDown,
  Calendar,
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

type AbsenceReason = "illness" | "school" | "family" | "travel" | "other";
type AttendanceStatus = "present" | "absent" | "upcoming";

interface UpcomingEvent {
  id:     string;
  label:  string;
  date:   string;
  type:   "practice" | "game" | "tournament";
}

interface PriorAbsence {
  id:      string;
  date:    string;
  event:   string;
  reason:  string;
  excused: boolean;
}

interface AttendanceEntry {
  date:   string;
  label:  string;
  status: AttendanceStatus;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ATHLETES = ["Marcus Williams", "Liam Williams"];

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: "e1", label: "Practice — Main Gym",           date: "Mon, May 18",  type: "practice"   },
  { id: "e2", label: "Practice — Main Gym",           date: "Wed, May 20",  type: "practice"   },
  { id: "e3", label: "Game vs. Westside Eagles",      date: "Sat, May 23",  type: "game"       },
  { id: "e4", label: "Practice — Main Gym",           date: "Mon, May 25",  type: "practice"   },
  { id: "e5", label: "Practice — Main Gym",           date: "Wed, May 27",  type: "practice"   },
  { id: "e6", label: "Fall Invitational — Day 1",     date: "Sat, Jun 7",   type: "tournament" },
];

const ATTENDANCE_HISTORY: AttendanceEntry[] = [
  { date: "Apr 28", label: "Practice",               status: "present"  },
  { date: "May 1",  label: "Game vs. Northview",     status: "present"  },
  { date: "May 5",  label: "Practice",               status: "absent"   },
  { date: "May 7",  label: "Practice",               status: "present"  },
  { date: "May 10", label: "Game vs. Central High",  status: "present"  },
  { date: "May 12", label: "Practice",               status: "present"  },
  { date: "May 14", label: "Practice",               status: "present"  },
  { date: "May 15", label: "Game vs. Eastbrook",     status: "present"  },
  { date: "May 18", label: "Practice",               status: "upcoming" },
  { date: "May 20", label: "Practice",               status: "upcoming" },
];

const PRIOR_ABSENCES: PriorAbsence[] = [
  { id: "a1", date: "May 5, 2026",  event: "Practice",              reason: "Illness",            excused: true  },
  { id: "a2", date: "Apr 17, 2026", event: "Practice",              reason: "School commitment",  excused: true  },
  { id: "a3", date: "Apr 3, 2026",  event: "Game vs. Lakeview",     reason: "Family",             excused: true  },
  { id: "a4", date: "Mar 26, 2026", event: "Practice",              reason: "Travel",             excused: true  },
  { id: "a5", date: "Mar 12, 2026", event: "Practice",              reason: "Other",              excused: false },
];

const REASON_OPTIONS: Array<{ value: AbsenceReason; label: string; emoji: string }> = [
  { value: "illness", label: "Illness",            emoji: "🤒" },
  { value: "school",  label: "School commitment",  emoji: "📚" },
  { value: "family",  label: "Family",             emoji: "🏡" },
  { value: "travel",  label: "Travel",             emoji: "✈️" },
  { value: "other",   label: "Other",              emoji: "💬" },
];

const EVENT_TYPE_COLORS: Record<UpcomingEvent["type"], string> = {
  practice:   PRIMARY,
  game:       WARNING,
  tournament: DANGER,
};

/* -------------------------------------------------------------------------- */
/* Attendance ring (SVG)                                                       */
/* -------------------------------------------------------------------------- */

function AttendanceRing({ rate }: { rate: number }) {
  const size   = 96;
  const stroke = 8;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (rate / 100) * circ;

  const color  = rate >= 85 ? SUCCESS : rate >= 70 ? WARNING : DANGER;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(0.20 0.005 260)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color }}
      >
        <div className="text-[20px] font-black leading-none">{rate}%</div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          attended
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Streak dots                                                                 */
/* -------------------------------------------------------------------------- */

function StreakDots({ entries }: { entries: AttendanceEntry[] }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: MUTED_FG }}>
        Last 10 events
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {entries.map((entry, i) => {
          const color =
            entry.status === "present"  ? SUCCESS :
            entry.status === "absent"   ? DANGER  :
            "oklch(0.28 0.008 260)";

          const Icon =
            entry.status === "present"  ? CheckCircle2 :
            entry.status === "absent"   ? XCircle      :
            Circle;

          return (
            <div key={i} className="flex flex-col items-center gap-1" title={`${entry.date} — ${entry.label}`}>
              <Icon
                className="w-7 h-7"
                style={{ color }}
              />
              <span className="text-[8px]" style={{ color: MUTED_FG }}>{entry.date.split(" ")[1]}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] pt-1" style={{ color: MUTED_FG }}>
        <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} /> Present</div>
        <div className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" style={{ color: DANGER }} /> Absent</div>
        <div className="flex items-center gap-1"><Circle className="w-3.5 h-3.5" style={{ color: "oklch(0.35 0.008 260)" }} /> Upcoming</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Absence form                                                                */
/* -------------------------------------------------------------------------- */

interface AbsenceFormState {
  athleteId:    string;
  eventId:      string;
  reason:       AbsenceReason | "";
  note:         string;
  willMakeUp:   boolean;
}

function AbsenceForm() {
  const [form, setForm] = useState<AbsenceFormState>({
    athleteId:  ATHLETES[0],
    eventId:    "",
    reason:     "",
    note:       "",
    willMakeUp: false,
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!form.eventId || !form.reason) {
      toast.error("Please select an event and a reason.");
      return;
    }
    toast.success("Coach has been notified. Your absence is recorded.");
    setSubmitted(true);
  }

  function handleReset() {
    setForm({ athleteId: ATHLETES[0], eventId: "", reason: "", note: "", willMakeUp: false });
    setSubmitted(false);
  }

  if (submitted) {
    const selectedEvent = UPCOMING_EVENTS.find((e) => e.id === form.eventId);
    return (
      <div
        className="rounded-2xl border p-6 text-center space-y-3"
        style={{
          borderColor: `${SUCCESS.replace(")", " / 0.30)")}`,
          background:  `${SUCCESS.replace(")", " / 0.06)")}`,
        }}
      >
        <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: SUCCESS }} />
        <div className="text-[16px] font-bold" style={{ color: SUCCESS }}>Absence recorded</div>
        <div className="text-[13px]" style={{ color: MUTED_FG }}>
          Coach has been notified about {form.athleteId}'s absence
          {selectedEvent ? ` for ${selectedEvent.label} on ${selectedEvent.date}` : ""}.
        </div>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{ background: `${SUCCESS.replace(")", " / 0.12)")}`, color: SUCCESS, minHeight: 44 }}
        >
          Report another absence
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${DANGER.replace(")", " / 0.12)")}` }}
        >
          <CalendarX className="w-5 h-5" style={{ color: DANGER }} />
        </div>
        <div>
          <div className="text-[16px] font-bold">Report an Absence</div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>Takes about 30 seconds</div>
        </div>
      </div>

      {/* Athlete selector */}
      {ATHLETES.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
            Athlete
          </label>
          <div className="flex gap-2">
            {ATHLETES.map((a) => (
              <button
                key={a}
                onClick={() => setForm({ ...form, athleteId: a })}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  minHeight: 44,
                  background: form.athleteId === a ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                  color:      form.athleteId === a ? PRIMARY : MUTED_FG,
                  border:     form.athleteId === a
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                    : "1.5px solid oklch(0.22 0.01 260)",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event selector */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Which event will you miss?
        </label>
        <div className="relative">
          <select
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-[14px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 48, color: form.eventId ? "inherit" : MUTED_FG }}
          >
            <option value="" disabled>Select an event…</option>
            {UPCOMING_EVENTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.date} — {e.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: MUTED_FG }}
          />
        </div>

        {/* Event type badge */}
        {form.eventId && (() => {
          const ev    = UPCOMING_EVENTS.find((e) => e.id === form.eventId);
          if (!ev) return null;
          const color = EVENT_TYPE_COLORS[ev.type];
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              style={{
                background: `${color.replace(")", " / 0.12)")}`,
                color,
                border: `1px solid ${color.replace(")", " / 0.28)")}`,
              }}
            >
              {ev.type}
            </span>
          );
        })()}
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Reason
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REASON_OPTIONS.map((opt) => {
            const active = form.reason === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, reason: opt.value })}
                className="flex items-center gap-2 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-all text-left"
                style={{
                  minHeight: 48,
                  background: active ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                  color:      active ? PRIMARY : MUTED_FG,
                  border:     active
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                    : "1.5px solid oklch(0.22 0.01 260)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span className="text-[16px]">{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional note */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Note <span className="font-normal normal-case tracking-normal">— optional</span>
        </label>
        <textarea
          value={form.note}
          onChange={(e) => {
            if (e.target.value.length <= 200) setForm({ ...form, note: e.target.value });
          }}
          rows={3}
          placeholder="Let the coach know anything helpful…"
          className="w-full rounded-xl px-4 py-3 text-[13px] bg-background border border-border focus:outline-none transition-colors resize-none"
          style={{ color: "inherit" }}
        />
        <div className="text-[11px] text-right" style={{ color: MUTED_FG }}>
          {form.note.length}/200
        </div>
      </div>

      {/* Make-up toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5">
        <div>
          <div className="text-[14px] font-semibold">Will you make up the WOD?</div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
            Coaches appreciate when athletes stay on track
          </div>
        </div>
        <button
          onClick={() => setForm({ ...form, willMakeUp: !form.willMakeUp })}
          className="relative w-11 h-6 rounded-full transition-all shrink-0"
          style={{ background: form.willMakeUp ? SUCCESS : "oklch(0.22 0.01 260)" }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
            style={{ left: form.willMakeUp ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full py-4 rounded-2xl text-[15px] font-bold transition-all"
        style={{
          minHeight: 56,
          background: form.eventId && form.reason ? DANGER : "oklch(0.22 0.01 260)",
          color:      form.eventId && form.reason ? "oklch(0.98 0.005 25)" : MUTED_FG,
        }}
      >
        Submit Absence
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* My attendance section                                                       */
/* -------------------------------------------------------------------------- */

function MyAttendance() {
  const present  = ATTENDANCE_HISTORY.filter((e) => e.status === "present").length;
  const total    = ATTENDANCE_HISTORY.filter((e) => e.status !== "upcoming").length;
  const rate     = total > 0 ? Math.round((present / total) * 100) : 0;

  const nextEvent = UPCOMING_EVENTS[0];

  return (
    <div className="space-y-5">
      <div className="text-[11px] uppercase tracking-[0.10em] font-semibold" style={{ color: MUTED_FG }}>
        My Attendance
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* Rate + ring */}
        <div className="flex items-center gap-5">
          <AttendanceRing rate={rate} />
          <div className="space-y-1 min-w-0">
            <div className="text-[14px] font-bold">Fall 2026 Season</div>
            <div className="text-[13px]" style={{ color: MUTED_FG }}>
              {present} of {total} events attended
            </div>
            <div
              className="text-[12px] font-semibold"
              style={{
                color: rate >= 85 ? SUCCESS : rate >= 70 ? WARNING : DANGER,
              }}
            >
              {rate >= 85 ? "Great attendance!" : rate >= 70 ? "Room to improve" : "Below requirement"}
            </div>
          </div>
        </div>

        {/* Streak */}
        <StreakDots entries={ATTENDANCE_HISTORY} />

        {/* Next event */}
        {nextEvent && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3.5"
            style={{ background: `${PRIMARY.replace(")", " / 0.07)")}`, border: `1px solid ${PRIMARY.replace(")", " / 0.18)")}` }}
          >
            <Calendar className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: PRIMARY }}>
                Next event
              </div>
              <div className="text-[13px] font-semibold truncate">{nextEvent.label}</div>
              <div className="text-[11px]" style={{ color: MUTED_FG }}>{nextEvent.date}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prior absences log                                                          */
/* -------------------------------------------------------------------------- */

function PriorAbsencesLog() {
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-[0.10em] font-semibold" style={{ color: MUTED_FG }}>
        Prior absences
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {PRIOR_ABSENCES.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < PRIOR_ABSENCES.length - 1 ? "border-b border-border" : ""} bg-background`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: a.excused
                  ? `${SUCCESS.replace(")", " / 0.12)")}`
                  : `${WARNING.replace(")", " / 0.12)")}`,
              }}
            >
              {a.excused
                ? <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />
                : <CalendarX     className="w-4 h-4" style={{ color: WARNING }} />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold truncate">{a.event}</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: MUTED_FG }}>
                {a.date} · {a.reason}
              </div>
            </div>

            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: a.excused
                  ? `${SUCCESS.replace(")", " / 0.12)")}`
                  : `${WARNING.replace(")", " / 0.12)")}`,
                color: a.excused ? SUCCESS : WARNING,
              }}
            >
              {a.excused ? "Excused" : "Unexcused"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function PlayerAbsencePage() {
  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <PageHeader
          eyebrow="My Account"
          title="Absences"
          subtitle="Report a missed event and keep your coach in the loop."
        />

        {/* Form */}
        <AbsenceForm />

        {/* Attendance stats */}
        <MyAttendance />

        {/* Log */}
        <PriorAbsencesLog />
      </div>
    </AppShell>
  );
}
