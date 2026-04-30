/**
 * PracticePlanBuilder — Coach HQ
 *
 * Faithful build of the Practice Plan Builder described in Prompt 8 §17:
 *   • drag-and-drop drill sequencing (dnd-kit)
 *   • running clock with budget warnings
 *   • equipment / staff allocation summary
 *   • drill library drawer with category + intensity + surface filters
 *   • inline duration editing
 *   • multiple plans (CRUD via Zustand store)
 *   • print/share-friendly view
 *
 * In production this maps to `/(coach)/practice-plans` with `PracticePlanBuilder`
 * as the canonical component.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Trash2,
  Copy,
  Printer,
  Share2,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  X,
  Edit3,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  drillCategories,
  drillLibrary,
  findCategory,
  findDrill as findGlobalDrill,
  planEquipment as _planEquipmentRaw,
  planMaxCoaches as _planMaxCoachesRaw,
  planTotalMinutes,
  type Drill,
  type DrillIntensity,
  type DrillSurface,
  type PracticePlan,
  type PracticePlanBlock,
} from "@/lib/mock/practice";
import { usePracticePlans } from "@/lib/practicePlanStore";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { CustomDrillEditor } from "@/components/coach/CustomDrillEditor";
import { useAuth } from "@/lib/auth";

/**
 * Resolve a drill against both the global library and the persisted custom
 * drills store. Used everywhere this page reads a drill out of a plan block.
 */
function findDrill(drillId: string): Drill | undefined {
  return (
    findGlobalDrill(drillId) ??
    useCustomDrillsStore.getState().byId(drillId)
  );
}

/** Re-export of practice helpers but using our merged drill resolver. */
function planEquipment(plan: PracticePlan): string[] {
  const set = new Set<string>();
  for (const b of plan.blocks) {
    findDrill(b.drillId)?.equipment.forEach((e) => set.add(e));
  }
  return Array.from(set).sort();
}
function planMaxCoaches(plan: PracticePlan): number {
  return plan.blocks.reduce((m, b) => Math.max(m, findDrill(b.drillId)?.coachesNeeded ?? 1), 1);
}
// Touch the original helpers so the linter doesn't flag them as unused if some
// import path changes later. (No-op in optimised build.)
void _planEquipmentRaw;
void _planMaxCoachesRaw;

const INTENSITIES: DrillIntensity[] = ["LOW", "MEDIUM", "HIGH", "MAX"];
const SURFACES: DrillSurface[] = ["HALF_COURT", "FULL_COURT", "BASELINE", "STATIONARY"];

const INTENSITY_COLOR: Record<DrillIntensity, string> = {
  LOW: "oklch(0.75 0.12 200)",
  MEDIUM: "oklch(0.78 0.16 75)",
  HIGH: "oklch(0.74 0.18 30)",
  MAX: "oklch(0.65 0.22 15)",
};

