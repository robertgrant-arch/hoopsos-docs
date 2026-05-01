/**
 * PlayCanvas — interactive Konva editor for a single play phase.
 *
 * Tools (controlled by parent):
 *   SELECT — drag tokens, click to select, click path to select
 *   OFFENSE — click empty area to drop offensive token
 *   DEFENSE — click empty area to drop defensive token
 *   BALL    — click to (re)place ball
 *   PASS / DRIBBLE / CUT / SCREEN / HANDOFF — drag from token to token to draw a path
 *   COURT_PAN — disabled (we keep the court fixed in the viewport for clarity)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Rect, Circle, Line, Text, Shape } from "react-konva";
import type Konva from "konva";
import { HalfCourt } from "@/components/court/HalfCourt";
import type { PathType, PlayPath, PlayPhase, PlayToken, TokenType } from "@/lib/mock/playbook";

export type CanvasTool = "SELECT" | TokenType | PathType;

const PATH_STYLE: Record<
  PathType,
  { stroke: string; dash?: number[]; arrow: boolean; width: number; cap: "round" | "butt" }
> = {
  PASS: { stroke: "#fde68a", dash: [10, 6], arrow: true, width: 3, cap: "round" },
  DRIBBLE: { stroke: "#fb923c", arrow: true, width: 3, cap: "round" },
  CUT: { stroke: "#cbd5e1", arrow: true, width: 3, cap: "round" },
  SCREEN: { stroke: "#f0abfc", arrow: false, width: 6, cap: "butt" },
  HANDOFF: { stroke: "#fbbf24", dash: [4, 4], arrow: true, width: 3, cap: "round" },
};

const PATH_TOOLS = ["PASS", "DRIBBLE", "CUT", "SCREEN", "HANDOFF"] as const;
const TOKEN_TOOLS = ["OFFENSE", "DEFENSE", "BALL", "CONE"] as const;
const STAGE_W = 800;
const STAGE_H = 600;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function nextLabel(tokens: PlayToken[], type: TokenType): string {
  if (type === "BALL") return "";
  if (type === "OFFENSE") {
    const used = new Set(tokens.filter((t) => t.type === "OFFENSE").map((t) => t.label));
    for (let i = 1; i <= 9; i++) if (!used.has(String(i))) return String(i);
    return String(tokens.filter((t) => t.type === "OFFENSE").length + 1);
  }
  if (type === "DEFENSE") {
    const used = new Set(tokens.filter((t) => t.type === "DEFENSE").map((t) => t.label));
    for (let i = 1; i <= 9; i++) if (!used.has(`X${i}`)) return `X${i}`;
    return `X${tokens.filter((t) => t.type === "DEFENSE").length + 1}`;
  }
  return "";
}

type Props = {
  phase: PlayPhase;
  tool: CanvasTool;
  selectedTokenId: string | null;
  selectedPathId: string | null;
  width: number;
  height: number;
  /** Stage size in court coords (always 800x600) for layout math. */
  onSelectToken: (id: string | null) => void;
  onSelectPath: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onAddToken: (token: Omit<PlayToken, "id">) => void;
  onAddPath: (path: Omit<PlayPath, "id">) => void;
  onRemoveToken: (id: string) => void;
  onRemovePath: (id: string) => void;
  /** When non-null, render an animated overlay of these tokens (for Play preview). */
  animatedTokens?: PlayToken[] | null;
};

