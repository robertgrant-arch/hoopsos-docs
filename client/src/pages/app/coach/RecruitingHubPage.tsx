/**
 * RecruitingHubPage — Coach-facing recruiting profile management.
 *
 * Sections:
 *  1. Recruiting overview stats (4 cards)
 *  2. Profile list (table/cards with status)
 *  3. Profile editor (right panel or modal)
 *  4. Contact requests panel
 *  5. Recruiting checklist (per player)
 *  6. Class of 2027 cohort overview
 */
import { useState, useMemo } from "react";
import {
  Eye,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ExternalLink,
  Shield,
  Edit3,
  EyeOff,
  FileText,
  Users,
  Star,
  Trash2,
  Send,
  Archive,
  GraduationCap,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type VerifiedStat = {
  id: string;
  label: string;
  value: string;
  verifiedAt: string;
  category: string;
  verified: boolean;
};

type RecruitingProfile = {
  playerId: string;
  playerName: string;
  position: string;
  gradYear: number;
  height: string;
  weight?: string;
  ageGroup: string;
  profileStatus: "draft" | "active" | "hidden" | "none";
  coachVerified: boolean;
  profileViews: number;
  contactRequests: number;
  lastViewed?: string;
  publicUrl: string;
  highlights: string[];
  verifiedStats: VerifiedStat[];
  coachEndorsement: string;
  collegeInterests: string[];
  offers: string[];
};

type ContactRequest = {
  id: string;
  requesterName: string;
  institution: string;
  date: string;
  playerId: string;
  playerName: string;
  message: string;
  archived: boolean;
};

/* -------------------------------------------------------------------------- */
/* Mock data — inline                                                          */
/* -------------------------------------------------------------------------- */

const MOCK_PROFILES: RecruitingProfile[] = [
  {
    playerId: "p10",
    playerName: "Malik Henderson",
    position: "PG",
    gradYear: 2027,
    height: "6'1\"",
    weight: "175 lbs",
    ageGroup: "17U",
    profileStatus: "active",
    coachVerified: true,
    profileViews: 312,
    contactRequests: 5,
    lastViewed: "2026-05-14",
    publicUrl: "/profile/malik-henderson",
    coachEndorsement: "Malik is an elite facilitator with college-level court vision. His defensive intensity and leadership make him one of the top PGs in the 2027 class. Division I ready.",
    highlights: [
      "2026 State Showcase — 18 pts, 12 ast, 0 TO",
      "Nike EYBL session highlights — March 2026",
      "Elite Skill Circuit — top performer film",
    ],
    collegeInterests: ["Duke", "UNC", "Michigan", "Gonzaga"],
    offers: ["Memphis (Verbal)"],
    verifiedStats: [
      { id: "vs1", label: "40-Yard Dash", value: "4.61s", verifiedAt: "2026-04-10", category: "Athleticism", verified: true },
      { id: "vs2", label: "Vertical Jump", value: "34\"", verifiedAt: "2026-04-10", category: "Athleticism", verified: true },
      { id: "vs3", label: "3-PT %", value: "41%", verifiedAt: "2026-03-15", category: "Shooting", verified: true },
      { id: "vs4", label: "Free Throw %", value: "87%", verifiedAt: "2026-03-15", category: "Shooting", verified: true },
      { id: "vs5", label: "Assist/TO Ratio", value: "3.8", verifiedAt: "2026-04-01", category: "Playmaking", verified: true },
    ],
  },
  {
    playerId: "p6",
    playerName: "Jaylen Scott",
    position: "SG",
    gradYear: 2027,
    height: "6'3\"",
    weight: "185 lbs",
    ageGroup: "17U",
    profileStatus: "active",
    coachVerified: true,
    profileViews: 247,
    contactRequests: 4,
    lastViewed: "2026-05-13",
    publicUrl: "/profile/jaylen-scott",
    coachEndorsement: "Jaylen has the size and shooting ability college programs covet. His off-ball movement and catch-and-shoot efficiency are already at a high level for his age.",
    highlights: [
      "Regional tournament — back-to-back 25+ point games",
      "Shooting drill showcase — 68% from college three",
    ],
    collegeInterests: ["Villanova", "Butler", "Xavier"],
    offers: [],
    verifiedStats: [
      { id: "vs6", label: "3-PT %", value: "38%", verifiedAt: "2026-03-20", category: "Shooting", verified: true },
      { id: "vs7", label: "Wingspan", value: "6'7\"", verifiedAt: "2026-02-14", category: "Measurables", verified: true },
      { id: "vs8", label: "Points Per Game", value: "18.4", verifiedAt: "2026-03-20", category: "Production", verified: true },
    ],
  },
  {
    playerId: "p8",
    playerName: "Noah Rivera",
    position: "SF",
    gradYear: 2026,
    height: "6'5\"",
    weight: "200 lbs",
    ageGroup: "17U",
    profileStatus: "active",
    coachVerified: false,
    profileViews: 288,
    contactRequests: 3,
    lastViewed: "2026-05-11",
    publicUrl: "/profile/noah-rivera",
    coachEndorsement: "",
    highlights: [
      "Spring league highlights — versatile two-way wing",
    ],
    collegeInterests: ["Penn State", "George Washington", "VCU"],
    offers: [],
    verifiedStats: [
      { id: "vs9", label: "Rebounds Per Game", value: "7.2", verifiedAt: "2026-03-01", category: "Production", verified: true },
      { id: "vs10", label: "Steals Per Game", value: "2.1", verifiedAt: "2026-03-01", category: "Defense", verified: false },
    ],
  },
  {
    playerId: "p3",
    playerName: "Tyler Brooks",
    position: "PF",
    gradYear: 2027,
    height: "6'7\"",
    weight: "215 lbs",
    ageGroup: "17U",
    profileStatus: "draft",
    coachVerified: false,
    profileViews: 0,
    contactRequests: 0,
    publicUrl: "/profile/tyler-brooks",
    coachEndorsement: "",
    highlights: [],
    collegeInterests: [],
    offers: [],
    verifiedStats: [
      { id: "vs11", label: "Wingspan", value: "6'11\"", verifiedAt: "2026-01-20", category: "Measurables", verified: true },
    ],
  },
  {
    playerId: "p7",
    playerName: "Cam Porter",
    position: "C",
    gradYear: 2027,
    height: "6'9\"",
    weight: "230 lbs",
    ageGroup: "17U",
    profileStatus: "hidden",
    coachVerified: false,
    profileViews: 54,
    contactRequests: 0,
    lastViewed: "2026-04-02",
    publicUrl: "/profile/cam-porter",
    coachEndorsement: "Cam has elite rim-protecting instincts. Family has requested reduced visibility while evaluating options.",
    highlights: [
      "Post moves workout — advanced footwork",
    ],
    collegeInterests: ["Rutgers", "Seton Hall"],
    offers: [],
    verifiedStats: [
      { id: "vs12", label: "Block Rate", value: "8.4%", verifiedAt: "2026-02-28", category: "Defense", verified: true },
    ],
  },
  {
    playerId: "p12",
    playerName: "Brandon Lee",
    position: "PG",
    gradYear: 2029,
    height: "5'10\"",
    ageGroup: "15U",
    profileStatus: "none",
    coachVerified: false,
    profileViews: 0,
    contactRequests: 0,
    publicUrl: "/profile/brandon-lee",
    coachEndorsement: "",
    highlights: [],
    collegeInterests: [],
    offers: [],
    verifiedStats: [],
  },
];

const MOCK_CONTACT_REQUESTS: ContactRequest[] = [
  {
    id: "cr1",
    requesterName: "Coach David Hartman",
    institution: "Duke University",
    date: "2026-05-13",
    playerId: "p10",
    playerName: "Malik Henderson",
    message: "Hi Coach Grant, we've been following Malik's development closely and would love to set up a campus visit. His court vision and leadership translate exactly to what we look for at our level.",
    archived: false,
  },
  {
    id: "cr2",
    requesterName: "Mike Townsend",
    institution: "Michigan Basketball",
    date: "2026-05-12",
    playerId: "p10",
    playerName: "Malik Henderson",
    message: "Very impressed with Malik's film from the EYBL session. Can we arrange a call with you and his family this week?",
    archived: false,
  },
  {
    id: "cr3",
    requesterName: "Coach Sarah Lin",
    institution: "Villanova University",
    date: "2026-05-10",
    playerId: "p6",
    playerName: "Jaylen Scott",
    message: "Jaylen's shooting metrics are outstanding. We'd love to evaluate him at our summer camp. Would love to connect with you.",
    archived: false,
  },
  {
    id: "cr4",
    requesterName: "Coach Ben Foster",
    institution: "Butler University",
    date: "2026-05-09",
    playerId: "p6",
    playerName: "Jaylen Scott",
    message: "Watching Jaylen's film — the off-ball movement is exactly what we need. Is he planning to attend any evaluation events this summer?",
    archived: false,
  },
  {
    id: "cr5",
    requesterName: "Marcus Webb Sr.",
    institution: "Penn State Athletics",
    date: "2026-05-07",
    playerId: "p8",
    playerName: "Noah Rivera",
    message: "Strong interest in Noah as a two-way wing. Please forward any updated film highlights when available.",
    archived: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Color constants                                                             */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

function profileStatusMeta(status: RecruitingProfile["profileStatus"]) {
  switch (status) {
    case "active":  return { label: "Active",      color: SUCCESS, bg: "oklch(0.75 0.12 140 / 0.12)" };
    case "draft":   return { label: "Draft",       color: WARNING, bg: "oklch(0.78 0.16 75 / 0.12)"  };
    case "hidden":  return { label: "Hidden",      color: "oklch(0.55 0.02 260)", bg: "oklch(0.30 0.005 260 / 0.5)" };
    case "none":    return { label: "Not Started", color: "oklch(0.45 0.01 260)", bg: "oklch(0.22 0.005 260 / 0.5)" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Checklist items                                                             */
/* -------------------------------------------------------------------------- */

function buildChecklist(profile: RecruitingProfile) {
  return [
    { label: "Profile active",          done: profile.profileStatus === "active" },
    { label: "Coach verification",       done: profile.coachVerified              },
    { label: "Film highlights uploaded", done: profile.highlights.length > 0      },
    { label: "Academic info confirmed",  done: false                              }, // placeholder
    { label: "Parent contact verified",  done: true                               }, // placeholder
    { label: "At least 1 verified stat", done: profile.verifiedStats.some((s) => s.verified) },
  ];
}

/* -------------------------------------------------------------------------- */
/* Profile Status Badge                                                        */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: RecruitingProfile["profileStatus"] }) {
  const meta = profileStatusMeta(status);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile Editor modal/panel                                                  */
/* -------------------------------------------------------------------------- */

function ProfileEditor({
  profile,
  onClose,
  onSave,
}: {
  profile: RecruitingProfile;
  onClose: () => void;
  onSave: (updated: RecruitingProfile) => void;
}) {
  const [endorsement, setEndorsement] = useState(profile.coachEndorsement);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight ?? "");
  const [status, setStatus] = useState<RecruitingProfile["profileStatus"]>(
    profile.profileStatus === "none" ? "draft" : profile.profileStatus
  );
  const [stats, setStats] = useState<VerifiedStat[]>(profile.verifiedStats);
  const [highlights, setHighlights] = useState<string[]>(profile.highlights);
  const [colleges, setColleges] = useState<string[]>(profile.collegeInterests);
  const [newStat, setNewStat] = useState({ label: "", value: "", category: "" });
  const [newHighlight, setNewHighlight] = useState("");
  const [newCollege, setNewCollege] = useState("");

  function addStat() {
    if (!newStat.label || !newStat.value) return;
    setStats((prev) => [
      ...prev,
      { id: `vs-new-${Date.now()}`, ...newStat, verifiedAt: "", verified: false },
    ]);
    setNewStat({ label: "", value: "", category: "" });
  }

  function verifyStat(id: string) {
    setStats((prev) =>
      prev.map((s) => s.id === id ? { ...s, verified: true, verifiedAt: new Date().toISOString().split("T")[0] } : s)
    );
    toast.success("Stat verified");
  }

  function removeStat(id: string) {
    setStats((prev) => prev.filter((s) => s.id !== id));
  }

  function addHighlight() {
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight("");
  }

  function addCollege() {
    if (!newCollege.trim()) return;
    setColleges((prev) => [...prev, newCollege.trim()]);
    setNewCollege("");
  }

  function handlePublish() {
    const updated: RecruitingProfile = {
      ...profile,
      coachEndorsement: endorsement,
      height,
      weight,
      profileStatus: "active",
      verifiedStats: stats,
      highlights,
      collegeInterests: colleges,
    };
    onSave(updated);
    toast.success("Profile is now visible to recruiters");
    onClose();
  }

  function handleSaveDraft() {
    const updated: RecruitingProfile = {
      ...profile,
      coachEndorsement: endorsement,
      height,
      weight,
      profileStatus: status === "active" ? "active" : status,
      verifiedStats: stats,
      highlights,
      collegeInterests: colleges,
    };
    onSave(updated);
    toast.success("Profile saved");
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-[17px] font-bold">Edit Profile — {profile.playerName}</DialogTitle>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {profile.position} · Class of {profile.gradYear}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">Height</label>
              <Input value={height} onChange={(e) => setHeight(e.target.value)} className="text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">Weight</label>
              <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 185 lbs" className="text-[13px]" />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground block mb-2">Profile Visibility</label>
            <div className="flex gap-2">
              {(["active", "draft", "hidden"] as const).map((s) => {
                const meta = profileStatusMeta(s);
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex-1 py-2.5 px-3 rounded-lg border text-[12px] font-medium transition-all"
                    style={{
                      borderColor: status === s ? meta.color : "var(--border)",
                      background: status === s ? meta.bg : "transparent",
                      color: status === s ? meta.color : "oklch(0.55 0.02 260)",
                      minHeight: 44,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coach endorsement */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
              Coach Endorsement <span className="font-normal">(visible on public profile)</span>
            </label>
            <Textarea
              value={endorsement}
              onChange={(e) => setEndorsement(e.target.value)}
              placeholder="Write a personal endorsement that will appear on this player's recruiting profile..."
              className="resize-none text-[13px]"
              rows={4}
            />
          </div>

          {/* Verified stats */}
          <div>
            <div className="text-[12px] font-medium text-muted-foreground mb-2">Verified Stats</div>
            <div className="space-y-2 mb-3">
              {stats.map((stat) => (
                <div key={stat.id} className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{stat.label}</span>
                      <span className="text-[13px] font-mono" style={{ color: PRIMARY }}>{stat.value}</span>
                      {stat.category && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {stat.category}
                        </span>
                      )}
                    </div>
                    {stat.verified && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" style={{ color: SUCCESS }} />
                        <span className="text-[11px] text-muted-foreground">Verified {stat.verifiedAt}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!stat.verified && (
                      <Button size="sm" variant="outline" onClick={() => verifyStat(stat.id)} style={{ minHeight: 36, fontSize: 11 }}>
                        Verify
                      </Button>
                    )}
                    <button
                      onClick={() => removeStat(stat.id)}
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newStat.label}
                onChange={(e) => setNewStat((p) => ({ ...p, label: e.target.value }))}
                placeholder="Label (e.g. 3-PT %)"
                className="text-[12px]"
              />
              <Input
                value={newStat.value}
                onChange={(e) => setNewStat((p) => ({ ...p, value: e.target.value }))}
                placeholder="Value"
                className="text-[12px] w-24"
              />
              <Input
                value={newStat.category}
                onChange={(e) => setNewStat((p) => ({ ...p, category: e.target.value }))}
                placeholder="Category"
                className="text-[12px] w-28"
              />
              <Button size="sm" variant="outline" onClick={addStat} style={{ minHeight: 44 }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Highlight reels */}
          <div>
            <div className="text-[12px] font-medium text-muted-foreground mb-2">Highlight Reels</div>
            <div className="space-y-1.5 mb-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border text-[13px]">
                  <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{h}</span>
                  <button
                    onClick={() => setHighlights((prev) => prev.filter((_, j) => j !== i))}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Add highlight description..."
                className="text-[12px]"
                onKeyDown={(e) => e.key === "Enter" && addHighlight()}
              />
              <Button size="sm" variant="outline" onClick={addHighlight} style={{ minHeight: 44 }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* College interests */}
          <div>
            <div className="text-[12px] font-medium text-muted-foreground mb-2">College Interests</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {colleges.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border"
                  style={{ borderColor: "oklch(0.72 0.18 290 / 0.3)", color: PRIMARY, background: "oklch(0.72 0.18 290 / 0.08)" }}
                >
                  {c}
                  <button
                    onClick={() => setColleges((prev) => prev.filter((_, j) => j !== i))}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCollege}
                onChange={(e) => setNewCollege(e.target.value)}
                placeholder="Add college..."
                className="text-[12px]"
                onKeyDown={(e) => e.key === "Enter" && addCollege()}
              />
              <Button size="sm" variant="outline" onClick={addCollege} style={{ minHeight: 44 }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
            <Button
              onClick={handlePublish}
              className="gap-2"
              style={{ background: PRIMARY, color: "white", minHeight: 44 }}
            >
              <Eye className="w-3.5 h-3.5" />
              Publish Profile
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} style={{ minHeight: 44 }}>
              Save Draft
            </Button>
            <a
              href={profile.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              style={{ minHeight: 44 }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact request card                                                        */
/* -------------------------------------------------------------------------- */

function ContactRequestCard({
  req,
  onArchive,
}: {
  req: ContactRequest;
  onArchive: (id: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(
    `Hi ${req.requesterName.split(" ")[0]}, thank you for your interest in ${req.playerName}. I'd be happy to connect — please reach me at coach.grant@texaselite.org.`
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold">{req.requesterName}</span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: PRIMARY }}
            >
              <GraduationCap className="w-3 h-3" />
              {req.institution}
            </span>
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Re: {req.playerName} · {formatDate(req.date)}
          </div>
        </div>
        <button
          onClick={() => onArchive(req.id)}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Archive"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{req.message}</p>

      {showReply ? (
        <div className="space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="resize-none text-[13px]"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                toast.success(`Reply sent to ${req.requesterName}`);
                setShowReply(false);
              }}
              style={{ background: PRIMARY, color: "white", minHeight: 44 }}
              className="gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Send to Parent + Player
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReply(false)} style={{ minHeight: 44 }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowReply(true)}
          className="gap-2"
          style={{ minHeight: 44 }}
        >
          <Mail className="w-3.5 h-3.5" /> Respond
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recruiting checklist panel                                                  */
/* -------------------------------------------------------------------------- */

function RecruitingChecklist({ profile }: { profile: RecruitingProfile }) {
  const items = buildChecklist(profile);
  const done  = items.filter((i) => i.done).length;
  const pct   = Math.round((done / items.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[13px] font-semibold">{profile.playerName}</div>
          <span className="text-[12px] font-mono" style={{ color: pct === 100 ? SUCCESS : PRIMARY }}>
            {done}/{items.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? SUCCESS : pct >= 66 ? PRIMARY : WARNING,
            }}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.done
              ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
              : <AlertCircle  className="w-4 h-4 shrink-0" style={{ color: "oklch(0.45 0.01 260)" }} />
            }
            <span className="text-[13px]" style={{ color: item.done ? "var(--foreground)" : "oklch(0.50 0.01 260)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Class of 2027 cohort overview                                               */
/* -------------------------------------------------------------------------- */

function ClassCohortSection({ profiles }: { profiles: RecruitingProfile[] }) {
  const [open, setOpen] = useState(true);
  const classOf2027 = profiles.filter((p) => p.gradYear === 2027);
  const active = classOf2027.filter((p) => p.profileStatus === "active").length;
  const totalViews = classOf2027.reduce((s, p) => s + p.profileViews, 0);
  const totalContacts = classOf2027.reduce((s, p) => s + p.contactRequests, 0);
  const withOffers = classOf2027.filter((p) => p.offers.length > 0).length;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-4 h-4" style={{ color: PRIMARY }} />
          <span className="text-[14px] font-semibold">Class of 2027 Overview</span>
          <span className="text-[11px] text-muted-foreground">({classOf2027.length} players)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Profiles",    value: active,         color: SUCCESS },
              { label: "Total Profile Views", value: totalViews,    color: PRIMARY },
              { label: "Contact Requests",    value: totalContacts, color: WARNING },
              { label: "With Offers",         value: withOffers,    color: "oklch(0.72 0.20 35)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border p-4 text-center"
                style={{ background: `${stat.color.replace(")", " / 0.06)")}` }}
              >
                <div className="text-[24px] font-black leading-none" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {classOf2027.map((p) => {
              const meta = profileStatusMeta(p.profileStatus);
              const checkItems = buildChecklist(p);
              const checkPct = Math.round(
                (checkItems.filter((i) => i.done).length / checkItems.length) * 100
              );
              return (
                <div key={p.playerId} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: `${meta.color.replace(")", " / 0.12)")}`, color: meta.color }}
                  >
                    {getInitials(p.playerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate">{p.playerName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{p.position}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-32">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${checkPct}%`, background: checkPct === 100 ? SUCCESS : PRIMARY }}
                      />
                    </div>
                  </div>
                  <StatusBadge status={p.profileStatus} />
                  {p.coachVerified && (
                    <span title="Coach verified">
                      <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: PRIMARY }} />
                    </span>
                  )}
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-semibold">{p.profileViews}</div>
                    <div className="text-[10px] text-muted-foreground">views</div>
                  </div>
                </div>
              );
            })}
          </div>

          {classOf2027.filter((p) => p.offers.length > 0).length > 0 && (
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Offers Received</div>
              <div className="space-y-1.5">
                {classOf2027.filter((p) => p.offers.length > 0).flatMap((p) =>
                  p.offers.map((offer) => (
                    <div key={`${p.playerId}-${offer}`} className="flex items-center gap-2.5 text-[13px]">
                      <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.82 0.16 85)" }} />
                      <span className="font-medium">{p.playerName}</span>
                      <span className="text-muted-foreground">—</span>
                      <span style={{ color: SUCCESS }}>{offer}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function RecruitingHubPage() {
  const [profiles, setProfiles]           = useState<RecruitingProfile[]>(MOCK_PROFILES);
  const [contacts, setContacts]           = useState<ContactRequest[]>(MOCK_CONTACT_REQUESTS);
  const [editingProfile, setEditingProfile] = useState<RecruitingProfile | null>(null);
  const [checklistPlayer, setChecklistPlayer] = useState<RecruitingProfile | null>(null);
  const [activeSection, setActiveSection] = useState<"list" | "contacts" | "checklist">("list");

  const overviewStats = useMemo(() => ({
    active:   profiles.filter((p) => p.profileStatus === "active").length,
    views:    profiles.reduce((s, p) => s + p.profileViews, 0),
    contacts: contacts.filter((c) => !c.archived).length,
    verified: profiles.reduce((s, p) => s + p.verifiedStats.filter((v) => v.verified).length, 0),
  }), [profiles, contacts]);

  function handleSaveProfile(updated: RecruitingProfile) {
    setProfiles((prev) =>
      prev.map((p) => (p.playerId === updated.playerId ? updated : p))
    );
  }

  function toggleProfileStatus(playerId: string) {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const next =
          p.profileStatus === "active" ? "hidden" :
          p.profileStatus === "hidden" ? "active" :
          p.profileStatus === "draft"  ? "active" : "active";
        toast.success(`Profile ${next === "active" ? "activated" : "hidden"}`);
        return { ...p, profileStatus: next };
      })
    );
  }

  function archiveContact(id: string) {
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, archived: true } : c));
    toast.success("Contact request archived");
  }

  const activeContacts = contacts.filter((c) => !c.archived);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8">
        <PageHeader
          eyebrow="Coach HQ · Recruiting"
          title="Recruiting Hub"
          subtitle="Manage player profiles, respond to college inquiries, and help your best athletes get seen by recruiters."
        />

        {/* 1. Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Profiles",    value: overviewStats.active,   icon: <Eye className="w-4 h-4" />,          color: SUCCESS },
            { label: "Total Profile Views", value: overviewStats.views,    icon: <Users className="w-4 h-4" />,        color: PRIMARY },
            { label: "Contact Requests",   value: `${overviewStats.contacts} pending`, icon: <Mail className="w-4 h-4" />, color: WARNING },
            { label: "Verified Stats",     value: overviewStats.verified, icon: <Shield className="w-4 h-4" />,       color: "oklch(0.72 0.20 35)" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <span style={{ color: card.color }}>{card.icon}</span>
              <div className="text-[28px] font-black leading-none mt-2" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[12px] text-muted-foreground mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Section nav */}
        <div className="flex gap-2 border-b border-border pb-0">
          {(["list", "contacts", "checklist"] as const).map((s) => {
            const labels = { list: "Player Profiles", contacts: `Contact Requests (${activeContacts.length})`, checklist: "Recruiting Checklist" };
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px"
                style={{
                  borderColor: activeSection === s ? PRIMARY : "transparent",
                  color: activeSection === s ? PRIMARY : "oklch(0.55 0.02 260)",
                  minHeight: 44,
                }}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>

        {/* 2. Profile list */}
        {activeSection === "list" && (
          <div className="space-y-3">
            {profiles.map((profile) => {
              const meta = profileStatusMeta(profile.profileStatus);
              return (
                <div key={profile.playerId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                      style={{ background: `${meta.color.replace(")", " / 0.12)")}`, color: meta.color }}
                    >
                      {getInitials(profile.playerName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold">{profile.playerName}</span>
                        <span className="text-[12px] text-muted-foreground">{profile.position} · {profile.height} · Class of {profile.gradYear}</span>
                        {profile.coachVerified && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: PRIMARY }}
                          >
                            <Shield className="w-2.5 h-2.5" /> Coach Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <StatusBadge status={profile.profileStatus} />
                        {profile.profileStatus !== "none" && (
                          <>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {profile.profileViews} views
                            </span>
                            {profile.contactRequests > 0 && (
                              <span className="text-[11px] flex items-center gap-1" style={{ color: WARNING }}>
                                <Mail className="w-3 h-3" /> {profile.contactRequests} requests
                              </span>
                            )}
                          </>
                        )}
                        {profile.offers.length > 0 && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: SUCCESS }}>
                            <Star className="w-3 h-3" /> {profile.offers.length} offer{profile.offers.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          setChecklistPlayer(profile);
                          setActiveSection("checklist");
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        style={{ minHeight: 44 }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Checklist
                      </button>
                      {profile.profileStatus !== "none" && (
                        <>
                          <button
                            onClick={() => toggleProfileStatus(profile.playerId)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-[12px] font-medium transition-colors"
                            style={{ minHeight: 44, color: profile.profileStatus === "active" ? WARNING : SUCCESS }}
                          >
                            {profile.profileStatus === "active"
                              ? <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                              : <><Eye className="w-3.5 h-3.5" /> Activate</>
                            }
                          </button>
                          <a
                            href={profile.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            style={{ minHeight: 44 }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => setEditingProfile(profile)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                        style={{ background: PRIMARY, color: "white", minHeight: 44 }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {profile.profileStatus === "none" ? "Create Profile" : "Edit"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Contact requests */}
        {activeSection === "contacts" && (
          <div className="space-y-4">
            {activeContacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-[14px] text-muted-foreground">No pending contact requests</p>
              </div>
            ) : (
              activeContacts.map((req) => (
                <ContactRequestCard key={req.id} req={req} onArchive={archiveContact} />
              ))
            )}
            {contacts.filter((c) => c.archived).length > 0 && (
              <p className="text-[12px] text-muted-foreground text-center">
                {contacts.filter((c) => c.archived).length} archived request(s) not shown
              </p>
            )}
          </div>
        )}

        {/* 5. Recruiting checklist */}
        {activeSection === "checklist" && (
          <div className="space-y-4">
            {/* Player selector */}
            <div className="flex gap-2 flex-wrap">
              {profiles.filter((p) => p.profileStatus !== "none").map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => setChecklistPlayer(p)}
                  className="px-3 py-2 rounded-lg border text-[12px] font-medium transition-all"
                  style={{
                    borderColor: checklistPlayer?.playerId === p.playerId ? PRIMARY : "var(--border)",
                    color: checklistPlayer?.playerId === p.playerId ? PRIMARY : "oklch(0.55 0.02 260)",
                    background: checklistPlayer?.playerId === p.playerId ? "oklch(0.72 0.18 290 / 0.08)" : "transparent",
                    minHeight: 44,
                  }}
                >
                  {p.playerName}
                </button>
              ))}
            </div>

            {checklistPlayer ? (
              <RecruitingChecklist profile={checklistPlayer} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.filter((p) => p.profileStatus !== "none").map((p) => (
                  <RecruitingChecklist key={p.playerId} profile={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Class of 2027 cohort */}
        <ClassCohortSection profiles={profiles} />
      </div>

      {/* Profile editor modal */}
      {editingProfile && (
        <ProfileEditor
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={handleSaveProfile}
        />
      )}
    </AppShell>
  );
}
