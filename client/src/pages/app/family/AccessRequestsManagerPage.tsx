/**
 * AccessRequestsManagerPage — Family inbox for recruiter access requests.
 * Route: /app/family/access-requests
 *
 * Sections:
 *  1. Summary strip (Pending / Approved / Expired+Denied)
 *  2. Pending requests (prominent, amber)
 *  3. Active grants with progress bar + revoke
 *  4. Request history (collapsible table)
 *  5. Email notification setting
 *  6. Privacy reminder footer
 */
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";
type AccessLevel =
  | "profile_only"
  | "full_profile"
  | "includes_film";
type RequestStatus = "pending" | "approved" | "denied" | "expired";

type AccessRequest = {
  id: string;
  playerId: string;
  playerName: string;
  requesterName: string;
  requesterTitle: string;
  school: string;
  division: Division;
  status: RequestStatus;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  requestMessage: string;
  accessLevel: AccessLevel;
  viewCount: number;
  sectionsViewed?: string[];
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: "req-001",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Marcus Reid",
    requesterTitle: "Assistant Coach, Men's Basketball",
    school: "University of Portland",
    division: "D1",
    status: "pending",
    requestedAt: "2026-05-13T14:22:00Z",
    requestMessage:
      "Hi, I came across Jordan's profile through our Elevation Basketball connections. We're actively recruiting at the 2027 position and Jordan's tier and badge count stood out to us. We'd love the opportunity to review the full profile and film package as we build our board for next cycle.",
    accessLevel: "includes_film",
    viewCount: 0,
  },
  {
    id: "req-002",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Diane Torres",
    requesterTitle: "Head Coach, Women's Basketball",
    school: "Pacific University",
    division: "D3",
    status: "pending",
    requestedAt: "2026-05-11T09:05:00Z",
    requestMessage:
      "Jordan's development trajectory and coach narrative preview really stood out. We're a program that values coachability and growth, and we'd love to see the full assessment data to understand where Jordan is heading.",
    accessLevel: "full_profile",
    viewCount: 0,
  },
  {
    id: "req-003",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Kevin Blanchard",
    requesterTitle: "Director of Basketball Operations",
    school: "Linfield University",
    division: "D3",
    status: "approved",
    requestedAt: "2026-04-01T10:00:00Z",
    respondedAt: "2026-04-02T08:30:00Z",
    expiresAt: "2026-06-01T08:30:00Z",
    requestMessage: "We've been following Jordan's program this spring.",
    accessLevel: "full_profile",
    viewCount: 5,
    sectionsViewed: ["Skills", "Assessments", "Coach Narrative", "IDP"],
  },
  {
    id: "req-004",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Sandra Yee",
    requesterTitle: "Associate Head Coach",
    school: "George Fox University",
    division: "NAIA",
    status: "approved",
    requestedAt: "2026-04-15T16:00:00Z",
    respondedAt: "2026-04-16T09:00:00Z",
    expiresAt: "2026-06-15T09:00:00Z",
    requestMessage:
      "Very impressed by Jordan's growth signal and verified badges.",
    accessLevel: "includes_film",
    viewCount: 12,
    sectionsViewed: ["Skills", "Film", "Coach Narrative", "Coachability"],
  },
  {
    id: "req-005",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Brett Sullivan",
    requesterTitle: "Assistant Coach",
    school: "Reed College",
    division: "D3",
    status: "denied",
    requestedAt: "2026-03-10T11:00:00Z",
    respondedAt: "2026-03-11T10:00:00Z",
    requestMessage: "Interested in your player.",
    accessLevel: "profile_only",
    viewCount: 0,
  },
  {
    id: "req-006",
    playerId: "player-jordan",
    playerName: "Jordan Mills",
    requesterName: "Alexis Park",
    requesterTitle: "Recruiting Coordinator",
    school: "Willamette University",
    division: "D3",
    status: "expired",
    requestedAt: "2026-02-01T09:00:00Z",
    respondedAt: "2026-02-03T08:00:00Z",
    expiresAt: "2026-04-03T08:00:00Z",
    requestMessage: "Looking forward to learning more about Jordan.",
    accessLevel: "full_profile",
    viewCount: 3,
    sectionsViewed: ["Skills", "Assessments"],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const DIVISION_COLORS: Record<Division, string> = {
  D1: "oklch(0.72 0.18 290)",
  D2: "oklch(0.78 0.16 75)",
  D3: "oklch(0.75 0.12 140)",
  NAIA: "oklch(0.68 0.22 25 / 0.80)",
  JUCO: "oklch(0.60 0.10 200)",
};

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  profile_only: "Profile only",
  full_profile: "Full profile",
  includes_film: "Full profile + film package",
};

