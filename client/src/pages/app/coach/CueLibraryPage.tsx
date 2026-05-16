import { useState, useMemo } from "react";
import {
  Plus,
  Star,
  StarOff,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Share2,
  X,
  Eye,
  Volume2,
  Hand,
  Check,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillCategory =
  | "ball_handling"
  | "shooting"
  | "finishing"
  | "defense"
  | "footwork"
  | "iq_reads"
  | "conditioning";

type CueType = "visual" | "auditory" | "kinesthetic";

type Cue = {
  id: string;
  drillName: string;
  skillCategory: SkillCategory;
  cueText: string;
  cueType: CueType;
  whenToUse: string;
  whyItWorks: string;
  isPrimary: boolean;
  tags: string[];
  createdAt: string;
  moduleSource?: string;
  sharedWithStaff: boolean;
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_CUES: Cue[] = [
  {
    id: "c1",
    drillName: "Two-Ball Dribble",
    skillCategory: "ball_handling",
    cueText: "Eyes up, not down",
    cueType: "auditory",
    whenToUse: "When player is staring at the ball while dribbling",
    whyItWorks: "Redirects attention to the floor and helps players read defense naturally over time.",
    isPrimary: true,
    tags: ["vision", "habit", "beginner"],
    createdAt: "2025-04-01",
    moduleSource: "The 3-Cue Rule",
    sharedWithStaff: true,
  },
  {
    id: "c2",
    drillName: "Stationary Ball Control",
    skillCategory: "ball_handling",
    cueText: "Pound it",
    cueType: "auditory",
    whenToUse: "When the dribble is soft or floating high",
    whyItWorks: "Hard dribbles are harder to steal and build finger-pad strength over time.",
    isPrimary: false,
    tags: ["intensity", "control"],
    createdAt: "2025-04-03",
    sharedWithStaff: false,
  },
  {
    id: "c3",
    drillName: "Cone Dribble Series",
    skillCategory: "ball_handling",
    cueText: "Switch hands on the cone",
    cueType: "visual",
    whenToUse: "When player switches hand before or after the cone, not at it",
    whyItWorks: "Trains the exact moment of change-of-direction to be decisive and tight.",
    isPrimary: false,
    tags: ["cones", "change-of-direction"],
    createdAt: "2025-04-05",
    moduleSource: "Breakdown Drill Design",
    sharedWithStaff: false,
  },
  {
    id: "c4",
    drillName: "Form Shooting (Elbow)",
    skillCategory: "shooting",
    cueText: "Elbow in",
    cueType: "kinesthetic",
    whenToUse: "When player's shooting elbow flares out at set point",
    whyItWorks: "Aligns the kinetic chain — elbow under the ball naturally squares the shoulder to the rim.",
    isPrimary: true,
    tags: ["form", "alignment", "elbow"],
    createdAt: "2025-03-28",
    moduleSource: "The 3-Cue Rule",
    sharedWithStaff: true,
  },
  {
    id: "c5",
    drillName: "Catch-and-Shoot Off Screen",
    skillCategory: "shooting",
    cueText: "Load your legs",
    cueType: "kinesthetic",
    whenToUse: "When player is shooting arm-only with flat legs",
    whyItWorks: "Leg drive generates upward force, taking pressure off arm and adding consistent arc.",
    isPrimary: false,
    tags: ["legs", "power", "catch-and-shoot"],
    createdAt: "2025-04-08",
    sharedWithStaff: false,
  },
  {
    id: "c6",
    drillName: "Free Throw Routine",
    skillCategory: "shooting",
    cueText: "Follow through — freeze it",
    cueType: "visual",
    whenToUse: "When player pulls hand back before ball reaches rim",
    whyItWorks: "Holding follow-through locks in the muscle memory of a complete shot.",
    isPrimary: true,
    tags: ["free throw", "consistency", "routine"],
    createdAt: "2025-04-10",
    moduleSource: "The 3-Cue Rule",
    sharedWithStaff: true,
  },
  {
    id: "c7",
    drillName: "Mikan Drill",
    skillCategory: "finishing",
    cueText: "Soft touch",
    cueType: "auditory",
    whenToUse: "When player is banging layups off the backboard too hard",
    whyItWorks: "Mental cue shifts from power to finesse — promotes high-arc finger-roll contact.",
    isPrimary: true,
    tags: ["layup", "touch", "backboard"],
    createdAt: "2025-04-02",
    sharedWithStaff: false,
  },
  {
    id: "c8",
    drillName: "Traffic Layup Gauntlet",
    skillCategory: "finishing",
    cueText: "Left hand through traffic",
    cueType: "kinesthetic",
    whenToUse: "When player switches to right hand to avoid contact",
    whyItWorks: "Weak-hand finishing under contact is often what separates scorers from non-scorers.",
    isPrimary: false,
    tags: ["contact", "weak hand", "traffic"],
    createdAt: "2025-04-11",
    sharedWithStaff: false,
  },
  {
    id: "c9",
    drillName: "Angle Finishing Series",
    skillCategory: "finishing",
    cueText: "Read the angle",
    cueType: "visual",
    whenToUse: "When player always uses the same finish regardless of approach angle",
    whyItWorks: "Teaches players that every angle to the rim has a corresponding optimal finishing spot on the glass.",
    isPrimary: false,
    tags: ["angle", "IQ", "backboard"],
    createdAt: "2025-04-14",
    moduleSource: "Finishing at the Rim",
    sharedWithStaff: false,
  },
  {
    id: "c10",
    drillName: "1-on-1 Closeout Defense",
    skillCategory: "defense",
    cueText: "Belly button, not feet",
    cueType: "visual",
    whenToUse: "When defender is chasing the ball and getting beat on crossovers",
    whyItWorks: "Hips tell you where the offensive player is truly going — feet are a fake. Tracking hips cuts reaction time.",
    isPrimary: true,
    tags: ["1v1", "on-ball", "footwork"],
    createdAt: "2025-03-30",
    moduleSource: "The 3-Cue Rule",
    sharedWithStaff: true,
  },
  {
    id: "c11",
    drillName: "Shell Drill",
    skillCategory: "defense",
    cueText: "Shrink the gap",
    cueType: "auditory",
    whenToUse: "When off-ball defenders are too far from the lane and can't help",
    whyItWorks: "Paint protection starts with off-ball positioning. Closing distance makes help defense viable.",
    isPrimary: false,
    tags: ["help-side", "shell", "positioning"],
    createdAt: "2025-04-06",
    sharedWithStaff: false,
  },
  {
    id: "c12",
    drillName: "Help-and-Recover Rotation",
    skillCategory: "defense",
    cueText: "Help first, recover second",
    cueType: "auditory",
    whenToUse: "When defenders are hesitating to leave their man because they're worried about the kick-out",
    whyItWorks: "Establishes the defensive priority order — stopping the drive is worth more than surrendering a catch.",
    isPrimary: false,
    tags: ["rotation", "help", "priority"],
    createdAt: "2025-04-12",
    sharedWithStaff: false,
  },
  {
    id: "c13",
    drillName: "Footwork Foundation Drill",
    skillCategory: "footwork",
    cueText: "Land balanced",
    cueType: "kinesthetic",
    whenToUse: "When player is landing off-balance or on one foot after jumps",
    whyItWorks: "Balanced landing is the foundation of all next-action footwork — pivots, shots, and passes all start from it.",
    isPrimary: true,
    tags: ["landing", "balance", "safety"],
    createdAt: "2025-04-04",
    moduleSource: "Movement Mechanics",
    sharedWithStaff: false,
  },
  {
    id: "c14",
    drillName: "Triple Threat Reps",
    skillCategory: "footwork",
    cueText: "Loaded triple threat",
    cueType: "kinesthetic",
    whenToUse: "When player catches the ball upright with no threat posture",
    whyItWorks: "A loaded stance puts the defense on their heels — the threat is credible only when the body is ready.",
    isPrimary: false,
    tags: ["triple threat", "stance", "catch"],
    createdAt: "2025-04-09",
    sharedWithStaff: false,
  },
  {
    id: "c15",
    drillName: "Jab Step Series",
    skillCategory: "footwork",
    cueText: "Jab to create space",
    cueType: "visual",
    whenToUse: "When player jabs without reading the defender's response",
    whyItWorks: "The jab's purpose is to force a defensive reaction — if the defender doesn't move, the shot is open.",
    isPrimary: false,
    tags: ["jab", "space", "read"],
    createdAt: "2025-04-13",
    sharedWithStaff: false,
  },
  {
    id: "c16",
    drillName: "5-on-0 Motion Offense",
    skillCategory: "iq_reads",
    cueText: "See the whole floor",
    cueType: "visual",
    whenToUse: "When player makes the obvious pass and misses the better option",
    whyItWorks: "Peripheral awareness must be trained explicitly — players see what they're taught to scan for.",
    isPrimary: true,
    tags: ["vision", "awareness", "decision"],
    createdAt: "2025-04-01",
    sharedWithStaff: true,
  },
  {
    id: "c17",
    drillName: "Ball Reversal Drill",
    skillCategory: "iq_reads",
    cueText: "Ball reversal reads the defense",
    cueType: "auditory",
    whenToUse: "When players treat reversal as a reset instead of an information-gathering tool",
    whyItWorks: "Each reversal forces the defense to rotate and reveal its gaps — the read happens during, not after.",
    isPrimary: false,
    tags: ["reversal", "reads", "offense"],
    createdAt: "2025-04-07",
    moduleSource: "Offensive IQ Module",
    sharedWithStaff: false,
  },
  {
    id: "c18",
    drillName: "Closeout Attack Drill",
    skillCategory: "iq_reads",
    cueText: "Attack the closeout",
    cueType: "auditory",
    whenToUse: "When player catches on the wing and waits for the defender to recover fully",
    whyItWorks: "Closeouts are the most vulnerable moment in any defense — a one-dribble attack creates open shots.",
    isPrimary: false,
    tags: ["closeout", "attack", "catch"],
    createdAt: "2025-04-10",
    sharedWithStaff: false,
  },
  {
    id: "c19",
    drillName: "Suicides / Court Sprints",
    skillCategory: "conditioning",
    cueText: "Run through the line",
    cueType: "auditory",
    whenToUse: "When players are decelerating before the line to save energy",
    whyItWorks: "Game speed requires mental commitment past the endpoint — stopping early is a habit that carries over.",
    isPrimary: true,
    tags: ["sprints", "effort", "mental"],
    createdAt: "2025-03-29",
    sharedWithStaff: false,
  },
  {
    id: "c20",
    drillName: "Full-Court Transition",
    skillCategory: "conditioning",
    cueText: "Push pace, then settle",
    cueType: "auditory",
    whenToUse: "When players jog in transition and settle into half-court too early",
    whyItWorks: "The push-pace phase creates numerical advantages — settling too early surrenders the edge before it's used.",
    isPrimary: false,
    tags: ["transition", "pace", "spacing"],
    createdAt: "2025-04-15",
    moduleSource: "Transition Offense",
    sharedWithStaff: false,
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const SKILL_CATEGORIES: { value: SkillCategory | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-muted text-foreground" },
  { value: "ball_handling", label: "Ball Handling", color: "bg-[oklch(0.78_0.16_75/0.15)] text-[oklch(0.55_0.16_75)]" },
  { value: "shooting", label: "Shooting", color: "bg-[oklch(0.72_0.18_290/0.15)] text-[oklch(0.45_0.18_290)]" },
  { value: "finishing", label: "Finishing", color: "bg-[oklch(0.75_0.12_140/0.15)] text-[oklch(0.45_0.12_140)]" },
  { value: "defense", label: "Defense", color: "bg-[oklch(0.68_0.22_25/0.15)] text-[oklch(0.45_0.22_25)]" },
  { value: "footwork", label: "Footwork", color: "bg-[oklch(0.78_0.16_200/0.15)] text-[oklch(0.45_0.16_200)]" },
  { value: "iq_reads", label: "IQ / Reads", color: "bg-[oklch(0.75_0.18_320/0.15)] text-[oklch(0.45_0.18_320)]" },
  { value: "conditioning", label: "Conditioning", color: "bg-[oklch(0.70_0.14_50/0.15)] text-[oklch(0.45_0.14_50)]" },
];

const CUE_TYPE_ICONS: Record<CueType, React.ReactNode> = {
  visual: <Eye className="w-3 h-3" />,
  auditory: <Volume2 className="w-3 h-3" />,
  kinesthetic: <Hand className="w-3 h-3" />,
};

const CUE_TYPE_LABELS: Record<CueType, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Kinesthetic",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryMeta(value: SkillCategory) {
  return SKILL_CATEGORIES.find((c) => c.value === value)!;
}

function getCategoryLabel(value: SkillCategory) {
  return getCategoryMeta(value)?.label ?? value;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CueCard({
  cue,
  onTogglePrimary,
  onToggleShare,
  onDelete,
}: {
  cue: Cue;
  onTogglePrimary: (id: string) => void;
  onToggleShare: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCategoryMeta(cue.skillCategory);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-foreground">{cue.drillName}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.color}`}>
            {getCategoryLabel(cue.skillCategory)}
          </span>
          {cue.isPrimary && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[oklch(0.78_0.16_75/0.15)] text-[oklch(0.50_0.16_75)]">
              <Star className="w-3 h-3 fill-current" />
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => onTogglePrimary(cue.id)}
            title={cue.isPrimary ? "Remove primary" : "Set as primary"}
          >
            {cue.isPrimary ? <Star className="w-4 h-4 fill-[oklch(0.78_0.16_75)] text-[oklch(0.78_0.16_75)]" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => onToggleShare(cue.id)}
            title={cue.sharedWithStaff ? "Unshare" : "Share with staff"}
          >
            <Share2 className={`w-4 h-4 ${cue.sharedWithStaff ? "text-[oklch(0.72_0.18_290)]" : ""}`} />
          </button>
          <button
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-[oklch(0.68_0.22_25)] hover:bg-muted transition-colors"
            onClick={() => onDelete(cue.id)}
            title="Delete cue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cue text — main content */}
      <p className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
        "{cue.cueText}"
      </p>

      {/* Cue type */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
          {CUE_TYPE_ICONS[cue.cueType]}
          {CUE_TYPE_LABELS[cue.cueType]}
        </span>
      </div>

      {/* When to use */}
      <p className="text-[13px] text-muted-foreground italic">{cue.whenToUse}</p>

      {/* Why it works — expandable */}
      <button
        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Why it works
      </button>
      {expanded && (
        <p className="text-[13px] text-foreground bg-muted rounded-lg px-3 py-2.5">
          {cue.whyItWorks}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {cue.tags.map((tag) => (
          <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            #{tag}
          </span>
        ))}
        {cue.moduleSource && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[oklch(0.72_0.18_290/0.1)] text-[oklch(0.45_0.18_290)] border border-[oklch(0.72_0.18_290/0.3)]">
            <BookOpen className="w-3 h-3" />
            {cue.moduleSource}
          </span>
        )}
        {cue.sharedWithStaff && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[oklch(0.75_0.12_140/0.1)] text-[oklch(0.40_0.12_140)] border border-[oklch(0.75_0.12_140/0.3)]">
            <Users className="w-3 h-3" />
            Shared with staff
          </span>
        )}
      </div>
    </div>
  );
}

interface AddCueFormData {
  drillName: string;
  skillCategory: SkillCategory;
  cueText: string;
  cueType: CueType;
  whenToUse: string;
  whyItWorks: string;
  tagInput: string;
  tags: string[];
  isPrimary: boolean;
  sharedWithStaff: boolean;
}

const EMPTY_FORM: AddCueFormData = {
  drillName: "",
  skillCategory: "ball_handling",
  cueText: "",
  cueType: "auditory",
  whenToUse: "",
  whyItWorks: "",
  tagInput: "",
  tags: [],
  isPrimary: false,
  sharedWithStaff: false,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CueLibraryPage() {
  const [cues, setCues] = useState<Cue[]>(INITIAL_CUES);
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CueType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [staffSectionOpen, setStaffSectionOpen] = useState(false);
  const [form, setForm] = useState<AddCueFormData>(EMPTY_FORM);

  // Derived counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cues.forEach((c) => {
      map[c.skillCategory] = (map[c.skillCategory] ?? 0) + 1;
    });
    return map;
  }, [cues]);

  const sharedCues = useMemo(() => cues.filter((c) => c.sharedWithStaff), [cues]);
  const moduleCues = useMemo(() => cues.filter((c) => c.moduleSource), [cues]);
  const uniqueCategories = useMemo(() => new Set(cues.map((c) => c.skillCategory)).size, [cues]);

  const visible = useMemo(() => {
    return cues.filter((c) => {
      if (categoryFilter !== "all" && c.skillCategory !== categoryFilter) return false;
      if (typeFilter !== "all" && c.cueType !== typeFilter) return false;
      return true;
    });
  }, [cues, categoryFilter, typeFilter]);

  function handleTogglePrimary(id: string) {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPrimary: !c.isPrimary } : c))
    );
  }

  function handleToggleShare(id: string) {
    setCues((prev) => {
      const target = prev.find((c) => c.id === id)!;
      const next = !target.sharedWithStaff;
      toast(next ? "Cue shared with staff" : "Cue removed from staff view");
      return prev.map((c) => (c.id === id ? { ...c, sharedWithStaff: next } : c));
    });
  }

  function handleDelete(id: string) {
    setCues((prev) => prev.filter((c) => c.id !== id));
    toast("Cue deleted");
  }

  function handleAddTag() {
    const tag = form.tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || form.tags.includes(tag)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tag], tagInput: "" }));
  }

  function handleSaveCue() {
    if (!form.drillName.trim() || !form.cueText.trim() || !form.whenToUse.trim()) {
      toast.error("Please fill in drill name, cue text, and when to use.");
      return;
    }
    const newCue: Cue = {
      id: `c${Date.now()}`,
      drillName: form.drillName.trim(),
      skillCategory: form.skillCategory,
      cueText: form.cueText.trim(),
      cueType: form.cueType,
      whenToUse: form.whenToUse.trim(),
      whyItWorks: form.whyItWorks.trim(),
      isPrimary: form.isPrimary,
      tags: form.tags,
      createdAt: new Date().toISOString().slice(0, 10),
      sharedWithStaff: form.sharedWithStaff,
    };
    setCues((prev) => [newCue, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success("Cue saved to library");
  }

  return (
    <AppShell>
      <div className="px-4 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Cue Library"
          subtitle="Your personal bank of coaching language — the words you use on the floor, organized so every practice sounds the same."
        />

        {/* Header Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Cues saved", value: cues.length },
            { label: "Categories", value: uniqueCategories },
            { label: "Shared with staff", value: sharedCues.length },
            { label: "From modules", value: moduleCues.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-[28px] font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[13px] text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-3">
          {SKILL_CATEGORIES.map((cat) => {
            const count = cat.value === "all"
              ? cues.length
              : (categoryCounts[cat.value] ?? 0);
            const active = categoryFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value as SkillCategory | "all")}
                className={`min-h-[44px] px-3 rounded-full text-[13px] font-medium border transition-colors ${
                  active
                    ? "bg-[oklch(0.72_0.18_290)] text-white border-[oklch(0.72_0.18_290)]"
                    : "bg-card text-muted-foreground border-border hover:border-[oklch(0.72_0.18_290/0.5)]"
                }`}
              >
                {cat.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[11px] ${active ? "text-white/80" : "text-muted-foreground"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cue Type Filter */}
        <div className="flex gap-2 mb-8">
          {(["all", "visual", "auditory", "kinesthetic"] as const).map((type) => {
            const active = typeFilter === type;
            const labels: Record<string, string> = { all: "All Types", visual: "👁 Visual", auditory: "🔊 Auditory", kinesthetic: "🤚 Kinesthetic" };
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`min-h-[44px] px-3 rounded-full text-[13px] border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Cue List */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          {visible.length === 0 && (
            <div className="col-span-2 py-16 text-center text-muted-foreground text-[14px]">
              No cues match the current filters.
            </div>
          )}
          {visible.map((cue) => (
            <CueCard
              key={cue.id}
              cue={cue}
              onTogglePrimary={handleTogglePrimary}
              onToggleShare={handleToggleShare}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Staff Sharing Section */}
        <div className="rounded-xl border border-border bg-card mb-8">
          <button
            className="w-full flex items-center justify-between p-5 text-left"
            onClick={() => setStaffSectionOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-[15px] font-semibold text-foreground">
                Shared with Staff
              </span>
              <span className="text-[12px] px-2 py-0.5 rounded-full bg-[oklch(0.75_0.12_140/0.15)] text-[oklch(0.40_0.12_140)]">
                {sharedCues.length} cues
              </span>
            </div>
            {staffSectionOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {staffSectionOpen && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <p className="text-[13px] text-muted-foreground">
                Shared cues appear in assistant coaches' libraries and on player drill cards.
              </p>
              {sharedCues.map((cue) => (
                <div key={cue.id} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <div>
                    <span className="text-[14px] font-semibold text-foreground">"{cue.cueText}"</span>
                    <span className="ml-2 text-[12px] text-muted-foreground">· {cue.drillName}</span>
                  </div>
                  <button
                    onClick={() => handleToggleShare(cue.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-[oklch(0.68_0.22_25)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Cue Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-[600px] rounded-2xl border border-border bg-card p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-foreground">Add Cue</h2>
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drill name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">Drill name</label>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  placeholder="e.g. Two-Ball Dribble"
                  value={form.drillName}
                  onChange={(e) => setForm((f) => ({ ...f, drillName: e.target.value }))}
                />
              </div>

              {/* Skill category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">Skill category</label>
                <select
                  className="h-11 rounded-lg border border-border bg-background px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  value={form.skillCategory}
                  onChange={(e) => setForm((f) => ({ ...f, skillCategory: e.target.value as SkillCategory }))}
                >
                  {SKILL_CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Cue text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">
                  Cue text
                  <span className="ml-2 text-muted-foreground font-normal">{form.cueText.length}/60</span>
                </label>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  placeholder="e.g. Elbow in, eyes up"
                  maxLength={60}
                  value={form.cueText}
                  onChange={(e) => setForm((f) => ({ ...f, cueText: e.target.value }))}
                />
              </div>

              {/* Cue type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">Cue type</label>
                <div className="flex gap-2">
                  {(["visual", "auditory", "kinesthetic"] as CueType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm((f) => ({ ...f, cueType: type }))}
                      className={`flex-1 h-11 rounded-lg border text-[13px] font-medium transition-colors ${
                        form.cueType === type
                          ? "bg-[oklch(0.72_0.18_290)] text-white border-[oklch(0.72_0.18_290)]"
                          : "bg-background text-muted-foreground border-border hover:border-[oklch(0.72_0.18_290/0.5)]"
                      }`}
                    >
                      {type === "visual" ? "👁" : type === "auditory" ? "🔊" : "🤚"} {CUE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* When to use */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">When to use</label>
                <textarea
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  rows={2}
                  placeholder="e.g. When player's elbow flares on jump shot"
                  value={form.whenToUse}
                  onChange={(e) => setForm((f) => ({ ...f, whenToUse: e.target.value }))}
                />
              </div>

              {/* Why it works */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">
                  Why it works <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  rows={2}
                  placeholder="Brief explanation of the mechanism"
                  value={form.whyItWorks}
                  onChange={(e) => setForm((f) => ({ ...f, whyItWorks: e.target.value }))}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-foreground">Tags</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-11 rounded-lg border border-border bg-background px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                    placeholder="Add a tag..."
                    value={form.tagInput}
                    onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }}}
                  />
                  <button
                    onClick={handleAddTag}
                    className="h-11 px-4 rounded-lg bg-muted text-[13px] font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {form.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[12px] text-muted-foreground">
                        #{tag}
                        <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                {[
                  { key: "isPrimary", label: "Set as primary cue for this drill" },
                  { key: "sharedWithStaff", label: "Share with staff" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <div
                      onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof AddCueFormData] }))}
                      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                        form[key as keyof AddCueFormData]
                          ? "bg-[oklch(0.72_0.18_290)]"
                          : "bg-muted"
                      } relative cursor-pointer`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key as keyof AddCueFormData] ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                    <span className="text-[14px] text-foreground">{label}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleSaveCue}
                className="h-12 rounded-xl bg-[oklch(0.72_0.18_290)] text-white text-[15px] font-semibold hover:bg-[oklch(0.65_0.18_290)] transition-colors"
              >
                Save Cue
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-8 right-6 lg:right-10 z-40 h-14 w-14 rounded-full bg-[oklch(0.72_0.18_290)] text-white shadow-lg flex items-center justify-center hover:bg-[oklch(0.65_0.18_290)] transition-colors"
            title="Add cue"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </AppShell>
  );
}
