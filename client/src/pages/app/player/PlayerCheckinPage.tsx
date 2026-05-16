/**
 * PlayerCheckinPage — daily readiness check-in for players.
 *
 * Shows either:
 *   A) A submitted confirmation with 7-day history, coach note, and CTAs
 *   B) A fast-to-complete check-in form with live score preview
 *
 * Then a full 14-day readiness history is shown below regardless.
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Dumbbell,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  myReadinessHistory,
  todayCheckinSubmitted,
  computeReadiness,
  type ReadinessEntry,
  type ReadinessFlag,
} from "@/lib/mock/readiness";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";

const FLAG_COLORS: Record<ReadinessFlag, string> = {
  green: SUCCESS,
  yellow: WARNING,
  red: DANGER,
  restricted: "oklch(0.55 0.15 320)",
};

const FLAG_LABELS: Record<ReadinessFlag, string> = {
  green: "Ready",
  yellow: "Monitor",
  red: "At Risk",
  restricted: "Restricted",
};

// ─── Rating options config ────────────────────────────────────────────────────

const SORENESS_OPTS = [
  { value: 1, emoji: "🟢", label: "None" },
  { value: 2, emoji: "🟡", label: "Slight" },
  { value: 3, emoji: "🟠", label: "Moderate" },
  { value: 4, emoji: "🔴", label: "Sore" },
  { value: 5, emoji: "🔥", label: "Very sore" },
] as const;

const SLEEP_OPTS = [
  { value: 1, emoji: "😴", label: "Terrible" },
  { value: 2, emoji: "😪", label: "Poor" },
  { value: 3, emoji: "😐", label: "OK" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🌟", label: "Great" },
] as const;

const ENERGY_OPTS = [
  { value: 1, emoji: "🪫", label: "Exhausted" },
  { value: 2, emoji: "😓", label: "Low" },
  { value: 3, emoji: "😌", label: "OK" },
  { value: 4, emoji: "⚡", label: "Good" },
  { value: 5, emoji: "🔋", label: "Fully charged" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayLabel(iso: string): string {
  const today = "2026-05-15"; // session mock date
  if (iso === today) return "Today";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score >= 70) return SUCCESS;
  if (score >= 45) return WARNING;
  return DANGER;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FlagDot({ flag, size = 10 }: { flag: ReadinessFlag; size?: number }) {
  return (
    <span
      className="rounded-full inline-block shrink-0"
      style={{
        width: size,
        height: size,
        background: FLAG_COLORS[flag],
      }}
      title={FLAG_LABELS[flag]}
    />
  );
}

function ScoreRing({ score, flag }: { score: number; flag: ReadinessFlag }) {
  const color = FLAG_COLORS[flag];
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="oklch(0.20 0.005 260)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {FLAG_LABELS[flag]}
        </span>
      </div>
    </div>
  );
}

type RatingButtonGroupProps<T extends number> = {
  options: readonly { value: T; emoji: string; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

function RatingButtonGroup<T extends number>({
  options,
  value,
  onChange,
}: RatingButtonGroupProps<T>) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-150 min-h-[64px] select-none active:scale-95"
            style={
              selected
                ? {
                    borderColor: ACCENT.replace(")", " / 0.60)"),
                    background: ACCENT.replace(")", " / 0.12)"),
                  }
                : {
                    borderColor: "oklch(0.24 0.01 260)",
                    background: "oklch(0.12 0.005 260)",
                  }
            }
            aria-pressed={selected}
          >
            <span className="text-xl leading-none">{opt.emoji}</span>
            <span
              className="text-[9px] font-semibold uppercase tracking-wide leading-none text-center"
              style={{ color: selected ? ACCENT : "oklch(0.50 0.02 260)" }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MiniHistoryDots({ entries }: { entries: ReadinessEntry[] }) {
  const last7 = entries.slice(0, 7);
  return (
    <div className="flex items-end gap-2">
      {last7.map((e) => (
        <div key={e.id} className="flex flex-col items-center gap-1">
          <div
            className="w-7 rounded-full"
            style={{
              height: `${Math.max(8, (e.readinessScore / 100) * 36)}px`,
              background: FLAG_COLORS[e.flag],
              opacity: 0.85,
            }}
            title={`${formatDate(e.date)}: ${e.readinessScore}`}
          />
          <span className="text-[9px] text-muted-foreground">
            {new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Submitted State ──────────────────────────────────────────────────────────

function SubmittedCard({ today }: { today: ReadinessEntry }) {
  const color = FLAG_COLORS[today.flag];

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div
        className="rounded-2xl border p-4 space-y-4"
        style={{
          borderColor: color.replace(")", " / 0.30)"),
          background: color.replace(")", " / 0.06)"),
        }}
      >
        <div className="flex items-center gap-4">
          <ScoreRing score={today.readinessScore} flag={today.flag} />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color }}
            >
              Check-in submitted
            </div>
            <div className="text-xl font-bold">{FLAG_LABELS[today.flag]}</div>
            <div className="text-[12px] text-muted-foreground">
              {formatDate(today.date)}
            </div>
            <div className="flex gap-3 text-[12px] text-muted-foreground">
              <span>Soreness: {today.soreness}/5</span>
              <span>Sleep: {today.sleep}/5</span>
              <span>Energy: {today.energy}/5</span>
            </div>
          </div>
        </div>

        {/* 7-day mini chart */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Last 7 days
          </div>
          <MiniHistoryDots entries={myReadinessHistory} />
        </div>
      </div>

      {/* Coach note */}
      {today.coachNote && (
        <div
          className="rounded-xl border px-4 py-3 space-y-1.5"
          style={{
            borderColor: ACCENT.replace(")", " / 0.25)"),
            background: ACCENT.replace(")", " / 0.05)"),
          }}
        >
          <div
            className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5"
            style={{ color: ACCENT }}
          >
            <MessageSquare className="w-3 h-3" />
            Coach note
          </div>
          <p className="text-[13px] leading-relaxed">{today.coachNote}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-2">
        <a
          href="#history"
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-[13px] font-medium text-foreground hover:bg-muted/30 transition-colors min-h-[48px]"
        >
          View Full History
          <ChevronRight className="w-4 h-4" />
        </a>
        <Link href="/app/player/workout">
          <a
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold min-h-[48px]"
            style={{ background: ACCENT, color: "white" }}
          >
            <Dumbbell className="w-4 h-4" />
            Today's WOD
          </a>
        </Link>
      </div>
    </div>
  );
}