function formatSurface(s: DrillSurface): string {
  return s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(date: string, start: string): string {
  try {
    const d = new Date(`${date}T${start}`);
    return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return `${date} ${start}`;
  }
}

function addMinutes(date: string, time: string, minutes: number): string {
  try {
    const d = new Date(`${date}T${time}`);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Sortable block row                                                          */
/* -------------------------------------------------------------------------- */

function BlockRow({
  block,
  drill,
  index,
  startsAt,
  onDurationChange,
  onNotesChange,
  onRemove,
}: {
  block: PracticePlanBlock;
  drill: Drill | undefined;
  index: number;
  startsAt: string;
  onDurationChange: (mins: number) => void;
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cat = drill ? findCategory(drill.categoryId) : undefined;
  const [editingDuration, setEditingDuration] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-border bg-card hover:border-primary/40 transition overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Color rail */}
        <div className="w-1.5 shrink-0" style={{ background: cat?.color ?? "var(--muted)" }} />

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="px-2 flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Step number */}
        <div className="w-9 shrink-0 flex items-center justify-center font-mono text-[12px] text-muted-foreground border-r border-border/50">
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {cat && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{ background: `${cat.color.replace(")", " / 0.15)")}`, color: cat.color }}
                  >
                    {cat.name}
                  </span>
                )}
                {drill && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: `${INTENSITY_COLOR[drill.intensity].replace(")", " / 0.15)")}`,
                      color: INTENSITY_COLOR[drill.intensity],
                    }}
                  >
                    {drill.intensity}
                  </span>
                )}
                <span className="font-mono text-[10.5px] text-muted-foreground hidden md:inline">starts {startsAt}</span>
              </div>
              <h4 className="font-semibold text-[14px] leading-snug">{drill?.title ?? "Unknown drill"}</h4>
              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{drill?.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {editingDuration ? (
                <NumericInput
                  aria-label="Block duration in minutes"
                  value={block.durationMin}
                  onChange={(v) => {
                    onDurationChange(v);
                    setEditingDuration(false);
                  }}
                  min={1}
                  max={120}
                  autoFocus
                  className="w-16 h-8 text-center font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingDuration(false);
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingDuration(true)}
                  className="inline-flex items-center gap-1 font-mono text-[13px] text-primary hover:bg-primary/10 px-2 py-1 rounded"
                >
                  {block.durationMin} min
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                aria-label="Remove block"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Equipment + notes */}
          <div className="mt-2 flex items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              {drill?.equipment.map((eq) => (
                <span key={eq} className="text-[10.5px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {eq}
                </span>
              ))}
              {drill && drill.coachesNeeded > 1 && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3" /> {drill.coachesNeeded} coaches
                </span>
              )}
            </div>
          </div>

          <Textarea
            value={block.notes}
            placeholder="Coach notes (e.g., 'lefties to far end', 'focus on guide hand')"
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-2 text-[12.5px] min-h-[36px] resize-none bg-background"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drill library drawer                                                        */
/* -------------------------------------------------------------------------- */

