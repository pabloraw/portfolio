/** Genera public/og.png (1200×630) para compartir en redes. Uso: node scripts/build-og.ts */
import sharp from 'sharp';
const dots = Array.from({ length: 420 }, (_, i) => {
  const c = i % 28, r = Math.floor(i / 28);
  const x = 700 + c * 17, y = 110 + r * 28;
  const dx = (c - 13.5) / 14, dy = (r - 6) / 8;
  const d = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy));
  return d > 0.08 ? `<circle cx="${x}" cy="${y}" r="${(d * 7).toFixed(1)}"/>` : '';
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#FF6A3D"/>
<g fill="#160F0B">${dots}</g>
<text x="64" y="250" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="104" fill="#160F0B" letter-spacing="-2">Datos limpios,</text>
<text x="64" y="350" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="104" fill="#160F0B" letter-spacing="-2">decisiones rápidas.</text>
<text x="64" y="540" font-family="monospace" font-size="30" fill="#160F0B">Pablo Reina · data engineer · pabloreina.com</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('OK: public/og.png');
