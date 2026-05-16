import { useState } from "react";
import {
  Users,
  Flame,
  CheckCircle2,
  Clock,
  MessageSquare,
  CalendarDays,
  Bell,
  Send,
  Award,
  CircleDot,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  name: string;
  role: "head_coach" | "assistant_coach" | "director";
  avatar: string;
  level: "foundation" | "development" | "elite";
  modulesCompleted: number;
  currentModule: string;
  lastActiveDate: string;
  educationStreak: number;
  credentialStatus: "none" | "in_progress" | "earned";
};

type DiscussionPost = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: { authorName: string; content: string; createdAt: string }[];
};

type SharedModule = {
  moduleId: string;
  moduleName: string;
  domain: string;
  coachesCompleted: string[];
  coachesInProgress: string[];
  discussion: DiscussionPost[];
};

type CohortCalibrationSession = {
  id: string;
  scheduledFor: string;
  clipTitle: string;
  playerName: string;
  status: "scheduled" | "in_progress" | "completed";
  participantIds: string[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STAFF: StaffMember[] = [
  {
    id: "c1",
    name: "Coach Marcus",
    role: "head_coach",
    avatar: "CM",
    level: "development",
    modulesCompleted: 7,
    currentModule: "Advanced Film Breakdown Techniques",
    lastActiveDate: "2026-05-14T09:15:00Z",
    educationStreak: 12,
    credentialStatus: "in_progress",
  },
  {
    id: "c2",
    name: "Coach Tanya",
    role: "assistant_coach",
    avatar: "CT",
    level: "foundation",
    modulesCompleted: 3,
    currentModule: "4-Block Practice Design",
    lastActiveDate: "2026-05-13T18:40:00Z",
    educationStreak: 5,
    credentialStatus: "in_progress",
  },
  {
    id: "c3",
    name: "Coach Devon",
    role: "assistant_coach",
    avatar: "CD",
    level: "foundation",
    modulesCompleted: 0,
    currentModule: "Introduction to Player Development",
    lastActiveDate: "2026-05-10T11:00:00Z",
    educationStreak: 0,
    credentialStatus: "none",
  },
];

const TOTAL_MODULES = 10;

const SHARED_MODULES: SharedModule[] = [
  {
    moduleId: "m1",
    moduleName: "The 3-Cue Rule",
    domain: "Coaching Communication",
    coachesCompleted: ["c1", "c2"],
    coachesInProgress: ["c3"],
    discussion: [
      {
        id: "d1",
        authorId: "c1",
        authorName: "Coach Marcus",
        content:
          "Finished this one last week. The 3-cue ceiling makes sense for younger players, but I've been wondering — do we actually need to enforce this with veterans who already have the motor pattern? When I'm coaching Brandon on his off-hand finish, three cues feels constraining.",
        createdAt: "2026-05-10T14:00:00Z",
        replies: [
          {
            authorName: "Coach Tanya",
            content:
              "I think the rule still applies, but the *which* cues changes. With experienced players you might choose one technical cue and two attention cues instead of all mechanics. The ceiling is about cognitive load, not skill level.",
            createdAt: "2026-05-11T09:30:00Z",
          },
          {
            authorName: "Coach Marcus",
            content:
              "That reframe actually helps. One mechanical, two attentional. I'm going to try that in Tuesday's session.",
            createdAt: "2026-05-11T10:45:00Z",
          },
        ],
      },
    ],
  },
  {
    moduleId: "m2",
    moduleName: "4-Block Practice Design",
    domain: "Practice Planning",
    coachesCompleted: ["c1"],
    coachesInProgress: ["c2"],
    discussion: [
      {
        id: "d2",
        authorId: "c2",
        authorName: "Coach Tanya",
        content:
          "Okay, I'll be honest — I've ended practice with conditioning for three years straight. Moving it to Block 2 feels almost wrong. The kids expect it at the end. Anyone else wrestling with this habit?",
        createdAt: "2026-05-12T08:15:00Z",
        replies: [
          {
            authorName: "Coach Marcus",
            content:
              "Same. I ran it Block 2 once this season and three parents asked me why we 'went easy' at the end. But the data from the module is pretty clear — you get better skill retention when it's not the last thing they do. The perception problem is real though.",
            createdAt: "2026-05-12T11:00:00Z",
          },
        ],
      },
    ],
  },
  {
    moduleId: "m3",
    moduleName: "Film Feedback Language",
    domain: "Player Development",
    coachesCompleted: ["c1", "c2", "c3"],
    coachesInProgress: [],
    discussion: [
      {
        id: "d3",
        authorId: "c1",
        authorName: "Coach Marcus",
        content:
          "Started using timestamps in my verbal feedback this week. Instead of 'your footwork was off,' I said 'watch 1:42 in Tuesday's clip — your plant foot drifts left before the drive.' Night and day difference in how Malik received it. Specific evidence, not opinion.",
        createdAt: "2026-05-08T16:30:00Z",
        replies: [
          {
            authorName: "Coach Tanya",
            content:
              "I started doing this for the point guards and Jaylen actually asked to review his own clips after practice. First time that's happened all season.",
            createdAt: "2026-05-09T07:45:00Z",
          },
          {
            authorName: "Coach Devon",
            content:
              "Going to try this with the 15U group — they tend to argue when it's just a coach saying something. Can't argue with the footage.",
            createdAt: "2026-05-09T12:00:00Z",
          },
        ],
      },
    ],
  },
  {
    moduleId: "m4",
    moduleName: "Differentiated Drill Design",
    domain: "Practice Planning",
    coachesCompleted: ["c1"],
    coachesInProgress: ["c2", "c3"],
    discussion: [],
  },
  {
    moduleId: "m5",
    moduleName: "Building Player Agency",
    domain: "Player Development",
    coachesCompleted: [],
    coachesInProgress: ["c1"],
    discussion: [],
  },
];

const CALIBRATION_SESSIONS: CohortCalibrationSession[] = [
  {
    id: "cal1",
    scheduledFor: "2026-05-17T10:00:00Z",
    clipTitle: "Brandon — Off-hand Finishing Drill",
    playerName: "Brandon Lee",
    status: "scheduled",
    participantIds: ["c1", "c2"],
  },
  {
    id: "cal2",
    scheduledFor: "2026-05-20T14:30:00Z",
    clipTitle: "Malik — Ball-screen Read, Game 7",
    playerName: "Malik Henderson",
    status: "scheduled",
    participantIds: ["c1", "c3"],
  },
  {
    id: "cal3",
    scheduledFor: "2026-05-10T10:00:00Z",
    clipTitle: "Jaylen — Pull-up Jumper, Practice",
    playerName: "Jaylen Scott",
    status: "completed",
    participantIds: ["c1", "c2"],
  },
];

const REFLECTION_PROMPT =
  "What's one practice habit you want to unify across the staff this month?";

const REFLECTION_RESPONSES: { coachId: string; coachName: string; content: string; submittedAt: string }[] = [
  {
    coachId: "c1",
    coachName: "Coach Marcus",
    content:
      "I want all three of us to start every practice with a 2-minute player check-in — not fitness, not skills, just 'how are you showing up today.' It costs almost nothing and changes the room.",
    submittedAt: "2026-05-13T08:00:00Z",
  },
  {
    coachId: "c2",
    coachName: "Coach Tanya",
    content:
      "Consistent debriefs. We end practice differently every time. I want us to pick a 3-question format and use it every session so players start internalizing self-evaluation.",
    submittedAt: "2026-05-13T19:30:00Z",
  },
];

// ─── Color / Label Helpers ────────────────────────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

function roleLabel(role: StaffMember["role"]): string {
  if (role === "head_coach") return "Head Coach";
  if (role === "director") return "Director";
  return "Assistant Coach";
}

function levelColor(level: StaffMember["level"]): string {
  if (level === "elite") return PRIMARY;
  if (level === "development") return SUCCESS;
  return WARNING;
}

function levelLabel(level: StaffMember["level"]): string {
  if (level === "elite") return "Elite";
  if (level === "development") return "Development";
  return "Foundation";
}

function credentialColor(status: StaffMember["credentialStatus"]): string {
  if (status === "earned") return SUCCESS;
  if (status === "in_progress") return PRIMARY;
  return MUTED;
}

function credentialLabel(status: StaffMember["credentialStatus"]): string {
  if (status === "earned") return "Credential Earned";
  if (status === "in_progress") return "Credential In Progress";
  return "No Credential";
}

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-12 h-12 text-[14px]" : size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-[12px]";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: `${PRIMARY}22`, color: PRIMARY, border: `1.5px solid ${PRIMARY}44` }}
    >
      {initials}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}

