/**
 * DirectorRecruitingCRMPage — Lightweight recruiting CRM for directors.
 * Route: /app/director/recruiting-crm
 *
 * Sections:
 *   1. Insights strip
 *   2. Upcoming follow-ups
 *   3. Pipeline kanban (by-school) / by-player toggle
 *   4. Log conversation modal
 *   5. Conversation history
 */
import { useState, useMemo } from "react";
import {
  Plus,
  Phone,
  Mail,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  X,
  Zap,
  TrendingUp,
  Clock,
  Star,
  Target,
  LayoutGrid,
  List,
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

type PipelineStage = "aware" | "interested" | "active" | "evaluating" | "committed";

type SchoolRelationship = {
  id: string;
  school: string;
  division: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  stage: PipelineStage;
  players: string[];
  lastActivity: string;
  coachContact: string;
  coachTitle: string;
};

type Conversation = {
  id: string;
  playerId: string;
  playerName: string;
  school: string;
  division: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  date: string;
  type: "phone" | "in_person" | "email" | "at_event";
  notes: string;
  followUpDate?: string;
  followUpNote?: string;
  followUpDone: boolean;
};

type Player = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PLAYERS: Player[] = [
  { id: "p1", name: "Malik Henderson",  position: "PG", gradYear: 2027 },
  { id: "p2", name: "Jaylen Scott",     position: "SG", gradYear: 2027 },
  { id: "p3", name: "Noah Rivera",      position: "SF", gradYear: 2027 },
  { id: "p4", name: "Tyler Brooks",     position: "PF", gradYear: 2027 },
  { id: "p5", name: "Cam Porter",       position: "C",  gradYear: 2027 },
  { id: "p6", name: "Jordan Okafor",    position: "SF", gradYear: 2028 },
  { id: "p7", name: "DeShawn Mills",    position: "PG", gradYear: 2028 },
];

const SCHOOL_RELATIONSHIPS: SchoolRelationship[] = [
  {
    id: "sr1", school: "Penn State",       division: "D1", stage: "active",
    players: ["Malik Henderson"], lastActivity: "2026-05-14",
    coachContact: "David Hartman", coachTitle: "Director of Recruiting",
  },
  {
    id: "sr2", school: "Michigan",         division: "D1", stage: "active",
    players: ["Malik Henderson"], lastActivity: "2026-05-13",
    coachContact: "Mike Townsend", coachTitle: "Head Coach",
  },
  {
    id: "sr3", school: "Villanova",        division: "D1", stage: "interested",
    players: ["Jaylen Scott", "Malik Henderson"], lastActivity: "2026-05-12",
    coachContact: "Carla Nguyen", coachTitle: "Assistant Coach",
  },
  {
    id: "sr4", school: "Butler",           division: "D1", stage: "interested",
    players: ["Jaylen Scott"], lastActivity: "2026-05-11",
    coachContact: "Ben Foster", coachTitle: "Assistant Coach",
  },
  {
    id: "sr5", school: "George Washington",division: "D1", stage: "evaluating",
    players: ["Noah Rivera"], lastActivity: "2026-05-10",
    coachContact: "Marcus Webb Sr.", coachTitle: "Head Coach",
  },
  {
    id: "sr6", school: "Seton Hall",       division: "D1", stage: "aware",
    players: ["Malik Henderson", "Cam Porter"], lastActivity: "2026-05-08",
    coachContact: "James Carter", coachTitle: "Assistant Coach",
  },
  {
    id: "sr7", school: "Monmouth Univ.",   division: "D1", stage: "aware",
    players: ["Jordan Okafor"], lastActivity: "2026-05-07",
    coachContact: "Erika Fontaine", coachTitle: "Head Coach",
  },
  {
    id: "sr8", school: "Rider University", division: "D2", stage: "aware",
    players: ["Tyler Brooks"], lastActivity: "2026-05-05",
    coachContact: "Lisa Powell", coachTitle: "Recruiting Coordinator",
  },
  {
    id: "sr9", school: "Rutgers",          division: "D1", stage: "active",
    players: ["Malik Henderson"], lastActivity: "2026-05-15",
    coachContact: "Tom Reilly", coachTitle: "Assistant Coach",
  },
  {
    id: "sr10", school: "Memphis",         division: "D1", stage: "committed",
    players: ["Malik Henderson"], lastActivity: "2026-05-01",
    coachContact: "Antonio Price", coachTitle: "Head Coach",
  },
];

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1", playerId: "p1", playerName: "Malik Henderson",
    school: "Penn State", division: "D1",
    date: "2026-05-14", type: "phone",
    notes: "Call with David Hartman. Discussed Malik's junior season trajectory. Penn State very interested in a campus visit in July. David asked for updated film package from the state showcase. Good conversation — they're tracking Malik as a priority prospect.",
    followUpDate: "2026-05-20", followUpNote: "Send updated film package to David Hartman", followUpDone: false,
  },
  {
    id: "c2", playerId: "p2", playerName: "Jaylen Scott",
    school: "Villanova", division: "D1",
    date: "2026-05-12", type: "email",
    notes: "Email thread with Carla Nguyen. She requested Jaylen's shooting breakdown from the last assessment. Forwarded the export PDF. She says Jaylen is being evaluated alongside their other targets in the 2027 class.",
    followUpDate: "2026-05-18", followUpNote: "Follow up on Villanova's evaluation timeline", followUpDone: false,
  },
  {
    id: "c3", playerId: "p1", playerName: "Malik Henderson",
    school: "Michigan", division: "D1",
    date: "2026-05-10", type: "in_person",
    notes: "Mike Townsend attended the regional showcase. Pulled me aside after Malik's performance to express strong interest. Wants to schedule an official visit for August. Malik played extremely well — 19 pts, 11 ast, 2 TO. Michigan is serious.",
    followUpDate: "2026-05-17", followUpNote: "Confirm August visit dates with Malik's family", followUpDone: false,
  },
  {
    id: "c4", playerId: "p3", playerName: "Noah Rivera",
    school: "George Washington", division: "D1",
    date: "2026-05-09", type: "phone",
    notes: "Initial call with Marcus Webb. GWU is targeting Noah as a 3-and-D wing. Marcus emphasized their system and NBA player development track record. Family is aware. Need to arrange a campus visit conversation.",
    followUpDate: "2026-05-19", followUpNote: "Talk to Rivera family about GWU campus visit interest", followUpDone: false,
  },
  {
    id: "c5", playerId: "p1", playerName: "Malik Henderson",
    school: "Memphis", division: "D1",
    date: "2026-05-01", type: "at_event",
    notes: "Met Antonio Price at the Nike EYBL session. Verbal offer extended. Malik and family are evaluating alongside other options. Very positive environment — Memphis coaching staff were impressive in person. Malik's parents want to see all options before committing.",
    followUpDone: true,
  },
  {
    id: "c6", playerId: "p2", playerName: "Jaylen Scott",
    school: "Butler", division: "D1",
    date: "2026-05-08", type: "phone",
    notes: "Ben Foster called about Jaylen's off-ball movement metrics in the assessment data. They're comparing him to another SG in their target class. Encouraged Jaylen to send a personal note expressing interest.",
    followUpDate: "2026-05-22", followUpNote: "Prompt Jaylen to send personal note to Butler staff", followUpDone: false,
  },
  {
    id: "c7", playerId: "p6", playerName: "Jordan Okafor",
    school: "Monmouth Univ.", division: "D1",
    date: "2026-05-04", type: "email",
    notes: "Erika Fontaine sent initial inquiry about Jordan's availability for summer camp evaluation. Responded with Jordan's profile link and confirmed he's available in July.",
    followUpDone: true,
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

const STAGE_META: Record<PipelineStage, { label: string; color: string; bg: string; description: string }> = {
  aware:      { label: "Aware",      color: MUTED,    bg: "oklch(0.25 0.01 260)",         description: "School has viewed a profile"                                  },
  interested: { label: "Interested", color: WARNING,  bg: "oklch(0.78 0.16 75 / 0.12)",   description: "School has requested access or downloaded export"             },
  active:     { label: "Active",     color: PRIMARY,  bg: "oklch(0.72 0.18 290 / 0.12)",  description: "Coach-to-coach conversation initiated"                        },
  evaluating: { label: "Evaluating", color: "oklch(0.72 0.18 190)", bg: "oklch(0.72 0.18 190 / 0.12)", description: "School watching player in person or requesting additional materials" },
  committed:  { label: "Committed",  color: SUCCESS,  bg: "oklch(0.75 0.12 140 / 0.12)",  description: "Player has committed or enrolled"                             },
};

const STAGE_ORDER: PipelineStage[] = ["aware", "interested", "active", "evaluating", "committed"];

function convTypeIcon(type: Conversation["type"]) {
  switch (type) {
    case "phone":     return <Phone className="w-3.5 h-3.5" />;
    case "in_person": return <Users className="w-3.5 h-3.5" />;
    case "email":     return <Mail className="w-3.5 h-3.5" />;
    case "at_event":  return <Star className="w-3.5 h-3.5" />;
  }
}

function convTypeLabel(type: Conversation["type"]) {
  switch (type) {
    case "phone":     return "Phone call";
    case "in_person": return "In-person";
    case "email":     return "Email";
    case "at_event":  return "At event";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

/* -------------------------------------------------------------------------- */
/* Kanban card                                                                 */
/* -------------------------------------------------------------------------- */

function KanbanCard({
  rel,
  onMoveNext,
}: {
  rel: SchoolRelationship;
  onMoveNext: (id: string) => void;
}) {
  const dc = divColor(rel.division);
  const canAdvance = rel.stage !== "committed";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 hover:border-[oklch(0.72_0.18_290_/_0.35)] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{rel.school}</div>
          <span className="inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold mt-0.5" style={{ background: `${dc}14`, color: dc }}>
            {rel.division}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {rel.players.map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIMARY }} />
            {p}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-[var(--text-muted)]">{rel.coachContact}</div>
        <div className="text-[10px]" style={{ color: MUTED }}>{rel.coachTitle}</div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(rel.lastActivity)}
        </span>
        {canAdvance && (
          <button
            onClick={() => onMoveNext(rel.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
            style={{
              background: "oklch(0.72 0.18 290 / 0.10)",
              color: PRIMARY,
            }}
          >
            Move forward <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Log Conversation Modal                                                      */
/* -------------------------------------------------------------------------- */

type ConvFormState = {
  playerId: string;
  school: string;
  date: string;
  type: Conversation["type"];
  notes: string;
  followUpDate: string;
  followUpNote: string;
};

function LogConversationModal({ onClose, onSave }: { onClose: () => void; onSave: (conv: Conversation) => void }) {
  const [form, setForm] = useState<ConvFormState>({
    playerId: "",
    school: "",
    date: new Date().toISOString().split("T")[0],
    type: "phone",
    notes: "",
    followUpDate: "",
    followUpNote: "",
  });

  function handleSave() {
    if (!form.playerId || !form.school || !form.notes) {
      toast.error("Please fill in player, school, and notes");
      return;
    }
    const player = PLAYERS.find((p) => p.id === form.playerId);
    const newConv: Conversation = {
      id:            `c-new-${Date.now()}`,
      playerId:      form.playerId,
      playerName:    player?.name ?? "Unknown",
      school:        form.school,
      division:      "D1",
      date:          form.date,
      type:          form.type,
      notes:         form.notes,
      followUpDate:  form.followUpDate || undefined,
      followUpNote:  form.followUpNote || undefined,
      followUpDone:  false,
    };
    onSave(newConv);
    toast.success("Conversation logged");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Log Conversation</h2>
            <div className="text-[12px] text-[var(--text-muted)] mt-0.5">Record a recruiting conversation</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Player */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1.5">Player *</label>
            <select
              value={form.playerId}
              onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] px-3 py-2.5"
              style={{ minHeight: 44 }}
            >
              <option value="">Select player...</option>
              {PLAYERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.position} · {p.gradYear})</option>
              ))}
            </select>
          </div>

          {/* School / Recruiter */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1.5">School / Program *</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              placeholder="e.g. Penn State, Michigan..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-muted)]"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] px-3 py-2.5"
                style={{ minHeight: 44 }}
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Conversation["type"] }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] px-3 py-2.5"
                style={{ minHeight: 44 }}
              >
                <option value="phone">Phone call</option>
                <option value="in_person">In-person</option>
                <option value="email">Email</option>
                <option value="at_event">At event</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1.5">Notes *</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="What was discussed? Key takeaways, interest level, next steps..."
              rows={5}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] px-3 py-2.5 resize-none placeholder-[var(--text-muted)]"
            />
          </div>

          {/* Follow-up */}
          <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" style={{ background: "oklch(0.18 0.008 260)" }}>
            <div className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
              Follow-up Reminder (optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">Due date</label>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] px-3 py-2"
                  style={{ minHeight: 40 }}
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">Reminder</label>
                <input
                  type="text"
                  value={form.followUpNote}
                  onChange={(e) => setForm((f) => ({ ...f, followUpNote: e.target.value }))}
                  placeholder="What to do..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] px-3 py-2 placeholder-[var(--text-muted)]"
                  style={{ minHeight: 40 }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: PRIMARY, color: "white", minHeight: 44 }}
            >
              Save Conversation
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ minHeight: 44 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Conversation card                                                           */
/* -------------------------------------------------------------------------- */

