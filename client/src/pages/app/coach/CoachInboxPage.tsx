import { useState } from "react";
import { Link } from "wouter";
import {
  ClipboardList,
  Film,
  Heart,
  MessageSquare,
  X,
  Inbox,
  CheckCheck,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

type Urgency = "critical" | "warning" | "info";
type Category = "assignments" | "film" | "readiness" | "messages";

interface InboxAction {
  label: string;
  href: string;
}

interface InboxItem {
  id: string;
  category: Category;
  urgency: Urgency;
  icon: React.ElementType;
  title: string;
  body: string;
  subtext?: string;
  time: string;
  actions: InboxAction[];
}

const ITEMS: InboxItem[] = [
  {
    id: "i1",
    category: "assignments",
    urgency: "critical",
    icon: ClipboardList,
    title: "Missed Assignment — 2 athletes",
    body: "Free-throw protocol · Due yesterday",
    subtext: "K. Martinez has 2 other misses this week",
    time: "2h ago",
    actions: [
      { label: "Assign makeup", href: "/app/coach/assignments" },
      { label: "Message parents", href: "/app/coach/messages" },
    ],
  },
  {
    id: "i2",
    category: "film",
    urgency: "warning",
    icon: Film,
    title: "Pending Film Review — 3 clips",
    body: "Marcus D. · Full-court press defense · 2 others",
    time: "4h ago",
    actions: [{ label: "Review now", href: "/app/coach/queue" }],
  },
  {
    id: "i3",
    category: "readiness",
    urgency: "critical",
    icon: Heart,
    title: "Readiness Flag — J. Williams",
    body: 'Fatigue 7/10 · Sleep 5h · "knee feels tight"',
    time: "6h ago",
    actions: [
      { label: "Modify workout", href: "/app/coach/assignments" },
      { label: "Message athlete", href: "/app/coach/messages" },
    ],
  },
  {
    id: "i4",
    category: "assignments",
    urgency: "warning",
    icon: ClipboardList,
    title: "Skill Assessment Expiring — 5 athletes",
    body: "Handles track · 30-day check-in due",
    time: "1d ago",
    actions: [{ label: "Schedule eval", href: "/app/coach/assignments" }],
  },
  {
    id: "i5",
    category: "messages",
    urgency: "info",
    icon: MessageSquare,
    title: "Parent Message — Davis Family",
    body: "Re: Tuesday availability",
    time: "3h ago",
    actions: [{ label: "Reply", href: "/app/coach/messages" }],
  },
  {
    id: "i6",
    category: "film",
    urgency: "info",
    icon: Film,
    title: "Assignment Submitted — Marcus Davis",
    body: "Closeout footwork drill · 4 reps submitted",
    time: "1h ago",
    actions: [{ label: "Review", href: "/app/coach/queue" }],
  },
  {
    id: "i7",
    category: "readiness",
    urgency: "warning",
    icon: Heart,
    title: "Readiness Caution — M. Davis",
    body: "Sleep 5h · Soreness 6/10",
    time: "6h ago",
    actions: [{ label: "View details", href: "/app/coach/roster" }],
  },
];

const URGENCY_ORDER: Record<Urgency, number> = { critical: 0, warning: 1, info: 2 };

const BORDER_CLASS: Record<Urgency, string> = {
  critical: "border-l-[oklch(0.55_0.2_25)]",
  warning: "border-l-[oklch(0.72_0.17_75)]",
  info: "border-l-border",
};

const DOT_CLASS: Record<Urgency, string> = {
  critical: "bg-[oklch(0.55_0.2_25)]",
  warning: "bg-[oklch(0.72_0.17_75)]",
  info: "bg-muted-foreground/40",
};

type Tab = "all" | Category;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assignments", label: "Assignments" },
  { id: "film", label: "Film" },
  { id: "readiness", label: "Readiness" },
  { id: "messages", label: "Messages" },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Inbox className="w-10 h-10 opacity-40" />
      <p className="text-sm font-medium">You're all caught up</p>
    </div>
  );
}

export function CoachInboxPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set(Array.from(prev).concat(id)));

  const markAllRead = () =>
    setDismissed(new Set(ITEMS.map((i) => i.id)));

  const visible = ITEMS.filter((item) => !dismissed.has(item.id));

  const filtered = (tab: Tab) =>
    visible
      .filter((item) => tab === "all" || item.category === tab)
      .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);

  const badgeCount = (tab: Tab) => filtered(tab).length;

  const items = filtered(activeTab);

  return (
    <AppShell>
      <PageHeader
        title="Inbox"
        subtitle="Flags, nudges, and pending decisions across your program"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={visible.length === 0}
            className="gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        }
      />

      <div className="px-4 md:px-6 pb-10 space-y-4">
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = badgeCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={[
                      "inline-flex items-center justify-center rounded-full text-xs min-w-[18px] h-[18px] px-1",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const [primaryAction, secondaryAction] = item.actions;
              return (
                <div
                  key={item.id}
                  className={[
                    "relative flex gap-3 items-start bg-card border border-l-4 rounded-lg p-4 shadow-sm",
                    BORDER_CLASS[item.urgency],
                  ].join(" ")}
                >
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "w-2 h-2 rounded-full shrink-0",
                          DOT_CLASS[item.urgency],
                        ].join(" ")}
                      />
                      <p className="text-sm font-semibold leading-tight">
                        {item.title}
                      </p>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0 pr-6">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">{item.body}</p>

                    {item.subtext && (
                      <p className="text-xs text-muted-foreground/70">
                        {item.subtext}
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap pt-1">
                      <Button asChild variant="default" size="sm">
                        <Link href={primaryAction.href}>
                          {primaryAction.label}
                        </Link>
                      </Button>
                      {secondaryAction && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={secondaryAction.href}>
                            {secondaryAction.label}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => dismiss(item.id)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default CoachInboxPage;
