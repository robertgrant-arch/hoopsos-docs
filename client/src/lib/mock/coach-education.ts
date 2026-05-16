/**
 * Coach Education Hub — mock data foundation.
 *
 * Structured learning paths for the HoopsOS Coach Education system.
 * Three progressive paths (Foundation → Development → Elite) with
 * modular, platform-integrated learning experiences.
 *
 * Used by:
 *   CoachEducationHub  (/app/coach/education)
 *   LearningPathPage   (/app/coach/education/paths, /app/coach/education/module/:id)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CoachLevel = "foundation" | "development" | "elite";

export type ModuleStatus = "locked" | "not_started" | "in_progress" | "complete";

export type DeliverableType =
  | "cue_save"
  | "idp_update"
  | "film_annotation"
  | "practice_plan_save"
  | "peer_review"
  | "reflection"
  | "observation_log";

export type ModuleSection = {
  /** Optional id — used by older page files */
  id?: string;
  type: "frame" | "concept" | "examine" | "apply" | "reflect";
  title: string;
  content: string;
  /** Legacy alias for content — used by older page files */
  body?: string;
  estimatedMinutes: number;
  actionPrompt?: string;
  /** Legacy alias for actionPrompt — used by older page files */
  platformAction?: string;
  actionHref?: string;
};

export type Module = {
  id: string;
  path: CoachLevel;
  /** Alias for path — used by legacy page files */
  pathId?: CoachLevel;
  domain: string;
  /** Alias for domain — used by legacy page files. Always equals domain. */
  category: string;
  title: string;
  subtitle: string;
  description: string;
  /** Sort order within path — used by legacy page files */
  order?: number;
  estimatedMinutes: number;
  sections: ModuleSection[];
  deliverableType: DeliverableType;
  deliverablePrompt: string;
  /** Legacy alias for deliverablePrompt — used by older page files */
  platformDeliverable?: string;
  deliverableHref: string;
  status: ModuleStatus;
  completedAt?: string;
  deliverableCompleted: boolean;
  prerequisiteIds: string[];
};

export type PathData = {
  level: CoachLevel;
  title: string;
  subtitle: string;
  description: string;
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  completionGate: string[];
  modules: Module[];
};

/**
 * LearningPath — unified type compatible with both the spec types and
 * the legacy page files (id: string, level: 1|2|3, credentialTitle).
 */
export type LearningPath = {
  id: string;
  level: 1 | 2 | 3;
  coachLevel: CoachLevel;
  title: string;
  subtitle: string;
  description: string;
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  completionGate: string[];
  credentialTitle: string;
  modules: Module[];
};

export type ContextualTrigger = {
  id: string;
  condition: string;
  moduleId: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  dismissible: boolean;
};

export type CoachingJournalEntry = {
  id: string;
  moduleId: string;
  moduleName: string;
  prompt: string;
  response: string;
  createdAt: string;
};

export type CredentialRequirement = {
  id: string;
  label: string;
  description: string;
  type: "behavior" | "module" | "peer_review" | "deliverable";
  target: string;
  currentValue?: string;
  met: boolean;
};

