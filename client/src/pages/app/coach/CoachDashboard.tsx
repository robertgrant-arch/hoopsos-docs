import { useState } from "react";
import { Link } from "wouter";
import {
  Users,
  ListChecks,
  AlertTriangle,
  Film,
  Calendar,
  ClipboardList,
  ChevronRight,
  Sparkles,
  Flame,
  MessageSquare,
  ArrowUpDown,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { roster, athleteUploads, filmRoom } from "@/lib/mock/data";

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  icon,
  accent = "default",
}: {
  label: string;
  value: number;
  trend?: string;
  icon?: React.ReactNode;
  accent?: "default" | "primary" | "indigo" | "success" | "danger";
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "indigo"
        ? "text-[oklch(0.72_0.18_290)]"
        : accent === "success"
          ? "text-[oklch(0.75_0.18_150)]"
          : accent === "danger"
            ? "text-[oklch(0.68_0.22_25)]"
            : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[12px] uppercase tracking-[0.07em] font-semibold">{label}</span>
        {icon && <span className={accentClass}>{icon}</span>}
      </div>
      <div className={`font-mono text-[28px] font-bold leading-none ${accentClass}`}>{value}</div>
      {trend && <div className="text-[11.5px] text-muted-foreground">{trend}</div>}
    </div>
  );
}

function Legend({ c, label }: { c: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${c}`} />
      {label}
    </span>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <a className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px]">
        <span className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          {label}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </a>
    </Link>
  );
}

function complianceColor(c: number) {
  return c === 100 ? "text-[oklch(0.65_0.18_150)]" : c >= 70 ? "text-[oklch(0.72_0.17_75)]" : c >= 40 ? "text-[oklch(0.68_0.2_60)]" : "text-[oklch(0.65_0.2_25)]";
}

function InitialsAvatar({ initials, className = "bg-primary/15 text-primary" }: { initials: string; className?: string }) {
  return (
    <span className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${className}`}>
      {initials}
    </span>
  );
}

