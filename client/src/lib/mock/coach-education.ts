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

export type ModuleSection = {
  id: string;
  type: "frame" | "concept" | "examine" | "apply" | "reflect";
  title: string;
  body: string;
  platformAction?: string;
};

export type EducationModule = {
  id: string;
  title: string;
  subtitle: string;
  pathId: "foundation" | "development" | "elite";
  order: number;
  estimatedMinutes: number;
  category:
    | "player-dev"
    | "communication"
    | "practice-design"
    | "film"
    | "data"
    | "leadership";
  sections: ModuleSection[];
  platformDeliverable: string;
  completedAt?: string;
};

export type LearningPath = {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  description: string;
  modules: EducationModule[];
  credentialTitle: string;
};

export type ContextualTrigger = {
  id: string;
  triggerRoute: string;
  moduleId: string;
  headline: string;
  body: string;
  ctaLabel: string;
};

export type JournalPrompt = {
  id: string;
  moduleId: string;
  prompt: string;
  category: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Path — 9 Modules
// ─────────────────────────────────────────────────────────────────────────────

const foundationModules: EducationModule[] = [
  // ── Module 1: IDP Fundamentals ─────────────────────────────────────────────
  {
    id: "fm_01_idp",
    title: "IDP Fundamentals",
    subtitle: "Why most goals fail — and the 3-part formula that doesn't",
    pathId: "foundation",
    order: 1,
    estimatedMinutes: 22,
    category: "player-dev",
    completedAt: "2026-04-10",
    platformDeliverable:
      "Update one player's IDP with a goal written using the behavior + condition + standard formula. Add at least two milestones with target dates.",
    sections: [
      {
        id: "fm_01_idp_s1",
        type: "frame",
        title: "The IDP That Collects Dust",
        body: "Picture your roster right now. How many players have an IDP? How many of those IDPs have been opened in the last two weeks — by the player, not just you? Most coaches have experienced the same quiet frustration: they spend an hour building a thoughtful development plan in pre-season, and by week four, nobody's looking at it. IDPs fail for three predictable reasons: the goals are too vague to evaluate, there's no milestone structure to course-correct early, and the goal lives in a form rather than a conversation the player has internalized.",
      },
      {
        id: "fm_01_idp_s2",
        type: "concept",
        title: "The 3-Part Goal Formula",
        body: "The most effective athletic development goals share a common structure: they name a specific behavior, describe the condition under which it should happen, and define the standard that proves success. Behavior is an observable action ('attack the closeout with a speed dribble when the defender's feet are set'), not a trait ('be more aggressive'). Condition anchors the goal to a specific situation that actually occurs in your system. Standard tells both of you whether it's working — a frequency, a coach observation, or a milestone event — making the goal self-evaluable for the player. Compare 'get better at finishing' with 'finish through contact with either hand on a wing drive when a help defender is present at a rate of 4 of 6 attempts in the Thursday contact drill by January 20': the second version doesn't just evaluate better — it coaches better.",
      },
      {
        id: "fm_01_idp_s3",
        type: "examine",
        title: "What Your IDP Data Shows",
        body: "Coaches who adopt the 3-part formula see measurable differences in player outcomes within one season. In HoopsOS usage data, IDPs with milestone dates are completed or meaningfully progressed 68% more often than open-ended goals. The most common failure point isn't the goal itself — it's the absence of a first milestone within the first 21 days. Look at your current roster: how many active IDP goals have a milestone marked in the next 30 days? That number tells you more about IDP health than completion percentages.",
      },
      {
        id: "fm_01_idp_s4",
        type: "apply",
        title: "Update One Player's IDP Now",
        body: "Open your IDP dashboard and choose one player you've observed closely in the last two weeks. Find a goal that reads as vague and rewrite it using the 3-part formula. Write the behavior specifically enough that a substitute coach would know exactly what to watch for; define the condition so it maps to situations in your system; set a standard the player could evaluate themselves. Then add two milestones: one due within 21 days (the early indicator), one at the six-week mark.",
        platformAction:
          "Open your IDP Builder, rewrite one goal using behavior + condition + standard, and add two milestones with target dates.",
      },
      {
        id: "fm_01_idp_s5",
        type: "reflect",
        title: "Your Development Philosophy",
        body: "Think about a player you've coached who made a meaningful developmental leap. What made the difference — was it the right goal, the right moment, the right level of specificity? What does this module change about how you'll write goals going forward? Which player on your current roster needs this kind of goal-clarity most urgently?",
      },
    ],
  },

  // ── Module 2: Skill Assessment Mastery ────────────────────────────────────
  {
    id: "fm_02_assessment",
    title: "Skill Assessment Mastery",
    subtitle: "Building evaluations players trust and coaches can actually use",
    pathId: "foundation",
    order: 2,
    estimatedMinutes: 24,
    category: "player-dev",
    completedAt: "2026-04-22",
    platformDeliverable:
      "Complete skill assessments for at least 3 players using the HoopsOS assessment rubric and record notes on each player's top growth priority.",
    sections: [
      {
        id: "fm_02_assessment_s1",
        type: "frame",
        title: "The Rating That Means Nothing",
        body: "A '7 out of 10 in ball-handling' is the kind of assessment that feels useful until you try to act on it. Does 7 mean the player can handle in traffic? Under pressure? Against zone pressure? Without a number anchored to an observable, replicable condition, your assessment is really just a feeling with a digit attached. Assessments that players trust and coaches can actually use must be built on observable behaviors in defined contexts — not impressions averaged over time.",
      },
      {
        id: "fm_02_assessment_s2",
        type: "concept",
        title: "The Observable-Contextual-Comparative Framework",
        body: "Rigorous skill assessment has three pillars. Observable means you're rating something you can see and describe in behavioral terms — 'maintains dribble below knee height through contact' is observable; 'has a solid handle' is not. Contextual means the assessment specifies the situation: 1-on-1 off the dribble, in a drill, in a scrimmage, in a game. The same player can be a 4 in scrimmage and an 8 in isolated drill work — both ratings are true, neither alone is complete. Comparative means you have a benchmark: against their own prior assessment, against a defined standard for their development window, or against teammates at the same position. All three pillars together produce an assessment the player can believe in because they can see exactly what was measured.",
      },
      {
        id: "fm_02_assessment_s3",
        type: "examine",
        title: "How Assessment Drives Development Quality",
        body: "Coaches who conduct structured skill assessments at least three times per season show 2.4× higher rates of IDP goal specificity and 1.8× higher rates of player-reported goal clarity in post-season surveys. The relationship runs both ways: the assessment forces the coach to name what they're developing; the naming makes the IDP goal possible; the goal makes the assessment worth repeating. Review your last assessment round — were the ratings based on observable behaviors in a defined context, or on general impression?",
      },
      {
        id: "fm_02_assessment_s4",
        type: "apply",
        title: "Run Assessments for Three Players",
        body: "Open the Skill Assessment tool and select three players from your active roster — ideally one who is ahead of development expectations, one who is meeting them, and one who is behind. For each player, complete the assessment rubric using only observable behaviors you have actually seen. Where you're uncertain, note it: 'not yet observed in game context' is better data than a guessed rating. After saving all three, use the comparison view to identify the single highest-priority growth area for each player.",
        platformAction:
          "Open Skill Assessments, rate three players on at least 5 skills each using observable behaviors, and log one growth priority note per player.",
      },
      {
        id: "fm_02_assessment_s5",
        type: "reflect",
        title: "The Gap Between What You See and What You Measure",
        body: "Think about a player you believe has high potential but whose metrics don't reflect it yet. Is there a mismatch between your impression and your assessment data — and if so, which one do you trust more? What would it take to design an assessment situation that would capture what you're seeing intuitively? That design question is the heart of skill assessment mastery.",
      },
    ],
  },

  // ── Module 3: Practice Design 101 ─────────────────────────────────────────
  {
    id: "fm_03_practice",
    title: "Practice Design 101",
    subtitle: "Why order matters more than content in practice design",
    pathId: "foundation",
    order: 3,
    estimatedMinutes: 25,
    category: "practice-design",
    platformDeliverable:
      "Build a complete practice plan using the 4-block structure. All four blocks must be present with estimated times and at least one drill per block.",
    sections: [
      {
        id: "fm_03_practice_s1",
        type: "frame",
        title: "The Practice That Wastes Its Own Best Minutes",
        body: "Most coaches plan practices by listing drills they want to run and sequencing by gut feel. The most common practice design mistake isn't wasted time — it's missequenced time. A coach runs a complex offensive scheme in the first 20 minutes when players are physically and neurologically cold, then hammers ball-handling drills in minute 50 when attention and glycogen are both depleted. The content was fine; the order cost them. The 4-block framework isn't a rigid formula — it's a cognitive map that respects how players' bodies and brains are ready for different kinds of learning at different points in a session.",
      },
      {
        id: "fm_03_practice_s2",
        type: "concept",
        title: "The Four Blocks and Why Each Exists",
        body: "Block 1 — Warm-Up (10–15% of total time) establishes the day's focal point and activates both physically and cognitively; the best warm-ups embed the session theme so players arrive mentally focused before Block 2 begins. Block 2 — Skill Development (30–40%) is the learning block: players are ready but not yet fatigued, cognitive load is highest, and this is where you install or refine skills through breakdown drills with immediate error correction. Block 3 — Competitive Application (35–45%) applies Block 2 skills under game-like resistance — this is where transfer happens, where basketball IQ is actually built, and where you get diagnostic information about what Block 2 needs next time. Block 4 — Conditioning + Closure (10–15%) mirrors late-game physical demands and creates the team-building ritual that makes practices matter beyond the gym.",
      },
      {
        id: "fm_03_practice_s3",
        type: "examine",
        title: "How Your Practice Time Is Allocated",
        body: "Pull up your last three saved practice plans and map time by block type. Most coaches, when they do this honestly, find that Block 2 (skill development) is either over-weighted — leaving Block 3 short — or under-weighted in favor of scrimmage time. The absence of intentional Block 3 time is the most common cause of skills that look good in drills but disappear in games. The transfer problem is almost always a practice design problem.",
      },
      {
        id: "fm_03_practice_s4",
        type: "apply",
        title: "Build a Practice Plan Using the 4-Block Structure",
        body: "Open the Practice Plan Builder and create your next practice session with all four blocks labeled and timed. Each block should include a time allocation, a primary drill or activity, and a one-line coaching focus. Before saving, check: Is your session theme visible across all four blocks? Does Block 2 directly prepare players for what they'll face in Block 3? Is conditioning genuine work, not a cooldown?",
        platformAction:
          "Build a full practice plan in the Practice Planner with all four blocks labeled, timed, and connected to a single session theme.",
      },
      {
        id: "fm_03_practice_s5",
        type: "reflect",
        title: "Your Best Practice",
        body: "Think about the best practice session you've ever run — the one where players were engaged from start to finish and left with something real. Was it the content, or was it the structure and sequencing? Now think about one upcoming practice where you've been tempted to wing it. What would change if you committed to the 4-block structure for that session specifically?",
      },
    ],
  },

  // ── Module 4: Film Review Fundamentals ────────────────────────────────────
  {
    id: "fm_04_film",
    title: "Film Review Fundamentals",
    subtitle: "Why timestamp notes have 3× more impact — and what to look for first",
    pathId: "foundation",
    order: 4,
    estimatedMinutes: 22,
    category: "film",
    platformDeliverable:
      "Review one pending film submission and add at least 3 timestamp annotations — one positive, one developmental, one connected to an active IDP goal.",
    sections: [
      {
        id: "fm_04_film_s1",
        type: "frame",
        title: "The Film Review No One Watched",
        body: "A player uploads their shooting session. You write: 'Good effort — footwork needs work, keep the elbow in.' The player reads it, nods, uploads next week's video, gets the same feedback. Now imagine they receive instead: '0:34 — Your plant foot is 45 degrees open before the catch; that's why the release is right of center. 1:12 — Watch this rep: your elbow came in and the ball went straight. That's the feeling to chase.' The second coach didn't work harder — they worked differently. They made film interactive, something the player watches with purpose, rewinding to specific moments and connecting visual proof to felt sensation.",
      },
      {
        id: "fm_04_film_s2",
        type: "concept",
        title: "The Anatomy of a High-Value Timestamp Note",
        body: "Effective timestamp annotations do three things: anchor the observation to an exact moment so the player knows what to look at, name the observable behavior rather than the outcome, and connect to something the player already knows is important. The first-60-seconds rule is foundational: watch completely before annotating, because coaches who jump in early note the most visible error rather than the most important one. Every film review should contain at least one positive timestamp — 'this is the feeling you want' — because the brain learns patterns through contrast, not just error correction, and players who receive only developmental notes begin to watch film defensively. The IDP-connected annotation is your highest-leverage move: when a player reads 'this is the exact situation your IDP goal is about,' the goal becomes real in a way no conversation achieves.",
      },
      {
        id: "fm_04_film_s3",
        type: "examine",
        title: "Your Current Film Queue",
        body: "Film reviews that sit in a queue for more than 72 hours see a significant drop in player engagement when they do arrive — the player has moved on mentally and the feedback feels historical rather than actionable. In your current queue, how many submissions have zero annotations? How many reviews are you writing without timestamps? Coaches who adopt timestamp-first reviewing typically cut their average annotation time because the timestamp forces identification of one specific moment rather than writing general impressions that require more words to say less.",
      },
      {
        id: "fm_04_film_s4",
        type: "apply",
        title: "Review One Film Submission With Timestamps",
        body: "Open your film queue and select the oldest pending submission. Before adding any note, watch the first 60 seconds completely. Then add exactly three timestamp annotations: one positive naming the mechanism that's working, one developmental describing a specific observable error with one corrective action, and one connecting a moment to a goal in this player's active IDP by name. Do not add a fourth annotation — three specific timestamps beat six general ones.",
        platformAction:
          "Open your Film Review queue, select the oldest pending upload, and add 3 timestamp annotations — positive, developmental, and IDP-linked.",
      },
      {
        id: "fm_04_film_s5",
        type: "reflect",
        title: "What Film Reveals That Practice Doesn't",
        body: "Think about a player whose development stalled despite consistent practice. Did you ever review film with them — not for them, with them? Film is the one place where the player can see exactly what you see. What does access to that shared visual truth change about your responsibility to annotate it with precision and care?",
      },
    ],
  },

  // ── Module 5: Player Communication ────────────────────────────────────────
  {
    id: "fm_05_communication",
    title: "Player Communication",
    subtitle: "The psychology of corrective feedback — and why timing changes everything",
    pathId: "foundation",
    order: 5,
    estimatedMinutes: 18,
    category: "communication",
    platformDeliverable:
      "Log one player observation in the platform — context, behavior observed, and your planned feedback timing and format.",
    sections: [
      {
        id: "fm_05_comm_s1",
        type: "frame",
        title: "The Halftime Speech That Went Nowhere",
        body: "Down eight at halftime, you delivered what felt like your best halftime speech — specific, urgent, emotionally grounded. The team came out flat in the third quarter anyway. This isn't a content problem. Hearing and receiving are different neurological events: a player flooded with cortisol from a frustrating half processes information differently than a player in a calm 1:1 conversation three days later. Feedback that lands when a player is ready to hear it is ten times more powerful than feedback delivered at coach-optimal timing.",
      },
      {
        id: "fm_05_comm_s2",
        type: "concept",
        title: "The Four Conditions for Receivable Feedback",
        body: "Feedback is receivable when four conditions are present: psychological safety (the player doesn't expect judgment about their character), relevance to a goal the player owns (feedback connects to something they care about — and IDPs create this frame), emotional regulation in both coach and player (most post-game windows are low-receptivity; immediate post-game feedback rarely forms long-term memory), and a shared evaluation frame where both parties use the same criteria to assess performance. Immediately post-game, the highest-value feedback is very short, specific, and positive: 'You made three correct rotations in the fourth — I saw that.' Everything developmental waits for a calmer window.",
      },
      {
        id: "fm_05_comm_s3",
        type: "examine",
        title: "When You Give Most of Your Feedback",
        body: "Most coaches give the majority of their corrective feedback in three windows: immediately after errors in practice, at halftime, and immediately post-game — precisely the windows of lowest player receptivity. The highest-receptivity windows are typically mid-week 1:1 video review, pre-practice individual check-in, and the first five minutes of practice before competitive pressure builds. How much of your current feedback volume is delivered in high-receptivity windows versus low-receptivity ones?",
      },
      {
        id: "fm_05_comm_s4",
        type: "apply",
        title: "Log a Player Observation",
        body: "After your next practice, log one observation about one player. Include what you noticed (a behavior, not a trait), the context (which drill or game situation), and a deliberate note about when and how you plan to deliver feedback about it — in-person, via film timestamp, or written message. Delaying the log until after practice also calibrates importance: was this observation still worth delivering a day later? If yes, it matters enough to deliver with intention.",
        platformAction:
          "Log one player observation in the Roster tool — behavior observed, context, and your planned feedback timing and format.",
      },
      {
        id: "fm_05_comm_s5",
        type: "reflect",
        title: "The Feedback You Wish You'd Held Back",
        body: "Think about a time you delivered corrective feedback that clearly didn't land — the player shut down, argued, or just nodded without absorbing anything. What was the context? Were the four conditions present? What would you do differently with the same observation now, knowing what you know about receptivity windows?",
      },
    ],
  },

  // ── Module 6: Setting Measurable Milestones ────────────────────────────────
  {
    id: "fm_06_milestones",
    title: "Setting Measurable Milestones",
    subtitle: "The checkpoint architecture that keeps development plans alive all season",
    pathId: "foundation",
    order: 6,
    estimatedMinutes: 20,
    category: "player-dev",
    platformDeliverable:
      "Add milestone checkpoints to at least two active IDPs — include an early indicator (within 21 days), a midpoint check, and a completion marker.",
    sections: [
      {
        id: "fm_06_miles_s1",
        type: "frame",
        title: "The Goal Without a Checkpoint",
        body: "A player's IDP says 'improve defensive positioning by season's end.' It's March. The season ends in four weeks. You haven't looked at the goal since November, and neither has the player. The goal wasn't bad — it was un-checkpointed. When the first moment of accountability is 'did it work?' at season's end, it arrives too late to course-correct and too late for the player to feel any developmental momentum along the way. Milestones turn a season-long intention into a series of achievable commitments.",
      },
      {
        id: "fm_06_miles_s2",
        type: "concept",
        title: "The Three-Checkpoint Architecture",
        body: "Every IDP goal needs three checkpoint types to stay alive. The Early Indicator (within 21 days) is your early warning system — it reveals whether the player understood the goal, is working toward it, and whether your drill design is creating the right opportunities. At this stage, success means engagement, not achievement: is the player attempting the target behavior in relevant situations? The Midpoint Check (5–8 weeks) evaluates whether skill acquisition is actually happening — you're looking for improvement in context, not just isolated drill performance. The Completion Marker defines what 'done' looks like with enough precision that both coach and player can independently evaluate it. Without these three waypoints, goals drift toward the end of the season and disappear.",
      },
      {
        id: "fm_06_miles_s3",
        type: "examine",
        title: "Your Active IDP Milestone Coverage",
        body: "Open your active roster and count how many IDP goals have a milestone due in the next 30 days. If that number is zero or near zero, you have an IDP health problem regardless of how well-written the underlying goals are. HoopsOS data shows that coaches with at least one milestone due per player per month have 3× higher IDP engagement rates from players — not because the milestones are harder, but because they keep the goal visible and create regular moments of shared accountability.",
      },
      {
        id: "fm_06_miles_s4",
        type: "apply",
        title: "Add Milestones to Two Active IDPs",
        body: "Select two players whose IDPs have goals but no near-term milestones. For each goal, build the three-checkpoint architecture: write the early indicator with a specific observable behavior and a target date within 21 days; write the midpoint check with a measurable success threshold; write the completion marker with precision that makes self-evaluation possible. When you save, share the milestone update with each player so they see the checkpoints as their own commitments.",
        platformAction:
          "Open the IDP Builder and add three milestone checkpoints to goals for at least two players — early indicator, midpoint, and completion marker.",
      },
      {
        id: "fm_06_miles_s5",
        type: "reflect",
        title: "The Season You Lost Track",
        body: "Think about a season where a player's development plan fell apart mid-season — not because the player stopped trying, but because the plan lost momentum and nobody was checking in. What would a milestone checkpoint at week three have revealed that could have changed the trajectory? What does that tell you about the real cost of un-checkpointed goals?",
      },
    ],
  },

  // ── Module 7: Parent Engagement ───────────────────────────────────────────
  {
    id: "fm_07_parents",
    title: "Parent Engagement",
    subtitle: "A framework for high-stakes parent conversations that protect the player",
    pathId: "foundation",
    order: 7,
    estimatedMinutes: 19,
    category: "communication",
    platformDeliverable:
      "Write a reflection applying the EARS framework to one parent conversation you've had this season — real or anticipated.",
    sections: [
      {
        id: "fm_07_parents_s1",
        type: "frame",
        title: "The Email at 10:47 PM",
        body: "It comes in after a tough loss. Subject line: 'Concerns about my son's role.' You've seen this email before — different parent, same emotional fingerprint. The content isn't really about playing time; it's about a parent watching their child struggle and not knowing what to do with that feeling. How you respond — and when — shapes your relationship with that family for the rest of the season and shapes whether you can continue being an effective coach for their kid.",
      },
      {
        id: "fm_07_parents_s2",
        type: "concept",
        title: "The EARS Framework",
        body: "The EARS framework provides a consistent structure for high-stakes parent conversations: Empathize by acknowledging the parent's emotional experience without validating the complaint's premise ('I understand it's hard to watch your son not get the minutes you expected — his development matters a lot to me too'); Acknowledge one specific observed behavior or growth ('Marcus has shown real growth in his defensive positioning — I want you to know I'm tracking that'); Redirect from the parent's grievance to the development process ('The way I measure progress is [behavior] right now, not minutes yet — here's what I'm watching for'); Specify one observable thing for the parent to look for in the next two games. The EARS framework doesn't promise what parents want — it shows them you see their child as an individual, which is what most parent anxiety is actually asking for.",
      },
      {
        id: "fm_07_parents_s3",
        type: "examine",
        title: "Your Communication History",
        body: "Think about the parent conversations that went well — what did they have in common? Most coaches find that successful conversations include a specific observation about the player (not a general reassurance), a concrete next step, and an explicit invitation for continued dialogue. The conversations that go sideways usually share one failure: the coach defended a decision instead of redirecting to development. Once you're defending, the parent is arguing. Once the parent is arguing, the player feels the tension.",
      },
      {
        id: "fm_07_parents_s4",
        type: "apply",
        title: "Reflect on One Parent Interaction",
        body: "Using the coaching journal, write a reflection on one parent interaction from this season — positive or challenging. Apply the EARS framework retroactively: where did the conversation go well? Where could EARS have changed the direction? If you anticipate a challenging parent conversation in the coming week, write out how you'd open it using the EARS framework before you have it — preparation changes the quality of presence.",
        platformAction:
          "Open your Coaching Journal and write a reflection applying the EARS framework to a real or anticipated parent conversation.",
      },
      {
        id: "fm_07_parents_s5",
        type: "reflect",
        title: "The Parent You've Misread",
        body: "Most difficult parent behavior is anxiety, not hostility. When you assume a difficult parent is challenging your authority rather than expressing fear about their child's future, everything about the conversation changes. Who is the parent on your current roster you find hardest to engage? What might they actually be afraid of — and how would that reframe shift your approach to the next interaction?",
      },
    ],
  },

  // ── Module 8: Readiness Monitoring ────────────────────────────────────────
  {
    id: "fm_08_readiness",
    title: "Readiness Monitoring",
    subtitle: "How to read player availability before it becomes a problem",
    pathId: "foundation",
    order: 8,
    estimatedMinutes: 20,
    category: "data",
    platformDeliverable:
      "Review your team's Readiness Dashboard and flag at least two players for follow-up based on their current trend data.",
    sections: [
      {
        id: "fm_08_ready_s1",
        type: "frame",
        title: "The Player Who Looked Fine",
        body: "You've had it happen: a player looks fine at the start of practice. By the third block, their effort has dropped and their decision-making is erratic. After practice they tell you they haven't slept more than four hours in three nights because of finals. You didn't know. You couldn't have seen it. But a readiness check-in at the start of practice — even a one-question digital pulse — would have told you. Readiness monitoring isn't about coddling players; it's about having information that makes your coaching decisions better.",
      },
      {
        id: "fm_08_ready_s2",
        type: "concept",
        title: "The Four Readiness Domains",
        body: "Player readiness operates across four interdependent domains: Physical (sleep quality and quantity, soreness, injury status, nutrition), Mental-Emotional (stress load, motivation level, confidence, focus quality), Academic-Life (test schedules, grade pressure, family situations, extracurricular demands), and Recovery (training load over the last 72 hours, perceived recovery, hydration). No single domain tells the full story — a player can be physically rested but mentally checked out, or academically stressed but physically ready to have a great practice. The HoopsOS Readiness Dashboard aggregates daily check-in data across these domains so you see trends, not just snapshots. A single low readiness score is noise; a three-day trend is signal.",
      },
      {
        id: "fm_08_ready_s3",
        type: "examine",
        title: "What Your Team Trends Are Saying",
        body: "Open your Readiness Dashboard and look at the last 14 days for your full roster. Look for players whose readiness has trended downward for three or more consecutive days — this is a proactive intervention window, not a crisis window. Also look for players whose physical and mental scores are diverging in opposite directions: high physical readiness with low mental-emotional scores often indicates a player who's physically present but mentally disengaged, which carries its own development risk.",
      },
      {
        id: "fm_08_ready_s4",
        type: "apply",
        title: "Flag Two Players for Follow-Up",
        body: "In the Readiness Dashboard, identify two players whose trend data suggests a conversation is warranted — one whose scores have been declining and one whose domain scores are significantly mismatched. For each, write a brief note on what you're observing and what kind of check-in makes sense: a quick pre-practice word, a formal 1:1, or a referral to a resource. Flag both players in the platform so you have a record of the observation.",
        platformAction:
          "Open the Readiness Dashboard, review the last 14 days of team data, and flag two players for follow-up with a note on what you observed.",
      },
      {
        id: "fm_08_ready_s5",
        type: "reflect",
        title: "The Coach Who Knows Their Players",
        body: "The best coaches in any sport describe knowing intuitively when a player is 'off' before being told. That intuition is real — but it's based on longitudinal attention to individual baselines, not magic. What would it mean for your coaching practice if you had structured, consistent readiness data on every player every day? What decision would you have made differently in the last month if you'd had that information?",
      },
    ],
  },

  // ── Module 9: WOD Design ──────────────────────────────────────────────────
  {
    id: "fm_09_wod",
    title: "WOD Design",
    subtitle: "Designing daily work that players own and actually complete",
    pathId: "foundation",
    order: 9,
    estimatedMinutes: 21,
    category: "practice-design",
    platformDeliverable:
      "Create one WOD for a specific player tied to an active IDP goal. Include warm-up, skill reps with target counts, and a self-assessment prompt.",
    sections: [
      {
        id: "fm_09_wod_s1",
        type: "frame",
        title: "The WOD Nobody Did",
        body: "You built a training document for your players' off-day work: shooting reps, ball-handling patterns, conditioning. You shared it in the team group chat. Three weeks later, in a film session, you notice the same technical errors you were trying to fix with the WOD. When you ask, most players admit they did it once or twice in the first week. The WOD failed not because players are lazy, but because it wasn't designed to be owned — it was designed to be assigned.",
      },
      {
        id: "fm_09_wod_s2",
        type: "concept",
        title: "The Four Elements of an Owned WOD",
        body: "A WOD players actually complete has four elements: a clear IDP connection ('this is the skill your goal targets'), a time-bounded structure (a WOD that takes 25 minutes beats one that takes 'as long as it takes'), a rep target specific enough to be self-tracked ('7 of 10 successful reps at the point-of-contact marker' rather than '100 makes'), and a one-question self-assessment that prompts reflection rather than just completion. The self-assessment is the underestimated element — when a player asks themselves 'did I feel my footwork differently today?', they're doing the metacognitive work that accelerates transfer from drill to game context. Without it, WOD completion is just box-checking.",
      },
      {
        id: "fm_09_wod_s3",
        type: "examine",
        title: "Your WOD Completion Data",
        body: "Look at your WOD completion rates in the platform over the last 30 days. The coaches with the highest completion rates share a pattern: their WODs are individually assigned (not group blasts), directly tied to a named IDP goal, and include a brief self-report field that takes less than two minutes to complete. Group WODs have their place in team culture, but individual WOD ownership is built through individual connection — the player sees their name, their goal, their drill.",
      },
      {
        id: "fm_09_wod_s4",
        type: "apply",
        title: "Build a WOD for One Player",
        body: "Choose a player with an active IDP goal that maps well to skill work they can do without a full training environment. In the WOD Planner, build a session with: a two-sentence connection to their IDP goal, a structured warm-up under five minutes, a skill block with specific rep targets and observable success criteria, and one self-assessment question at the end. Assign it specifically to that player with a completion window and a platform notification.",
        platformAction:
          "Open the WOD Planner, create a player-specific WOD tied to one active IDP goal, and assign it with a completion deadline.",
      },
      {
        id: "fm_09_wod_s5",
        type: "reflect",
        title: "The Work Between Practices",
        body: "Development is what happens between practices as much as during them. A player who trains intentionally for 20 minutes on three off-days accumulates more deliberate practice hours over a season than a player who only shows up to team sessions. What does designing better WODs tell you about your responsibility as a development coach — and what's the one player on your roster who would benefit most from a well-designed individual training plan right now?",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Development Path — 6 Modules
// ─────────────────────────────────────────────────────────────────────────────

const developmentModules: EducationModule[] = [
  {
    id: "dm_01_adv_idp",
    title: "Advanced IDP Strategies",
    subtitle: "Building 12-month development arcs with measurable longitudinal outcomes",
    pathId: "development",
    order: 1,
    estimatedMinutes: 30,
    category: "player-dev",
    platformDeliverable:
      "Build a 12-month development arc for one player — include quarterly goal phases, a skill priority sequence, and a milestone map from current level to target ceiling.",
    sections: [
      {
        id: "dm_01_adv_idp_s1",
        type: "frame",
        title: "The Season-by-Season Player Who Never Takes the Leap",
        body: "You've coached players who improve every year in every measurable way, yet never quite break through to the next competitive level. Their IDP goals are good; their work ethic is real; their improvement is consistent. What's missing is architecture — a multi-season development arc that sequences skill acquisition in the right order, manages physical and cognitive load across time, and targets the specific ceiling-breakers that gate advancement at each level. Annual IDPs fix annual problems; 12-month arcs build players.",
      },
      {
        id: "dm_01_adv_idp_s2",
        type: "concept",
        title: "The Four-Phase Development Arc",
        body: "A 12-month development arc is divided into four phases, each with a distinct priority and success criteria. Phase 1 — Foundation Repair (months 1–2): identify and address the limiting technical deficiency that most constrains game performance; this is always a mechanics or decision pattern problem, never an effort problem. Phase 2 — Skill Installation (months 3–5): introduce the target skill in controlled conditions, build the motor pattern to 80% reliability in drill contexts, begin Tier 2 (semi-live) exposure. Phase 3 — Transfer and Application (months 6–9): move the skill into game-representative environments, track transfer rate explicitly, adjust drill design based on what's not transferring. Phase 4 — Ceiling Push (months 10–12): with the foundation skills stable, introduce the advanced reads, positions, and competitive situations that define the next developmental level. Without this sequencing, coaches introduce ceiling-push skills before the foundation is ready to support them.",
      },
      {
        id: "dm_01_adv_idp_s3",
        type: "examine",
        title: "Your Current Longest-Tenured Players",
        body: "Identify two players who have been in your program for two or more years. Look at their IDP history: is there a visible development arc across the seasons, or is each year's plan essentially the same set of goals with updated dates? For most coaches, the honest answer is that long-term plans default to repeating the same annual priorities rather than progressing through a sequenced arc. That repetition isn't a player problem — it's a planning problem.",
      },
      {
        id: "dm_01_adv_idp_s4",
        type: "apply",
        title: "Build One 12-Month Arc",
        body: "Choose a player you'll coach for at least the next 12 months. In the IDP Builder, create a long-form arc with four labeled phases, a skill priority sequence, and at least two milestones per phase. The ceiling-push in Phase 4 should describe a specific competitive situation the player cannot currently succeed in — and should feel ambitious but achievable given the foundation being built in Phases 1–3.",
        platformAction:
          "Open the IDP Builder, create a 12-month arc with four phases and milestone maps, and share the full plan with the player.",
      },
      {
        id: "dm_01_adv_idp_s5",
        type: "reflect",
        title: "The Player You've Been Under-Planning For",
        body: "Every program has a player who has been in the system long enough to deserve a multi-year plan but who has only ever received season-length IDPs. What would a 12-month arc change for that player — in their development trajectory, in their sense of being seen, and in your coaching relationship with them?",
      },
    ],
  },

  {
    id: "dm_02_film_ai",
    title: "AI-Assisted Film Analysis",
    subtitle: "Leveraging technology without losing your coaching eye",
    pathId: "development",
    order: 2,
    estimatedMinutes: 28,
    category: "film",
    platformDeliverable:
      "Run one film session using the AI analysis tool, then add your own annotations to at least 3 AI-flagged moments — noting where you agree, disagree, or would add nuance.",
    sections: [
      {
        id: "dm_02_film_s1",
        type: "frame",
        title: "What the Algorithm Can't See",
        body: "AI film analysis tools can identify that a player's elbow drifted outside the shooting window on 14 of 22 attempts. What they cannot tell you is that this player's mechanics broke down specifically in the fourth quarter, only after pick-and-roll coverages forced them to shoot from a non-preferred angle, following a rough interaction with a teammate on the bench. The algorithm sees the pattern; you see the context. Advanced film analysis is about using AI to surface patterns efficiently so you have more time and attention for the contextual interpretation that only a coach can provide.",
      },
      {
        id: "dm_02_film_s2",
        type: "concept",
        title: "The Three-Layer Film Review System",
        body: "Advanced film analysis operates in three layers that should never be collapsed. Layer 1 — Pattern Detection: use AI tools to identify statistical patterns across a session or game (shot selection by zone, defensive positioning frequency, transition decisions). This layer tells you where to look. Layer 2 — Contextual Analysis: watch the flagged moments in sequence, adding your coaching interpretation about the situation, opponent pressure, fatigue, game state, and prior context. This is where your expertise is irreplaceable. Layer 3 — Developmental Mapping: connect what you found in Layers 1–2 to the player's IDP, to your drill design, and to the specific cues and progressions you're using. Without Layer 3, film analysis produces observations but not development actions.",
      },
      {
        id: "dm_02_film_s3",
        type: "examine",
        title: "Where Technology Adds Leverage",
        body: "Coaches who use AI film tools without a layered framework tend to over-index on what the algorithm surfaces most prominently — typically volume-based statistical patterns — and under-weight low-frequency, high-importance moments that require human recognition, like a player's body language after a missed assignment or a subtle read that was correct even if the outcome wasn't. Audit your last three AI-assisted film sessions: how many of your final annotations were driven by the AI flag versus your own eye? The right ratio depends on your workflow, but a coach who is only annotating AI-flagged moments has outsourced their coaching eye.",
      },
      {
        id: "dm_02_film_s4",
        type: "apply",
        title: "Run a Three-Layer Film Session",
        body: "Open the Film Analysis tool and select a recent game or practice upload. Let the AI run its full pattern detection pass. Then work through the flagged moments in Layer 2, adding your contextual interpretation to each. Finally, in Layer 3, connect at least three of your annotations to a specific player's IDP goal, drill plan, or cue you plan to introduce next practice.",
        platformAction:
          "Run the AI Film Analysis tool on one session, annotate at least 3 flagged moments with your contextual interpretation, and link each to a player's IDP or drill plan.",
      },
      {
        id: "dm_02_film_s5",
        type: "reflect",
        title: "Your Coaching Eye",
        body: "The thing an algorithm cannot develop is the coaching eye — the rapid, pattern-matching visual expertise built through thousands of hours of intentional observation. What does your eye catch that statistics miss? If you had to describe the single most important thing you know how to see in film that a software tool would never surface, what would it be?",
      },
    ],
  },

  {
    id: "dm_03_benchmarks",
    title: "Benchmarking & Positioning",
    subtitle: "Using competitive context to set development targets that actually matter",
    pathId: "development",
    order: 3,
    estimatedMinutes: 26,
    category: "data",
    platformDeliverable:
      "Run a benchmark comparison for two players against their position peer group and update each player's IDP with one goal that responds to the benchmark gap.",
    sections: [
      {
        id: "dm_03_bench_s1",
        type: "frame",
        title: "The Player Who Is Good Enough — For What?",
        body: "You have a shooting guard who scores 14 points per game, shoots 38% from three, and defends with effort. Is that good enough? The answer entirely depends on the context: good enough to start on your current roster, yes. Good enough to play in the recruiting events they're targeting next summer, probably not. Good enough to get a scholarship offer from the programs they're interested in, that depends on which programs. Without benchmarking, development goals float in a vacuum — technically measurable but disconnected from the competitive context that gives them meaning.",
      },
      {
        id: "dm_03_bench_s2",
        type: "concept",
        title: "The Four Benchmark Contexts",
        body: "Meaningful benchmarking requires four contexts to be useful. Roster Context: where does the player stand relative to teammates at the same position? This drives playing time decisions and role definition. Competitive Level Context: how does the player compare to opponents they'll face in their primary competitive circuit? This drives readiness decisions. Recruiting Target Context: where does the player need to be to compete for opportunities at the level they're targeting? This drives aspiration-setting. Developmental Trajectory Context: is the player improving faster or slower than peers at their stage who ultimately reached a similar target level? This drives urgency calibration. HoopsOS benchmark data aggregates across all four contexts — the mistake is using only one when making development decisions.",
      },
      {
        id: "dm_03_bench_s3",
        type: "examine",
        title: "Your Players Against Their Peer Groups",
        body: "Open the Benchmarking tool and pull reports for three players at different positions. For each, look at the gap between their current metrics and the 70th percentile of their position peer group at the same competitive level. That 70th-percentile gap is your highest-priority development target — it's the threshold that separates players who are competitive from players who are comfortably competitive. Now look at their IDP goals: how many of those goals are directly responding to an identified benchmark gap?",
      },
      {
        id: "dm_03_bench_s4",
        type: "apply",
        title: "Set One Benchmark-Driven Goal",
        body: "Choose two players and run their full benchmark comparison reports. For each, identify the single metric gap with the most impact on their competitive positioning. Then open their IDPs and add one goal that directly targets that gap — written in the behavior + condition + standard formula, with a target that would move them meaningfully toward the 70th percentile in that metric within the next 90 days.",
        platformAction:
          "Open the Benchmarking tool, run position reports for two players, and add one benchmark-driven IDP goal for each based on their identified gap.",
      },
      {
        id: "dm_03_bench_s5",
        type: "reflect",
        title: "Honest Conversations About Competitive Reality",
        body: "Benchmark data sometimes reveals a gap between a player's aspirations and their current competitive standing that is difficult to address honestly. How do you have that conversation — the one where the data shows a player is significantly below their target level — in a way that motivates rather than deflates? What's the framing that turns a benchmark gap into a development challenge rather than a verdict?",
      },
    ],
  },

  {
    id: "dm_04_at_risk",
    title: "At-Risk Player Intervention",
    subtitle: "Recognizing the signals and building the conversation framework that helps",
    pathId: "development",
    order: 4,
    estimatedMinutes: 28,
    category: "leadership",
    platformDeliverable:
      "Flag one at-risk player in the platform, log the observation that prompted the flag, and write your planned intervention approach.",
    sections: [
      {
        id: "dm_04_risk_s1",
        type: "frame",
        title: "The Player Who Disappeared Slowly",
        body: "It didn't happen overnight. Over six weeks, their effort in drills gradually dropped from 95% to 70%. They started arriving to practice just on time instead of early. Their film review completion went from reliable to sporadic. In the locker room, they were present but not engaged. You noticed but assumed it was a phase, a bad stretch of school, something that would resolve itself. By the time you had a real conversation, they'd mentally left the program three weeks earlier. At-risk identification is about catching the slow fade before it becomes a departure.",
      },
      {
        id: "dm_04_risk_s2",
        type: "concept",
        title: "The At-Risk Signal Cluster",
        body: "No single behavior reliably predicts at-risk status — it's always a cluster of changes from an individual baseline. The most predictive signals are: engagement decline (effort, attention, and initiative all trending down simultaneously), social withdrawal from the team environment (pre-practice conversations, locker room presence, response to coach interaction), platform behavior changes (WOD completion drops, film review lapse, readiness check-in quality declining), and unexplained absence or recurring tardiness. The critical word is 'change' — an introverted player who has always been quiet isn't at-risk; an extroverted player who has gone quiet over three weeks is. Your baseline knowledge of each player is the essential tool for at-risk identification.",
      },
      {
        id: "dm_04_risk_s3",
        type: "examine",
        title: "Your Current Roster for Signal Clusters",
        body: "Review your readiness data, WOD completion, and film engagement for the last 21 days. Flag any player who shows at least three behavioral changes from their personal baseline. Cross-reference with your own observation memory: have any of these players seemed different in practice in ways that didn't show up in data? The combination of behavioral data and coaching observation is your most accurate at-risk screen.",
      },
      {
        id: "dm_04_risk_s4",
        type: "apply",
        title: "Open the Intervention Conversation",
        body: "Once you've identified a player showing at-risk signals, the intervention conversation should happen within 48 hours of identification — not at the next scheduled check-in, not after the next game. The conversation structure: open with a specific observation ('I've noticed your energy has been different the last three weeks — I've noticed this because I pay attention to you specifically'), offer space without pressure ('I don't need to know everything, but I want you to know I'm paying attention'), and identify one concrete next step together. Flag the player in HoopsOS so you have a record of the observation and can track the intervention outcome.",
        platformAction:
          "Flag one at-risk player in the platform, log the specific signals that prompted the flag, and write your planned conversation approach.",
      },
      {
        id: "dm_04_risk_s5",
        type: "reflect",
        title: "The One You Missed",
        body: "Most coaches, when they think honestly about their career, can name a player they lost to the slow fade — a player who drifted out of the program or disengaged completely before the coach recognized what was happening. What were the signals that, in retrospect, were there all along? What would earlier intervention have required you to see, or be willing to act on, that you weren't ready for at the time?",
      },
    ],
  },

  {
    id: "dm_05_recruiting",
    title: "Recruiting Readiness",
    subtitle: "Building the player file and communication approach that creates real opportunities",
    pathId: "development",
    order: 5,
    estimatedMinutes: 32,
    category: "player-dev",
    platformDeliverable:
      "Complete a recruiting readiness review for one player — finalize their player profile, export their film highlight reel, and draft the coach outreach summary for one target program.",
    sections: [
      {
        id: "dm_05_rec_s1",
        type: "frame",
        title: "The Player Who Was Ready — Except for the File",
        body: "You had a player who was genuinely ready to play at the next level — the skill was there, the character was there, the grades were there. But when a program expressed interest, the film was scattered across three different platforms and hadn't been edited since the previous season. The player profile was incomplete. There was no statistical narrative connecting their development to their current level. The opportunity didn't close, but it took three weeks to get the right information to the right person — and in recruiting, three weeks can cost a player a scholarship conversation.",
      },
      {
        id: "dm_05_rec_s2",
        type: "concept",
        title: "The Three-Component Recruiting File",
        body: "A complete recruiting file for any player has three components that must be current at all times, not assembled in a rush when interest arrives. The Player Profile is a one-page document covering academic standing, physical measurements, position, competitive level, and a three-sentence development narrative that tells a program what the player is being built for. The Film Archive must be organized by context (showcase, AAU, high school, practice) and include both highlights and evaluation film — programs want to see how a player performs in full-game context, not just best moments. The Metric Snapshot pulls the player's current benchmark data, assessment ratings, and IDP progress into a format a college coach can interpret in 90 seconds. The power of the HoopsOS recruiting hub is that all three components update continuously from your existing coaching work — the assessment you run today becomes part of the recruiting file tomorrow.",
      },
      {
        id: "dm_05_rec_s3",
        type: "examine",
        title: "Your Recruiting-Ready Players",
        body: "Open the Recruiting Hub and filter your roster for players within 18 months of their primary recruiting window. For each, check the completeness of their three-component file. The most common gaps are: film archive not organized by context, assessment data more than 60 days old, and no current narrative connecting development trajectory to competitive readiness. For each gap, estimate how long it would take to fill — because when a program expresses interest, you have 24–48 hours to respond with a complete file before the window closes.",
      },
      {
        id: "dm_05_rec_s4",
        type: "apply",
        title: "Build One Complete Recruiting File",
        body: "Select one player in their primary recruiting window and complete all three components of their recruiting file. Write the development narrative with a specific program-type in mind — what a D1 program is looking for is different from what a D2 program or a top prep school wants to hear. Export the film highlight reel using the platform's film tools. Run a benchmark comparison and include the relevant position peer data in the metric snapshot.",
        platformAction:
          "Open the Recruiting Hub, complete the player profile, film archive, and metric snapshot for one player, and draft the outreach summary for one target program.",
      },
      {
        id: "dm_05_rec_s5",
        type: "reflect",
        title: "Development vs. Exposure",
        body: "The most important question in player recruiting readiness is one most coaches avoid: are you building this player for the next level, or are you exposing them to the next level before they're built? Those are very different coaching philosophies with very different outcomes — one results in a player who earns an opportunity and grows into it; the other results in a player who gets looks they can't capitalize on and loses confidence in the process. Where does your current approach sit, and is it the approach that serves each player's actual trajectory?",
      },
    ],
  },

  {
    id: "dm_06_culture",
    title: "Team Culture Building",
    subtitle: "Creating the environment where development actually happens",
    pathId: "development",
    order: 6,
    estimatedMinutes: 30,
    category: "leadership",
    platformDeliverable:
      "Write your program's culture definition — three to five behavioral standards, how they're co-owned with players, and how they're enforced consistently.",
    sections: [
      {
        id: "dm_06_culture_s1",
        type: "frame",
        title: "The Team That Works Hard for No One",
        body: "You've seen it: a roster full of talented, hardworking players who somehow underperform relative to their individual ability every time they compete together. The X's and O's are fine. The individual skills are real. But something in the collective environment is extracting effort and draining cohesion. Culture isn't a motivational poster or a team motto — it's the operating system that determines whether individual talent becomes collective performance, and whether development happens in an environment of psychological safety or self-protection.",
      },
      {
        id: "dm_06_culture_s2",
        type: "concept",
        title: "The Four Pillars of a Development Culture",
        body: "A development culture is built on four interdependent pillars: Psychological Safety — players must believe that attempting a new skill in practice and failing is safer than defaulting to what they know; without this, no real skill acquisition occurs. Shared Standards — the behavioral commitments of the program are specific, publicly known, consistently enforced, and co-owned by players rather than handed down from above. Recognition Architecture — the program has explicit, regular ways of recognizing growth behavior, not just performance outcomes; this shapes what players believe the program values. Challenge-Support Balance — the environment pushes players to uncomfortable growth edges while simultaneously providing the relational support that makes discomfort tolerable. Programs that have the challenge without the support produce burnout; programs that have the support without the challenge produce comfortable underachievers.",
      },
      {
        id: "dm_06_culture_s3",
        type: "examine",
        title: "What Your Culture Actually Rewards",
        body: "The most revealing culture diagnostic isn't your team handbook — it's what gets celebrated and what gets ignored in your daily program environment. What behaviors receive the most visible recognition from you? What behaviors do players know you'll overlook when winning is on the line? The gap between what a program says it values and what its daily environment actually rewards is where culture either holds or fractures. Be honest about that gap in your program right now.",
      },
      {
        id: "dm_06_culture_s4",
        type: "apply",
        title: "Write Your Program Culture Definition",
        body: "In your coaching journal, write a culture definition for your program with three to five specific behavioral standards — not values (honesty, commitment) but observable behaviors (every player gets to practice five minutes early, every criticism of a teammate in practice is followed by one statement of support, every film review is completed within 48 hours of the session upload). For each standard, write how you'll co-own it with players, how you'll track it, and what happens — specifically and consistently — when it isn't met.",
        platformAction:
          "Write your program's culture definition in the Coaching Journal — behavioral standards, co-ownership process, and enforcement commitment.",
      },
      {
        id: "dm_06_culture_s5",
        type: "reflect",
        title: "The Culture You Inherited vs. The Culture You're Building",
        body: "Every coach either inherits a culture or builds one — and most do both, inheriting some things they want to keep and some they want to change. What's the one cultural element from a program or coach you've learned from that you've deliberately tried to carry forward? And what's the one cultural norm you've inherited — from a previous coach, a club culture, or your own playing experience — that you're actively trying to dismantle?",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Elite Path — 4 Modules
// ─────────────────────────────────────────────────────────────────────────────

const eliteModules: EducationModule[] = [
  {
    id: "em_01_analytics",
    title: "Program Analytics Mastery",
    subtitle: "Turning your platform data into a competitive development advantage",
    pathId: "elite",
    order: 1,
    estimatedMinutes: 45,
    category: "data",
    platformDeliverable:
      "Build a program analytics dashboard with at least 5 custom metrics that track the behaviors you've identified as most predictive of player development outcomes in your system.",
    sections: [
      {
        id: "em_01_analytics_s1",
        type: "frame",
        title: "The Coach Who Has All the Data and None of the Answers",
        body: "A platform that generates hundreds of data points per player per week can paradoxically make coaching decisions harder, not easier. When everything is measured, the signal-to-noise problem becomes the primary analytical challenge — not data collection. Elite coaches don't use more data than average coaches; they use more discriminating data, selecting and tracking the specific metrics they've identified as most predictive of the outcomes they're building toward. Analytics mastery is not about comprehensiveness — it's about ruthless, evidence-based selection.",
      },
      {
        id: "em_01_analytics_s2",
        type: "concept",
        title: "The Predictive Metric Framework",
        body: "Building an analytics system starts by identifying which behaviors in your program are most predictive of the developmental outcomes you care about — not which behaviors are most measurable. The framework has four steps: Outcome Definition (what specific player or program outcomes are you trying to produce?), Behavioral Hypothesis (what coaching and player behaviors do you theorize drive those outcomes?), Metric Selection (which measurable data points best represent those behaviors?), and Correlation Testing (over one to two seasons, which of your hypothesized behaviors actually correlate with your target outcomes?). The elite coach's advantage is that they've done this work explicitly — they know which three metrics in their system are the ones that actually matter, and they've stopped tracking the other forty.",
      },
      {
        id: "em_01_analytics_s3",
        type: "examine",
        title: "Your Highest-Correlation Behaviors",
        body: "Open the Analytics hub and run a correlation analysis between your top-performing players (by your own development criteria, not stats) and their behavioral data patterns over the last season. Look for the two or three behaviors that the players you're most proud of developing have in common — not genetic or physical, but behavioral and habitual. Those patterns are your program's actual development predictors. Everything else is noise that a less analytically mature coach is treating as signal.",
      },
      {
        id: "em_01_analytics_s4",
        type: "apply",
        title: "Build Your Custom Analytics Dashboard",
        body: "In the Analytics hub, create a custom dashboard that surfaces only the metrics you've identified as highest-correlation predictors in your program. For each metric, write a one-sentence hypothesis statement: 'I believe that [behavior] predicts [outcome] because [mechanism].' This forces intellectual honesty about why you're tracking what you're tracking. Set alert thresholds for when any player drops below your identified baseline in a predictive metric — these are your early intervention triggers.",
        platformAction:
          "Open the Analytics hub, create a custom dashboard with at least 5 predictive metrics, and set alert thresholds for each.",
      },
      {
        id: "em_01_analytics_s5",
        type: "reflect",
        title: "What You Believe vs. What the Data Shows",
        body: "Every experienced coach has strongly held beliefs about player development that feel intuitively correct and may or may not be supported by data. What's one coaching belief you've held for years that your own program data either confirms or contradicts? What would it take for data to change your mind about something you're currently very sure of — and what does your answer to that question tell you about your relationship with evidence?",
      },
    ],
  },

  {
    id: "em_02_staff",
    title: "Staff Cohort Leadership",
    subtitle: "Building a coaching staff that multiplies your development impact",
    pathId: "elite",
    order: 2,
    estimatedMinutes: 42,
    category: "leadership",
    platformDeliverable:
      "Complete a staff cohort review — assess each staff member's development focus, assign one learning module to each, and document the shared coaching philosophy your staff is aligned on.",
    sections: [
      {
        id: "em_02_staff_s1",
        type: "frame",
        title: "The Staff That Pulls in Three Directions",
        body: "You have three assistant coaches. One believes in high-volume repetition and structured drills. One believes in constraint-led, game-representative environments. One believes in player autonomy and self-directed practice. All three are coaching your players in the same program, sending contradictory signals about what good basketball is, how errors should be treated, and what the path to development looks like. Players who can read these contradictions — and the best players always can — either pick a coach to trust and ignore the others, or stop trusting any of them. Staff alignment isn't about everyone agreeing on everything; it's about everyone agreeing on what matters most.",
      },
      {
        id: "em_02_staff_s2",
        type: "concept",
        title: "The Alignment-Autonomy-Development Framework",
        body: "Great coaching staffs are built on three explicit agreements: Philosophical Alignment on the non-negotiables (what the program will always prioritize and how players will be treated), Methodological Autonomy within the aligned framework (how each coach teaches their area is their domain; how the program defines development is the head coach's domain), and Staff Development as an explicit responsibility (every assistant coach should be growing as a coach, and the head coach is responsible for designing that growth). The most common failure in staff building is creating alignment without autonomy — leading to assistants who execute instructions without developing their own coaching eye — or creating autonomy without alignment — leading to the three-direction problem described above.",
      },
      {
        id: "em_02_staff_s3",
        type: "examine",
        title: "Your Staff's Philosophical Coherence",
        body: "Ask each of your assistant coaches to independently write three sentences answering: 'What is this program trying to build in players, and how do we build it?' Compare the responses without attributing them. The degree of overlap tells you your current philosophical coherence. In most staffs, the non-attributed responses reveal significant divergence not in personality but in fundamental coaching philosophy — divergence the head coach often assumed wasn't there.",
      },
      {
        id: "em_02_staff_s4",
        type: "apply",
        title: "Run a Staff Cohort Review",
        body: "In the Staff Cohort hub, create a profile for each coaching staff member that includes their current development focus, their primary coaching methodology, and one module from the Education Hub you're assigning them based on a gap you've identified. Then write a shared coaching philosophy document — three to five sentences that every staff member's coaching must be consistent with. Share it with the staff and create a standing monthly check-in in the platform to review alignment.",
        platformAction:
          "Open the Staff Cohort hub, complete staff profiles, assign one education module to each staff member, and publish your shared coaching philosophy document.",
      },
      {
        id: "em_02_staff_s5",
        type: "reflect",
        title: "The Coach Who Made You Better",
        body: "Think about a coach — head coach, assistant coach, or mentor — who genuinely made you a better coach. What did they do specifically that developed you? Was it structured feedback, deliberate exposure to challenging situations, philosophical conversation, or something else? Now turn it around: what are you specifically doing to develop each coach on your staff, and is it working?",
      },
    ],
  },

  {
    id: "em_03_attribution",
    title: "Coaching Impact Attribution",
    subtitle: "Connecting your coaching behaviors to player outcomes with rigor and honesty",
    pathId: "elite",
    order: 3,
    estimatedMinutes: 38,
    category: "data",
    platformDeliverable:
      "Build your coaching impact report — identify three behaviors you believe drove measurable player outcomes this season and build the evidence case for each.",
    sections: [
      {
        id: "em_03_attr_s1",
        type: "frame",
        title: "Taking Credit Honestly",
        body: "When a player improves dramatically, how much of that improvement is your coaching and how much would have happened anyway? The honest answer is that nobody knows precisely — but the elite coach thinks carefully about this question rather than defaulting to full attribution in either direction. Attribution matters because misattribution leads to bad decisions: a coach who takes full credit for a natural talent's development may fail to replicate that development in less naturally gifted players; a coach who attributes all improvement to the player may not recognize which of their behaviors are actually driving outcomes.",
      },
      {
        id: "em_03_attr_s2",
        type: "concept",
        title: "The Attribution Evidence Framework",
        body: "Rigorous coaching impact attribution requires four types of evidence: Temporal Correlation (the player behavior change followed a specific coaching intervention within a plausible timeframe), Mechanism Logic (you can explain the specific pathway by which your intervention should have produced the outcome — not just that it did), Baseline Comparison (the player improved at a rate meaningfully beyond their established development trajectory, suggesting an external catalyst), and Specificity (the improvement is specific to the skills and behaviors you actually targeted, not a general performance upturn that could be explained by other factors). None of these is definitive alone; together, they constitute a credible attribution case.",
      },
      {
        id: "em_03_attr_s3",
        type: "examine",
        title: "Your Season's Coaching Interventions",
        body: "Review the significant coaching changes you made this season: curriculum adjustments, drill design changes, individual interventions, IDP rewrites, feedback approach shifts. For each, ask: did the targeted player or group show measurable improvement in the targeted area within a plausible timeframe? Can you trace the mechanism? Is the improvement beyond their baseline trajectory? Interventions that pass all three tests are your best attribution candidates.",
      },
      {
        id: "em_03_attr_s4",
        type: "apply",
        title: "Build Your Impact Report",
        body: "In the Impact Report tool, document three coaching behaviors from this season that you believe drove measurable player outcomes. For each, assemble the four-component evidence case: timeline of intervention, mechanism explanation, baseline comparison data, and specificity mapping. Be honest about where the evidence is weak and where it's strong — a credible impact report includes its own limitations, which makes the strong cases more credible, not less.",
        platformAction:
          "Open the Coaching Impact Report tool, document three attributed coaching-to-outcome connections with full evidence cases, and publish the report.",
      },
      {
        id: "em_03_attr_s5",
        type: "reflect",
        title: "What You'd Do Differently",
        body: "If you could redesign one coaching intervention from this season with the benefit of hindsight, what would you change? Not the outcome — the process: the timing, the approach, the dosage, the delivery. The coaches who improve the fastest are the ones who can evaluate their own interventions with the same rigor they'd apply to evaluating a player's development. What does your self-evaluation process look like right now, and is it honest enough to drive real improvement?",
      },
    ],
  },

  {
    id: "em_04_systemic",
    title: "Systemic Player Development",
    subtitle: "Building a program architecture where development is inevitable, not incidental",
    pathId: "elite",
    order: 4,
    estimatedMinutes: 50,
    category: "leadership",
    platformDeliverable:
      "Document your program's full development system — intake process, IDP architecture, assessment cadence, platform integration, and staff accountability structures.",
    sections: [
      {
        id: "em_04_sys_s1",
        type: "frame",
        title: "The Program Where Development Happens to Coaches Too",
        body: "The highest-functioning development programs share a characteristic that is rarely discussed: they're systems, not people. When the head coach is absent for a week, the development doesn't pause. When an assistant coach leaves, the new coach can step into a documented process and understand what the program is trying to build and how. When a player joins mid-season, there's an intake process that gets them into a development plan within two weeks. The program's development outcomes are not primarily a function of the head coach's individual brilliance — they're a function of a system that was intelligently designed and is consistently maintained.",
      },
      {
        id: "em_04_sys_s2",
        type: "concept",
        title: "The Six Components of a Development System",
        body: "A true development system has six documented, consistently executed components: Intake (how every new player is assessed, onboarded into an IDP, and introduced to the program's development philosophy within a defined window), Assessment Cadence (when and how skill assessments happen, who administers them, and how results feed into IDP updates), Coaching Accountability (how the head coach tracks that assistants are delivering coaching interventions as designed), Deliverable Architecture (what players are expected to produce — film uploads, WOD completion, journal entries — and what happens when they don't), Data Review Cadence (when coaching staff reviews platform data together, what decisions that review drives, and how those decisions are documented), and External Calibration (how the program compares its development outcomes against external benchmarks and updates its methods in response). Most programs have some of these; elite programs have all six.",
      },
      {
        id: "em_04_sys_s3",
        type: "examine",
        title: "The Gaps in Your Current System",
        body: "Evaluate your current program against the six components. Be specific: not 'we have an assessment process' but 'we assess twice per season, Coach Williams administers, results are in HoopsOS within 48 hours, and every assessment triggers an IDP review within one week.' Vague component descriptions reveal underdeveloped components. Which of your six components has the weakest documentation and the least consistent execution? That's where your system is most fragile — most dependent on a specific person doing the right thing rather than a process ensuring it happens.",
      },
      {
        id: "em_04_sys_s4",
        type: "apply",
        title: "Document Your Development System",
        body: "Write a full development system document for your program — six components, each with a specific description of how it works, who is responsible, what the timeline is, and how it connects to the platform. This document should be detailed enough that a new assistant coach hired tomorrow could read it and understand exactly how the program develops players. Save it to the platform as a living document with a quarterly review commitment.",
        platformAction:
          "Document your program's full six-component development system in the platform and publish it as a living document with a quarterly review date.",
      },
      {
        id: "em_04_sys_s5",
        type: "reflect",
        title: "The Legacy Question",
        body: "In ten years, when coaches who came through your program are coaching their own players, what will they say your program taught them? Not the skills, not the tactics — what will they say about how your program thought about development, how it treated players as individuals, and what it meant to be coached by a system that took every player seriously? That answer is your program's real legacy — and it's built one decision, one IDP, one conversation at a time.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Learning Paths
// ─────────────────────────────────────────────────────────────────────────────

export const learningPaths: LearningPath[] = [
  {
    id: "foundation",
    title: "Foundation Path",
    level: 1,
    description:
      "Nine focused modules covering the essential disciplines of player development — from writing goals that actually change behavior to communicating with parents under pressure. Each module connects directly to your work inside HoopsOS.",
    modules: foundationModules,
    credentialTitle: "HoopsOS Foundation Certificate",
  },
  {
    id: "development",
    title: "Development Path",
    level: 2,
    description:
      "Six modules for coaches who have mastered foundation systems and are ready to build sophisticated development architecture — from advanced film analysis and benchmark-driven goal setting to at-risk intervention and team culture design.",
    modules: developmentModules,
    credentialTitle: "HoopsOS Development Certificate",
  },
  {
    id: "elite",
    title: "Elite Path",
    level: 3,
    description:
      "Four master-level modules for coaches building programs where development is systematic and inevitable — analytics mastery, staff cohort leadership, coaching impact attribution, and full program system design.",
    modules: eliteModules,
    credentialTitle: "HoopsOS Elite Certificate",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat module array
// ─────────────────────────────────────────────────────────────────────────────

export const allModules: EducationModule[] = [
  ...foundationModules,
  ...developmentModules,
  ...eliteModules,
];

// ─────────────────────────────────────────────────────────────────────────────
// Contextual Triggers
// ─────────────────────────────────────────────────────────────────────────────

export const contextualTriggers: ContextualTrigger[] = [
  {
    id: "ct_assessments",
    triggerRoute: "/app/coach/assessments",
    moduleId: "fm_02_assessment",
    headline: "Turn your assessments into development fuel",
    body: "Observable, contextual skill ratings drive IDP specificity. Learn the framework that makes assessments players believe in.",
    ctaLabel: "Skill Assessment Mastery →",
  },
  {
    id: "ct_practice",
    triggerRoute: "/app/coach/practice-plans",
    moduleId: "fm_03_practice",
    headline: "Structure beats effort in practice design",
    body: "The 4-block framework isn't a template — it's a cognitive map. Understand why order matters more than content.",
    ctaLabel: "Practice Design 101 →",
  },
  {
    id: "ct_film",
    triggerRoute: "/app/coach/film",
    moduleId: "fm_04_film",
    headline: "Timestamp notes have 3× more impact",
    body: "General film feedback gets ignored. Specific timestamp annotations get replayed. Learn the technique in 22 minutes.",
    ctaLabel: "Film Review Fundamentals →",
  },
  {
    id: "ct_idp",
    triggerRoute: "/app/coach/players/:id/idp",
    moduleId: "fm_01_idp",
    headline: "IDPs without milestones complete 40% less often",
    body: "The 3-part goal formula — behavior, condition, standard — turns a development intention into something both coach and player can act on.",
    ctaLabel: "IDP Fundamentals →",
  },
  {
    id: "ct_readiness",
    triggerRoute: "/app/coach/readiness",
    moduleId: "fm_08_readiness",
    headline: "Readiness data is your early warning system",
    body: "A single low score is noise. A three-day trend is signal. Learn how to read the four readiness domains before they become problems.",
    ctaLabel: "Readiness Monitoring →",
  },
  {
    id: "ct_at_risk",
    triggerRoute: "/app/coach/at-risk",
    moduleId: "dm_04_at_risk",
    headline: "At-risk players fade slowly — catch it early",
    body: "The signal is never one behavior — it's a cluster of changes from a personal baseline. Learn the framework that opens the right conversation.",
    ctaLabel: "At-Risk Intervention →",
  },
  {
    id: "ct_recruiting",
    triggerRoute: "/app/coach/recruiting",
    moduleId: "dm_05_recruiting",
    headline: "The file should be ready before the call comes",
    body: "When a program expresses interest, you have 24–48 hours. Learn how to keep a complete recruiting file current from your daily coaching work.",
    ctaLabel: "Recruiting Readiness →",
  },
  {
    id: "ct_benchmarks",
    triggerRoute: "/app/coach/benchmarks",
    moduleId: "dm_03_benchmarks",
    headline: "Development targets without context are just numbers",
    body: "Meaningful goals require four benchmark contexts. Learn to connect your players' current metrics to the competitive reality they're building toward.",
    ctaLabel: "Benchmarking & Positioning →",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Journal Prompts
// ─────────────────────────────────────────────────────────────────────────────

export const journalPrompts: JournalPrompt[] = [
  {
    id: "jp_01",
    moduleId: "fm_01_idp",
    prompt:
      "Think about a player you've coached who made a meaningful developmental leap. What made the difference — was it the right goal, the right moment, or the right level of specificity in how the goal was written?",
    category: "player-dev",
  },
  {
    id: "jp_02",
    moduleId: "fm_02_assessment",
    prompt:
      "Think about a player you believe has high potential that your current metrics don't fully capture. What assessment situation would you design to surface what you're seeing intuitively?",
    category: "player-dev",
  },
  {
    id: "jp_03",
    moduleId: "fm_03_practice",
    prompt:
      "Think about the best practice session you've ever run. Was it the content, or was it the structure and sequencing that made it work — and how would you replicate it?",
    category: "practice-design",
  },
  {
    id: "jp_04",
    moduleId: "fm_04_film",
    prompt:
      "Think about a player whose development stalled despite consistent practice. What would you have seen if you'd reviewed film with them — not for them, with them?",
    category: "film",
  },
  {
    id: "jp_05",
    moduleId: "fm_05_communication",
    prompt:
      "Think about a time you delivered corrective feedback that clearly didn't land. What was the context, and what would you do differently with the same observation now?",
    category: "communication",
  },
  {
    id: "jp_06",
    moduleId: "fm_07_parents",
    prompt:
      "Who is the parent on your current roster you find hardest to engage? What might they actually be afraid of — and how would reframing that shift your approach to the next interaction?",
    category: "communication",
  },
  {
    id: "jp_07",
    moduleId: "dm_04_at_risk",
    prompt:
      "Think about a player you've lost to the slow fade — who drifted out of the program before you recognized what was happening. What signals were there all along, and what would earlier intervention have required you to see?",
    category: "leadership",
  },
  {
    id: "jp_08",
    moduleId: "em_04_systemic",
    prompt:
      "In ten years, when coaches who came through your program are coaching their own players, what will they say your program taught them about how development actually works?",
    category: "leadership",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

export function getModule(id: string): EducationModule | undefined {
  return allModules.find((m) => m.id === id);
}

export function getPath(id: string): LearningPath | undefined {
  return learningPaths.find((p) => p.id === id);
}

export function getNextModule(_coachId?: string): EducationModule | undefined {
  // Return the first incomplete module in the foundation path
  const incomplete = foundationModules.find((m) => !m.completedAt);
  if (incomplete) return incomplete;
  // If foundation complete, return first development module
  return developmentModules[0];
}

export function getTriggerForRoute(route: string): ContextualTrigger | undefined {
  return contextualTriggers.find((t) => {
    // Allow :param segments to match
    const pattern = t.triggerRoute.replace(/:[^/]+/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(route);
  });
}
