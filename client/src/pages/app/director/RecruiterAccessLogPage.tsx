/**
 * RecruiterAccessLogPage — Full recruiter activity visibility for directors.
 * Route: /app/director/recruiter-access
 *
 * Sections:
 *   1. Activity summary strip (3 cards)
 *   2. Live activity feed (most recent 10)
 *   3. Filter controls
 *   4. By-player breakdown table (expandable rows)
 *   5. By-school breakdown table
 *   6. Pending actions callout
 * Tabs:
 *   - Activity Log
 *   - Access Requests (management)
 */
import { useState, useMemo } from "react";
import {
  Download,
  Eye,
  GraduationCap,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bell,
  MessageSquare,
  FileText,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type RecruiterActivity = {
  id: string;
  recruiterName: string;
  recruiterTitle: string;
  school: string;
  division: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  playerId: string;
  playerName: string;
  action: "viewed_profile" | "requested_access" | "approved_access" | "downloaded_export";
  timestamp: string;
  sectionsViewed?: string[];
};

type AccessRequest = {
  id: string;
  playerId: string;
  playerName: string;
  requesterName: string;
  requesterTitle: string;
  school: string;
  division: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  status: "pending" | "approved" | "denied" | "expired";
  requestedAt: string;
  requestMessage: string;
  accessLevel: "profile_only" | "full_profile" | "includes_film";
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ACTIVITY_LOG: RecruiterActivity[] = [
  {
    id: "ra1", recruiterName: "David Hartman", recruiterTitle: "Director of Recruiting",
    school: "Penn State", division: "D1", playerId: "p1", playerName: "Malik Henderson",
    action: "downloaded_export", timestamp: "2026-05-16T08:14:00Z",
    sectionsViewed: ["Skill Data", "Film Package", "Coach Narrative"],
  },
  {
    id: "ra2", recruiterName: "Carla Nguyen", recruiterTitle: "Assistant Coach",
    school: "Villanova", division: "D1", playerId: "p2", playerName: "Jaylen Scott",
    action: "requested_access", timestamp: "2026-05-16T07:02:00Z",
  },
  {
    id: "ra3", recruiterName: "Mike Townsend", recruiterTitle: "Head Coach",
    school: "Michigan", division: "D1", playerId: "p1", playerName: "Malik Henderson",
    action: "viewed_profile", timestamp: "2026-05-15T19:45:00Z",
    sectionsViewed: ["Ball Handling", "Shooting", "Film Package"],
  },
  {
    id: "ra4", recruiterName: "Sarah Lin", recruiterTitle: "Recruiting Coordinator",
    school: "Villanova", division: "D1", playerId: "p2", playerName: "Jaylen Scott",
    action: "viewed_profile", timestamp: "2026-05-15T14:30:00Z",
    sectionsViewed: ["Shooting", "Physical Measurables"],
  },
  {
    id: "ra5", recruiterName: "Ben Foster", recruiterTitle: "Assistant Coach",
    school: "Butler", division: "D1", playerId: "p2", playerName: "Jaylen Scott",
    action: "requested_access", timestamp: "2026-05-15T11:20:00Z",
  },
  {
    id: "ra6", recruiterName: "Marcus Webb Sr.", recruiterTitle: "Head Coach",
    school: "George Washington", division: "D1", playerId: "p3", playerName: "Noah Rivera",
    action: "viewed_profile", timestamp: "2026-05-14T16:10:00Z",
    sectionsViewed: ["Defense", "Athleticism", "Film Package"],
  },
  {
    id: "ra7", recruiterName: "David Hartman", recruiterTitle: "Director of Recruiting",
    school: "Penn State", division: "D1", playerId: "p1", playerName: "Malik Henderson",
    action: "viewed_profile", timestamp: "2026-05-14T09:05:00Z",
    sectionsViewed: ["Ball Handling", "Coach Narrative", "Assessment History"],
  },
  {
    id: "ra8", recruiterName: "Lisa Powell", recruiterTitle: "Recruiting Coordinator",
    school: "Rider University", division: "D2", playerId: "p4", playerName: "Tyler Brooks",
    action: "viewed_profile", timestamp: "2026-05-13T15:00:00Z",
    sectionsViewed: ["Rebounding", "Physical Measurables"],
  },
  {
    id: "ra9", recruiterName: "James Carter", recruiterTitle: "Assistant Coach",
    school: "Seton Hall", division: "D1", playerId: "p5", playerName: "Cam Porter",
    action: "viewed_profile", timestamp: "2026-05-12T10:45:00Z",
    sectionsViewed: ["Post Moves", "Defense", "Film Package"],
  },
  {
    id: "ra10", recruiterName: "Erika Fontaine", recruiterTitle: "Head Coach",
    school: "Monmouth Univ.", division: "D1", playerId: "p7", playerName: "Jordan Okafor",
    action: "viewed_profile", timestamp: "2026-05-11T14:20:00Z",
    sectionsViewed: ["Athleticism", "Shooting"],
  },
  {
    id: "ra11", recruiterName: "Tom Reilly", recruiterTitle: "Assistant Coach",
    school: "Rutgers", division: "D1", playerId: "p1", playerName: "Malik Henderson",
    action: "viewed_profile", timestamp: "2026-05-10T09:00:00Z",
    sectionsViewed: ["Ball Handling", "Passing"],
  },
  {
    id: "ra12", recruiterName: "Carla Nguyen", recruiterTitle: "Assistant Coach",
    school: "Villanova", division: "D1", playerId: "p2", playerName: "Jaylen Scott",
    action: "downloaded_export", timestamp: "2026-05-09T17:30:00Z",
  },
];

const ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: "ar1", playerId: "p1", playerName: "Malik Henderson",
    requesterName: "David Hartman", requesterTitle: "Director of Recruiting",
    school: "Penn State", division: "D1", status: "approved",
    requestedAt: "2026-05-08T10:00:00Z",
    requestMessage: "We've been following Malik for several sessions and want to get a full picture of his development data.",
    accessLevel: "includes_film",
  },
  {
    id: "ar2", playerId: "p2", playerName: "Jaylen Scott",
    requesterName: "Carla Nguyen", requesterTitle: "Assistant Coach",
    school: "Villanova", division: "D1", status: "pending",
    requestedAt: "2026-05-16T07:02:00Z",
    requestMessage: "Jaylen's shooting metrics are exceptional. We'd love to see the full film package and skill assessment history.",
    accessLevel: "includes_film",
  },
  {
    id: "ar3", playerId: "p2", playerName: "Jaylen Scott",
    requesterName: "Ben Foster", requesterTitle: "Assistant Coach",
    school: "Butler", division: "D1", status: "pending",
    requestedAt: "2026-05-15T11:20:00Z",
    requestMessage: "Impressed by Jaylen's off-ball movement stats. Requesting full profile access for our evaluation committee.",
    accessLevel: "full_profile",
  },
  {
    id: "ar4", playerId: "p3", playerName: "Noah Rivera",
    requesterName: "Marcus Webb Sr.", requesterTitle: "Head Coach",
    school: "George Washington", division: "D1", status: "pending",
    requestedAt: "2026-05-14T16:10:00Z",
    requestMessage: "Strong interest in Noah as a two-way wing. Requesting access to film and development data.",
    accessLevel: "includes_film",
  },
  {
    id: "ar5", playerId: "p7", playerName: "Jordan Okafor",
    requesterName: "Erika Fontaine", requesterTitle: "Head Coach",
    school: "Monmouth Univ.", division: "D1", status: "pending",
    requestedAt: "2026-05-11T14:20:00Z",
    requestMessage: "Jordan's athleticism numbers are outstanding. Would like to see the full assessment history.",
    accessLevel: "full_profile",
  },
  {
    id: "ar6", playerId: "p4", playerName: "Tyler Brooks",
    requesterName: "Lisa Powell", requesterTitle: "Recruiting Coordinator",
    school: "Rider University", division: "D2", status: "denied",
    requestedAt: "2026-05-06T12:00:00Z",
    requestMessage: "Tyler's rebounding numbers caught our attention. Family chose not to proceed at this time.",
    accessLevel: "profile_only",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function divColor(div: string) {
  switch (div) {
    case "D1":   return PRIMARY;
    case "D2":   return SUCCESS;
    case "D3":   return WARNING;
    case "NAIA": return "oklch(0.72 0.18 190)";
    case "JUCO": return MUTED;
    default:     return MUTED;
  }
}

function actionLabel(action: RecruiterActivity["action"]) {
  switch (action) {
    case "viewed_profile":    return "Viewed profile";
    case "requested_access":  return "Requested access";
    case "approved_access":   return "Access approved";
    case "downloaded_export": return "Downloaded export";
  }
}

function actionColor(action: RecruiterActivity["action"]) {
  switch (action) {
    case "viewed_profile":    return MUTED;
    case "requested_access":  return WARNING;
    case "approved_access":   return SUCCESS;
    case "downloaded_export": return PRIMARY;
  }
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days  = Math.floor(hours / 24);
  if (hours < 1)    return "Just now";
  if (hours < 24)   return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1)   return "Yesterday";
  return `${days} days ago`;
}

function accessLevelLabel(level: AccessRequest["accessLevel"]) {
  switch (level) {
    case "profile_only":  return "Profile only";
    case "full_profile":  return "Full profile";
    case "includes_film": return "Profile + Film";
  }
}

function requestStatusMeta(status: AccessRequest["status"]) {
  switch (status) {
    case "pending":  return { label: "Pending family",  color: WARNING, bg: "oklch(0.78 0.16 75 / 0.12)"  };
    case "approved": return { label: "Approved",         color: SUCCESS, bg: "oklch(0.75 0.12 140 / 0.12)" };
    case "denied":   return { label: "Denied",           color: DANGER,  bg: "oklch(0.68 0.22 25 / 0.12)"  };
    case "expired":  return { label: "Expired",          color: MUTED,   bg: "oklch(0.30 0.01 260 / 0.5)"  };
  }
}

/* -------------------------------------------------------------------------- */
/* Activity feed entry                                                         */
/* -------------------------------------------------------------------------- */

function ActivityEntry({ entry }: { entry: RecruiterActivity }) {
  const aColor = actionColor(entry.action);
  const dc     = divColor(entry.division);

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[var(--border)] last:border-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold"
        style={{ background: `${aColor}14`, color: aColor }}
      >
        {entry.recruiterName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.recruiterName}</span>
            {entry.recruiterTitle && (
              <span className="text-[11px] text-[var(--text-muted)] ml-1.5">{entry.recruiterTitle}</span>
            )}
          </div>
          <span
            className="text-[11px] text-[var(--text-muted)] shrink-0 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            {timeAgo(entry.timestamp)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: `${dc}14`, color: dc }}
          >
            {entry.division}
          </span>
          <span className="text-[12px] text-[var(--text-muted)]">{entry.school}</span>
          <span className="text-[11px]" style={{ color: aColor }}>
            {actionLabel(entry.action)}
          </span>
          <span className="text-[12px] text-[var(--text-primary)] font-medium">{entry.playerName}</span>
        </div>

        {entry.sectionsViewed && entry.sectionsViewed.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Eye className="w-3 h-3 text-[var(--text-muted)]" />
            {entry.sectionsViewed.map((s) => (
              <span
                key={s}
                className="rounded px-1.5 py-0.5 text-[10px] border"
                style={{ borderColor: "oklch(0.35 0.01 260)", color: "var(--text-muted)" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* By-player table row (expandable)                                            */
/* -------------------------------------------------------------------------- */

type PlayerSummary = {
  playerId: string;
  playerName: string;
  views: number;
  uniqueSchools: number;
  accessRequests: number;
  downloads: number;
  trend: "up" | "flat" | "down";
  interactions: RecruiterActivity[];
};

function PlayerBreakdownRow({ summary }: { summary: PlayerSummary }) {
  const [expanded, setExpanded] = useState(false);
  const trendColor = summary.trend === "up" ? SUCCESS : summary.trend === "down" ? DANGER : MUTED;
  const trendSymbol = summary.trend === "up" ? "↑" : summary.trend === "down" ? "↓" : "→";

  return (
    <>
      <tr className="border-b border-[var(--border)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{summary.playerName}</span>
        </td>
        <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{summary.views}</td>
        <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{summary.uniqueSchools}</td>
        <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{summary.accessRequests}</td>
        <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{summary.downloads}</td>
        <td className="px-4 py-3">
          <span className="text-[14px] font-bold" style={{ color: trendColor }}>{trendSymbol}</span>
        </td>
        <td className="px-4 py-3">
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 pb-3 pt-1 bg-[var(--bg-surface)]">
            <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
              {summary.interactions.map((entry) => (
                <div key={entry.id} className="px-4">
                  <ActivityEntry entry={entry} />
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Access request management row                                               */
/* -------------------------------------------------------------------------- */

function AccessRequestRow({ req }: { req: AccessRequest }) {
  const statusMeta = requestStatusMeta(req.status);
  const dc         = divColor(req.division);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">{req.requesterName}</span>
              <span className="text-[12px] text-[var(--text-muted)]">{req.requesterTitle}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: `${dc}14`, color: dc }}
              >
                {req.division}
              </span>
              <span className="text-[12px] text-[var(--text-muted)]">{req.school}</span>
              <span className="text-[12px]" style={{ color: PRIMARY }}>→ {req.playerName}</span>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
            style={{ background: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(req.requestedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {accessLevelLabel(req.accessLevel)}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] font-medium flex items-center gap-1"
            style={{ color: PRIMARY }}
          >
            {expanded ? "Hide message" : "View request message"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {expanded && (
          <div
            className="rounded-lg p-3 text-[12px] text-[var(--text-muted)] leading-relaxed italic"
            style={{ background: "oklch(0.18 0.005 260)" }}
          >
            "{req.requestMessage}"
          </div>
        )}

        {req.status === "pending" && (
          <div
            className="rounded-lg p-3 text-[12px] leading-relaxed border"
            style={{
              borderColor: "oklch(0.78 0.16 75 / 0.30)",
              background: "oklch(0.78 0.16 75 / 0.06)",
              color: WARNING,
            }}
          >
            <strong>Director note:</strong> Only the player's family can approve or deny access requests.
            You can contact the family to ensure they've reviewed this.
          </div>
        )}

        {req.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => toast.success(`Family notification sent for ${req.playerName}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ minHeight: 40 }}
            >
              <Bell className="w-3.5 h-3.5" />
              Remind family
            </button>
            <button
              onClick={() => toast.info("Opening message to family")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ minHeight: 40 }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Contact family
            </button>
            <button
              onClick={() => toast.info("Opening full request detail")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ minHeight: 40 }}
            >
              <FileText className="w-3.5 h-3.5" />
              View details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

type DateRange = "7d" | "30d" | "90d" | "all";
type DivFilter = "All" | "D1" | "D2" | "D3" | "NAIA" | "JUCO";
type ActionFilter = "all" | "views" | "requests" | "downloads";
type ActiveTab = "log" | "requests";

export default function RecruiterAccessLogPage() {
  const [activeTab, setActiveTab]     = useState<ActiveTab>("log");
  const [dateRange, setDateRange]     = useState<DateRange>("30d");
  const [divFilter, setDivFilter]     = useState<DivFilter>("All");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const uniquePlayerNames = useMemo(() => {
    return Array.from(new Set(ACTIVITY_LOG.map((a) => a.playerName))).sort();
  }, []);

  const filteredActivity = useMemo(() => {
    let result = [...ACTIVITY_LOG];

    if (divFilter !== "All")      result = result.filter((a) => a.division === divFilter);
    if (playerFilter !== "all")   result = result.filter((a) => a.playerName === playerFilter);
    if (actionFilter !== "all") {
      if (actionFilter === "views")     result = result.filter((a) => a.action === "viewed_profile");
      if (actionFilter === "requests")  result = result.filter((a) => a.action === "requested_access" || a.action === "approved_access");
      if (actionFilter === "downloads") result = result.filter((a) => a.action === "downloaded_export");
    }

    if (dateRange !== "all") {
      const days   = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      result = result.filter((a) => new Date(a.timestamp) >= cutoff);
    }

    return result;
  }, [divFilter, playerFilter, actionFilter, dateRange]);

  // By-player summaries
  const playerSummaries = useMemo((): PlayerSummary[] => {
    const playerIds = Array.from(new Set(filteredActivity.map((a) => a.playerId)));
    return playerIds.map((pid) => {
      const acts    = filteredActivity.filter((a) => a.playerId === pid);
      const schools = Array.from(new Set(acts.map((a) => a.school)));
      const views   = acts.filter((a) => a.action === "viewed_profile" || a.action === "downloaded_export").length;
      const reqs    = acts.filter((a) => a.action === "requested_access" || a.action === "approved_access").length;
      const dls     = acts.filter((a) => a.action === "downloaded_export").length;
      const trend: "up" | "flat" | "down" = views >= 3 ? "up" : views === 0 ? "down" : "flat";
      return {
        playerId: pid,
        playerName: acts[0].playerName,
        views,
        uniqueSchools: schools.length,
        accessRequests: reqs,
        downloads: dls,
        trend,
        interactions: acts,
      };
    }).sort((a, b) => b.views - a.views);
  }, [filteredActivity]);

  // By-school summaries
  const schoolSummaries = useMemo(() => {
    const schools = Array.from(new Set(filteredActivity.map((a) => a.school)));
    return schools.map((school) => {
      const acts       = filteredActivity.filter((a) => a.school === school);
      const players    = Array.from(new Set(acts.map((a) => a.playerName)));
      const requests   = acts.filter((a) => a.action === "requested_access" || a.action === "approved_access").length;
      const lastAct    = acts.reduce((latest, a) => new Date(a.timestamp) > new Date(latest.timestamp) ? a : latest);
      return {
        school,
        division: acts[0].division,
        playersViewed: players.length,
        requestsSent: requests,
        lastActivity: timeAgo(lastAct.timestamp),
        totalActions: acts.length,
      };
    }).sort((a, b) => b.totalActions - a.totalActions);
  }, [filteredActivity]);

  // Summary stats
  const totalViews   = ACTIVITY_LOG.filter((a) => a.action === "viewed_profile" || a.action === "downloaded_export").length;
  const uniqueSchoolsThisMonth = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return Array.from(new Set(
      ACTIVITY_LOG.filter((a) => new Date(a.timestamp) >= cutoff).map((a) => a.school)
    )).length;
  }, []);
  const pendingRequests = ACCESS_REQUESTS.filter((r) => r.status === "pending");

  // Overdue requests (>48h)
  const overdueRequests = pendingRequests.filter((r) => {
    const hours = (Date.now() - new Date(r.requestedAt).getTime()) / (1000 * 60 * 60);
    return hours > 48;
  });

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "log",      label: "Activity Log" },
    { id: "requests", label: `Access Requests (${pendingRequests.length} pending)` },
  ];

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Recruiting Activity"
          title="Recruiter Access Log"
          subtitle="Every interaction college programs have had with your athletes' profiles"
          actions={
            <button
              onClick={() => toast.success("Access log CSV queued — check your email")}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold border border-[var(--border)] hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all text-[var(--text-primary)]"
              style={{ minHeight: 40 }}
            >
              <Download className="w-4 h-4" />
              Export Log
            </button>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Profile Views (all time)", value: totalViews,                     icon: <Eye className="w-4 h-4" />,    color: PRIMARY  },
            { label: "Unique Schools This Month",      value: uniqueSchoolsThisMonth,         icon: <GraduationCap className="w-4 h-4" />, color: SUCCESS  },
            { label: "Pending Access Requests",        value: pendingRequests.length,          icon: <Shield className="w-4 h-4" />, color: WARNING  },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <span style={{ color: card.color }}>{card.icon}</span>
              <div className="text-[28px] font-black leading-none mt-2" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Overdue requests callout */}
        {overdueRequests.length > 0 && (
          <div
            className="rounded-xl border p-4 flex items-start gap-3"
            style={{
              borderColor: "oklch(0.78 0.16 75 / 0.35)",
              background: "oklch(0.78 0.16 75 / 0.07)",
            }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: WARNING }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: WARNING }}>
                {overdueRequests.length} request{overdueRequests.length > 1 ? "s" : ""} awaiting family response for more than 48 hours
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">
                Families for{" "}
                {overdueRequests.map((r) => r.playerName).join(", ")}{" "}
                haven't responded yet. Remind them to check their notifications.
              </div>
            </div>
            <button
              onClick={() => toast.success("Reminder sent to all pending families")}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              style={{ background: `${WARNING}18`, color: WARNING, border: `1px solid ${WARNING}33` }}
            >
              Remind all
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px"
              style={{
                borderColor: activeTab === tab.id ? PRIMARY : "transparent",
                color: activeTab === tab.id ? PRIMARY : "var(--text-muted)",
                minHeight: 44,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Activity Log tab */}
        {activeTab === "log" && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                {/* Date range */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">Period</span>
                  <div className="flex gap-1">
                    {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                        style={{
                          background: dateRange === r ? PRIMARY : "oklch(0.20 0.005 260)",
                          color: dateRange === r ? "white" : "var(--text-muted)",
                        }}
                      >
                        {r === "all" ? "All time" : `Last ${r}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Division */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">Division</span>
                  <div className="flex gap-1 flex-wrap">
                    {(["All", "D1", "D2", "D3", "NAIA", "JUCO"] as DivFilter[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDivFilter(d)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                        style={{
                          background: divFilter === d ? `${divColor(d)}20` : "oklch(0.20 0.005 260)",
                          color: divFilter === d ? divColor(d) : "var(--text-muted)",
                          border: divFilter === d ? `1px solid ${divColor(d)}40` : "1px solid transparent",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Player */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">Player</span>
                  <select
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] px-2.5 py-1.5"
                  >
                    <option value="all">All players</option>
                    {uniquePlayerNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Action type */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">Action</span>
                  <div className="flex gap-1">
                    {(["all", "views", "requests", "downloads"] as ActionFilter[]).map((a) => {
                      const labels = { all: "All", views: "Views", requests: "Requests", downloads: "Downloads" };
                      return (
                        <button
                          key={a}
                          onClick={() => setActionFilter(a)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                          style={{
                            background: actionFilter === a ? "oklch(0.72 0.18 290 / 0.14)" : "oklch(0.20 0.005 260)",
                            color: actionFilter === a ? PRIMARY : "var(--text-muted)",
                            border: actionFilter === a ? `1px solid ${PRIMARY}33` : "1px solid transparent",
                          }}
                        >
                          {labels[a]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Live feed */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">Live Activity Feed</span>
                <span className="text-[11px] text-[var(--text-muted)]">({filteredActivity.length} events)</span>
              </div>
              <div className="px-5 divide-y divide-[var(--border)]">
                {filteredActivity.length > 0 ? (
                  filteredActivity.slice(0, 10).map((entry) => (
                    <ActivityEntry key={entry.id} entry={entry} />
                  ))
                ) : (
                  <div className="py-12 text-center text-[13px] text-[var(--text-muted)]">
                    No activity matching these filters
                  </div>
                )}
              </div>
              {filteredActivity.length > 10 && (
                <div className="px-5 py-3 border-t border-[var(--border)] text-center">
                  <button
                    onClick={() => toast.info("Loading more activity...")}
                    className="text-[12px] font-medium"
                    style={{ color: PRIMARY }}
                  >
                    View all {filteredActivity.length} events
                  </button>
                </div>
              )}
            </div>

            {/* By-player table */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">By Player</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Player", "Views", "Schools", "Access Requests", "Downloads", "Trend", ""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playerSummaries.length > 0 ? (
                      playerSummaries.map((s) => <PlayerBreakdownRow key={s.playerId} summary={s} />)
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[var(--text-muted)]">
                          No player activity for these filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By-school table */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
                <GraduationCap className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">By School</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["School", "Division", "Players Viewed", "Requests Sent", "Last Activity"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schoolSummaries.map((s) => {
                      const dc = divColor(s.division);
                      return (
                        <tr key={s.school} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-base)] transition-colors">
                          <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text-primary)]">{s.school}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${dc}14`, color: dc }}>
                              {s.division}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{s.playersViewed}</td>
                          <td className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)]">{s.requestsSent}</td>
                          <td className="px-4 py-3 text-[12px] text-[var(--text-muted)]">{s.lastActivity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Access Requests tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {(["pending", "approved", "denied"] as const).map((status) => {
                const count = ACCESS_REQUESTS.filter((r) => r.status === status).length;
                const meta  = requestStatusMeta(status);
                return (
                  <div
                    key={status}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-medium"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}: {count}
                  </div>
                );
              })}
            </div>

            {ACCESS_REQUESTS.map((req) => (
              <AccessRequestRow key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

