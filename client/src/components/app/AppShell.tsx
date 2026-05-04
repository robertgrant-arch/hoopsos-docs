import { Link, useLocation } from "wouter";
import {
  Home,
  Dumbbell,
  UploadCloud,
  TrendingUp,
  Trophy,
  MessageSquare,
  ListChecks,
  Users,
  ClipboardList,
  Film,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Package,
  Radio,
  GraduationCap,
  CreditCard,
  Shield,
  Flag,
  Database,
  Activity,
  LogOut,
  User as UserIcon,
  Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_META, type Role } from "@/lib/mock/users";
import { Logo } from "@/components/brand/Logo";
import { useEffect } from "react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: Record<Role, NavItem[]> = {
  ATHLETE: [
    { href: "/app/player", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { href: "/app/player/workout", label: "Today's WOD", icon: <Dumbbell className="w-4 h-4" /> },
    { href: "/app/player/uploads", label: "Uploads", icon: <UploadCloud className="w-4 h-4" /> },
    { href: "/app/player/skills", label: "Skill Tracks", icon: <TrendingUp className="w-4 h-4" /> },
    { href: "/app/player/achievements", label: "Achievements", icon: <Trophy className="w-4 h-4" /> },
    { href: "/app/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/film/inbox", label: "Film Inbox", icon: <Film className="w-4 h-4" /> },
    { href: "/app/learn", label: "Learn", icon: <BookOpen className="w-4 h-4" /> },
    { href: "/app/live", label: "Live", icon: <Radio className="w-4 h-4" /> },
    { href: "/app/marketplace", label: "Marketplace", icon: <Package className="w-4 h-4" /> },
    { href: "/app/messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
  ],
  COACH: [
    { href: "/app/coach", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/app/coach/roster", label: "Roster", icon: <Users className="w-4 h-4" /> },
    { href: "/app/coach/queue", label: "Review Queue", icon: <ListChecks className="w-4 h-4" /> },
    { href: "/app/coach/assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
    { href: "/app/coach/practice-plans", label: "Practice Plans", icon: <Calendar className="w-4 h-4" /> },
    { href: "/app/coach/film", label: "Film Room", icon: <Film className="w-4 h-4" /> },
    { href: "/app/playbook", label: "Playbook Studio", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/app/coach/bookings", label: "Bookings", icon: <Calendar className="w-4 h-4" /> },
    { href: "/app/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { href: "/app/learn", label: "Coach Education", icon: <BookOpen className="w-4 h-4" /> },
  ],
  TEAM_ADMIN: [
    { href: "/app/team", label: "Org Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/app/team/teams", label: "Teams", icon: <Users className="w-4 h-4" /> },
    { href: "/app/team/roster", label: "All Athletes", icon: <UserIcon className="w-4 h-4" /> },
    { href: "/app/team/invite", label: "Invite", icon: <Users className="w-4 h-4" /> },
    { href: "/app/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/team/seats", label: "Seat Manager", icon: <Users className="w-4 h-4" /> },
    { href: "/app/team/settings", label: "Settings", icon: <Shield className="w-4 h-4" /> },
  ],
  EXPERT: [
    { href: "/app/expert", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/app/expert/offers", label: "Offers", icon: <Package className="w-4 h-4" /> },
    { href: "/app/expert/bookings", label: "Bookings", icon: <Calendar className="w-4 h-4" /> },
    { href: "/app/expert/payouts", label: "Payouts", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
  ],
  PARENT: [
    { href: "/app/parent", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { href: "/app/parent/child", label: "My Child", icon: <Heart className="w-4 h-4" /> },
    { href: "/app/parent/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
  ],
  SUPER_ADMIN: [
    { href: "/app/admin", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/app/admin/users", label: "Users", icon: <UserIcon className="w-4 h-4" /> },
    { href: "/app/admin/billing", label: "Billing & Revenue", icon: <CreditCard className="w-4 h-4" /> },
    { href: "/app/admin/experts", label: "Expert Verification", icon: <GraduationCap className="w-4 h-4" /> },
    { href: "/app/admin/moderation", label: "Moderation", icon: <Flag className="w-4 h-4" /> },
    { href: "/app/admin/audit", label: "Audit Log", icon: <Database className="w-4 h-4" /> },
    { href: "/app/admin/jobs", label: "AI Jobs", icon: <Activity className="w-4 h-4" /> },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [loc, navigate] = useLocation();

  useEffect(() => {
    if (!user) navigate("/sign-in");
  }, [user, navigate]);

  if (!user) return null;

  const meta = ROLE_META[user.role];
  const nav = NAV[user.role];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col h-screen sticky top-0">
        <div className="h-16 border-b border-border flex items-center px-4">
          <Logo size={32} />
        </div>

        <div className="px-3 py-4 border-b border-border">
          <div
            className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2"
            style={{ color: meta.color }}
          >
            {meta.label} · Signed in
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold shrink-0"
              style={{
                background: `${meta.color.replace("oklch(", "oklch(").replace(")", " / 0.18)")}`,
                color: meta.color,
                border: `1px solid ${meta.color.replace(")", " / 0.35)")}`,
              }}
            >
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user.handle}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {nav.map((item) => {
            const active =
              loc === item.href ||
              (item.href !== nav[0].href && loc.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Link href="/">
            <a className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              ← Back to marketing
            </a>
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-border">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="display text-3xl lg:text-4xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13.5px] text-muted-foreground mt-2 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
