/**
 * AppShell — responsive app container for HoopsOS.
 *
 * COACH role (redesigned v2):
 *   Mobile:  5-tab bottom bar (Home·Team·Film·Plans·Inbox) + profile sheet
 *            Top bar: section title + HoopsOS mark + avatar
 *   Desktop: 240px sidebar with grouped section headers
 *
 * Other roles:
 *   Mobile:  4-tab bottom bar + improved right-side "More" sheet
 *   Desktop: 240px sidebar (flat list, improved spacing/active states)
 *
 * Safe-area insets applied via env(safe-area-inset-*) for iOS/Capacitor.
 * All bottom tab items meet the 44×44px minimum touch target (56px height × full width ÷ tabs).
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
  CalendarDays,
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
  Target,
  X,
  MoreHorizontal,
  Crosshair,
  Bell,
  FileText,
  CheckSquare,
  ClipboardCheck,
  DollarSign,
  PlusCircle,
  Tag,
  ChevronRight,
  Inbox,
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
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type NavItem = { href: string; label: string; icon: React.ReactNode };

/** Coach-specific tab for the mobile bottom bar. */
type CoachTab = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  href: string;
  /** Returns true if this tab should be highlighted for the given location. */
  isActive: (loc: string) => boolean;
  /** Optional badge count. 0 = hidden. */
  badge?: number;
};

/** Desktop sidebar section (coach only). */
type SidebarSection = {
  title?: string;
  items: NavItem[];
};

/* -------------------------------------------------------------------------- */
/* Coach nav config                                                            */
/* -------------------------------------------------------------------------- */

/** Demo badge counts — in production these come from API/context. */
const FILM_PENDING  = 3;
const INBOX_UNREAD  = 2;

const COACH_TABS: CoachTab[] = [
  {
    id: "home",
    label: "Home",
    Icon: LayoutDashboard,
    href: "/app/coach",
    isActive: (l) => l === "/app/coach",
  },
  {
    id: "team",
    label: "Team",
    Icon: Users,
    href: "/app/coach/roster",
    isActive: (l) =>
      ["/app/coach/roster", "/app/coach/parents", "/app/coach/readiness", "/app/coach/actions"]
        .some((p) => l.startsWith(p)),
  },
  {
    id: "film",
    label: "Film",
    Icon: Film,
    href: "/app/coach/film",
    isActive: (l) =>
      ["/app/coach/film", "/app/coach/queue", "/app/coach/scouting"]
        .some((p) => l.startsWith(p)),
    badge: FILM_PENDING,
  },
  {
    id: "plans",
    label: "Plans",
    Icon: CalendarDays,
    href: "/app/coach/practice-plans",
    isActive: (l) =>
      [
        "/app/coach/practice-plans",
        "/app/coach/wods",
        "/app/coach/assignments",
        "/app/coach/drills",
        "/app/playbook",
      ].some((p) => l.startsWith(p)),
  },
  {
    id: "inbox",
    label: "Inbox",
    Icon: MessageSquare,
    href: "/app/coach/inbox",
    isActive: (l) =>
      ["/app/coach/inbox", "/app/messages"].some((p) => l.startsWith(p)),
    badge: INBOX_UNREAD,
  },
];