// 7 inline SVG dots representing Mon–Sun activity based on streak
function StreakDots({ streak }: { streak: number }) {
  const days = 7;
  const filled = Math.min(streak, days);
  const width = (days - 1) * 14 + 10;
  return (
    <svg width={width} height={10} aria-label={`${streak}-day streak`}>
      {Array.from({ length: days }).map((_, i) => {
        const active = i >= days - filled;
        return (
          <circle
            key={i}
            cx={5 + i * 14}
            cy={5}
            r={4}
            fill={active ? "oklch(0.65 0.18 150)" : "oklch(0.22 0.005 260)"}
          />
        );
      })}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CoachDashboard() {
  const [streakSort, setStreakSort] = useState(false);

  const compliant = roster.filter((a) => a.compliance >= 80).length;
  const overdue = roster.filter((a) => a.compliance < 50).length;
  const pendingReviews = athleteUploads.filter((u) => u.status !== "COACH_REVIEWED").length;

  const atRisk = roster.filter((a) => a.compliance < 50 || a.streak === 0);

  const streakLeaders = [...roster]
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  const streakTableData = [...roster].sort((a, b) =>
    streakSort ? b.streak - a.streak : b.compliance - a.compliance,
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ · Varsity"
          title="Standardize excellence."
          subtitle="Your team's daily health at a glance. Actionable queues, not passive dashboards."
          actions={
            <Link href="/app/coach/assignments">
              <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                <ClipboardList className="w-4 h-4" /> New Assignment
              </a>
            </Link>
          }
        />

        {/* Stat Cards */}
        <div className="grid md:grid-cols-4 gap-3 mb-10">
          <StatCard
            label="Roster"
            value={roster.length}
            trend={`${compliant} compliant today`}
            accent="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Pending Review"
            value={pendingReviews}
            trend="Queue priority-sorted"
            accent="indigo"
            icon={<ListChecks className="w-4 h-4" />}
          />
          <StatCard
            label="At-Risk"
            value={overdue}
            trend="<50% compliance today"
            accent="danger"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <StatCard
            label="Film Assigned"
            value={filmRoom.clips.length}
            trend="Due-date tracking live"
            icon={<Film className="w-4 h-4" />}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2-col area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compliance Grid */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="display text-[17px]">Today's Compliance Grid</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    WOD completion · live as athletes finish
                  </p>
                </div>
                <Link href="/app/coach/roster">
                  <a className="text-[12px] text-muted-foreground hover:text-foreground">
                    Full roster →
                  </a>
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2 p-4">
                {roster.map((a) => {
                  const color =
                    a.compliance === 100
                      ? "bg-[oklch(0.55_0.18_150)] text-white"
                      : a.compliance >= 70
                        ? "bg-[oklch(0.72_0.17_75)] text-black"
                        : a.compliance >= 40
                          ? "bg-[oklch(0.68_0.2_60)] text-black"
                          : "bg-[oklch(0.55_0.2_25)] text-white";
                  return (
                    <div
                      key={a.id}
                      className={`${color} rounded-md p-3 text-[11.5px] leading-tight relative overflow-hidden hover:brightness-110 transition cursor-pointer`}
                      title={`${a.name} · ${a.compliance}% today`}
                    >
                      <div className="font-bold text-[13px]">{a.initials}</div>
                      <div className="opacity-85 truncate">{a.name.split(" ")[1]}</div>
                      <div className="absolute bottom-1 right-2 font-mono text-[10px] opacity-90">
                        {a.compliance}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
                <Legend c="bg-[oklch(0.55_0.18_150)]" label="100%" />
                <Legend c="bg-[oklch(0.72_0.17_75)]" label="70–99%" />
                <Legend c="bg-[oklch(0.68_0.2_60)]" label="40–69%" />
                <Legend c="bg-[oklch(0.55_0.2_25)]" label="<40%" />
              </div>
            </div>

            {/* 7-Day Streak History */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="display text-[17px]">7-Day Streak History</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Rolling 7-day activity · current streaks
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] gap-1.5 text-muted-foreground"
                  onClick={() => setStreakSort((s) => !s)}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {streakSort ? "Sort: Streak" : "Sort: Compliance"}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-[0.06em]">
                      <th className="text-left px-5 py-2.5 font-semibold">Athlete</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Pos</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Streak</th>
                      <th className="text-left px-3 py-2.5 font-semibold">
                        <div className="font-mono tracking-widest text-[9px] opacity-70 mb-0.5">
                          M T W T F S S
                        </div>
                        7 Days
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold">Today</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streakTableData.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <InitialsAvatar initials={a.initials} />
                            <span className="font-medium">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                            {a.position}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 font-mono">
                          <span className="flex items-center gap-1 text-[oklch(0.75_0.18_60)]">
                            🔥 {a.streak}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <StreakDots streak={a.streak} />
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          <span className={complianceColor(a.compliance)}>{a.compliance}%</span>
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground text-[11.5px]">
                          {a.lastActive}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-3">
            {/* Flagged for Review */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3">Flagged for Review</h3>
              <div className="space-y-3">
                {athleteUploads
                  .filter((u) => u.status !== "COACH_REVIEWED")
                  .slice(0, 3)
                  .map((u) => (
                    <Link key={u.id} href={`/app/coach/queue/${u.id}`}>
                      <a className="block p-3 rounded-md bg-[oklch(0.15_0.005_260)] hover:bg-muted transition">
                        <div className="flex items-start gap-2.5">
                          <Film className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{u.title}</div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                              <span className="font-mono">
                                AI {(u.aiConfidence * 100).toFixed(0)}%
                              </span>
                              <span>·</span>
                              <span>{u.issues.length} issues</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
              </div>
              <Link href="/app/coach/queue">
                <a className="block text-center mt-3 py-2 text-[12px] text-primary hover:bg-primary/10 rounded-md transition">
                  Open full queue →
                </a>
              </Link>
            </div>

            {/* At-Risk Players */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3">At-Risk Players</h3>
              {atRisk.length === 0 ? (
                <div className="flex items-center gap-2 text-[13px] text-[oklch(0.65_0.18_150)] py-1">
                  <span className="text-base">✓</span>
                  All players on track today
                </div>
              ) : (
                <div className="space-y-2">
                  {atRisk.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-[oklch(0.15_0.005_260)]"
                    >
                      <InitialsAvatar initials={a.initials} className="bg-[oklch(0.55_0.2_25)]/20 text-[oklch(0.65_0.2_25)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {a.lastActive} · {a.compliance}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10.5px] shrink-0"
                        onClick={() => toast.success(`Nudge sent to ${a.name}`)}
                      >
                        Nudge
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Streak Leaders */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3">Streak Leaders</h3>
              <div className="space-y-2">
                {streakLeaders.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-md bg-[oklch(0.15_0.005_260)]"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground w-4 text-center shrink-0">
                      {i + 1}
                    </span>
                    <InitialsAvatar initials={a.initials} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium truncate">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.position}</div>
                    </div>
                    <span className="font-mono text-[12px] text-[oklch(0.75_0.18_60)] shrink-0 flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />
                      {a.streak}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3">Quick Actions</h3>
              <QuickAction
                href="/app/coach/assignments"
                icon={<ClipboardList className="w-4 h-4" />}
                label="Assign Workout"
              />
              <QuickAction
                href="/app/coach/practice-plans"
                icon={<Calendar className="w-4 h-4" />}
                label="Build Practice Plan"
              />
              <QuickAction
                href="/app/film"
                icon={<Film className="w-4 h-4" />}
                label="Upload Game Film"
              />
              <QuickAction
                href="/app/playbook"
                icon={<Sparkles className="w-4 h-4" />}
                label="Design a Play"
              />
              <QuickAction
                href="/app/coach/messages"
                icon={<MessageSquare className="w-4 h-4" />}
                label="Messages"
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
