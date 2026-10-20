/**
 * Genera public/portrait/points.bin a partir de la foto en assets/portrait/.
 * Uso: npm run portrait   (requiere Node >= 22.18 por el soporte nativo de TypeScript)
 * La foto original no se publica: está en .gitignore y solo sale el binario de puntos.
 * Consejo: quita el fondo antes (rembg, remove.bg) y usa un busto bien iluminado.
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PORTRAIT_COLS, PORTRAIT_ROWS, PORTRAIT_POINTS, coverCrop, pointsFromLuminance,
} from '../src/lib/portrait-core.ts';

const dir = 'assets/portrait';
const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
if (!files.length) {
  console.error(`No hay ninguna foto en ${dir}/. Añade una (jpg, png, webp o avif).`);
  process.exit(1);
}
const file = join(dir, files[0]!);
const img = sharp(file).rotate().flatten({ background: '#ffffff' });
const meta = await img.metadata();
const crop = coverCrop(meta.width ?? 1, meta.height ?? 1, PORTRAIT_COLS, PORTRAIT_ROWS);
const { data } = await img
  .extract({ left: Math.round(crop.sx), top: Math.round(crop.sy), width: Math.round(crop.sw), height: Math.round(crop.sh) })
  .resize(PORTRAIT_COLS, PORTRAIT_ROWS, { fit: 'fill' })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const lum = new Float32Array(PORTRAIT_COLS * PORTRAIT_ROWS);
for (let i = 0; i < lum.length; i++) lum[i] = (data[i] ?? 0) / 255;

// Semilla fija: el mismo retrato genera siempre los mismos puntos (builds reproducibles).
let seed = 20261020;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const points = pointsFromLuminance(lum, PORTRAIT_COLS, PORTRAIT_ROWS, PORTRAIT_POINTS, rand);
// Baraja para que cualquier prefijo (móvil usa menos puntos) cubra todo el retrato.
for (let i = PORTRAIT_POINTS - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  for (let a = 0; a < 3; a++) {
    const t = points[i * 3 + a]!; points[i * 3 + a] = points[j * 3 + a]!; points[j * 3 + a] = t;
  }
}
await mkdir('public/portrait', { recursive: true });
await writeFile('public/portrait/points.bin', Buffer.from(points.buffer));
console.log(`OK: ${file} → public/portrait/points.bin (${PORTRAIT_POINTS} puntos, ${(points.byteLength / 1024).toFixed(0)} KB)`);