// ─── Check-in Form ────────────────────────────────────────────────────────────

function CheckinForm({ playerName, onSubmit }: { playerName: string; onSubmit: () => void }) {
  const [soreness, setSoreness] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [sleep, setSleep] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState("");

  const { score, flag } = computeReadiness(soreness, sleep, energy);
  const sColor = scoreColor(score);

  function handleSubmit() {
    onSubmit();
    toast.success("Check-in submitted! Your coach will review before practice.");
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div
        className="rounded-2xl border p-4 space-y-2"
        style={{
          borderColor: ACCENT.replace(")", " / 0.20)"),
          background: ACCENT.replace(")", " / 0.05)"),
        }}
      >
        <div
          className="text-[10px] uppercase tracking-widest font-mono"
          style={{ color: ACCENT }}
        >
          Daily Check-in
        </div>
        <h1 className="text-xl font-bold leading-snug">
          Good morning, {playerName.split(" ")[0]}.
        </h1>
        <p className="text-[13px] text-muted-foreground">
          How are you feeling today? This takes 30 seconds.
        </p>
      </div>

      {/* Live score preview */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
        <ScoreRing score={score} flag={flag} />
        <div className="flex-1 space-y-1">
          <div className="text-[12px] text-muted-foreground font-medium">
            Readiness Score
          </div>
          <div className="text-3xl font-bold tabular-nums" style={{ color: sColor }}>
            {score}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: sColor }}
          >
            {FLAG_LABELS[flag]}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Updates live as you fill in the form
          </p>
        </div>
      </div>

      {/* Soreness */}
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold">
          Soreness{" "}
          <span className="text-muted-foreground font-normal">— how does your body feel?</span>
        </label>
        <RatingButtonGroup
          options={SORENESS_OPTS}
          value={soreness}
          onChange={setSoreness}
        />
      </div>

      {/* Sleep */}
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold">
          Sleep quality
        </label>
        <RatingButtonGroup
          options={SLEEP_OPTS}
          value={sleep}
          onChange={setSleep}
        />
      </div>

      {/* Energy */}
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold">
          Energy level
        </label>
        <RatingButtonGroup
          options={ENERGY_OPTS}
          value={energy}
          onChange={setEnergy}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-semibold">
          Anything your coach should know?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything your coach should know?"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full gap-2 min-h-[52px] text-[15px] font-bold"
        style={{ background: ACCENT }}
        onClick={handleSubmit}
      >
        <CheckCircle2 className="w-5 h-5" />
        Submit Check-in
      </Button>
    </div>
  );
}

