import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, Group, PerspectiveCamera, Points,
  PointsMaterial, Scene, Sprite, SpriteMaterial, Vector3, WebGLRenderer,
} from 'three';
import { SOURCES } from '../data/sources';
import {
  PORTRAIT_COLS, PORTRAIT_POINTS, PORTRAIT_ROWS, coverCrop, pointsFromLuminance,
} from '../lib/portrait-core';
import { reduceMotion } from './scroll';
import { CREAM, INK, STEP_BG, STEP_PARTICLE } from './theme';
import { toast } from './toast';
import { pageData } from './page-data';

/**
 * Escena de la historia: una sola nube de partículas que se transforma con el scroll.
 * Formaciones: 0 retrato · 1 caos · 2 tornado de ingesta · 3 tabla · 4 gráfico · 5 retrato.
 */
export function startScene(canvas: HTMLCanvasElement, state: { prog: number }): void {
  const stage = canvas.parentElement as HTMLElement;
  const mobile = window.innerWidth < 900;
  const N = mobile ? 4200 : PORTRAIT_POINTS;
  const R = Math.random;
  const ss = (x: number) => x * x * (3 - 2 * x);
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 0, 19);
  const group = new Group();
  scene.add(group);

  // Partícula circular
  const dot = document.createElement('canvas');
  dot.width = dot.height = 64;
  const dg = dot.getContext('2d')!;
  dg.beginPath(); dg.arc(32, 32, 28, 0, Math.PI * 2); dg.fillStyle = '#fff'; dg.fill();

  const pos = new Float32Array(N * 3);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  const mat = new PointsMaterial({
    size: mobile ? 0.11 : 0.085, map: new CanvasTexture(dot), transparent: true,
    alphaTest: 0.4, sizeAttenuation: true, color: new Color(STEP_PARTICLE[0]),
  });
  group.add(new Points(geo, mat));

  // Formaciones fijas
  const portrait = new Float32Array(N * 3);
  const chaos = new Float32Array(N * 3);
  const table = new Float32Array(N * 3);
  const chart = new Float32Array(N * 3);
  const delay = new Float32Array(N);
  const phase = new Float32Array(N);
  const lane = new Float32Array(N);
  for (let i = 0; i < N; i++) { delay[i] = R() * 0.35; phase[i] = R() * Math.PI * 2; lane[i] = R(); }

  for (let i = 0; i < N; i++) {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.cbrt(R()), s = Math.sqrt(1 - u * u);
    chaos[i * 3] = s * Math.cos(a) * 9 * r + (R() - 0.5) * 2;
    chaos[i * 3 + 1] = u * 6 * r;
    chaos[i * 3 + 2] = s * Math.sin(a) * 6 * r;
  }
  {
    const C = 10, RW = 22, cw = 0.72, ch = 0.3, gx = 0.08, gy = 0.1;
    const W = C * (cw + gx), H = RW * (ch + gy);
    const cx = Math.cos(-0.75), sx = Math.sin(-0.75), cy = Math.cos(0.35), sy = Math.sin(0.35);
    for (let i = 0; i < N; i++) {
      const cell = i % (C * RW), c = cell % C, r = Math.floor(cell / C);
      const fill = c === 0 ? 1 : 0.35 + ((c * 7 + r * 13) % 10) / 14;
      const x = -W / 2 + c * (cw + gx) + R() * cw * fill;
      const y = H / 2 - r * (ch + gy) - R() * ch;
      const z = (R() - 0.5) * 0.08;
      const y2 = y * cx - z * sx, z2 = y * sx + z * cx;
      table[i * 3] = x * cy + z2 * sy;
      table[i * 3 + 1] = y2 + 0.4;
      table[i * 3 + 2] = -x * sy + z2 * cy;
    }
  }
  {
    const heights = [1.6, 2.1, 2.0, 2.9, 3.6, 4.4, 5.7, 7.4], B = heights.length, bw = 0.78, gap = 0.32;
    const W = B * (bw + gap);
    for (let i = 0; i < N; i++) {
      const b = i % B;
      chart[i * 3] = -W / 2 + b * (bw + gap) + R() * bw;
      chart[i * 3 + 1] = -4.2 + R() * heights[b]!;
      chart[i * 3 + 2] = (R() - 0.5) * bw;
    }
  }

  const setPortrait = (pts: Float32Array) => {
    const n = Math.floor(pts.length / 3);
    for (let i = 0; i < N; i++) {
      const j = i % n;
      portrait[i * 3] = pts[j * 3]!; portrait[i * 3 + 1] = pts[j * 3 + 1]!; portrait[i * 3 + 2] = pts[j * 3 + 2]!;
    }
  };
  setPortrait(pointsFromImage(silhouette(), N));
  pos.set(portrait);
  fetch('/portrait/points.bin')
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((buf) => setPortrait(new Float32Array(buf)))
    .catch(() => { /* sin retrato generado: se queda la silueta */ });

  // Subida de foto, solo en desarrollo
  const input = document.getElementById('photo') as HTMLInputElement | null;
  input?.addEventListener('change', () => {
    const f = input.files?.[0];
    if (!f || !f.type.startsWith('image/')) { toast(pageData().ui.notImage); return; }
    const img = new Image();
    img.onload = () => { setPortrait(pointsFromImage(img, N)); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
  });

  // Etiquetas de herramientas
  const labelCanvas = (name: string) => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 112;
    const g = c.getContext('2d')!;
    g.font = "800 56px 'Archivo Variable', 'Arial Narrow', sans-serif";
    if ('fontStretch' in g) (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = 'extra-condensed';
    const w = Math.min(500, g.measureText(name).width + 56);
    g.fillStyle = INK; g.fillRect(6, 10, w, 92);
    g.fillStyle = CREAM; g.fillRect(0, 4, w, 92);
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(3, 7, w - 6, 86);
    g.fillStyle = INK; g.fillText(name, 28, 70);
    return c;
  };
  const labels = SOURCES.map((s, k) => {
    const tex = new CanvasTexture(labelCanvas(s.name));
    tex.anisotropy = 4;
    const sp = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.center.set(0, 0.5);
    group.add(sp);
    const sc = mobile ? 1.9 : 2.3;
    return {
      sp, tex, name: s.name, sx: sc, sy: (sc * 112) / 512, a: (k / SOURCES.length) * Math.PI * 2,
      yy: (R() - 0.5) * 8.5, rr: 4.2 + R() * 1.1, lane: 0.38 + (k % 5) * 0.06,
      chaos: new Vector3((R() - 0.5) * 16, (R() - 0.5) * 9, (R() - 0.5) * 6),
    };
  });
  document.fonts?.ready.then(() => labels.forEach((l) => {
    l.tex.image = labelCanvas(l.name);
    l.tex.needsUpdate = true;
  }));

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const m = w < 900;
    group.position.set(m ? 0 : 5, m ? 2.2 : 0, 0);
    group.scale.setScalar(m ? 0.62 : 1);
  };
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver((e) => { visible = !!e[0]?.isIntersecting; }).observe(stage);

  const formation = (f: number, i: number, t: number, out: [number, number, number]) => {
    if (f === 2) {
      const s = (lane[i]! + t * 0.06) % 1, a = s * 40 + phase[i]!, rad = 0.4 + (1 - s) * (1 - s) * 5.2;
      out[0] = -13 + s * 19; out[1] = Math.cos(a) * rad; out[2] = Math.sin(a) * rad;
      return out;
    }
    const src = f === 0 || f === 5 ? portrait : f === 1 ? chaos : f === 3 ? table : chart;
    out[0] = src[i * 3]!; out[1] = src[i * 3 + 1]!; out[2] = src[i * 3 + 2]!;
    return out;
  };
  const A: [number, number, number] = [0, 0, 0];
  const B: [number, number, number] = [0, 0, 0];
  const cA = new Color(), cB = new Color(), bg = new Color(), tmp = new Vector3(), ring = new Vector3(), funnel = new Vector3();

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = reduceMotion ? 0 : now / 1000;
    const prog = state.prog;
    const seg = Math.min(4, Math.floor(prog)), loc = prog - seg;

    for (let i = 0; i < N; i++) {
      const k = ss(clamp01((loc - delay[i]!) / 0.65));
      formation(seg, i, t, A); formation(seg + 1, i, t, B);
      const w = reduceMotion ? 0 : Math.sin(t * 1.3 + phase[i]!) * 0.035;
      pos[i * 3] = A[0] + (B[0] - A[0]) * k + w;
      pos[i * 3 + 1] = A[1] + (B[1] - A[1]) * k + w;
      pos[i * 3 + 2] = A[2] + (B[2] - A[2]) * k;
    }
    geo.attributes.position!.needsUpdate = true;

    const ci = Math.min(4, Math.floor(prog)), cf = ss(clamp01((prog - ci - 0.25) / 0.5));
    mat.color.copy(cA.set(STEP_PARTICLE[ci]!)).lerp(cB.set(STEP_PARTICLE[ci + 1]!), cf);
    bg.set(STEP_BG[ci]!).lerp(cB.set(STEP_BG[ci + 1]!), cf);
    renderer.setClearColor(bg, 1);

    for (const l of labels) {
      const ang = l.a + t * 0.12;
      ring.set(Math.cos(ang) * l.rr, l.yy, Math.sin(ang) * l.rr);
      let sc = 1;
      if (prog < 1) tmp.copy(ring).lerp(l.chaos, ss(clamp01(prog)));
      else {
        // Las etiquetas entran en el tornado (a la derecha del texto) y se encogen hasta desaparecer en el sumidero.
        const s = l.lane + clamp01(prog - 1.4) * (1 - l.lane);
        const a = s * 40 + l.a, rad = 0.4 + (1 - s) * (1 - s) * 5.2;
        funnel.set(-13 + s * 19, Math.cos(a) * rad, Math.sin(a) * rad);
        tmp.copy(l.chaos).lerp(funnel, ss(clamp01(prog - 1)));
        sc = 1 - ss(clamp01((prog - 1.5) / 0.9));
      }
      l.sp.position.copy(tmp);
      l.sp.scale.set(l.sx * sc, l.sy * sc, 1);
      l.sp.visible = sc > 0.01;
    }

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const sway = prog < 0.6 || prog > 4.4 ? Math.sin(t * 0.4) * 0.18 : 0;
    group.rotation.y = mouse.x * 0.5 + sway + (prog > 2.5 && prog < 3.6 ? Math.sin(t * 0.25) * 0.12 : 0);
    group.rotation.x = mouse.y * 0.25;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}