function DrillLibraryDrawer({
  onPick,
  trigger,
}: {
  onPick: (drillId: string) => void;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const coachId = user?.id ?? "coach_anonymous";
  const orgId = (user as any)?.orgId as string | undefined;

  const [tab, setTab] = useState<"LIBRARY" | "MINE">("LIBRARY");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | "ALL">("ALL");
  const [activeIntensity, setActiveIntensity] = useState<DrillIntensity | "ALL">("ALL");
  const [activeSurface, setActiveSurface] = useState<DrillSurface | "ALL">("ALL");
  const [open, setOpen] = useState(false);

  // Custom drill editor state.
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Drill | null>(null);
  const customDrills = useCustomDrillsStore((s) => s.drills);
  const removeCustom = useCustomDrillsStore((s) => s.remove);

  const visibleCustoms = useMemo(
    () =>
      customDrills.filter((d) => {
        if (d.visibility === "public") return true;
        if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
        return d.ownerCoachId === coachId;
      }),
    [customDrills, coachId, orgId],
  );

  const sourceList = tab === "LIBRARY" ? drillLibrary : visibleCustoms;

  const filtered = useMemo(() => {
    return sourceList.filter((d) => {
      if (activeCat !== "ALL" && d.categoryId !== activeCat) return false;
      if (activeIntensity !== "ALL" && d.intensity !== activeIntensity) return false;
      if (activeSurface !== "ALL" && d.surface !== activeSurface) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !d.title.toLowerCase().includes(q) &&
          !d.description.toLowerCase().includes(q) &&
          !d.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [sourceList, search, activeCat, activeIntensity, activeSurface]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        {/* Drill Library toolbar — 4 explicit zones, never overlapping */}
        <SheetHeader className="drill-toolbar shrink-0 px-5 pt-5 pb-4 border-b border-border flex flex-col gap-3 text-left space-y-0">
          {/* Row 1 — header (title + subtitle + new-drill button) */}
          <div className="drill-toolbar-header flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="font-display text-lg uppercase tracking-tight leading-tight">
                {tab === "LIBRARY" ? "Drill Library" : "My Drills"}
              </SheetTitle>
              <p className="text-[12.5px] text-muted-foreground leading-snug">
                {tab === "LIBRARY"
                  ? `${drillLibrary.length} drills across ${drillCategories.length} categories. Click to add to plan.`
                  : `${visibleCustoms.length} custom drill${visibleCustoms.length === 1 ? "" : "s"} authored by you or shared with your org.`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New drill
            </Button>
          </div>

          {/* Row 2 — tabs */}
          <div className="drill-toolbar-tabs flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
              <button
                onClick={() => setTab("LIBRARY")}
                className={`h-7 px-3 rounded text-[11.5px] font-mono uppercase tracking-wider transition whitespace-nowrap ${
                  tab === "LIBRARY"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setTab("MINE")}
                className={`h-7 px-3 rounded text-[11.5px] font-mono uppercase tracking-wider transition whitespace-nowrap ${
                  tab === "MINE"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Drills{visibleCustoms.length > 0 ? ` · ${visibleCustoms.length}` : ""}
              </button>
            </div>
          </div>

          {/* Rows 3 + 4 — search/chips on the left, filters/matched on the right at >=lg */}
          <div className="drill-toolbar-bottom grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-4 gap-y-3 items-start">
            {/* Row 3 — search + chips */}
            <div className="drill-toolbar-search-and-chips flex flex-col gap-2 min-w-0">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, description, tag…"
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <button
                  onClick={() => setActiveCat("ALL")}
                  className={`h-7 px-2.5 rounded-full text-[11px] border whitespace-nowrap ${
                    activeCat === "ALL"
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  All
                </button>
                {drillCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`h-7 px-2.5 rounded-full text-[11px] border inline-flex items-center gap-1.5 whitespace-nowrap ${
                      activeCat === c.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4 — filters + matched count */}
            <div className="drill-toolbar-filters flex flex-wrap items-center gap-2 lg:justify-end">
              <Select value={activeIntensity} onValueChange={(v) => setActiveIntensity(v as any)}>
                <SelectTrigger className="h-8 min-w-[150px] text-[12px] shrink-0">
                  <SelectValue placeholder="Intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All intensities</SelectItem>
                  {INTENSITIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeSurface} onValueChange={(v) => setActiveSurface(v as any)}>
                <SelectTrigger className="h-8 min-w-[150px] text-[12px] shrink-0">
                  <SelectValue placeholder="Surface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All surfaces</SelectItem>
                  {SURFACES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatSurface(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                {filtered.length} matched
              </span>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {tab === "MINE" && visibleCustoms.length === 0
                  ? "You haven't authored any drills yet. Click ‘New drill’ to add your first."
                  : "No drills match your filters."}
              </div>
            )}
            {filtered.map((d) => {
              const cat = findCategory(d.categoryId);
              const owned = d.isCustom && d.ownerCoachId === coachId;
              return (
                <div
                  key={d.id}
                  className="relative rounded-lg border border-border hover:border-primary/50 bg-card transition group"
                >
                  <button
                    onClick={() => {
                      onPick(d.id);
                      toast.success(`Added “${d.title}” to plan`);
                    }}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-1 h-12 rounded-full shrink-0"
                        style={{ background: cat?.color ?? "var(--muted)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold text-[13.5px] truncate">{d.title}</h4>
                            {d.isCustom && (
                              <span
                                className={`text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                  d.visibility === "public"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : d.visibility === "org"
                                      ? "bg-blue-500/15 text-blue-400"
                                      : "bg-primary/15 text-primary"
                                }`}
                              >
                                {d.visibility ?? "private"}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11.5px] text-muted-foreground shrink-0">
                            {d.defaultDurationMin} min
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
                          {d.description}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span
                            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              background: `${INTENSITY_COLOR[d.intensity].replace(")", " / 0.15)")}`,
                              color: INTENSITY_COLOR[d.intensity],
                            }}
                          >
                            {d.intensity}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                            {formatSurface(d.surface)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {d.minPlayers === d.maxPlayers
                              ? `${d.minPlayers}p`
                              : `${d.minPlayers}–${d.maxPlayers}p`}
                          </span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
                    </div>
                  </button>
                  {owned && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Edit drill"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(d);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:text-destructive"
                        title="Delete drill"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete custom drill “${d.title}”?`)) {
                            removeCustom(d.id);
                            toast.success(`Deleted “${d.title}”—plans that already used it keep the block.`);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
      <CustomDrillEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        ownerCoachId={coachId}
        orgId={orgId}
        onSaved={(d) => {
          // Auto-switch to My Drills tab so the new entry is immediately visible.
          setTab("MINE");
          // If the user saved a brand-new drill, drop it straight into the plan
          // they're editing as a convenience (matches Coach HQ acceptance criteria).
          if (!editing) {
            onPick(d.id);
          }
        }}
      />
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Right-rail summary                                                          */
/* -------------------------------------------------------------------------- */

function PlanSummary({
  plan,
  onTitleChange,
  onFocusChange,
  onBudgetChange,
  onDateChange,
  onTimeChange,
  onStatusChange,
  onPrint,
}: {
  /* see comment in handler below */
  plan: PracticePlan;
  onTitleChange: (v: string) => void;
  onFocusChange: (v: string) => void;
  onBudgetChange: (v: number) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onStatusChange: (v: PracticePlan["status"]) => void;
  onPrint: () => void;
}) {
  const total = planTotalMinutes(plan);
  const remaining = plan.budgetMin - total;
  const overBudget = remaining < 0;
  const equipment = planEquipment(plan);
  const coaches = planMaxCoaches(plan);
  const pct = Math.min(100, (total / Math.max(plan.budgetMin, 1)) * 100);

  // Distribution by category
  const dist = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of plan.blocks) {
      const drill = findDrill(b.drillId);
      if (!drill) continue;
      map.set(drill.categoryId, (map.get(drill.categoryId) ?? 0) + b.durationMin);
    }
    return Array.from(map.entries()).map(([catId, mins]) => ({
      cat: findCategory(catId)!,
      mins,
      pct: (mins / Math.max(total, 1)) * 100,
    }));
  }, [plan.blocks, total]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Plan Title
          </div>
          <Input
            value={plan.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="font-display text-base h-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
              Date
            </div>
            <Input type="date" value={plan.date} onChange={(e) => onDateChange(e.target.value)} className="h-9" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
              Start
            </div>
            <Input type="time" value={plan.startTime} onChange={(e) => onTimeChange(e.target.value)} className="h-9" />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Focus
          </div>
          <Textarea
            value={plan.focus}
            onChange={(e) => onFocusChange(e.target.value)}
            placeholder="What's the point of this practice?"
            rows={2}
            className="text-[12.5px] resize-none"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Status
          </div>
          <Select value={plan.status} onValueChange={(v) => onStatusChange(v as PracticePlan["status"])}>
            <SelectTrigger className="h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Time Budget</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            <span className={overBudget ? "text-destructive" : "text-foreground"}>{total}</span> / {plan.budgetMin} min
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${overBudget ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <NumericInput
            aria-label="Practice plan minute budget"
            value={plan.budgetMin}
            onChange={onBudgetChange}
            min={15}
            max={240}
            className="h-8 w-20 text-center font-mono text-sm"
          />
          <span className="text-[12px] text-muted-foreground">min budgeted</span>
          <span className="ml-auto text-[12px] font-mono">
            {overBudget ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" /> over by {Math.abs(remaining)} min
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {remaining} min left
              </span>
            )}
          </span>
        </div>
      </div>

      {dist.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
            Time by Category
          </div>
          <div className="space-y-2">
            {dist.map((row) => (
              <div key={row.cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: row.cat.color }} />
                    {row.cat.name}
                  </span>
                  <span className="font-mono text-muted-foreground">{row.mins} min · {row.pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ background: row.cat.color, width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
          Resource Plan
        </div>
        <div className="flex items-center gap-2 text-[12.5px]">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            <strong className="font-mono">{coaches}</strong> coach{coaches !== 1 ? "es" : ""} needed
          </span>
        </div>
        <div className="flex items-start gap-2 text-[12.5px]">
          <Wrench className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {equipment.length === 0 && <span className="text-muted-foreground">No equipment required</span>}
            {equipment.map((eq) => (
              <span key={eq} className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                {eq}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={onPrint} variant="outline" className="w-full justify-start h-9 text-[12.5px]">
          <Printer className="w-4 h-4 mr-2" /> Print / share
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/app/coach/practice-plans?id=${plan.id}`);
            toast.success("Share link copied");
          }}
          className="w-full justify-start h-9 text-[12.5px]"
        >
          <Share2 className="w-4 h-4 mr-2" /> Copy share link
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan list (left rail)                                                       */
/* -------------------------------------------------------------------------- */

function PlanList({
  plans,
  activeId,
  onPick,
  onCreate,
  onDuplicate,
  onDelete,
}: {
  plans: PracticePlan[];
  activeId: string | null;
  onPick: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col h-fit max-h-[calc(100vh-180px)]">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Plans</div>
          <div className="font-display text-base mt-0.5">{plans.length}</div>
        </div>
        <Button size="sm" onClick={onCreate} className="h-8 px-3">
          <Plus className="w-3.5 h-3.5 mr-1" /> New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {plans.map((p) => {
            const isActive = p.id === activeId;
            const total = planTotalMinutes(p);
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => onPick(p.id)}
                  className={`w-full text-left rounded-md p-2.5 transition ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] truncate flex-1">{p.title}</span>
                    {p.status === "PUBLISHED" && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-emerald-500/30 text-emerald-400">
                        LIVE
                      </Badge>
                    )}
                    {p.status === "DRAFT" && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-amber-500/30 text-amber-400">
                        DRAFT
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatTime(p.date, p.startTime)} · {total}m / {p.budgetMin}m
                  </div>
                </button>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(p.id);
                    }}
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                    aria-label="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${p.title}"?`)) onDelete(p.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Print / share dialog                                                        */
/* -------------------------------------------------------------------------- */

function PrintView({ plan }: { plan: PracticePlan }) {
  let cumulative = 0;
  return (
    <div className="bg-white text-black p-8 font-sans rounded-md">
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">HoopsOS · Practice Plan</div>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <div className="text-sm mt-1">
          {formatTime(plan.date, plan.startTime)} · Budget {plan.budgetMin} min · {plan.authorName}
        </div>
        {plan.focus && <div className="text-sm mt-2 italic text-zinc-700">Focus: {plan.focus}</div>}
      </div>

      <table className="w-full text-sm">
        <thead className="border-b-2 border-black text-left">
          <tr>
            <th className="py-1.5 pr-2 w-12">#</th>
            <th className="py-1.5 pr-2 w-20">Time</th>
            <th className="py-1.5 pr-2 w-16">Min</th>
            <th className="py-1.5 pr-2">Drill</th>
            <th className="py-1.5 pr-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {plan.blocks.map((b, i) => {
            const drill = findDrill(b.drillId);
            const startsAt = addMinutes(plan.date, plan.startTime, cumulative);
            cumulative += b.durationMin;
            return (
              <tr key={b.id} className="border-b border-zinc-300">
                <td className="py-1.5 pr-2 font-mono">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-1.5 pr-2 font-mono">{startsAt}</td>
                <td className="py-1.5 pr-2 font-mono">{b.durationMin}</td>
                <td className="py-1.5 pr-2">
                  <div className="font-semibold">{drill?.title}</div>
                  <div className="text-xs text-zinc-600">{drill?.description}</div>
                </td>
                <td className="py-1.5 pr-2 text-xs">{b.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 text-xs flex items-center justify-between">
        <span>Total scheduled: {planTotalMinutes(plan)} min · Equipment: {planEquipment(plan).join(", ") || "—"}</span>
        <span>Generated by HoopsOS</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function CoachPracticePlanBuilder() {
  const { plans, activePlanId, setActive, createPlan, duplicatePlan, deletePlan, updatePlan, addBlock, updateBlock, removeBlock, reorderBlocks } =
    usePracticePlans();
  const [printOpen, setPrintOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const plan = plans.find((p) => p.id === activePlanId) ?? plans[0];

  if (!plan) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8">
          <div className="text-center max-w-sm mx-auto py-16">
            <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-display text-xl mb-1">No practice plans yet</h2>
            <p className="text-[13px] text-muted-foreground mb-4">Create your first plan and start dragging in drills.</p>
            <Button onClick={() => createPlan()}>
              <Plus className="w-4 h-4 mr-1.5" /> New Plan
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = plan.blocks.findIndex((b) => b.id === active.id);
    const toIndex = plan.blocks.findIndex((b) => b.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    reorderBlocks(plan.id, fromIndex, toIndex);
  };

  // Cumulative starts for each block
  let cumulative = 0;
  const startTimes = plan.blocks.map((b) => {
    const start = addMinutes(plan.date, plan.startTime, cumulative);
    cumulative += b.durationMin;
    return start;
  });

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Practice Plan Builder"
          subtitle="Drag drills from the library, sequence them, watch the clock. Print to PDF for your staff or share a read-only link."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/app/coach">
                <a className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Coach HQ <ChevronRight className="w-3 h-3" />
                </a>
              </Link>
              <DrillLibraryDrawer
                onPick={(drillId) => addBlock(plan.id, drillId)}
                trigger={
                  <Button className="h-9 px-4 font-semibold">
                    <Plus className="w-4 h-4 mr-1.5" /> Add Drill
                  </Button>
                }
              />
            </div>
          }
        />

        <div className="grid lg:grid-cols-[260px_1fr_320px] gap-5">
          {/* Left rail: plan list */}
          <PlanList
            plans={plans}
            activeId={activePlanId}
            onPick={setActive}
            onCreate={() => {
              const id = createPlan({
                title: "New Practice Plan",
                date: new Date().toISOString().slice(0, 10),
              });
              toast.success("New plan created");
              setActive(id);
            }}
            onDuplicate={(id) => {
              duplicatePlan(id);
              toast.success("Plan duplicated");
            }}
            onDelete={(id) => {
              deletePlan(id);
              toast.success("Plan deleted");
            }}
          />

          {/* Center: timeline */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border bg-gradient-to-b from-card to-background">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
                    Practice timeline
                  </div>
                  <h2 className="font-display text-xl uppercase tracking-tight">{plan.title}</h2>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] text-muted-foreground">{formatTime(plan.date, plan.startTime)}</div>
                  <div className="font-mono text-[14px] mt-0.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    {planTotalMinutes(plan)}m
                    <span className="text-muted-foreground"> / {plan.budgetMin}m</span>
                  </div>
                </div>
              </div>
              {plan.focus && (
                <p className="text-[12.5px] text-muted-foreground italic">{plan.focus}</p>
              )}
            </div>

            {plan.blocks.length === 0 && (
              <div className="text-center py-16 px-6">
                <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-display text-lg mb-1">Empty plan</h3>
                <p className="text-[13px] text-muted-foreground mb-4">
                  Open the drill library and click any drill to add it.
                </p>
                <DrillLibraryDrawer
                  onPick={(drillId) => addBlock(plan.id, drillId)}
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-1.5" /> Open Drill Library
                    </Button>
                  }
                />
              </div>
            )}

            {plan.blocks.length > 0 && (
              <div className="p-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={plan.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {plan.blocks.map((b, i) => (
                        <BlockRow
                          key={b.id}
                          block={b}
                          drill={findDrill(b.drillId)}
                          index={i}
                          startsAt={startTimes[i]}
                          onDurationChange={(mins) => updateBlock(plan.id, b.id, { durationMin: mins })}
                          onNotesChange={(notes) => updateBlock(plan.id, b.id, { notes })}
                          onRemove={() => removeBlock(plan.id, b.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <DrillLibraryDrawer
                    onPick={(drillId) => addBlock(plan.id, drillId)}
                    trigger={
                      <Button variant="outline" className="h-9">
                        <Plus className="w-4 h-4 mr-1.5" /> Add another drill
                      </Button>
                    }
                  />
                  <div className="text-[12px] font-mono text-muted-foreground">
                    Last edited {new Date(plan.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right rail: summary */}
          <PlanSummary
            plan={plan}
            onTitleChange={(v) => updatePlan(plan.id, { title: v })}
            onFocusChange={(v) => updatePlan(plan.id, { focus: v })}
            onBudgetChange={(v) => updatePlan(plan.id, { budgetMin: v })}
            onDateChange={(v) => updatePlan(plan.id, { date: v })}
            onTimeChange={(v) => updatePlan(plan.id, { startTime: v })}
            onStatusChange={(v) => updatePlan(plan.id, { status: v })}
            onPrint={() => setPrintOpen(true)}
          />
        </div>

        <Dialog open={printOpen} onOpenChange={setPrintOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Print / share view</DialogTitle>
            </DialogHeader>
            <PrintView plan={plan} />
            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] text-muted-foreground">
                Production: a “Print as PDF” action would render this through React-PDF.
              </div>
              <Button onClick={() => window.print()} variant="outline" size="sm">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Browser print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

export default CoachPracticePlanBuilder;
