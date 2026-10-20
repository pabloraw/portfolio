/**
 * Convierte una imagen (como luminancias 0..1) en una nube de N puntos 3D.
 * Se usa en el build (scripts/build-portrait.ts, con sharp) y en desarrollo (subida de foto).
 * Densidad de puntos ∝ oscuridad; profundidad z ∝ luz (lo iluminado sale hacia delante).
 */
export const PORTRAIT_COLS = 120;
export const PORTRAIT_ROWS = 150;
export const PORTRAIT_POINTS = 8000;
export const PORTRAIT_HEIGHT = 10.5; // unidades de la escena

export function pointsFromLuminance(
  lum: Float32Array,
  cols: number,
  rows: number,
  n: number,
  rand: () => number = Math.random,
): Float32Array {
  const total = cols * rows;
  const sorted = Array.from(lum).sort((a, b) => a - b);
  const lo = sorted[Math.floor(total * 0.02)] ?? 0;
  const hi = sorted[Math.floor(total * 0.98)] ?? 1;
  const light = new Float32Array(total);
  const weight = new Float32Array(total);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      const l = Math.min(1, Math.max(0, ((lum[k] ?? 0) - lo) / Math.max(0.001, hi - lo)));
      // Viñeta: funde los bordes para que el fondo no genere puntos.
      const dx = c / cols - 0.5;
      const dy = (r / rows - 0.45) * 1.1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let v = 1 - Math.min(1, Math.max(0, (dist - 0.33) / 0.28));
      v = v * v * (3 - 2 * v);
      weight[k] = Math.pow(1 - l, 1.25) * v;
      light[k] = l;
    }
  }
  const h = PORTRAIT_HEIGHT;
  const w = h * (cols / rows);
  const out = new Float32Array(n * 3);
  let i = 0;
  let guard = 0;
  while (i < n && guard < n * 400) {
    guard++;
    const c = Math.floor(rand() * cols);
    const r = Math.floor(rand() * rows);
    const k = r * cols + c;
    if (rand() > (weight[k] ?? 0) * 1.05) continue;
    out[i * 3] = (c / cols - 0.5 + (rand() - 0.5) / cols) * w;
    out[i * 3 + 1] = (0.5 - r / rows + (rand() - 0.5) / rows) * h;
    out[i * 3 + 2] = ((light[k] ?? 0) - 0.5) * 2.6 + (rand() - 0.5) * 0.25;
    i++;
  }
  for (; i < n; i++) {
    out[i * 3] = (rand() - 0.5) * w;
    out[i * 3 + 1] = (rand() - 0.5) * h;
    out[i * 3 + 2] = 0;
  }
  return out;
}

/** Recorte tipo "cover" con el sujeto algo por encima del centro (encuadre de retrato). */
export function coverCrop(sw: number, sh: number, cols: number, rows: number) {
  const ar = cols / rows;
  let cw = sw;
  let ch = sw / ar;
  if (ch > sh) { ch = sh; cw = sh * ar; }
  return { sx: (sw - cw) / 2, sy: (sh - ch) * 0.25, sw: cw, sh: ch };
}
