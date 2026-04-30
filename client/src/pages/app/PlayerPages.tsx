import { Link, useRoute } from "wouter";
import { useState } from "react";
import {
  Play,
  Upload,
  Sparkles,
  Flame,
  TrendingUp,
  Trophy,
  CheckCircle2,
  Clock,
  Circle,
  Target,
  MessageSquare,
  Film,
  ArrowRight,
  ChevronRight,
  Bell,
  Star,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import {
  todaysWod,
  skillTracks,
  achievements,
  athleteUploads,
  filmRoom,
  notifications,
  type VideoUpload,
} from "@/lib/mock/data";

/* ----------------------------- Shared primitives ----------------------------- */

function StatCard({
  label,
  value,
  trend,
  icon,
  accent = "default",
}: {
  label: string;
  value: React.ReactNode;
  trend?: string;
  icon: React.ReactNode;
  accent?: "default" | "primary" | "indigo" | "flame";
}) {
  const colors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    indigo: "text-[oklch(0.72_0.18_290)]",
    flame: "text-[oklch(0.72_0.2_50)]",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          {label}
        </div>
        <div className={`${colors[accent]}`}>{icon}</div>
      </div>
      <div className="display text-3xl leading-none">{value}</div>
      {trend && (
        <div className="text-[12px] text-muted-foreground mt-2">{trend}</div>
      )}
    </div>
  );
}

