/**
 * geometry.js
 * Analytical geometry helpers used by the raycasting / collision systems.
 */

/** Returns the intersection point of segment AB with segment CD (or null). */
export const getIntersection = (A, B, C, D) => {
  const tTop    = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop    = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom  = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x:      A.x + (B.x - A.x) * t,
        y:      A.y + (B.y - A.y) * t,
        offset: t,
      };
    }
  }
  return null;
};

/** Closest distance from point p to line segment (a→b). */
export const getDistanceToSegment = (p, a, b) => {
  const l2 = Math.hypot(b.x - a.x, b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(
    p.x - (a.x + t * (b.x - a.x)),
    p.y - (a.y + t * (b.y - a.y))
  );
};
