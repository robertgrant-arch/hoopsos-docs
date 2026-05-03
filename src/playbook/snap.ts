import { Vec2 } from "./types";

const KEY_SPOTS: Vec2[] = [
  { x: 0.50, y: 0.95 },
  { x: 0.31, y: 0.80 },
  { x: 0.69, y: 0.80 },
  { x: 0.19, y: 0.92 },
  { x: 0.81, y: 0.92 },
  { x: 0.05, y: 0.95 },
  { x: 0.95, y: 0.95 },
  { x: 0.05, y: 0.65 },
  { x: 0.95, y: 0.65 },
  { x: 0.30, y: 0.55 },
  { x: 0.70, y: 0.55 },
  { x: 0.50, y: 0.50 },
  { x: 0.02, y: 0.98 },
  { x: 0.98, y: 0.98 },
];

export function snapToCourt(p: Vec2, others: Vec2[] = [], radius = 0.03): Vec2 {
  let best = p;
  let bestD = radius;
  for (const c of [...KEY_SPOTS, ...others]) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}