// ─── History List ─────────────────────────────────────────────────────────────

function HistoryList({ entries }: { entries: ReadinessEntry[] }) {
  return (
    <div id="history" className="space-y-2">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1 pt-2">
        Readiness History — Last 14 days
      </div>
      {entries.map((entry) => {
        const color = FLAG_COLORS[entry.flag];
        const barWidth = `${entry.readinessScore}%`;
        return (
          <div
            key={entry.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-stretch gap-0">
              {/* Score bar accent */}
              <div
                className="w-1 shrink-0"
                style={{ background: color }}
              />

              <div className="flex-1 px-3 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlagDot flag={entry.flag} size={8} />
                    <span className="text-[13px] font-semibold">{formatDayLabel(entry.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {FLAG_LABELS[entry.flag]}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color }}>
                      {entry.readinessScore}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: barWidth, background: color }}
                  />
                </div>

                {/* Metrics row */}
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  <span>Soreness: <strong className="text-foreground">{entry.soreness}</strong>/5</span>
                  <span>Sleep: <strong className="text-foreground">{entry.sleep}</strong>/5</span>
                  <span>Energy: <strong className="text-foreground">{entry.energy}</strong>/5</span>
                </div>

                {/* Player note */}
                {entry.note && (
                  <p className="text-[12px] text-muted-foreground italic leading-snug">
                    "{entry.note}"
                  </p>
                )}

                {/* Coach note */}
                {entry.coachNote && (
                  <div
                    className="rounded-lg px-2.5 py-2 flex items-start gap-2"
                    style={{
                      background: ACCENT.replace(")", " / 0.07)"),
                      borderLeft: `2px solid ${ACCENT.replace(")", " / 0.40)")}`,
                    }}
                  >
                    <MessageSquare
                      className="w-3 h-3 shrink-0 mt-0.5"
                      style={{ color: ACCENT }}
                    />
                    <p className="text-[11px] leading-snug text-foreground/80">
                      {entry.coachNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────

function TipCard() {
  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-start gap-3"
      style={{
        borderColor: "oklch(0.25 0.02 260)",
        background: "oklch(0.13 0.005 260)",
      }}
    >
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Your coach reviews check-ins before practice. If you flag a soreness issue, they'll adjust
        your session to protect you and keep you on track.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerCheckinPage() {
  const { user } = useAuth();
  const playerName = user?.name ?? "Player";

  // In production this would come from the server; here we use the mock flag
  const [submitted, setSubmitted] = useState(todayCheckinSubmitted);

  // Today's entry (first in history since it's sorted newest-first)
  const todayEntry = myReadinessHistory[0];

  return (
    <AppShell>
      <div className="px-4 pb-24 max-w-lg mx-auto pt-4 space-y-5">

        {/* ── Top section: submitted state OR check-in form ─────────────── */}
        {submitted ? (
          <SubmittedCard today={todayEntry} />
        ) : (
          <CheckinForm playerName={playerName} onSubmit={() => setSubmitted(true)} />
        )}

        {/* ── Tip card ──────────────────────────────────────────────────── */}
        <TipCard />

        {/* ── Full history list ──────────────────────────────────────────── */}
        <HistoryList entries={myReadinessHistory} />
      </div>
    </AppShell>
  );
}