const ACCESS_LEVEL_INCLUDES: Record<AccessLevel, string[]> = {
  profile_only: [
    "Public profile data (name, position, grad year)",
    "Development tier label",
    "Verified badge names",
  ],
  full_profile: [
    "Full skill assessment scores and history",
    "Coach narrative (complete text)",
    "Coachability indicators",
    "IDP focus areas",
    "Attendance summary",
  ],
  includes_film: [
    "Everything in Full Profile",
    "All coach-curated film clips",
    "Film session notes",
  ],
};

function daysAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeRemainingPercent(approved: string, expires: string): number {
  const now = Date.now();
  const start = new Date(approved).getTime();
  const end = new Date(expires).getTime();
  const total = end - start;
  const elapsed = now - start;
  return Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
}

function daysUntilExpiry(iso: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function DivisionChip({ division }: { division: Division }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{
        background: `${DIVISION_COLORS[division].replace(")", " / 0.15)")}`,
        color: DIVISION_COLORS[division],
        border: `1px solid ${DIVISION_COLORS[division].replace(")", " / 0.30)")}`,
      }}
    >
      {division}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200"
      style={{
        background: checked
          ? "oklch(0.75 0.12 140)"
          : "oklch(0.30 0.01 260)",
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0px)" }}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Pending request card                                                        */
/* -------------------------------------------------------------------------- */

function PendingRequestCard({
  req,
  expiryDays,
  onApprove,
  onDeny,
}: {
  req: AccessRequest;
  expiryDays: number;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);

  return (
    <>
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{
          background: "var(--bg-surface)",
          borderColor: "oklch(0.78 0.16 75 / 0.30)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[18px] font-bold text-[var(--text-primary)]">
                {req.school}
              </span>
              <DivisionChip division={req.division} />
            </div>
            <div className="text-[13px] text-[var(--text-muted)]">
              {req.requesterName} · {req.requesterTitle}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-[var(--text-muted)]">
              Requested {daysAgo(req.requestedAt)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {formatDate(req.requestedAt)}
            </div>
          </div>
        </div>

        {/* Access level */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "oklch(0.78 0.16 75 / 0.08)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="oklch(0.78 0.16 75)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="oklch(0.78 0.16 75 / 0.15)"
            />
          </svg>
          <span
            className="text-[12px] font-semibold"
            style={{ color: "oklch(0.78 0.16 75)" }}
          >
            Access level: {ACCESS_LEVEL_LABELS[req.accessLevel]}
          </span>
        </div>

        {/* Their message */}
        <blockquote
          className="border-l-2 pl-4 py-1 italic text-[13px] leading-relaxed"
          style={{
            borderColor: "oklch(0.78 0.16 75 / 0.40)",
            color: "var(--text-muted)",
          }}
        >
          "{req.requestMessage}"
        </blockquote>

        {/* What they'll see */}
        <div>
          <div className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
            If approved, they'll see:
          </div>
          <ul className="space-y-1">
            {ACCESS_LEVEL_INCLUDES[req.accessLevel].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    fill="oklch(0.75 0.12 140 / 0.15)"
                  />
                  <path
                    d="M3.5 6l1.5 1.5 3-3"
                    stroke="oklch(0.75 0.12 140)"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Access duration note */}
        <div
          className="text-[12px] rounded-lg px-3 py-2"
          style={{
            background: "oklch(0.20 0.005 260)",
            color: "var(--text-muted)",
          }}
        >
          If approved, access expires in{" "}
          <strong className="text-[var(--text-primary)]">
            {expiryDays} days
          </strong>{" "}
          (your current setting)
        </div>

        {/* Decision buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            className="flex-1 font-semibold"
            style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
            onClick={() => setShowApproveConfirm(true)}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-semibold"
            style={{
              borderColor: "oklch(0.68 0.22 25 / 0.50)",
              color: "oklch(0.68 0.22 25)",
            }}
            onClick={() => setShowDenyConfirm(true)}
          >
            Deny
          </Button>
        </div>
      </div>

      {/* Approve confirm */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve access?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--text-muted)] mt-1 mb-6 leading-relaxed">
            This will grant{" "}
            <strong className="text-[var(--text-primary)]">
              {req.requesterName}
            </strong>{" "}
            from{" "}
            <strong className="text-[var(--text-primary)]">{req.school}</strong>{" "}
            access to {ACCESS_LEVEL_LABELS[req.accessLevel]} for {expiryDays}{" "}
            days. You can revoke this at any time.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowApproveConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApprove(req.id);
                setShowApproveConfirm(false);
              }}
              style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
            >
              Yes, Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deny confirm */}
      <Dialog open={showDenyConfirm} onOpenChange={setShowDenyConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deny this request?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--text-muted)] mt-1 mb-6 leading-relaxed">
            {req.requesterName} from {req.school} will be notified that their
            request was not approved. This cannot be undone, but they can submit
            a new request in the future.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDenyConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeny(req.id);
                setShowDenyConfirm(false);
              }}
              style={{ background: "oklch(0.68 0.22 25)", color: "white" }}
            >
              Deny Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Active grant row                                                            */
