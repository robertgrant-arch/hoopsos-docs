import { useState } from "react";
import { Link, useRoute } from "wouter";
import { MuxVideoPlayer } from "@/components/film/MuxVideoPlayer";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Tag,
  Plus,
  Film,
  Users,
  Brain,
  ClipboardList,
  Calendar,
  Target,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  X,
  Clock,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

const SESSION = {
  id: "s1",
  title: "Barnegat vs. Toms River",
  type: "game" as const,
  date: "Apr 28, 2025",
  duration: "1:42:33",
  opponent: "Toms River North",
  result: "W 58–51",
  status: "analyzed" as const,
  // When a real Mux asset is ready this will be populated from the API.
  // Set to a non-null string to enable the MuxVideoPlayer in demo mode.
  muxPlaybackId: null as string | null,
};

const CLIPS = [
  {
    id: "c1", startSec: 47, endSec: 72,
    label: "0:47", endLabel: "1:12",
    category: "defense" as const,
    player: "Marcus Davis", initials: "MD", playerId: "p1",
    note: "Wrong closeout angle — biting on pump fake. Correct read: stay vertical, contest without leaving feet.",
    teachable: true, coachReviewed: false,
  },
  {
    id: "c2", startSec: 83, endSec: 98,
    label: "1:23", endLabel: "1:38",
    category: "finishing" as const,
    player: "Marcus Davis", initials: "MD", playerId: "p1",
    note: "Fading on contact layup instead of attacking through. Missed and-1 opportunity. Left-hand finish lost entirely.",
    teachable: true, coachReviewed: false,
  },
  {
    id: "c3", startSec: 133, endSec: 148,
    label: "2:13", endLabel: "2:28",
    category: "offense" as const,
    player: "Marcus Davis", initials: "MD", playerId: "p1",
    note: "Good DHO read — sharp cut, found the pocket pass. Use this as positive teaching example.",
    teachable: false, coachReviewed: true,
  },
  {
    id: "c4", startSec: 225, endSec: 241,
    label: "3:45", endLabel: "4:01",
    category: "defense" as const,
    player: "Team", initials: "TM", playerId: null,
    note: "Help-side breakdown on drive kick-out. Three defenders ball-watched simultaneously. Rotation pattern needs work.",
    teachable: true, coachReviewed: false,
  },
  {
    id: "c5", startSec: 312, endSec: 328,
    label: "5:12", endLabel: "5:28",
    category: "transition" as const,
    player: "Jordan Smith", initials: "JS", playerId: "p2",
    note: "Great push-pass in transition — led the cutter perfectly at full speed.",
    teachable: false, coachReviewed: true,
  },
  {
    id: "c6", startSec: 453, endSec: 472,
    label: "7:33", endLabel: "7:52",
    category: "offense" as const,
    player: "Team", initials: "TM", playerId: null,
    note: "Perfect Horns execution — spacing, timing, ball movement all textbook. Clip this for playbook.",
    teachable: false, coachReviewed: true,
  },
  {
    id: "c7", startSec: 551, endSec: 568,
    label: "9:11", endLabel: "9:28",
    category: "finishing" as const,
    player: "Tyler Brown", initials: "TB", playerId: "p3",
    note: "Euro step timing was correct but weak-hand finish failed under contact. Left Mikan drill prescribed.",
    teachable: true, coachReviewed: false,
  },
  {
    id: "c8", startSec: 704, endSec: 722,
    label: "11:44", endLabel: "12:02",
    category: "defense" as const,
    player: "Team", initials: "TM", playerId: null,
    note: "Ball-screen communication error — both defenders went with ball handler, leaving screener's man wide open.",
    teachable: true, coachReviewed: false,
  },
];

