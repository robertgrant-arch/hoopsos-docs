import { useMemo, useState } from "react";
import { Plus, Trash2, Sparkles, RefreshCw, CheckCircle, ChevronRight, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { drillLibrary, type Drill } from "@/lib/mock/practice";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

type WodBlockType =
  | "warmup"
  | "skill"
  | "shooting"
  | "finishing"
  | "footwork"
  | "defense"
  | "conditioning"
  | "competitive"
  | "recovery";

type WodSource = "library" | "custom" | "generated";

type WodBlock = {
  id: string;
  block_type: WodBlockType;
  source: WodSource;
  drill_name: string;
  source_drill_id: string;
  minutes: number;
  coaching_points: string;
  success_metrics: string;
};

type AiWodBlock = {
  block_type: string;
  drill_name: string;
  minutes: number;
  coaching_points: string[];
  success_metrics: string[];
};

type AiWodResult = {
  theme: string;
  rationale: string;
  blocks: AiWodBlock[];
};

function makeId() {
  return `wod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const BLOCK_TYPES: WodBlockType[] = [
  "warmup", "skill", "shooting", "finishing", "footwork",
  "defense", "conditioning", "competitive", "recovery",
];

const FOCUS_OPTIONS = [
  "Ball handling", "Finishing", "Shooting", "Footwork", "Defense",
  "Post moves", "Playmaking", "Off-ball movement", "Conditioning", "IQ & reads",
];

const emptyBlock = (): WodBlock => ({
  id: makeId(),
  block_type: "skill",
  source: "library",
  drill_name: "",
  source_drill_id: "",
  minutes: 8,
  coaching_points: "",
  success_metrics: "",
});

function aiBlockToWodBlock(b: AiWodBlock): WodBlock {
  return {
    id: makeId(),
    block_type: (BLOCK_TYPES.includes(b.block_type as WodBlockType) ? b.block_type : "skill") as WodBlockType,
    source: "generated",
    drill_name: b.drill_name,
    source_drill_id: "",
    minutes: b.minutes,
    coaching_points: b.coaching_points.join("\n"),
    success_metrics: b.success_metrics.join("\n"),
  };
}

function BlockTypeChip({ type }: { type: string }) {
  const colors: Record<string, string> = {
    warmup: "bg-amber-500/15 text-amber-400",
    skill: "bg-blue-500/15 text-blue-400",
    shooting: "bg-green-500/15 text-green-400",
    finishing: "bg-purple-500/15 text-purple-400",
    footwork: "bg-cyan-500/15 text-cyan-400",
    defense: "bg-red-500/15 text-red-400",
    conditioning: "bg-orange-500/15 text-orange-400",
    competitive: "bg-pink-500/15 text-pink-400",
    recovery: "bg-teal-500/15 text-teal-400",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${colors[type] ?? "bg-muted text-muted-foreground"}`}>
      {type}
    </span>
  );
}

// ─── AI Panel ────────────────────────────────────────────────────────────────

