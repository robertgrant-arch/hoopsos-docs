/**
 * ParentAnnouncementsPage
 *
 * Security fix #4: announcements are fetched from /api/announcements which
 * filters by the caller's org role SERVER-SIDE.  We no longer import the full
 * mock array directly — useAnnouncements() returns only what this user's role
 * is entitled to see.  In demo mode the hook falls back to mock data, but
 * the same scoping logic applies.
 */
import { useState } from "react";
import {
  Bell, AlertCircle, Info, Pin, Tag, Calendar, User, Loader2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAnnouncements, type AnnouncementItem } from "@/lib/api/hooks/useAnnouncements";
import { Search } from "lucide-react";

// Shape the hook's type to match what the card component expects
type Announcement = AnnouncementItem & { author: string };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatPostedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    icon: AlertCircle,
    color: "oklch(0.68 0.22 25)",
    bg: "oklch(0.68 0.22 25 / 0.08)",
    border: "oklch(0.68 0.22 25 / 0.3)",
  },
  normal: {
    label: "Update",
    icon: Bell,
    color: "oklch(0.5 0 0)",
    bg: "transparent",
    border: "oklch(0.5 0 0 / 0.15)",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "oklch(0.65 0.15 230)",
    bg: "oklch(0.65 0.15 230 / 0.08)",
    border: "oklch(0.65 0.15 230 / 0.25)",
  },
} as const;

const TAG_COLORS: Record<string, string> = {
  tournament: "oklch(0.72 0.18 290)",
  travel:     "oklch(0.72 0.18 290)",
  schedule:   "oklch(0.75 0.12 140)",
  equipment:  "oklch(0.78 0.17 75)",
  platform:   "oklch(0.65 0.15 230)",
};

/* -------------------------------------------------------------------------- */
/* Announcement card                                                            */
/* -------------------------------------------------------------------------- */

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const cfg = PRIORITY_CONFIG[ann.priority];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-xl border bg-card overflow-hidden"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ color: cfg.color, background: `${cfg.color}15` }}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-[14px] leading-snug">{ann.title}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {ann.pinned && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ color: cfg.color, borderColor: cfg.border }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {ann.author}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatPostedAt(ann.publishedAt)}
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-muted-foreground">{ann.body}</p>

            {ann.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground/50" />
                {ann.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{
                      color: TAG_COLORS[tag] ?? "oklch(0.5 0 0)",
                      background: `${TAG_COLORS[tag] ?? "oklch(0.5 0 0)"}15`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                  */
/* -------------------------------------------------------------------------- */

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
      <Bell className="w-8 h-8 text-muted-foreground/30" />
      {query ? (
        <>
          <p className="font-semibold">No announcements match "{query}"</p>
          <p className="text-[12px] text-muted-foreground">Try a different search term.</p>
        </>
      ) : (
        <>
          <p className="font-semibold">No announcements yet</p>
          <p className="text-[12px] text-muted-foreground max-w-xs">
            When your coaching staff posts program updates, they'll appear here.
          </p>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentAnnouncementsPage() {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Security fix #4: hook fetches from /api/announcements which filters by
  // role server-side.  In demo mode, hook returns role-appropriate mock data.
  const { data: raw = [], isLoading, isError } = useAnnouncements();

  // Normalise hook shape → local Announcement type
  const allAnnouncements: Announcement[] = raw.map((a) => ({
    ...a,
    author: a.authorName,
  }));

  const allTags = Array.from(new Set(allAnnouncements.flatMap((a) => a.tags)));

  const filtered = allAnnouncements.filter((a) => {
    const matchesQuery =
      !query ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.body.toLowerCase().includes(query.toLowerCase());
    const matchesTag = !tagFilter || a.tags.includes(tagFilter);
    return matchesQuery && matchesTag;
  });

  const pinned = filtered.filter((a) => a.pinned);
  const rest = filtered.filter((a) => !a.pinned);
  const urgentCount = allAnnouncements.filter((a) => a.priority === "urgent").length;

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Announcements" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Announcements" />
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-[12px] text-red-400">
          Failed to load announcements. Please refresh.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title="Announcements"
        subtitle="Program updates from your coaching staff."
        actions={
          urgentCount > 0 ? (
            <Badge variant="secondary" style={{ color: "oklch(0.68 0.22 25)" }}>
              {urgentCount} urgent
            </Badge>
          ) : undefined
        }
      />

      {/* Search + tag filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements…"
            className="pl-8 h-8 text-[12px]"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTagFilter(null)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
            style={tagFilter === null
              ? { background: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290)", color: "white" }
              : { borderColor: "hsl(var(--border))" }
            }
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter((prev) => prev === tag ? null : tag)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
              style={tagFilter === tag
                ? { background: TAG_COLORS[tag] ?? "oklch(0.5 0 0)", borderColor: "transparent", color: "white" }
                : { borderColor: "hsl(var(--border))" }
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </h2>
              <div className="space-y-3">
                {pinned.map((a) => <AnnouncementCard key={a.id} ann={a} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <h2 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Recent
                </h2>
              )}
              <div className="space-y-3">
                {rest.map((a) => <AnnouncementCard key={a.id} ann={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

