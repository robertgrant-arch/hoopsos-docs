/**
 * Practice Plan + Drill Library mock data.
 *
 * Modeled to match the production Prisma schema in Prompt 3:
 *   model DrillCategory { id, name, drills }
 *   model Drill         { id, categoryId, title, description, videoUrl, durationSec }
 *
 * Plus a richer in-app `PracticePlan` model for the builder, which in production
 * would map to a `PracticePlan` table with `PracticePlanBlock` rows.
 */

export type DrillIntensity = "LOW" | "MEDIUM" | "HIGH" | "MAX";
export type DrillSurface = "HALF_COURT" | "FULL_COURT" | "BASELINE" | "STATIONARY";

export type DrillVisibility = "private" | "org" | "public";

export type Drill = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  defaultDurationMin: number;
  intensity: DrillIntensity;
  surface: DrillSurface;
  minPlayers: number;
  maxPlayers: number;
  equipment: string[]; // e.g. ["Cones", "Chairs"]
  coachesNeeded: number;
  videoUrl?: string;
  tags: string[];
  /** Coaching points / cues. Bullet list rendered in the drill card. */
  coachingPoints?: string[];
  /** Optional diagram or thumbnail image URL. */
  diagramUrl?: string;
  /** Ownership — set on custom drills authored by a coach. */
  ownerCoachId?: string;
  /** Org scoping for org-visible custom drills. */
  orgId?: string;
  /** True when authored by a coach; false / undefined for global library. */
  isCustom?: boolean;
  /** Visibility scope (only meaningful when isCustom). */
  visibility?: DrillVisibility;
  /** ISO timestamp — when the custom drill was created. */
  createdAt?: string;
  /** ISO timestamp — last edit. */
  updatedAt?: string;
};

export type DrillCategory = {
  id: string;
  name: string;
  color: string; // OKLCH for the swatch
  description: string;
};

export const drillCategories: DrillCategory[] = [
  {
    id: "cat_warmup",
    name: "Warm-up & Activation",
    color: "oklch(0.7 0.18 190)",
    description: "Dynamic mobility, layup lines, partner work to start practice.",
  },
  {
    id: "cat_shooting",
    name: "Shooting",
    color: "oklch(0.78 0.16 75)",
    description: "Form, catch-and-shoot, off-the-dribble, free throws.",
  },
  {
    id: "cat_handles",
    name: "Ball Handling",
    color: "oklch(0.7 0.16 280)",
    description: "Stationary, two-ball, full-court attack series.",
  },
  {
    id: "cat_finishing",
    name: "Finishing & Footwork",
    color: "oklch(0.72 0.18 320)",
    description: "Mikan, Euro, contact finishes, jump-stop reads.",
  },
  {
    id: "cat_offense",
    name: "Team Offense",
    color: "oklch(0.72 0.17 50)",
    description: "Sets, motion, transition, BLOB / SLOB / ATO.",
  },
  {
    id: "cat_defense",
    name: "Team Defense",
    color: "oklch(0.7 0.18 25)",
    description: "Closeouts, shell, PnR coverage, zone, scrambles.",
  },
  {
    id: "cat_conditioning",
    name: "Conditioning",
    color: "oklch(0.72 0.2 30)",
    description: "Suicides, lane slides, gauntlet finishers.",
  },
  {
    id: "cat_film",
    name: "Film & Walk-through",
    color: "oklch(0.7 0.13 140)",
    description: "Scout review, opponent tendencies, half-speed walk-throughs.",
  },
];

