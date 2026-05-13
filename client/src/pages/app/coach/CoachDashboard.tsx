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
  Heart,
  Moon,
  Zap,
  CheckCircle2,
  X,
  Star,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { roster, athleteUploads, filmRoom } from "@/lib/mock/data";

// ── Inline mock data ───────────────────────────────────────────────────────────

const READINESS = [
  { id: "r1", name: "J. Williams", initials: "JW", fatigue: 7, sleep: 5, soreness: 8, note: "knee feels tight", status: "flag" as const },
  { id: "r2", name: "M. Davis",    initials: "MD", fatigue: 4, sleep: 5, soreness: 6, note: "",                  status: "caution" as const },
];
const READINESS_TOTAL = 18;
const READINESS_SUBMITTED = 15;

const PRACTICE_PHASES = ["Warm-up", "Skill work", "5-on-5", "Film review"];

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
    accent === "primary"   ? "text-primary"
    : accent === "indigo"  ? "text-[oklch(0.72_0.18_290)]"
    : accent === "success" ? "text-[oklch(0.75_0.18_150)]"
    : accent === "danger"  ? "text-[oklch(0.68_0.22_25)]"
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

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
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
  return c === 100 ? "text-[oklch(0.65_0.18_150)]"
    : c >= 70 ? "text-[oklch(0.72_0.17_75)]"
    : c >= 40 ? "text-[oklch(0.68_0.2_60)]"
    : "text-[oklch(0.65_0.2_25)]";
}

