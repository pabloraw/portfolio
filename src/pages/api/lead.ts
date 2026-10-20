import type { APIRoute } from 'astro';
import {
  LEAD_NOTIFY_FROM, LEAD_NOTIFY_TO, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL,
} from 'astro:env/server';
import { SOURCES } from '../../data/sources';
import { QUESTIONS } from '../../data/questions';

export const prerender = false;

const SOURCE_NAMES = new Set(SOURCES.map((s) => s.name));
const QUESTION_IDS = new Set(QUESTIONS.map((q) => q.id));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

interface LeadInput {
  email?: unknown; message?: unknown; consent?: unknown; stack?: unknown;
  questions?: unknown; locale?: unknown; website?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return json(415, { error: 'unsupported_media_type' });
  let body: LeadInput;
  try { body = (await request.json()) as LeadInput; } catch { return json(400, { error: 'invalid_json' }); }

  // Honeypot: los bots rellenan el campo oculto. Respondemos 200 para no darles pistas.
  if (typeof body.website === 'string' && body.website.length > 0) return json(200, { ok: true });

  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
  if (!EMAIL_RE.test(email)) return json(422, { error: 'invalid_email' });
  if (message.length < 2) return json(422, { error: 'invalid_message' });
  if (body.consent !== true) return json(422, { error: 'consent_required' });

  // Solo se guardan valores conocidos: nada de texto libre en estos campos.
  const stack = Array.isArray(body.stack) ? body.stack.filter((s): s is string => typeof s === 'string' && SOURCE_NAMES.has(s)) : [];
  const questions = Array.isArray(body.questions) ? body.questions.filter((q): q is string => typeof q === 'string' && QUESTION_IDS.has(q)) : [];
  const locale = body.locale === 'en' ? 'en' : 'es';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[lead] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return json(503, { error: 'not_configured' });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      email, message, stack, questions, locale, consent: true,
      user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    }),
  });
  if (!res.ok) {
    console.error('[lead] Supabase', res.status, await res.text().catch(() => ''));
    return json(502, { error: 'storage_failed' });
  }

  // Aviso opcional por email. Si falla, el lead ya está guardado.
  if (RESEND_API_KEY && LEAD_NOTIFY_TO && LEAD_NOTIFY_FROM) {
    const text = [`Email: ${email}`, `Idioma: ${locale}`, `Stack: ${stack.join(', ') || '—'}`,
      `Preguntas: ${questions.join(', ') || '—'}`, '', message].join('\n');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: LEAD_NOTIFY_FROM, to: LEAD_NOTIFY_TO, reply_to: email, subject: `Nuevo contacto: ${email}`, text }),
    }).catch((e: unknown) => console.error('[lead] Resend', e));
  }

  return json(200, { ok: true });
};