export const drillLibrary: Drill[] = [
  // Warm-up
  {
    id: "drl_dyn_warmup",
    categoryId: "cat_warmup",
    title: "Dynamic Mobility Series",
    description: "High-knees → butt-kicks → walking lunges → lateral shuffle baseline-to-baseline.",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "FULL_COURT",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["mandatory", "injury-prevention"],
  },
  {
    id: "drl_layup_lines",
    categoryId: "cat_warmup",
    title: "3-Line Layups",
    description: "Right-hand, left-hand, then reverse. 30 makes per side before progressing.",
    defaultDurationMin: 7,
    intensity: "LOW",
    surface: "FULL_COURT",
    minPlayers: 9,
    maxPlayers: 18,
    equipment: ["3 Balls"],
    coachesNeeded: 1,
    tags: ["foundation"],
  },
  {
    id: "drl_partner_passing",
    categoryId: "cat_warmup",
    title: "Partner Passing Progression",
    description: "Chest → bounce → overhead → behind-the-back. 10 reps each, both hands.",
    defaultDurationMin: 5,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 2,
    maxPlayers: 24,
    equipment: ["1 Ball / Pair"],
    coachesNeeded: 1,
    tags: ["fundamentals"],
  },

  // Shooting
  {
    id: "drl_form_shooting",
    categoryId: "cat_shooting",
    title: "Form Shooting Ladder",
    description: "5 reps from 5 spots, 1-handed → guide hand → full release. Block-out arc tracks.",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 12,
    equipment: ["1 Ball / Player", "Spot Markers"],
    coachesNeeded: 2,
    tags: ["technique"],
  },
  {
    id: "drl_shooting_circuit",
    categoryId: "cat_shooting",
    title: "5-Spot Catch & Shoot",
    description: "Off-the-pass at corner, wing, top, wing, corner. 10 makes per spot to advance.",
    defaultDurationMin: 12,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["3 Balls", "Rebounder"],
    coachesNeeded: 2,
    tags: ["primary"],
  },
  {
    id: "drl_pnr_pull",
    categoryId: "cat_shooting",
    title: "PnR Pull-Up Reads",
    description: "Coach as screener. Reject vs use. Pull-up at elbow + floater in lane.",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 6,
    equipment: ["2 Balls", "1 Chair"],
    coachesNeeded: 1,
    tags: ["guards"],
  },
  {
    id: "drl_free_throws",
    categoryId: "cat_shooting",
    title: "50-In-A-Row Free Throws",
    description: "Pairs at 6 baskets. If a pair misses, both run a suicide. Aggregate to 50.",
    defaultDurationMin: 10,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 6,
    maxPlayers: 18,
    equipment: ["1 Ball / Pair"],
    coachesNeeded: 1,
    tags: ["pressure", "team"],
  },
  {
    id: "drl_3pt_circuit",
    categoryId: "cat_shooting",
    title: "Beat-the-Pro Three-Point",
    description: "Score 1 per make, lose 2 per miss. Race to +21.",
    defaultDurationMin: 8,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 3,
    maxPlayers: 9,
    equipment: ["3 Balls"],
    coachesNeeded: 1,
    tags: ["competitive"],
  },

  // Ball Handling
  {
    id: "drl_two_ball",
    categoryId: "cat_handles",
    title: "Two-Ball Stationary Series",
    description: "Pound · alternating · v-dribble · figure-8. 30 sec per move, full speed.",
    defaultDurationMin: 6,
    intensity: "MEDIUM",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 20,
    equipment: ["2 Balls / Player"],
    coachesNeeded: 1,
    tags: ["guards", "foundation"],
  },
  {
    id: "drl_full_court_handles",
    categoryId: "cat_handles",
    title: "Full-Court 4-Move Attack",
    description: "Hesi → cross → between → behind. Pull-up at elbow. Both directions.",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["1 Ball / Player", "Cones"],
    coachesNeeded: 1,
    tags: ["guards"],
  },
  {
    id: "drl_chair_attack",
    categoryId: "cat_handles",
    title: "Chair Attack Series",
    description: "Attack chair, score off Euro / floater / stepback. Decision-making focus.",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 8,
    equipment: ["3 Chairs", "1 Ball / Player"],
    coachesNeeded: 1,
    tags: ["scoring"],
  },

  // Finishing
  {
    id: "drl_mikan",
    categoryId: "cat_finishing",
    title: "Mikan + Reverse Mikan",
    description: "20 reps each side. Continuous, no dribble between makes.",
    defaultDurationMin: 5,
    intensity: "MEDIUM",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 20,
    equipment: ["1 Ball / Player"],
    coachesNeeded: 1,
    tags: ["bigs", "foundation"],
  },
  {
    id: "drl_contact_finish",
    categoryId: "cat_finishing",
    title: "Contact Finish Gauntlet",
    description: "Coach with pad bumps on every drive. Finish through contact.",
    defaultDurationMin: 10,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 8,
    equipment: ["Pad", "1 Ball"],
    coachesNeeded: 2,
    tags: ["physicality"],
  },
  {
    id: "drl_jump_stop_reads",
    categoryId: "cat_finishing",
    title: "Jump-Stop Reads",
    description: "Drive, jump-stop, read help. Pass out vs finish vs pivot pass.",
    defaultDurationMin: 8,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["decision"],
  },

  // Team Offense
  {
    id: "drl_horns_walk",
    categoryId: "cat_offense",
    title: "Horns — Walk-Through (5v0)",
    description: "Entry → flex cut → pin-down. Read 1 then Read 2. No defense.",
    defaultDurationMin: 10,
    intensity: "LOW",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["sets", "install"],
  },
  {
    id: "drl_horns_live",
    categoryId: "cat_offense",
    title: "Horns — Live (5v5)",
    description: "Same set vs scout team. Reset every miss. 8 makes total.",
    defaultDurationMin: 15,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 10,
    maxPlayers: 12,
    equipment: ["1 Ball"],
    coachesNeeded: 2,
    tags: ["sets", "live"],
  },
  {
    id: "drl_motion_strong",
    categoryId: "cat_offense",
    title: "5-Out Motion Strong",
    description: "Pass-cut-fill rules. Score off back-cut, dho, or skip.",
    defaultDurationMin: 12,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["motion"],
  },
  {
    id: "drl_transition_3v2_2v1",
    categoryId: "cat_offense",
    title: "3v2 → 2v1 Continuous",
    description: "Score, defenders to outlet. Continuous flow.",
    defaultDurationMin: 12,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 8,
    maxPlayers: 15,
    equipment: ["2 Balls"],
    coachesNeeded: 1,
    tags: ["transition", "decision"],
  },
  {
    id: "drl_blob_box",
    categoryId: "cat_offense",
    title: "BLOB — Box Cross",
    description: "Box set with elevator screen for shooter. 3 reps each side.",
    defaultDurationMin: 6,
    intensity: "LOW",
    surface: "BASELINE",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["situational", "BLOB"],
  },

  // Team Defense
  {
    id: "drl_shell_defense",
    categoryId: "cat_defense",
    title: "4-on-4 Shell Drill",
    description: "Stance, jump-to-ball, help-and-recover. Reset every score.",
    defaultDurationMin: 12,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 8,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["foundation"],
  },
  {
    id: "drl_closeouts",
    categoryId: "cat_defense",
    title: "Closeout & Contest",
    description: "Sprint to shooter, high hands, no foul. 3 reps each, 5 baskets.",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 6,
    maxPlayers: 18,
    equipment: ["3 Balls"],
    coachesNeeded: 2,
    tags: ["technique"],
  },
  {
    id: "drl_pnr_ice",
    categoryId: "cat_defense",
    title: "PnR — ICE Coverage",
    description: "Sideline pick. Ball handler forced baseline. Big drops to nail.",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["scout", "coverage"],
  },
  {
    id: "drl_zone_offense",
    categoryId: "cat_defense",
    title: "vs 2-3 Zone — High-Low",
    description: "Flash to high post, look low. 3 reps per offensive entry.",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 10,
    maxPlayers: 12,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["zone"],
  },

  // Conditioning
  {
    id: "drl_suicides",
    categoryId: "cat_conditioning",
    title: "Suicides x4",
    description: "FT → half → far FT → baseline. 4 reps under 28 sec each.",
    defaultDurationMin: 5,
    intensity: "MAX",
    surface: "FULL_COURT",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["finisher"],
  },
  {
    id: "drl_lane_slides",
    categoryId: "cat_conditioning",
    title: "Lane Slide Cycles",
    description: "Defensive slide width of lane. 30 sec on, 15 sec off, x6.",
    defaultDurationMin: 5,
    intensity: "HIGH",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["defense", "footwork"],
  },
  {
    id: "drl_22_in_4",
    categoryId: "cat_conditioning",
    title: "22 Layups in 4 Minutes",
    description: "Two lines, 11 makes per side. Miss = restart count.",
    defaultDurationMin: 5,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["2 Balls"],
    coachesNeeded: 1,
    tags: ["competitive"],
  },

  // Film & Walk-through
  {
    id: "drl_film_review",
    categoryId: "cat_film",
    title: "Scout Film — 10 Clips",
    description: "Last opponent's top 10 actions. Pause + question every clip.",
    defaultDurationMin: 12,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 5,
    maxPlayers: 20,
    equipment: ["TV / Projector"],
    coachesNeeded: 1,
    tags: ["scout", "film"],
  },
  {
    id: "drl_play_install",
    categoryId: "cat_film",
    title: "Play Install — Whiteboard",
    description: "Coach diagrams on whiteboard, athletes mirror on court at half-speed.",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 12,
    equipment: ["Whiteboard"],
    coachesNeeded: 1,
    tags: ["install"],
  },
];

