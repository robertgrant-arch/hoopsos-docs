import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { drillLibrary, type Drill } from "@/lib/mock/practice";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { useAuth } from "@/lib/auth";

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

function makeId() {
  return `wod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const BLOCK_TYPES: WodBlockType[] = [
  "warmup",
  "skill",
  "shooting",
  "finishing",
  "footwork",
  "defense",
  "conditioning",
  "competitive",
  "recovery",
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

  const totalMinutes = useMemo(
    () => blocks.reduce((sum, b) => sum + (Number.isFinite(b.minutes) ? b.minutes : 0), 0),
    [blocks],
  );

  const sourceOptions = useMemo(
    () => ({
      library: drillLibrary,
      custom: customDrills,
    }),
    [customDrills],
  );

  function setBlock(id: string, patch: Partial<WodBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function addBlock() {
    setBlocks((prev) => [...prev, emptyBlock()]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  const output = useMemo(() => {
    return {
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
        coaching_points: b.coaching_points
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        success_metrics: b.success_metrics
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
    };
  }, [dailyTheme, coachNote, playerName, totalMinutes, blocks]);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Daily WOD Planner"
          subtitle="Create and edit player WODs from library drills, your custom drills, or generated blocks."
        />

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
                        <div className="text-sm font-semibold">Block {index + 1}</div>
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
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
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
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
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
    </AppShell>
  );
}
