// Mock data for Development Timeline and Season Management
// Covers longitudinal player tracking across multiple seasons.

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type SeasonStatus = "upcoming" | "active" | "completed" | "archived";
export type SeasonType = "fall" | "spring" | "summer" | "winter";

export type Season = {
  id: string;
  orgId: string;
  name: string;
  type: SeasonType;
  status: SeasonStatus;
  startDate: string;
  endDate: string;
  ageGroups: string[];
  totalPlayers: number;
  activeCoaches: number;
  assessmentWindows: AssessmentWindow[];
  stats: SeasonStats;
};

export type AssessmentWindow = {
  id: string;
  label: string;
  openDate: string;
  closeDate: string;
  status: "upcoming" | "open" | "closed";
  completionRate: number;
};

export type SeasonStats = {
  avgWodCompletion: number;
  avgAttendance: number;
  totalFilmSubmissions: number;
  totalCoachObservations: number;
  avgSkillDelta: number;
  idpGoalsCompleted: number;
  idpGoalsTotal: number;
  playerRetentionRate: number;
  atRiskCount: number;
  mostImprovedPlayerId?: string;
  mostImprovedPlayerName?: string;
};

export type PlayerSeasonArc = {
  playerId: string;
  playerName: string;
  position: string;
  seasons: PlayerSeasonSummary[];
};

export type PlayerSeasonSummary = {
  seasonId: string;
  seasonName: string;
  skillLevels: Record<string, number>;
  idpGoalsCompleted: number;
  idpGoalsTotal: number;
  wodCompletion: number;
  attendanceRate: number;
  coachSummary: string;
  milestone?: string;
};

export type TimelineEvent = {
  id: string;
  playerId: string;
  type:
    | "assessment"
    | "milestone"
    | "idp_goal"
    | "observation"
    | "film"
    | "achievement"
    | "season_start"
    | "season_end";
  date: string;
  title: string;
  description: string;
  skill?: string;
  icon: string;
  significance: "normal" | "high";
  coachNote?: string;
};

/* -------------------------------------------------------------------------- */
/* Seasons                                                                     */
/* -------------------------------------------------------------------------- */

