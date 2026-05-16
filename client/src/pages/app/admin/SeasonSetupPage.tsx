/**
 * SeasonSetupPage — Season setup wizard.
 * Route: /app/admin/season-setup
 *
 * 5-step wizard that collapses ~30 minutes of manual season prep into under 5.
 * Steps: Details → Roster Rollforward → Forms & Documents → Calendar Scaffold → Comms Setup
 */
import { useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Users,
  Calendar,
  FileText,
  CalendarDays,
  MessageSquare,
  Plus,
  X,
  AlertTriangle,
  Rocket,
  RefreshCw,
  Clock,
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

type RollforwardStatus = "returning" | "departing" | "uncertain";
type SeasonType = "regular" | "tournament" | "training-only";
type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface PlayerRow {
  id: string;
  name: string;
  position: string;
  ageGroup: string;
  status: RollforwardStatus;
  hasIdp: boolean;
}

interface FormItem {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
}

interface TournamentDate {
  id: string;
  name: string;
  date: string;
  location: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const INITIAL_ROSTER: PlayerRow[] = [
  { id: "p1",  name: "Marcus Williams",  position: "PG", ageGroup: "17U", status: "returning",  hasIdp: true  },
  { id: "p2",  name: "Jordan Hayes",     position: "SG", ageGroup: "17U", status: "returning",  hasIdp: true  },
  { id: "p3",  name: "Devon Clark",      position: "SF", ageGroup: "17U", status: "returning",  hasIdp: true  },
  { id: "p4",  name: "Tyler Brooks",     position: "PF", ageGroup: "17U", status: "uncertain",  hasIdp: false },
  { id: "p5",  name: "Aiden Ross",       position: "C",  ageGroup: "17U", status: "departing",  hasIdp: true  },
  { id: "p6",  name: "Caleb Torres",     position: "PG", ageGroup: "15U", status: "returning",  hasIdp: true  },
  { id: "p7",  name: "Noah Jackson",     position: "SG", ageGroup: "15U", status: "returning",  hasIdp: false },
  { id: "p8",  name: "Ethan Murphy",     position: "SF", ageGroup: "15U", status: "returning",  hasIdp: true  },
  { id: "p9",  name: "Isaiah Carter",    position: "PF", ageGroup: "15U", status: "uncertain",  hasIdp: false },
  { id: "p10", name: "Liam Peterson",    position: "C",  ageGroup: "15U", status: "returning",  hasIdp: true  },
  { id: "p11", name: "Darius Evans",     position: "PG", ageGroup: "Adult", status: "returning", hasIdp: false },
  { id: "p12", name: "Jaylen Foster",    position: "SF", ageGroup: "Adult", status: "departing",  hasIdp: false },
  { id: "p13", name: "Cameron White",    position: "C",  ageGroup: "Adult", status: "returning",  hasIdp: false },
];

const INITIAL_FORMS: FormItem[] = [
  { id: "f1", label: "Liability Waiver",  required: true,  enabled: true },
  { id: "f2", label: "Medical Release",   required: true,  enabled: true },
  { id: "f3", label: "Photo Consent",     required: false, enabled: true },
  { id: "f4", label: "Code of Conduct",   required: true,  enabled: true },
];

const STAFF_ASSIGNMENTS = [
  { coach: "Coach Rivera",   team: "17U Boys",   role: "Head Coach"   },
  { coach: "Coach Thompson", team: "15U Boys",   role: "Head Coach"   },
  { coach: "Coach Davis",    team: "Adult Coed", role: "Head Coach"   },
  { coach: "Asst. Kim",      team: "17U Boys",   role: "Asst. Coach"  },
  { coach: "Asst. Brown",    team: "15U Boys",   role: "Asst. Coach"  },
];

const STATUS_COLORS: Record<RollforwardStatus, string> = {
  returning:  SUCCESS,
  departing:  DANGER,
  uncertain:  WARNING,
};

/* -------------------------------------------------------------------------- */
/* Wizard step config                                                          */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: 1, label: "Season Details",    icon: Calendar      },
  { id: 2, label: "Roster",            icon: Users         },
  { id: 3, label: "Forms",             icon: FileText      },
  { id: 4, label: "Calendar",          icon: CalendarDays  },
  { id: 5, label: "Comms",             icon: MessageSquare },
];

