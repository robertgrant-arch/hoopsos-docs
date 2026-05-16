/**
 * BadgeAwardsPage — Coach awards development badges to players.
 * Route: /app/coach/recruiting/badges
 */
import { useState, useMemo } from "react";
import {
  Plus,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type BadgeInstance = {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeCategory: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  awardedBy: string;
  awardedAt: string;
  evidenceType: "assessment" | "film" | "observation" | "attendance";
  evidenceNote: string;
  iconKey: string;
};

type BadgeDefinition = {
  id: string;
  name: string;
  category: string;
  threshold: string;
  iconKey: string;
  description: string;
  awardedCount: number;
};

type RosterPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ROSTER_PLAYERS: RosterPlayer[] = [
  { id: "p1", name: "Jordan Mills",   position: "PG", gradYear: 2027 },
  { id: "p2", name: "Marcus Webb",    position: "SG", gradYear: 2027 },
  { id: "p3", name: "Devon Price",    position: "SF", gradYear: 2026 },
  { id: "p4", name: "Isaiah Thomas",  position: "PF", gradYear: 2027 },
  { id: "p5", name: "Cameron Lee",    position: "C",  gradYear: 2027 },
  { id: "p6", name: "Tyler Brooks",   position: "SG", gradYear: 2028 },
  { id: "p7", name: "Andre Johnson",  position: "PG", gradYear: 2027 },
  { id: "p8", name: "Darius King",    position: "SF", gradYear: 2026 },
];

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "perimeter-defender",
    name: "Perimeter Defender",
    category: "Defense",
    threshold: "On-ball D rating ≥ 8.0 across two consecutive assessments",
    iconKey: "shield",
    description: "Awarded for sustained elite on-ball defensive performance verified by multiple assessment sessions.",
    awardedCount: 3,
  },
  {
    id: "shot-maker",
    name: "Shot Maker",
    category: "Shooting",
    threshold: "Shooting ≥ 8.0 + film evidence confirmed",
    iconKey: "target",
    description: "Shooting efficiency at a consistent level confirmed by both assessment scores and film review.",
    awardedCount: 2,
  },
  {
    id: "floor-general",
    name: "Floor General",
    category: "Playmaking",
    threshold: "IQ rating ≥ 8.5 + 3+ leadership observations",
    iconKey: "star",
    description: "Demonstrates elite basketball IQ and floor leadership documented across multiple observations.",
    awardedCount: 2,
  },
  {
    id: "high-coachability",
    name: "High Coachability",
    category: "Character",
    threshold: "90%+ attendance + all IDP cycles on time, 6+ months",
    iconKey: "clock",
    description: "Sustained excellence in program participation, IDP follow-through, and professional attitude.",
    awardedCount: 4,
  },
  {
    id: "program-cornerstone",
    name: "Program Cornerstone",
    category: "Commitment",
    threshold: "3+ consecutive seasons, same program",
    iconKey: "users",
    description: "Long-term commitment and loyalty to the program across multiple competitive seasons.",
    awardedCount: 1,
  },
  {
    id: "film-student",
    name: "Film Student",
    category: "Development",
    threshold: "20+ annotated sessions reviewed and responded",
    iconKey: "film",
    description: "Active engagement with film review — annotating, responding to coach notes, and applying feedback.",
    awardedCount: 1,
  },
  {
    id: "tournament-performer",
    name: "Tournament Performer",
    category: "Performance",
    threshold: "Coach observation during verified tournament",
    iconKey: "trophy",
    description: "Elevated performance specifically observed and documented during tournament competition.",
    awardedCount: 3,
  },
  {
    id: "peer-leader",
    name: "Peer Leader",
    category: "Character",
    threshold: "Nominated by coaching staff, documented",
    iconKey: "users2",
    description: "Recognized by coaching staff for positive peer influence, mentorship, and team culture contribution.",
    awardedCount: 2,
  },
];

