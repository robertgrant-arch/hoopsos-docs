/**
 * HalfCourt — a stylized half-court SVG background, 800x600.
 *
 * Coordinate system:
 *   y=0      — baseline / under the rim
 *   y=600    — half-court line
 *   x=0..800 — sideline to sideline
 *
 * Used as a background under the Konva editor + as a standalone read-only
 * preview thumbnail in lists.
 */

type Props = {
  width?: number;
  height?: number;
  className?: string;
  variant?: "dark" | "light";
};

export function HalfCourt({ width = 800, height = 600, className, variant = "dark" }: Props) {
  const stroke = variant === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
  const fill = variant === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
  const lineColor = variant === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)";

  return (
    <svg
      viewBox="0 0 800 600"
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Half court diagram"
    >
      {/* Court fill */}
      <rect x={0} y={0} width={800} height={600} fill={fill} />

      {/* Outer boundary */}
      <rect x={4} y={4} width={792} height={592} fill="none" stroke={stroke} strokeWidth={2} />

      {/* Half-court line (bottom edge) — half-circle inward */}
      <line x1={4} y1={596} x2={796} y2={596} stroke={lineColor} strokeWidth={2} />
      <path d={`M 320 596 A 80 80 0 0 0 480 596`} stroke={lineColor} strokeWidth={2} fill="none" />

      {/* Three-point line */}
      {/* Corner straight portions: bottom of arc at y≈110 (15ft from baseline) */}
      <line x1={70} y1={4} x2={70} y2={150} stroke={lineColor} strokeWidth={2} />
      <line x1={730} y1={4} x2={730} y2={150} stroke={lineColor} strokeWidth={2} />
      {/* Arc */}
      <path
        d="M 70 150 A 330 330 0 0 0 730 150"
        stroke={lineColor}
        strokeWidth={2}
        fill="none"
      />

      {/* Free throw lane (the "key") */}
      <rect x={310} y={4} width={180} height={190} fill="none" stroke={lineColor} strokeWidth={2} />
      {/* Free throw line + circle */}
      <line x1={310} y1={194} x2={490} y2={194} stroke={lineColor} strokeWidth={2} />
      <path d="M 310 194 A 90 90 0 0 0 490 194" stroke={lineColor} strokeWidth={2} fill="none" />
      <path
        d="M 310 194 A 90 90 0 0 1 490 194"
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray="6 6"
        fill="none"
      />

      {/* Restricted area arc */}
      <path d="M 360 60 A 40 40 0 0 0 440 60" stroke={lineColor} strokeWidth={2} fill="none" />

      {/* Backboard + rim */}
      <line x1={365} y1={36} x2={435} y2={36} stroke={lineColor} strokeWidth={3} />
      <circle cx={400} cy={56} r={10} fill="none" stroke="oklch(0.78 0.18 50)" strokeWidth={2} />

      {/* Center half-circle indicator */}
      <circle cx={400} cy={596} r={8} fill={lineColor} opacity={0.45} />
    </svg>
  );
}

export default HalfCourt;
