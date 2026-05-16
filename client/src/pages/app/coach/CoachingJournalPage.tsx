import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  BookOpen,
  Zap,
  Frown,
  Brain,
  HelpCircle,
  X,
  Check,
  Hash,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mood = "energized" | "frustrated" | "reflective" | "uncertain";

type JournalEntry = {
  id: string;
  moduleId?: string;
  moduleName?: string;
  prompt: string;
  response: string;
  createdAt: string;
  mood?: Mood;
  tags: string[];
  isStandalone: boolean;
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: "j1",
    moduleName: "The 3-Cue Rule",
    prompt: "What cue do you overuse, and why do you think you default to it?",
    response: "I say 'stay low' constantly — probably 30 times a practice. I tracked it for a day and it surprised me. The problem is it doesn't tell anyone what 'low' looks like. I'm replacing it this week with 'bent knees, hips back' and seeing if players actually change shape.",
    createdAt: "2025-05-12",
    mood: "reflective",
    tags: ["cues", "habit", "practice-design"],
    isStandalone: false,
  },
  {
    id: "j2",
    prompt: "What's one thing a player did this week that surprised you?",
    response: "Marcus picked up the help-side rotation on his own without being coached to it. I've been on him about defensive positioning for three weeks with no visible result. Then in a live drill he just did it, naturally. Made me wonder how much of coaching is planting and waiting versus active correction.",
    createdAt: "2025-05-10",
    mood: "energized",
    tags: ["player-relationship", "defense", "patience"],
    isStandalone: true,
  },
  {
    id: "j3",
    moduleName: "Coaching the Individual",
    prompt: "Think of a player you've been coaching the same way for months. Is it working?",
    response: "I realized I've been coaching Marcus the same way I coached my own position 10 years ago. He's a different kind of learner — he needs to see it, not just hear it. I've been verbal-heavy with him and wondering why he wasn't responding. Going to shift to more demonstration and video reference.",
    createdAt: "2025-05-08",
    mood: "reflective",
    tags: ["player-relationship", "learning-styles", "individual"],
    isStandalone: false,
  },
  {
    id: "j4",
    prompt: "Where are you spending your coaching attention? Is that where it should be?",
    response: "I spent the last two practices almost entirely with the starting five. The bench players got maybe 10 minutes of direct instruction combined. That's not sustainable and it's not fair. The bench shapes the culture more than the starters do — they set the standard for how hard everyone competes.",
    createdAt: "2025-05-06",
    mood: "frustrated",
    tags: ["attention", "bench", "culture"],
    isStandalone: true,
  },
  {
    id: "j5",
    moduleName: "Practice Design Principles",
    prompt: "When did your last practice feel flat, and what would you change?",
    response: "Practice today felt flat. Looking at the plan, I had no competitive reps until the last 8 minutes. By then, players were disconnected and going through motions. The issue wasn't effort — it was structure. Next practice I'm frontloading the competition: first 20 minutes are contested.",
    createdAt: "2025-05-03",
    mood: "frustrated",
    tags: ["practice-design", "competition", "energy"],
    isStandalone: false,
  },
  {
    id: "j6",
    prompt: "What conversation have you been avoiding with a player?",
    response: "Tyler's situation is harder than I thought. He's not resistant — he's embarrassed. I've been addressing his mistakes in front of the group and it's shutting him down. Need to find a private moment before or after practice. His confidence is fragile right now and I've been making it worse without realizing it.",
    createdAt: "2025-04-29",
    mood: "reflective",
    tags: ["player-relationship", "communication", "one-on-one"],
    isStandalone: true,
  },
  {
    id: "j7",
    moduleName: "The 3-Cue Rule",
    prompt: "Pick one drill. Write down every cue you use for it. Which ones can you cut?",
    response: "I ran the two-ball drill cue audit and counted 11 distinct things I say. Eleven. I could cut 8 of them and lose nothing. The three that matter: eyes up, pound it, switch hands on the cone. Everything else is noise that's filling space when I'm uncomfortable with silence.",
    createdAt: "2025-04-25",
    mood: "reflective",
    tags: ["cues", "audit", "simplify"],
    isStandalone: false,
  },
  {
    id: "j8",
    prompt: "What do players think you value most? Is that accurate?",
    response: "I asked two of my players what they thought I cared about most. Both said winning. I care about development more than results at this level — but apparently nothing I do communicates that. Need to think about whether my reactions during close games are telling a different story than the words I say before them.",
    createdAt: "2025-04-22",
    mood: "uncertain",
    tags: ["culture", "values", "feedback"],
    isStandalone: true,
  },
  {
    id: "j9",
    moduleName: "Film and Feedback",
    prompt: "How do you give feedback after a loss?",
    response: "After Tuesday's loss I came in with a list of corrections and went through all of them in 20 minutes. Players were glazed over by minute 8. The problem isn't the content — it's the timing. We were still emotionally activated. I should have waited 24 hours and done it on film with three focused points, not a dozen.",
    createdAt: "2025-04-18",
    mood: "frustrated",
    tags: ["film", "feedback", "timing"],
    isStandalone: false,
  },
  {
    id: "j10",
    prompt: "What's something a player taught you this season?",
    response: "Jordan showed me that some players perform better when you leave them alone in warmups rather than giving them tasks. I kept loading him up with activation drills and he was consistently flat. Then one day I forgot and let him do his own thing — best he's played all year. I've been managing when I should have been trusting.",
    createdAt: "2025-04-14",
    mood: "energized",
    tags: ["player-relationship", "trust", "autonomy"],
    isStandalone: true,
  },
  {
    id: "j11",
    moduleName: "Offensive IQ Module",
    prompt: "What's the gap between what you teach and what players actually retain?",
    response: "I've been teaching ball reversal reads for six weeks. In a live 5-on-5 yesterday, I stopped play and asked three players what they're reading on reversal. Two couldn't tell me. One got it right. The issue isn't their effort — it's my transfer design. I'm teaching it in drill context and never bridging it to game context.",
    createdAt: "2025-04-10",
    mood: "uncertain",
    tags: ["teaching", "retention", "transfer"],
    isStandalone: false,
  },
  {
    id: "j12",
    prompt: "If you had to describe your coaching philosophy in one sentence today, what would it be?",
    response: "I want to build players who understand the game well enough that they don't need me to make decisions for them. That sentence took me 15 minutes to write. I kept starting with 'win' or 'compete' or 'develop' and then editing it out. The real answer is that I want to make myself unnecessary, and that's hard to actually believe.",
    createdAt: "2025-04-07",
    mood: "reflective",
    tags: ["philosophy", "identity", "autonomy"],
    isStandalone: true,
  },
];

