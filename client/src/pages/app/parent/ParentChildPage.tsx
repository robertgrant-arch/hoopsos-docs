import {
  TrendingUp, Flame,
  Film, ClipboardList, Calendar,
  Lock, Info, Loader2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  useChildProfile, useChildDevelopment, useChildAttendance,
} from "@/lib/api/hooks/useParent";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                    */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
      <div
        className="font-mono text-[24px] font-bold leading-none"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Player header                                                                */
/* -------------------------------------------------------------------------- */

function PlayerHeader({ child }: { child: ReturnType<typeof useChildProfile>["data"] }) {
  if (!child) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-[17px] font-bold shrink-0 text-white"
        style={{ background: "oklch(0.72 0.18 290)" }}
      >
        {child.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[20px] font-bold leading-tight">{child.name}</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          #{child.jerseyNumber} · {child.position} · {child.team} · Class of {child.gradYear}
        </p>
        <p className="text-[12px] text-muted-foreground">Coach: {child.coachName}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Badge variant="secondary">Level {child.level}</Badge>
          <Badge variant="secondary">{child.xp.toLocaleString()} XP</Badge>
          <Badge variant="secondary" className="gap-1">
            <Flame className="w-3 h-3" style={{ color: "oklch(0.68 0.22 25)" }} />
            {child.streak}-day streak
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Development progress                                                         */
/* -------------------------------------------------------------------------- */

function DevelopmentSection({ items }: { items: ReturnType<typeof useChildDevelopment>["data"] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4" />
        <h3 className="font-semibold text-[14px]">Development Focus Areas</h3>
        <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          Coach-visible notes only
        </div>
      </div>

      <div className="space-y-4">
        {items.map((d, i) => (
          <div key={d.focusArea} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{d.focusArea}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {d.currentScore} / {d.targetScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.progressPct}%`,
                      background: i === 0 ? "oklch(0.68 0.22 25)" : i === 1 ? "oklch(0.75 0.12 140)" : "oklch(0.72 0.18 290)",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="ml-7 rounded-lg bg-muted/50 px-3 py-2 text-[11.5px] text-muted-foreground italic border-l-2 border-muted">
              Coach: &quot;{d.coachNote}&quot;
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
        Coach controls what progress details are shared with families. Full athlete metrics are visible only to the player and coaching staff.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Attendance summary                                                           */
/* -------------------------------------------------------------------------- */

function AttendanceSection({ records }: { records: ReturnType<typeof useChildAttendance>["data"] }) {
  const attendance = records ?? [];
  const attended = attendance.filter((a) => a.attended).length;
  const total = attendance.length;
  const excused = attendance.filter((a) => !a.attended && a.excused).length;
  const unexcused = attendance.filter((a) => !a.attended && !a.excused).length;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-[14px] mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Attendance (last 30 days)
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Attended" value={attended} sub={`of ${total}`} color="oklch(0.75 0.12 140)" />
        <StatCard label="Excused" value={excused} />
        <StatCard label="Unexcused" value={unexcused} color={unexcused > 0 ? "oklch(0.68 0.22 25)" : undefined} />
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "oklch(0.75 0.12 140)" }}
        />
      </div>

      <div className="space-y-1.5">
        {attendance.slice(0, 6).map((rec) => (
          <div key={rec.id} className="flex items-center gap-3 text-[12px]">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: rec.attended ? "oklch(0.75 0.12 140)" : rec.excused ? "oklch(0.78 0.17 75)" : "oklch(0.68 0.22 25)" }}
            />
            <span className="text-muted-foreground w-20 shrink-0">{formatDate(rec.date)}</span>
            <span className="flex-1 truncate">{rec.eventTitle}</span>
            <span
              className="shrink-0 font-medium"
              style={{ color: rec.attended ? "oklch(0.75 0.12 140)" : rec.excused ? "oklch(0.78 0.17 75)" : "oklch(0.68 0.22 25)" }}
            >
              {rec.attended ? "Present" : rec.excused ? "Excused" : "Absent"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Film summary (read-only hint)                                               */
/* -------------------------------------------------------------------------- */

function FilmSummary() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-[14px] mb-3 flex items-center gap-2">
        <Film className="w-4 h-4" /> Film Feedback
      </h3>
      <div className="space-y-2.5">
        {[
          { title: "vs. Barnegat — defensive review", date: "May 10", grade: "Good" },
          { title: "Post entry series — footwork", date: "May 5", grade: "Needs work" },
          { title: "Shooting form analysis", date: "Apr 28", grade: "Improved" },
        ].map((clip) => (
          <div key={clip.title} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">{clip.title}</div>
              <div className="text-[11px] text-muted-foreground">{clip.date}</div>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] shrink-0"
              style={clip.grade === "Good" || clip.grade === "Improved"
                ? { color: "oklch(0.75 0.12 140)" }
                : { color: "oklch(0.72 0.17 75)" }}
            >
              {clip.grade}
            </Badge>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="w-3 h-3" />
        Full film and annotations are visible to the athlete only.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assignment summary                                                           */
/* -------------------------------------------------------------------------- */

function AssignmentSummary() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-[14px] mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4" /> Recent Assignments
      </h3>
      <div className="space-y-2">
        {[
          { title: "Watch vs. Barnegat defensive review", status: "Open", priority: true },
          { title: "Mikan Drill — 5×10 sets", status: "In progress", priority: false },
          { title: "Westbury Eagles plays quiz", status: "Open", priority: true },
          { title: "Active recovery session", status: "Submitted", priority: false },
        ].map((a) => (
          <div key={a.title} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: a.status === "Submitted"
                  ? "oklch(0.75 0.12 140)"
                  : a.priority ? "oklch(0.68 0.22 25)" : "oklch(0.72 0.17 75)",
              }}
            />
            <span className="flex-1 text-[12px] truncate">{a.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{a.status}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="w-3 h-3" />
        Full assignment details are visible to the athlete.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentChildPage() {
  const { user } = useAuth();
  const playerId = user?.linkedChildId ?? "";

  const { data: child, isLoading: loadingChild } = useChildProfile(playerId);
  const { data: development, isLoading: loadingDev } = useChildDevelopment(playerId);
  const { data: attendance, isLoading: loadingAtt } = useChildAttendance(playerId);

  const isLoading = loadingChild || loadingDev || loadingAtt;

  if (!playerId) {
    return (
      <AppShell>
        <PageHeader eyebrow="My Child" title="Athlete Profile" />
        <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
          <p className="font-semibold">No linked athlete</p>
          <p className="text-[12px] text-muted-foreground">Contact your program administrator to link your athlete account.</p>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="My Child" title="Athlete Profile" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="My Child"
        title={child?.name ?? "Athlete Profile"}
        subtitle={child ? `${child.team} · ${child.position} · Class of ${child.gradYear}` : undefined}
      />

      <div className="space-y-5">
        <PlayerHeader child={child} />

        <div className="grid lg:grid-cols-2 gap-5">
          <DevelopmentSection items={development} />
          <AttendanceSection records={attendance} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <FilmSummary />
          <AssignmentSummary />
        </div>
      </div>
    </AppShell>
  );
}