function ConversationCard({ conv, onMarkDone }: { conv: Conversation; onMarkDone: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const dc = divColor(conv.division);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left hover:bg-[var(--bg-base)] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${PRIMARY}14`, color: PRIMARY }}
            >
              {convTypeIcon(conv.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{conv.playerName}</span>
                <span className="text-[12px] text-[var(--text-muted)]">—</span>
                <span className="text-[13px] text-[var(--text-primary)]">{conv.school}</span>
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `${dc}14`, color: dc }}>
                  {conv.division}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                <span>{formatDate(conv.date)}</span>
                <span>·</span>
                <span>{convTypeLabel(conv.type)}</span>
                {conv.followUpDate && !conv.followUpDone && (
                  <>
                    <span>·</span>
                    <span style={{ color: isOverdue(conv.followUpDate) ? DANGER : WARNING }}>
                      Follow-up: {formatDate(conv.followUpDate)}
                    </span>
                  </>
                )}
                {conv.followUpDone && (
                  <>
                    <span>·</span>
                    <span style={{ color: SUCCESS }}>✓ Follow-up done</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {expanded ? <ChevronRight className="w-4 h-4 text-[var(--text-muted)] rotate-90 shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-5 py-4 space-y-3">
          <div className="text-[13px] text-[var(--text-muted)] leading-relaxed">{conv.notes}</div>
          {conv.followUpDate && conv.followUpNote && !conv.followUpDone && (
            <div
              className="rounded-lg p-3 border flex items-start justify-between gap-3"
              style={{
                borderColor: isOverdue(conv.followUpDate) ? `${DANGER}30` : `${WARNING}30`,
                background: isOverdue(conv.followUpDate) ? `${DANGER}08` : `${WARNING}08`,
              }}
            >
              <div>
                <div className="text-[11px] font-semibold" style={{ color: isOverdue(conv.followUpDate) ? DANGER : WARNING }}>
                  Follow-up {isOverdue(conv.followUpDate) ? "(overdue)" : `due ${formatDate(conv.followUpDate)}`}
                </div>
                <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{conv.followUpNote}</div>
              </div>
              <button
                onClick={() => onMarkDone(conv.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                style={{ background: `${SUCCESS}14`, color: SUCCESS }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* By-player view                                                              */
/* -------------------------------------------------------------------------- */

function ByPlayerView({ relationships }: { relationships: SchoolRelationship[] }) {
  const byPlayer = useMemo(() => {
    return PLAYERS.map((player) => {
      const rels = relationships.filter((r) => r.players.includes(player.name));
      const stageCounts = STAGE_ORDER.reduce((acc, s) => {
        acc[s] = rels.filter((r) => r.stage === s).length;
        return acc;
      }, {} as Record<PipelineStage, number>);
      return { player, rels, stageCounts };
    }).filter((r) => r.rels.length > 0);
  }, [relationships]);

  return (
    <div className="space-y-3">
      {byPlayer.map(({ player, stageCounts }) => (
        <div key={player.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">{player.name}</span>
              <span className="text-[12px] text-[var(--text-muted)] ml-2">{player.position} · {player.gradYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {STAGE_ORDER.map((stage) => {
              const count = stageCounts[stage];
              if (count === 0) return null;
              const meta = STAGE_META[stage];
              return (
                <div key={stage} className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {count} {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function DirectorRecruitingCRMPage() {
  const [relationships, setRelationships]   = useState<SchoolRelationship[]>(SCHOOL_RELATIONSHIPS);
  const [conversations, setConversations]   = useState<Conversation[]>(CONVERSATIONS);
  const [showModal, setShowModal]           = useState(false);
  const [viewMode, setViewMode]             = useState<"kanban" | "player">("kanban");

  function handleMoveNext(id: string) {
    setRelationships((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const currentIdx = STAGE_ORDER.indexOf(r.stage);
        const nextStage  = STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)];
        const nextMeta   = STAGE_META[nextStage];
        toast.success(`${r.school} moved to ${nextMeta.label}`);
        return { ...r, stage: nextStage };
      })
    );
  }

  function handleSaveConversation(conv: Conversation) {
    setConversations((prev) => [conv, ...prev]);
  }

  function handleMarkFollowUpDone(id: string) {
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, followUpDone: true } : c)
    );
    toast.success("Follow-up marked as done");
  }

  // Insights
  const mostActiveSchool = useMemo(() => {
    const counts = new Map<string, number>();
    conversations.forEach((c) => counts.set(c.school, (counts.get(c.school) ?? 0) + 1));
    let best = { school: "", count: 0 };
    counts.forEach((count, school) => { if (count > best.count) best = { school, count }; });
    return best;
  }, [conversations]);

  const mostTargetedGradYear = useMemo(() => {
    const d1convs = conversations.filter((c) => c.division === "D1");
    const years   = new Map<number, number>();
    d1convs.forEach((c) => {
      const player = PLAYERS.find((p) => p.id === c.playerId);
      if (player) years.set(player.gradYear, (years.get(player.gradYear) ?? 0) + 1);
    });
    let best = { year: 0, count: 0 };
    years.forEach((count, year) => { if (count > best.count) best = { year, count }; });
    return best;
  }, [conversations]);

  const mostConversationsPlayer = useMemo(() => {
    const counts = new Map<string, number>();
    conversations.forEach((c) => counts.set(c.playerName, (counts.get(c.playerName) ?? 0) + 1));
    let best = { name: "", count: 0 };
    counts.forEach((count, name) => { if (count > best.count) best = { name, count }; });
    return best;
  }, [conversations]);

  // Upcoming follow-ups (not done, sorted by date)
  const upcomingFollowUps = useMemo(() => {
    return conversations
      .filter((c) => c.followUpDate && !c.followUpDone)
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
  }, [conversations]);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Recruiting"
          title="School Relationships"
          subtitle="Track which programs are interested in your athletes and manage your recruiting outreach"
          actions={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
              style={{ background: PRIMARY, color: "white", minHeight: 40 }}
            >
              <Plus className="w-4 h-4" />
              Log Conversation
            </button>
          }
        />

        {/* Insights strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${PRIMARY}14`, color: PRIMARY }}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--text-primary)]">{mostActiveSchool.school || "—"}</div>
              <div className="text-[11px] text-[var(--text-muted)]">Most active school · {mostActiveSchool.count} conversations</div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${SUCCESS}14`, color: SUCCESS }}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--text-primary)]">
                Class of {mostTargetedGradYear.year || "—"}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Most D1 recruiting focus · {mostTargetedGradYear.count} conversations</div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${WARNING}14`, color: WARNING }}>
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--text-primary)]">{mostConversationsPlayer.name || "—"}</div>
              <div className="text-[11px] text-[var(--text-muted)]">Most recruiter conversations · {mostConversationsPlayer.count} logged</div>
            </div>
          </div>
        </div>

        {/* Upcoming follow-ups */}
        {upcomingFollowUps.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: PRIMARY }} />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Follow-ups Due</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "oklch(0.78 0.16 75 / 0.14)", color: WARNING }}
              >
                {upcomingFollowUps.length}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {upcomingFollowUps.slice(0, 5).map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isOverdue(c.followUpDate!) ? DANGER : WARNING }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)]">
                      {c.playerName} — {c.school}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">{c.followUpNote}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: isOverdue(c.followUpDate!) ? DANGER : WARNING }}
                    >
                      {isOverdue(c.followUpDate!) ? "Overdue" : formatDate(c.followUpDate!)}
                    </span>
                    <button
                      onClick={() => handleMarkFollowUpDone(c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ background: `${SUCCESS}14`, color: SUCCESS }}
                      title="Mark done"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Pipeline</h2>
          <div
            className="flex items-center rounded-lg border border-[var(--border)] p-0.5 overflow-hidden"
            style={{ background: "oklch(0.18 0.005 260)" }}
          >
            {([
              { id: "kanban" as const, icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "By School" },
              { id: "player" as const, icon: <List className="w-3.5 h-3.5" />,       label: "By Player" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
                style={{
                  background: viewMode === opt.id ? PRIMARY : "transparent",
                  color: viewMode === opt.id ? "white" : "var(--text-muted)",
                }}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline kanban (by-school) */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {STAGE_ORDER.map((stage) => {
                const meta  = STAGE_META[stage];
                const cards = relationships.filter((r) => r.stage === stage);
                return (
                  <div key={stage} className="w-56 shrink-0 space-y-2">
                    {/* Column header */}
                    <div className="rounded-xl border border-[var(--border)] px-3.5 py-3 flex items-center justify-between"
                      style={{ background: meta.bg }}
                    >
                      <div>
                        <div className="text-[12px] font-bold" style={{ color: meta.color }}>{meta.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{meta.description}</div>
                      </div>
                      <span
                        className="rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: `${meta.color}20`, color: meta.color }}
                      >
                        {cards.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {cards.length > 0 ? (
                        cards.map((rel) => (
                          <KanbanCard key={rel.id} rel={rel} onMoveNext={handleMoveNext} />
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center">
                          <div className="text-[11px] text-[var(--text-muted)]">No schools</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* By-player view */}
        {viewMode === "player" && (
          <ByPlayerView relationships={relationships} />
        )}

        {/* Conversation history */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Conversation History</h2>
            <span className="text-[12px] text-[var(--text-muted)]">({conversations.length} logged)</span>
          </div>

          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              onMarkDone={handleMarkFollowUpDone}
            />
          ))}
        </div>
      </div>

      {/* Log conversation modal */}
      {showModal && (
        <LogConversationModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveConversation}
        />
      )}
    </AppShell>
  );
}