const AI_ANALYSIS = {
  summary:
    "Strong half-court offensive execution but recurring defensive breakdowns on kick-out rotations. Marcus Davis shows elite DHO instincts and catch-and-shoot mechanics but loses effectiveness on left-side contact finishes — 3 missed and-1 opportunities in the 4th quarter. Transition offense is a clear strength.",
  keyObservations: [
    "Marcus Davis: 3 missed left-hand contact finishes in 4th quarter — technique or fatigue gap",
    "Help-side defense broke down on 6 of 14 kick-out possessions — rotation pattern needs drilling",
    "Transition offense is elite — 4 clean push-pass reads in 2nd half",
    "Ball-screen communication ('pop' vs. 'roll' calls) missed on 2 possessions, led to open 3s",
    "Horns set spacing was perfect in 3rd quarter — reliable action to build on",
  ],
  teachableMoments: 5,
  suggestedAssignments: [
    {
      id: "sa1",
      player: "Marcus Davis",
      playerId: "p1",
      drill: "Contact layup series (left hand only)",
      clipId: "c2",
      reason: "2 missed left-side contact finishes in 4th quarter",
    },
    {
      id: "sa2",
      player: "Team",
      playerId: null,
      drill: "Drive kick-out defensive rotations (shell drill)",
      clipId: "c4",
      reason: "Recurring help-side breakdown — 6 possessions this game",
    },
    {
      id: "sa3",
      player: "Tyler Brown",
      playerId: "p3",
      drill: "Left-hand Mikan drill (3× per week)",
      clipId: "c7",
      reason: "Euro step timing is there but weak-hand finish fails under contact",
    },
  ],
};

const PLAYERS_IN_SESSION = [
  { id: "p1", name: "Marcus Davis",  initials: "MD", position: "PG", clipCount: 3 },
  { id: "p2", name: "Jordan Smith",  initials: "JS", position: "SG", clipCount: 1 },
  { id: "p3", name: "Tyler Brown",   initials: "TB", position: "SF", clipCount: 1 },
  { id: "p4", name: "Team",          initials: "TM", position: "—",  clipCount: 3 },
];

// ── Category color map ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  offense:    { bg: "bg-[oklch(0.55_0.18_150)]/15", text: "text-[oklch(0.65_0.18_150)]", dot: "oklch(0.55 0.18 150)", border: "border-l-[oklch(0.55_0.18_150)]" },
  defense:    { bg: "bg-[oklch(0.55_0.2_25)]/15",   text: "text-[oklch(0.7_0.2_25)]",    dot: "oklch(0.55 0.2 25)",   border: "border-l-[oklch(0.55_0.2_25)]" },
  finishing:  { bg: "bg-[oklch(0.72_0.17_75)]/15",  text: "text-[oklch(0.65_0.17_75)]",  dot: "oklch(0.72 0.17 75)",  border: "border-l-[oklch(0.72_0.17_75)]" },
  transition: { bg: "bg-[oklch(0.72_0.18_290)]/15", text: "text-[oklch(0.65_0.18_290)]", dot: "oklch(0.72 0.18 290)", border: "border-l-[oklch(0.72_0.18_290)]" },
  footwork:   { bg: "bg-primary/10",                 text: "text-primary",                dot: "oklch(0.6 0.18 260)",  border: "border-l-primary" },
  IQ:         { bg: "bg-[oklch(0.68_0.15_320)]/15", text: "text-[oklch(0.68_0.15_320)]", dot: "oklch(0.68 0.15 320)", border: "border-l-[oklch(0.68_0.15_320)]" },
};

// Total duration in seconds for the seekbar (1:42:33)
const TOTAL_SECS = 6153;

// ── Component ──────────────────────────────────────────────────────────────────