const INITIAL_AWARDS: BadgeInstance[] = [
  { id: "bi-1", badgeId: "perimeter-defender", badgeName: "Perimeter Defender", badgeCategory: "Defense",      playerId: "p1", playerName: "Jordan Mills",  playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-04-18", evidenceType: "assessment",  evidenceNote: "On-ball D 8.4 and 8.1 — consecutive March/April assessments",      iconKey: "shield" },
  { id: "bi-2", badgeId: "floor-general",       badgeName: "Floor General",       badgeCategory: "Playmaking",  playerId: "p1", playerName: "Jordan Mills",  playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-03-25", evidenceType: "film",        evidenceNote: "IQ 8.7 avg + 4 leadership observations in practice film",           iconKey: "star"   },
  { id: "bi-3", badgeId: "high-coachability",   badgeName: "High Coachability",   badgeCategory: "Character",   playerId: "p1", playerName: "Jordan Mills",  playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-02-10", evidenceType: "attendance",  evidenceNote: "97% attendance rate, all 4 IDP check-ins on time since Sept 2025",   iconKey: "clock"  },
  { id: "bi-4", badgeId: "tournament-performer",badgeName: "Tournament Performer",badgeCategory: "Performance", playerId: "p1", playerName: "Jordan Mills",  playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-04-01", evidenceType: "observation", evidenceNote: "Nike EYBL session — 22 pts, 11 ast, standout performance",            iconKey: "trophy" },
  { id: "bi-5", badgeId: "shot-maker",          badgeName: "Shot Maker",          badgeCategory: "Shooting",    playerId: "p1", playerName: "Jordan Mills",  playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-04-10", evidenceType: "film",        evidenceNote: "Shooting 8.2, film confirms mid-range pull-up consistency",          iconKey: "target" },
  { id: "bi-6", badgeId: "perimeter-defender",  badgeName: "Perimeter Defender",  badgeCategory: "Defense",     playerId: "p2", playerName: "Marcus Webb",   playerPosition: "SG", awardedBy: "Coach Grant", awardedAt: "2026-04-20", evidenceType: "assessment",  evidenceNote: "On-ball D ratings 8.0 and 8.3 across March–April",                   iconKey: "shield" },
  { id: "bi-7", badgeId: "high-coachability",   badgeName: "High Coachability",   badgeCategory: "Character",   playerId: "p2", playerName: "Marcus Webb",   playerPosition: "SG", awardedBy: "Coach Grant", awardedAt: "2026-03-01", evidenceType: "attendance",  evidenceNote: "93% attendance, 3 IDP cycles completed without prompting",            iconKey: "clock"  },
  { id: "bi-8", badgeId: "tournament-performer",badgeName: "Tournament Performer",badgeCategory: "Performance", playerId: "p2", playerName: "Marcus Webb",   playerPosition: "SG", awardedBy: "Coach Grant", awardedAt: "2026-03-30", evidenceType: "observation", evidenceNote: "State Showcase — 4/6 from three, best shooting performance",            iconKey: "trophy" },
  { id: "bi-9", badgeId: "floor-general",       badgeName: "Floor General",       badgeCategory: "Playmaking",  playerId: "p7", playerName: "Andre Johnson", playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-04-12", evidenceType: "film",        evidenceNote: "IQ score 8.2, 5 coach obs documenting on-court leadership",           iconKey: "star"   },
  { id: "bi-10",badgeId: "high-coachability",   badgeName: "High Coachability",   badgeCategory: "Character",   playerId: "p7", playerName: "Andre Johnson", playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-01-20", evidenceType: "attendance",  evidenceNote: "96% attendance, all IDP deadlines met over 7 months",                 iconKey: "clock"  },
  { id: "bi-11",badgeName: "Tournament Performer",badgeId: "tournament-performer",badgeCategory: "Performance", playerId: "p7", playerName: "Andre Johnson", playerPosition: "PG", awardedBy: "Coach Grant", awardedAt: "2026-03-28", evidenceType: "observation", evidenceNote: "Regional tournament — controlled pace, 3 game-winning assists",         iconKey: "trophy" },
  { id: "bi-12",badgeId: "perimeter-defender",  badgeName: "Perimeter Defender",  badgeCategory: "Defense",     playerId: "p3", playerName: "Devon Price",   playerPosition: "SF", awardedBy: "Coach Grant", awardedAt: "2026-04-05", evidenceType: "assessment",  evidenceNote: "D rating 8.0 and 8.2 two consecutive March assessments",              iconKey: "shield" },
  { id: "bi-13",badgeId: "high-coachability",   badgeName: "High Coachability",   badgeCategory: "Character",   playerId: "p5", playerName: "Cameron Lee",   playerPosition: "C",  awardedBy: "Coach Grant", awardedAt: "2026-03-10", evidenceType: "attendance",  evidenceNote: "95% attendance, all IDP cycles on time since October 2025",           iconKey: "clock"  },
  { id: "bi-14",badgeId: "high-coachability",   badgeName: "High Coachability",   badgeCategory: "Character",   playerId: "p4", playerName: "Isaiah Thomas", playerPosition: "PF", awardedBy: "Coach Grant", awardedAt: "2026-02-28", evidenceType: "attendance",  evidenceNote: "91% attendance, IDP milestones hit early in 3 of 4 cycles",           iconKey: "clock"  },
  { id: "bi-15",badgeId: "shot-maker",          badgeName: "Shot Maker",          badgeCategory: "Shooting",    playerId: "p4", playerName: "Isaiah Thomas", playerPosition: "PF", awardedBy: "Coach Grant", awardedAt: "2026-04-14", evidenceType: "film",        evidenceNote: "Mid-range efficiency 8.1 confirmed in film — reliable mid-post touch",iconKey: "target" },
  { id: "bi-16",badgeId: "film-student",        badgeName: "Film Student",        badgeCategory: "Development", playerId: "p6", playerName: "Tyler Brooks",  playerPosition: "SG", awardedBy: "Coach Grant", awardedAt: "2026-04-22", evidenceType: "film",        evidenceNote: "22 annotated film sessions, coach notes responded within 48hrs avg",  iconKey: "film"   },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function categoryColor(cat: string) {
  switch (cat) {
    case "Defense":     return DANGER;
    case "Shooting":    return WARNING;
    case "Playmaking":  return PRIMARY;
    case "Character":   return SUCCESS;
    case "Performance": return "oklch(0.72 0.20 35)";
    case "Development": return "oklch(0.70 0.15 200)";
    case "Commitment":  return "oklch(0.65 0.14 320)";
    default:            return "oklch(0.55 0.02 260)";
  }
}

function evidenceTypeLabel(t: BadgeInstance["evidenceType"]) {
  switch (t) {
    case "assessment":  return "Assessment";
    case "film":        return "Film";
    case "observation": return "Observation";
    case "attendance":  return "Attendance Record";
  }
}

/* -------------------------------------------------------------------------- */
/* SVG Badge Icon                                                              */
/* -------------------------------------------------------------------------- */

function BadgeIcon({ iconKey, size = 28, color = PRIMARY }: { iconKey: string; size?: number; color?: string }) {
  const s = size;
  switch (iconKey) {
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M14 3L4 7v7c0 6 4.2 10.4 10 11 5.8-.6 10-5 10-11V7L14 3z"
            fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.8} />
          <path d="M10 14l3 3 5-5.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke={color} strokeWidth={1.8} fill={color} fillOpacity={0.1} />
          <circle cx="14" cy="14" r="6"  stroke={color} strokeWidth={1.5} />
          <circle cx="14" cy="14" r="2.5" fill={color} />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M14 3l3.4 6.8 7.5 1.1-5.4 5.3 1.3 7.5L14 20l-6.8 3.7 1.3-7.5L3 10.9l7.5-1.1L14 3z"
            fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke={color} strokeWidth={1.8} fill={color} fillOpacity={0.1} />
          <path d="M14 8v6l3.5 3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M9 4h10v8a5 5 0 01-10 0V4z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.8} />
          <path d="M9 9H5a3 3 0 003 3h1M19 9h4a3 3 0 01-3 3h-1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M14 18v4M10 23h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      );
    case "users":
    case "users2":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="10" cy="10" r="4" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.6} />
          <circle cx="20" cy="10" r="3" stroke={color} strokeWidth={1.4} fillOpacity={0} />
          <path d="M4 22c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M22 22c0-2.8-1.8-5-4-5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    case "film":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="4" y="7" width="20" height="14" rx="2" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={1.8} />
          <path d="M4 11h20M4 17h20M9 7v4M14 7v4M19 7v4M9 17v4M14 17v4M19 17v4" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke={color} strokeWidth={1.8} fill={color} fillOpacity={0.1} />
          <path d="M14 10v4M14 17v.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Badge definition card                                                       */
/* -------------------------------------------------------------------------- */

function BadgeDefCard({
  def,
  onAward,
}: {
  def: BadgeDefinition;
  onAward: (def: BadgeDefinition) => void;
}) {
  const cc = categoryColor(def.category);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${cc.replace(")", " / 0.12)")}` }}
        >
          <BadgeIcon iconKey={def.iconKey} size={24} color={cc} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold leading-tight">{def.name}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: `${cc.replace(")", " / 0.12)")}`, color: cc }}
            >
              {def.category}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{def.threshold}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">
          Awarded <span className="font-semibold" style={{ color: cc }}>{def.awardedCount}×</span> this season
        </span>
        <Button
          size="sm"
          onClick={() => onAward(def)}
          style={{ background: cc, color: "white", minHeight: 36, fontSize: 12 }}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Award
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline feed entry                                                         */
/* -------------------------------------------------------------------------- */

function FeedEntry({ award }: { award: BadgeInstance }) {
  const cc = categoryColor(award.badgeCategory);
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${cc.replace(")", " / 0.12)")}` }}
      >
        <BadgeIcon iconKey={award.iconKey} size={18} color={cc} />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-[var(--border)] last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[13px] font-semibold">{award.playerName}</span>
            <span className="text-[12px] text-[var(--text-muted)] ml-1.5">{award.playerPosition}</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">{formatDate(award.awardedAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${cc.replace(")", " / 0.12)")}`, color: cc }}
          >
            {award.badgeName}
          </span>
        </div>
        <div className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {evidenceTypeLabel(award.evidenceType)}
          </span>
          {" — "}
          {award.evidenceNote}
        </div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">by {award.awardedBy}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Award Modal                                                                 */
/* -------------------------------------------------------------------------- */

function AwardModal({
  preselectedBadge,
  onClose,
  onSubmit,
}: {
  preselectedBadge: BadgeDefinition | null;
  onClose: () => void;
  onSubmit: (award: Omit<BadgeInstance, "id">) => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>(ROSTER_PLAYERS[0].id);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(preselectedBadge?.id ?? BADGE_DEFINITIONS[0].id);
  const [evidenceType, setEvidenceType] = useState<BadgeInstance["evidenceType"]>("assessment");
  const [evidenceDetail, setEvidenceDetail] = useState("");
  const [linkRef, setLinkRef] = useState("");

  const player  = ROSTER_PLAYERS.find(p => p.id === selectedPlayer)!;
  const badge   = BADGE_DEFINITIONS.find(b => b.id === selectedBadgeId)!;
  const cc      = categoryColor(badge.category);

  function handleSubmit() {
    if (!evidenceDetail.trim()) {
      toast.warning("Please describe the evidence supporting this award.");
      return;
    }
    onSubmit({
      badgeId:          badge.id,
      badgeName:        badge.name,
      badgeCategory:    badge.category,
      playerId:         player.id,
      playerName:       player.name,
      playerPosition:   player.position,
      awardedBy:        "Coach Marcus Grant",
      awardedAt:        new Date().toISOString().split("T")[0],
      evidenceType,
      evidenceNote:     evidenceDetail + (linkRef ? ` [ref: ${linkRef}]` : ""),
      iconKey:          badge.iconKey,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10">
          <div className="text-[15px] font-bold">Award Badge</div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Player selector */}
          <div>
            <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1.5">Player</label>
            <div className="relative">
              <select
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-[13px] appearance-none pr-8"
                style={{ minHeight: 44 }}
              >
                {ROSTER_PLAYERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.position} · {p.gradYear}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Badge selector */}
          <div>
            <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1.5">Badge</label>
            <div className="relative">
              <select
                value={selectedBadgeId}
                onChange={e => setSelectedBadgeId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-[13px] appearance-none pr-8"
                style={{ minHeight: 44 }}
              >
                {BADGE_DEFINITIONS.map(b => (
                  <option key={b.id} value={b.id}>{b.name} — {b.category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {badge && (
              <div className="mt-2 text-[11px] text-[var(--text-muted)] px-1">
                Threshold: {badge.threshold}
              </div>
            )}
          </div>

          {/* Evidence type */}
          <div>
            <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-2">Evidence Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["assessment", "film", "observation", "attendance"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setEvidenceType(t)}
                  className="py-2.5 px-3 rounded-xl border text-[12px] font-medium transition-all text-left"
                  style={{
                    borderColor: evidenceType === t ? PRIMARY : "var(--border)",
                    background:  evidenceType === t ? "oklch(0.72 0.18 290 / 0.10)" : "transparent",
                    color:       evidenceType === t ? PRIMARY : "var(--text-muted)",
                    minHeight:   44,
                  }}
                >
                  {evidenceTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence detail */}
          <div>
            <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1.5">Evidence Detail</label>
            <Textarea
              value={evidenceDetail}
              onChange={e => setEvidenceDetail(e.target.value)}
              placeholder="Describe the specific evidence that supports this badge award..."
              className="resize-none text-[13px]"
              rows={3}
            />
          </div>

          {/* Optional link */}
          <div>
            <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1.5">
              Link to Assessment / Film Clip <span className="font-normal">(optional)</span>
            </label>
            <Input
              value={linkRef}
              onChange={e => setLinkRef(e.target.value)}
              placeholder="Assessment date (e.g. 2026-04-18) or clip ID..."
              className="text-[13px]"
            />
          </div>

          {/* Preview */}
          {evidenceDetail && (
            <div
              className="rounded-xl p-4 space-y-1"
              style={{ background: `${cc.replace(")", " / 0.08)")}`, border: `1px solid ${cc.replace(")", " / 0.20)")}` }}
            >
              <div className="flex items-center gap-2">
                <BadgeIcon iconKey={badge.iconKey} size={20} color={cc} />
                <span className="text-[13px] font-semibold" style={{ color: cc }}>{badge.name}</span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                You are awarding <strong style={{ color: "var(--text-primary)" }}>{badge.name}</strong> to{" "}
                <strong style={{ color: "var(--text-primary)" }}>{player.name}</strong> based on{" "}
                {evidenceDetail.slice(0, 80)}{evidenceDetail.length > 80 ? "…" : ""}.
                This will appear on their verified profile.
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            style={{ background: cc, color: "white", minHeight: 44 }}
            className="w-full gap-2"
          >
            <Check className="w-4 h-4" /> Award Badge to {player.name.split(" ")[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function BadgeAwardsPage() {
  const [awards, setAwards]         = useState<BadgeInstance[]>(INITIAL_AWARDS);
  const [modalOpen, setModalOpen]   = useState(false);
  const [preselectedBadge, setPreselectedBadge] = useState<BadgeDefinition | null>(null);
  const [defs, setDefs]             = useState<BadgeDefinition[]>(BADGE_DEFINITIONS);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    awards.forEach(a => { counts[a.badgeName] = (counts[a.badgeName] ?? 0) + 1; });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const playerCounts: Record<string, number> = {};
    awards.forEach(a => { playerCounts[a.playerId] = (playerCounts[a.playerId] ?? 0) + 1; });
    const threeOrMore = Object.values(playerCounts).filter(c => c >= 3).length;
    return { total: awards.length, mostCommon, threeOrMore, pendingReview: 0 };
  }, [awards]);

  function handleAward(award: Omit<BadgeInstance, "id">) {
    const newAward: BadgeInstance = { ...award, id: `bi-new-${Date.now()}` };
    setAwards(prev => [newAward, ...prev]);
    setDefs(prev => prev.map(d => d.id === award.badgeId ? { ...d, awardedCount: d.awardedCount + 1 } : d));
    toast.success(`Badge awarded to ${award.playerName}`);
    setModalOpen(false);
    setPreselectedBadge(null);
  }

  function openAwardModal(badge: BadgeDefinition | null = null) {
    setPreselectedBadge(badge);
    setModalOpen(true);
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Development"
          title="Badge Awards"
          subtitle="Award verified milestones to your athletes — each badge is backed by evidence"
          actions={
            <Button
              onClick={() => openAwardModal()}
              style={{ background: PRIMARY, color: "white", minHeight: 44 }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Award Badge
            </Button>
          }
        />

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Awarded This Season", value: stats.total,          color: PRIMARY },
            { label: "Most Common",               value: stats.mostCommon,     color: SUCCESS  },
            { label: "Players with 3+ Badges",    value: stats.threeOrMore,    color: WARNING  },
            { label: "Pending Review",            value: stats.pendingReview,  color: DANGER   },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="text-[24px] font-black leading-none" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* ── Left: Badge definitions ── */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono mb-3 px-1">
              Available Badges ({defs.length})
            </div>
            <div className="space-y-3">
              {defs.map(def => (
                <BadgeDefCard key={def.id} def={def} onAward={openAwardModal} />
              ))}
            </div>
          </div>

          {/* ── Right: Recent awards feed ── */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono mb-3 px-1">
              Recent Awards — This Season ({awards.length})
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              {awards.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-[14px] text-[var(--text-muted)]">No badges awarded yet this season.</div>
                </div>
              ) : (
                <div className="space-y-0">
                  {awards.map(award => (
                    <FeedEntry key={award.id} award={award} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Award modal */}
      {modalOpen && (
        <AwardModal
          preselectedBadge={preselectedBadge}
          onClose={() => { setModalOpen(false); setPreselectedBadge(null); }}
          onSubmit={handleAward}
        />
      )}
    </AppShell>
  );
}