function AiWodPanel({
  open,
  onClose,
  defaultPlayerName,
  defaultMinutes,
  onApprove,
}: {
  open: boolean;
  onClose: () => void;
  defaultPlayerName: string;
  defaultMinutes: number;
  onApprove: (result: AiWodResult) => void;
}) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [position, setPosition] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>(["Ball handling", "Finishing"]);
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes || 45);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [coachNotes, setCoachNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "result" | "error">("idle");
  const [result, setResult] = useState<AiWodResult | null>(null);
  const [error, setError] = useState("");

  function toggleFocus(f: string) {
    setFocusAreas((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function generate() {
    if (!focusAreas.length) {
      toast.error("Select at least one focus area.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await apiFetch<AiWodResult>("/wods/generate", {
        method: "POST",
        body: JSON.stringify({ playerName, position, focusAreas, targetMinutes, intensity, coachNotes }),
      });
      setResult(res);
      setStatus("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus("error");
    }
  }

  function handleApprove() {
    if (result) {
      onApprove(result);
      onClose();
    }
  }

  const totalGenMinutes = result?.blocks.reduce((s, b) => s + b.minutes, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI WOD Generator
          </DialogTitle>
        </DialogHeader>

        {status !== "result" && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Player</label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Position (optional)</label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Guard, Forward" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFocus(f)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                      focusAreas.includes(f)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Duration (minutes)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={20}
                    max={90}
                    step={5}
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-10">{targetMinutes}m</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Intensity</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIntensity(i)}
                      className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold border capitalize transition-colors ${
                        intensity === i
                          ? i === "high" ? "bg-red-500/20 text-red-400 border-red-500/40"
                          : i === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-green-500/20 text-green-400 border-green-500/40"
                          : "bg-background text-muted-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Coach notes (optional)</label>
              <Textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Keep cues simple, focus on weak hand, avoid jumping drills today"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button onClick={generate} disabled={status === "loading"} className="w-full gap-2">
              {status === "loading" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating WOD…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate WOD
                </>
              )}
            </Button>
          </div>
        )}

        {status === "result" && result && (
          <div className="space-y-4 pt-1">
            {/* Theme + rationale */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1.5">
              <div className="text-[11px] uppercase tracking-widest text-primary font-mono">AI Suggestion</div>
              <div className="font-semibold text-[15px]">{result.theme}</div>
              <p className="text-[13px] text-muted-foreground">{result.rationale}</p>
              <div className="text-xs text-muted-foreground">{totalGenMinutes} min total · {result.blocks.length} blocks</div>
            </div>

            {/* Block preview */}
            <div className="space-y-2">
              {result.blocks.map((b, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                      <BlockTypeChip type={b.block_type} />
                      <span className="text-sm font-semibold">{b.drill_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{b.minutes} min</span>
                  </div>
                  {b.coaching_points.length > 0 && (
                    <ul className="ml-6 space-y-0.5">
                      {b.coaching_points.map((cp, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                          {cp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleApprove} className="flex-1 gap-2">
                <CheckCircle className="w-4 h-4" />
                Use This WOD
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatus("idle")}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachWodPlanner() {
  const { user } = useAuth();
  const coachId = user?.id ?? "coach_anonymous";
  const orgId = (user as any)?.orgId as string | undefined;
  const allCustomDrills = useCustomDrillsStore((s) => s.drills);
  const customDrills = useMemo(
    () =>
      allCustomDrills.filter((d) => {
        if (d.visibility === "public") return true;
        if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
        return d.ownerCoachId === coachId;
      }),
    [allCustomDrills, coachId, orgId],
  );

  const [playerName, setPlayerName] = useState("Andrew G.");
  const [dailyTheme, setDailyTheme] = useState("Ball control + layup footwork");
  const [coachNote, setCoachNote] = useState(
    "Keep cues simple and reps game-like. Build confidence on weak hand.",
  );
  const [blocks, setBlocks] = useState<WodBlock[]>([
    { ...emptyBlock(), block_type: "warmup", minutes: 7 },
    { ...emptyBlock(), block_type: "skill", minutes: 9 },
    { ...emptyBlock(), block_type: "finishing", minutes: 10 },
    { ...emptyBlock(), block_type: "competitive", minutes: 11 },
    { ...emptyBlock(), block_type: "recovery", minutes: 8, source: "generated" },
  ]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [lastAiTheme, setLastAiTheme] = useState<string | null>(null);

  const totalMinutes = useMemo(
    () => blocks.reduce((sum, b) => sum + (Number.isFinite(b.minutes) ? b.minutes : 0), 0),
    [blocks],
  );

  const sourceOptions = useMemo(
    () => ({ library: drillLibrary, custom: customDrills }),
    [customDrills],
  );

  function setBlock(id: string, patch: Partial<WodBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function addBlock() { setBlocks((prev) => [...prev, emptyBlock()]); }
  function removeBlock(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); }

  function handleAiApprove(result: AiWodResult) {
    setBlocks(result.blocks.map(aiBlockToWodBlock));
    setDailyTheme(result.theme);
    setLastAiTheme(result.theme);
    toast.success("AI WOD loaded into builder — review and save when ready.");
  }

  const output = useMemo(() => ({
    daily_theme: dailyTheme,
    coach_note: coachNote,
    player: playerName,
    total_minutes: totalMinutes,
    intensity: totalMinutes >= 55 ? "high" : totalMinutes >= 40 ? "medium" : "low",
    wod: blocks.map((b, idx) => ({
      block_type: b.block_type,
      order: idx + 1,
      drill_name: b.drill_name || "Unnamed block",
      source: b.source,
      source_drill_id: b.source_drill_id,
      minutes: b.minutes,
      coaching_points: b.coaching_points.split("\n").map((s) => s.trim()).filter(Boolean),
      success_metrics: b.success_metrics.split("\n").map((s) => s.trim()).filter(Boolean),
    })),
  }), [dailyTheme, coachNote, playerName, totalMinutes, blocks]);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Daily WOD Planner"
          subtitle="Create player WODs from library drills, custom drills, or let AI design one for you."
          actions={
            <Button onClick={() => setAiPanelOpen(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Button>
          }
        />

        {lastAiTheme && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">AI-generated:</span>
            <span className="font-medium">{lastAiTheme}</span>
            <button
              onClick={() => setLastAiTheme(null)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
          <Card>
            <CardHeader>
              <CardTitle>WOD Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name"
                />
                <Input
                  value={dailyTheme}
                  onChange={(e) => setDailyTheme(e.target.value)}
                  placeholder="Daily theme"
                />
              </div>
              <Textarea
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                rows={2}
                placeholder="Coach note"
              />

              <div className="space-y-3">
                {blocks.map((block, index) => {
                  const options: Drill[] =
                    block.source === "library"
                      ? sourceOptions.library
                      : block.source === "custom"
                        ? sourceOptions.custom
                        : [];

                  return (
                    <div key={block.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Block {index + 1}</span>
                          {block.source === "generated" && (
                            <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlock(block.id)}
                          aria-label="Remove block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-4 gap-2">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={block.block_type}
                          onChange={(e) =>
                            setBlock(block.id, { block_type: e.target.value as WodBlockType })
                          }
                        >
                          {BLOCK_TYPES.map((bt) => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={block.source}
                          onChange={(e) =>
                            setBlock(block.id, {
                              source: e.target.value as WodSource,
                              source_drill_id: "",
                              drill_name: "",
                            })
                          }
                        >
                          <option value="library">library</option>
                          <option value="custom">custom</option>
                          <option value="generated">generated</option>
                        </select>
                        <Input
                          type="number"
                          value={block.minutes}
                          min={1}
                          onChange={(e) => setBlock(block.id, { minutes: Number(e.target.value) || 1 })}
                          placeholder="Minutes"
                        />
                        <Input
                          value={block.drill_name}
                          onChange={(e) => setBlock(block.id, { drill_name: e.target.value })}
                          placeholder="Drill name"
                        />
                      </div>
                      {block.source !== "generated" && (
                        <select
                          className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                          value={block.source_drill_id}
                          onChange={(e) => {
                            const drillId = e.target.value;
                            const drill = options.find((d) => d.id === drillId);
                            setBlock(block.id, {
                              source_drill_id: drillId,
                              drill_name: drill?.title ?? block.drill_name,
                            });
                          }}
                        >
                          <option value="">Select a {block.source} drill</option>
                          {options.map((d) => (
                            <option key={d.id} value={d.id}>{d.title}</option>
                          ))}
                        </select>
                      )}
                      <Textarea
                        rows={2}
                        value={block.coaching_points}
                        onChange={(e) => setBlock(block.id, { coaching_points: e.target.value })}
                        placeholder="Coaching points (one per line)"
                      />
                      <Textarea
                        rows={2}
                        value={block.success_metrics}
                        onChange={(e) => setBlock(block.id, { success_metrics: e.target.value })}
                        placeholder="Success metrics (one per line)"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={addBlock}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add block
                </Button>
                <div className="text-sm text-muted-foreground">Total: {totalMinutes} min</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap break-words rounded-md bg-muted p-3 max-h-[70vh] overflow-auto">
                {JSON.stringify(output, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      <AiWodPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        defaultPlayerName={playerName}
        defaultMinutes={totalMinutes || 45}
        onApprove={handleAiApprove}
      />
    </AppShell>
  );
}
