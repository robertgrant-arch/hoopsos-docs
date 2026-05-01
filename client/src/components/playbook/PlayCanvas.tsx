/**
 * PlayCanvas — interactive Konva editor for a single play phase.
 *
 * Interaction model is a deterministic state machine driven by the store's
 * `editorMode`. Every event handler reads the current mode and routes to
 * the matching code path. The previous version mixed local component
 * state with stage-level handlers and let the Stage's mousedown wipe
 * the in-flight path draft on every click — this rewrite eliminates
 * that class of bug entirely:
 *
 *   • Token events stop propagation so they cannot bubble up to the Stage.
 *   • The Stage handler only acts on TRUE empty-stage clicks (target ===
 *     stage OR target.name() === "court-bg").
 *   • A window-level mouseup cleanup discards stuck drafts when the user
 *     releases outside the canvas.
 *   • Escape cancels the draft and returns to SELECT.
 *   • Geometry: arrowheads use the actual final tangent; control points
 *     use a perpendicular offset for readable curves.
 *   • Drag positions are clamped so tokens cannot leave the playable area.
 *
 * Tools (driven by store.editorMode):
 *   SELECT          — drag tokens, click to select, click path to select
 *   ADD_OFFENSE     — click empty area to drop offensive token
 *   ADD_DEFENSE     — click empty area to drop defensive token
 *   ADD_BALL        — click to (re)place ball
 *   ADD_CONE        — click to drop a cone
 *   DRAW_PASS / DRAW_DRIBBLE / DRAW_CUT / DRAW_SCREEN / DRAW_HANDOFF
 *                   — click one token, then click another to commit
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Stage, Layer, Group, Rect, Circle, Line, Text, Shape } from "react-konva";
import type Konva from "konva";
import { HalfCourt } from "@/components/court/HalfCourt";
import type {
  EditorMode,
  PathType,
  PlayPath,
  PlayPhase,
  PlayToken,
  TokenType,
} from "@/lib/mock/playbookSchema";

const STAGE_W = 800;
const STAGE_H = 600;

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

/** Token-add modes that match a TokenType. */
const ADD_MODE_TO_TOKEN: Partial<Record<EditorMode, TokenType>> = {
  ADD_OFFENSE: "OFFENSE",
  ADD_DEFENSE: "DEFENSE",
  ADD_BALL: "BALL",
  ADD_CONE: "CONE",
};

