/**
 * CustomDrillEditor
 * --------------------------------------------------------------------------
 * Modal dialog for creating + editing a coach's custom drills.
 *
 * Source: Prompt 16 addendum.
 *
 * Fields per spec:
 *   - name (title)
 *   - description
 *   - category (FK to DrillCategory)
 *   - default duration (minutes)
 *   - intensity, surface, player range, coaches needed
 *   - equipment (chips)
 *   - coaching points (bullet list — multiple)
 *   - optional Mux video URL
 *   - optional diagram URL
 *   - visibility: private | org | public
 */

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  drillCategories,
  type Drill,
  type DrillIntensity,
  type DrillSurface,
  type DrillVisibility,
} from "@/lib/mock/practice";
import {
  useCustomDrillsStore,
  type CustomDrillInput,
} from "@/lib/customDrillsStore";

const INTENSITIES: DrillIntensity[] = ["LOW", "MEDIUM", "HIGH", "MAX"];
const SURFACES: DrillSurface[] = [
  "HALF_COURT",
  "FULL_COURT",
  "BASELINE",
  "STATIONARY",
];
const VISIBILITIES: { value: DrillVisibility; label: string; hint: string }[] = [
  { value: "private", label: "Private", hint: "Only you can see this drill" },
  { value: "org", label: "Org", hint: "Shared with every coach in your org" },
  { value: "public", label: "Public", hint: "Visible to all HoopsOS coaches" },
];

const empty: CustomDrillInput = {
  title: "",
  description: "",
  categoryId: "cat_warmup",
  defaultDurationMin: 10,
  intensity: "MEDIUM",
  surface: "HALF_COURT",
  minPlayers: 1,
  maxPlayers: 12,
  equipment: [],
  coachesNeeded: 1,
  videoUrl: undefined,
  diagramUrl: undefined,
  coachingPoints: [],
  tags: [],
  visibility: "private",
};

function fromDrill(d: Drill): CustomDrillInput {
  return {
    title: d.title,
    description: d.description,
    categoryId: d.categoryId,
    defaultDurationMin: d.defaultDurationMin,
    intensity: d.intensity,
    surface: d.surface,
    minPlayers: d.minPlayers,
    maxPlayers: d.maxPlayers,
    equipment: d.equipment,
    coachesNeeded: d.coachesNeeded,
    videoUrl: d.videoUrl,
    diagramUrl: d.diagramUrl,
    coachingPoints: d.coachingPoints ?? [],
    tags: d.tags,
    visibility: d.visibility ?? "private",
  };
}

