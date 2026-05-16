/**
 * PracticeExecutionPage — on-floor practice running view for coaches.
 *
 * Mobile-first. Designed for phone/tablet use while actively running a session.
 * Features:
 *   - Live session timer (counting up)
 *   - Block queue with status indicators
 *   - Active block panel with per-block countdown
 *   - Start / Pause / Stop controls
 *   - Post-session reflection modal with player flags
 *   - Progress bar by session time
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  ChevronRight,
  CheckCircle2,
  Clock,
  Plus,
  Flag,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "warmup" | "skill" | "finishing" | "competitive" | "recovery";

type SessionBlock = {
  id: string;
  type: BlockType;
  name: string;
  minutes: number;
  description: string;
  cues: string[];
};

type SessionStatus = "idle" | "running" | "paused" | "done";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  title: "Ball Control + Layup Footwork",
  date: "May 15, 2026",
  totalMin: 45,
  player: "Andrew G.",
  blocks: [
    {
      id: "b1",
      type: "warmup" as BlockType,
      name: "Dynamic Mobility Series",
      minutes: 7,
      description:
        "High-knees → butt-kicks → walking lunges → lateral shuffle baseline-to-baseline. Two full trips, no jogging.",
      cues: [
        "High-knees above the hip",
        "Arms pumping opposite to legs",
        "Lateral shuffle: stay low, don't cross feet",
      ],
    },
    {
      id: "b2",
      type: "skill" as BlockType,
      name: "Two-Ball Stationary Series",
      minutes: 9,
      description:
        "Both hands active: pound simultaneously → alternating → v-dribble → figure-8. 30 sec per move at full speed. Eyes up.",
      cues: [
        "Eyes up — if you look down, you start over",
        "Dribble waist-height max",
        "Stay on the balls of your feet",
      ],
    },
    {
      id: "b3",
      type: "finishing" as BlockType,
      name: "Mikan + Reverse Mikan",
      minutes: 10,
      description:
        "Continuous alternating layups from each side without a dribble between makes. 20 reps each side.",
      cues: [
        "Jump off one foot each rep",
        "Keep the ball high — don't bring to your waist",
        "Soft fingertip touch off the board",
      ],
    },
    {
      id: "b4",
      type: "competitive" as BlockType,
      name: "1v1 Live Finishing",
      minutes: 11,
      description:
        "Player attacks coach 1v1 from the wing with live resistance. Alternate driving sides each rep.",
      cues: [
        "Attack at game speed",
        "Read where contact comes from",
        "Score with your eyes, not your head",
      ],
    },
    {
      id: "b5",
      type: "recovery" as BlockType,
      name: "Stretch & Breathwork",
      minutes: 8,
      description:
        "Hip flexor lunge stretch (45 sec each side) → hamstring stretch → 5 box-breath cycles.",
      cues: ["Relax into the stretch", "Slow the breath intentionally"],
    },
  ] satisfies SessionBlock[],
};

const MOCK_PLAYERS = [
  "Andrew G.",
  "Marcus W.",
  "Tyler B.",
  "Jaylen S.",
  "Cam P.",
  "Noah R.",
];

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_COLORS: Record<BlockType, string> = {
  warmup: "oklch(0.78 0.16 75)",
  skill: "oklch(0.65 0.18 250)",
  finishing: "oklch(0.65 0.2 300)",
  competitive: "oklch(0.6 0.2 330)",
  recovery: "oklch(0.72 0.12 170)",
};

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMM_SS(totalSeconds: number): string {
  const m = Math.floor(Math.abs(totalSeconds) / 60);
  const s = Math.abs(totalSeconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sessionProgress(
  blocks: SessionBlock[],
  currentIdx: number,
  blockSecsLeft: number
): number {
  const totalSec = blocks.reduce((s, b) => s + b.minutes * 60, 0);
  const completedSec = blocks
    .slice(0, currentIdx)
    .reduce((s, b) => s + b.minutes * 60, 0);
  const currentBlockSec = blocks[currentIdx]
    ? blocks[currentIdx].minutes * 60 - blockSecsLeft
    : 0;
  return Math.min(100, Math.round(((completedSec + currentBlockSec) / totalSec) * 100));
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function BlockStatusPill({ status }: { status: "upcoming" | "active" | "done" }) {
  if (status === "done") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
        style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
      >
        <CheckCircle2 className="w-3 h-3" />
        Done
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide animate-pulse"
        style={{ background: `${ACCENT.replace(")", " / 0.18)")}`, color: ACCENT }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: ACCENT }}
        />
        Active
      </span>
    );
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PracticeExecutionPage() {
  const session = MOCK_SESSION;
  const blocks = session.blocks;

  // Core state
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blockSecondsLeft, setBlockSecondsLeft] = useState(
    (blocks[0]?.minutes ?? 0) * 60
  );
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState({ worked: "", adjust: "" });
  const [playerFlags, setPlayerFlags] = useState<Record<string, boolean>>({});
  const [blockExtensions, setBlockExtensions] = useState<Record<string, number>>({});

  // Interval ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current block (clamped so we don't go out of bounds)
  const safeIdx = Math.min(currentBlockIdx, blocks.length - 1);
  const currentBlock = blocks[safeIdx];
  const effectiveBlockSecs =
    (currentBlock?.minutes ?? 0) * 60 + (blockExtensions[currentBlock?.id ?? ""] ?? 0) * 60;

  // Progress
  const progress = sessionProgress(blocks, safeIdx, blockSecondsLeft);

  // Timer logic
  const tick = useCallback(() => {
    setElapsedSeconds((s) => s + 1);
    setBlockSecondsLeft((s) => {
      if (s <= 1) return 0; // hold at 0, don't go negative
      return s - 1;
    });
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, tick]);

  function handleStart() {
    setStatus("running");
    setBlockSecondsLeft(effectiveBlockSecs);
  }

  function handlePause() {
    setStatus("paused");
  }

  function handleResume() {
    setStatus("running");
  }

  function handleStop() {
    setStatus("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowReflection(true);
  }

  function handleMarkDone() {
    if (currentBlockIdx >= blocks.length - 1) {
      // Last block — session complete
      handleStop();
      return;
    }
    const nextIdx = currentBlockIdx + 1;
    setCurrentBlockIdx(nextIdx);
    const nextBlock = blocks[nextIdx];
    setBlockSecondsLeft(
      nextBlock.minutes * 60 + (blockExtensions[nextBlock.id] ?? 0) * 60
    );
    // Haptic-like feedback via a brief status flash (no Capacitor in web)
    toast.success(`Block complete: "${currentBlock.name}"`);
  }

  function handleAdd2Min() {
    setBlockExtensions((prev) => ({
      ...prev,
      [currentBlock.id]: (prev[currentBlock.id] ?? 0) + 2,
    }));
    setBlockSecondsLeft((s) => s + 120);
    toast(`+2 min added to ${currentBlock.name}`);
  }

  function handleSaveReflection() {
    setShowReflection(false);
    toast.success("Reflection saved. Great practice!");
  }

  function getBlockStatus(idx: number): "upcoming" | "active" | "done" {
    if (idx < safeIdx) return "done";
    if (idx === safeIdx && status !== "idle") return "active";
    return "upcoming";
  }

  const blockColor = BLOCK_COLORS[currentBlock?.type ?? "skill"];
  const sessionComplete = status === "done";

  return (
    <AppShell>
      <div className="px-4 pb-24 max-w-lg mx-auto pt-4 space-y-4">

        {/* ── Session Header ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[10px] uppercase tracking-widest font-mono mb-1"
                style={{ color: ACCENT }}
              >
                {session.date} · {session.player}
              </div>
              <h1 className="text-lg font-bold leading-snug">{session.title}</h1>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {session.totalMin} min total · {blocks.length} blocks
              </div>
            </div>

            {/* Live session timer */}
            <div className="shrink-0 text-right">
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ color: status === "running" ? ACCENT : "inherit" }}
              >
                {formatMM_SS(elapsedSeconds)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                elapsed
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Session progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  background: progress >= 80 ? SUCCESS : ACCENT,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        {!sessionComplete && (
          <div className="flex gap-2">
            {status === "idle" && (
              <Button
                className="flex-1 gap-2 min-h-[48px] text-base font-semibold"
                style={{ background: ACCENT }}
                onClick={handleStart}
              >
                <Play className="w-5 h-5" />
                Start Session
              </Button>
            )}
            {status === "running" && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 min-h-[48px]"
                  onClick={handlePause}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 min-h-[48px] px-4"
                  style={{ color: DANGER, borderColor: `${DANGER.replace(")", " / 0.40)")}` }}
                  onClick={handleStop}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
            {status === "paused" && (
              <>
                <Button
                  className="flex-1 gap-2 min-h-[48px] font-semibold"
                  style={{ background: ACCENT }}
                  onClick={handleResume}
                >
                  <Play className="w-5 h-5" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 min-h-[48px] px-4"
                  style={{ color: DANGER, borderColor: `${DANGER.replace(")", " / 0.40)")}` }}
                  onClick={handleStop}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        )}

        {sessionComplete && !showReflection && (
          <div
            className="rounded-2xl border p-4 text-center space-y-1"
            style={{
              borderColor: `${SUCCESS.replace(")", " / 0.30)")}`,
              background: `${SUCCESS.replace(")", " / 0.06)")}`,
            }}
          >
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="w-10 h-10" style={{ color: SUCCESS }} />
            </div>
            <div className="text-base font-bold">Session complete!</div>
            <div className="text-[13px] text-muted-foreground">
              {formatMM_SS(elapsedSeconds)} on the floor
            </div>
            <Button
              className="mt-3 w-full gap-2"
              style={{ background: ACCENT }}
              onClick={() => setShowReflection(true)}
            >
              <Save className="w-4 h-4" />
              Write Reflection
            </Button>
          </div>
        )}

        {/* ── Active Block Panel ──────────────────────────────────────────── */}
        {(status === "running" || status === "paused") && currentBlock && (
          <div
            className="rounded-2xl border-2 p-4 space-y-4"
            style={{ borderColor: blockColor, background: `${blockColor.replace(")", " / 0.05)")}` }}
          >
            {/* Block header */}
            <div className="flex items-start gap-3">
              <div
                className="w-1.5 shrink-0 self-stretch rounded-full"
                style={{ background: blockColor }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="text-[10px] uppercase tracking-widest font-bold mb-1"
                  style={{ color: blockColor }}
                >
                  {currentBlock.type} · Block {safeIdx + 1} of {blocks.length}
                </div>
                <h2 className="text-2xl font-bold leading-tight">{currentBlock.name}</h2>
              </div>

              {/* Per-block countdown */}
              <div className="shrink-0 text-right">
                <div
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    color:
                      blockSecondsLeft <= 60 && blockSecondsLeft > 0
                        ? WARNING
                        : blockSecondsLeft === 0
                        ? DANGER
                        : "inherit",
                  }}
                >
                  {formatMM_SS(blockSecondsLeft)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                  remaining
                </div>
              </div>
            </div>

            {/* Per-block progress bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, 100 - (blockSecondsLeft / effectiveBlockSecs) * 100)}%`,
                  background: blockColor,
                }}
              />
            </div>

            {/* Description */}
            <p className="text-[14px] leading-relaxed text-foreground">
              {currentBlock.description}
            </p>

            {/* Cues */}
            <div className="space-y-2">
              <div
                className="text-[10px] uppercase tracking-widest font-semibold"
                style={{ color: blockColor }}
              >
                Coaching Cues
              </div>
              <ul className="space-y-1.5">
                {currentBlock.cues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <ChevronRight
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: blockColor }}
                    />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Block actions */}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 gap-2 min-h-[52px] text-[15px] font-bold"
                style={{ background: blockColor }}
                onClick={handleMarkDone}
              >
                <CheckCircle2 className="w-5 h-5" />
                {safeIdx >= blocks.length - 1 ? "Finish Session" : "Mark Done"}
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 min-h-[52px] px-4 text-[13px]"
                onClick={handleAdd2Min}
              >
                <Plus className="w-4 h-4" />
                +2 min
              </Button>
            </div>
          </div>
        )}

        {/* ── Block Queue ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
            Session Queue
          </div>
          {blocks.map((block, idx) => {
            const bStatus = getBlockStatus(idx);
            const bColor = BLOCK_COLORS[block.type];
            const isDone = bStatus === "done";
            const isActive = bStatus === "active";

            return (
              <div
                key={block.id}
                className="flex items-stretch gap-0 rounded-xl border border-border bg-card overflow-hidden transition-all duration-200"
                style={
                  isActive
                    ? { borderColor: `${bColor.replace(")", " / 0.50)")}` }
                    : undefined
                }
              >
                {/* Color rail */}
                <div
                  className="w-1 shrink-0"
                  style={{
                    background: bColor,
                    opacity: isDone ? 0.35 : 1,
                  }}
                />

                <div className="flex flex-1 items-center gap-3 px-3 py-3 min-h-[60px]">
                  {/* Block number */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={
                      isDone
                        ? { background: `${SUCCESS.replace(")", " / 0.12)")}`, color: SUCCESS }
                        : isActive
                        ? { background: `${bColor.replace(")", " / 0.15)")}`, color: bColor }
                        : { background: "oklch(0.18 0.005 260)", color: "oklch(0.50 0.02 260)" }
                    }
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  {/* Name + duration */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-semibold leading-snug"
                      style={{
                        opacity: isDone ? 0.5 : 1,
                        textDecoration: isDone ? "line-through" : undefined,
                      }}
                    >
                      {block.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {block.minutes + (blockExtensions[block.id] ?? 0)} min
                      <span
                        className="text-[10px] uppercase tracking-wide font-medium capitalize"
                        style={{ color: bColor, opacity: isDone ? 0.5 : 1 }}
                      >
                        · {block.type}
                      </span>
                    </div>
                  </div>

                  {/* Status pill */}
                  {bStatus !== "upcoming" && <BlockStatusPill status={bStatus} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Post-Session Reflection Modal ──────────────────────────────────── */}
      {showReflection && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-[10px] uppercase tracking-widest font-mono mb-1"
                  style={{ color: ACCENT }}
                >
                  Post-session
                </div>
                <h2 className="text-lg font-bold">Session Reflection</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {formatMM_SS(elapsedSeconds)} on the floor · {session.date}
                </p>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowReflection(false)}
                aria-label="Close reflection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* What worked */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                What worked?
              </label>
              <textarea
                rows={3}
                value={reflection.worked}
                onChange={(e) => setReflection((r) => ({ ...r, worked: e.target.value }))}
                placeholder="e.g. Two-ball series clicked for the first time. Good energy in competitive block."
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>

            {/* What to adjust */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: WARNING }} />
                What to adjust next time?
              </label>
              <textarea
                rows={3}
                value={reflection.adjust}
                onChange={(e) => setReflection((r) => ({ ...r, adjust: e.target.value }))}
                placeholder="e.g. Mikan needs more reps — only got 12 makes each side. Extend to 12 min next session."
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Player flags */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" style={{ color: DANGER }} />
                Flag players who had issues today
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_PLAYERS.map((name) => {
                  const flagged = !!playerFlags[name];
                  return (
                    <label
                      key={name}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all min-h-[44px]"
                      style={
                        flagged
                          ? {
                              borderColor: `${DANGER.replace(")", " / 0.40)")}`,
                              background: `${DANGER.replace(")", " / 0.08)")}`,
                            }
                          : { borderColor: "oklch(0.25 0.01 260)" }
                      }
                    >
                      <input
                        type="checkbox"
                        className="accent-red-400 w-4 h-4 shrink-0"
                        checked={flagged}
                        onChange={() =>
                          setPlayerFlags((prev) => ({ ...prev, [name]: !prev[name] }))
                        }
                      />
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: flagged ? DANGER : "inherit" }}
                      >
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {Object.values(playerFlags).some(Boolean) && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Flag className="w-3 h-3" style={{ color: DANGER }} />
                  Flagged players will appear in your readiness review
                </p>
              )}
            </div>

            {/* Save */}
            <Button
              className="w-full gap-2 min-h-[52px] text-[15px] font-bold"
              style={{ background: ACCENT }}
              onClick={handleSaveReflection}
            >
              <Save className="w-5 h-5" />
              Save Reflection
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