function pointsFromImage(src: CanvasImageSource & { width: number; height: number }, n: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = PORTRAIT_COLS; c.height = PORTRAIT_ROWS;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  const crop = coverCrop(src.width, src.height, PORTRAIT_COLS, PORTRAIT_ROWS);
  g.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, PORTRAIT_COLS, PORTRAIT_ROWS);
  const d = g.getImageData(0, 0, PORTRAIT_COLS, PORTRAIT_ROWS).data;
  const lum = new Float32Array(PORTRAIT_COLS * PORTRAIT_ROWS);
  for (let i = 0; i < lum.length; i++) lum[i] = (0.2126 * d[i * 4]! + 0.7152 * d[i * 4 + 1]! + 0.0722 * d[i * 4 + 2]!) / 255;
  return pointsFromLuminance(lum, PORTRAIT_COLS, PORTRAIT_ROWS, n);
}

/** Silueta de busto provisional mientras no haya retrato generado. */
function silhouette(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 400; c.height = 500;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ececec'; g.fillRect(0, 0, 400, 500);
  let gr = g.createRadialGradient(130, 360, 10, 200, 520, 280);
  gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(1, '#141414');
  g.fillStyle = gr; g.beginPath(); g.ellipse(200, 545, 205, 175, 0, 0, Math.PI * 2); g.fill();
  gr = g.createLinearGradient(160, 0, 240, 0);
  gr.addColorStop(0, '#555'); gr.addColorStop(1, '#1d1d1d');
  g.fillStyle = gr; g.fillRect(162, 270, 76, 120);
  gr = g.createRadialGradient(160, 165, 8, 195, 205, 135);
  gr.addColorStop(0, '#a8a8a8'); gr.addColorStop(0.55, '#4a4a4a'); gr.addColorStop(1, '#161616');
  g.fillStyle = gr; g.beginPath(); g.ellipse(200, 200, 86, 110, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#121212';
  g.beginPath(); g.ellipse(202, 138, 96, 64, 0, Math.PI, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(202, 140, 96, 30, 0, 0, Math.PI); g.fill();
  return c;
}