function CompletionPill({
  coachId,
  completed,
  inProgress,
}: {
  coachId: string;
  completed: string[];
  inProgress: string[];
}) {
  const done = completed.includes(coachId);
  const wip  = inProgress.includes(coachId);
  if (done) {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: `${SUCCESS}22`, border: `1.5px solid ${SUCCESS}` }}
        title="Completed"
      >
        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
      </div>
    );
  }
  if (wip) {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: `${PRIMARY}22`, border: `1.5px solid ${PRIMARY}` }}
        title="In Progress"
      >
        <CircleDot className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
      </div>
    );
  }
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ border: "1.5px solid oklch(0.35 0.01 260)" }}
      title="Not started"
    >
      <Circle className="w-3 h-3 text-muted-foreground opacity-40" />
    </div>
  );
}

function DomainTag({ domain }: { domain: string }) {
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{
        background: `${PRIMARY}14`,
        color: PRIMARY,
        border: `1px solid ${PRIMARY}30`,
      }}
    >
      {domain}
    </span>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function CohortHeader({ onSchedule }: { onSchedule: () => void }) {
  const totalCompleted = SHARED_MODULES.reduce(
    (sum, m) => sum + m.coachesCompleted.length,
    0,
  );
  const totalPossible = SHARED_MODULES.length * STAFF.length;
  const pct = Math.round((totalCompleted / totalPossible) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-foreground leading-tight">
            Barnegat Basketball Staff
          </h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            3 coaches · Spring 2026
          </p>
        </div>
        <button
          onClick={onSchedule}
          className="min-h-[44px] px-4 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shrink-0"
          style={{ background: PRIMARY, color: "#fff" }}
        >
          <CalendarDays className="w-4 h-4" />
          Schedule Calibration
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Shared curriculum progress</span>
          <span className="font-semibold" style={{ color: pct >= 70 ? SUCCESS : pct >= 40 ? WARNING : DANGER }}>
            {pct}% complete
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct >= 70 ? SUCCESS : pct >= 40 ? WARNING : DANGER,
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {totalCompleted} of {totalPossible} coach–module completions across {SHARED_MODULES.length} shared modules
        </p>
      </div>
    </div>
  );
}