const DAILY_PROMPTS = [
  "What's one thing a player did this week that surprised you?",
  "Where are you spending your coaching attention? Is that where it should be?",
  "What conversation have you been avoiding with a player?",
  "When did your last practice feel flat, and what would you change?",
  "What do players think you value most? Is that accurate?",
  "Pick one player. What do they need from you right now that they're not getting?",
  "What's the best coaching decision you made this week, and why did it work?",
  "If a player described your coaching style, what would they say?",
  "What are you still unsure about heading into next practice?",
  "What habit are you trying to build in your team right now? Is it working?",
];

const QUICK_TAGS = ["player-relationship", "practice-design", "film", "culture", "communication", "feedback"];

const MOOD_CONFIG: Record<Mood, { emoji: string; label: string; icon: React.ReactNode }> = {
  energized: { emoji: "⚡", label: "Energized", icon: <Zap className="w-4 h-4" /> },
  frustrated: { emoji: "😤", label: "Frustrated", icon: <Frown className="w-4 h-4" /> },
  reflective: { emoji: "🧠", label: "Reflective", icon: <Brain className="w-4 h-4" /> },
  uncertain: { emoji: "❓", label: "Uncertain", icon: <HelpCircle className="w-4 h-4" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByWeek(entries: JournalEntry[]): { label: string; entries: JournalEntry[] }[] {
  const now = new Date("2025-05-15");
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);

  const groups: { label: string; entries: JournalEntry[] }[] = [
    { label: "This week", entries: [] },
    { label: "Last week", entries: [] },
    { label: "Earlier", entries: [] },
  ];

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    if (d >= oneWeekAgo) groups[0].entries.push(entry);
    else if (d >= twoWeeksAgo) groups[1].entries.push(entry);
    else groups[2].entries.push(entry);
  }

  return groups.filter((g) => g.entries.length > 0);
}

