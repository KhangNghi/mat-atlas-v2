export type Cam = { x: number; y: number; k: number };

const MIN_K = 0.35;
const MAX_K = 2.6;

export function clampK(k: number) {
  return Math.min(MAX_K, Math.max(MIN_K, k));
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function zoomAround(
  cam: Cam,
  factor: number,
  px: number,
  py: number,
  originX: number,
  originY: number,
): Cam {
  const nextK = clampK(cam.k * factor);
  const wx = (px - originX - cam.x) / cam.k;
  const wy = (py - originY - cam.y) / cam.k;
  return {
    k: nextK,
    x: px - originX - wx * nextK,
    y: py - originY - wy * nextK,
  };
}

export function lerpCam(a: Cam, b: Cam, t: number): Cam {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    k: a.k + (b.k - a.k) * t,
  };
}