export type Credential = {
  level: CoachLevel;
  title: string;
  description: string;
  requirements: CredentialRequirement[];
  earned: boolean;
  earnedAt?: string;
  progress: number;
  unlocksNextPath: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Path — 9 Modules (full content)
// ─────────────────────────────────────────────────────────────────────────────

export const foundationPath: LearningPath = {
  id: "foundation",
  level: 1,
  coachLevel: "foundation",
  title: "Foundation Path",
  subtitle: "Build the core systems every effective basketball coach needs.",
  description:
    "Nine focused modules covering the essential disciplines of player development — from writing goals that actually change behavior to communicating with parents under pressure. Each module connects directly to your work inside HoopsOS.",
  credentialTitle: "HoopsOS Foundation Certificate",
  totalModules: 9,
  completedModules: 2,
  estimatedHours: 4.5,
  completionGate: [
    "All 9 modules marked complete",
    "At least 6 deliverables submitted",
    "Coaching journal has at least 5 entries",
    "All active players have IDPs with milestones",
    "At least 3 film review sessions with timestamp annotations",
  ],
  modules: [
    // ── Module 1 ────────────────────────────────────────────────────────────
    {
      id: "fm_01_idp",
      path: "foundation",
      pathId: "foundation",
      category: "Player Development Planning",
      domain: "Player Development Planning",
      title: "Writing IDPs That Actually Change Player Behavior",
      subtitle: "Why most goals fail — and the 3-part formula that doesn't",
      description:
        "Most coaches write IDP goals that sound good but drive no real change. This module shows you why vague goals stall players and teaches the behavior + condition + standard formula that creates measurable development.",
      estimatedMinutes: 22,
      status: "complete",
      completedAt: "2025-05-10T09:14:00Z",
      deliverableCompleted: true,
      prerequisiteIds: [],
      deliverableType: "idp_update",
      deliverablePrompt:
        "Update one player's IDP with a goal written using the behavior + condition + standard formula. Add at least two milestones with target dates.",
      deliverableHref: "/app/coach/idp",
      sections: [
        {
          type: "frame",
          title: "The IDP That Collects Dust",
          estimatedMinutes: 3,
          content:
            "Picture your roster right now. How many players have an IDP? How many of those IDPs have been opened in the last two weeks — by the player, not just you?\n\nMost coaches have experienced the same quiet frustration: they spend an hour building a thoughtful development plan in pre-season, and by week four, nobody's looking at it. Not the player. Not the parents. Sometimes not even the coach.\n\nThis isn't a motivation problem. It's a goal design problem.\n\nIDPs fail for one of three reasons. First, the goals are too vague to evaluate — 'improve your handle' means different things to everyone in the gym. Second, there's no milestone structure, so the first checkpoint is 'did it work?' at season's end, which is too late to course-correct. Third, the goal lives in a form, not in a conversation — the player never internalized it as their own.\n\nThis module gives you the framework to fix all three.",
        },
        {
          type: "concept",
          title: "The 3-Part Goal Formula",
          estimatedMinutes: 6,
          content:
            "The most effective athletic development goals share a common structure: they name a specific behavior, describe the condition under which it should happen, and define the standard that proves success.\n\n**Behavior** — What exactly will the player do differently? Not a trait ('be more aggressive') but an observable action ('attack the closeout with a speed dribble when the defender's feet are set').\n\n**Condition** — In what context does this need to happen? In practice? In games? Under pressure? Against zone? This specificity transforms a general goal into one the player can mentally rehearse.\n\n**Standard** — How will both of you know it's working? This doesn't have to be a stat. It can be a frequency ('3 of 5 reps in the live drill'), a coach observation ('no full-stop pivots in the post-up game'), or a milestone event.\n\nHere's the difference in practice:\n\n> Weak: 'Get better at finishing.'\n> Strong: 'Finish through contact with either hand (behavior) on a drive from the wing when a help defender is present (condition) at a rate of 4 of 6 attempts in the Thursday contact drill by January 20 (standard).'\n\nThe strong version doesn't just evaluate better — it coaches better. The player knows what to work on in the driveway. You know what to design into your drills.\n\nMilestone sequencing matters too. Break every IDP goal into three checkpoints: an early indicator (2–3 weeks), a midpoint check (6–8 weeks), and a completion marker. Early indicators are your early warning system. If a player isn't hitting week-three markers, you have time to adjust — not at season's end.",
        },
        {
          type: "examine",
          title: "What Your IDP Data Shows",
          estimatedMinutes: 4,
          content:
            "Coaches who adopt the 3-part formula see measurable differences in player outcomes within one season. In HoopsOS usage data, IDPs with milestone dates are completed or meaningfully progressed 68% more often than open-ended goals. Players with two or more milestones per goal engage with their IDPs 3× more frequently.\n\nThe most common failure point isn't the goal itself — it's the absence of a first milestone within the first 21 days. When there's no early check-in point, both coach and player mentally defer the plan until 'later,' which often means never.\n\nLook at your current roster: how many active IDP goals have a milestone marked in the next 30 days? That number tells you more about IDP health than completion percentages.",
        },
        {
          type: "apply",
          title: "Update One Player's IDP Now",
          estimatedMinutes: 7,
          content:
            "Open your IDP dashboard and choose one player — ideally someone you've observed closely in the last two weeks. Find a goal that currently reads as vague and rewrite it using the 3-part formula.\n\nWrite the behavior specifically enough that a substitute coach would know exactly what to watch for. Define the condition so it maps to situations that actually occur in your system. Set a standard the player themselves could evaluate.\n\nThen add two milestones: one due within 21 days (the early indicator), one at the six-week mark. Attach a target date to each.",
          actionPrompt:
            "Open the IDP tool, rewrite one goal using behavior + condition + standard, and add two milestones with target dates.",
          actionHref: "/app/coach/idp",
        },
        {
          type: "reflect",
          title: "Your Development Philosophy",
          estimatedMinutes: 2,
          content:
            "Think about the player you just updated — or a player you've coached who made a meaningful developmental leap. What made the difference? Was it the right goal, the right moment, the right level of specificity?\n\nWhat does this module change about how you'll write goals going forward? And which player on your current roster needs this kind of goal-clarity most urgently?",
        },
      ],
    },

    // ── Module 2 ────────────────────────────────────────────────────────────
    {
      id: "fm_02_practice",
      path: "foundation",
      pathId: "foundation",
      category: "Practice Design",
      domain: "Practice Design",
      title: "The 4-Block Practice Structure",
      subtitle: "Why order matters more than content in practice design",
      description:
        "A well-ordered practice teaches faster than the same content in the wrong sequence. This module teaches the four-block framework and shows you why each block serves a distinct cognitive and physical purpose.",
      estimatedMinutes: 25,
      status: "complete",
      completedAt: "2025-05-12T11:30:00Z",
      deliverableCompleted: true,
      prerequisiteIds: [],
      deliverableType: "practice_plan_save",
      deliverablePrompt:
        "Build a complete practice plan using the 4-block structure. All four blocks must be present with estimated times and at least one drill per block.",
      deliverableHref: "/app/coach/practice",
      sections: [
        {
          type: "frame",
          title: "The Practice That Wastes Its Own Best Minutes",
          estimatedMinutes: 3,
          content:
            "Most coaches plan practices by listing drills they want to run. They sequence by gut feel — start with something easy, build to the hard stuff, condition at the end. This logic isn't wrong, but it's incomplete.\n\nThe most common practice design mistake isn't wasted time — it's missequenced time. A coach runs a complex offensive scheme in the first 20 minutes when players are physically and neurologically cold. Then they hammer ball-handling drills in minute 50 when attention and glycogen are both depleted. The content was fine. The order cost them.\n\nThe 4-block framework isn't a rigid formula. It's a cognitive map. Each block exists because players' bodies and brains are ready for different kinds of learning at different points in a session.",
        },
        {
          type: "concept",
          title: "The Four Blocks and Why Each Exists",
          estimatedMinutes: 8,
          content:
            "**Block 1 — Warm-Up (10–15% of total time)**\nPhysical activation, but also cognitive activation. The best warm-up segments don't just elevate heart rate — they establish the day's focal point. If today's theme is ball pressure defense, your warm-up should include movement patterns that mirror defensive positioning. Give players a cue or concept in warm-up that you'll reinforce in every subsequent block.\n\n**Block 2 — Skill Development (30–40% of total time)**\nThis is the learning block. Players are physically ready but not yet fatigued. Cognitive load is highest here. This is where you introduce or refine a skill in a controlled, lower-stakes environment. Repetition volume matters here. Error correction should be immediate and specific — this is your highest-feedback window.\n\n**Block 3 — Competitive Application (35–45% of total time)**\nNow players apply what they just practiced under game-like resistance. 3v3 defense, half-court 5v5, situational play. This block reveals whether the skill developed in Block 2 is transferring. If it's not, that's diagnostic information — you adjust the Block 2 work next practice.\n\n**Block 4 — Conditioning + Closure (10–15% of total time)**\nConditioning when players are already tired mirrors the late-game demands of real competition. Close every practice with a ritual: a word from a player leader, a stat from the day, the one thing you're taking into game prep.",
        },
        {
          type: "examine",
          title: "How Your Practice Time Is Allocated",
          estimatedMinutes: 4,
          content:
            "Pull up your last three saved practice plans. How much time was allocated to each type of work? Most coaches, when they map this honestly, find that Block 2 (skill development) is either over-weighted — leaving Block 3 short — or under-weighted in favor of scrimmage time.\n\nNeither extreme is wrong in context. But the absence of intentional Block 3 time is the most common cause of skills that look good in drills but disappear in games. The transfer problem is a practice design problem.\n\nThe 4-block structure isn't about rigidity. It's about intention. Every minute should have a reason.",
        },
        {
          type: "apply",
          title: "Build a Practice Plan Using the 4-Block Structure",
          estimatedMinutes: 8,
          content:
            "Open the Practice Plan Builder and create your next practice session using the 4-block structure. Each block should have: a time allocation, a primary drill or activity, and a one-line coaching focus.\n\nBefore you save, check: Is your theme visible in every block? Does Block 2 directly prepare players for what they'll face in Block 3? Is conditioning honest — actual work, not a cooldown lap?\n\nSave the plan and it will count toward your credential deliverable.",
          actionPrompt:
            "Build a full practice plan with all four blocks labeled and timed. Include at least one drill per block and a session theme.",
          actionHref: "/app/coach/practice",
        },
        {
          type: "reflect",
          title: "Your Best Practice",
          estimatedMinutes: 2,
          content:
            "Think about the best practice session you've ever run — the one where players were engaged start to finish and left with something real. Was it the content, or was it the structure? How did the session flow?\n\nNow think about one upcoming practice where you've been tempted to wing it. What would change if you committed to the 4-block structure for that session specifically?",
        },
      ],
    },

    // ── Module 3 ────────────────────────────────────────────────────────────
    {
      id: "fm_03_cues",
      path: "foundation",
      pathId: "foundation",
      category: "Teaching & Cueing",
      domain: "Teaching & Cueing",
      title: "The 3-Cue Rule",
      subtitle: "Why giving 5 cues kills learning — and how to pick the right 1–3",
      description:
        "Coaches who give too many instructions during a drill don't help players — they freeze them. This module teaches the cognitive science behind cue selection and gives you a repeatable system for identifying the highest-leverage cues for any skill.",
      estimatedMinutes: 20,
      status: "in_progress",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_02_practice"],
      deliverableType: "cue_save",
      deliverablePrompt:
        "Save 3 cues to your Cue Library for a drill you use at least weekly. Each cue should target a different skill element and be worded in player-facing language.",
      deliverableHref: "/app/coach/cues",
      sections: [
        {
          type: "frame",
          title: "The Paralysis You're Accidentally Creating",
          estimatedMinutes: 2,
          content:
            "You've seen it. A player is mid-drill, and you call out: 'Stay low, eyes up, right hand, drive your shoulder, don't reach!' The player's body stiffens. The dribble gets tentative. The error you were trying to prevent happens anyway — because you overloaded the system.\n\nHuman working memory holds approximately 3–5 chunks of information at a time. When a player is executing a physical skill under any kind of time or competitive pressure, that number drops. One well-chosen cue, delivered clearly, does more than five technically correct ones.\n\nThe 3-cue rule isn't about dumbing things down. It's about coaching at the level where the brain can actually act on the instruction.",
        },
        {
          type: "concept",
          title: "Selecting the Right Cue at the Right Moment",
          estimatedMinutes: 7,
          content:
            "Not all cues are equal. The best cues share three characteristics: they are specific to an observable action, they are expressed in player-facing language (what to do, not what not to do), and they address the highest-leverage point in the skill chain.\n\n**The skill chain principle**: Most complex basketball skills have a chain of 4–6 sequential actions. A cue hits highest when it targets the first breakdown in the chain — the root error, not the symptom.\n\n**External vs. internal cues**: Research consistently shows that external cues (focused on the environment or an object) outperform internal cues (focused on body parts) for motor learning. 'Finish toward the square' outperforms 'extend your arm.' 'Get your hip past the defender's hip' outperforms 'lean in.'\n\n**Cueing timing windows**: Different moments in a drill require different cue types:\n- Before the rep: technical setup cues ('hips low before you catch')\n- During the rep: attentional cues only ('square')\n- After the rep: diagnostic cues ('you rushed the footwork — try again')\n\nSelect your max three cues before the drill starts. Commit to them. If you find yourself adding a fourth in the moment, it means you haven't identified your highest-leverage point yet.",
        },
        {
          type: "examine",
          title: "Your Cueing Patterns",
          estimatedMinutes: 3,
          content:
            "Think about the last time you ran a drill you use regularly — the crossover, the closeout, the post seal. How many distinct cues did you give across the drill?\n\nCoaches who have never cataloged their cues often discover they give 7–10 distinct instructions in a 15-minute drill block. Even if each cue is individually correct, the cumulative load overwhelms retention. The players who got better that day probably self-selected which cue to act on — which may not have been the most important one.\n\nYour cue library in HoopsOS is designed to force this selection up front. Three cues per drill, saved before the session, means you've done the cognitive work of prioritization before you're standing on the court.",
        },
        {
          type: "apply",
          title: "Build Your Cue Library for One Drill",
          estimatedMinutes: 6,
          content:
            "Choose a drill you run at least once a week. Open the Cue Library and create entries for exactly three cues for that drill.\n\nFor each cue, write:\n1. The cue phrase itself — player-facing, action-oriented, 5 words or fewer\n2. When to deliver it (before, during, or after the rep)\n3. The error it corrects\n\nAfter saving all three, review them together. Do they cover the full skill chain without overlapping? Is any cue addressing a symptom rather than a root cause? If yes, revise before saving.",
          actionPrompt:
            "Open the Cue Library and save 3 cues for one of your weekly drills. Each cue should be 5 words or fewer and worded from the player's perspective.",
          actionHref: "/app/coach/cues",
        },
        {
          type: "reflect",
          title: "The Cue You'll Never Stop Using",
          estimatedMinutes: 2,
          content:
            "Every coach has a cue that just works — one they've used for years because players respond to it faster than anything else. What is yours? Why do you think it works?\n\nNow: what's a skill in your system that you've never fully curated cues for? What would change about how you teach that skill if you went through the selection process this module describes?",
        },
      ],
    },

    // ── Module 4 ────────────────────────────────────────────────────────────
    {
      id: "fm_04_film",
      path: "foundation",
      pathId: "foundation",
      category: "Film Feedback",
      domain: "Film Feedback",
      title: "Timestamp Film Feedback",
      subtitle: "Why timestamp notes have 3× more impact — and what to look for first",
      description:
        "General film feedback gets ignored. Timestamp annotations — specific moments with specific context — get replayed. This module teaches you to observe film the way players learn from it.",
      estimatedMinutes: 22,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_01_idp"],
      deliverableType: "film_annotation",
      deliverablePrompt:
        "Review one pending film submission and add at least 3 timestamp annotations. At least one should be positive, one developmental, and one connected to an IDP goal.",
      deliverableHref: "/app/coach/film",
      sections: [
        {
          type: "frame",
          title: "The Film Review No One Watched",
          estimatedMinutes: 2,
          content:
            "A player uploads their shooting session. You write: 'Good effort — footwork needs work, keep the elbow in.' The player reads it, nods, uploads next week's video, gets the same feedback.\n\nNow imagine the same player gets this instead: '0:34 — Right here, your plant foot is 45 degrees open before the catch. That's why the release is right of center. 1:12 — Watch this rep. Your elbow came in and the ball went straight. That's the feeling to chase.'\n\nThe second coach didn't work harder. They worked differently. They made the film interactive — something the player watches with a purpose, rewinding to specific moments, connecting visual proof to felt sensation. That's film feedback that transfers.",
        },
        {
          type: "concept",
          title: "The Anatomy of a High-Value Timestamp Note",
          estimatedMinutes: 7,
          content:
            "Effective timestamp annotations do three things: they anchor the observation to an exact moment, they name the observable behavior (not the outcome — the cause), and they connect to something the player already knows is important.\n\n**The first 60 seconds rule**: When reviewing any player upload, watch the first 60 seconds before adding any note. This forces you to observe before you react. Coaches who annotate too early often note the most visible error rather than the most important one.\n\n**Positive-developmental-IDP balance**: Every film review should contain at least one timestamp showing the player doing something right. The brain learns patterns through contrast — 'this is the feeling you want' — not just through error correction.\n\nThe IDP connection is the highest-leverage annotation you can make. When a player sees their own film and reads 'this is the exact situation your IDP goal is about,' the goal becomes real in a way that no conversation achieves.\n\n**Language patterns that land**:\n- Lead with the timestamp and a very short framing word: '1:22 — Here'\n- Describe what you see, not what it means: 'your back foot is behind your front knee'\n- If corrective, give one action: 'plant the back foot parallel'\n- If positive, name the mechanism: 'elbow stayed in — that's why this one dropped'",
        },
        {
          type: "examine",
          title: "Your Current Film Queue",
          estimatedMinutes: 4,
          content:
            "Film reviews that sit in a queue for more than 72 hours see a significant drop in player engagement when they do get reviewed — the player has moved on mentally. Speed of feedback matters almost as much as quality.\n\nIn your current queue, how many submissions have zero annotations? How many reviews are you writing without timestamps? Those two metrics tell you where your film feedback system has gaps.\n\nCoaches who adopt timestamp-first reviewing typically cut their average annotation time — not because they're doing less, but because the timestamp forces them to identify one specific moment rather than write general impressions that require more words to say less.",
        },
        {
          type: "apply",
          title: "Review One Film Submission With Timestamps",
          estimatedMinutes: 7,
          content:
            "Open your film queue and select the oldest pending submission. Before adding any note, watch the first 60 seconds completely.\n\nThen add three timestamp annotations:\n1. One positive — something the player is doing right that they should know is right\n2. One developmental — a specific, observable error with one corrective action\n3. One IDP-connected — find a moment that directly relates to a goal in this player's active IDP, and call that connection out by name\n\nDo not add a fourth annotation for this exercise. Three specific timestamps beat six general ones.",
          actionPrompt:
            "Open your film queue, pick the oldest pending review, and add 3 timestamp annotations — one positive, one developmental, one IDP-connected.",
          actionHref: "/app/coach/film",
        },
        {
          type: "reflect",
          title: "What Film Reveals That Practice Doesn't",
          estimatedMinutes: 2,
          content:
            "Think about a player you've coached whose development stalled despite consistent practice. Did you ever review film with them — not for them, with them? What would you have seen if you had?\n\nFilm is the one place where the player can see what you see. What does that access change about your responsibility to annotate it well?",
        },
      ],
    },

    // ── Module 5 ────────────────────────────────────────────────────────────
    {
      id: "fm_05_drills",
      path: "foundation",
      pathId: "foundation",
      category: "Drill Progression",
      domain: "Drill Progression",
      title: "Drill Progression: From Breakdown to Game Condition",
      subtitle: "How to move players up the difficulty ladder without losing skill quality",
      description:
        "A drill is just a tool — the progression is the instruction. This module teaches you to sequence drills so skills transfer from controlled reps to live competition.",
      estimatedMinutes: 20,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_02_practice"],
      deliverableType: "practice_plan_save",
      deliverablePrompt:
        "Build a 3-tier drill progression for one skill you're currently teaching. Save it to a practice plan.",
      deliverableHref: "/app/coach/practice",
      sections: [
        {
          type: "frame",
          title: "The Drill That Doesn't Transfer",
          estimatedMinutes: 2,
          content:
            "You've drilled the eurostep for three weeks. It looks clean in the breakdown drill. Then it's live 5v5 and players are still doing the old two-step drive to a contested layup. The transfer didn't happen.\n\nThis is the most common frustration in player development. Not that the skill wasn't practiced — it was. The progression was missing. The gap between 'doing it correctly in isolation' and 'doing it correctly under pressure' is a set of intermediate steps. Those steps are the progression.",
        },
        {
          type: "concept",
          title: "The Three-Tier Progression Model",
          estimatedMinutes: 7,
          content:
            "Every skill should be taught across three tiers of difficulty, each tier increasing the decision-making load and defensive resistance.\n\n**Tier 1 — Isolated**: No defense, controlled tempo, full focus on mechanics. Players should be able to describe what they're doing as they do it. Error correction is immediate and technical.\n\n**Tier 2 — Semi-Live**: Passive or token resistance. Players now have to read a cue before executing the skill — the defender's foot position, the angle of approach. Cognitive load increases; mechanical expectations stay high.\n\n**Tier 3 — Competitive Application**: Full speed, real defense, game-representative constraints. The player can no longer rely on the motor memory built in Tier 1 — they have to access it automatically.\n\nThe error coaches make is jumping from Tier 1 to Tier 3 too quickly. Players fail at Tier 3 not because the skill is too hard, but because Tier 2 wasn't developed enough to build the recognition patterns that make automatic access possible.\n\nAlways exit a Tier when the player can perform the skill at 80% success rate in that context.",
        },
        {
          type: "examine",
          title: "Where Your Progressions Break Down",
          estimatedMinutes: 3,
          content:
            "Think about the last skill you taught in a drill sequence. Did you spend meaningful time at Tier 2? Most coaches jump to Tier 3 — competitive application — because that's the most engaging for players and feels most like basketball. But if Tier 2 is thin or absent, the skill hasn't developed the decision-making pattern it needs to survive live play.\n\nThe transfer failure you see in games is usually a Tier 2 gap, not a Tier 1 gap.",
        },
        {
          type: "apply",
          title: "Design a 3-Tier Progression",
          estimatedMinutes: 6,
          content:
            "Choose a skill you're actively teaching this week. In the Practice Plan Builder, create a drill progression with three named tiers, including time allocation for each.\n\nFor each tier: name the drill, describe the resistance level and decision cue (if any), and specify one observable success marker — how you'll know it's working before moving to the next tier.\n\nSave the progression as a reusable template.",
          actionPrompt:
            "Create a 3-tier drill progression in the Practice Plan Builder with one drill per tier and success markers for each.",
          actionHref: "/app/coach/practice",
        },
        {
          type: "reflect",
          title: "The Player Who Made the Leap",
          estimatedMinutes: 2,
          content:
            "Think about a player you've coached who made a real skill leap — something that showed up in games, not just drills. What was the progression that got them there? Was it a single breakthrough moment or accumulated reps across multiple weeks?\n\nWhat does that transfer story tell you about how to design progressions for the player on your roster who's currently stuck?",
        },
      ],
    },

    // ── Module 6 ────────────────────────────────────────────────────────────
    {
      id: "fm_06_communication",
      path: "foundation",
      pathId: "foundation",
      category: "Player Communication",
      domain: "Player Communication",
      title: "Feedback That Players Actually Hear",
      subtitle: "The psychology of corrective feedback — and why timing changes everything",
      description:
        "Corrective feedback that lands in the wrong moment teaches nothing. This module covers the science of player receptivity and gives you a framework for delivering feedback that motivates rather than deflates.",
      estimatedMinutes: 18,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_01_idp"],
      deliverableType: "observation_log",
      deliverablePrompt:
        "Log one player observation using the Feedback Ledger. Note the context, the content, and how the player responded.",
      deliverableHref: "/app/coach/roster",
      sections: [
        {
          type: "frame",
          title: "The Halftime Speech That Went Nowhere",
          estimatedMinutes: 2,
          content:
            "Down eight at halftime, you delivered what felt like your best halftime speech — specific, urgent, emotionally grounded. The team came out flat in the third quarter anyway.\n\nThis isn't a content problem. The players heard you. But hearing and receiving are different neurological events. A player who is flooded with cortisol from a frustrating half processes information differently than a player in a calm 1:1 conversation three days later.\n\nFeedback that lands when a player is ready to hear it is 10× more powerful than feedback delivered at coach-optimal timing.",
        },
        {
          type: "concept",
          title: "The Four Conditions for Receivable Feedback",
          estimatedMinutes: 6,
          content:
            "Feedback is receivable when four conditions are present: psychological safety, relevance to a goal the player owns, emotional regulation in both coach and player, and a shared frame for evaluation.\n\n**Psychological safety** means the player doesn't expect feedback to come with judgment about their character or value to the program. You build this through consistent positive feedback — not empty praise, but genuine acknowledgment of what's working.\n\n**Goal ownership** means the feedback connects to something the player cares about. 'Your step-back footwork is off' lands differently when the player has an IDP goal that specifically names footwork.\n\n**Emotional regulation** is the most overlooked factor. Immediately post-game — especially after a loss — most players are in a stress response state. Feedback given in this window often doesn't form into memory.\n\n**Shared evaluation frame** means both coach and player are using the same criteria to assess the performance. This is why IDPs are developmental tools, not administrative ones.",
        },
        {
          type: "examine",
          title: "When You Give Most of Your Feedback",
          estimatedMinutes: 3,
          content:
            "Most coaches give the majority of their corrective feedback in three windows: immediately after errors in practice, at halftime, and immediately post-game. These are precisely the windows of lowest player receptivity.\n\nThe highest-receptivity windows are typically: mid-week 1:1 video review, pre-practice individual check-in, and the first five minutes of practice before competitive pressure builds. How much of your current feedback is delivered in those windows?",
        },
        {
          type: "apply",
          title: "Log a Player Observation",
          estimatedMinutes: 5,
          content:
            "After your next practice, log one observation about one player using the Observation Log. Include: what you noticed (behavior, not trait), the context (drill, scrimmage, between plays), and a note about when you plan to deliver feedback about it — and in which format.\n\nDelaying the feedback logging until after practice also helps you calibrate: was this observation still important a day later? If yes, it's worth delivering.",
          actionPrompt:
            "Log one player observation in the Roster tool — context, behavior observed, and your planned feedback timing.",
          actionHref: "/app/coach/roster",
        },
        {
          type: "reflect",
          title: "The Feedback You Wish You'd Held Back",
          estimatedMinutes: 2,
          content:
            "Think about a time you delivered corrective feedback that you could tell didn't land — maybe the player shut down, argued back, or just nodded without really hearing you. What was the context? Were the four conditions present?\n\nWhat would you do differently with that same observation now?",
        },
      ],
    },

    // ── Module 7 ────────────────────────────────────────────────────────────
    {
      id: "fm_07_agedev",
      path: "foundation",
      pathId: "foundation",
      category: "Age-Appropriate Dev",
      domain: "Age-Appropriate Dev",
      title: "Coaching the Stage, Not the Age",
      subtitle: "How developmental readiness changes everything about what you can teach",
      description:
        "A 14-year-old in early puberty and a 14-year-old post-growth-spurt are fundamentally different athletes. This module gives you the developmental lens to design training that matches physical and cognitive readiness.",
      estimatedMinutes: 24,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_01_idp", "fm_05_drills"],
      deliverableType: "idp_update",
      deliverablePrompt:
        "Review two players' IDPs and update the training focus based on their developmental stage. Add a note indicating which stage framework you applied.",
      deliverableHref: "/app/coach/idp",
      sections: [
        {
          type: "frame",
          title: "The 13-Year-Old You're Coaching Like a Senior",
          estimatedMinutes: 3,
          content:
            "You have a 13-year-old who's big, strong, and skilled. You start him in the post, design plays for him, and expect him to lead on defense. He's physically ready. But he's not cognitively ready — at 13, the prefrontal cortex is still building the connections that support complex decision-making under pressure, reading multiple defenders, and self-regulating after errors.\n\nTreating a physically mature early developer like a finished product is one of the most common and costly mistakes in youth basketball development.",
        },
        {
          type: "concept",
          title: "The Four Developmental Windows",
          estimatedMinutes: 9,
          content:
            "**Window 1 — FUNdamental (ages 6–10)**: Movement literacy is the priority. Agility, balance, coordination. Basketball-specific skills are secondary. Coaching focus: make movement joyful, build basic motor competency, never specialize.\n\n**Window 2 — Learning to Train (ages 10–14)**: This is the motor skill acquisition window. Players are neurologically primed for technical learning — footwork patterns, shooting mechanics, defensive positioning. Repetition volume matters more than competitive intensity. Specialization is still premature.\n\n**Window 3 — Training to Train (ages 14–17)**: Physical development accelerates. Players can now tolerate higher training loads and respond well to structured conditioning. Cognitive capacity for tactical understanding expands dramatically. Position specialization becomes developmentally appropriate.\n\n**Window 4 — Training to Compete (17+)**: The athlete's job becomes performance optimization and competitive durability. Training loads, recovery, mental performance, and career-level goal-setting are the coaching priorities.\n\nThe practical implication: your IDP goals and drill progressions should reflect the player's window, not their grade or skill level.",
        },
        {
          type: "examine",
          title: "Where Your Roster Actually Sits",
          estimatedMinutes: 4,
          content:
            "Look at your active roster. For each player, estimate their developmental window based on physical maturity, not age. You'll likely find that a single age group spans two or even three windows — especially at the 12–15U level.\n\nThis helps explain why players who look similar in practice perform so differently in competition. The Window 2 player who looks technically solid is running on mechanics; the Window 3 player who looks less polished may have far more adaptive capacity for game-speed reads.",
        },
        {
          type: "apply",
          title: "Update Two IDPs With a Developmental Lens",
          estimatedMinutes: 6,
          content:
            "Select two players whose IDPs you've recently written. For each, identify their developmental window. Then review the IDP goals: are they appropriate for that window?\n\nA Window 2 player shouldn't have a goal primarily about game IQ or tactical responsibility. A Window 3 player can handle goals about reading coverages, leading on defense, and managing their own preparation.\n\nUpdate the goals to reflect the window and add a coaching note documenting your reasoning.",
          actionPrompt:
            "Open the IDP tool, identify two players' developmental windows, and update their goals to match.",
          actionHref: "/app/coach/idp",
        },
        {
          type: "reflect",
          title: "The Player You've Been Misreading",
          estimatedMinutes: 2,
          content:
            "Every coach has one — a player who frustrates them because they're not responding to coaching the way you'd expect. Is it possible that player is in a different developmental window than you've assumed?\n\nWhat would change about how you work with them if you coached their stage instead of their age?",
        },
      ],
    },

    // ── Module 8 ────────────────────────────────────────────────────────────
    {
      id: "fm_08_parents",
      path: "foundation",
      pathId: "foundation",
      category: "Parent Communication",
      domain: "Parent Communication",
      title: "The Parent Conversation That Goes Sideways",
      subtitle: "A framework for high-stakes parent conversations that protect the player",
      description:
        "Parent conversations about playing time, development, and expectations are the most emotionally charged situations in youth coaching. This module gives you a repeatable framework that keeps the player's development at the center.",
      estimatedMinutes: 19,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_06_communication"],
      deliverableType: "reflection",
      deliverablePrompt:
        "Write a reflection on one challenging parent interaction you've had. Apply the EARS framework to how you would handle it now.",
      deliverableHref: "/app/coach/education/module/fm_08_parents",
      sections: [
        {
          type: "frame",
          title: "The Email at 10:47 PM",
          estimatedMinutes: 2,
          content:
            "It comes in after a tough loss. The subject line is 'Concerns about my son's role.' You've seen this email before — different parent, same emotional fingerprint. The content isn't really about playing time. It's about a parent watching their child struggle and not knowing what to do with that feeling.\n\nHow you respond — and when — will shape your relationship with that family for the rest of the season. More importantly, it will shape whether you can continue being an effective coach for their kid.",
        },
        {
          type: "concept",
          title: "The EARS Framework",
          estimatedMinutes: 7,
          content:
            "The EARS framework gives you a consistent structure for high-stakes parent conversations:\n\n**E — Empathize**: Start by acknowledging the parent's emotional experience without validating the complaint's premise. 'I understand it's hard to watch your son not get the minutes you expected. His development matters a lot to me too.' You're not agreeing; you're acknowledging.\n\n**A — Acknowledge**: State one specific thing you genuinely appreciate or have observed about the player. This isn't flattery — it's evidence that you see their child as an individual.\n\n**R — Redirect**: Move from the parent's concern to the development process. 'The way I measure progress is [skill, behavior, trend], not minutes yet — here's what I'm watching for.' This reframes the conversation from a grievance to a shared development goal.\n\n**S — Specify**: Give them one observable thing to look for. 'In the next two games, watch how many times Marcus makes the right rotation on the weak side.' This gives the parent something to root for instead of something to resent.\n\nMost parent frustration is really anxiety in disguise — anxiety that their kid is being overlooked. Evidence that you see their child is the most powerful thing you can offer.",
        },
        {
          type: "examine",
          title: "Your Communication History",
          estimatedMinutes: 3,
          content:
            "Think about the parent conversations that went well — what did they have in common? Most coaches find that successful parent conversations involve a specific observation about the player, a concrete next step, and an explicit invitation to continue the conversation.\n\nThe conversations that go sideways usually share one failure: the coach defended a decision instead of redirecting to development. Once you're defending, the parent is arguing.",
        },
        {
          type: "apply",
          title: "Reflect on One Parent Interaction",
          estimatedMinutes: 5,
          content:
            "Using the journal in this module, write a reflection on one parent interaction you've had this season. Apply the EARS framework retroactively: where did it go well? Where could EARS have changed the direction?\n\nIf you anticipate a challenging parent conversation in the coming week, write out how you'd open it using the EARS framework before you have it.",
          actionPrompt:
            "Write a journal reflection applying the EARS framework to a real parent conversation.",
          actionHref: "/app/coach/education/module/fm_08_parents",
        },
        {
          type: "reflect",
          title: "The Parent You've Misread",
          estimatedMinutes: 2,
          content:
            "Most difficult parent behavior is anxiety, not hostility. When you assume a difficult parent is challenging your authority rather than expressing fear about their child's future, the conversation changes.\n\nWho is the parent on your current roster you find hardest to talk to? What might they actually be afraid of?",
        },
      ],
    },

    // ── Module 9 ────────────────────────────────────────────────────────────
    {
      id: "fm_09_accountability",
      path: "foundation",
      pathId: "foundation",
      category: "Accountability Systems",
      domain: "Accountability Systems",
      title: "Building Accountability That Players Actually Respect",
      subtitle: "The difference between consequences and accountability — and why it matters",
      description:
        "Consequences are what you do to players. Accountability is a system players opt into. This module teaches you to build accountability structures that players see as fair, meaningful, and motivating.",
      estimatedMinutes: 21,
      status: "not_started",
      deliverableCompleted: false,
      prerequisiteIds: ["fm_06_communication", "fm_07_agedev"],
      deliverableType: "reflection",
      deliverablePrompt:
        "Write a reflection defining your program's accountability standard for one specific behavior. Include what the standard is, how it's communicated, and what happens when it isn't met.",
      deliverableHref: "/app/coach/education/module/fm_09_accountability",
      sections: [
        {
          type: "frame",
          title: "The Rule Nobody Follows",
          estimatedMinutes: 2,
          content:
            "You have a team rule: miss a film review without communicating, and you don't start the next game. It's posted in the team group chat. Three players have missed film reviews this month. You've started all three of them because the games mattered and you didn't want to hurt the team.\n\nThe rule exists. The accountability doesn't. And everyone on the team knows the difference.",
        },
        {
          type: "concept",
          title: "The Three Elements of Real Accountability",
          estimatedMinutes: 8,
          content:
            "Accountability that players respect has three elements: clarity, consistency, and co-ownership.\n\n**Clarity** means the expectation is specific enough that a player could evaluate their own compliance without asking you. 'Be coachable' is not accountable. 'Complete your assigned film review within 48 hours of the session upload' is accountable.\n\n**Consistency** is the credibility test. A standard that is applied inconsistently — even once, even for good reasons — signals that the standard is actually a preference. Players are exquisitely sensitive to inconsistency because it reveals the real hierarchy: wins over standards.\n\nThis doesn't mean rigidity. 'This week I'm making an exception because of X' is different from silently ignoring the standard. Naming the exception and its reason preserves the standard; silence erodes it.\n\n**Co-ownership** is the element most coaches undervalue. Accountability that players participated in building feels like a shared commitment. Accountability that was handed down feels like a power assertion.\n\nAt the start of the season, run a team conversation: 'What standards do we need to hold each other to this year?' Document what they say. Use it. When a player falls short, you're holding them to their own word.",
        },
        {
          type: "examine",
          title: "Your Accountability Track Record",
          estimatedMinutes: 3,
          content:
            "Think about the last three times a player or team fell short of a stated standard. Did you apply the stated consequence? If not, what prevented you?\n\nThe most common barrier is consequences that are too expensive to apply consistently — starting lineup changes that hurt the team, conditioning punishments that feel punitive. If your consequences are too costly to use, they're designed wrong.",
        },
        {
          type: "apply",
          title: "Define One Standard",
          estimatedMinutes: 6,
          content:
            "Using the reflection journal, write out one accountability standard for your program. Make it specific enough to be self-evaluable, connected to platform behavior you can track, and paired with a consequence you will actually apply every time.\n\nThen write one sentence about how you'd co-own this standard with your team — how you'd introduce it as a team commitment rather than a coach mandate.",
          actionPrompt:
            "Write one complete accountability standard — expectation, measurement, consequence, and team ownership note — in your coaching journal.",
          actionHref: "/app/coach/education/module/fm_09_accountability",
        },
        {
          type: "reflect",
          title: "What You're Actually Holding Players To",
          estimatedMinutes: 2,
          content:
            "If your players were asked to describe the real standards of your program — not the stated ones, the real ones — what would they say?\n\nThat gap between the stated standard and the real standard is your accountability deficit. What's one standard you want to close that gap on before the next practice?",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Development Path — 16 module outlines
// ─────────────────────────────────────────────────────────────────────────────

const makeLockedModule = (
  id: string,
  domain: string,
  title: string,
  subtitle: string,
  path: CoachLevel
): Module => ({
  id,
  path,
  pathId: path,
  domain,
  category: domain,
  title,
  subtitle,
  description: "",
  estimatedMinutes: 28,
  sections: [],
  deliverableType: "reflection",
  deliverablePrompt: "",
  deliverableHref: "",
  status: "locked",
  deliverableCompleted: false,
  prerequisiteIds: [],
});

export const developmentPath: LearningPath = {
  id: "development",
  level: 2,
  coachLevel: "development",
  title: "Development Path",
  subtitle: "Build advanced coaching systems that drive measurable player outcomes.",
  description:
    "Sixteen modules for coaches who have mastered the foundation systems and are ready to build sophisticated development architecture.",
  credentialTitle: "HoopsOS Development Certificate",
  totalModules: 16,
  completedModules: 0,
  estimatedHours: 10,
  completionGate: [
    "Foundation Certificate earned",
    "All 16 modules complete",
    "Peer review completed with another coach",
    "Program culture document submitted",
  ],
  modules: [
    makeLockedModule("dm_01", "Film Analysis", "Reading Defensive Schemes on Film", "Identifying coverages from pre-snap alignment", "development"),
    makeLockedModule("dm_02", "Film Analysis", "Building a Film Study Curriculum", "A repeatable film review system for your roster", "development"),
    makeLockedModule("dm_03", "Practice Design", "Constraint-Led Drill Design", "How constraints force adaptation faster than instruction", "development"),
    makeLockedModule("dm_04", "Practice Design", "Managing Energy Across a Weekly Training Block", "Load, recovery, and peak readiness for game day", "development"),
    makeLockedModule("dm_05", "Player Development Planning", "The Long-Term Athlete Development Arc", "Writing 12-month development plans with measurable outcomes", "development"),
    makeLockedModule("dm_06", "Player Development Planning", "When Goals Stall: Diagnosing and Resetting IDP Progress", "The 3 reasons goals stop moving — and how to restart them", "development"),
    makeLockedModule("dm_07", "Teaching & Cueing", "Advanced Cueing: Analogies, Imagery, and Feel Cues", "When words fail — non-verbal coaching that accelerates learning", "development"),
    makeLockedModule("dm_08", "Teaching & Cueing", "Drill Variety and Retention Science", "Why blocked practice plateaus and how variability accelerates learning", "development"),
    makeLockedModule("dm_09", "Player Communication", "Handling At-Risk Conversations", "When a player is struggling beyond basketball", "development"),
    makeLockedModule("dm_10", "Player Communication", "Motivating Across Personality Types", "How to individualize your coaching presence for different players", "development"),
    makeLockedModule("dm_11", "Accountability Systems", "Observation Habits: Coaching With Your Eyes", "A systematic approach to what you watch and when", "development"),
    makeLockedModule("dm_12", "Accountability Systems", "Building a Coaching Staff Culture", "How alignment and distributed accountability multiply your impact", "development"),
    makeLockedModule("dm_13", "Age-Appropriate Dev", "Specialization and the Early Developer", "When to specialize, when to protect, and how to have that conversation", "development"),
    makeLockedModule("dm_14", "Parent Communication", "Running the Mid-Season Parent Meeting", "A structured format for program-wide expectation resets", "development"),
    makeLockedModule("dm_15", "Program Building", "Building Your Program's Development Identity", "Defining what you stand for as a coaching program", "development"),
    makeLockedModule("dm_16", "Program Building", "Retention: Why Players Leave and What Keeps Them", "The data and psychology behind player and family retention", "development"),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Elite Path — 20 module outlines
// ─────────────────────────────────────────────────────────────────────────────

export const elitePath: LearningPath = {
  id: "elite",
  level: 3,
  coachLevel: "elite",
  title: "Elite Path",
  subtitle: "Master-level coaching systems for coaches developing high-performance athletes.",
  description:
    "Twenty modules for coaches operating at the highest level of youth and prep basketball.",
  credentialTitle: "HoopsOS Elite Certificate",
  totalModules: 20,
  completedModules: 0,
  estimatedHours: 16,
  completionGate: [
    "Development Certificate earned",
    "All 20 modules complete",
    "Case study submitted with season-long player outcome data",
    "Cohort peer review completed",
    "Mentorship session with Elite-certified coach",
  ],
  modules: [
    makeLockedModule("em_01", "Tactical Systems", "Building a Full-Court Pressure System", "Installing press defense with multiple looks", "elite"),
    makeLockedModule("em_02", "Tactical Systems", "Half-Court Offense: Motion Principles vs. Set Plays", "When to run sets and when to trust motion", "elite"),
    makeLockedModule("em_03", "Tactical Systems", "Scouting and Opponent Preparation at Scale", "A repeatable scouting process your staff can execute", "elite"),
    makeLockedModule("em_04", "Tactical Systems", "Transition Offense: Building an Early Offense System", "Converting defense to offense in fewer than 4 seconds", "elite"),
    makeLockedModule("em_05", "Performance Science", "Periodization for Basketball: Planning a Full Season", "Load management, peaking, and season-long development arcs", "elite"),
    makeLockedModule("em_06", "Performance Science", "Recovery Protocols: What the Science Actually Says", "Sleep, nutrition, and active recovery in youth athletics", "elite"),
    makeLockedModule("em_07", "Performance Science", "Mental Performance Training for High-Stakes Competition", "Pre-game routines, pressure management, and resilience", "elite"),
    makeLockedModule("em_08", "Performance Science", "Nutrition and Sleep: The Unsexy Performance Variables", "The most impactful interventions most coaches ignore", "elite"),
    makeLockedModule("em_09", "Player Development Planning", "Recruiting Conversations: Development vs. Exposure", "Navigating recruiting culture without compromising development", "elite"),
    makeLockedModule("em_10", "Player Development Planning", "Building the Elite Player's Skill Portfolio", "Designing IDPs for players with Division I ambitions", "elite"),
    makeLockedModule("em_11", "Film Analysis", "AI-Assisted Film Review: Leverage and Limits", "What AI can and can't tell you about player development", "elite"),
    makeLockedModule("em_12", "Film Analysis", "Building a Team Film Culture", "Getting players to watch film like coaches watch film", "elite"),
    makeLockedModule("em_13", "Program Leadership", "Hiring and Developing Assistant Coaches", "Building a coaching staff that multiplies your impact", "elite"),
    makeLockedModule("em_14", "Program Leadership", "Financial Sustainability for Independent Coaching Programs", "Revenue models, pricing, and long-term program health", "elite"),
    makeLockedModule("em_15", "Program Leadership", "Managing Up: Working With Club Directors and School ADs", "Navigating institutional relationships without losing your voice", "elite"),
    makeLockedModule("em_16", "Program Leadership", "Crisis Communication: When Things Go Wrong Publicly", "Protecting your program and your players in public moments", "elite"),
    makeLockedModule("em_17", "Coach Development", "Building Your Coaching Philosophy Document", "Writing the document that makes every hard decision easier", "elite"),
    makeLockedModule("em_18", "Coach Development", "Mentorship: Building Your Own Coach Development Network", "Finding, using, and becoming a coaching mentor", "elite"),
    makeLockedModule("em_19", "Coach Development", "Self-Evaluation: Reviewing Your Own Coaching Film", "How to watch yourself coach without defensiveness", "elite"),
    makeLockedModule("em_20", "Coach Development", "The Coach Who Keeps Growing: Staying Current in the Game", "A system for ongoing learning beyond courses and clinics", "elite"),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Contextual Triggers
// ─────────────────────────────────────────────────────────────────────────────

export const contextualTriggers: ContextualTrigger[] = [
  {
    id: "ct_01",
    condition: "Coach has an active IDP with no milestones set",
    moduleId: "fm_01_idp",
    headline: "IDPs without milestones complete 40% less often",
    ctaLabel: "3-min framework →",
    ctaHref: "/app/coach/education/module/fm_01_idp",
    dismissible: true,
  },
  {
    id: "ct_02",
    condition: "Film review submitted with 0 annotations",
    moduleId: "fm_04_film",
    headline: "Timestamp notes have 3× the impact of general feedback",
    ctaLabel: "Learn the technique →",
    ctaHref: "/app/coach/education/module/fm_04_film",
    dismissible: true,
  },
  {
    id: "ct_03",
    condition: "First at-risk player flag appears in the system",
    moduleId: "dm_09",
    headline: "At-risk situations need a specific conversation framework",
    ctaLabel: "Handling at-risk talks →",
    ctaHref: "/app/coach/education/module/dm_09",
    dismissible: true,
  },
  {
    id: "ct_04",
    condition: "Practice plan saved with no conditioning block",
    moduleId: "fm_02_practice",
    headline: "Missing conditioning? The 4-block structure keeps this balanced",
    ctaLabel: "Review the framework →",
    ctaHref: "/app/coach/education/module/fm_02_practice",
    dismissible: true,
  },
  {
    id: "ct_05",
    condition: "Same drill type used in 5 consecutive practice plans",
    moduleId: "dm_08",
    headline: "Repetition builds habit — but variety builds retention",
    ctaLabel: "The science of variability →",
    ctaHref: "/app/coach/education/module/dm_08",
    dismissible: true,
  },
  {
    id: "ct_06",
    condition: "IDP completion rate drops below 50% across the roster",
    moduleId: "dm_06",
    headline: "When goals stall, the framework — not the player — needs adjusting",
    ctaLabel: "Diagnose and reset IDPs →",
    ctaHref: "/app/coach/education/module/dm_06",
    dismissible: true,
  },
  {
    id: "ct_07",
    condition: "Coach has not logged an observation in more than 14 days",
    moduleId: "dm_11",
    headline: "Observation frequency is the #1 predictor of IDP quality",
    ctaLabel: "Build the habit →",
    ctaHref: "/app/coach/education/module/dm_11",
    dismissible: true,
  },
  {
    id: "ct_08",
    condition: "New coach account created (first login within 7 days)",
    moduleId: "fm_01_idp",
    headline: "Start where development starts — with a goal that changes behavior",
    ctaLabel: "Begin Foundation Path →",
    ctaHref: "/app/coach/education/module/fm_01_idp",
    dismissible: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sample Journal Entries — Coach Marcus
// ─────────────────────────────────────────────────────────────────────────────

export const sampleJournalEntries: CoachingJournalEntry[] = [
  {
    id: "jrn_01",
    moduleId: "fm_01_idp",
    moduleName: "Writing IDPs That Actually Change Player Behavior",
    prompt: "Think about the player you just updated — what does goal-clarity change for them?",
    response:
      "Updated Jaylen's IDP tonight. Changed 'improve your handle under pressure' to 'protect the ball with a change-of-pace crossover when a defender's hips are square at a success rate of 4 of 5 reps in the Tuesday defense drill by Dec 15.' Writing it that specifically forced me to realize I didn't actually know what Jaylen's current rate was. So I watched 20 minutes of his Thursday session and counted. He's at 2 of 5 right now. That's useful. That's actionable. This was a good exercise — I think I've been writing IDP goals for the form, not for the player.",
    createdAt: "2025-05-10T21:15:00Z",
  },
  {
    id: "jrn_02",
    moduleId: "fm_02_practice",
    moduleName: "The 4-Block Practice Structure",
    prompt: "Think about your best practice session — was it the content or the structure that made it work?",
    response:
      "Ran the 4-block practice today. Didn't tell the players about the framework — just built it in. The difference in attention during Block 2 was real. I think because the warm-up had already primed the theme so when we got into the breakdown drills, players were already in that headspace. Biggest thing I noticed: Block 3 exposed two guys who looked great in Block 2. Their technique disappeared the second there was a real defender. That's not a Block 3 problem — that's a Block 2 tempo problem. Next practice I need to introduce more realistic pace in Block 2 before moving to competitive.",
    createdAt: "2025-05-12T22:05:00Z",
  },
  {
    id: "jrn_03",
    moduleId: "fm_03_cues",
    moduleName: "The 3-Cue Rule",
    prompt: "What's the cue you'll never stop using — and why does it work?",
    response:
      "My best cue of all time is 'beat the hip.' Four years ago I started saying it on drive situations — the offensive player's hip needs to get past the defender's hip to create real separation. Players pick it up immediately. I think it works because it's external, it's binary, and it's transferable to any drive situation. The concept module is right that external cues beat internal ones. Now I need to audit the rest of my cue library with this lens.",
    createdAt: "2025-05-13T20:30:00Z",
  },
  {
    id: "jrn_04",
    moduleId: "fm_08_parents",
    moduleName: "The Parent Conversation That Goes Sideways",
    prompt: "Who is the parent on your roster you find hardest to talk to — and what might they actually be afraid of?",
    response:
      "DeShawn's dad. He comes to every game and tracks minutes on his phone. I've assumed for two months that he's trying to catch me being unfair. Reading this module shifted something. He coached youth basketball for 11 years before his work schedule made him stop. Basketball was his identity, and now he watches his son play it without him. I think what he's afraid of is that DeShawn will miss his window. I haven't been empathizing with that. I've been defending my rotation logic when what he actually needs to hear is that I see DeShawn's long-term ceiling.",
    createdAt: "2025-05-14T19:45:00Z",
  },
  {
    id: "jrn_05",
    moduleId: "fm_06_communication",
    moduleName: "Feedback That Players Actually Hear",
    prompt: "Think about a time your feedback didn't land — what was the context?",
    response:
      "Post-game after the Eastside loss in March. We were down 11, came back to within 4, turned the ball over on back-to-back possessions and lost by 9. In the locker room I gave what I thought was a sharp, specific analysis. Nobody could tell me a word I said three days later. Marcus came to me on Wednesday and said 'coach, I think I made a mistake on that third possession — can we watch it together?' That was the real teaching moment — two days post-game, player-initiated, calm. I need to stop treating the post-game locker room as a teaching environment.",
    createdAt: "2025-05-15T08:10:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Credential
// ─────────────────────────────────────────────────────────────────────────────

export const foundationCredential: Credential = {
  level: "foundation",
  title: "HoopsOS Foundation Certificate",
  description:
    "Awarded to coaches who demonstrate mastery of core development systems — from IDP design to practice structure, cueing, film feedback, and family communication.",
  earned: false,
  progress: 67,
  unlocksNextPath: true,
  requirements: [
    {
      id: "cr_01",
      label: "Complete all 9 Foundation modules",
      description: "All modules must be marked complete with deliverables submitted.",
      type: "module",
      target: "9 of 9 modules complete",
      currentValue: "2 of 9 complete",
      met: false,
    },
    {
      id: "cr_02",
      label: "All active players have IDPs",
      description: "Every player on your active roster has an active Individual Development Plan.",
      type: "behavior",
      target: "100% IDP coverage",
      currentValue: "11 of 11 players",
      met: true,
    },
    {
      id: "cr_03",
      label: "IDP milestone coverage",
      description: "At least 80% of active players have IDPs with at least two milestones set.",
      type: "behavior",
      target: "80% of players have milestones",
      currentValue: "8 of 11 players",
      met: true,
    },
    {
      id: "cr_04",
      label: "Film reviews with timestamp annotations",
      description: "At least 3 film review sessions must include timestamp annotations.",
      type: "deliverable",
      target: "3 sessions with timestamps",
      currentValue: "1 session",
      met: false,
    },
    {
      id: "cr_05",
      label: "Cue Library populated",
      description: "At least 5 drills have cues saved in the Cue Library.",
      type: "behavior",
      target: "5 drills with cues",
      currentValue: "5 of 5 drills",
      met: true,
    },
    {
      id: "cr_06",
      label: "Practice plans using 4-block structure",
      description: "At least 4 saved practice plans use the 4-block format.",
      type: "deliverable",
      target: "4 plans with all blocks",
      currentValue: "4 of 4 plans",
      met: true,
    },
    {
      id: "cr_07",
      label: "Coaching journal entries",
      description: "At least 5 journal entries saved across at least 3 different modules.",
      type: "deliverable",
      target: "5 entries across 3+ modules",
      currentValue: "5 entries, 5 modules",
      met: true,
    },
    {
      id: "cr_08",
      label: "Observation log entries",
      description: "At least 10 player observations logged in the past 30 days.",
      type: "behavior",
      target: "10 observations in 30 days",
      currentValue: "6 observations",
      met: false,
    },
    {
      id: "cr_09",
      label: "Parent communication log",
      description: "At least 2 documented parent conversations using the EARS framework.",
      type: "deliverable",
      target: "2 documented conversations",
      currentValue: "0 documented",
      met: false,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

export function getAllModules(): Module[] {
  return [
    ...foundationPath.modules,
    ...developmentPath.modules,
    ...elitePath.modules,
  ];
}

export function getModuleById(id: string): Module | undefined {
  return getAllModules().find((m) => m.id === id);
}

export function getPathProgress(level: CoachLevel | string): LearningPath {
  if (level === "foundation" || level === "1") return foundationPath;
  if (level === "development" || level === "2") return developmentPath;
  return elitePath;
}

export function getActiveModule(): Module | undefined {
  const inProgress = foundationPath.modules.find((m) => m.status === "in_progress");
  if (inProgress) return inProgress;
  return foundationPath.modules.find((m) => m.status === "not_started");
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility shims — support page files that use the legacy API shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EducationModule — alias for Module that explicitly surfaces the optional
 * legacy fields (category, pathId, completedAt) as required by older page files.
 */
export type EducationModule = Module;

/** @deprecated Use foundationPath / developmentPath / elitePath directly */
export const learningPaths: LearningPath[] = [
  foundationPath,
  developmentPath,
  elitePath,
];

/** @deprecated Use getAllModules() */
export const allModules: Module[] = getAllModules();

/** @deprecated Use getModuleById() */
export function getModule(id: string): Module | undefined {
  return getModuleById(id);
}

/** @deprecated Use getActiveModule() */
export function getNextModule(_coachId?: string): EducationModule | undefined {
  return getActiveModule();
}

/** @deprecated Journal prompts are now embedded in module reflect sections */
export const journalPrompts: Array<{
  id: string;
  moduleId: string;
  prompt: string;
  category: string;
}> = sampleJournalEntries.map((e) => ({
  id: e.id,
  moduleId: e.moduleId,
  prompt: e.prompt,
  category: "general",
}));
