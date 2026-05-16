import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type TermCategory =
  | "Player Development"
  | "Assessment"
  | "Film & Video"
  | "Practice"
  | "IDP"
  | "Communication";

type GlossaryTerm = {
  id: string;
  term: string;
  category: TermCategory;
  definition: string;
  usageExample: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TERMS: GlossaryTerm[] = [
  {
    id: "idp",
    term: "IDP",
    category: "IDP",
    definition:
      "Individual Development Plan — a structured, season-long document outlining a player's goals, target skills, milestones, and growth benchmarks. Each player in HoopsOS has exactly one active IDP at any time.",
    usageExample: "Coach: \"Let's review your IDP from last month and update the milestones you've already hit.\"",
  },
  {
    id: "milestone",
    term: "Milestone",
    category: "IDP",
    definition:
      "A specific, measurable checkpoint within an IDP goal. Milestones are time-bound and binary — either met or not met — which makes progress unambiguous for both coach and player.",
    usageExample: "Coach: \"Your first IDP milestone is to execute a clean drop-step finish in live drill by March 15th.\"",
  },
  {
    id: "skill-velocity",
    term: "Skill Velocity",
    category: "Assessment",
    definition:
      "The rate of observable skill improvement over a defined window (typically 30 days). A positive velocity score indicates accelerating growth; a flat or negative score triggers review. Calculated from observation data across sessions.",
    usageExample: "Coach: \"Marcus's skill velocity on ball-handling jumped this month — let's increase complexity in his next WOD.\"",
  },
  {
    id: "wod",
    term: "WOD",
    category: "Practice",
    definition:
      "Workout of the Day — a targeted individual skill-building session assigned to a specific player. Unlike team practice, a WOD is prescriptive and personalized, tied directly to IDP priorities.",
    usageExample: "Coach: \"Your WOD today is the live-dribble decision series — three reps each side, no walk-throughs.\"",
  },
  {
    id: "readiness-score",
    term: "Readiness Score",
    category: "Assessment",
    definition:
      "A composite daily indicator (0–100) reflecting a player's physical, mental, and engagement readiness for practice or competition. Inputs include check-in responses, recent workload, and coach observations.",
    usageExample: "Coach: \"Jalen's readiness score was 58 this morning — let's modify his practice load and check in before drills.\"",
  },
  {
    id: "observation",
    term: "Observation",
    category: "Assessment",
    definition:
      "A coach-logged, timestamped note tied to a specific skill, player, and session. Observations are the primary data input for IDP progress tracking and calibration. They must be specific, evidence-based, and free of judgment language.",
    usageExample: "Coach: \"I logged an observation after Tuesday's practice — her footwork on close-outs improved from last week's film session.\"",
  },
  {
    id: "calibration",
    term: "Calibration",
    category: "Assessment",
    definition:
      "The process of aligning coach assessment scores with expert benchmarks by rating video clips and comparing results. Calibration sessions help reduce subjective variance between coaches on the same staff.",
    usageExample: "Coach: \"We're doing a calibration session Friday — everyone rates the same clip independently before we compare scores.\"",
  },
  {
    id: "film-session",
    term: "Film Session",
    category: "Film & Video",
    definition:
      "A structured video review meeting where a coach walks a player or group through tagged clips tied to specific skills or game situations. Film sessions in HoopsOS are logged, linked to observations, and tracked for frequency.",
    usageExample: "Coach: \"We have a film session Thursday at 4pm — we'll review your transition defense clips from Saturday's game.\"",
  },
  {
    id: "playlist",
    term: "Playlist",
    category: "Film & Video",
    definition:
      "A curated collection of video clips organized around a theme, skill, or player. Playlists can be shared with players or parents and are the primary delivery format for film-based feedback in HoopsOS.",
    usageExample: "Coach: \"I built you a playlist of your best five drives from this month — watch it before tomorrow's IDP check-in.\"",
  },
  {
    id: "clip-tag",
    term: "Clip Tag",
    category: "Film & Video",
    definition:
      "A label applied to a video clip to categorize it by skill area, player, situation, or coaching focus. Tags power search, playlist generation, and AI analysis across the HoopsOS film library.",
    usageExample: "Coach: \"Make sure you clip-tag every finishing attempt this week so we can pull them for Friday's session.\"",
  },
  {
    id: "cue",
    term: "Cue",
    category: "Player Development",
    definition:
      "A short, precise verbal or physical prompt a coach uses during practice to trigger a specific movement or decision. Cues in HoopsOS are stored in the Cue Library and linked to skill categories so they're consistent across coaches.",
    usageExample: "Coach: \"The cue for that movement is 'chin down, load hip' — use that exact phrase every time so players don't have to translate.\"",
  },
  {
    id: "benchmark",
    term: "Benchmark",
    category: "Assessment",
    definition:
      "A defined performance standard for a given skill at a specific age group or development tier. Benchmarks are used to set IDP goals, interpret assessment scores, and communicate progress to players and parents.",
    usageExample: "Coach: \"The benchmark for a 15U player on pull-up accuracy is 40% in game conditions — you're at 37% and trending up.\"",
  },
  {
    id: "percentile",
    term: "Percentile",
    category: "Assessment",
    definition:
      "A player's ranked position within their development cohort for a given skill or composite score. Percentiles contextualize raw scores and help coaches identify genuine outliers versus expected variance.",
    usageExample: "Coach: \"Your passing efficiency is in the 81st percentile for 16U players in this program — that's a real strength.\"",
  },
  {
    id: "at-risk-flag",
    term: "At-Risk Flag",
    category: "Communication",
    definition:
      "A system alert indicating a player shows patterns (low readiness, missed check-ins, stalled IDP progress) that suggest a need for proactive coach intervention. Flags are never shown to players — they're a coach-facing tool.",
    usageExample: "Coach: \"I got an at-risk flag on Devon this morning — he's missed three check-ins and his streak dropped to zero.\"",
  },
  {
    id: "practice-block",
    term: "Practice Block",
    category: "Practice",
    definition:
      "A discrete segment of a practice plan with a defined duration, focus area, and coaching intention. Practice plans in HoopsOS are built from a sequence of blocks, each tied to a skill category or game situation.",
    usageExample: "Coach: \"The first practice block today is 12 minutes of skill-isolations — no scrimmage until block three.\"",
  },
  {
    id: "station-rotation",
    term: "Station Rotation",
    category: "Practice",
    definition:
      "A practice structure where players cycle through multiple simultaneous skill stations, each staffed by a different coach or assistant. Station rotations appear as a practice block type in the HoopsOS plan builder.",
    usageExample: "Coach: \"Today's station rotation has four spots — finishing, ball-handling, shooting off movement, and defensive close-outs.\"",
  },
  {
    id: "exit-drill",
    term: "Exit Drill",
    category: "Practice",
    definition:
      "A closing drill or game-like rep that ends a practice block or full session on a competitive, high-energy note. Exit drills reinforce skills taught during the session under mild pressure.",
    usageExample: "Coach: \"We'll end every block with a 3-minute exit drill — you have to make three in a row to rotate out.\"",
  },
  {
    id: "parent-digest",
    term: "Parent Digest",
    category: "Communication",
    definition:
      "A periodic automated summary sent to a player's parent or guardian, containing high-level development updates, upcoming schedule, and optional coach notes. Digests are generated from HoopsOS data and are coach-reviewed before sending.",
    usageExample: "Coach: \"The parent digest goes out Sunday evening — make sure your observation notes are logged by Saturday.\"",
  },
  {
    id: "announcement",
    term: "Announcement",
    category: "Communication",
    definition:
      "A broadcast message sent from a coach to all players, a specific group, or parents. Announcements are one-way, time-stamped, and logged in the communication record — not a substitute for direct messaging.",
    usageExample: "Coach: \"I sent an announcement about the schedule change — check the Announcements tab, not your DMs.\"",
  },
  {
    id: "check-in",
    term: "Check-In",
    category: "Player Development",
    definition:
      "A brief daily or pre-practice self-report from a player covering readiness, mood, and any flagged concerns. Check-in responses feed into the Readiness Score and flag at-risk patterns before they escalate.",
    usageExample: "Coach: \"Complete your check-in before you step on the floor — it takes 30 seconds and it changes how I plan today.\"",
  },
  {
    id: "streak",
    term: "Streak",
    category: "Player Development",
    definition:
      "A consecutive-day count of a player completing check-ins, WODs, or other assigned behaviors. Streaks are visible to coaches and used to reinforce habit formation and flag sudden drops in engagement.",
    usageExample: "Coach: \"You had a 14-day check-in streak going — dropping to zero on Friday is exactly the signal I need to see early.\"",
  },
  {
    id: "trend",
    term: "Trend",
    category: "Assessment",
    definition:
      "A directional pattern across multiple data points for a player or group over time. HoopsOS surfaces trends for key metrics (readiness, observation scores, check-in frequency) so coaches see movement, not just snapshots.",
    usageExample: "Coach: \"The trend on her three-point percentage is positive over six weeks — let's increase volume in the next WOD cycle.\"",
  },
  {
    id: "development-tier",
    term: "Development Tier",
    category: "Player Development",
    definition:
      "A classification (Foundation, Developing, Competitive, Elite) indicating a player's overall stage in the HoopsOS development framework. Tiers inform IDP goal complexity, benchmark expectations, and WOD difficulty.",
    usageExample: "Coach: \"He moved from Foundation to Developing tier last month — adjust the benchmark targets in his IDP to reflect that.\"",
  },
  {
    id: "cohort",
    term: "Cohort",
    category: "Assessment",
    definition:
      "A defined group of players used as the comparison population for percentile and benchmark calculations. Cohorts are defined by age group, development tier, position, or program — and must be consistent to make comparisons meaningful.",
    usageExample: "Coach: \"Make sure you're comparing his scores to the right cohort — he's 14U, not 15U, so the percentile reads differently.\"",
  },
  {
    id: "credential",
    term: "Credential",
    category: "Communication",
    definition:
      "A verified coaching achievement earned by completing HoopsOS education modules, calibration requirements, and practice review milestones. Credentials are visible on a coach's profile and can be shared externally.",
    usageExample: "Coach: \"I just earned the Foundation Credential — it's based on completing the first 12 modules and passing the calibration threshold.\"",
  },
];

const CATEGORIES: Array<"All" | TermCategory> = [
  "All",
  "Player Development",
  "Assessment",
  "Film & Video",
  "Practice",
  "IDP",
  "Communication",
];

const CATEGORY_COLORS: Record<TermCategory, { bg: string; text: string }> = {
  "Player Development": { bg: "oklch(0.72 0.18 290 / 0.12)", text: "oklch(0.52 0.18 290)" },
  Assessment:           { bg: "oklch(0.75 0.12 140 / 0.12)", text: "oklch(0.45 0.15 140)" },
  "Film & Video":       { bg: "oklch(0.68 0.22 25 / 0.10)",  text: "oklch(0.50 0.22 25)"  },
  Practice:             { bg: "oklch(0.78 0.16 75 / 0.12)",  text: "oklch(0.50 0.18 75)"  },
  IDP:                  { bg: "oklch(0.72 0.18 290 / 0.18)", text: "oklch(0.45 0.20 290)" },
  Communication:        { bg: "oklch(0.75 0.12 140 / 0.18)", text: "oklch(0.42 0.15 140)" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgramTerminologyPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | TermCategory>("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return TERMS.filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesQuery =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.usageExample.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Program Terminology"
          subtitle="The shared language of HoopsOS. Use these terms consistently with players, parents, and staff."
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290_/_0.35)]"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border"
                style={
                  active
                    ? { background: "oklch(0.72 0.18 290)", color: "white", borderColor: "oklch(0.72 0.18 290)" }
                    : { background: "transparent", color: "var(--muted-foreground, #888)", borderColor: "var(--border, #e5e7eb)" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="text-[12px] text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "term" : "terms"}
          {activeCategory !== "All" && ` in ${activeCategory}`}
          {query && ` matching "${query}"`}
        </p>

        {/* Term grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No terms match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((t) => {
              const colors = CATEGORY_COLORS[t.category];
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-bold leading-snug">{t.term}</h3>
                    <span
                      className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {t.category}
                    </span>
                  </div>

                  {/* Definition */}
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {t.definition}
                  </p>

                  {/* Usage example */}
                  <p
                    className="text-[12px] italic leading-relaxed pt-3 border-t border-border"
                    style={{ color: "oklch(0.55 0.06 290)" }}
                  >
                    {t.usageExample}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