export function FilmSessionDetail() {
  const [, params] = useRoute("/app/coach/film/sessions/:id");
  const _sessionId = params?.id ?? SESSION.id;

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  // Right panel tab
  const [activeTab, setActiveTab] = useState<"clips" | "players" | "ai">("clips");

  // Clips tab filter
  const [clipFilter, setClipFilter] = useState<string>("all");

  // Selected clip
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Reviewed clips
  const [reviewedClips, setReviewedClips] = useState<Set<string>>(
    new Set(CLIPS.filter((c) => c.coachReviewed).map((c) => c.id))
  );

  // Tag form state
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [tagPlayer, setTagPlayer] = useState("");
  const [tagCategory, setTagCategory] = useState("offense");
  const [tagNote, setTagNote] = useState("");

  // Dismissed AI suggestions
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const selectedClip = selectedClipId ? CLIPS.find((c) => c.id === selectedClipId) ?? null : null;

  const filteredClips = clipFilter === "all"
    ? CLIPS
    : CLIPS.filter((c) => c.category === clipFilter);

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTagFormOpen(false);
    setTagPlayer("");
    setTagCategory("offense");
    setTagNote("");
    toast("Tag added");
  }

  function getClipForSuggestion(clipId: string) {
    return CLIPS.find((c) => c.id === clipId);
  }

  const teachableClips = CLIPS.filter((c) => c.teachable);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/app/coach/film" className="hover:text-foreground transition-colors">
            Film Room
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{SESSION.title}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Film className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">{SESSION.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{SESSION.date}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <Badge className="text-[11px] h-5 bg-emerald-500/15 text-emerald-500 border-0 font-medium">
                  {SESSION.result}
                </Badge>
                <Badge className="text-[11px] h-5 bg-primary/10 text-primary border-0 font-medium capitalize">
                  {SESSION.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/coach/film">
                <ChevronRight className="w-3.5 h-3.5 rotate-180 mr-1" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ── Left: Video player ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden bg-[oklch(0.08_0.005_260)] border border-white/[0.06] flex flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                <span className="text-sm font-medium text-white/90 truncate">{SESSION.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="text-[11px] h-5 bg-emerald-500/15 text-emerald-400 border-0 font-medium">
                    {SESSION.result}
                  </Badge>
                  <span className="text-xs text-white/40">{SESSION.date}</span>
                </div>
              </div>

              {/* Video area */}
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                {SESSION.muxPlaybackId ? (
                  /* Real Mux player — shown when a playback ID is available */
                  <MuxVideoPlayer
                    playbackId={SESSION.muxPlaybackId}
                    startTime={currentTimeSec}
                    onTimeUpdate={(t) => setCurrentTimeSec(Math.floor(t))}
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  /* Mock player — fallback for demo mode (no Mux asset yet) */
                  <div className="absolute inset-0 bg-[oklch(0.05_0.005_260)] flex flex-col items-center justify-center gap-3">
                    {/* Simulated dark scanline overlay */}
                    <div className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(1 0 0 / 0.3) 2px, oklch(1 0 0 / 0.3) 3px)",
                      }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
                      onClick={() => setIsPlaying((p) => !p)}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 text-white/70" />
                      ) : (
                        <Play className="w-7 h-7 text-white/70 translate-x-0.5" />
                      )}
                    </div>
                    <p className="relative text-white/30 text-sm tracking-wide select-none">
                      Barnegat vs. Toms River · Apr 28
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="px-4 py-3 flex flex-col gap-3">
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[0.76%] bg-primary rounded-full" />
                </div>

                {/* Playback buttons + time */}
                <div className="flex items-center gap-3">
                  <button className="text-white/50 hover:text-white/80 transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    onClick={() => setIsPlaying((p) => !p)}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white translate-x-0.5" />
                    )}
                  </button>
                  <button className="text-white/50 hover:text-white/80 transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-white/40 ml-1 font-mono">
                    0:47 / {SESSION.duration}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/30">{SESSION.duration}</span>
                  </div>
                </div>

                {/* Clip marker seekbar */}
                <div className="relative">
                  <div className="w-full h-2 rounded-full bg-white/[0.06] relative">
                    {CLIPS.map((clip) => {
                      const pct = (clip.startSec / TOTAL_SECS) * 100;
                      const colors = CATEGORY_COLORS[clip.category] ?? CATEGORY_COLORS.offense;
                      return (
                        <button
                          key={clip.id}
                          title={`${clip.label} · ${clip.player} · ${clip.category}`}
                          onClick={() => {
                            setSelectedClipId(clip.id);
                            setActiveTab("clips");
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-black/40 hover:scale-150 transition-transform z-10 focus:outline-none"
                          style={{
                            left: `${pct}%`,
                            backgroundColor: colors.dot,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/20">0:00</span>
                    <span className="text-[10px] text-white/20">{SESSION.duration}</span>
                  </div>
                </div>

                {/* Add Tag button */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {(["offense", "defense", "finishing", "transition"] as const).map((cat) => {
                      const colors = CATEGORY_COLORS[cat];
                      return (
                        <span
                          key={cat}
                          className="flex items-center gap-1 text-[10px] text-white/30"
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: colors.dot }}
                          />
                          <span className="capitalize">{cat}</span>
                        </span>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-white/10 text-white/60 hover:text-white bg-transparent hover:bg-white/10"
                    onClick={() => setTagFormOpen((o) => !o)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Inline tag form */}
              {tagFormOpen && (
                <div className="border-t border-white/[0.06] px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      New Tag
                    </span>
                    <button
                      onClick={() => setTagFormOpen(false)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <form onSubmit={handleTagSubmit} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-white/40">Timestamp</label>
                        <input
                          type="text"
                          defaultValue="0:47"
                          className="h-8 rounded-md bg-white/[0.06] border border-white/10 text-white text-xs px-2.5 focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-white/40">Player</label>
                        <select
                          value={tagPlayer}
                          onChange={(e) => setTagPlayer(e.target.value)}
                          className="h-8 rounded-md bg-white/[0.06] border border-white/10 text-white text-xs px-2 focus:outline-none focus:border-primary/50 appearance-none"
                        >
                          <option value="">Select player…</option>
                          {PLAYERS_IN_SESSION.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-white/40">Category</label>
                      <select
                        value={tagCategory}
                        onChange={(e) => setTagCategory(e.target.value)}
                        className="h-8 rounded-md bg-white/[0.06] border border-white/10 text-white text-xs px-2 focus:outline-none focus:border-primary/50 appearance-none"
                      >
                        {["offense", "defense", "finishing", "footwork", "transition", "IQ"].map((c) => (
                          <option key={c} value={c} className="capitalize">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-white/40">Note</label>
                      <Textarea
                        value={tagNote}
                        onChange={(e) => setTagNote(e.target.value)}
                        placeholder="Describe the play or coaching point…"
                        rows={2}
                        className="resize-none bg-white/[0.06] border-white/10 text-white text-xs placeholder:text-white/20 focus:border-primary/50"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-white/40 hover:text-white"
                        onClick={() => setTagFormOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Save Tag
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Tabs panel ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-0">
            {/* Tab bar */}
            <div className="flex border-b border-border bg-card rounded-t-xl overflow-hidden">
              {(
                [
                  { key: "clips", label: "Clips", icon: <Film className="w-3.5 h-3.5" /> },
                  { key: "players", label: "Players", icon: <Users className="w-3.5 h-3.5" /> },
                  { key: "ai", label: "AI Analysis", icon: <Brain className="w-3.5 h-3.5" /> },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-card rounded-b-xl border border-t-0 border-border flex-1 overflow-hidden">
              {/* ── Clips tab ──────────────────────────────────────────────── */}
              {activeTab === "clips" && (
                <div className="flex flex-col h-full">
                  {/* Filter pills */}
                  <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border flex-wrap">
                    {["all", "offense", "defense", "finishing", "transition"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setClipFilter(f)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${
                          clipFilter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {f === "all" ? "All" : f}
                      </button>
                    ))}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {filteredClips.length} clips
                    </span>
                  </div>

                  {/* Clip list */}
                  <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[340px] lg:max-h-none">
                    {filteredClips.map((clip) => {
                      const colors = CATEGORY_COLORS[clip.category] ?? CATEGORY_COLORS.offense;
                      const isSelected = selectedClipId === clip.id;
                      const isReviewed = reviewedClips.has(clip.id);
                      return (
                        <button
                          key={clip.id}
                          onClick={() => setSelectedClipId(isSelected ? null : clip.id)}
                          className={`w-full text-left px-3 py-2.5 border-l-[3px] transition-colors hover:bg-muted/50 ${
                            isSelected ? "bg-primary/5 border-l-primary" : colors.border + " border-l-transparent"
                          }`}
                          style={!isSelected ? { borderLeftColor: colors.dot } : undefined}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Initials avatar */}
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                              style={{
                                backgroundColor: colors.dot + "25",
                                color: colors.dot,
                              }}
                            >
                              {clip.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  {clip.label}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}
                                >
                                  {clip.category}
                                </span>
                                <span className="text-[11px] text-foreground/80 font-medium">
                                  {clip.player}
                                </span>
                                {clip.teachable && (
                                  <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                                )}
                                {isReviewed && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[12px] text-muted-foreground line-clamp-2 leading-snug">
                                {clip.note}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected clip expanded panel */}
                  {selectedClip && (
                    <div className="border-t border-border bg-muted/30 px-4 py-3 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {selectedClip.label} – {selectedClip.endLabel}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[selectedClip.category].bg} ${CATEGORY_COLORS[selectedClip.category].text}`}
                          >
                            {selectedClip.category}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedClipId(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[13px] text-foreground/90 leading-relaxed">
                        {selectedClip.note}
                      </p>

                      {selectedClip.playerId && (
                        <Link
                          href={`/app/coach/players/${selectedClip.playerId}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                        >
                          {selectedClip.player}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => toast("Assignment created from clip")}
                        >
                          <ClipboardList className="w-3 h-3 mr-1" />
                          Assign to Player
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => toast("Added to next practice plan")}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Add to Practice Plan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => toast("Linked to development plan")}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Add to Player IDP
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[11px]"
                          onClick={() => toast("Added to playlist")}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Add to Playlist
                        </Button>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reviewedClips.has(selectedClip.id)}
                            onChange={() => {
                              setReviewedClips((prev) => {
                                const next = new Set(prev);
                                if (next.has(selectedClip.id)) {
                                  next.delete(selectedClip.id);
                                } else {
                                  next.add(selectedClip.id);
                                }
                                return next;
                              });
                            }}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                          <span className="text-[11px] text-muted-foreground">Mark reviewed</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Players tab ────────────────────────────────────────────── */}
              {activeTab === "players" && (
                <div className="divide-y divide-border">
                  {PLAYERS_IN_SESSION.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {player.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{player.name}</span>
                          <span className="text-[11px] text-muted-foreground">{player.position}</span>
                          <Badge className="text-[10px] h-4 bg-muted text-muted-foreground border-0 font-medium">
                            {player.clipCount} clips
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <button
                            onClick={() => {
                              setClipFilter(player.name === "Team" ? "all" : "all");
                              setActiveTab("clips");
                            }}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            View clips →
                          </button>
                          {player.id !== "p4" && (
                            <Link
                              href={`/app/coach/players/${player.id}`}
                              className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                            >
                              View Profile
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AI Analysis tab ────────────────────────────────────────── */}
              {activeTab === "ai" && (
                <div className="flex flex-col divide-y divide-border overflow-y-auto max-h-[680px]">
                  {/* Session Summary */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Session Summary
                      </span>
                    </div>
                    <p className="text-[13.5px] text-foreground/85 leading-relaxed">
                      {AI_ANALYSIS.summary}
                    </p>
                  </div>

                  {/* Key Observations */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Key Observations
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {AI_ANALYSIS.keyObservations.map((obs, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-[5px] shrink-0" />
                          <span className="text-[12.5px] text-foreground/80 leading-snug">{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Teachable Moments */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Teachable Moments
                      </span>
                      <Badge className="ml-auto text-[10px] h-4 bg-amber-400/15 text-amber-400 border-0 font-medium">
                        {AI_ANALYSIS.teachableMoments} detected
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {teachableClips.map((clip) => {
                        const colors = CATEGORY_COLORS[clip.category] ?? CATEGORY_COLORS.offense;
                        return (
                          <div
                            key={clip.id}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedClipId(clip.id);
                              setActiveTab("clips");
                            }}
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[11px] font-mono text-muted-foreground">{clip.label}</span>
                                <span className="text-[11px] font-medium">{clip.player}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-px rounded-full capitalize ${colors.bg} ${colors.text}`}
                                >
                                  {clip.category}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-muted-foreground line-clamp-1 leading-snug">
                                {clip.note}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggested Assignments */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Suggested Assignments
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {AI_ANALYSIS.suggestedAssignments
                        .filter((s) => !dismissedSuggestions.has(s.id))
                        .map((suggestion) => {
                          const linkedClip = getClipForSuggestion(suggestion.clipId);
                          return (
                            <div
                              key={suggestion.id}
                              className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[12.5px] font-semibold leading-tight">
                                    {suggestion.player}
                                  </p>
                                  <p className="text-[12px] text-foreground/80 mt-0.5">
                                    {suggestion.drill}
                                  </p>
                                </div>
                              </div>
                              <p className="text-[11.5px] text-muted-foreground leading-snug">
                                {suggestion.reason}
                              </p>
                              {linkedClip && (
                                <button
                                  onClick={() => {
                                    setSelectedClipId(linkedClip.id);
                                    setActiveTab("clips");
                                  }}
                                  className="text-[11px] text-primary hover:underline flex items-center gap-1 w-fit"
                                >
                                  <Film className="w-3 h-3" />
                                  Clip at {linkedClip.label}
                                </button>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] flex-1"
                                  onClick={() =>
                                    toast(`Assignment created for ${suggestion.player}`)
                                  }
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Accept &amp; Assign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px] text-muted-foreground"
                                  onClick={() => {
                                    setDismissedSuggestions((prev) => new Set(Array.from(prev).concat(suggestion.id)));
                                    toast("Suggestion dismissed");
                                  }}
                                >
                                  Override
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default FilmSessionDetail;
