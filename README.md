# pabloreina.com

Web personal de Pablo Reina, data engineer. Astro + Three.js + GSAP, desplegada en Vercel.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:4321  (inglés en /en)
npm run build      # astro check + build
```

Requiere Node 22.22 o superior.

## Retrato 3D

1. Pon una foto de busto en `assets/portrait/` (jpg, png, webp o avif). Funciona mucho mejor con el fondo quitado y la cara bien iluminada.
2. `npm run portrait` genera `public/portrait/points.bin`.
3. La foto original no se sube al repositorio; solo el binario de puntos.

En `npm run dev` aparece abajo a la izquierda un botón para probar fotos al vuelo sin regenerar nada.

## Formulario de contacto

1. Crea la tabla aplicando `supabase/migrations/20261020120000_create_leads.sql` en tu proyecto de Supabase.
2. Copia `.env.example` a `.env` y rellena `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Opcional: `RESEND_API_KEY`, `LEAD_NOTIFY_TO` y `LEAD_NOTIFY_FROM` para recibir un email por cada contacto.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (el preset de Astro se detecta solo).
2. Añade las variables de entorno del paso anterior.
3. Apunta `pabloreina.com` al proyecto desde Settings → Domains.

Las reglas de diseño y de código están en `CLAUDE.md`.