function InitialsAvatar({ initials, className = "bg-primary/15 text-primary" }: { initials: string; className?: string }) {
  return (
    <span className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${className}`}>
      {initials}
    </span>
  );
}

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

function ReadinessPill({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-mono px-1.5 py-0.5 rounded ${warn ? "bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.7_0.2_25)]" : "bg-muted text-muted-foreground"}`}>
      {label} {value}
    </span>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={`w-5 h-5 transition-colors ${s <= value ? "fill-[oklch(0.72_0.17_75)] text-[oklch(0.72_0.17_75)]" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CoachDashboard() {
  const [streakSort, setStreakSort] = useState(false);
  const [showPracticePrompt, setShowPracticePrompt] = useState(true);
  const [practiceNotesOpen, setPracticeNotesOpen] = useState(false);
  const [phaseRatings, setPhaseRatings] = useState([0, 0, 0, 0]);
  const [practiceNotes, setPracticeNotes] = useState("");
  const [readinessDismissed, setReadinessDismissed] = useState<Set<string>>(new Set());

  const compliant = roster.filter((a) => a.compliance >= 80).length;
  const overdue = roster.filter((a) => a.compliance < 50).length;
  const pendingReviews = athleteUploads.filter((u) => u.status !== "COACH_REVIEWED").length;
  const atRisk = roster.filter((a) => a.compliance < 50 || a.streak === 0);
  const streakLeaders = [...roster].sort((a, b) => b.streak - a.streak).slice(0, 3);
  const streakTableData = [...roster].sort((a, b) =>
    streakSort ? b.streak - a.streak : b.compliance - a.compliance,
  );

  const visibleReadiness = READINESS.filter((r) => !readinessDismissed.has(r.id));
  const readinessFlags = visibleReadiness.filter((r) => r.status === "flag").length;
  const readinessCautions = visibleReadiness.filter((r) => r.status === "caution").length;

  function submitPracticeNotes() {
    setPracticeNotesOpen(false);
    setShowPracticePrompt(false);
    setPracticeNotes("");
    setPhaseRatings([0, 0, 0, 0]);
    toast.success("Practice notes saved");
  }

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

        {/* Post-practice prompt banner */}
        {showPracticePrompt && (
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-[oklch(0.72_0.17_75)]/30 bg-[oklch(0.72_0.17_75)]/5 px-5 py-3.5">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.17_75)] shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <span className="text-[13.5px] font-semibold">Practice ended 45 min ago</span>
              <span className="text-[13px] text-muted-foreground ml-2">How did it go? Leave notes while it's fresh.</span>
            </div>
            <Button
              size="sm"
              className="h-8 px-3 text-[12px] shrink-0"
              onClick={() => setPracticeNotesOpen(true)}
            >
              Leave Notes
            </Button>
            <button
              onClick={() => setShowPracticePrompt(false)}
              className="text-muted-foreground hover:text-foreground transition shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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

            {/* Readiness Check-ins */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="display text-[17px] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[oklch(0.68_0.22_25)]" />
                    Morning Readiness
                    {readinessFlags > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.7_0.2_25)]">
                        {readinessFlags} flag{readinessFlags > 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    6 AM check-ins · {READINESS_SUBMITTED} of {READINESS_TOTAL} submitted
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-[20px] font-bold">
                      {Math.round((READINESS_SUBMITTED / READINESS_TOTAL) * 100)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">submitted</div>
                  </div>
                </div>
              </div>

              {visibleReadiness.length === 0 ? (
                <div className="px-5 py-4 flex items-center gap-2 text-[13px] text-[oklch(0.65_0.18_150)]">
                  <CheckCircle2 className="w-4 h-4" />
                  All athletes cleared for full practice
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {visibleReadiness.map((r) => {
                    const isCritical = r.status === "flag";
                    return (
                      <div
                        key={r.id}
                        className={`px-5 py-3.5 flex items-center gap-3 ${isCritical ? "bg-[oklch(0.55_0.2_25)]/5" : ""}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? "bg-[oklch(0.55_0.2_25)]" : "bg-[oklch(0.72_0.17_75)]"}`}
                        />
                        <InitialsAvatar
                          initials={r.initials}
                          className={isCritical ? "bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.7_0.2_25)]" : "bg-[oklch(0.72_0.17_75)]/15 text-[oklch(0.65_0.17_75)]"}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium">{r.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <ReadinessPill label="Fatigue" value={`${r.fatigue}/10`} warn={r.fatigue >= 6} />
                            <ReadinessPill label="Sleep" value={`${r.sleep}h`} warn={r.sleep <= 5} />
                            <ReadinessPill label="Soreness" value={`${r.soreness}/10`} warn={r.soreness >= 7} />
                            {r.note && (
                              <span className="text-[11px] text-muted-foreground italic">"{r.note}"</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10.5px]"
                            onClick={() => toast.success(`Modified workout sent to ${r.name}`)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Modify WOD
                          </Button>
                          <button
                            onClick={() => setReadinessDismissed((s) => new Set([...s, r.id]))}
                            className="text-muted-foreground hover:text-foreground transition"
                            aria-label="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(readinessFlags > 0 || readinessCautions > 0) && visibleReadiness.length > 0 && (
                <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-[11.5px] text-muted-foreground">
                  {readinessFlags > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.2_25)]" />
                      {readinessFlags} flagged
                    </span>
                  )}
                  {readinessCautions > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.17_75)]" />
                      {readinessCautions} caution
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.18_150)]" />
                    {READINESS_SUBMITTED - READINESS.length} cleared
                  </span>
                </div>
              )}
            </div>

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
                    a.compliance === 100 ? "bg-[oklch(0.55_0.18_150)] text-white"
                    : a.compliance >= 70   ? "bg-[oklch(0.72_0.17_75)] text-black"
                    : a.compliance >= 40   ? "bg-[oklch(0.68_0.2_60)] text-black"
                    :                        "bg-[oklch(0.55_0.2_25)] text-white";
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
                        <div className="font-mono tracking-widest text-[9px] opacity-70 mb-0.5">M T W T F S S</div>
                        7 Days
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold">Today</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streakTableData.map((a) => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition">
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
                              <span className="font-mono">AI {(u.aiConfidence * 100).toFixed(0)}%</span>
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
                    <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-md bg-[oklch(0.15_0.005_260)]">
                      <InitialsAvatar initials={a.initials} className="bg-[oklch(0.55_0.2_25)]/20 text-[oklch(0.65_0.2_25)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.lastActive} · {a.compliance}%</div>
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
                  <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-md bg-[oklch(0.15_0.005_260)]">
                    <span className="font-mono text-[11px] text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
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
              <QuickAction href="/app/coach/assignments"    icon={<ClipboardList className="w-4 h-4" />} label="Assign Workout" />
              <QuickAction href="/app/coach/practice-plans" icon={<Calendar className="w-4 h-4" />}      label="Build Practice Plan" />
              <QuickAction href="/app/coach/film"           icon={<Film className="w-4 h-4" />}           label="Upload Game Film" />
              <QuickAction href="/app/playbook"             icon={<Sparkles className="w-4 h-4" />}       label="Design a Play" />
              <QuickAction href="/app/coach/messages"       icon={<MessageSquare className="w-4 h-4" />}  label="Messages" />
            </div>
          </div>
        </div>
      </div>

      {/* Post-Practice Notes Dialog */}
      <Dialog open={practiceNotesOpen} onOpenChange={setPracticeNotesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="display text-[18px]">Post-Practice Notes</DialogTitle>
            <p className="text-[12.5px] text-muted-foreground">
              Wednesday · Barnegat HS · 3:30 – 5:15 PM
            </p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <div className="text-[12px] uppercase tracking-[0.07em] font-semibold text-muted-foreground mb-3">
                Rate each phase
              </div>
              <div className="space-y-3">
                {PRACTICE_PHASES.map((phase, i) => (
                  <div key={phase} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-muted-foreground w-28 shrink-0">{phase}</span>
                    <StarRating
                      value={phaseRatings[i]}
                      onChange={(v) => setPhaseRatings((r) => r.map((x, j) => (j === i ? v : x)))}
                    />
                    <span className="text-[11px] font-mono text-muted-foreground w-6 text-right shrink-0">
                      {phaseRatings[i] > 0 ? `${phaseRatings[i]}/5` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] uppercase tracking-[0.07em] font-semibold text-muted-foreground block mb-2">
                Notes
              </label>
              <Textarea
                placeholder="Key observations, things to address tomorrow, standout moments..."
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                className="text-[13px] min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Moon className="w-3.5 h-3.5" />
              Notes sync to this practice plan and athlete timelines
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPracticeNotesOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitPracticeNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
