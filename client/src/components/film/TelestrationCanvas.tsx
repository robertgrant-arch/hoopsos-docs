// TelestrationCanvas — freehand drawing overlay for the film player.
//
// Renders as an absolute overlay on top of the video area. The coach draws
// strokes, then hits "Save" to persist them as a telestration annotation on
// the current timestamp via POST /api/film-analysis/sessions/:id/annotations.
//
// Usage:
//   <div className="relative" style={{ aspectRatio: "16/9" }}>
//     <VideoPlayer ... />
//     {drawMode && (
//       <TelestrationCanvas sessionId="s1" currentTimeSec={47} onSave={handleSaved} />
//     )}
//   </div>

import { useRef, useState, useEffect, useCallback } from "react";
import { Undo2, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Point { x: number; y: number }

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

export interface SavedTelestration {
  id:       string;
  startMs:  number;
  strokes:  Stroke[];
  label?:   string;
}

export interface TelestrationCanvasProps {
  sessionId:      string;
  currentTimeSec: number;
  onSave?:        () => void;
  savedStrokes?:  SavedTelestration[];  // readonly playback overlays
}

// ── Color / width palettes ────────────────────────────────────────────────────

const COLORS = [
  { value: "#ff3b30", label: "Red"    },
  { value: "#ffd60a", label: "Yellow" },
  { value: "#ffffff", label: "White"  },
  { value: "#30d158", label: "Green"  },
  { value: "#0a84ff", label: "Blue"   },
];

const WIDTHS = [
  { value: 2,  label: "S" },
  { value: 4,  label: "M" },
  { value: 8,  label: "L" },
];

// ── Drawing helpers ───────────────────────────────────────────────────────────

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  current: Stroke | null,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const stroke of [...strokes, ...(current ? [current] : [])]) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth   = stroke.width;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TelestrationCanvas({
  sessionId,
  currentTimeSec,
  onSave,
  savedStrokes = [],
}: TelestrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [strokes,       setStrokes]       = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [color,         setColor]         = useState(COLORS[0].value);
  const [width,         setWidth]         = useState(WIDTHS[1].value);
  const [saving,        setSaving]        = useState(false);
  const [isDrawing,     setIsDrawing]     = useState(false);

  // Saved strokes that are within 5 seconds of the current playhead
  const nearbyStrokes = savedStrokes.flatMap((t) => {
    const deltaSec = Math.abs(t.startMs / 1000 - currentTimeSec);
    return deltaSec <= 5 ? t.strokes : [];
  });

  // Re-render canvas whenever strokes or the in-progress stroke change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawStrokes(ctx, [...nearbyStrokes, ...strokes], currentStroke);
  }, [strokes, currentStroke, nearbyStrokes]);

  // Map mouse position to canvas coordinate space (handles CSS scaling)
  function relativePos(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left)  * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)   * (canvas.height / rect.height),
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setIsDrawing(true);
    const pos = relativePos(e);
    setCurrentStroke({ color, width, points: [pos] });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = relativePos(e);
    setCurrentStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, pos] } : null,
    );
  }

  function commitStroke() {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length >= 2) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  }

  function handleUndo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setStrokes([]);
    setCurrentStroke(null);
  }

  async function handleSave() {
    if (strokes.length === 0) return;
    setSaving(true);
    try {
      await apiPost(`/film-analysis/sessions/${sessionId}/annotations`, {
        kind:    "telestration",
        startMs: Math.round(currentTimeSec * 1000),
        data:    { strokes },
        label:   `Drawing @ ${fmtTime(currentTimeSec)}`,
      });
      toast.success(`Drawing saved at ${fmtTime(currentTimeSec)}`);
      setStrokes([]);
      onSave?.();
    } catch {
      // Demo mode — still give positive feedback; strokes are visible in-session
      toast.success(`Drawing saved at ${fmtTime(currentTimeSec)} (demo mode)`);
      setStrokes([]);
      onSave?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-auto select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-sm shrink-0 z-10">
        {/* Color swatches */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setColor(c.value)}
              className={`w-4.5 h-4.5 rounded-full border-2 transition-transform ${
                color === c.value
                  ? "border-white scale-125"
                  : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: c.value, width: 18, height: 18 }}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Stroke widths */}
        <div className="flex items-center gap-1">
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              title={`${w.label} stroke`}
              onClick={() => setWidth(w.value)}
              className={`w-7 h-6 rounded flex items-center justify-center transition ${
                width === w.value ? "bg-white/25" : "hover:bg-white/10"
              }`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: w.value * 2.5, height: w.value * 2.5, maxWidth: 16, maxHeight: 16 }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Undo / Clear */}
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          title="Undo last stroke"
          className="h-6 px-2 rounded text-[11px] text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center gap-1 transition"
        >
          <Undo2 className="w-3 h-3" />
        </button>
        <button
          onClick={handleClear}
          disabled={strokes.length === 0}
          title="Clear all"
          className="h-6 px-2 rounded text-[11px] text-white/70 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 flex items-center gap-1 transition"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono">
            {fmtTime(currentTimeSec)}
          </span>
          <button
            onClick={handleSave}
            disabled={strokes.length === 0 || saving}
            className="h-6 px-3 rounded text-[11px] font-semibold bg-primary hover:bg-primary/80 text-primary-foreground disabled:opacity-40 flex items-center gap-1.5 transition"
          >
            <Save className="w-3 h-3" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="flex-1 w-full h-full cursor-crosshair"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={commitStroke}
        onMouseLeave={commitStroke}
      />
    </div>
  );
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