/** Draw modes that match a PathType. */
const DRAW_MODE_TO_PATH: Partial<Record<EditorMode, PathType>> = {
  DRAW_PASS: "PASS",
  DRAW_DRIBBLE: "DRIBBLE",
  DRAW_CUT: "CUT",
  DRAW_SCREEN: "SCREEN",
  DRAW_HANDOFF: "HANDOFF",
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function nextLabel(tokens: PlayToken[], type: TokenType): string {
  if (type === "BALL" || type === "CONE") return "";
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

/**
 * Compute a control point for a quadratic bezier between (sx,sy) and (ex,ey)
 * using a mild perpendicular offset so curves read as a curve, not a straight
 * line through the midpoint. Returns the midpoint when distance is too small
 * to bend safely.
 */
function controlPointFor(sx: number, sy: number, ex: number, ey: number): { cx: number; cy: number } {
  const midX = (sx + ex) / 2;
  const midY = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return { cx: midX, cy: midY };
  const offset = Math.min(60, len * 0.18);
  return {
    cx: midX - (dy / len) * offset,
    cy: midY + (dx / len) * offset,
  };
}

/**
 * Sample the tangent angle at the END of the rendered path so arrowheads
 * point in the actual direction of travel, not the chord.
 */
function endTangentAngle(points: number[]): number {
  if (points.length >= 6) {
    // Quadratic bezier: derivative at t=1 is 2*(P2 - P1).
    const x1 = points[points.length - 4];
    const y1 = points[points.length - 3];
    const x2 = points[points.length - 2];
    const y2 = points[points.length - 1];
    return Math.atan2(y2 - y1, x2 - x1);
  }
  if (points.length >= 4) {
    const x1 = points[points.length - 4];
    const y1 = points[points.length - 3];
    const x2 = points[points.length - 2];
    const y2 = points[points.length - 1];
    return Math.atan2(y2 - y1, x2 - x1);
  }
  return 0;
}

type PendingDraft = {
  pathType: PathType;
  fromTokenId: string;
  fromX: number;
  fromY: number;
  cursorX: number;
  cursorY: number;
};

type Props = {
  phase: PlayPhase;
  editorMode: EditorMode;
  selectedTokenId: string | null;
  selectedPathId: string | null;
  width: number;
  height: number;
  onSelectToken: (id: string | null) => void;
  onSelectPath: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onAddToken: (token: Omit<PlayToken, "id">) => void;
  onAddPath: (path: Omit<PlayPath, "id">) => void;
  onRemoveToken: (id: string) => void;
  onRemovePath: (id: string) => void;
  onCancelMode?: () => void;
  /** When non-null, render an animated overlay of these tokens (for Play preview). */
  animatedTokens?: PlayToken[] | null;
};

export function PlayCanvas({
  phase,
  editorMode,
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
  onCancelMode,
  animatedTokens,
}: Props) {
  const stageRef = useRef<Konva.Stage | null>(null);
  // Pending draft is local component state — it is short-lived and never
  // outlives a single uninterrupted authoring gesture. We deliberately
  // do NOT route this through the Zustand store on every cursor move
  // because that would cause unnecessary re-renders of the entire studio.
  const draftRef = useRef<PendingDraft | null>(null);
  const [, setRenderTick] = useState(0);
  const force = useCallback(() => setRenderTick((n) => n + 1), []);

  const scale = useMemo(() => Math.min(width / STAGE_W, height / STAGE_H), [width, height]);
  const stagePxW = STAGE_W * scale;
  const stagePxH = STAGE_H * scale;

  const drawPathType = DRAW_MODE_TO_PATH[editorMode];
  const isDrawMode = !!drawPathType;
  const addTokenType = ADD_MODE_TO_TOKEN[editorMode];
  const isAddTokenMode = !!addTokenType;
  const isSelectMode = editorMode === "SELECT";

  function clientToCourt(): { x: number; y: number } {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: clamp(pos.x / scale, 0, STAGE_W),
      y: clamp(pos.y / scale, 0, STAGE_H),
    };
  }

  /* ---------- draft helpers ---------- */
  function setDraft(next: PendingDraft | null) {
    draftRef.current = next;
    force();
  }

  function cancelDraft() {
    if (draftRef.current) setDraft(null);
  }

  /* ---------- window cleanup ---------- */
  useEffect(() => {
    function onWindowMouseUp(ev: MouseEvent) {
      // If the user releases the mouse outside the stage, drop any in-flight
      // draft so a stale ghost line cannot wedge the canvas.
      const stage = stageRef.current;
      if (!stage || !draftRef.current) return;
      const container = stage.container();
      const rect = container.getBoundingClientRect();
      const inside =
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom;
      if (!inside) cancelDraft();
    }
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel any in-flight draft when the editor mode changes — we do NOT
  // want a PASS draft to silently survive into a CUT click.
  useEffect(() => {
    cancelDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode, phase.id]);

  /* ---------- stage event handlers ---------- */

  function isEmptyStageTarget(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): boolean {
    const target = e.target;
    if (target === target.getStage()) return true;
    return target.name() === "court-bg";
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!isEmptyStageTarget(e)) return; // never act on token-targeted clicks
    const { x, y } = clientToCourt();

    if (isSelectMode) {
      // True empty click clears selection.
      onSelectToken(null);
      onSelectPath(null);
      return;
    }

    if (isAddTokenMode && addTokenType) {
      // BALL has at-most-one semantics; the store also enforces this, but
      // re-placing an existing ball when in ADD_BALL mode is the friendly UX.
      if (addTokenType === "BALL") {
        const existing = phase.tokens.find((t) => t.type === "BALL");
        if (existing) {
          onMoveToken(existing.id, x, y);
          return;
        }
      }
      onAddToken({
        type: addTokenType,
        label: nextLabel(phase.tokens, addTokenType),
        x,
        y,
      });
      return;
    }

    if (isDrawMode) {
      // Empty-stage click while drawing — cancel any in-flight draft.
      cancelDraft();
      return;
    }
  }

  function handleStageMouseMove() {
    if (!draftRef.current) return;
    const { x, y } = clientToCourt();
    if (draftRef.current.cursorX === x && draftRef.current.cursorY === y) return;
    draftRef.current = { ...draftRef.current, cursorX: x, cursorY: y };
    force();
  }

  /* ---------- token event handlers ---------- */

  function handleTokenMouseDown(
    t: PlayToken,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    // Critical: stop bubble so the Stage handler does not run. Without
    // this, the previous version wiped the path draft on every token
    // mousedown.
    e.cancelBubble = true;

    if (isSelectMode) {
      onSelectToken(t.id);
      return;
    }

    if (isDrawMode) {
      const pathType = drawPathType;
      if (!pathType) return;
      const draft = draftRef.current;
      if (!draft) {
        // First click — start the draft anchored at this token.
        setDraft({
          pathType,
          fromTokenId: t.id,
          fromX: t.x,
          fromY: t.y,
          cursorX: t.x,
          cursorY: t.y,
        });
        return;
      }
      if (draft.fromTokenId === t.id) {
        // Clicked same token twice — cancel cleanly.
        cancelDraft();
        return;
      }
      // Different token — commit the path.
      const start = phase.tokens.find((tk) => tk.id === draft.fromTokenId);
      if (!start) {
        cancelDraft();
        return;
      }
      const { cx, cy } = controlPointFor(start.x, start.y, t.x, t.y);
      onAddPath({
        type: draft.pathType,
        points: [start.x, start.y, cx, cy, t.x, t.y],
        startTokenId: start.id,
        endTokenId: t.id,
        controlX: cx,
        controlY: cy,
      });
      cancelDraft();
      return;
    }

    if (isAddTokenMode) {
      // Clicking a token while in token-add mode is treated as "select that
      // token" rather than placing a new one on top, so users don't end up
      // stacking tokens by accident.
      onSelectToken(t.id);
    }
  }

  function handleTokenDragStart(
    e: Konva.KonvaEventObject<DragEvent>,
  ) {
    e.cancelBubble = true;
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

  /* ---------- render helpers ---------- */

  function renderPath(pa: PlayPath) {
    const style = PATH_STYLE[pa.type];
    const pts = pa.points;
    if (pts.length < 4) return null;
    const isQuad = pts.length >= 6;
    const ex = pts[pts.length - 2];
    const ey = pts[pts.length - 1];
    const ang = endTangentAngle(pts);
    const isSelected = pa.id === selectedPathId;
    return (
      <Group
        key={pa.id}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          if (isSelectMode) onSelectPath(pa.id);
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          if (isSelectMode) onSelectPath(pa.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          if (isSelectMode) onSelectPath(pa.id);
        }}
      >
        {/* Invisible wide hit area for easier selection */}
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            if (isQuad) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
            else ctx.lineTo(pts[2], pts[3]);
            ctx.strokeShape(shape);
          }}
          stroke="rgba(0,0,0,0)"
          strokeWidth={20}
          hitStrokeWidth={20}
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
          <Line
            points={[
              ex - 14 * Math.cos(ang + Math.PI / 2),
              ey - 14 * Math.sin(ang + Math.PI / 2),
              ex + 14 * Math.cos(ang + Math.PI / 2),
              ey + 14 * Math.sin(ang + Math.PI / 2),
            ]}
            stroke={style.stroke}
            strokeWidth={6}
          />
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
    const isSource = draftRef.current?.fromTokenId === t.id;
    const opacity = opts?.ghost ? 0.55 : 1;
    const draggable = isSelectMode && !opts?.ghost && !t.locked;

    const groupProps = {
      key: t.id,
      x: t.x,
      y: t.y,
      opacity,
      draggable,
      onDragStart: handleTokenDragStart,
      onDragMove: handleTokenDragMove,
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleTokenDragEnd(t, e),
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
        handleTokenMouseDown(t, e),
      onTouchStart: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
        handleTokenMouseDown(t, e),
    };

    if (t.type === "BALL") {
      return (
        <Group {...groupProps}>
          <Circle
            radius={14}
            fill="#facc15"
            stroke={isSelected ? "#fff" : "#92400e"}
            strokeWidth={isSelected ? 3 : 2}
          />
          <Line points={[-10, 0, 10, 0]} stroke="#7c2d12" strokeWidth={1.5} />
          <Line points={[0, -10, 0, 10]} stroke="#7c2d12" strokeWidth={1.5} />
        </Group>
      );
    }

    if (t.type === "OFFENSE") {
      return (
        <Group {...groupProps}>
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
        <Group {...groupProps}>
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

    // CONE — triangle
    return (
      <Group {...groupProps}>
        <Line
          points={[0, -14, -12, 8, 12, 8]}
          closed
          fill="#fb923c"
          stroke={isSelected ? "#fbbf24" : "#7c2d12"}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      </Group>
    );
  }

  /* ---------- draft ghost line ---------- */
  function renderDraft() {
    const draft = draftRef.current;
    if (!draft) return null;
    const { cx, cy } = controlPointFor(draft.fromX, draft.fromY, draft.cursorX, draft.cursorY);
    const points = [draft.fromX, draft.fromY, cx, cy, draft.cursorX, draft.cursorY];
    return (
      <Shape
        listening={false}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(points[0], points[1]);
          ctx.quadraticCurveTo(points[2], points[3], points[4], points[5]);
          ctx.setLineDash([6, 4]);
          ctx.strokeShape(shape);
        }}
        stroke="rgba(251,191,36,0.7)"
        strokeWidth={2}
      />
    );
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (draftRef.current) {
            cancelDraft();
            return;
          }
          if (onCancelMode) onCancelMode();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedTokenId) onRemoveToken(selectedTokenId);
          else if (selectedPathId) onRemovePath(selectedPathId);
        }
      }}
      style={{
        width: stagePxW,
        height: stagePxH,
        position: "relative",
        cursor: isAddTokenMode
          ? "crosshair"
          : isDrawMode
            ? "copy"
            : draftRef.current
              ? "crosshair"
              : "default",
      }}
    >
      <HalfCourt width={stagePxW} height={stagePxH} className="absolute inset-0 pointer-events-none" />

      <Stage
        ref={stageRef}
        width={stagePxW}
        height={stagePxH}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
      >
        {/* Background layer — bg + paths */}
        <Layer>
          <Rect name="court-bg" x={0} y={0} width={STAGE_W} height={STAGE_H} fill="transparent" />
          {phase.paths.map(renderPath)}
          {renderDraft()}
        </Layer>
        {/* Token layer — always on top so drag/click hit areas dominate */}
        <Layer>
          {(animatedTokens ?? phase.tokens).map((t) => renderToken(t))}
        </Layer>
      </Stage>
    </div>
  );
}

export default PlayCanvas;