export const seasons: Season[] = [
  {
    id: "season_fall_2025",
    orgId: "org_texas_elite",
    name: "Fall 2025",
    type: "fall",
    status: "completed",
    startDate: "2025-09-08",
    endDate: "2025-12-20",
    ageGroups: ["13U", "15U", "17U"],
    totalPlayers: 48,
    activeCoaches: 6,
    assessmentWindows: [
      {
        id: "aw_f25_baseline",
        label: "Baseline Assessment",
        openDate: "2025-09-08",
        closeDate: "2025-09-22",
        status: "closed",
        completionRate: 0.96,
      },
      {
        id: "aw_f25_mid",
        label: "Mid-Season",
        openDate: "2025-10-27",
        closeDate: "2025-11-10",
        status: "closed",
        completionRate: 0.88,
      },
      {
        id: "aw_f25_final",
        label: "Final Assessment",
        openDate: "2025-12-08",
        closeDate: "2025-12-20",
        status: "closed",
        completionRate: 0.92,
      },
    ],
    stats: {
      avgWodCompletion: 0.81,
      avgAttendance: 0.87,
      totalFilmSubmissions: 214,
      totalCoachObservations: 182,
      avgSkillDelta: 0.74,
      idpGoalsCompleted: 109,
      idpGoalsTotal: 144,
      playerRetentionRate: 0.94,
      atRiskCount: 3,
      mostImprovedPlayerId: "player_malik",
      mostImprovedPlayerName: "Malik Henderson",
    },
  },
  {
    id: "season_spring_2026",
    orgId: "org_texas_elite",
    name: "Spring 2026",
    type: "spring",
    status: "active",
    startDate: "2026-02-02",
    endDate: "2026-06-14",
    ageGroups: ["13U", "15U", "17U"],
    totalPlayers: 52,
    activeCoaches: 7,
    assessmentWindows: [
      {
        id: "aw_sp26_baseline",
        label: "Baseline Assessment",
        openDate: "2026-02-02",
        closeDate: "2026-02-16",
        status: "closed",
        completionRate: 0.98,
      },
      {
        id: "aw_sp26_mid",
        label: "Mid-Season",
        openDate: "2026-04-06",
        closeDate: "2026-04-20",
        status: "open",
        completionRate: 0.71,
      },
      {
        id: "aw_sp26_final",
        label: "Final Assessment",
        openDate: "2026-06-01",
        closeDate: "2026-06-14",
        status: "upcoming",
        completionRate: 0,
      },
    ],
    stats: {
      avgWodCompletion: 0.84,
      avgAttendance: 0.89,
      totalFilmSubmissions: 163,
      totalCoachObservations: 141,
      avgSkillDelta: 0.62,
      idpGoalsCompleted: 87,
      idpGoalsTotal: 156,
      playerRetentionRate: 0.96,
      atRiskCount: 2,
      mostImprovedPlayerId: "player_brandon",
      mostImprovedPlayerName: "Brandon Lee",
    },
  },
  {
    id: "season_summer_2026",
    orgId: "org_texas_elite",
    name: "Summer 2026",
    type: "summer",
    status: "upcoming",
    startDate: "2026-06-22",
    endDate: "2026-08-29",
    ageGroups: ["13U", "15U", "17U", "18U"],
    totalPlayers: 0,
    activeCoaches: 0,
    assessmentWindows: [
      {
        id: "aw_su26_baseline",
        label: "Baseline Assessment",
        openDate: "2026-06-22",
        closeDate: "2026-07-06",
        status: "upcoming",
        completionRate: 0,
      },
      {
        id: "aw_su26_final",
        label: "Final Assessment",
        openDate: "2026-08-17",
        closeDate: "2026-08-29",
        status: "upcoming",
        completionRate: 0,
      },
    ],
    stats: {
      avgWodCompletion: 0,
      avgAttendance: 0,
      totalFilmSubmissions: 0,
      totalCoachObservations: 0,
      avgSkillDelta: 0,
      idpGoalsCompleted: 0,
      idpGoalsTotal: 0,
      playerRetentionRate: 0,
      atRiskCount: 0,
    },
  },
  {
    id: "season_fall_2026",
    orgId: "org_texas_elite",
    name: "Fall 2026",
    type: "fall",
    status: "upcoming",
    startDate: "2026-09-07",
    endDate: "2026-12-19",
    ageGroups: ["13U", "15U", "17U"],
    totalPlayers: 0,
    activeCoaches: 0,
    assessmentWindows: [
      {
        id: "aw_f26_baseline",
        label: "Baseline Assessment",
        openDate: "2026-09-07",
        closeDate: "2026-09-21",
        status: "upcoming",
        completionRate: 0,
      },
      {
        id: "aw_f26_mid",
        label: "Mid-Season",
        openDate: "2026-11-02",
        closeDate: "2026-11-16",
        status: "upcoming",
        completionRate: 0,
      },
      {
        id: "aw_f26_final",
        label: "Final Assessment",
        openDate: "2026-12-07",
        closeDate: "2026-12-19",
        status: "upcoming",
        completionRate: 0,
      },
    ],
    stats: {
      avgWodCompletion: 0,
      avgAttendance: 0,
      totalFilmSubmissions: 0,
      totalCoachObservations: 0,
      avgSkillDelta: 0,
      idpGoalsCompleted: 0,
      idpGoalsTotal: 0,
      playerRetentionRate: 0,
      atRiskCount: 0,
    },
  },
];

export const currentSeason = seasons.find((s) => s.status === "active")!;

/* -------------------------------------------------------------------------- */
/* Player Season Arcs                                                          */
/* -------------------------------------------------------------------------- */

