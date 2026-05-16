import { useState } from "react";
import {
  Play,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type RatingLevel = 1 | 2 | 3 | 4 | 5;

type RubricClip = {
  id: string;
  playerName: string;
  skill: string;
  context: string;
  expertRating: number;
};

type HistoryRow = {
  id: string;
  date: string;
  skill: string;
  yourRating: number;
  expertRating: number;
  deviation: number;
};

type BadgeCriterion = {
  label: string;
  met: boolean;
  detail: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CURRENT_CLIP: RubricClip = {
  id: "clip-today",
  playerName: "Marcus Webb",
  skill: "Off-Ball Footwork",
  context:
    "Marcus sets up a curl cut off a flex screen — four reps at game speed, Wednesday practice.",
  expertRating: 3.5,
};

const STATS = {
  calibrationScore: 84,
  clipsThisMonth: 12,
  avgDeviation: 0.4,
  trend: "+6%",
};

const HISTORY: HistoryRow[] = [
  { id: "h1", date: "May 13, 2026", skill: "Finishing — Off-Hand",    yourRating: 3, expertRating: 3.5, deviation: 0.5 },
  { id: "h2", date: "May 11, 2026", skill: "Pull-Up Jumper",          yourRating: 4, expertRating: 4,   deviation: 0   },
  { id: "h3", date: "May 9, 2026",  skill: "Ball Screen Read",        yourRating: 3, expertRating: 4,   deviation: 1.0 },
  { id: "h4", date: "May 7, 2026",  skill: "Defensive Close-Out",     yourRating: 4, expertRating: 3.5, deviation: 0.5 },
  { id: "h5", date: "May 5, 2026",  skill: "Post Footwork",           yourRating: 2, expertRating: 2,   deviation: 0   },
  { id: "h6", date: "May 2, 2026",  skill: "Transition Offense",      yourRating: 5, expertRating: 4,   deviation: 1.0 },
  { id: "h7", date: "Apr 28, 2026", skill: "First Step Quickness",    yourRating: 3, expertRating: 3,   deviation: 0   },
  { id: "h8", date: "Apr 25, 2026", skill: "Help Defense Rotation",   yourRating: 4, expertRating: 3.5, deviation: 0.5 },
];

const BADGE_CRITERIA: BadgeCriterion[] = [
  { label: "Rate 15+ clips",                              met: true,  detail: "12 of 15 clips — 3 remaining" },
  { label: "Avg deviation ≤ 0.5 levels",                  met: true,  detail: "Current avg: 0.4 levels" },
  { label: "No deviation > 1.5 on any single clip",       met: true,  detail: "Max deviation so far: 1.0" },
  { label: "Complete within 45 days",                     met: false, detail: "17 days elapsed — 28 days remaining" },
];

const LEVEL_LABELS: Record<RatingLevel, string> = {
  1: "Foundational",
  2: "Developing",
  3: "Applied",
  4: "Proficient",
  5: "Elite",
};

// ─── Color helpers ────────────────────────────────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

function deviationColor(dev: number): string {
  if (dev === 0) return SUCCESS;
  if (dev <= 0.5) return WARNING;
  return DANGER;
}

function deviationLabel(dev: number): string {
  if (dev === 0) return "Exact match";
  if (dev <= 0.5) return "Close";
  return "Off";
}

function ratingColor(level: number): string {
  if (level >= 5) return PRIMARY;
  if (level >= 4) return SUCCESS;
  if (level >= 3) return WARNING;
  return DANGER;
}

const badgeProgress = BADGE_CRITERIA.filter((c) => c.met).length / BADGE_CRITERIA.length;
const clipsProgress = STATS.clipsThisMonth / 15;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObservationCalibrationPage() {
  const [selectedRating, setSelectedRating] = useState<RatingLevel | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleRate(level: RatingLevel) {
    setSelectedRating(level);
    setRevealed(false);
  }

  function handleReveal() {
    if (!selectedRating) {
      toast.error("Select a rating (1–5) before revealing the expert score.");
      return;
    }
    setRevealed(true);
  }

  function handleNextClip() {
    setSelectedRating(null);
    setRevealed(false);
    toast.success("Clip submitted. Loading next…");
  }

  const deviation = selectedRating
    ? Math.abs(selectedRating - CURRENT_CLIP.expertRating)
    : null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Observation Calibration"
          subtitle="Align your eye with expert standards. Rate clips, compare to consensus, sharpen your assessment accuracy."
        />

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Your Calibration Score", value: `${STATS.calibrationScore}%`,      sub: "Overall accuracy",     color: SUCCESS },
            { label: "Clips This Month",        value: `${STATS.clipsThisMonth}`,         sub: "of 15 for badge",      color: PRIMARY },
            { label: "Avg Deviation",           value: `${STATS.avgDeviation} levels`,    sub: "from expert rating",   color: WARNING },
            { label: "Calibration Trend",       value: STATS.trend,                       sub: "vs last month",        color: SUCCESS },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground font-medium leading-tight">{stat.label}</span>
              <span className="text-2xl font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Calibrate Now ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-bold">Calibrate Now</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Watch the clip, rate the player, then reveal the expert score.
            </p>
          </div>

          <div className="p-5 grid md:grid-cols-2 gap-6">
            {/* Left — mock video + clip info */}
            <div className="space-y-4">
              <div
                className="w-full aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ background: "oklch(0.15 0.02 260)" }}
                aria-label="Video clip player"
              >
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <button
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{ background: `${PRIMARY}cc` }}
                  aria-label="Play clip"
                >
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </button>
                <span
                  className="absolute bottom-3 right-3 text-[11px] font-mono font-bold px-2 py-1 rounded"
                  style={{ background: "oklch(0.10 0.01 260 / 0.8)", color: "white" }}
                >
                  0:38
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-bold">{CURRENT_CLIP.playerName}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${PRIMARY}18`, color: PRIMARY }}
                  >
                    {CURRENT_CLIP.skill}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {CURRENT_CLIP.context}
                </p>
              </div>
            </div>

            {/* Right — rating + reveal */}
            <div className="space-y-5">
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Your Rating
                </p>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as RatingLevel[]).map((n) => (
                    <button
                      key={n}
                      onClick={() => handleRate(n)}
                      className="flex-1 min-h-[64px] rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5"
                      style={{
                        borderColor: selectedRating === n ? ratingColor(n) : "oklch(0.25 0.01 260)",
                        background:  selectedRating === n ? `${ratingColor(n)}20` : "transparent",
                        color:       selectedRating === n ? ratingColor(n) : "oklch(0.55 0.02 260)",
                      }}
                      aria-pressed={selectedRating === n}
                      aria-label={`Rate ${n} — ${LEVEL_LABELS[n]}`}
                    >
                      <span className="text-[22px] leading-none">{n}</span>
                      <span className="text-[9px] font-medium opacity-80 text-center leading-tight px-0.5">
                        {LEVEL_LABELS[n]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {!revealed ? (
                <button
                  onClick={handleReveal}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: selectedRating ? PRIMARY : "oklch(0.22 0.01 260)",
                    color:      selectedRating ? "white"  : "oklch(0.45 0.01 260)",
                    cursor:     selectedRating ? "pointer" : "not-allowed",
                  }}
                >
                  Reveal Expert Rating
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">Your Rating</span>
                      <span className="text-[18px] font-bold" style={{ color: ratingColor(selectedRating!) }}>
                        {selectedRating} — {LEVEL_LABELS[selectedRating!]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">Expert Rating</span>
                      <span className="text-[18px] font-bold" style={{ color: ratingColor(CURRENT_CLIP.expertRating) }}>
                        {CURRENT_CLIP.expertRating} — {LEVEL_LABELS[Math.round(CURRENT_CLIP.expertRating) as RatingLevel]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-[12px] text-muted-foreground">Deviation</span>
                      <span
                        className="text-[14px] font-bold flex items-center gap-1.5"
                        style={{ color: deviationColor(deviation!) }}
                      >
                        {deviation === 0 ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : deviation! <= 0.5 ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {deviation === 0
                          ? `0 — ${deviationLabel(deviation!)}`
                          : `${deviation} level${deviation !== 1 ? "s" : ""} — ${deviationLabel(deviation!)}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {deviation === 0
                      ? "Perfect alignment. Your read matches the expert benchmark exactly."
                      : deviation! <= 0.5
                      ? "Close alignment. A half-level deviation is within normal range — consider what you may have weighted differently."
                      : "Notable gap. Review what the expert weighted that you didn't — this is the best learning signal in calibration."}
                  </p>

                  <button
                    onClick={handleNextClip}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: PRIMARY }}
                  >
                    Next Clip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Calibration History ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Calibration History</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Your last {HISTORY.length} rated clips</p>
            </div>
            <TrendingUp className="w-5 h-5" style={{ color: SUCCESS }} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Skill", "Your Rating", "Expert Rating", "Deviation"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0"
                    style={{ background: i % 2 !== 0 ? "oklch(0.14 0.01 260 / 0.3)" : "transparent" }}
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 font-medium">{row.skill}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: ratingColor(row.yourRating) }}>
                        {row.yourRating}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: ratingColor(row.expertRating) }}>
                        {row.expertRating}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 font-semibold text-[12px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `${deviationColor(row.deviation)}18`,
                          color: deviationColor(row.deviation),
                        }}
                      >
                        {row.deviation === 0 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {row.deviation === 0 ? "Exact" : `±${row.deviation}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Badge Progress ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <Award className="w-5 h-5" style={{ color: WARNING }} />
            <div>
              <h2 className="text-[15px] font-bold">Calibration Badge</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Complete all criteria to earn your Calibration credential.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-muted-foreground font-medium">Overall Progress</span>
                <span className="text-[13px] font-bold" style={{ color: badgeProgress >= 1 ? SUCCESS : PRIMARY }}>
                  {Math.round(badgeProgress * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.01 260)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${badgeProgress * 100}%`, background: badgeProgress >= 1 ? SUCCESS : PRIMARY }}
                />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted-foreground">Clips rated this month</span>
                  <span className="text-[11px] text-muted-foreground">{STATS.clipsThisMonth} / 15</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.01 260)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(clipsProgress, 1) * 100}%`, background: clipsProgress >= 1 ? SUCCESS : PRIMARY }}
                  />
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {BADGE_CRITERIA.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  {c.met ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: SUCCESS }} />
                  ) : (
                    <div
                      className="w-4 h-4 mt-0.5 shrink-0 rounded-full border-2"
                      style={{ borderColor: "oklch(0.40 0.02 260)" }}
                    />
                  )}
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: c.met ? "inherit" : "oklch(0.55 0.02 260)" }}
                    >
                      {c.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