/* -------------------------------------------------------------------------- */
/* PracticePlan model                                                          */
/* -------------------------------------------------------------------------- */

export type PracticePlanBlock = {
  id: string;
  drillId: string;
  durationMin: number;
  notes: string;
  /** Number of athletes that this block targets (overrides drill default for the plan). */
  athleteCount?: number;
};

export type PracticePlan = {
  id: string;
  title: string;
  date: string; // ISO date string for "Practice on"
  startTime: string; // "16:00"
  budgetMin: number;
  opponent?: string;
  focus: string;
  authorId: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  blocks: PracticePlanBlock[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export const practicePlans: PracticePlan[] = [
  {
    id: "plan_1",
    title: "Pre-Westbury Sharpening",
    date: "2026-05-02",
    startTime: "16:00",
    budgetMin: 90,
    opponent: "Westbury Catholic",
    focus: "PnR coverage (ICE) + zone offense + late-clock execution.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "PUBLISHED",
    createdAt: "2026-04-29T22:00:00Z",
    updatedAt: "2026-04-30T11:30:00Z",
    blocks: [
      { id: "blk_1", drillId: "drl_dyn_warmup", durationMin: 8, notes: "Quick — coaches keep tempo." },
      { id: "blk_2", drillId: "drl_layup_lines", durationMin: 7, notes: "Lefties to far end." },
      { id: "blk_3", drillId: "drl_shooting_circuit", durationMin: 12, notes: "Pairs at every basket." },
      { id: "blk_4", drillId: "drl_pnr_ice", durationMin: 12, notes: "vs Westbury sets — Coverage Sheet" },
      { id: "blk_5", drillId: "drl_zone_offense", durationMin: 10, notes: "4-out vs 2-3, high-low look." },
      { id: "blk_6", drillId: "drl_horns_live", durationMin: 15, notes: "Game-speed. 8 makes total." },
      { id: "blk_7", drillId: "drl_blob_box", durationMin: 6, notes: "BLOB after timeout reps." },
      { id: "blk_8", drillId: "drl_free_throws", durationMin: 10, notes: "50-in-a-row finisher." },
      { id: "blk_9", drillId: "drl_suicides", durationMin: 5, notes: "Earned, not punishment." },
    ],
  },
  {
    id: "plan_2",
    title: "Friday Skill Day",
    date: "2026-05-04",
    startTime: "15:30",
    budgetMin: 75,
    focus: "Individual development — shooting + handles + finishing.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "DRAFT",
    createdAt: "2026-04-30T08:00:00Z",
    updatedAt: "2026-04-30T08:00:00Z",
    blocks: [
      { id: "blk_a", drillId: "drl_dyn_warmup", durationMin: 8, notes: "" },
      { id: "blk_b", drillId: "drl_two_ball", durationMin: 10, notes: "Two-ball stationary." },
      { id: "blk_c", drillId: "drl_form_shooting", durationMin: 10, notes: "Block out arc, then 5-spot." },
      { id: "blk_d", drillId: "drl_full_court_handles", durationMin: 12, notes: "" },
      { id: "blk_e", drillId: "drl_chair_attack", durationMin: 10, notes: "Reads vs imaginary help." },
      { id: "blk_f", drillId: "drl_jump_stop_reads", durationMin: 8, notes: "" },
      { id: "blk_g", drillId: "drl_3pt_circuit", durationMin: 8, notes: "Beat-the-pro." },
    ],
  },
  {
    id: "plan_3",
    title: "Monday Install Day",
    date: "2026-05-05",
    startTime: "16:00",
    budgetMin: 90,
    focus: "Install: 5-Out Motion Strong + ICE + new BLOB.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "DRAFT",
    createdAt: "2026-04-30T09:30:00Z",
    updatedAt: "2026-04-30T09:30:00Z",
    blocks: [
      { id: "blk_x", drillId: "drl_dyn_warmup", durationMin: 8, notes: "" },
      { id: "blk_y", drillId: "drl_partner_passing", durationMin: 5, notes: "" },
      { id: "blk_z", drillId: "drl_play_install", durationMin: 12, notes: "Whiteboard install — Motion." },
      { id: "blk_w", drillId: "drl_motion_strong", durationMin: 15, notes: "Full reps 5v0 → 5v5." },
      { id: "blk_v", drillId: "drl_film_review", durationMin: 12, notes: "Last week's bad possessions." },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function planTotalMinutes(plan: PracticePlan): number {
  return plan.blocks.reduce((sum, b) => sum + b.durationMin, 0);
}

export function planEquipment(plan: PracticePlan): string[] {
  const set = new Set<string>();
  for (const b of plan.blocks) {
    const drill = drillLibrary.find((d) => d.id === b.drillId);
    drill?.equipment.forEach((e) => set.add(e));
  }
  return Array.from(set).sort();
}

export function planMaxCoaches(plan: PracticePlan): number {
  return plan.blocks.reduce((max, b) => {
    const drill = drillLibrary.find((d) => d.id === b.drillId);
    return Math.max(max, drill?.coachesNeeded ?? 1);
  }, 1);
}

/**
 * Resolve a drill by id from the GLOBAL library only. Custom-drill consumers
 * should use the `useResolveDrill` hook from `customDrillsStore`-aware sites,
 * which falls back to the persisted custom-drills store.
 */
export function findDrill(drillId: string): Drill | undefined {
  return drillLibrary.find((d) => d.id === drillId);
}

export function findCategory(categoryId: string): DrillCategory | undefined {
  return drillCategories.find((c) => c.id === categoryId);
}
