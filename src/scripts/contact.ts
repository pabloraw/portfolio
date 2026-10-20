import { copyText } from './toast';
import { pageData } from './page-data';
import type { StackChange } from './picker';

const form = document.getElementById('cf') as HTMLFormElement | null;

if (form) {
  const { locale, ui, contactEmail } = pageData();
  const c = ui.contact;
  const email = form.querySelector<HTMLInputElement>('#cemail')!;
  const msg = form.querySelector<HTMLTextAreaElement>('#cmsg')!;
  const consent = form.querySelector<HTMLInputElement>('#cconsent')!;
  const honeypot = form.querySelector<HTMLInputElement>('#cweb')!;
  const send = form.querySelector<HTMLButtonElement>('#csend')!;
  const status = document.getElementById('cfs')!;

  let dirty = false;
  let stack: string[] = [];
  let questions: string[] = [];
  msg.addEventListener('input', () => { dirty = true; });

  // Mensaje prerrellenado con lo marcado en el selector, mientras no lo edite el visitante.
  document.addEventListener('stack:change', (e) => {
    const d = (e as CustomEvent<StackChange>).detail;
    stack = d.stack;
    questions = d.questions;
    if (!dirty) msg.value = d.message;
  });

  document.getElementById('copymail')?.addEventListener('click', () => copyText(contactEmail, c.copied));

  const fail = (el: HTMLElement, text: string) => {
    el.setAttribute('aria-invalid', 'true');
    status.textContent = text;
    el.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    [email, msg, consent].forEach((el) => el.removeAttribute('aria-invalid'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return fail(email, c.errEmail);
    if (msg.value.trim().length < 2) return fail(msg, c.errMsg);
    if (!consent.checked) return fail(consent, c.errConsent);

    send.disabled = true;
    status.textContent = c.sending;
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(), message: msg.value.trim(), consent: true,
          stack, questions, locale, website: honeypot.value,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      status.textContent = c.ok;
      form.reset();
      dirty = false;
    } catch {
      status.textContent = c.errServer.replace('{email}', contactEmail);
    } finally {
      send.disabled = false;
    }
  });
}
