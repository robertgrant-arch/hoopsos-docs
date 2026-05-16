/**
 * PlayerNarrativePage — Coach writes and manages player narratives.
 * Route: /app/coach/recruiting/narratives
 */
import { useState, useRef, useEffect } from "react";
import {
  Lock,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type NarrativeStatus = "none" | "draft" | "submitted" | "approved" | "public" | "edit_requested";

type PlayerNarrative = {
  playerId: string;
  playerName: string;
  position: string;
  gradYear: number;
  height: string;
  seasonsWithCoach: number;
  badgeCount: number;
  assessmentCount: number;
  topSkillScores: Array<{ skill: string; score: number; delta: number }>;
  allSkillScores: Record<string, number>;
  coachabilityIndex: number;
  narrativeStatus: NarrativeStatus;
  narrativeText: string;
  narrativeWordCount: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  editRequestNote?: string;
  familyName: string;
};

type ObservationNote = {
  id: string;
  playerId: string;
  date: string;
  text: string;
  context: string;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

const SKILL_LABELS: Record<string, string> = {
  ball_handling: "Ball Handling",
  shooting:      "Shooting",
  finishing:     "Finishing",
  defense:       "Defense",
  footwork:      "Footwork",
  iq_reads:      "IQ / Reads",
  athleticism:   "Athleticism",
  conditioning:  "Conditioning",
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MOCK_PLAYERS: PlayerNarrative[] = [
  {
    playerId: "p1", playerName: "Jordan Mills", position: "PG", gradYear: 2027, height: "6'1\"",
    seasonsWithCoach: 3, badgeCount: 5, assessmentCount: 14, coachabilityIndex: 9.1, familyName: "Mills Family",
    topSkillScores: [
      { skill: "iq_reads",     score: 8.7, delta: 0.9 },
      { skill: "defense",      score: 8.1, delta: 0.8 },
      { skill: "conditioning", score: 8.2, delta: 0.5 },
    ],
    allSkillScores: { ball_handling: 8.4, shooting: 7.2, finishing: 7.8, defense: 8.1, footwork: 7.5, iq_reads: 8.7, athleticism: 7.9, conditioning: 8.2 },
    narrativeStatus: "approved",
    narrativeText: "Jordan Mills is one of the most complete lead guards I've coached in my career. Over three seasons with our program, he has developed from a promising athlete into a disciplined floor general with a genuine understanding of the game at both ends. His IQ reads sit at 8.7 on our assessment scale — the highest on the roster — and that shows up in how he manages late-game situations, runs pick-and-roll coverages, and communicates rotations before they're needed.\n\nWhat distinguishes Jordan is his coachability. He's been the first to review film, the first to ask clarifying questions, and the first to apply corrective feedback in the next session. His 97% attendance across three seasons reflects an athlete who treats this program as a professional commitment. Division I coaches should know: this is a player who will make your program better the moment he arrives.",
    narrativeWordCount: 148,
    approvedAt: "2026-04-30",
    approvedBy: "Jordan Mills",
  },
  {
    playerId: "p2", playerName: "Marcus Webb", position: "SG", gradYear: 2027, height: "6'3\"",
    seasonsWithCoach: 2, badgeCount: 3, assessmentCount: 11, coachabilityIndex: 8.4, familyName: "Webb Family",
    topSkillScores: [
      { skill: "shooting",     score: 8.6, delta: 0.9 },
      { skill: "athleticism",  score: 8.3, delta: 0.7 },
      { skill: "conditioning", score: 7.8, delta: 0.4 },
    ],
    allSkillScores: { ball_handling: 7.1, shooting: 8.6, finishing: 7.4, defense: 7.0, footwork: 7.2, iq_reads: 7.5, athleticism: 8.3, conditioning: 7.8 },
    narrativeStatus: "submitted",
    narrativeText: "Marcus Webb is the kind of off-ball shooter that modern basketball requires. His shooting assessment has climbed from 7.7 to 8.6 over two seasons — a trajectory that reflects real skill development, not just physical maturation. What stands out on film is his movement quality: he's always in the right spot, he understands space, and his catch-and-shoot mechanics are already at a college-ready standard.\n\nBeyond shooting, Marcus has improved his defensive engagement significantly in the second half of this season. He won't be a stopper, but he's become a reliable team defender who knows his assignments. Coaches evaluating him for offensive fit should feel confident they're getting a versatile offensive weapon who won't be a liability on the other end.",
    narrativeWordCount: 132,
    submittedAt: "2026-05-01",
  },
  {
    playerId: "p3", playerName: "Devon Price", position: "SF", gradYear: 2026, height: "6'5\"",
    seasonsWithCoach: 2, badgeCount: 2, assessmentCount: 9, coachabilityIndex: 7.9, familyName: "Price Family",
    topSkillScores: [
      { skill: "athleticism", score: 8.5, delta: 0.6 },
      { skill: "footwork",    score: 8.0, delta: 0.9 },
      { skill: "finishing",   score: 8.2, delta: 0.7 },
    ],
    allSkillScores: { ball_handling: 6.8, shooting: 7.4, finishing: 8.2, defense: 7.9, footwork: 8.0, iq_reads: 7.2, athleticism: 8.5, conditioning: 8.1 },
    narrativeStatus: "draft",
    narrativeText: "Devon Price is a long, versatile wing who has made measurable strides in his footwork and finishing this season. His athleticism scores are among the highest in the program, and he's beginning to weaponize that length in ways that were inconsistent a year ago.",
    narrativeWordCount: 46,
    editRequestNote: undefined,
  },
  {
    playerId: "p4", playerName: "Isaiah Thomas", position: "PF", gradYear: 2027, height: "6'7\"",
    seasonsWithCoach: 1, badgeCount: 2, assessmentCount: 8, coachabilityIndex: 8.2, familyName: "Thomas Family",
    topSkillScores: [
      { skill: "defense",    score: 8.4, delta: 0.7 },
      { skill: "finishing",  score: 8.1, delta: 0.8 },
      { skill: "footwork",   score: 7.8, delta: 0.5 },
    ],
    allSkillScores: { ball_handling: 6.2, shooting: 6.8, finishing: 8.1, defense: 8.4, footwork: 7.8, iq_reads: 7.0, athleticism: 8.0, conditioning: 7.5 },
    narrativeStatus: "edit_requested",
    narrativeText: "Isaiah Thomas joined our program this season and immediately established himself as one of our most impactful defensive players. His rim protection instincts are natural — he doesn't just block shots, he alters trajectories and communicates weak-side help at a level I rarely see in first-year players.",
    narrativeWordCount: 52,
    editRequestNote: "We appreciate the write-up but would prefer less emphasis on rebounding and more on Isaiah's academic commitment and leadership. Can you add a paragraph about his role as a team mentor?",
    submittedAt: "2026-04-25",
  },
  {
    playerId: "p5", playerName: "Cameron Lee", position: "C", gradYear: 2027, height: "6'9\"",
    seasonsWithCoach: 2, badgeCount: 1, assessmentCount: 7, coachabilityIndex: 8.8, familyName: "Lee Family",
    topSkillScores: [
      { skill: "defense",      score: 8.7, delta: 1.1 },
      { skill: "finishing",    score: 7.8, delta: 0.6 },
      { skill: "conditioning", score: 7.2, delta: 0.5 },
    ],
    allSkillScores: { ball_handling: 5.5, shooting: 5.9, finishing: 7.8, defense: 8.7, footwork: 7.4, iq_reads: 6.8, athleticism: 7.9, conditioning: 7.2 },
    narrativeStatus: "none",
    narrativeText: "",
    narrativeWordCount: 0,
  },
  {
    playerId: "p6", playerName: "Tyler Brooks", position: "SG", gradYear: 2028, height: "6'2\"",
    seasonsWithCoach: 1, badgeCount: 1, assessmentCount: 6, coachabilityIndex: 7.5, familyName: "Brooks Family",
    topSkillScores: [
      { skill: "shooting",     score: 7.8, delta: 0.8 },
      { skill: "ball_handling",score: 7.4, delta: 0.5 },
      { skill: "athleticism",  score: 7.6, delta: 0.4 },
    ],
    allSkillScores: { ball_handling: 7.4, shooting: 7.8, finishing: 7.1, defense: 6.9, footwork: 7.0, iq_reads: 7.3, athleticism: 7.6, conditioning: 7.4 },
    narrativeStatus: "none",
    narrativeText: "",
    narrativeWordCount: 0,
  },
  {
    playerId: "p7", playerName: "Andre Johnson", position: "PG", gradYear: 2027, height: "5'11\"",
    seasonsWithCoach: 2, badgeCount: 3, assessmentCount: 10, coachabilityIndex: 8.9, familyName: "Johnson Family",
    topSkillScores: [
      { skill: "iq_reads",     score: 8.2, delta: 0.8 },
      { skill: "ball_handling",score: 8.0, delta: 0.7 },
      { skill: "conditioning", score: 8.0, delta: 0.6 },
    ],
    allSkillScores: { ball_handling: 8.0, shooting: 7.0, finishing: 7.3, defense: 7.6, footwork: 7.2, iq_reads: 8.2, athleticism: 7.4, conditioning: 8.0 },
    narrativeStatus: "draft",
    narrativeText: "Andre Johnson is a smart, disciplined point guard who understands the game at a level that belies his age. His ball handling and IQ scores are consistently in the top two on our roster.",
    narrativeWordCount: 34,
  },
  {
    playerId: "p8", playerName: "Darius King", position: "SF", gradYear: 2026, height: "6'4\"",
    seasonsWithCoach: 1, badgeCount: 0, assessmentCount: 5, coachabilityIndex: 7.2, familyName: "King Family",
    topSkillScores: [
      { skill: "athleticism", score: 8.2, delta: 0.5 },
      { skill: "footwork",    score: 7.8, delta: 0.8 },
      { skill: "finishing",   score: 7.6, delta: 0.5 },
    ],
    allSkillScores: { ball_handling: 6.5, shooting: 6.8, finishing: 7.6, defense: 7.1, footwork: 7.8, iq_reads: 6.9, athleticism: 8.2, conditioning: 7.7 },
    narrativeStatus: "none",
    narrativeText: "",
    narrativeWordCount: 0,
  },
];

const MOCK_OBSERVATIONS: ObservationNote[] = [
  { id: "obs1", playerId: "p1", date: "2026-05-08", text: "Jordan ran the whole offensive set from memory against a press break. Completely under control — no panic, no rushed decisions.", context: "Practice" },
  { id: "obs2", playerId: "p1", date: "2026-05-03", text: "First to the gym, last to leave again. Worked on off-hand pull-up for 40 minutes solo before group session.", context: "Pre-practice" },
  { id: "obs3", playerId: "p1", date: "2026-04-28", text: "Called out a screen that wasn't in the play — saved us from a turnover in crunch time. Genuine floor general moment.", context: "Game vs. Westfield" },
  { id: "obs4", playerId: "p1", date: "2026-04-21", text: "Had a quiet start, came to me at halftime and asked for a specific adjustment. Made it immediately in the second half.", context: "Game vs. Austin Elite" },
  { id: "obs5", playerId: "p1", date: "2026-04-15", text: "Stayed back after practice to help Darius work on defensive positioning. Didn't make it a thing — just did it.", context: "Practice" },
  { id: "obs6", playerId: "p2", date: "2026-05-06", text: "Hit four consecutive pull-up threes in transition during scrimmage. Footwork on each one was textbook.", context: "Scrimmage" },
  { id: "obs7", playerId: "p2", date: "2026-04-29", text: "Made a key off-ball cut that opened a driving lane — still doesn't look for his own shot when others are open.", context: "Practice" },
  { id: "obs8", playerId: "p2", date: "2026-04-20", text: "Defensive effort has elevated noticeably. Stayed attached off screens for the entire first half.", context: "Game" },
  { id: "obs9", playerId: "p2", date: "2026-04-12", text: "Asked for extra film review time to analyze how he was being defended at the tournament. Proactive engagement.", context: "Post-tournament" },
  { id: "obs10",playerId: "p2", date: "2026-04-06", text: "Couldn't get his shot going in the first quarter, but his body language stayed positive and teammates rallied behind him.", context: "Game" },
  { id: "obs11",playerId: "p3", date: "2026-05-05", text: "Devon's footwork in the post has improved dramatically. Three possessions in a row where he used a drop step correctly — hasn't done that before.", context: "Practice" },
  { id: "obs12",playerId: "p3", date: "2026-04-25", text: "Contested a shot from behind that resulted in a turnover — not a block but elite awareness of help-side positioning.", context: "Game" },
  { id: "obs13",playerId: "p4", date: "2026-05-07", text: "Isaiah hasn't missed a defensive assignment in two weeks. Knows every scheme, communicates them to teammates without being asked.", context: "Practice" },
  { id: "obs14",playerId: "p4", date: "2026-04-30", text: "Took the newest player under his wing in warm-ups without any prompting. Good team culture behavior for a first-year player.", context: "Practice" },
  { id: "obs15",playerId: "p5", date: "2026-05-04", text: "Cameron blocked three shots in the scrimmage — all legitimate, none from behind. His timing is exceptional.", context: "Scrimmage" },
  { id: "obs16",playerId: "p7", date: "2026-05-09", text: "Andre's decision-making in pick-and-roll is at a different level than it was in October. Identifies the third option before it develops.", context: "Practice" },
  { id: "obs17",playerId: "p7", date: "2026-05-01", text: "Made the 'boring' pass four times in a row when a turnover-risk play was available. IQ over ego.", context: "Game" },
];

const EXAMPLE_FRAGMENTS = [
  {
    playerName: "Example: Point Guard",
    text: "Over two seasons, he has gone from a reactive ball-handler to a proactive decision-maker. His assist-to-turnover ratio of 3.8 isn't a stat — it's evidence of someone who understands that the best pass is sometimes the one you don't take. I've observed him call out defensive rotations before the help was needed on three separate game occasions this season.",
  },
  {
    playerName: "Example: Wing",
    text: "What separates him from athletes with similar physical profiles is his footwork consistency. Our footwork assessment has gone from 6.2 to 8.0 over 18 months — and film confirms it isn't just drill performance. The technique carries over into live play, particularly on drive finishes and close-out recoveries.",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusMeta(status: NarrativeStatus) {
  switch (status) {
    case "none":           return { label: "No Narrative",          color: "oklch(0.40 0.01 260)",  dot: "oklch(0.35 0.01 260)"  };
    case "draft":          return { label: "Draft",                 color: WARNING,                  dot: WARNING                 };
    case "submitted":      return { label: "Pending Approval",      color: WARNING,                  dot: WARNING                 };
    case "approved":       return { label: "Approved",              color: SUCCESS,                  dot: SUCCESS                 };
    case "public":         return { label: "Public",                color: PRIMARY,                  dot: PRIMARY                 };
    case "edit_requested": return { label: "Edits Requested",       color: DANGER,                   dot: DANGER                  };
  }
}

/* -------------------------------------------------------------------------- */
/* Mini skill bar chart SVG                                                    */
/* -------------------------------------------------------------------------- */

function MiniSkillBars({ scores }: { scores: Record<string, number> }) {
  const skills = Object.entries(scores);
  return (
    <div className="space-y-1.5">
      {skills.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <div className="text-[10px] text-[var(--text-muted)] w-20 shrink-0 truncate">{SKILL_LABELS[k] ?? k}</div>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(v / 10) * 100}%`, background: v >= 8 ? SUCCESS : v >= 7 ? PRIMARY : WARNING }}
            />
          </div>
          <div className="text-[10px] font-mono shrink-0 w-6 text-right" style={{ color: v >= 8 ? SUCCESS : "var(--text-muted)" }}>
            {v.toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Player list item                                                            */
/* -------------------------------------------------------------------------- */

function PlayerListItem({
  player,
  selected,
  onClick,
}: {
  player: PlayerNarrative;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = statusMeta(player.narrativeStatus);
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-3 rounded-xl transition-all border"
      style={{
        borderColor: selected ? PRIMARY : "transparent",
        background:  selected ? "oklch(0.72 0.18 290 / 0.08)" : "transparent",
        minHeight: 44,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: meta.dot }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{player.playerName}</div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">
            {player.position} · {player.gradYear}
            {player.narrativeStatus !== "none" && player.narrativeWordCount > 0
              ? ` · ${player.narrativeWordCount}w`
              : ""}
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${meta.color.replace(")", " / 0.12)")}`, color: meta.color }}
        >
          {meta.label}
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function PlayerNarrativePage() {
  const [players, setPlayers]           = useState<PlayerNarrative[]>(MOCK_PLAYERS);
  const [selectedId, setSelectedId]     = useState<string>(MOCK_PLAYERS[0].playerId);
  const [editText, setEditText]         = useState<string>(MOCK_PLAYERS[0].narrativeText);
  const [savedTime, setSavedTime]       = useState<Date | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [requestingEdit, setRequestingEdit] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = players.find(p => p.playerId === selectedId)!;
  const observations = MOCK_OBSERVATIONS.filter(o => o.playerId === selectedId).slice(0, 5);
  const wc = wordCount(editText);
  const isLocked = player.narrativeStatus === "approved" || player.narrativeStatus === "public";

  // Switch player
  useEffect(() => {
    const p = players.find(pl => pl.playerId === selectedId);
    if (p) setEditText(p.narrativeText);
    setSavedTime(null);
  }, [selectedId]);

  // Auto-save
  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      if (!isLocked && editText !== player.narrativeText) {
        setPlayers(prev => prev.map(p =>
          p.playerId === selectedId
            ? { ...p, narrativeText: editText, narrativeWordCount: wordCount(editText) }
            : p
        ));
        setSavedTime(new Date());
      }
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [editText, selectedId, isLocked, player.narrativeText]);

  function handleSaveDraft() {
    setPlayers(prev => prev.map(p =>
      p.playerId === selectedId
        ? { ...p, narrativeText: editText, narrativeWordCount: wc, narrativeStatus: p.narrativeStatus === "none" ? "draft" : p.narrativeStatus }
        : p
    ));
    setSavedTime(new Date());
    toast.success("Draft saved");
  }

  function handleSubmit() {
    if (wc < 75) {
      toast.warning(`Narrative must be at least 75 words before submitting. Currently ${wc} words.`);
      return;
    }
    setPlayers(prev => prev.map(p =>
      p.playerId === selectedId
        ? { ...p, narrativeText: editText, narrativeWordCount: wc, narrativeStatus: "submitted", submittedAt: new Date().toISOString().split("T")[0] }
        : p
    ));
    setSavedTime(new Date());
    toast.success(`Narrative submitted to ${player.familyName ?? "the family"} for approval`);
  }

  function handleRequestEdit() {
    setRequestingEdit(false);
    setPlayers(prev => prev.map(p =>
      p.playerId === selectedId ? { ...p, narrativeStatus: "draft" } : p
    ));
    toast.success("Edit request submitted. Narrative moved back to Draft.");
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Recruiting"
          title="Player Narratives"
          subtitle="Write professional assessments for your athletes — these appear verbatim on their recruiting profiles"
        />

        {/* Professional record callout */}
        <div
          className="rounded-xl border px-5 py-4 mb-8 flex items-start gap-4"
          style={{ borderColor: PRIMARY, background: "oklch(0.72 0.18 290 / 0.07)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "oklch(0.72 0.18 290 / 0.14)", color: PRIMARY }}
          >
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Narratives are a professional record</div>
            <div className="text-[12px] text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
              Narratives are displayed verbatim on recruiting profiles. They're attributed to you by name. Write specifically about what you've observed — not generic praise. Specific observations carry far more weight with college coaches than superlatives.
            </div>
          </div>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* ── Left: Player list ── */}
          <div className="w-full lg:w-[260px] shrink-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono mb-3 px-1">
              Roster
            </div>
            <div className="space-y-1">
              {players.map(p => (
                <PlayerListItem
                  key={p.playerId}
                  player={p}
                  selected={p.playerId === selectedId}
                  onClick={() => setSelectedId(p.playerId)}
                />
              ))}
            </div>
          </div>

          {/* ── Right: Narrative workspace ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Player context strip */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[18px] font-black">{player.playerName}</span>
                    <span className="text-[13px] text-[var(--text-muted)]">{player.position} · Class of {player.gradYear} · {player.height}</span>
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {player.seasonsWithCoach} season{player.seasonsWithCoach !== 1 ? "s" : ""} with coach · {player.badgeCount} badges · {player.assessmentCount} assessments
                  </div>
                  <div className="flex gap-3 mt-2.5 flex-wrap">
                    {player.topSkillScores.map(s => (
                      <span key={s.skill} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "oklch(0.75 0.12 140 / 0.12)", color: SUCCESS }}>
                        {SKILL_LABELS[s.skill] ?? s.skill}: {s.score.toFixed(1)} <span style={{ color: SUCCESS }}>+{s.delta}</span>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mini skill bars */}
                <div className="w-52 shrink-0">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-2">Skill Scores</div>
                  <MiniSkillBars scores={player.allSkillScores} />
                  <div className="text-[10px] text-[var(--text-muted)] mt-2">
                    Coachability: <span className="font-semibold" style={{ color: SUCCESS }}>{player.coachabilityIndex}/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Family approval status */}
            {player.narrativeStatus === "submitted" && (
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: WARNING, background: "oklch(0.78 0.16 75 / 0.08)" }}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
                <div className="text-[13px]">
                  <span className="font-semibold" style={{ color: WARNING }}>Waiting for family approval</span>
                  {player.submittedAt && <span className="text-[var(--text-muted)] ml-1.5">— sent {formatDate(player.submittedAt)}</span>}
                </div>
              </div>
            )}
            {player.narrativeStatus === "approved" && player.approvedAt && (
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: SUCCESS, background: "oklch(0.75 0.12 140 / 0.08)" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                <div className="text-[13px]">
                  <span className="font-semibold" style={{ color: SUCCESS }}>Approved</span>
                  <span className="text-[var(--text-muted)] ml-1.5">by {player.approvedBy} on {formatDate(player.approvedAt)}</span>
                </div>
              </div>
            )}
            {player.narrativeStatus === "edit_requested" && player.editRequestNote && (
              <div className="rounded-xl border px-4 py-3 space-y-1.5" style={{ borderColor: DANGER, background: "oklch(0.68 0.22 25 / 0.07)" }}>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" style={{ color: DANGER }} />
                  <span className="text-[13px] font-semibold" style={{ color: DANGER }}>Family requested edits</span>
                </div>
                <div className="text-[12px] text-[var(--text-muted)] pl-6 leading-relaxed">{player.editRequestNote}</div>
              </div>
            )}

            {/* Narrative editor */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="text-[13px] font-semibold">Narrative</div>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${statusMeta(player.narrativeStatus).color.replace(")", " / 0.12)")}`, color: statusMeta(player.narrativeStatus).color }}
                  >
                    {statusMeta(player.narrativeStatus).label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  {savedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Saved {savedTime.toLocaleTimeString()}
                    </span>
                  )}
                  <span
                    className="font-mono"
                    style={{ color: wc < 75 ? DANGER : wc > 200 ? WARNING : wc < 100 ? "var(--text-muted)" : SUCCESS }}
                  >
                    {wc} words
                  </span>
                  <span className="text-[var(--text-muted)]">(target 100–200)</span>
                </div>
              </div>
              <div className="p-4">
                {isLocked ? (
                  <div className="space-y-3">
                    <div
                      className="rounded-xl border px-4 py-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                      style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
                    >
                      {player.narrativeText}
                    </div>
                    {!requestingEdit ? (
                      <button
                        onClick={() => setRequestingEdit(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        style={{ minHeight: 36 }}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Request Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[var(--text-muted)]">This will move the narrative back to Draft and notify the family.</span>
                        <Button size="sm" onClick={handleRequestEdit} style={{ background: WARNING, color: "white", minHeight: 36, fontSize: 12 }}>
                          Confirm Request
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRequestingEdit(false)} style={{ minHeight: 36 }}>Cancel</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    placeholder={`Write a professional narrative about ${player.playerName}'s development. Focus on what you've specifically observed — not generic praise. Aim for 100–200 words.`}
                    className="resize-none text-[13px] min-h-[180px] leading-relaxed"
                    rows={9}
                  />
                )}
              </div>
            </div>

            {/* Prior observations */}
            {observations.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                <div className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  Recent observations you can draw from:
                </div>
                <div className="space-y-3">
                  {observations.map(obs => (
                    <div key={obs.id} className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: PRIMARY }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--text-muted)] mb-0.5">
                          {formatDate(obs.date)} · {obs.context}
                        </div>
                        <div className="text-[13px] leading-relaxed">{obs.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example fragments */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <button
                onClick={() => setExamplesOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ minHeight: 44 }}
              >
                <div className="text-[13px] font-semibold">Good narrative examples — what specificity looks like</div>
                {examplesOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </button>
              {examplesOpen && (
                <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
                  {EXAMPLE_FRAGMENTS.map((ex, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{ex.playerName}</div>
                      <div
                        className="rounded-xl px-4 py-3 text-[12px] leading-relaxed italic border-l-4"
                        style={{ borderLeftColor: PRIMARY, background: "oklch(0.72 0.18 290 / 0.06)", color: "var(--text-muted)" }}
                      >
                        "{ex.text}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {!isLocked && (
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  style={{ minHeight: 44 }}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={wc < 75}
                  style={{ background: PRIMARY, color: "white", minHeight: 44 }}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" /> Submit for Family Approval
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Preview opens the recruiter-facing view")}
                  style={{ minHeight: 44 }}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" /> Preview as Recruiter
                </Button>
                {wc < 75 && wc > 0 && (
                  <span className="text-[12px]" style={{ color: DANGER }}>
                    {75 - wc} more words needed to submit
                  </span>
                )}
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(player.narrativeText);
                    toast.success("Narrative copied to clipboard");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[var(--border)] text-[12px] font-medium transition-colors hover:text-[var(--text-primary)] text-[var(--text-muted)]"
                  style={{ minHeight: 44 }}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Narrative
                </button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Preview opens the recruiter-facing view")}
                  style={{ minHeight: 44 }}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" /> Preview as Recruiter
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