/* -------------------------------------------------------------------------- */

function ActiveGrantRow({
  req,
  onRevoke,
}: {
  req: AccessRequest;
  onRevoke: (id: string) => void;
}) {
  const [showRevoke, setShowRevoke] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pct = timeRemainingPercent(req.respondedAt!, req.expiresAt!);
  const daysLeft = daysUntilExpiry(req.expiresAt!);

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <button
          type="button"
          className="w-full flex items-center justify-between gap-4 p-4 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                {req.school}
              </span>
              <DivisionChip division={req.division} />
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "oklch(0.75 0.12 140 / 0.12)",
                  color: "oklch(0.75 0.12 140)",
                }}
              >
                Active
              </span>
            </div>
            <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {req.requesterName} · Expires {formatDate(req.expiresAt!)} (
              {daysLeft}d left)
            </div>
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 transition-transform"
            style={{
              color: "var(--text-muted)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "oklch(0.22 0.01 260)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  pct > 40
                    ? "oklch(0.75 0.12 140)"
                    : "oklch(0.78 0.16 75)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--text-muted)]">
              Time remaining
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div
            className="px-4 pb-4 border-t pt-4 space-y-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <div className="text-[var(--text-muted)]">Access level</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {ACCESS_LEVEL_LABELS[req.accessLevel]}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Profile views</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {req.viewCount} views
                </div>
              </div>
              {req.sectionsViewed && req.sectionsViewed.length > 0 && (
                <div className="col-span-2">
                  <div className="text-[var(--text-muted)] mb-1">
                    Sections viewed
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {req.sectionsViewed.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.22 0.01 260)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-[12px]"
              style={{
                borderColor: "oklch(0.68 0.22 25 / 0.40)",
                color: "oklch(0.68 0.22 25)",
              }}
              onClick={() => setShowRevoke(true)}
            >
              Revoke access
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showRevoke} onOpenChange={setShowRevoke}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke access?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--text-muted)] mt-1 mb-6 leading-relaxed">
            This immediately ends{" "}
            <strong className="text-[var(--text-primary)]">
              {req.requesterName}
            </strong>
            's access to {req.playerName}'s profile. They will no longer be
            able to view any profile data. Are you sure?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowRevoke(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onRevoke(req.id);
                setShowRevoke(false);
              }}
              style={{ background: "oklch(0.68 0.22 25)", color: "white" }}
            >
              Revoke Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function AccessRequestsManagerPage() {
  const [requests, setRequests] = useState<AccessRequest[]>(ACCESS_REQUESTS);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [emailNotify, setEmailNotify] = useState(true);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const history = requests.filter(
    (r) => r.status === "denied" || r.status === "expired"
  );

  function handleApprove(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              respondedAt: new Date().toISOString(),
              expiresAt: new Date(
                Date.now() + 60 * 86400000
              ).toISOString(),
            }
          : r
      )
    );
    toast.success("Access approved. Recruiter has been notified.");
  }

  function handleDeny(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "denied" as const,
              respondedAt: new Date().toISOString(),
            }
          : r
      )
    );
    toast("Request denied.", { icon: "🚫" });
  }

  function handleRevoke(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "expired" as const,
              expiresAt: new Date().toISOString(),
            }
          : r
      )
    );
    toast("Access revoked. Effective immediately.");
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Recruiting"
          title="Access Requests"
          subtitle="Review and manage who can see Jordan's full recruiting profile"
        />

        {/* ── Summary strip ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* Pending */}
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              background:
                pending.length > 0
                  ? "oklch(0.78 0.16 75 / 0.08)"
                  : "var(--bg-surface)",
              borderColor:
                pending.length > 0
                  ? "oklch(0.78 0.16 75 / 0.30)"
                  : "var(--border)",
            }}
          >
            <div
              className="text-[32px] font-bold leading-none"
              style={{
                color:
                  pending.length > 0
                    ? "oklch(0.78 0.16 75)"
                    : "var(--text-muted)",
              }}
            >
              {pending.length}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[var(--text-muted)]">
              Pending
            </div>
            {pending.length > 0 && (
              <div
                className="text-[10px] mt-0.5"
                style={{ color: "oklch(0.78 0.16 75)" }}
              >
                Needs attention
              </div>
            )}
          </div>

          {/* Approved */}
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-[32px] font-bold leading-none"
              style={{ color: "oklch(0.75 0.12 140)" }}
            >
              {approved.length}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[var(--text-muted)]">
              Active Grants
            </div>
          </div>

          {/* Expired / Denied */}
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-[32px] font-bold leading-none"
              style={{ color: "var(--text-muted)" }}
            >
              {history.length}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[var(--text-muted)]">
              Past Requests
            </div>
          </div>
        </div>

        {/* ── Pending section ── */}
        {pending.length > 0 && (
          <section className="mb-8">
            {/* Amber attention bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
              style={{
                background: "oklch(0.78 0.16 75 / 0.10)",
                border: "1px solid oklch(0.78 0.16 75 / 0.30)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  fill="oklch(0.78 0.16 75 / 0.20)"
                  stroke="oklch(0.78 0.16 75)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="13"
                  stroke="oklch(0.78 0.16 75)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <line
                  x1="12"
                  y1="17"
                  x2="12.01"
                  y2="17"
                  stroke="oklch(0.78 0.16 75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "oklch(0.78 0.16 75)" }}
              >
                You have {pending.length} request
                {pending.length !== 1 ? "s" : ""} awaiting your response
              </span>
            </div>

            <div className="space-y-4">
              {pending.map((req) => (
                <PendingRequestCard
                  key={req.id}
                  req={req}
                  expiryDays={60}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Active grants ── */}
        {approved.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-3">
              Active access grants
            </h2>
            <div className="space-y-2">
              {approved.map((req) => (
                <ActiveGrantRow
                  key={req.id}
                  req={req}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Request history ── */}
        <section className="mb-8">
          <button
            type="button"
            className="flex items-center justify-between w-full"
            onClick={() => setHistoryExpanded((v) => !v)}
          >
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
              Request history ({history.length})
            </h2>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform"
              style={{
                color: "var(--text-muted)",
                transform: historyExpanded
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {historyExpanded && (
            <div className="mt-3">
              <p className="text-[12px] text-[var(--text-muted)] mb-3">
                This is a permanent record of all access requests.
              </p>
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table className="w-full text-[12px]">
                  <thead>
                    <tr
                      style={{
                        background: "var(--bg-surface)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {["Requester", "School", "Date", "Outcome"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((req, i) => (
                      <tr
                        key={req.id}
                        style={{
                          background:
                            i % 2 === 0
                              ? "transparent"
                              : "oklch(0.16 0.005 260 / 0.40)",
                        }}
                      >
                        <td className="px-3 py-2.5 text-[var(--text-primary)]">
                          {req.requesterName}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--text-muted)]">
                          <div>{req.school}</div>
                          <DivisionChip division={req.division} />
                        </td>
                        <td className="px-3 py-2.5 text-[var(--text-muted)]">
                          {formatDate(req.requestedAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={
                              req.status === "denied"
                                ? {
                                    background: "oklch(0.68 0.22 25 / 0.12)",
                                    color: "oklch(0.68 0.22 25)",
                                  }
                                : {
                                    background: "oklch(0.22 0.01 260)",
                                    color: "var(--text-muted)",
                                  }
                            }
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── Email notifications ── */}
        <section className="mb-8">
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-xl border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Email notifications
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Notify me by email when I receive new access requests
              </div>
            </div>
            <Toggle
              checked={emailNotify}
              onChange={setEmailNotify}
              label="Toggle email notifications"
            />
          </div>
        </section>

        {/* ── Privacy reminder footer ── */}
        <div
          className="flex gap-3 p-4 rounded-xl border"
          style={{
            background: "oklch(0.72 0.18 290 / 0.05)",
            borderColor: "oklch(0.72 0.18 290 / 0.18)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 mt-0.5"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="oklch(0.72 0.18 290)"
              strokeWidth="1.5"
              fill="oklch(0.72 0.18 290 / 0.10)"
            />
            <path
              d="M12 8v4m0 4h.01"
              stroke="oklch(0.72 0.18 290)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
            Access requests are never automatically approved. Every request is
            individual and requires your explicit yes. Revoking access takes
            effect immediately — no delays.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
