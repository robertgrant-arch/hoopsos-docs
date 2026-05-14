/**
 * AppShell — responsive app container for HoopsOS.
 *
 * Desktop (lg+):  Fixed 240px left sidebar with full nav.
 * Mobile (<lg):   No sidebar. Bottom tab bar with 4 primary items + More drawer.
 *
 * Safe-area insets are applied for iOS notch and home indicator via
 * env(safe-area-inset-*) so the app renders correctly in Capacitor.
 */
import { useState } from "react";
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
  Inbox,
  Target,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_META, type Role } from "@/lib/mock/users";
import { Logo } from "@/components/brand/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* -------------------------------------------------------------------------- */
/* Nav definitions                                                             */
/* -------------------------------------------------------------------------- */

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: Record<Role, NavItem[]> = {
  ATHLETE: [
    { href: "/app/player",              label: "Dashboard",      icon: <Home className="w-5 h-5" /> },
    { href: "/app/player/workout",      label: "Today's WOD",   icon: <Dumbbell className="w-5 h-5" /> },
    { href: "/app/player/uploads",      label: "Uploads",        icon: <UploadCloud className="w-5 h-5" /> },
    { href: "/app/player/skills",       label: "Skill Tracks",   icon: <TrendingUp className="w-5 h-5" /> },
    { href: "/app/player/development",  label: "My Development", icon: <Target className="w-5 h-5" /> },
    { href: "/app/player/wearables",    label: "Wearables",      icon: <Activity className="w-5 h-5" /> },
    { href: "/app/player/achievements", label: "Achievements",   icon: <Trophy className="w-5 h-5" /> },
    { href: "/app/player/plays",        label: "Study Plays",    icon: <BookOpen className="w-5 h-5" /> },
    { href: "/app/billing",             label: "Billing",        icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/film/inbox",          label: "Film Inbox",     icon: <Film className="w-5 h-5" /> },
    { href: "/app/learn",               label: "Learn",          icon: <BookOpen className="w-5 h-5" /> },
    { href: "/app/live",                label: "Live",           icon: <Radio className="w-5 h-5" /> },
    { href: "/app/marketplace",         label: "Marketplace",    icon: <Package className="w-5 h-5" /> },
    { href: "/app/messages",            label: "Messages",       icon: <MessageSquare className="w-5 h-5" /> },
  ],
  COACH: [
    { href: "/app/coach",               label: "Dashboard",      icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/coach/inbox",         label: "Inbox",          icon: <Inbox className="w-5 h-5" /> },
    { href: "/app/coach/roster",        label: "Roster",         icon: <Users className="w-5 h-5" /> },
    { href: "/app/coach/queue",         label: "Review Queue",   icon: <ListChecks className="w-5 h-5" /> },
    { href: "/app/coach/assignments",   label: "Assignments",    icon: <ClipboardList className="w-5 h-5" /> },
    { href: "/app/coach/wods",          label: "Daily WODs",     icon: <Dumbbell className="w-5 h-5" /> },
    { href: "/app/coach/practice-plans",label: "Practice Plans", icon: <Calendar className="w-5 h-5" /> },
    { href: "/app/coach/drills",        label: "Drill Library",  icon: <BookOpen className="w-5 h-5" /> },
    { href: "/app/coach/film",          label: "Film Room",      icon: <Film className="w-5 h-5" /> },
    { href: "/app/playbook",            label: "Playbook Studio",icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/coach/bookings",      label: "Bookings",       icon: <Calendar className="w-5 h-5" /> },
    { href: "/app/billing",             label: "Billing",        icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/messages",            label: "Messages",       icon: <MessageSquare className="w-5 h-5" /> },
    { href: "/app/learn",               label: "Coach Education",icon: <BookOpen className="w-5 h-5" /> },
  ],
  TEAM_ADMIN: [
    { href: "/app/team",           label: "Org Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/team/schedule",  label: "Schedule",      icon: <Calendar className="w-5 h-5" /> },
    { href: "/app/team/teams",     label: "Teams",         icon: <Users className="w-5 h-5" /> },
    { href: "/app/team/roster",    label: "All Athletes",  icon: <UserIcon className="w-5 h-5" /> },
    { href: "/app/team/invite",    label: "Invite",        icon: <Users className="w-5 h-5" /> },
    { href: "/app/billing",        label: "Billing",       icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/team/seats",     label: "Seat Manager",  icon: <Users className="w-5 h-5" /> },
    { href: "/app/team/settings",  label: "Settings",      icon: <Shield className="w-5 h-5" /> },
  ],
  EXPERT: [
    { href: "/app/expert",          label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/expert/offers",   label: "Offers",    icon: <Package className="w-5 h-5" /> },
    { href: "/app/expert/bookings", label: "Bookings",  icon: <Calendar className="w-5 h-5" /> },
    { href: "/app/expert/payouts",  label: "Payouts",   icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/messages",        label: "Messages",  icon: <MessageSquare className="w-5 h-5" /> },
  ],
  PARENT: [
    { href: "/app/parent",          label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { href: "/app/parent/child",    label: "My Child",  icon: <Heart className="w-5 h-5" /> },
    { href: "/app/parent/billing",  label: "Billing",   icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/messages",        label: "Messages",  icon: <MessageSquare className="w-5 h-5" /> },
  ],
  SUPER_ADMIN: [
    { href: "/app/admin",          label: "Overview",            icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/admin/users",    label: "Users",               icon: <UserIcon className="w-5 h-5" /> },
    { href: "/app/admin/billing",  label: "Billing & Revenue",   icon: <CreditCard className="w-5 h-5" /> },
    { href: "/app/admin/experts",  label: "Expert Verification", icon: <GraduationCap className="w-5 h-5" /> },
    { href: "/app/admin/moderation",label: "Moderation",         icon: <Flag className="w-5 h-5" /> },
    { href: "/app/admin/audit",    label: "Audit Log",           icon: <Database className="w-5 h-5" /> },
    { href: "/app/admin/jobs",     label: "AI Jobs",             icon: <Activity className="w-5 h-5" /> },
  ],
};

// Primary items shown in the mobile bottom tab bar (first 4 are tabs; rest go in More drawer)
const BOTTOM_NAV_COUNT: Partial<Record<Role, number>> = {
  ATHLETE:    4,
  COACH:      4,
  TEAM_ADMIN: 3,
  EXPERT:     4,
  PARENT:     4,
  SUPER_ADMIN: 3,
};

/* -------------------------------------------------------------------------- */
/* AppShell                                                                    */
/* -------------------------------------------------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [loc, navigate] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const meta    = ROLE_META[user.role];
  const nav     = NAV[user.role];
  const tabCount = BOTTOM_NAV_COUNT[user.role] ?? 4;
  const primaryItems = nav.slice(0, tabCount);
  const moreItems    = nav.slice(tabCount);

  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== nav[0].href && loc.startsWith(item.href));
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop sidebar — hidden on mobile                                  */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
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
                background: `${meta.color.replace(")", " / 0.18)")}`,
                color: meta.color,
                border: `1px solid ${meta.color.replace(")", " / 0.35)")}`,
              }}
            >
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.handle}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="w-4 h-4 shrink-0">{item.icon}</span>
                {item.label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          <Link href="/">
            <a className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              ← Back to marketing
            </a>
          </Link>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                        */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Mobile top bar — safe area sits above the fixed-height content row */}
        <header
          className="lg:hidden sticky top-0 z-30 bg-background border-b border-border"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="h-14 flex items-center justify-between px-4">
            <Logo size={28} />
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-semibold"
                style={{
                  background: `${meta.color.replace(")", " / 0.18)")}`,
                  color: meta.color,
                }}
              >
                {user.avatar}
              </div>
              <button
                onClick={() => setMoreOpen(true)}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {children}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile bottom tab bar                                               */}
      {/* ------------------------------------------------------------------ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-w-0 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`transition-colors ${active ? "text-primary" : ""}`}>
                  {item.icon}
                </span>
                <span className="text-[9px] font-medium leading-none truncate max-w-[52px] text-center">
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}

        {/* More button — opens full nav sheet */}
        {(moreItems.length > 0 || true) && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">More</span>
          </button>
        )}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile full nav sheet (More)                                        */}
      {/* ------------------------------------------------------------------ */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="h-14 border-b border-border flex-row items-center justify-between px-4 shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Logo size={26} />
            </SheetTitle>
            <button
              onClick={() => setMoreOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </SheetHeader>

          {/* User block */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2" style={{ color: meta.color }}>
              {meta.label}
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: `${meta.color.replace(")", " / 0.18)")}`,
                  color: meta.color,
                  border: `1px solid ${meta.color.replace(")", " / 0.35)")}`,
                }}
              >
                {user.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{user.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.handle}</div>
              </div>
            </div>
          </div>

          {/* Full nav */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {nav.map((item) => {
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2 shrink-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
            <button
              onClick={() => { signOut(); navigate("/"); setMoreOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PageHeader                                                                  */
/* -------------------------------------------------------------------------- */

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
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 pb-5 mb-5 border-b border-border">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="display text-2xl sm:text-3xl lg:text-4xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