export const playerSeasonArcs: PlayerSeasonArc[] = [
  // ── Malik Henderson ───────────────────────────────────────────────────────
  {
    playerId: "player_malik",
    playerName: "Malik Henderson",
    position: "SG",
    seasons: [
      {
        seasonId: "season_fall_2025",
        seasonName: "Fall 2025",
        skillLevels: {
          Shooting: 2,
          Ballhandling: 3,
          Defense: 2,
          Athleticism: 3,
          IQ: 2,
        },
        idpGoalsCompleted: 3,
        idpGoalsTotal: 4,
        wodCompletion: 0.78,
        attendanceRate: 0.9,
        coachSummary:
          "Malik came in with raw talent but needed structure. By mid-season he was one of our most consistent workers in the gym. His shooting mechanics improved dramatically after we adjusted his release point. He is a player to watch heading into the spring.",
        milestone: "Named team MVP — Fall 2025",
      },
      {
        seasonId: "season_spring_2026",
        seasonName: "Spring 2026",
        skillLevels: {
          Shooting: 3,
          Ballhandling: 4,
          Defense: 3,
          Athleticism: 4,
          IQ: 3,
        },
        idpGoalsCompleted: 2,
        idpGoalsTotal: 4,
        wodCompletion: 0.86,
        attendanceRate: 0.94,
        coachSummary:
          "Malik is one of our most improved players two seasons running. His ball handling in traffic has become a genuine strength and he is reading pick-and-roll coverages much earlier now. Defense still needs work on help-side rotations, but the trajectory is excellent.",
        milestone: "Biggest skill delta in 17U — Spring 2026",
      },
    ],
  },

  // ── Brandon Lee ───────────────────────────────────────────────────────────
  {
    playerId: "player_brandon",
    playerName: "Brandon Lee",
    position: "PF",
    seasons: [
      {
        seasonId: "season_fall_2025",
        seasonName: "Fall 2025",
        skillLevels: {
          Shooting: 2,
          Post: 3,
          Rebounding: 3,
          Defense: 3,
          Athleticism: 2,
          IQ: 3,
        },
        idpGoalsCompleted: 2,
        idpGoalsTotal: 3,
        wodCompletion: 0.71,
        attendanceRate: 0.82,
        coachSummary:
          "Brandon is a physical presence in the paint and his basketball IQ is above average for his age group. Attendance was inconsistent early in the season which hurt his progression. Finished strong once we locked in expectations. Shooting from 15 feet is the primary focus heading forward.",
      },
      {
        seasonId: "season_spring_2026",
        seasonName: "Spring 2026",
        skillLevels: {
          Shooting: 3,
          Post: 4,
          Rebounding: 4,
          Defense: 4,
          Athleticism: 3,
          IQ: 4,
        },
        idpGoalsCompleted: 3,
        idpGoalsTotal: 4,
        wodCompletion: 0.89,
        attendanceRate: 0.96,
        coachSummary:
          "This was Brandon's breakout season. His mid-range game off the short corner is now a reliable weapon, his defensive positioning on the block has become textbook, and his rebounding instincts have taken a leap. He is the most improved big man in the program this spring.",
        milestone: "Most improved player — Spring 2026 15U",
      },
    ],
  },

  // ── Jaylen Scott ──────────────────────────────────────────────────────────
  {
    playerId: "player_jaylen",
    playerName: "Jaylen Scott",
    position: "PG",
    seasons: [
      {
        seasonId: "season_fall_2025",
        seasonName: "Fall 2025",
        skillLevels: {
          Shooting: 3,
          Ballhandling: 3,
          Passing: 3,
          Defense: 2,
          Athleticism: 3,
          IQ: 3,
        },
        idpGoalsCompleted: 3,
        idpGoalsTotal: 4,
        wodCompletion: 0.83,
        attendanceRate: 0.91,
        coachSummary:
          "Jaylen is a natural point guard with excellent vision. He struggled with tunnel vision off the pick-and-roll early on but by the end of fall he was making the right read at a high clip. His defensive intensity still needs to match his offensive output — it will unlock another level for him.",
      },
      {
        seasonId: "season_spring_2026",
        seasonName: "Spring 2026",
        skillLevels: {
          Shooting: 4,
          Ballhandling: 4,
          Passing: 5,
          Defense: 3,
          Athleticism: 4,
          IQ: 4,
        },
        idpGoalsCompleted: 4,
        idpGoalsTotal: 4,
        wodCompletion: 0.92,
        attendanceRate: 0.98,
        coachSummary:
          "Jaylen is playing the best basketball of his career. His passing reads are college-level, his shooting off screens is automatic, and — critically — his defensive motor has turned on. He completed all four IDP goals this season, the first player in the program to do so. He is a division-one prospect.",
        milestone: "First player to complete all 4 IDP goals — Spring 2026",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Player Timelines                                                            */
/* -------------------------------------------------------------------------- */

const malikTimeline: TimelineEvent[] = [
  {
    id: "tm_1",
    playerId: "player_malik",
    type: "season_start",
    date: "2025-09-08",
    title: "Fall 2025 Season Begins",
    description: "Malik joins the Texas Elite 17U program for his first season with HoopsOS.",
    icon: "🏀",
    significance: "high",
    coachNote: "High ceiling athlete. Raw mechanics but elite athleticism. Putting him on a shooting-first IDP.",
  },
  {
    id: "tm_2",
    playerId: "player_malik",
    type: "assessment",
    date: "2025-09-14",
    title: "Baseline Assessment Completed",
    description: "Shooting 2 · Ballhandling 3 · Defense 2 · Athleticism 3 · IQ 2",
    skill: "Shooting",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tm_3",
    playerId: "player_malik",
    type: "idp_goal",
    date: "2025-09-22",
    title: "IDP Goal Set: Fix Release Point",
    description: "Coach Grant set a goal to elevate Malik's release point and improve arc consistency by mid-season.",
    skill: "Shooting",
    icon: "🎯",
    significance: "normal",
  },
  {
    id: "tm_4",
    playerId: "player_malik",
    type: "film",
    date: "2025-10-03",
    title: "Film Submitted: Footwork on Catch-and-Shoot",
    description: "Uploaded 3 clips demonstrating catch-and-shoot footwork improvements after drill work.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tm_5",
    playerId: "player_malik",
    type: "observation",
    date: "2025-10-11",
    title: "Coach Observation: Shooting Mechanics",
    description: "Coach Grant logged an observation noting significant improvement in shot consistency during live reps.",
    skill: "Shooting",
    icon: "👁️",
    significance: "normal",
    coachNote: "Release point is cleaning up fast. Arc is much more consistent on mid-range. Keep the reps coming.",
  },
  {
    id: "tm_6",
    playerId: "player_malik",
    type: "milestone",
    date: "2025-10-18",
    title: "Shooting Level Up: 2 → 3",
    description: "Malik's shooting skill level was upgraded from 2 to 3 after sustained performance in assessments and practice.",
    skill: "Shooting",
    icon: "⬆️",
    significance: "high",
    coachNote: "Genuine improvement. Arc and rhythm are both improved. Now the focus shifts to off-screen shooting.",
  },
  {
    id: "tm_7",
    playerId: "player_malik",
    type: "assessment",
    date: "2025-11-03",
    title: "Mid-Season Assessment Completed",
    description: "Shooting 3 · Ballhandling 3 · Defense 2 · Athleticism 3 · IQ 2",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tm_8",
    playerId: "player_malik",
    type: "idp_goal",
    date: "2025-11-14",
    title: "IDP Goal Completed: Fix Release Point",
    description: "Coach certified that Malik's release point and arc are now consistently above 45 degrees on catch-and-shoot attempts.",
    skill: "Shooting",
    icon: "✅",
    significance: "high",
    coachNote: "Honestly one of the fastest mechanical fixes I have seen. He put in the work.",
  },
  {
    id: "tm_9",
    playerId: "player_malik",
    type: "film",
    date: "2025-11-28",
    title: "Film Submitted: Ball Screen Read Drill",
    description: "Submitted 2 clips from training showing improved decisions coming off ball screens.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tm_10",
    playerId: "player_malik",
    type: "observation",
    date: "2025-12-05",
    title: "Coach Observation: Leadership Emergence",
    description: "Coach noted Malik encouraging teammates through adversity in practice and holding vocal accountability.",
    icon: "👁️",
    significance: "normal",
    coachNote: "Leadership qualities are showing up unprompted. This is a big deal at 17U.",
  },
  {
    id: "tm_11",
    playerId: "player_malik",
    type: "achievement",
    date: "2025-12-15",
    title: "Named Team MVP — Fall 2025",
    description: "Malik was voted team MVP by coaches and peers at the end-of-season ceremony, recognizing his development and leadership.",
    icon: "🏆",
    significance: "high",
    coachNote: "Most improved and most inspiring player this fall. He raised the standard for the whole group.",
  },
  {
    id: "tm_12",
    playerId: "player_malik",
    type: "season_end",
    date: "2025-12-20",
    title: "Fall 2025 Season Complete",
    description: "Season concluded with 78% WOD completion and 90% attendance. 3 of 4 IDP goals completed.",
    icon: "🔒",
    significance: "normal",
  },
  {
    id: "tm_13",
    playerId: "player_malik",
    type: "season_start",
    date: "2026-02-02",
    title: "Spring 2026 Season Begins",
    description: "Malik returns for Spring 2026 with elevated expectations after winning Fall MVP.",
    icon: "🏀",
    significance: "high",
    coachNote: "Returning him as a leader in the 17U group. High bar set — he knows it.",
  },
  {
    id: "tm_14",
    playerId: "player_malik",
    type: "assessment",
    date: "2026-02-09",
    title: "Baseline Assessment Completed",
    description: "Shooting 3 · Ballhandling 3 · Defense 2 · Athleticism 3 · IQ 2 — solid starting point for spring.",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tm_15",
    playerId: "player_malik",
    type: "milestone",
    date: "2026-03-07",
    title: "Ballhandling Level Up: 3 → 4",
    description: "Malik's handle in traffic improved measurably over six weeks of focused ball skill work.",
    skill: "Ballhandling",
    icon: "⬆️",
    significance: "high",
    coachNote: "His change-of-pace is now legit. Defenders are having to respect his pull-up which opens driving lanes.",
  },
  {
    id: "tm_16",
    playerId: "player_malik",
    type: "film",
    date: "2026-03-21",
    title: "Film Submitted: Pick-and-Roll Reads",
    description: "Submitted highlight reel of pick-and-roll reads from the recent scrimmage showing improved decision-making.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tm_17",
    playerId: "player_malik",
    type: "idp_goal",
    date: "2026-04-03",
    title: "IDP Goal Completed: On-Ball Defense",
    description: "Coach certified that Malik's on-ball stance and lateral quickness drill scores meet the target threshold.",
    skill: "Defense",
    icon: "✅",
    significance: "high",
    coachNote: "Defense is no longer a liability. He is active hands, good stance, and fighting through screens.",
  },
  {
    id: "tm_18",
    playerId: "player_malik",
    type: "achievement",
    date: "2026-04-19",
    title: "Biggest Skill Delta in 17U — Spring 2026",
    description: "Mid-season data confirmed Malik has the highest total skill level improvement in the 17U group this spring.",
    icon: "📈",
    significance: "high",
    coachNote: "Two seasons of elite effort compounding. This is what development looks like.",
  },
];

const brandonTimeline: TimelineEvent[] = [
  {
    id: "tb_1",
    playerId: "player_brandon",
    type: "season_start",
    date: "2025-09-08",
    title: "Fall 2025 Season Begins",
    description: "Brandon joins the 15U program as a returning player with a focus on expanding his offensive game.",
    icon: "🏀",
    significance: "high",
    coachNote: "Physical upside is real. Needs to develop the mid-range and improve conditioning consistency.",
  },
  {
    id: "tb_2",
    playerId: "player_brandon",
    type: "assessment",
    date: "2025-09-12",
    title: "Baseline Assessment Completed",
    description: "Shooting 2 · Post 3 · Rebounding 3 · Defense 3 · Athleticism 2 · IQ 3",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tb_3",
    playerId: "player_brandon",
    type: "observation",
    date: "2025-10-05",
    title: "Coach Observation: Attendance Flag",
    description: "Coach flagged inconsistent attendance in October — 3 unexcused absences in the first five weeks.",
    icon: "👁️",
    significance: "normal",
    coachNote: "Talked to Brandon and his parents. Scheduling conflict with school schedule. Getting it sorted.",
  },
  {
    id: "tb_4",
    playerId: "player_brandon",
    type: "film",
    date: "2025-10-22",
    title: "Film Submitted: Post Entry Footwork",
    description: "Submitted 4 clips of post entry catches with pivot work as assigned.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tb_5",
    playerId: "player_brandon",
    type: "assessment",
    date: "2025-11-03",
    title: "Mid-Season Assessment Completed",
    description: "Post 3 · Rebounding 3 · Defense 3 — steady progress despite attendance challenges.",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tb_6",
    playerId: "player_brandon",
    type: "idp_goal",
    date: "2025-11-18",
    title: "IDP Goal Completed: Short-Corner Mid-Range",
    description: "Brandon hit 70% from the short corner over 30 tracked attempts. Goal certified.",
    skill: "Shooting",
    icon: "✅",
    significance: "high",
    coachNote: "This is exactly what we needed from him. That short corner shot will be a weapon at the next level.",
  },
  {
    id: "tb_7",
    playerId: "player_brandon",
    type: "season_end",
    date: "2025-12-20",
    title: "Fall 2025 Season Complete",
    description: "Season concluded with 71% WOD completion and 82% attendance. 2 of 3 IDP goals completed.",
    icon: "🔒",
    significance: "normal",
  },
  {
    id: "tb_8",
    playerId: "player_brandon",
    type: "season_start",
    date: "2026-02-02",
    title: "Spring 2026 Season Begins",
    description: "Brandon enters spring with full commitment — new attendance record through the first 4 weeks.",
    icon: "🏀",
    significance: "high",
    coachNote: "Different energy from day one. He is locked in. I expect a big spring from him.",
  },
  {
    id: "tb_9",
    playerId: "player_brandon",
    type: "assessment",
    date: "2026-02-10",
    title: "Baseline Assessment Completed",
    description: "Shooting 2 · Post 3 · Rebounding 3 · Defense 3 · Athleticism 2 · IQ 3",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tb_10",
    playerId: "player_brandon",
    type: "milestone",
    date: "2026-03-02",
    title: "Rebounding Level Up: 3 → 4",
    description: "Brandon's positioning and box-out technique has improved to an elite standard for 15U.",
    skill: "Rebounding",
    icon: "⬆️",
    significance: "high",
    coachNote: "He is out-rebounding kids two years older in our scrimmages. Technique is sound.",
  },
  {
    id: "tb_11",
    playerId: "player_brandon",
    type: "film",
    date: "2026-03-15",
    title: "Film Submitted: Defensive Positioning",
    description: "Submitted clips showing defensive block positioning on the weak side over 3 scrimmage plays.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tb_12",
    playerId: "player_brandon",
    type: "milestone",
    date: "2026-03-28",
    title: "Post Level Up: 3 → 4",
    description: "Brandon's post game has expanded to include a reliable drop-step and a counter to double teams.",
    skill: "Post",
    icon: "⬆️",
    significance: "high",
    coachNote: "Reading the double team on the block is college-level for 15U. He is absorbing the coaching.",
  },
  {
    id: "tb_13",
    playerId: "player_brandon",
    type: "idp_goal",
    date: "2026-04-10",
    title: "IDP Goal Completed: Help-Side Defense",
    description: "Brandon's help rotations have been consistently correct in 10 consecutive coach observations.",
    skill: "Defense",
    icon: "✅",
    significance: "high",
    coachNote: "He is becoming a defensive anchor. Knows where to be before the ball gets there.",
  },
  {
    id: "tb_14",
    playerId: "player_brandon",
    type: "achievement",
    date: "2026-05-02",
    title: "Most Improved Player — Spring 2026 15U",
    description: "Brandon was recognized as the most improved player in the 15U group based on skill delta data.",
    icon: "🏆",
    significance: "high",
    coachNote: "His transformation from fall to spring is the story of the season. Full commitment pays off.",
  },
  {
    id: "tb_15",
    playerId: "player_brandon",
    type: "observation",
    date: "2026-05-12",
    title: "Coach Observation: Leadership Growth",
    description: "Brandon is now mentoring younger players in the program during shared practice time.",
    icon: "👁️",
    significance: "normal",
    coachNote: "Giving back what he received. This is what program culture looks like.",
  },
];

const jaylenTimeline: TimelineEvent[] = [
  {
    id: "tj_1",
    playerId: "player_jaylen",
    type: "season_start",
    date: "2025-09-08",
    title: "Fall 2025 Season Begins",
    description: "Jaylen enters the 17U program as an experienced guard with natural playmaking ability.",
    icon: "🏀",
    significance: "high",
    coachNote: "Best passer I have seen at this age in a long time. IQ is sky-high. Just needs defensive buy-in.",
  },
  {
    id: "tj_2",
    playerId: "player_jaylen",
    type: "assessment",
    date: "2025-09-10",
    title: "Baseline Assessment Completed",
    description: "Shooting 3 · Ballhandling 3 · Passing 3 · Defense 2 · Athleticism 3 · IQ 3",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tj_3",
    playerId: "player_jaylen",
    type: "film",
    date: "2025-09-30",
    title: "Film Submitted: Pick-and-Roll Vision",
    description: "Jaylen submitted 5 clips of pick-and-roll reads from practice, showing excellent timing on the slip.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tj_4",
    playerId: "player_jaylen",
    type: "milestone",
    date: "2025-10-15",
    title: "Passing Level Up: 3 → 4",
    description: "Jaylen's vision and timing on skip passes and pocket passes upgraded after sustained elite play.",
    skill: "Passing",
    icon: "⬆️",
    significance: "high",
    coachNote: "There is nothing more to teach him at this level. He needs competition to keep growing.",
  },
  {
    id: "tj_5",
    playerId: "player_jaylen",
    type: "observation",
    date: "2025-10-27",
    title: "Coach Observation: Defensive Effort",
    description: "Coach flagged that Jaylen's defensive intensity drops in the second half of practice.",
    icon: "👁️",
    significance: "normal",
    coachNote: "Had a direct conversation with him. He acknowledges it. Will address in next IDP cycle.",
  },
  {
    id: "tj_6",
    playerId: "player_jaylen",
    type: "assessment",
    date: "2025-11-05",
    title: "Mid-Season Assessment Completed",
    description: "Passing 4 · Shooting 3 · IQ 3 — offense tracking well, defense still below expectations.",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tj_7",
    playerId: "player_jaylen",
    type: "idp_goal",
    date: "2025-11-22",
    title: "IDP Goal Completed: Off-Screen Shooting",
    description: "Hit the target of 65% on catch-and-shoot off screens in drills over 4 consecutive sessions.",
    skill: "Shooting",
    icon: "✅",
    significance: "high",
    coachNote: "Legitimate shooter now. Teams will have to respect this and it opens his whole passing game.",
  },
  {
    id: "tj_8",
    playerId: "player_jaylen",
    type: "film",
    date: "2025-12-01",
    title: "Film Submitted: Defensive Closeout Drill",
    description: "Submitted 3 clips of closeout technique in practice to support the defensive IDP goal.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tj_9",
    playerId: "player_jaylen",
    type: "season_end",
    date: "2025-12-20",
    title: "Fall 2025 Season Complete",
    description: "Season concluded with 83% WOD completion and 91% attendance. 3 of 4 IDP goals completed.",
    icon: "🔒",
    significance: "normal",
  },
  {
    id: "tj_10",
    playerId: "player_jaylen",
    type: "season_start",
    date: "2026-02-02",
    title: "Spring 2026 Season Begins",
    description: "Jaylen enters spring with a clear mission: complete all 4 IDP goals — first in program history.",
    icon: "🏀",
    significance: "high",
    coachNote: "He told me his goal before I could tell him mine. That is the player I want.",
  },
  {
    id: "tj_11",
    playerId: "player_jaylen",
    type: "assessment",
    date: "2026-02-08",
    title: "Baseline Assessment Completed",
    description: "Shooting 3 · Ballhandling 3 · Passing 4 · Defense 2 · Athleticism 3 · IQ 3 — strong starting point.",
    icon: "📋",
    significance: "normal",
  },
  {
    id: "tj_12",
    playerId: "player_jaylen",
    type: "milestone",
    date: "2026-02-28",
    title: "Shooting Level Up: 3 → 4",
    description: "Shooting has become a genuine weapon. Pull-up off the dribble is consistent over 20+ attempts.",
    skill: "Shooting",
    icon: "⬆️",
    significance: "high",
    coachNote: "Elite point guards make shots AND passes. He is becoming both.",
  },
  {
    id: "tj_13",
    playerId: "player_jaylen",
    type: "idp_goal",
    date: "2026-03-20",
    title: "IDP Goal Completed: On-Ball Defense",
    description: "Jaylen logged 15 consecutive practices with high-effort defensive ratings from coaching staff.",
    skill: "Defense",
    icon: "✅",
    significance: "high",
    coachNote: "The motor is fully on now. He has become disruptive on defense — not just present.",
  },
  {
    id: "tj_14",
    playerId: "player_jaylen",
    type: "film",
    date: "2026-04-04",
    title: "Film Submitted: Full-Game Breakdown",
    description: "Submitted a full-game self-analysis highlighting 6 key possessions — offense and defense.",
    icon: "🎬",
    significance: "normal",
  },
  {
    id: "tj_15",
    playerId: "player_jaylen",
    type: "idp_goal",
    date: "2026-04-18",
    title: "IDP Goal Completed: IQ in Transition",
    description: "Jaylen's decision-making in transition offense upgraded — correct reads on 90% of tracked possessions.",
    skill: "IQ",
    icon: "✅",
    significance: "high",
    coachNote: "He is never in a hurry. He plays the next two possessions ahead. Division 1 feel.",
  },
  {
    id: "tj_16",
    playerId: "player_jaylen",
    type: "milestone",
    date: "2026-05-03",
    title: "Passing Level Up: 4 → 5",
    description: "Passing upgraded to level 5 — the highest rating in the current program. Unprecedented for a 17U player.",
    skill: "Passing",
    icon: "⬆️",
    significance: "high",
    coachNote: "Level 5 is reserved for truly elite skills. He has earned it. I don't give this out lightly.",
  },
  {
    id: "tj_17",
    playerId: "player_jaylen",
    type: "achievement",
    date: "2026-05-10",
    title: "All 4 IDP Goals Completed — First in Program History",
    description: "Jaylen became the first player in Texas Elite history to complete all four IDP goals in a single season.",
    icon: "🌟",
    significance: "high",
    coachNote: "Historic. This is the standard I want every player in this program chasing. He showed what is possible.",
  },
];

export const playerTimelines: Record<string, TimelineEvent[]> = {
  player_malik: malikTimeline,
  player_brandon: brandonTimeline,
  player_jaylen: jaylenTimeline,
};

/* -------------------------------------------------------------------------- */
/* Utility functions                                                           */
/* -------------------------------------------------------------------------- */

export function getPlayerTimeline(playerId: string): TimelineEvent[] {
  return playerTimelines[playerId] ?? [];
}

export function getPlayerSeasonArc(playerId: string): PlayerSeasonArc | undefined {
  return playerSeasonArcs.find((arc) => arc.playerId === playerId);
}

export function getCurrentSeason(): Season {
  return currentSeason;
}

export type SeasonComparison = {
  seasonA: Season;
  seasonB: Season;
  deltas: {
    avgSkillDelta: number;
    avgWodCompletion: number;
    idpCompletionRate: number;
    playerRetentionRate: number;
    avgAttendance: number;
  };
  summary: string;
};

export function getSeasonYearOverYear(seasonId1: string, seasonId2: string): SeasonComparison | null {
  const a = seasons.find((s) => s.id === seasonId1);
  const b = seasons.find((s) => s.id === seasonId2);
  if (!a || !b) return null;

  const idpA = a.stats.idpGoalsTotal > 0 ? a.stats.idpGoalsCompleted / a.stats.idpGoalsTotal : 0;
  const idpB = b.stats.idpGoalsTotal > 0 ? b.stats.idpGoalsCompleted / b.stats.idpGoalsTotal : 0;

  const skillDiff = Math.round((b.stats.avgSkillDelta - a.stats.avgSkillDelta) * 100);
  const wodDiff   = Math.round((b.stats.avgWodCompletion - a.stats.avgWodCompletion) * 100);

  let summary = `${b.name} is tracking comparably to ${a.name}.`;
  if (skillDiff > 0 && wodDiff > 0) {
    summary = `${b.name} is tracking ${skillDiff > 10 ? "significantly" : ""} better than ${a.name} at the same point in the season — skill development and WOD completion are both up.`;
  } else if (skillDiff < 0) {
    summary = `${a.name} had a stronger skill development trajectory than ${b.name} at this point.`;
  }

  return {
    seasonA: a,
    seasonB: b,
    deltas: {
      avgSkillDelta:       b.stats.avgSkillDelta - a.stats.avgSkillDelta,
      avgWodCompletion:    b.stats.avgWodCompletion - a.stats.avgWodCompletion,
      idpCompletionRate:   idpB - idpA,
      playerRetentionRate: b.stats.playerRetentionRate - a.stats.playerRetentionRate,
      avgAttendance:       b.stats.avgAttendance - a.stats.avgAttendance,
    },
    summary,
  };
}