function StaffGrid() {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-foreground mb-3">Staff Status</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAFF.map((coach) => {
          const lc = levelColor(coach.level);
          const cc = credentialColor(coach.credentialStatus);
          return (
            <div key={coach.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Avatar initials={coach.avatar} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-foreground truncate">{coach.name}</p>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
                    style={{ background: `${PRIMARY}14`, color: PRIMARY, border: `1px solid ${PRIMARY}30` }}
                  >
                    {roleLabel(coach.role)}
                  </span>
                </div>
              </div>

              {/* Level badge */}
              <div className="flex items-center gap-2">
                <span
                  className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${lc}18`, color: lc, border: `1px solid ${lc}35` }}
                >
                  {levelLabel(coach.level)} Level
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Module progress</p>
                <ProgressBar value={coach.modulesCompleted} max={TOTAL_MODULES} color={lc} />
              </div>

              {/* Current module */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Currently studying</p>
                <p className="text-[12px] text-foreground font-medium leading-snug">{coach.currentModule}</p>
              </div>

              {/* Activity row */}
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {relativeDate(coach.lastActiveDate)}
                </span>
                {coach.educationStreak > 0 ? (
                  <span className="flex items-center gap-1 font-semibold" style={{ color: WARNING }}>
                    <Flame className="w-3.5 h-3.5" />
                    {coach.educationStreak}d streak
                  </span>
                ) : (
                  <span className="text-muted-foreground">No streak</span>
                )}
              </div>

              {/* Credential */}
              <div
                className="flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: cc }}
              >
                <Award className="w-3.5 h-3.5" />
                {credentialLabel(coach.credentialStatus)}
              </div>

              {/* Nudge */}
              <button
                onClick={() =>
                  toast(`Nudge sent to ${coach.name}`, {
                    description: "They'll get a friendly reminder to continue their education.",
                  })
                }
                className="w-full min-h-[44px] rounded-lg border border-border text-[13px] font-semibold text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Nudge
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurriculumProgress() {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-foreground mb-3">Shared Curriculum</h3>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {SHARED_MODULES.map((mod) => {
          const totalDiscussion = mod.discussion.reduce(
            (sum, p) => sum + 1 + p.replies.length,
            0,
          );
          return (
            <div key={mod.moduleId} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{mod.moduleName}</p>
                <div className="mt-1">
                  <DomainTag domain={mod.domain} />
                </div>
              </div>
              {/* Coach pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                {STAFF.map((s) => (
                  <CompletionPill
                    key={s.id}
                    coachId={s.id}
                    completed={mod.coachesCompleted}
                    inProgress={mod.coachesInProgress}
                  />
                ))}
              </div>
              {/* Discussion badge */}
              {totalDiscussion > 0 && (
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                  style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                >
                  <MessageSquare className="w-3 h-3" />
                  {totalDiscussion}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-3">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" style={{ color: SUCCESS }} /> Complete</span>
        <span className="flex items-center gap-1"><CircleDot className="w-3 h-3" style={{ color: PRIMARY }} /> In progress</span>
        <span className="flex items-center gap-1"><Circle className="w-3 h-3 opacity-40" /> Not started</span>
      </p>
    </div>
  );
}

function DiscussionThreads() {
  const [activeTab, setActiveTab] = useState<string>(
    SHARED_MODULES.filter((m) => m.discussion.length > 0)[0]?.moduleId ?? "",
  );
  const [replies, setReplies] = useState<Record<string, string>>({});

  const modulesWithDiscussion = SHARED_MODULES.filter((m) => m.discussion.length > 0);
  const activeMod = modulesWithDiscussion.find((m) => m.moduleId === activeTab);

  function handleReply(postId: string) {
    const text = replies[postId]?.trim();
    if (!text) return;
    toast("Reply posted", { description: "Your response was added to the thread." });
    setReplies((prev) => ({ ...prev, [postId]: "" }));
  }

  return (
    <div>
      <h3 className="text-[15px] font-semibold text-foreground mb-3">Discussion Threads</h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {modulesWithDiscussion.map((m) => (
            <button
              key={m.moduleId}
              onClick={() => setActiveTab(m.moduleId)}
              className={`px-4 py-3 text-[12px] font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                activeTab === m.moduleId
                  ? "text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                activeTab === m.moduleId
                  ? { borderColor: PRIMARY, color: PRIMARY }
                  : {}
              }
            >
              {m.moduleName}
            </button>
          ))}
        </div>

        {/* Thread content */}
        {activeMod && (
          <div className="p-5 space-y-6">
            {activeMod.discussion.map((post) => (
              <div key={post.id} className="space-y-4">
                {/* Original post */}
                <div className="flex gap-3">
                  <Avatar
                    initials={STAFF.find((s) => s.id === post.authorId)?.avatar ?? "?"}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-foreground">{post.authorName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(post.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-foreground leading-relaxed">{post.content}</p>
                  </div>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="ml-10 space-y-3 border-l-2 border-border pl-4">
                    {post.replies.map((r, i) => (
                      <div key={i} className="flex gap-3">
                        <Avatar
                          initials={(r.authorName.split(" ").map((w) => w[0]).join("")).slice(0, 2).toUpperCase()}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-semibold text-foreground">{r.authorName}</span>
                            <span className="text-[11px] text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                          </div>
                          <p className="text-[13px] text-foreground leading-relaxed">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <div className="ml-10 flex gap-2">
                  <textarea
                    rows={2}
                    value={replies[post.id] ?? ""}
                    onChange={(e) =>
                      setReplies((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Add a reply…"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
                  />
                  <button
                    onClick={() => handleReply(post.id)}
                    className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: PRIMARY, color: "#fff" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReflectionPrompt() {
  const [response, setResponse] = useState("");
  const allResponded = REFLECTION_RESPONSES.length >= STAFF.length;
  const hoursOld =
    REFLECTION_RESPONSES.length > 0
      ? (Date.now() - new Date(REFLECTION_RESPONSES[0].submittedAt).getTime()) / (1000 * 60 * 60)
      : 0;
  const showResponses = allResponded || hoursOld >= 48;

  function handleSubmit() {
    if (!response.trim()) return;
    toast("Response submitted", { description: "Your reflection was added to this week's thread." });
    setResponse("");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${SUCCESS}20`, color: SUCCESS }}
        >
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground font-medium">Weekly Staff Reflection</p>
          <p className="text-[15px] font-semibold text-foreground mt-0.5 leading-snug">
            "{REFLECTION_PROMPT}"
          </p>
        </div>
      </div>

      {showResponses && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground">{REFLECTION_RESPONSES.length} of {STAFF.length} coaches responded</p>
          {REFLECTION_RESPONSES.map((r) => (
            <div key={r.coachId} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  initials={STAFF.find((s) => s.id === r.coachId)?.avatar ?? "?"}
                  size="sm"
                />
                <span className="text-[13px] font-semibold text-foreground">{r.coachName}</span>
                <span className="text-[11px] text-muted-foreground">{relativeDate(r.submittedAt)}</span>
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {!showResponses && REFLECTION_RESPONSES.length > 0 && (
        <p className="text-[12px] text-muted-foreground italic">
          {REFLECTION_RESPONSES.length} response{REFLECTION_RESPONSES.length !== 1 ? "s" : ""} locked until all coaches reply or 48 hours pass.
        </p>
      )}

      <div className="space-y-2">
        <textarea
          rows={3}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your response…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290/0.4)]"
        />
        <button
          onClick={handleSubmit}
          disabled={!response.trim()}
          className="min-h-[44px] px-5 rounded-lg text-[13px] font-semibold disabled:opacity-40 transition-opacity"
          style={{ background: PRIMARY, color: "#fff" }}
        >
          Submit your response
        </button>
      </div>
    </div>
  );
}

function CalibrationSessions({ onSchedule }: { onSchedule: () => void }) {
  const upcoming = CALIBRATION_SESSIONS.filter((s) => s.status !== "completed");
  const completed = CALIBRATION_SESSIONS.filter((s) => s.status === "completed");

  function sessionParticipants(ids: string[]): string {
    return ids.map((id) => STAFF.find((s) => s.id === id)?.name ?? id).join(" + ");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-foreground">Calibration Sessions</h3>
        <button
          onClick={onSchedule}
          className="min-h-[36px] px-3 rounded-lg border border-border text-[12px] font-semibold text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Schedule new
        </button>
      </div>

      <div className="space-y-3">
        {upcoming.map((session) => (
          <div key={session.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: session.status === "in_progress" ? `${WARNING}20` : `${PRIMARY}14`,
                color: session.status === "in_progress" ? WARNING : PRIMARY,
              }}
            >
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{session.clipTitle}</p>
              <p className="text-[12px] text-muted-foreground">
                {session.playerName} · {sessionParticipants(session.participantIds)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDateTime(session.scheduledFor)}
              </p>
            </div>
            <button
              onClick={() => toast(`Joining calibration session for ${session.playerName}`)}
              className="min-h-[36px] px-3 rounded-lg text-[12px] font-semibold shrink-0"
              style={{ background: PRIMARY, color: "#fff" }}
            >
              {session.status === "in_progress" ? "Join" : "View"}
            </button>
          </div>
        ))}

        {completed.length > 0 && (
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground font-medium">Completed</p>
            {completed.map((session) => (
              <div key={session.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 opacity-70">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: SUCCESS }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{session.clipTitle}</p>
                  <p className="text-[12px] text-muted-foreground">{session.playerName}</p>
                </div>
                <button
                  onClick={() => toast("Opening calibration results")}
                  className="min-h-[36px] px-3 rounded-lg border border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  View Results
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffCohortPage() {
  function handleScheduleCalibration() {
    toast("Calibration session scheduled", {
      description: "Staff will receive an invite with the clip attached.",
    });
  }

  return (
    <AppShell>
      <PageHeader title="Staff Cohort" />
      <div className="px-4 pb-24 space-y-6 max-w-4xl mx-auto">
        <CohortHeader onSchedule={handleScheduleCalibration} />
        <StaffGrid />
        <CurriculumProgress />
        <DiscussionThreads />
        <ReflectionPrompt />
        <CalibrationSessions onSchedule={handleScheduleCalibration} />
      </div>
    </AppShell>
  );
}