function ProgressRing({
  percent,
  size = 80,
  stroke = 6,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="oklch(0.28 0.01 260)"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="oklch(0.78 0.17 75)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {label}
      </div>
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

export function PlayerDashboard() {
  const { user } = useAuth();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Player · Today"
          title={`Let's get it, ${user?.name.split(" ")[0]}.`}
          subtitle="Your daily blueprint is ready. Hit your WOD, log film, stack reps."
          actions={
            <Link href="/app/messages">
              <a className="relative inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-[13px] hover:bg-muted transition">
                <Bell className="w-4 h-4" />
                Inbox
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </a>
            </Link>
          }
        />

        {/* Hero stats */}
        <div className="grid md:grid-cols-4 gap-3 mb-10">
          <StatCard
            label="Level"
            value={user?.level ?? "—"}
            trend="+240 XP today"
            accent="primary"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            label="Streak"
            value={<span>{user?.streak ?? 0}<span className="text-base font-normal text-muted-foreground ml-1">days</span></span>}
            trend="🔥 Protected — keep it alive"
            accent="flame"
            icon={<Flame className="w-4 h-4" />}
          />
          <StatCard
            label="XP Total"
            value={user?.xp?.toLocaleString() ?? "0"}
            trend="Next level at 3,000"
            icon={<Target className="w-4 h-4" />}
          />
          <StatCard
            label="Today's WOD"
            value="Ready"
            trend="28 min · 240 XP"
            accent="primary"
            icon={<Play className="w-4 h-4" />}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's WOD — centerpiece */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-[oklch(0.17_0.01_260)] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/3 p-7">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono mb-3">
                    Today's Blueprint · {todaysWod.category}
                  </div>
                  <h2 className="display text-3xl leading-tight mb-3">
                    {todaysWod.title}
                  </h2>
                  <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
                    {todaysWod.description}
                  </p>
                  <div className="flex items-center gap-5 mb-6 text-[13px]">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {todaysWod.durationMin} min
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="w-3.5 h-3.5" /> Level {todaysWod.level}
                    </span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <Sparkles className="w-3.5 h-3.5" /> +{todaysWod.xp} XP
                    </span>
                  </div>
                  <Link href="/app/player/workout">
                    <a className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                      <Play className="w-4 h-4" /> Start Session
                    </a>
                  </Link>
                </div>
                <div className="md:w-1/3 border-l border-border bg-[oklch(0.15_0.01_260)] p-6">
                  <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
                    Drills · {todaysWod.drills.length}
                  </div>
                  <ol className="space-y-2 text-[12.5px]">
                    {todaysWod.drills.map((d, i) => (
                      <li key={d.id} className="flex items-start gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground w-4 shrink-0 pt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">
                          <span className="font-medium">{d.name}</span>
                          <span className="block text-muted-foreground text-[11.5px]">
                            {d.sets} × {d.reps}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Recent uploads */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="display text-xl">Recent uploads</h3>
                <Link href="/app/player/uploads">
                  <a className="text-[12.5px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>
              <div className="space-y-2">
                {athleteUploads.map((v) => (
                  <UploadRow key={v.id} upload={v} />
                ))}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Skill tracks */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="display text-[16px]">Skill Tracks</h3>
                <Link href="/app/player/skills">
                  <a className="text-[11px] text-muted-foreground hover:text-foreground">
                    Details →
                  </a>
                </Link>
              </div>
              <div className="space-y-3">
                {skillTracks.map((t) => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                      <span className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span className="font-medium">{t.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        L{t.level}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[oklch(0.28_0.01_260)] overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Film inbox preview */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="display text-[16px]">Film Assigned</h3>
                <Link href="/app/film/inbox">
                  <a className="text-[11px] text-muted-foreground hover:text-foreground">
                    All →
                  </a>
                </Link>
              </div>
              <div className="space-y-2.5">
                {filmRoom.clips.slice(0, 3).map((c) => (
                  <Link key={c.id} href={`/app/film/clips/${c.id}`}>
                    <a className="block rounded-md border border-border p-3 hover:border-primary/50 transition group">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="text-[12.5px] font-medium leading-tight group-hover:text-primary transition">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {c.duration}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{c.dueIn}</span>
                        {c.watchPercent > 0 ? (
                          <span className="text-primary font-mono">
                            {c.watchPercent}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not started</span>
                        )}
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent achievement */}
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-primary mb-2">
                <Trophy className="w-3.5 h-3.5" /> Achievement Unlocked
              </div>
              <div className="display text-[18px] mb-1">Iron Will</div>
              <p className="text-[12.5px] text-muted-foreground">
                14-day workout streak. The grind is the payoff.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Upload Row ----------------------------- */

function statusMeta(s: VideoUpload["status"]) {
  switch (s) {
    case "PROCESSING":
      return { label: "Processing…", color: "text-muted-foreground", bg: "bg-muted" };
    case "READY":
      return { label: "AI Feedback Ready", color: "text-primary", bg: "bg-primary/15" };
    case "LOW_CONFIDENCE":
      return { label: "Low Confidence · Coach Review", color: "text-[oklch(0.75_0.15_60)]", bg: "bg-[oklch(0.35_0.08_60)]" };
    case "COACH_REVIEWED":
      return { label: "Coach Reviewed", color: "text-[oklch(0.75_0.15_145)]", bg: "bg-[oklch(0.3_0.08_145)]" };
  }
}

function UploadRow({ upload }: { upload: VideoUpload }) {
  const s = statusMeta(upload.status);
  return (
    <Link href={`/app/player/uploads/${upload.id}`}>
      <a className="flex items-center gap-4 rounded-lg border border-border p-3 hover:border-primary/50 transition group">
        <div className="w-20 h-12 rounded bg-gradient-to-br from-[oklch(0.25_0.01_260)] to-[oklch(0.17_0.01_260)] flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-medium truncate group-hover:text-primary transition">
              {upload.title}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
              {upload.duration}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11.5px]">
            <span className={`px-2 py-0.5 rounded-full ${s.bg} ${s.color} font-medium`}>
              {s.label}
            </span>
            <span className="text-muted-foreground">{upload.uploadedAt}</span>
            {upload.issues.length > 0 && (
              <span className="text-muted-foreground">
                · {upload.issues.length} observations
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
      </a>
    </Link>
  );
}

/* ----------------------------- Workout ----------------------------- */

export function PlayerWorkout() {
  const [completed, setCompleted] = useState<string[]>([]);
  const toggle = (id: string) =>
    setCompleted((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const done = completed.length;
  const total = todaysWod.drills.length;
  const percent = (done / total) * 100;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[900px] mx-auto">
        <PageHeader
          eyebrow={`Today's WOD · ${todaysWod.category}`}
          title={todaysWod.title}
          subtitle={todaysWod.description}
        />

        <div className="flex items-center gap-6 mb-8">
          <ProgressRing
            percent={percent}
            size={80}
            label={
              <div>
                <div className="display text-xl">{done}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                  of {total}
                </div>
              </div>
            }
          />
          <div>
            <div className="display text-2xl mb-1">
              {done === total ? "🔥 Session crushed." : `${total - done} drills to go`}
            </div>
            <div className="text-[13px] text-muted-foreground">
              {todaysWod.durationMin} min · +{todaysWod.xp} XP on completion
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {todaysWod.drills.map((d, i) => {
            const isDone = completed.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggle(d.id)}
                className={`w-full flex items-center gap-4 rounded-lg border p-4 text-left transition ${
                  isDone
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="font-mono text-[12px] text-muted-foreground w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[14px] font-medium ${
                      isDone ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {d.name}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {d.sets} sets × {d.reps} · ~{d.duration} min
                  </div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">
                  {d.category}
                </span>
              </button>
            );
          })}
        </div>

        {done === total && (
          <div className="mt-8 rounded-xl border border-primary/40 bg-primary/10 p-6 text-center">
            <div className="display text-2xl mb-2 text-primary">🔥 Session Complete</div>
            <p className="text-[13.5px] text-muted-foreground mb-4">
              +{todaysWod.xp} XP earned. Streak protected. Don't stop.
            </p>
            <Link href="/app/player">
              <a className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                Back to dashboard
              </a>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ----------------------------- Uploads list ----------------------------- */

export function PlayerUploads() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Film · Personal uploads"
          title="Your uploads"
          subtitle="Submit video. AI reviews. Coach confirms. Stack the reps."
          actions={
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
              <Upload className="w-4 h-4" /> New upload
            </button>
          }
        />
        <div className="space-y-2">
          {athleteUploads.map((v) => (
            <UploadRow key={v.id} upload={v} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Upload detail ----------------------------- */

export function PlayerUploadDetail() {
  const [, params] = useRoute("/app/player/uploads/:id");
  const upload = athleteUploads.find((u) => u.id === params?.id);

  if (!upload) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8">
          <h1 className="display text-3xl">Upload not found</h1>
        </div>
      </AppShell>
    );
  }

  const s = statusMeta(upload.status);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
          <Link href="/app/player/uploads">
            <a className="hover:text-foreground">Uploads</a>
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{upload.title}</span>
        </div>

        <h1 className="display text-3xl mb-2">{upload.title}</h1>
        <div className="flex items-center gap-3 mb-6 text-[12.5px]">
          <span className={`px-2 py-0.5 rounded-full ${s.bg} ${s.color} font-medium`}>
            {s.label}
          </span>
          <span className="text-muted-foreground">
            {upload.duration} · uploaded {upload.uploadedAt}
          </span>
          <span className="text-muted-foreground">
            · AI confidence {(upload.aiConfidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video pane */}
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl border border-border bg-gradient-to-br from-[oklch(0.2_0.01_260)] to-[oklch(0.12_0.01_260)] flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 30% 50%, oklch(0.7 0.2 75 / 0.3), transparent 50%)",
                }}
              />
              <button className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition">
                <Play className="w-6 h-6 ml-1" />
              </button>
              {/* Fake timeline */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span>0:00</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 relative">
                  {upload.issues.map((iss, idx) => {
                    const pos = parseFloat(iss.timestamp.split(":")[1]) / 120;
                    return (
                      <div
                        key={idx}
                        className="absolute w-2 h-2 -top-0.5 rounded-full"
                        style={{
                          left: `${pos * 100}%`,
                          background:
                            iss.severity === "major"
                              ? "oklch(0.7 0.2 30)"
                              : "oklch(0.78 0.17 75)",
                        }}
                        title={`${iss.timestamp} · ${iss.category}`}
                      />
                    );
                  })}
                </div>
                <span>{upload.duration}</span>
              </div>
            </div>

            {/* AI observations */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="display text-lg">AI observations</h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  · model v2.1 · {(upload.aiConfidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <div className="space-y-2">
                {upload.issues.map((iss, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 flex gap-4"
                  >
                    <div className="font-mono text-[13px] text-primary shrink-0 w-10 pt-0.5">
                      {iss.timestamp}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground">
                          {iss.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            iss.severity === "major"
                              ? "bg-[oklch(0.3_0.1_30)] text-[oklch(0.8_0.15_30)]"
                              : "bg-[oklch(0.3_0.08_60)] text-[oklch(0.82_0.12_60)]"
                          }`}
                        >
                          {iss.severity}
                        </span>
                      </div>
                      <p className="text-[13px]">{iss.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 italic">
                AI observations are probabilistic — not a verdict. Your coach's review is canonical.
              </p>
            </div>
          </div>

          {/* Coach review sidebar */}
          <div>
            {upload.coachReview ? (
              <div className="rounded-xl border border-[oklch(0.72_0.18_290)]/40 bg-[oklch(0.72_0.18_290)]/5 p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-[oklch(0.72_0.18_290)] mb-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Coach Reviewed
                </div>
                <div className="text-[14px] font-semibold mb-2">
                  {upload.coachReview.coachName}
                </div>
                <p className="text-[13px] text-muted-foreground mb-4 italic leading-relaxed">
                  "{upload.coachReview.verdict}"
                </p>
                <div className="space-y-3 text-[12.5px]">
                  {upload.coachReview.comments.map((c, i) => (
                    <div key={i} className="border-l-2 border-[oklch(0.72_0.18_290)] pl-3">
                      <div className="font-mono text-[11px] text-[oklch(0.72_0.18_290)] mb-0.5">
                        @ {c.t}
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting Coach
                </div>
                <p className="text-[13px] text-muted-foreground">
                  AI has flagged this for Coach Reed's review. Typical turnaround: 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Skill Tracks ----------------------------- */

export function PlayerSkills() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Progression · Skill Tracks"
          title="Your five pillars"
          subtitle="Every WOD contributes XP to one or more tracks. Level up each skill independently."
        />
        <div className="grid md:grid-cols-2 gap-4">
          {skillTracks.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-3xl mb-1">{t.icon}</div>
                  <h3 className="display text-xl">{t.name}</h3>
                </div>
                <div className="text-right">
                  <div className="display text-3xl text-primary">L{t.level}</div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    {t.progress}% to L{t.level + 1}
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[oklch(0.28_0.01_260)] overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Achievements ----------------------------- */

export function PlayerAchievements() {
  const tierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "from-[oklch(0.55_0.14_50)] to-[oklch(0.4_0.1_50)]";
      case "silver":
        return "from-[oklch(0.75_0.01_260)] to-[oklch(0.55_0.01_260)]";
      case "gold":
        return "from-[oklch(0.78_0.17_75)] to-[oklch(0.6_0.15_75)]";
      case "platinum":
        return "from-[oklch(0.85_0.08_220)] to-[oklch(0.65_0.08_220)]";
      default:
        return "from-muted to-muted";
    }
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Progression · Achievements"
          title="The vault"
          subtitle="Milestones you've unlocked — and the ones still out there."
        />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-5 ${
                a.unlocked ? "border-primary/30" : "border-border opacity-50"
              } bg-card`}
            >
              <div
                className={`w-14 h-14 rounded-lg bg-gradient-to-br ${tierColor(a.tier)} flex items-center justify-center mb-4`}
              >
                {a.unlocked ? (
                  <Trophy className="w-6 h-6 text-background" />
                ) : (
                  <Star className="w-6 h-6 text-background/50" />
                )}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
                {a.tier}
              </div>
              <div className="display text-[17px] mb-1.5">{a.name}</div>
              <p className="text-[12.5px] text-muted-foreground mb-3">
                {a.description}
              </p>
              {a.unlocked ? (
                <div className="text-[11px] text-primary font-mono">
                  Unlocked · {a.unlockedAt}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground font-mono">Locked</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Messages (shared) ----------------------------- */

export function Messages() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Communication"
          title="Messages & Notifications"
          subtitle="Coach DMs, team broadcasts, system alerts."
        />
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link key={n.id} href={n.href}>
              <a
                className={`flex items-start gap-4 rounded-lg border p-4 transition ${
                  n.read
                    ? "border-border bg-card"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
                {n.read && <div className="w-2 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                      {n.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {n.createdAt}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-medium">{n.title}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">
                    {n.detail}
                  </div>
                </div>
                <Film className="w-4 h-4 text-muted-foreground mt-1" />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
