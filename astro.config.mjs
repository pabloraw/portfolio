// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pabloreina.com',
  trailingSlash: 'never',
  adapter: vercel(),
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en' } },
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: { build: { chunkSizeWarningLimit: 700 } }, // three.js va en un chunk diferido (~130 KB gzip)
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_NOTIFY_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_NOTIFY_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
