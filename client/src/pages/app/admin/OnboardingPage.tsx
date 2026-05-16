/**
 * OnboardingPage — New family onboarding pipeline tracker.
 * Route: /app/admin/onboarding
 *
 * Kanban-style board showing each family's journey from invite → fully active.
 * Includes a stuck-families alert panel and an expandable per-family checklist.
 */
import { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  CreditCard,
  FileText,
  UserPlus,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED_FG = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type PipelineStage = "invited" | "account_created" | "forms_complete" | "payment_setup" | "fully_active";

interface ChecklistStep {
  id: string;
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

interface FamilyCard {
  id: string;
  parentName: string;
  athleteName: string;
  ageGroup: string;
  daysSinceInvite: number;
  stage: PipelineStage;
  blocker?: string;
  checklist: ChecklistStep[];
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const FAMILIES: FamilyCard[] = [
  {
    id: "f1",
    parentName:     "Michelle Torres",
    athleteName:    "Carlos Torres",
    ageGroup:       "15U",
    daysSinceInvite: 2,
    stage:          "invited",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: false, icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: false, icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: false, icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: false, icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f2",
    parentName:     "David Kim",
    athleteName:    "Minjun Kim",
    ageGroup:       "17U",
    daysSinceInvite: 11,
    stage:          "invited",
    blocker:        "No response to invite email",
    checklist: [
      { id: "c1", label: "Account created",     done: false, icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: false, icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: false, icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: false, icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f3",
    parentName:     "Angela Foster",
    athleteName:    "Jaylen Foster",
    ageGroup:       "17U",
    daysSinceInvite: 5,
    stage:          "account_created",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: false, icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: false, icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f4",
    parentName:     "Robert Evans",
    athleteName:    "Darius Evans",
    ageGroup:       "Adult",
    daysSinceInvite: 9,
    stage:          "account_created",
    blocker:        "Waiver needs guardian signature (player is 15)",
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: false, icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: false, icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f5",
    parentName:     "Sandra Mitchell",
    athleteName:    "Tyler Mitchell",
    ageGroup:       "15U",
    daysSinceInvite: 4,
    stage:          "forms_complete",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: true,  icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: false, icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f6",
    parentName:     "Patricia Howard",
    athleteName:    "Noah Howard",
    ageGroup:       "15U",
    daysSinceInvite: 7,
    stage:          "payment_setup",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: true,  icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: true,  icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: false, icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f7",
    parentName:     "James Peterson",
    athleteName:    "Liam Peterson",
    ageGroup:       "15U",
    daysSinceInvite: 12,
    stage:          "fully_active",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: true,  icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: true,  icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
  {
    id: "f8",
    parentName:     "Keisha Williams",
    athleteName:    "Marcus Williams Jr.",
    ageGroup:       "17U",
    daysSinceInvite: 3,
    stage:          "fully_active",
    blocker:        undefined,
    checklist: [
      { id: "c1", label: "Account created",     done: true,  icon: <UserPlus className="w-3.5 h-3.5" />    },
      { id: "c2", label: "Emergency contacts",  done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
      { id: "c3", label: "Forms complete",       done: true,  icon: <FileText className="w-3.5 h-3.5" />    },
      { id: "c4", label: "Payment setup",        done: true,  icon: <CreditCard className="w-3.5 h-3.5" />  },
      { id: "c5", label: "Welcome call",         done: true,  icon: <Phone className="w-3.5 h-3.5" />       },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Pipeline config                                                             */
/* -------------------------------------------------------------------------- */

const PIPELINE_STAGES: Array<{
  id: PipelineStage;
  label: string;
  color: string;
  action?: { label: string; icon: React.ReactNode; key: string };
}> = [
  {
    id:     "invited",
    label:  "Invited",
    color:  MUTED_FG,
    action: { label: "Resend invite",       icon: <Send className="w-3 h-3" />,       key: "resend_invite"   },
  },
  {
    id:     "account_created",
    label:  "Account Created",
    color:  PRIMARY,
    action: { label: "Send forms reminder", icon: <FileText className="w-3 h-3" />,   key: "send_forms"      },
  },
  {
    id:     "forms_complete",
    label:  "Forms Complete",
    color:  WARNING,
    action: { label: "Send payment link",   icon: <CreditCard className="w-3 h-3" />, key: "send_payment"    },
  },
  {
    id:    "payment_setup",
    label: "Payment Setup",
    color: "oklch(0.72 0.14 200)",
  },
  {
    id:    "fully_active",
    label: "Fully Active",
    color: SUCCESS,
  },
];

/* -------------------------------------------------------------------------- */
/* Family card component                                                       */
/* -------------------------------------------------------------------------- */

function FamilyCardItem({
  family,
  stageColor,
  stageAction,
}: {
  family: FamilyCard;
  stageColor: string;
  stageAction?: { label: string; icon: React.ReactNode; key: string };
}) {
  const [expanded, setExpanded] = useState(false);

  const completedSteps = family.checklist.filter((c) => c.done).length;
  const totalSteps     = family.checklist.length;
  const progressPct    = (completedSteps / totalSteps) * 100;

  const isStuck = family.daysSinceInvite >= 7 && family.stage !== "fully_active";

  return (
    <div
      className="rounded-xl border border-border bg-background p-3 space-y-2.5 transition-all"
      style={isStuck ? { borderColor: `${WARNING.replace(")", " / 0.40)")}` } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{family.parentName}</div>
          <div className="text-[11px] mt-0.5" style={{ color: MUTED_FG }}>
            {family.athleteName} · {family.ageGroup}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isStuck && (
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: WARNING }} />
          )}
          <div className="text-[11px] font-medium" style={{ color: isStuck ? WARNING : MUTED_FG }}>
            {family.daysSinceInvite}d
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.01 260)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, background: stageColor }}
          />
        </div>
        <div className="text-[10px] mt-1" style={{ color: MUTED_FG }}>
          {completedSteps}/{totalSteps} steps
        </div>
      </div>

      {/* Blocker */}
      {family.blocker && (
        <div
          className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px]"
          style={{ background: `${DANGER.replace(")", " / 0.08)")}`, color: DANGER }}
        >
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          {family.blocker}
        </div>
      )}

      {/* Action button */}
      {stageAction && (
        <button
          onClick={() => toast.success(`Message sent to ${family.parentName}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            minHeight: 36,
            background: `${stageColor.replace(")", " / 0.10)")}`,
            color: stageColor,
          }}
        >
          {stageAction.icon}
          {stageAction.label}
        </button>
      )}

      {/* Expandable checklist */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1 text-[11px] transition-colors"
        style={{ color: MUTED_FG }}
      >
        <span>View checklist</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          {family.checklist.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-[12px]">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: step.done
                    ? `${SUCCESS.replace(")", " / 0.15)")}`
                    : "oklch(0.22 0.01 260)",
                  color: step.done ? SUCCESS : MUTED_FG,
                }}
              >
                {step.done ? <CheckCircle2 className="w-3 h-3" /> : step.icon}
              </div>
              <span style={{ color: step.done ? "inherit" : MUTED_FG }}>
                {step.label}
              </span>
              {step.done && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" style={{ color: SUCCESS }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stats strip                                                                 */
/* -------------------------------------------------------------------------- */

function StatsStrip({ families }: { families: FamilyCard[] }) {
  const total      = families.length;
  const active     = families.filter((f) => f.stage === "fully_active").length;
  const inProgress = families.filter((f) => f.stage !== "fully_active" && f.stage !== "invited").length;
  const blocked    = families.filter((f) => !!f.blocker).length;

  const stats = [
    { label: "New families",   value: total,      color: PRIMARY  },
    { label: "Fully onboarded", value: active,    color: SUCCESS  },
    { label: "In progress",    value: inProgress,  color: WARNING  },
    { label: "Blocked",        value: blocked,     color: DANGER   },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold mb-2" style={{ color: MUTED_FG }}>
            {s.label}
          </div>
          <div className="text-[32px] font-black leading-none" style={{ color: s.color }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stuck families alert panel                                                  */
/* -------------------------------------------------------------------------- */

const STUCK_SUGGESTIONS: Record<string, string> = {
  f2: "Try calling — email may be in spam. If no response in 2 days, remove from roster.",
  f4: "Send a direct link to the waiver with guardian signature instructions.",
};

function StuckAlert({ families }: { families: FamilyCard[] }) {
  const stuckFamilies = families.filter(
    (f) => f.daysSinceInvite >= 7 && f.stage !== "fully_active",
  );

  if (stuckFamilies.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        borderColor: `${WARNING.replace(")", " / 0.35)")}`,
        background:  `${WARNING.replace(")", " / 0.06)")}`,
      }}
    >
      <div className="flex items-center gap-2 text-[14px] font-bold" style={{ color: WARNING }}>
        <AlertTriangle className="w-5 h-5" />
        {stuckFamilies.length} {stuckFamilies.length === 1 ? "family" : "families"} stuck for 7+ days
      </div>

      <div className="space-y-3">
        {stuckFamilies.map((f) => (
          <div key={f.id} className="rounded-xl bg-background border border-border p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold">{f.parentName}</div>
                <div className="text-[11px]" style={{ color: MUTED_FG }}>
                  {f.athleteName} · stuck in{" "}
                  <span className="font-semibold capitalize">{f.stage.replace("_", " ")}</span>{" "}
                  for {f.daysSinceInvite} days
                </div>
              </div>
              <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: WARNING }} />
            </div>

            {STUCK_SUGGESTIONS[f.id] && (
              <div className="text-[12px] leading-relaxed" style={{ color: MUTED_FG }}>
                <span className="font-semibold" style={{ color: "inherit" }}>Suggested action: </span>
                {STUCK_SUGGESTIONS[f.id]}
              </div>
            )}

            <button
              onClick={() => toast.success(`Outreach logged for ${f.parentName}`)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: `${WARNING.replace(")", " / 0.12)")}`,
                color:      WARNING,
                minHeight:  32,
              }}
            >
              Log outreach
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Kanban board                                                                */
/* -------------------------------------------------------------------------- */

function KanbanBoard({ families }: { families: FamilyCard[] }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 min-w-max pb-2">
        {PIPELINE_STAGES.map((stage) => {
          const stageFamilies = families.filter((f) => f.stage === stage.id);

          return (
            <div key={stage.id} className="w-56 flex-shrink-0 space-y-2.5">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: stage.color }}
                  />
                  <span className="text-[12px] font-semibold">{stage.label}</span>
                </div>
                <span
                  className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: `${stage.color.replace(")", " / 0.14)")}`,
                    color: stage.color,
                  }}
                >
                  {stageFamilies.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {stageFamilies.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12px]"
                    style={{ color: MUTED_FG }}
                  >
                    No families
                  </div>
                ) : (
                  stageFamilies.map((family) => (
                    <FamilyCardItem
                      key={family.id}
                      family={family}
                      stageColor={stage.color}
                      stageAction={stage.action}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function OnboardingPage() {
  const [families] = useState<FamilyCard[]>(FAMILIES);

  const activeCount  = families.filter((f) => f.stage === "fully_active").length;
  const pipelinePct  = Math.round((activeCount / families.length) * 100);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          eyebrow="Admin"
          title="Onboarding Pipeline"
          subtitle="Track new families from roster add to fully active — catch blockers before they stall."
          actions={
            <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SUCCESS }}>
              <ShieldCheck className="w-4 h-4" />
              {pipelinePct}% complete
            </div>
          }
        />

        {/* Stats */}
        <StatsStrip families={families} />

        {/* Stuck alert */}
        <StuckAlert families={families} />

        {/* Kanban board */}
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.10em] font-semibold mb-3"
            style={{ color: MUTED_FG }}
          >
            Onboarding pipeline — Fall 2026
          </div>
          <KanbanBoard families={families} />
        </div>

        {/* Legend */}
        <div
          className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-6 flex-wrap"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
            Legend
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: WARNING }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Stuck 7+ days
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: DANGER }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Blocked
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED_FG }}>
            <Users className="w-3.5 h-3.5" />
            Click any card to expand checklist
          </div>
        </div>
      </div>
    </AppShell>
  );
}
