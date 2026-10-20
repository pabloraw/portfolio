# pabloreina.com

Web personal de Pablo Reina, data engineer (freelance y en plantilla). Su único trabajo es que una empresa piense: "este tío nos soluciona el problema y no se nos puede escapar", y que escriba.

Referencia visual aprobada: `docs/prototype.html` (prototipo V6). Ábrelo en el navegador antes de cambiar nada visual.

## Stack

- Astro 7 + TypeScript (`strictest`). Salida estática; solo `src/pages/api/lead.ts` se ejecuta en servidor.
- Vercel (`@astrojs/vercel`). Variables en `.env.example`, leídas con `astro:env`.
- Three.js (escena 3D, cargada en diferido), GSAP + ScrollTrigger (scroll anclado), Lenis (scroll suave).
- Fuentes autoalojadas con Fontsource: Archivo Variable (eje de anchura) y JetBrains Mono. No usar Google Fonts por CDN (RGPD).
- Supabase para los leads (`supabase/migrations`). Resend opcional para el aviso por email.

## Comandos

- `npm run dev`: servidor local en http://localhost:4321
- `npm run build`: `astro check` + build. Tiene que pasar sin errores ni avisos antes de cada commit.
- `npm run portrait`: genera `public/portrait/points.bin` a partir de la foto en `assets/portrait/` (la foto original no se sube al repo).
- `node scripts/build-og.ts`: regenera `public/og.png`.

## Estructura

- `src/components/Landing.astro` compone la home. Secciones en orden: `Story` (historia 3D anclada) → `Play` (juego + selector de stack + preguntas) → `HowIWork` (carril horizontal) → `Marquee` → `Contact`.
- `src/i18n/ui.ts`: todos los textos en es y en. No hay texto visible fuera de este archivo, `src/data/*` y las páginas legales.
- `src/data/sources.ts`: las 20 herramientas. `src/data/questions.ts`: banco de 25 preguntas y qué herramientas necesita cada una.
- `src/scripts/*`: JS de cliente. `scroll.ts` es el único sitio que crea Lenis y registra ScrollTrigger.
- `src/lib/portrait-core.ts`: algoritmo del retrato, compartido entre el build y el navegador.
- Comunicación entre módulos por eventos (`stack:change`), no por variables globales.

## Diseño: reglas que no se rompen

- Mundo visual póster: naranja `#FF6A3D`, tinta `#160F0B`, crema `#FFF3E6`. Un único aspecto, sin modo oscuro. Colores siempre como variables de `src/styles/global.css`.
- Titulares en Archivo muy condensada (`font-stretch: 62%`, peso 900). Datos y etiquetas en JetBrains Mono.
- Bordes de 2 px en tinta y esquinas rectas. Sin radios ni sombras difusas; la única sombra es la dura de 4 px de las fuentes del juego.
- Prohibido: pills o etiquetas encima de los titulares, filetes de color en el borde de las tarjetas, gradientes decorativos y emojis.
- Sin datos inventados presentados como reales. Las preguntas no llevan cifras; los ejemplos se marcan como ejemplo.
- Los títulos en español van con mayúscula solo al inicio ("Cómo trabajo contigo", nunca "Cómo Trabajo Contigo").
- La numeración (01, 02…) solo cuando el contenido es una secuencia real (capítulos de la historia, pasos de trabajo).

## Textos

- Español de España, tuteo, directo. Frases cortas. Nombrar el problema del cliente, no el currículum.
- Nada de "soluciones data-driven end-to-end", "apasionado de los datos" y similares.
- Cada texto nuevo va en `ui.ts` en los dos idiomas. El español es el idioma por defecto (`/`); el inglés vive en `/en`.

## Movimiento y accesibilidad

- Un momento orquestado: la historia 3D. El resto, transiciones cortas (140–420 ms) con `--ease-out` o `--ease-flow`.
- Con `prefers-reduced-motion`: sin Lenis, sin animaciones de tiempo, el carril horizontal pasa a lista y el juego se convierte en una rejilla para pulsar.
- Todo el texto de la historia es HTML real (SEO y lectores de pantalla). El canvas es decorativo (`aria-hidden`).
- Foco visible en todo lo interactivo; las fuentes del juego son `button`.

## Rendimiento

- Objetivo: Lighthouse móvil ≥ 90 en rendimiento y 100 en accesibilidad.
- Three.js solo se carga si hay WebGL, en `requestIdleCallback`. No añadir librerías al bundle inicial sin motivo.
- Móvil: 4.200 partículas; escritorio: 8.000. Revisar en un móvil real tras tocar la escena.

## Formulario y datos personales

- `POST /api/lead` valida email, mensaje, consentimiento y honeypot, y guarda solo herramientas y preguntas conocidas.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo existe en el servidor. RLS activado sin políticas.
- Cambios en los datos recogidos obligan a actualizar `/privacidad` y `/en/privacy`.

## Pendiente

- [ ] Foto real → `assets/portrait/` → `npm run portrait` (mejor con el fondo quitado).
- [ ] Email real en `CONTACT_EMAIL` (`src/i18n/ui.ts`).
- [ ] Datos de las páginas legales (marcados con `[completar]`) y revisión profesional.
- [ ] Casos reales con métricas (sección nueva entre `Play` y `HowIWork`).
- [ ] Antispam más fuerte (Cloudflare Turnstile) y límite de envíos por IP en `/api/lead`.
- [ ] Analítica sin cookies (Plausible o Umami) con eventos: juego completado, stack marcado, formulario enviado.