export function PlayCanvas({
  phase,
  tool,
  selectedTokenId,
  selectedPathId,
  width,
  height,
  onSelectToken,
  onSelectPath,
  onMoveToken,
  onAddToken,
  onAddPath,
  onRemoveToken,
  onRemovePath,
  animatedTokens,
}: Props) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [drawing, setDrawing] = useState<{ fromTokenId: string; points: number[] } | null>(null);

  const scale = useMemo(() => Math.min(width / STAGE_W, height / STAGE_H), [width, height]);
  const stagePxW = STAGE_W * scale;
  const stagePxH = STAGE_H * scale;

  const isPathTool = PATH_TOOLS.includes(tool as any);
  const isTokenTool = TOKEN_TOOLS.includes(tool as any);

  function clientToCourt(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: clamp(pos.x / scale, 0, STAGE_W),
      y: clamp(pos.y / scale, 0, STAGE_H),
    };
  }

  useEffect(() => {
    if (!drawing) return;
    const onPointerUp = () => setDrawing(null);
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, [drawing]);

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const { x, y } = clientToCourt(e as Konva.KonvaEventObject<MouseEvent>);
    if (tool === "SELECT") {
      if (e.target === e.target.getStage() || e.target.name() === "court-bg") {
        onSelectToken(null);
        onSelectPath(null);
      }
      return;
    }
    if (isTokenTool) {
      const type = tool as TokenType;
      if (type === "BALL") {
        const existing = phase.tokens.find((t) => t.type === "BALL");
        if (existing) {
          onMoveToken(existing.id, x, y);
          return;
        }
      }
      onAddToken({ type, label: nextLabel(phase.tokens, type), x, y });
      return;
    }
    if (drawing) {
      setDrawing(null);
    }
  }

  function handleTokenClick(t: PlayToken, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    if (tool === "SELECT") {
      onSelectToken(t.id);
      return;
    }
    if (isPathTool) {
      if (!drawing) {
        setDrawing({ fromTokenId: t.id, points: [t.x, t.y] });
      } else if (drawing.fromTokenId !== t.id) {
        const start = phase.tokens.find((x) => x.id === drawing.fromTokenId);
        if (!start) {
          setDrawing(null);
          return;
        }
        const midX = (start.x + t.x) / 2;
        const midY = (start.y + t.y) / 2;
        const dx = t.x - start.x;
        const dy = t.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const offset = Math.min(60, len * 0.18);
        const cx = midX - (dy / len) * offset;
        const cy = midY + (dx / len) * offset;
        onAddPath({
          type: tool as PathType,
          points: [start.x, start.y, cx, cy, t.x, t.y],
          startTokenId: start.id,
          endTokenId: t.id,
        });
        setDrawing(null);
      } else {
        setDrawing(null);
      }
    }
  }

  function handleTokenDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    e.target.position({
      x: clamp(e.target.x(), 0, STAGE_W),
      y: clamp(e.target.y(), 0, STAGE_H),
    });
  }

  function handleTokenDragEnd(t: PlayToken, e: Konva.KonvaEventObject<DragEvent>) {
    onMoveToken(t.id, clamp(e.target.x(), 0, STAGE_W), clamp(e.target.y(), 0, STAGE_H));
  }

  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawing) return;
    const { x, y } = clientToCourt(e as any);
    setDrawing((prev) => (prev ? { ...prev, points: [prev.points[0], prev.points[1], x, y] } : null));
  }

  function renderPath(pa: PlayPath) {
    const style = PATH_STYLE[pa.type];
    const pts = pa.points;
    const isQuad = pts.length === 6;
    const ex = pts[pts.length - 2];
    const ey = pts[pts.length - 1];
    const ang = isQuad
      ? Math.atan2(pts[5] - pts[3], pts[4] - pts[2])
      : Math.atan2(pts[3] - pts[1], pts[2] - pts[0]);
    const isSelected = pa.id === selectedPathId;
    return (
      <Group
        key={pa.id}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectPath(pa.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectPath(pa.id);
        }}
      >
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            if (isQuad) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
            else ctx.lineTo(pts[2], pts[3]);
            ctx.strokeShape(shape);
          }}
          stroke="rgba(0,0,0,0)"
          strokeWidth={30}
        />
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            if (isQuad) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
            else ctx.lineTo(pts[2], pts[3]);
            if (style.dash) ctx.setLineDash(style.dash);
            ctx.strokeShape(shape);
          }}
          stroke={style.stroke}
          strokeWidth={isSelected ? style.width + 2 : style.width}
          shadowColor={isSelected ? style.stroke : undefined}
          shadowBlur={isSelected ? 8 : 0}
          lineCap={style.cap}
        />
        {pa.type === "SCREEN" && (
          <Line points={[ex - 14, ey, ex + 14, ey]} stroke={style.stroke} strokeWidth={6} />
        )}
        {style.arrow && (
          <Line
            points={[0, -8, 18, 0, 0, 8]}
            closed
            fill={style.stroke}
            x={ex}
            y={ey}
            rotation={(ang * 180) / Math.PI}
          />
        )}
      </Group>
    );
  }

  function renderToken(t: PlayToken, opts?: { ghost?: boolean }) {
    const isSelected = t.id === selectedTokenId && !opts?.ghost;
    const isSource = drawing?.fromTokenId === t.id;
    const opacity = opts?.ghost ? 0.55 : 1;
    const dragProps = {
      draggable: tool === "SELECT" && !opts?.ghost,
      onDragMove: handleTokenDragMove,
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleTokenDragEnd(t, e),
    };

    if (t.type === "BALL") {
      return (
        <Group key={t.id} x={t.x} y={t.y} opacity={opacity} {...dragProps} onClick={(e) => handleTokenClick(t, e)} onTap={(e) => handleTokenClick(t, e)}>
          <Circle radius={14} fill="#facc15" stroke={isSelected ? "#fff" : "#92400e"} strokeWidth={isSelected ? 3 : 2} />
          <Line points={[-10, 0, 10, 0]} stroke="#7c2d12" strokeWidth={1.5} />
          <Line points={[0, -10, 0, 10]} stroke="#7c2d12" strokeWidth={1.5} />
        </Group>
      );
    }

    if (t.type === "OFFENSE") {
      return (
        <Group key={t.id} x={t.x} y={t.y} opacity={opacity} {...dragProps} onClick={(e) => handleTokenClick(t, e)} onTap={(e) => handleTokenClick(t, e)}>
          <Circle
            radius={22}
            fill="#fef3c7"
            stroke={isSelected || isSource ? "#fbbf24" : "#92400e"}
            strokeWidth={isSelected || isSource ? 4 : 2}
            shadowBlur={isSource ? 12 : 0}
            shadowColor="#fbbf24"
          />
          <Text
            text={t.label}
            fontSize={20}
            fontStyle="bold"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#451a03"
            offsetX={t.label.length * 5.5}
            offsetY={10}
          />
        </Group>
      );
    }

    if (t.type === "DEFENSE") {
      return (
        <Group key={t.id} x={t.x} y={t.y} opacity={opacity} {...dragProps} onClick={(e) => handleTokenClick(t, e)} onTap={(e) => handleTokenClick(t, e)}>
          <Rect
            x={-20}
            y={-20}
            width={40}
            height={40}
            fill="#7f1d1d"
            stroke={isSelected || isSource ? "#fbbf24" : "#450a0a"}
            strokeWidth={isSelected || isSource ? 4 : 2}
            cornerRadius={4}
            shadowBlur={isSource ? 12 : 0}
            shadowColor="#fbbf24"
          />
          <Text
            text={t.label}
            fontSize={16}
            fontStyle="bold"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#fee2e2"
            offsetX={t.label.length * 4.5}
            offsetY={8}
          />
        </Group>
      );
    }

    return (
      <Group key={t.id} x={t.x} y={t.y} opacity={opacity} {...dragProps} onClick={(e) => handleTokenClick(t, e)} onTap={(e) => handleTokenClick(t, e)}>
        <Line points={[0, -14, -12, 8, 12, 8]} closed fill="#fb923c" stroke="#7c2d12" strokeWidth={1.5} />
      </Group>
    );
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDrawing(null);
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedTokenId) {
            onRemoveToken(selectedTokenId);
          } else if (selectedPathId) {
            onRemovePath(selectedPathId);
          }
        }
      }}
      style={{
        width: stagePxW,
        height: stagePxH,
        position: "relative",
        cursor: isTokenTool ? "crosshair" : isPathTool ? "copy" : drawing ? "crosshair" : "default",
      }}
    >
      <HalfCourt width={stagePxW} height={stagePxH} className="absolute inset-0 pointer-events-none" />

      <Stage
        ref={stageRef}
        width={stagePxW}
        height={stagePxH}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageClick as any}
        onTouchStart={handleStageClick as any}
        onMouseMove={handleStageMouseMove}
      >
        <Layer>
          <Rect name="court-bg" x={0} y={0} width={STAGE_W} height={STAGE_H} fill="transparent" />

          {phase.paths.map(renderPath)}

          {drawing && (
            <Line points={drawing.points} stroke="rgba(251,191,36,0.7)" strokeWidth={2} dash={[6, 4]} />
          )}

          {(animatedTokens ?? phase.tokens).map((t) => renderToken(t))}
        </Layer>
      </Stage>
    </div>
  );
}

export default PlayCanvas;