/** Section label for the mobile top bar title. */
const COACH_SECTION_LABELS: Array<{ match: (l: string) => boolean; label: string }> = [
  { match: (l) => l === "/app/coach",                                   label: "Dashboard"      },
  { match: (l) => l.startsWith("/app/coach/inbox") || l.startsWith("/app/messages"), label: "Inbox" },
  { match: (l) => l.startsWith("/app/coach/roster"),                    label: "Roster"         },
  { match: (l) => l.startsWith("/app/coach/parents"),                   label: "Parents"        },
  { match: (l) => l.startsWith("/app/coach/readiness"),                 label: "Readiness"      },
  { match: (l) => l.startsWith("/app/coach/actions"),                   label: "Coach Actions"  },
  { match: (l) => l.startsWith("/app/coach/film"),                      label: "Film Room"      },
  { match: (l) => l.startsWith("/app/coach/queue"),                     label: "Review Queue"   },
  { match: (l) => l.startsWith("/app/coach/scouting"),                  label: "Scouting"       },
  { match: (l) => l.startsWith("/app/coach/practice-plans"),            label: "Practice Plans" },
  { match: (l) => l.startsWith("/app/coach/wods"),                      label: "Daily WODs"     },
  { match: (l) => l.startsWith("/app/coach/assignments"),               label: "Assignments"    },
  { match: (l) => l.startsWith("/app/coach/drills"),                    label: "Drill Library"  },
  { match: (l) => l.startsWith("/app/playbook"),                        label: "Playbook"       },
  { match: (l) => l.startsWith("/app/coach/bookings"),                  label: "Bookings"       },
  { match: (l) => l.startsWith("/app/billing"),                         label: "Billing"        },
  { match: (l) => l.startsWith("/app/learn"),                           label: "Coach Education"},
];

function getCoachSectionLabel(loc: string) {
  return COACH_SECTION_LABELS.find((s) => s.match(loc))?.label ?? "HoopsOS";
}

/** Desktop sidebar sections for COACH — grouped by workflow area. */
const COACH_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "DAILY",
    items: [
      { href: "/app/coach",         label: "Dashboard",    icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/app/coach/inbox",   label: "Inbox",        icon: <Inbox className="w-4 h-4" /> },
    ],
  },
  {
    title: "TEAM",
    items: [
      { href: "/app/coach/roster",     label: "Roster",      icon: <Users className="w-4 h-4" />      },
      { href: "/app/coach/parents",    label: "Parents",     icon: <Heart className="w-4 h-4" />      },
      { href: "/app/coach/readiness",  label: "Readiness",   icon: <Activity className="w-4 h-4" />   },
    ],
  },
  {
    title: "FILM",
    items: [
      { href: "/app/coach/film",     label: "Film Room",     icon: <Film className="w-4 h-4" />        },
      { href: "/app/coach/queue",    label: "Review Queue",  icon: <ListChecks className="w-4 h-4" />  },
      { href: "/app/coach/scouting", label: "Scouting",      icon: <Crosshair className="w-4 h-4" />  },
    ],
  },
  {
    title: "BUILD",
    items: [
      { href: "/app/coach/practice-plans", label: "Practice Plans", icon: <CalendarDays className="w-4 h-4" /> },
      { href: "/app/coach/wods",           label: "Daily WODs",     icon: <Dumbbell className="w-4 h-4" />     },
      { href: "/app/coach/assignments",    label: "Assignments",    icon: <ClipboardList className="w-4 h-4" />},
      { href: "/app/coach/drills",         label: "Drill Library",  icon: <BookOpen className="w-4 h-4" />     },
      { href: "/app/playbook",             label: "Playbook",       icon: <Target className="w-4 h-4" />       },
    ],
  },
  {
    title: "MORE",
    items: [
      { href: "/app/coach/bookings", label: "Bookings",        icon: <Calendar className="w-4 h-4" />    },
      { href: "/app/billing",        label: "Billing",         icon: <CreditCard className="w-4 h-4" />  },
      { href: "/app/learn",          label: "Coach Education", icon: <GraduationCap className="w-4 h-4" />},
    ],
  },
];

/** Items shown in the COACH profile / overflow sheet on mobile. */
const COACH_OVERFLOW_ITEMS: NavItem[] = [
  { href: "/app/coach/bookings", label: "Bookings",        icon: <Calendar className="w-4 h-4" />    },
  { href: "/app/billing",        label: "Billing",         icon: <CreditCard className="w-4 h-4" />  },
  { href: "/app/learn",          label: "Coach Education", icon: <GraduationCap className="w-4 h-4" />},
];