/* -------------------------------------------------------------------------- */
/* Progress bar                                                                */
/* -------------------------------------------------------------------------- */

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="space-y-3 mb-8">
      {/* Step pills */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const done    = step > s.id;
          const current = step === s.id;
          const Icon    = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0"
                style={{
                  background: done
                    ? `${SUCCESS.replace(")", " / 0.12)")}`
                    : current
                    ? `${PRIMARY.replace(")", " / 0.14)")}`
                    : "oklch(0.18 0.005 260)",
                  color: done ? SUCCESS : current ? PRIMARY : MUTED_FG,
                  border: done
                    ? `1px solid ${SUCCESS.replace(")", " / 0.30)")}`
                    : current
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.40)")}`
                    : "1px solid oklch(0.22 0.01 260)",
                }}
              >
                {done ? (
                  <Check className="w-3 h-3 shrink-0" />
                ) : (
                  <Icon className="w-3 h-3 shrink-0" />
                )}
                <span className="hidden sm:inline truncate">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-1"
                  style={{ background: done ? SUCCESS : "oklch(0.22 0.01 260)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0.005 260)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / (total - 1)) * 100}%`, background: PRIMARY }}
        />
      </div>

      <div className="text-[12px]" style={{ color: MUTED_FG }}>
        Step {step} of {total} — {STEPS[step - 1].label}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — Season Details                                                     */
/* -------------------------------------------------------------------------- */

interface Step1Data {
  name: string;
  startDate: string;
  endDate: string;
  ageGroups: string[];
  seasonType: SeasonType;
  useTemplate: boolean;
  templateId: string;
}

function Step1({
  data,
  onChange,
}: {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
}) {
  const ageGroupOptions = ["15U", "17U", "Adult"];
  const seasonTypeOptions: { value: SeasonType; label: string }[] = [
    { value: "regular",       label: "Regular Season" },
    { value: "tournament",    label: "Tournament"      },
    { value: "training-only", label: "Training-Only"   },
  ];
  const templates = [
    { id: "fall2025", label: "Fall 2025" },
    { id: "spring2025", label: "Spring 2025" },
  ];

  function toggleAgeGroup(ag: string) {
    onChange({
      ...data,
      ageGroups: data.ageGroups.includes(ag)
        ? data.ageGroups.filter((g) => g !== ag)
        : [...data.ageGroups, ag],
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Season Name
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full rounded-xl px-4 py-3 text-[14px] bg-background border border-border focus:outline-none transition-colors"
          style={{ minHeight: 48, color: "inherit" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { field: "startDate" as const, label: "Start Date" },
          { field: "endDate"   as const, label: "End Date"   },
        ].map(({ field, label }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
              {label}
            </label>
            <input
              type="date"
              value={data[field]}
              onChange={(e) => onChange({ ...data, [field]: e.target.value })}
              className="w-full rounded-xl px-3 py-3 text-[13px] bg-background border border-border focus:outline-none transition-colors"
              style={{ minHeight: 48, color: "inherit" }}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Age Groups
        </label>
        <div className="flex gap-2">
          {ageGroupOptions.map((ag) => {
            const active = data.ageGroups.includes(ag);
            return (
              <button
                key={ag}
                onClick={() => toggleAgeGroup(ag)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  minHeight: 44,
                  background: active ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                  color:      active ? PRIMARY : MUTED_FG,
                  border:     active
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                    : "1.5px solid oklch(0.22 0.01 260)",
                }}
              >
                {ag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Season Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {seasonTypeOptions.map(({ value, label }) => {
            const active = data.seasonType === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ ...data, seasonType: value })}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{
                  minHeight: 44,
                  background: active ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                  color:      active ? PRIMARY : MUTED_FG,
                  border:     active
                    ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                    : "1.5px solid oklch(0.22 0.01 260)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template toggle */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Use previous season as template</div>
            <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
              Pre-fill forms, calendar structure, and staff from a past season
            </div>
          </div>
          <button
            onClick={() => onChange({ ...data, useTemplate: !data.useTemplate })}
            className="relative w-11 h-6 rounded-full transition-all shrink-0"
            style={{ background: data.useTemplate ? PRIMARY : "oklch(0.22 0.01 260)" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
              style={{ left: data.useTemplate ? "calc(100% - 22px)" : "2px" }}
            />
          </button>
        </div>

        {data.useTemplate && (
          <div className="flex gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange({ ...data, templateId: t.id })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{
                  minHeight: 40,
                  background: data.templateId === t.id
                    ? `${SUCCESS.replace(")", " / 0.12)")}`
                    : "oklch(0.18 0.005 260)",
                  color:  data.templateId === t.id ? SUCCESS : MUTED_FG,
                  border: data.templateId === t.id
                    ? `1.5px solid ${SUCCESS.replace(")", " / 0.35)")}`
                    : "1.5px solid oklch(0.22 0.01 260)",
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — Roster Rollforward                                                 */
/* -------------------------------------------------------------------------- */

interface NewPlayerEntry {
  name: string;
  position: string;
}

function Step2({
  roster,
  setRoster,
  carryIdps,
  setCarryIdps,
}: {
  roster: PlayerRow[];
  setRoster: (r: PlayerRow[]) => void;
  carryIdps: boolean;
  setCarryIdps: (v: boolean) => void;
}) {
  const [newPlayer, setNewPlayer] = useState<NewPlayerEntry>({ name: "", position: "" });

  function cycleStatus(id: string) {
    const order: RollforwardStatus[] = ["returning", "uncertain", "departing"];
    setRoster(
      roster.map((p) =>
        p.id === id
          ? { ...p, status: order[(order.indexOf(p.status) + 1) % order.length] }
          : p,
      ),
    );
  }

  function addNewPlayer() {
    if (!newPlayer.name.trim()) return;
    const entry: PlayerRow = {
      id:       `new_${Date.now()}`,
      name:     newPlayer.name.trim(),
      position: newPlayer.position || "—",
      ageGroup: "17U",
      status:   "returning",
      hasIdp:   false,
    };
    setRoster([...roster, entry]);
    setNewPlayer({ name: "", position: "" });
  }

  const returning  = roster.filter((p) => p.status === "returning").length;
  const departing  = roster.filter((p) => p.status === "departing").length;
  const uncertain  = roster.filter((p) => p.status === "uncertain").length;
  const newPlayers = roster.filter((p) => p.id.startsWith("new_")).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div
        className="rounded-xl px-4 py-3 flex gap-6 flex-wrap text-[13px]"
        style={{ background: `${PRIMARY.replace(")", " / 0.07)")}`, border: `1px solid ${PRIMARY.replace(")", " / 0.20)")}` }}
      >
        <span><span className="font-bold" style={{ color: SUCCESS }}>{returning}</span> <span style={{ color: MUTED_FG }}>returning</span></span>
        <span><span className="font-bold" style={{ color: DANGER }}>{departing}</span> <span style={{ color: MUTED_FG }}>departing</span></span>
        <span><span className="font-bold" style={{ color: WARNING }}>{uncertain}</span> <span style={{ color: MUTED_FG }}>uncertain</span></span>
        {newPlayers > 0 && (
          <span><span className="font-bold" style={{ color: PRIMARY }}>{newPlayers}</span> <span style={{ color: MUTED_FG }}>new</span></span>
        )}
      </div>

      {/* Roster table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-card">
              {["Player", "Position", "Age", "Status"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((p, i) => {
              const sc = STATUS_COLORS[p.status];
              return (
                <tr key={p.id} className={`${i < roster.length - 1 ? "border-b border-border" : ""} bg-background`}>
                  <td className="px-3 py-2.5 font-medium">
                    {p.name}
                    {p.hasIdp && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY }}>
                        IDP
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: MUTED_FG }}>{p.position}</td>
                  <td className="px-3 py-2.5" style={{ color: MUTED_FG }}>{p.ageGroup}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => cycleStatus(p.id)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all"
                      style={{
                        background: `${sc.replace(")", " / 0.12)")}`,
                        color: sc,
                        border: `1px solid ${sc.replace(")", " / 0.28)")}`,
                      }}
                    >
                      {p.status}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add new player */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="text-[13px] font-semibold">Add new players</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Player name"
            value={newPlayer.name}
            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
            className="flex-1 rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
            onKeyDown={(e) => e.key === "Enter" && addNewPlayer()}
          />
          <input
            type="text"
            placeholder="PG / SG / SF…"
            value={newPlayer.position}
            onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
            className="w-24 rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
          />
          <button
            onClick={addNewPlayer}
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all"
            style={{ minHeight: 44, background: PRIMARY, color: "oklch(0.98 0.005 290)" }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Carry IDPs toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
        <div>
          <div className="text-[14px] font-semibold">Carry forward IDPs</div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
            Migrate active IDP goals to the new season for returning players
          </div>
        </div>
        <button
          onClick={() => setCarryIdps(!carryIdps)}
          className="relative w-11 h-6 rounded-full transition-all shrink-0"
          style={{ background: carryIdps ? PRIMARY : "oklch(0.22 0.01 260)" }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
            style={{ left: carryIdps ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — Forms & Documents                                                  */
/* -------------------------------------------------------------------------- */

function Step3({
  forms,
  setForms,
  autoGenerate,
  setAutoGenerate,
  formsDueDate,
  setFormsDueDate,
}: {
  forms: FormItem[];
  setForms: (f: FormItem[]) => void;
  autoGenerate: boolean;
  setAutoGenerate: (v: boolean) => void;
  formsDueDate: string;
  setFormsDueDate: (v: string) => void;
}) {
  const [customLabel, setCustomLabel] = useState("");

  function toggleForm(id: string) {
    setForms(forms.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  }

  function addCustomForm() {
    if (!customLabel.trim()) return;
    setForms([
      ...forms,
      { id: `custom_${Date.now()}`, label: customLabel.trim(), required: false, enabled: true },
    ]);
    setCustomLabel("");
  }

  return (
    <div className="space-y-5">
      {/* Auto-generate toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
        <div>
          <div className="text-[14px] font-semibold">Auto-generate from last season's templates</div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
            Pulls existing form PDFs and pre-fills program information
          </div>
        </div>
        <button
          onClick={() => setAutoGenerate(!autoGenerate)}
          className="relative w-11 h-6 rounded-full transition-all shrink-0"
          style={{ background: autoGenerate ? PRIMARY : "oklch(0.22 0.01 260)" }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
            style={{ left: autoGenerate ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      {/* Form checklist */}
      <div className="space-y-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Required forms
        </div>
        {forms.map((form) => (
          <div
            key={form.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
          >
            <button
              onClick={() => !form.required && toggleForm(form.id)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
              style={{
                background: form.enabled ? PRIMARY : "transparent",
                borderColor: form.enabled ? PRIMARY : "oklch(0.35 0.01 260)",
              }}
            >
              {form.enabled && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className={`flex-1 text-[14px] ${form.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
              {form.label}
            </span>
            {form.required && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md" style={{ background: `${DANGER.replace(")", " / 0.10)")}`, color: DANGER }}>
                Required
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Forms due date (applies to all)
        </label>
        <input
          type="date"
          value={formsDueDate}
          onChange={(e) => setFormsDueDate(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-[14px] bg-background border border-border focus:outline-none transition-colors"
          style={{ minHeight: 48, color: "inherit" }}
        />
      </div>

      {/* Add custom form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="text-[13px] font-semibold">Add custom form</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Concussion Protocol"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
            onKeyDown={(e) => e.key === "Enter" && addCustomForm()}
          />
          <button
            onClick={addCustomForm}
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all"
            style={{ minHeight: 44, background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 4 — Calendar Scaffold                                                  */
/* -------------------------------------------------------------------------- */

interface CalendarState {
  gamesLoaded: boolean;
  practicesGenerated: boolean;
  practiceDays: DayOfWeek[];
  practiceTime: string;
  practiceLocation: string;
  tournaments: TournamentDate[];
}

const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CALENDAR_CONFLICTS = [
  { event: "Practice (Mon Jun 15)", conflict: "Memorial Day — gym closed", severity: "warning" as const },
  { event: "Practice (Fri Jul 4)",  conflict: "Independence Day — consider moving",  severity: "warning" as const },
];

function Step4({ cal, setCal }: { cal: CalendarState; setCal: (c: CalendarState) => void }) {
  const [newTournament, setNewTournament] = useState({ name: "", date: "", location: "" });

  function toggleDay(day: DayOfWeek) {
    setCal({
      ...cal,
      practiceDays: cal.practiceDays.includes(day)
        ? cal.practiceDays.filter((d) => d !== day)
        : [...cal.practiceDays, day],
    });
  }

  function loadGames() {
    toast.success("20 league games imported from schedule!");
    setCal({ ...cal, gamesLoaded: true });
  }

  function generatePractices() {
    toast.success("24 practices populated for the season!");
    setCal({ ...cal, practicesGenerated: true });
  }

  function addTournament() {
    if (!newTournament.name.trim() || !newTournament.date) return;
    setCal({
      ...cal,
      tournaments: [
        ...cal.tournaments,
        { id: `t_${Date.now()}`, ...newTournament },
      ],
    });
    setNewTournament({ name: "", date: "", location: "" });
  }

  return (
    <div className="space-y-5">
      {/* Import league schedule */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">League Schedule</div>
            <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
              Import game schedule from the league portal
            </div>
          </div>
          {cal.gamesLoaded ? (
            <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SUCCESS }}>
              <Check className="w-4 h-4" />
              20 games loaded
            </div>
          ) : (
            <button
              onClick={loadGames}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2"
              style={{ minHeight: 40, background: PRIMARY, color: "oklch(0.98 0.005 290)" }}
            >
              <Calendar className="w-4 h-4" />
              Import Schedule
            </button>
          )}
        </div>
      </div>

      {/* Practice schedule */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="text-[14px] font-semibold">Practice Schedule</div>

        {/* Days of week */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
            Days of week
          </div>
          <div className="flex gap-1.5">
            {ALL_DAYS.map((day) => {
              const active = cal.practiceDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: active ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                    color:      active ? PRIMARY : MUTED_FG,
                    border:     active
                      ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                      : "1px solid oklch(0.22 0.01 260)",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
              Time
            </label>
            <input
              type="time"
              value={cal.practiceTime}
              onChange={(e) => setCal({ ...cal, practiceTime: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
              style={{ minHeight: 44, color: "inherit" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
              Location
            </label>
            <input
              type="text"
              placeholder="Main Gym"
              value={cal.practiceLocation}
              onChange={(e) => setCal({ ...cal, practiceLocation: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
              style={{ minHeight: 44, color: "inherit" }}
            />
          </div>
        </div>

        <button
          onClick={generatePractices}
          className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            minHeight: 48,
            background: cal.practicesGenerated
              ? `${SUCCESS.replace(")", " / 0.12)")}`
              : `${PRIMARY.replace(")", " / 0.12)")}`,
            color: cal.practicesGenerated ? SUCCESS : PRIMARY,
            border: `1.5px solid ${cal.practicesGenerated
              ? SUCCESS.replace(")", " / 0.30)")
              : PRIMARY.replace(")", " / 0.30)")}`,
          }}
        >
          {cal.practicesGenerated ? (
            <><Check className="w-4 h-4" /> 24 practices generated</>
          ) : (
            <><CalendarDays className="w-4 h-4" /> Generate Practice Calendar</>
          )}
        </button>
      </div>

      {/* Tournament dates */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="text-[14px] font-semibold">Tournament Dates</div>
        {cal.tournaments.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{t.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: MUTED_FG }}>
                {t.date}{t.location ? ` · ${t.location}` : ""}
              </div>
            </div>
            <button
              onClick={() => setCal({ ...cal, tournaments: cal.tournaments.filter((x) => x.id !== t.id) })}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: MUTED_FG }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tournament name"
            value={newTournament.name}
            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
            className="flex-1 rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
          />
          <input
            type="date"
            value={newTournament.date}
            onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
            className="w-36 rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none transition-colors"
            style={{ minHeight: 44, color: "inherit" }}
          />
          <button
            onClick={addTournament}
            className="px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{ minHeight: 44, background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conflict checker */}
      {(cal.gamesLoaded || cal.practicesGenerated) && (
        <div className="rounded-xl border p-4 space-y-2.5" style={{ borderColor: `${WARNING.replace(")", " / 0.30)")}`, background: `${WARNING.replace(")", " / 0.06)")}` }}>
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: WARNING }}>
            <AlertTriangle className="w-4 h-4" />
            {CALENDAR_CONFLICTS.length} conflicts detected
          </div>
          {CALENDAR_CONFLICTS.map((c, i) => (
            <div key={i} className="flex items-start gap-3 text-[12px]">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: WARNING }} />
              <div>
                <span className="font-semibold">{c.event}</span>
                <span style={{ color: MUTED_FG }}> — {c.conflict}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 5 — Communication Setup                                                */
/* -------------------------------------------------------------------------- */

interface CommsState {
  autoChannels: boolean;
  welcomeMessage: string;
}

function Step5({
  comms,
  setComms,
  onLaunch,
}: {
  comms: CommsState;
  setComms: (c: CommsState) => void;
  onLaunch: () => void;
}) {
  const AUTO_CHANNELS = [
    { label: "Team Channel",    description: "All players + coaches" },
    { label: "Parents Channel", description: "Parents + admin"       },
    { label: "Coaches Channel", description: "Coaching staff only"   },
  ];

  return (
    <div className="space-y-5">
      {/* Auto-create channels */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Auto-create channels</div>
            <div className="text-[12px] mt-0.5" style={{ color: MUTED_FG }}>
              Creates messaging channels for each group automatically
            </div>
          </div>
          <button
            onClick={() => setComms({ ...comms, autoChannels: !comms.autoChannels })}
            className="relative w-11 h-6 rounded-full transition-all shrink-0"
            style={{ background: comms.autoChannels ? PRIMARY : "oklch(0.22 0.01 260)" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
              style={{ left: comms.autoChannels ? "calc(100% - 22px)" : "2px" }}
            />
          </button>
        </div>

        {comms.autoChannels && (
          <div className="space-y-2">
            {AUTO_CHANNELS.map((ch) => (
              <div key={ch.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: `${PRIMARY.replace(")", " / 0.07)")}` }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SUCCESS }} />
                <div>
                  <div className="text-[13px] font-semibold">{ch.label}</div>
                  <div className="text-[11px]" style={{ color: MUTED_FG }}>{ch.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Welcome message */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Welcome message for new families
        </label>
        <textarea
          value={comms.welcomeMessage}
          onChange={(e) => setComms({ ...comms, welcomeMessage: e.target.value })}
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-[13px] bg-background border border-border focus:outline-none transition-colors resize-none"
          style={{ color: "inherit" }}
        />
        <div className="text-[11px]" style={{ color: MUTED_FG }}>
          Sent to all new families when the season launches.
        </div>
      </div>

      {/* Staff assignments */}
      <div className="space-y-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
          Staff assignments confirmation
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Coach", "Team", "Role"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED_FG }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF_ASSIGNMENTS.map((s, i) => (
                <tr key={i} className={`${i < STAFF_ASSIGNMENTS.length - 1 ? "border-b border-border" : ""} bg-background`}>
                  <td className="px-3 py-2.5 font-medium">{s.coach}</td>
                  <td className="px-3 py-2.5" style={{ color: MUTED_FG }}>{s.team}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY }}>
                      {s.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={onLaunch}
        className="w-full py-4 rounded-2xl text-[15px] font-black flex items-center justify-center gap-3 transition-all shadow-lg"
        style={{
          minHeight: 56,
          background: PRIMARY,
          color: "oklch(0.98 0.005 290)",
          boxShadow: `0 8px 32px ${PRIMARY.replace(")", " / 0.35)")}`,
        }}
      >
        <Rocket className="w-5 h-5" />
        Launch Season
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function SeasonSetupPage() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [step1, setStep1] = useState<Step1Data>({
    name:       "Fall 2026",
    startDate:  "2026-09-08",
    endDate:    "2026-12-19",
    ageGroups:  ["15U", "17U", "Adult"],
    seasonType: "regular",
    useTemplate: false,
    templateId:  "",
  });

  // Step 2 state
  const [roster, setRoster] = useState<PlayerRow[]>(INITIAL_ROSTER);
  const [carryIdps, setCarryIdps] = useState(true);

  // Step 3 state
  const [forms, setForms]               = useState<FormItem[]>(INITIAL_FORMS);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [formsDueDate, setFormsDueDate] = useState("2026-09-22");

  // Step 4 state
  const [cal, setCal] = useState<CalendarState>({
    gamesLoaded:          false,
    practicesGenerated:   false,
    practiceDays:         ["Mon", "Wed", "Fri"],
    practiceTime:         "17:30",
    practiceLocation:     "Main Gym",
    tournaments:          [
      { id: "t1", name: "Fall Invitational", date: "2026-10-10", location: "Riverside Sports Complex" },
      { id: "t2", name: "State Qualifier",   date: "2026-11-14", location: "Central Arena"            },
    ],
  });

  // Step 5 state
  const [comms, setComms] = useState<CommsState>({
    autoChannels:   true,
    welcomeMessage: "Welcome to Fall 2026! We're so excited to have you with us this season. Please complete your forms by September 22nd. Don't hesitate to reach out if you have any questions — we're here to help.",
  });

  function handleNext() {
    if (step < 5) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleLaunch() {
    toast.success(
      "Season created! 12 players notified, 3 forms sent, 48 events added to calendar.",
      { duration: 6000 },
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          eyebrow="Admin"
          title="Season Setup"
          subtitle="Launch a new season in under 5 minutes."
          actions={
            <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED_FG }}>
              <Clock className="w-4 h-4" />
              ~5 min
            </div>
          }
        />

        <ProgressBar step={step} total={5} />

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          {step === 1 && (
            <Step1 data={step1} onChange={setStep1} />
          )}
          {step === 2 && (
            <Step2
              roster={roster}
              setRoster={setRoster}
              carryIdps={carryIdps}
              setCarryIdps={setCarryIdps}
            />
          )}
          {step === 3 && (
            <Step3
              forms={forms}
              setForms={setForms}
              autoGenerate={autoGenerate}
              setAutoGenerate={setAutoGenerate}
              formsDueDate={formsDueDate}
              setFormsDueDate={setFormsDueDate}
            />
          )}
          {step === 4 && (
            <Step4 cal={cal} setCal={setCal} />
          )}
          {step === 5 && (
            <Step5 comms={comms} setComms={setComms} onLaunch={handleLaunch} />
          )}

          {/* Nav buttons */}
          <div className={`flex gap-3 mt-6 pt-5 border-t border-border ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{ minHeight: 48, background: "oklch(0.18 0.005 260)", color: MUTED_FG }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < 5 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all"
                style={{ minHeight: 48, background: PRIMARY, color: "oklch(0.98 0.005 290)" }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