function topTags(entries: JournalEntry[]): { tag: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.tags) {
      map[tag] = (map[tag] ?? 0) + 1;
    }
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

const TODAY_PROMPT = DAILY_PROMPTS[new Date("2025-05-15").getDate() % DAILY_PROMPTS.length];

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {mood && (
            <span className="text-[18px]" title={mood.label}>{mood.emoji}</span>
          )}
          <span className="text-[12px] text-muted-foreground">
            {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {entry.moduleName && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[oklch(0.72_0.18_290/0.1)] text-[oklch(0.45_0.18_290)] border border-[oklch(0.72_0.18_290/0.3)]">
              <BookOpen className="w-3 h-3" />
              From: {entry.moduleName}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(entry.id); setConfirmDelete(false); }}
                className="min-h-[44px] px-3 flex items-center gap-1 text-[12px] rounded-lg bg-[oklch(0.68_0.22_25/0.1)] text-[oklch(0.45_0.22_25)] hover:bg-[oklch(0.68_0.22_25/0.2)] transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] px-3 flex items-center gap-1 text-[12px] rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-[oklch(0.68_0.22_25)] hover:bg-muted transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground italic">"{entry.prompt}"</p>
      <p className="text-[14px] text-foreground leading-relaxed">{entry.response}</p>

      {entry.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {entry.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Hash className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachingJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<Mood | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Composer state
  const [composerText, setComposerText] = useState("");
  const [composerMood, setComposerMood] = useState<Mood | null>(null);
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [composerTagInput, setComposerTagInput] = useState("");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (moodFilter !== "all" && e.mood !== moodFilter) return false;
        if (tagFilter && !e.tags.includes(tagFilter)) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            e.response.toLowerCase().includes(q) ||
            e.prompt.toLowerCase().includes(q) ||
            (e.moduleName ?? "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, moodFilter, tagFilter, search]);

  const grouped = useMemo(() => groupByWeek(filtered), [filtered]);
  const tags = useMemo(() => topTags(entries), [entries]);

  // Streak dots — last 7 days
  const streakDays = useMemo(() => {
    const dates = new Set(entries.map((e) => e.createdAt));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date("2025-05-15");
      d.setDate(d.getDate() - (6 - i));
      return dates.has(d.toISOString().slice(0, 10));
    });
  }, [entries]);

  const streakCount = useMemo(() => {
    let count = 0;
    for (let i = streakDays.length - 1; i >= 0; i--) {
      if (streakDays[i]) count++;
      else break;
    }
    return count;
  }, [streakDays]);

  function handleAddTag() {
    const tag = composerTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || composerTags.includes(tag)) return;
    setComposerTags((t) => [...t, tag]);
    setComposerTagInput("");
  }

  function handleSave() {
    if (!composerText.trim()) {
      toast.error("Write something first.");
      return;
    }
    const newEntry: JournalEntry = {
      id: `j${Date.now()}`,
      prompt: TODAY_PROMPT,
      response: composerText.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      mood: composerMood ?? undefined,
      tags: composerTags,
      isStandalone: true,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setComposerText("");
    setComposerMood(null);
    setComposerTags([]);
    toast.success("Saved to your coaching journal");
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast("Entry deleted");
  }

  return (
    <AppShell>
      <div className="px-4 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Coaching Journal"
          subtitle="A private space for reflection. Honest entries, no audience — just you thinking out loud about your craft."
        />

        {/* Header bar */}
        <div className="rounded-xl border border-border bg-card p-5 mb-8 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <p className="text-[14px] text-muted-foreground">
              {entries.length} entries · 6 weeks · Started with The 3-Cue Rule module
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              You've reflected {streakCount} of the last 7 days
            </p>
          </div>
          <div className="flex gap-1.5">
            {streakDays.map((active, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${active ? "bg-[oklch(0.72_0.18_290)]" : "bg-muted"}`}
                title={active ? "Reflected" : "No entry"}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Composer */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div>
                <p className="text-[12px] text-muted-foreground uppercase tracking-wider mb-1">Today's prompt</p>
                <p className="text-[15px] font-medium text-foreground italic">"{TODAY_PROMPT}"</p>
              </div>

              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)] leading-relaxed"
                rows={4}
                placeholder="Write your reflection..."
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
              />

              {/* Mood */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-muted-foreground">How are you feeling?</span>
                {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setComposerMood(composerMood === key ? null : key)}
                    className={`min-h-[44px] px-3 rounded-full text-[13px] border transition-colors ${
                      composerMood === key
                        ? "bg-[oklch(0.72_0.18_290)] text-white border-[oklch(0.72_0.18_290)]"
                        : "bg-background text-muted-foreground border-border hover:border-[oklch(0.72_0.18_290/0.5)]"
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>

              {/* Quick tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-muted-foreground">Tags:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setComposerTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )}
                    className={`min-h-[36px] px-2.5 rounded-full text-[12px] border transition-colors ${
                      composerTags.includes(tag)
                        ? "bg-[oklch(0.72_0.18_290/0.15)] text-[oklch(0.45_0.18_290)] border-[oklch(0.72_0.18_290/0.4)]"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                <div className="flex gap-1">
                  <input
                    className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                    placeholder="custom tag..."
                    value={composerTagInput}
                    onChange={(e) => setComposerTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }}}
                  />
                </div>
              </div>

              {composerTags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {composerTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[12px] text-muted-foreground">
                      #{tag}
                      <button onClick={() => setComposerTags((t) => t.filter((x) => x !== tag))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={handleSave}
                className="h-11 rounded-xl bg-[oklch(0.72_0.18_290)] text-white text-[14px] font-semibold hover:bg-[oklch(0.65_0.18_290)] transition-colors"
              >
                Save reflection
              </button>
            </div>

            {/* Filter + Search */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full h-11 rounded-lg border border-border bg-card pl-9 pr-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  placeholder="Search entries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-11 rounded-lg border border-border bg-card px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value as Mood | "all")}
              >
                <option value="all">All moods</option>
                {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
                ))}
              </select>
              <select
                className="h-11 rounded-lg border border-border bg-card px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              >
                <option value="">All tags</option>
                {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-8">
              {grouped.length === 0 && (
                <p className="text-center text-muted-foreground text-[14px] py-16">No entries match your filters.</p>
              )}
              {grouped.map((group) => (
                <div key={group.label} className="flex flex-col gap-4">
                  <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                    {group.label}
                  </h3>
                  {group.entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[280px] flex flex-col gap-6 shrink-0">
            {/* Most common tags */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-[14px] font-semibold text-foreground mb-4">Most common tags</h3>
              <div className="flex flex-col gap-2">
                {tags.map(({ tag, count }) => (
                  <div key={tag} className="flex items-center gap-2">
                    <div className="flex-1 text-[13px] text-foreground">#{tag}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[oklch(0.72_0.18_290)]"
                          style={{ width: `${(count / entries.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[12px] text-muted-foreground w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring themes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Recurring themes</h3>
              <p className="text-[11px] text-muted-foreground mb-4">AI-generated insight</p>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-[oklch(0.72_0.18_290/0.08)] border border-[oklch(0.72_0.18_290/0.2)] p-3">
                  <p className="text-[13px] text-foreground">You've mentioned <strong>player motivation</strong> across 5 entries. It appears to be an ongoing focus.</p>
                  <button className="mt-2 text-[12px] text-[oklch(0.50_0.18_290)] hover:underline">
                    View relevant module →
                  </button>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[13px] text-foreground"><strong>Practice design</strong> appears 4 times. Your latest insight: frontload competition.</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[13px] text-foreground"><strong>Individual coaching</strong> — you're noticing different players need different approaches.</p>
                </div>
              </div>
            </div>

            {/* Season stats */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-[14px] font-semibold text-foreground mb-3">Season reflection</h3>
              <p className="text-[28px] font-bold text-foreground">~47 min</p>
              <p className="text-[13px] text-muted-foreground mt-1">Total reflection time</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">across {entries.length} entries this season</p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