/* -------------------------------------------------------------------------- */
/* Other roles nav (flat, existing structure)                                  */
/* -------------------------------------------------------------------------- */

const NAV: Record<Role, NavItem[]> = {
  ATHLETE: [
    { href: "/app/player",              label: "Home",           icon: <Home className="w-5 h-5" />         },
    { href: "/app/player/workout",      label: "Today's WOD",   icon: <Dumbbell className="w-5 h-5" />     },
    { href: "/app/player/assignments",  label: "Assignments",   icon: <CheckSquare className="w-5 h-5" />  },
    { href: "/app/player/schedule",     label: "Schedule",      icon: <Calendar className="w-5 h-5" />     },
    { href: "/app/player/uploads",      label: "Uploads",       icon: <UploadCloud className="w-5 h-5" />  },
    { href: "/app/player/skills",       label: "Skill Tracks",  icon: <TrendingUp className="w-5 h-5" />   },
    { href: "/app/player/development",  label: "Development",   icon: <Target className="w-5 h-5" />       },
    { href: "/app/player/achievements", label: "Achievements",  icon: <Trophy className="w-5 h-5" />       },
    { href: "/app/player/plays",        label: "Study Plays",   icon: <BookOpen className="w-5 h-5" />     },
    { href: "/app/billing",             label: "Billing",       icon: <CreditCard className="w-5 h-5" />   },
    { href: "/app/film/inbox",          label: "Film Inbox",    icon: <Film className="w-5 h-5" />         },
    { href: "/app/learn",               label: "Learn",         icon: <BookOpen className="w-5 h-5" />     },
    { href: "/app/live",                label: "Live",          icon: <Radio className="w-5 h-5" />        },
    { href: "/app/marketplace",         label: "Marketplace",   icon: <Package className="w-5 h-5" />      },
    { href: "/app/messages",            label: "Messages",      icon: <MessageSquare className="w-5 h-5" />},
  ],
  // Coach nav handled separately via COACH_SIDEBAR_SECTIONS + COACH_TABS
  COACH: [],
  TEAM_ADMIN: [
    { href: "/app/team",               label: "Org Dashboard",  icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/team/schedule",      label: "Schedule",       icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/club",               label: "Club Dashboard", icon: <ClipboardCheck className="w-5 h-5" />  },
    { href: "/app/club/registrations", label: "Registrations",  icon: <ClipboardList className="w-5 h-5" />  },
    { href: "/app/club/teams",         label: "Teams",          icon: <Users className="w-5 h-5" />           },
    { href: "/app/club/memberships",   label: "Memberships",    icon: <Tag className="w-5 h-5" />             },
    { href: "/app/club/billing",       label: "Dues & Billing", icon: <DollarSign className="w-5 h-5" />     },
    { href: "/app/team/roster",        label: "All Athletes",   icon: <UserIcon className="w-5 h-5" />       },
    { href: "/app/team/invite",        label: "Invite",         icon: <Users className="w-5 h-5" />          },
    { href: "/app/billing",            label: "Platform Billing",icon: <CreditCard className="w-5 h-5" />    },
    { href: "/app/team/seats",         label: "Seat Manager",   icon: <Users className="w-5 h-5" />          },
    { href: "/app/team/settings",      label: "Settings",       icon: <Shield className="w-5 h-5" />         },
  ],
  EXPERT: [
    { href: "/app/expert",          label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/expert/offers",   label: "Offers",    icon: <Package className="w-5 h-5" />         },
    { href: "/app/expert/bookings", label: "Bookings",  icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/expert/payouts",  label: "Payouts",   icon: <CreditCard className="w-5 h-5" />      },
    { href: "/app/messages",        label: "Messages",  icon: <MessageSquare className="w-5 h-5" />   },
  ],
  PARENT: [
    { href: "/app/parent",               label: "Home",          icon: <Home className="w-5 h-5" />         },
    { href: "/app/parent/child",         label: "My Child",      icon: <Heart className="w-5 h-5" />        },
    { href: "/app/parent/schedule",      label: "Schedule",      icon: <Calendar className="w-5 h-5" />     },
    { href: "/app/parent/register",      label: "Register",      icon: <PlusCircle className="w-5 h-5" />   },
    { href: "/app/parent/billing",       label: "Billing",       icon: <CreditCard className="w-5 h-5" />   },
    { href: "/app/parent/forms",         label: "Forms",         icon: <FileText className="w-5 h-5" />     },
    { href: "/app/parent/announcements", label: "Announcements", icon: <Bell className="w-5 h-5" />         },
    { href: "/app/messages",             label: "Messages",      icon: <MessageSquare className="w-5 h-5" />},
  ],
  SUPER_ADMIN: [
    { href: "/app/admin",            label: "Overview",            icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/admin/users",      label: "Users",               icon: <UserIcon className="w-5 h-5" />       },
    { href: "/app/admin/billing",    label: "Billing & Revenue",   icon: <CreditCard className="w-5 h-5" />     },
    { href: "/app/admin/experts",    label: "Expert Verification", icon: <GraduationCap className="w-5 h-5" />  },
    { href: "/app/admin/moderation", label: "Moderation",         icon: <Flag className="w-5 h-5" />           },
    { href: "/app/admin/audit",      label: "Audit Log",           icon: <Database className="w-5 h-5" />       },
    { href: "/app/admin/jobs",       label: "AI Jobs",             icon: <Activity className="w-5 h-5" />       },
  ],
};

const BOTTOM_NAV_COUNT: Partial<Record<Role, number>> = {
  ATHLETE:    4,
  TEAM_ADMIN: 4,
  EXPERT:     4,
  PARENT:     4,
  SUPER_ADMIN: 3,
};

/* -------------------------------------------------------------------------- */
/* Coach — premium mobile bottom tab bar                                       */
/* -------------------------------------------------------------------------- */

function CoachBottomNav({
  tabs,
  loc,
}: {
  tabs: CoachTab[];
  loc: string;
}) {
  const accentColor = "oklch(0.72 0.18 290)";

  return (
    <nav
      role="tablist"
      aria-label="Coach navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const active = tab.isActive(loc);
        return (
          <Link key={tab.id} href={tab.href}>
            <a
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-0 relative select-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Icon container with active pill */}
              <div className="relative flex items-center justify-center">
                <div
                  className="w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={
                    active
                      ? { background: `${accentColor.replace(")", " / 0.14)")}` }
                      : undefined
                  }
                >
                  <tab.Icon
                    className="w-[22px] h-[22px] transition-colors duration-200"
                    style={{ color: active ? accentColor : "oklch(0.55 0.02 260)" }}
                  />
                </div>

                {/* Badge */}
                {tab.badge && tab.badge > 0 ? (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none px-1"
                    style={{ background: "oklch(0.62 0.22 25)" }}
                  >
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span
                className="text-[10px] leading-none transition-all duration-200"
                style={{
                  color: active ? accentColor : "oklch(0.55 0.02 260)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {tab.label}
              </span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Coach — mobile top bar                                                      */
/* -------------------------------------------------------------------------- */

function CoachTopBar({
  loc,
  user,
  onProfileOpen,
}: {
  loc: string;
  user: { name: string; avatar: string; handle: string };
  onProfileOpen: () => void;
}) {
  const sectionLabel = getCoachSectionLabel(loc);
  const accentColor  = "oklch(0.72 0.18 290)";

  return (
    <header
      className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-[52px] flex items-center justify-between px-4">
        {/* Left: wordmark */}
        <div className="flex items-center gap-1.5">
          <Logo size={22} />
        </div>

        {/* Center: current section */}
        <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold tracking-tight">
          {sectionLabel}
        </span>

        {/* Right: avatar → profile sheet */}
        <button
          onClick={onProfileOpen}
          aria-label="Profile and settings"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-opacity active:opacity-70"
          style={{
            background: `${accentColor.replace(")", " / 0.16)")}`,
            color: accentColor,
            border: `1.5px solid ${accentColor.replace(")", " / 0.30)")}`,
          }}
        >
          {user.avatar}
        </button>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Coach — profile + overflow sheet (right side)                               */
/* -------------------------------------------------------------------------- */

function CoachProfileSheet({
  open,
  onClose,
  user,
  meta,
  loc,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; avatar: string; handle: string; title?: string };
  meta: { color: string; label: string };
  loc: string;
  onSignOut: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="h-14 border-b border-border flex-row items-center justify-between px-4 shrink-0">
          <SheetTitle className="text-[14px] font-semibold">Profile</SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        {/* User identity block */}
        <div className="px-5 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color: meta.color,
                border: `1.5px solid ${meta.color.replace(")", " / 0.30)")}`,
              }}
            >
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{user.handle}</div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-1"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          </div>
        </div>

        {/* Overflow workspace items */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/50 px-2 mb-2">
            Workspace
          </div>
          {COACH_OVERFLOW_ITEMS.map((item) => {
            const active = loc.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-[14px] transition-colors mb-0.5"
                  style={
                    active
                      ? {
                          background: `oklch(0.72 0.18 290 / 0.10)`,
                          color: "oklch(0.72 0.18 290)",
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-3 text-foreground">
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </a>
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <div
          className="border-t border-border p-3 shrink-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Coach — desktop sidebar (grouped sections)                                  */
/* -------------------------------------------------------------------------- */

function CoachDesktopSidebar({
  sections,
  loc,
  user,
  meta,
  onSignOut,
}: {
  sections: SidebarSection[];
  loc: string;
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  onSignOut: () => void;
}) {
  function isItemActive(item: NavItem) {
    // Home (exact)
    if (item.href === "/app/coach") return loc === "/app/coach";
    return loc.startsWith(item.href);
  }

  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center px-5">
        <Logo size={30} />
      </div>

      {/* User block */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{
              background: `${meta.color.replace(")", " / 0.15)")}`,
              color: meta.color,
              border: `1.5px solid ${meta.color.replace(")", " / 0.28)")}`,
            }}
          >
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-0.5"
              style={{ color: meta.color }}
            >
              {meta.label}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : undefined}>
            {section.title && (
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/40 px-2 mb-1.5">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = isItemActive(item);
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 relative"
                    style={
                      active
                        ? {
                            background: `oklch(0.72 0.18 290 / 0.10)`,
                            color: "oklch(0.72 0.18 290)",
                          }
                        : { color: "oklch(0.55 0.02 260)" }
                    }
                  >
                    {/* Left accent bar */}
                    {active && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                        style={{ background: "oklch(0.72 0.18 290)" }}
                      />
                    )}
                    <span className="pl-1 w-4 h-4 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <span className={active ? "font-semibold" : ""}>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2 shrink-0 space-y-0.5">
        <Link href="/">
          <a className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            ← Marketing site
          </a>
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-destructive transition-colors"
        >
          <UserIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic roles — improved More sheet (right side)                            */
/* -------------------------------------------------------------------------- */

function GenericMoreSheet({
  open,
  onClose,
  nav,
  loc,
  user,
  meta,
  homeHref,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
  loc: string;
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  homeHref: string;
  onSignOut: () => void;
}) {
  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== homeHref && loc.startsWith(item.href));
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        <SheetHeader className="h-14 border-b border-border flex-row items-center justify-between px-4 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Logo size={24} />
          </SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color: meta.color,
                border: `1px solid ${meta.color.replace(")", " / 0.30)")}`,
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

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] transition-colors mb-0.5"
                  style={
                    active
                      ? {
                          background: `${meta.color.replace(")", " / 0.10)")}`,
                          color: meta.color,
                        }
                      : undefined
                  }
                >
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <span className={active ? "font-semibold" : "text-foreground"}>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>

        <div
          className="border-t border-border p-2 shrink-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* AppShell                                                                    */
/* -------------------------------------------------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [loc, navigate] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const meta = ROLE_META[user.role];
  const isCoach = user.role === "COACH";

  function handleSignOut() {
    signOut();
    navigate("/");
    setSheetOpen(false);
  }

  /* ── Coach layout ──────────────────────────────────────────────────────── */
  if (isCoach) {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Desktop grouped sidebar */}
        <CoachDesktopSidebar
          sections={COACH_SIDEBAR_SECTIONS}
          loc={loc}
          user={user}
          meta={meta}
          onSignOut={handleSignOut}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
          <CoachTopBar loc={loc} user={user} onProfileOpen={() => setSheetOpen(true)} />
          {children}
        </main>

        {/* Premium 5-tab bottom bar */}
        <CoachBottomNav tabs={COACH_TABS} loc={loc} />

        {/* Profile + overflow sheet */}
        <CoachProfileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          user={user}
          meta={meta}
          loc={loc}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  /* ── All other roles ───────────────────────────────────────────────────── */
  const nav      = NAV[user.role];
  const tabCount = BOTTOM_NAV_COUNT[user.role] ?? 4;
  const homeHref = nav[0]?.href ?? "/";
  const primaryItems = nav.slice(0, tabCount);

  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== homeHref && loc.startsWith(item.href));
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
        <div className="h-16 border-b border-border flex items-center px-5">
          <Logo size={30} />
        </div>

        <div className="px-4 py-4 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2" style={{ color: meta.color }}>
            {meta.label} · Signed in
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color: meta.color,
                border: `1.5px solid ${meta.color.replace(")", " / 0.28)")}`,
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

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] transition-colors mb-0.5"
                  style={
                    active
                      ? {
                          background: `${meta.color.replace(")", " / 0.10)")}`,
                          color: meta.color,
                        }
                      : { color: "oklch(0.55 0.02 260)" }
                  }
                >
                  <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>
                  <span className={active ? "font-semibold" : ""}>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-2 shrink-0">
          <Link href="/">
            <a className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              ← Back to marketing
            </a>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-destructive transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Mobile top bar */}
        <header
          className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="h-[52px] flex items-center justify-between px-4">
            <Logo size={26} />
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Open menu"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[12px] font-bold transition-opacity active:opacity-70"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color: meta.color,
                border: `1.5px solid ${meta.color.replace(")", " / 0.25)")}`,
              }}
            >
              {user.avatar}
            </button>
          </div>
        </header>

        {children}
      </main>

      {/* Mobile bottom tab bar — improved */}
      <nav
        role="tablist"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href}>
              <a
                role="tab"
                aria-selected={active}
                aria-label={item.label}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-0 select-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div
                  className="w-10 h-7 rounded-full flex items-center justify-center transition-all duration-150"
                  style={active ? { background: `${meta.color.replace(")", " / 0.12)")}` } : undefined}
                >
                  <span style={{ color: active ? meta.color : "oklch(0.55 0.02 260)" }}>
                    {item.icon}
                  </span>
                </div>
                <span
                  className="text-[10px] leading-none transition-colors duration-150"
                  style={{
                    color: active ? meta.color : "oklch(0.55 0.02 260)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="More options"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="w-10 h-7 rounded-full flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" style={{ color: "oklch(0.55 0.02 260)" }} />
          </div>
          <span className="text-[10px] leading-none" style={{ color: "oklch(0.55 0.02 260)" }}>
            More
          </span>
        </button>
      </nav>

      {/* More sheet (right side for thumb reach) */}
      <GenericMoreSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        nav={nav}
        loc={loc}
        user={user}
        meta={meta}
        homeHref={homeHref}
        onSignOut={handleSignOut}
      />
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