export function CustomDrillEditor({
  open,
  onOpenChange,
  editing,
  ownerCoachId,
  orgId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Drill currently being edited, or `null` for new. */
  editing: Drill | null;
  ownerCoachId: string;
  orgId?: string;
  onSaved?: (drill: Drill) => void;
}) {
  const create = useCustomDrillsStore((s) => s.create);
  const update = useCustomDrillsStore((s) => s.update);

  const [form, setForm] = useState<CustomDrillInput>(empty);
  const [equipDraft, setEquipDraft] = useState("");
  const [pointDraft, setPointDraft] = useState("");

  // Sync form whenever the editor reopens.
  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromDrill(editing) : empty);
    setEquipDraft("");
    setPointDraft("");
  }, [open, editing]);

  const canSave = useMemo(
    () =>
      form.title.trim().length >= 3 &&
      form.description.trim().length >= 6 &&
      form.defaultDurationMin >= 1 &&
      form.maxPlayers >= form.minPlayers,
    [form],
  );

  const set = <K extends keyof CustomDrillInput>(
    k: K,
    v: CustomDrillInput[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  function addEquipment() {
    const v = equipDraft.trim();
    if (!v) return;
    if (form.equipment.includes(v)) {
      setEquipDraft("");
      return;
    }
    set("equipment", [...form.equipment, v]);
    setEquipDraft("");
  }

  function addCoachingPoint() {
    const v = pointDraft.trim();
    if (!v) return;
    set("coachingPoints", [...form.coachingPoints, v]);
    setPointDraft("");
  }

  function handleSave() {
    if (!canSave) {
      toast.error("Title, description, duration, and player range are required.");
      return;
    }
    if (editing) {
      update(editing.id, form);
      toast.success(`Updated "${form.title}"`);
      onSaved?.({ ...editing, ...form });
    } else {
      const created = create(form, ownerCoachId, orgId);
      toast.success(`Saved "${form.title}" to My Drills`);
      onSaved?.(created);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">
            {editing ? "Edit drill" : "New custom drill"}
          </DialogTitle>
          <DialogDescription>
            Saved drills appear under the <strong>My Drills</strong> tab and can
            be dropped into any practice plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title + Category */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-3">
            <div>
              <Label>Drill name</Label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Spain PnR — Live"
                className="h-9"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => set("categoryId", v)}
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drillCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Setup, execution, scoring conditions…"
              rows={3}
              className="text-[12.5px] resize-none"
            />
          </div>

          {/* Duration / intensity / surface / coaches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.defaultDurationMin}
                onChange={(e) =>
                  set(
                    "defaultDurationMin",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="h-9"
              />
            </div>
            <div>
              <Label>Intensity</Label>
              <Select
                value={form.intensity}
                onValueChange={(v) => set("intensity", v as DrillIntensity)}
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Surface</Label>
              <Select
                value={form.surface}
                onValueChange={(v) => set("surface", v as DrillSurface)}
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURFACES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coaches</Label>
              <Input
                type="number"
                min={1}
                value={form.coachesNeeded}
                onChange={(e) =>
                  set(
                    "coachesNeeded",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="h-9"
              />
            </div>
          </div>

          {/* Player range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min players</Label>
              <Input
                type="number"
                min={1}
                value={form.minPlayers}
                onChange={(e) =>
                  set(
                    "minPlayers",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="h-9"
              />
            </div>
            <div>
              <Label>Max players</Label>
              <Input
                type="number"
                min={form.minPlayers}
                value={form.maxPlayers}
                onChange={(e) =>
                  set(
                    "maxPlayers",
                    Math.max(form.minPlayers, parseInt(e.target.value) || 1),
                  )
                }
                className="h-9"
              />
            </div>
          </div>

          {/* Equipment chips */}
          <div>
            <Label>Equipment</Label>
            <div className="flex items-center gap-2">
              <Input
                value={equipDraft}
                onChange={(e) => setEquipDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
                placeholder="e.g. 4 cones, 2 balls, agility ladder"
                className="h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEquipment}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {form.equipment.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.equipment.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-muted/40 border border-border"
                  >
                    {e}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "equipment",
                          form.equipment.filter((x) => x !== e),
                        )
                      }
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Coaching points */}
          <div>
            <Label>Coaching points</Label>
            <div className="flex items-center gap-2">
              <Input
                value={pointDraft}
                onChange={(e) => setPointDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCoachingPoint();
                  }
                }}
                placeholder="e.g. Hands ready, low stance, communicate switches"
                className="h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCoachingPoint}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {form.coachingPoints.length > 0 && (
              <ul className="mt-2 space-y-1">
                {form.coachingPoints.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12.5px] bg-muted/30 border border-border rounded px-2 py-1.5"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span className="flex-1">{p}</span>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "coachingPoints",
                          form.coachingPoints.filter((_, idx) => idx !== i),
                        )
                      }
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Optional media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Video URL (Mux / YouTube — optional)</Label>
              <Input
                value={form.videoUrl ?? ""}
                onChange={(e) =>
                  set("videoUrl", e.target.value || undefined)
                }
                placeholder="https://stream.mux.com/…"
                className="h-9"
              />
            </div>
            <div>
              <Label>Diagram URL (optional)</Label>
              <Input
                value={form.diagramUrl ?? ""}
                onChange={(e) =>
                  set("diagramUrl", e.target.value || undefined)
                }
                placeholder="https://…"
                className="h-9"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <Label>Visibility</Label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITIES.map((v) => {
                const active = form.visibility === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => set("visibility", v.value)}
                    className={`text-left p-2.5 rounded-md border transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-[12.5px] font-semibold uppercase tracking-wide">
                      {v.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {v.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editing ? "Save changes" : "Create drill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
      {children}
    </div>
  );
}
