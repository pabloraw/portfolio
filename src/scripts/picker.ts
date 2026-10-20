import { CATEGORY_LABEL, SOURCES } from '../data/sources';
import { QUESTIONS, type Question } from '../data/questions';
import { joinList, pageData } from './page-data';

/**
 * Selector de stack + banco de preguntas.
 * Muestra hasta 6 preguntas a tu alcance (naranja) mezcladas con 3 que aún no aplican (crema),
 * priorizando las que solo necesitan una herramienta más.
 * Emite `stack:change` para que el formulario de contacto se rellene.
 */
export interface StackChange { stack: string[]; questions: string[]; message: string }

const chipsEl = document.getElementById('chips');
const insEl = document.getElementById('insights');

if (chipsEl && insEl) {
  const { locale, ui } = pageData();
  const p = ui.picker;
  const and = (xs: string[]) => joinList(xs, p.and);
  const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

  const selected = new Set<string>();
  let expanded = false;
  let shown = new Set<string>();

  for (const s of SOURCES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="tick" aria-hidden="true"></span>${s.name}<small>${CATEGORY_LABEL[locale][s.category]}</small>`;
    b.addEventListener('click', () => {
      const on = !selected.has(s.name);
      if (on) selected.add(s.name); else selected.delete(s.name);
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.tick')!.textContent = on ? '✓' : '';
      render();
    });
    chipsEl.appendChild(b);
  }

  interface Eval { q: Question; groups: { label: string; hit: string[] }[]; missing: number }
  const evaluate = (q: Question): Eval => {
    const groups = q.need.map((n) => ({ label: n.label[locale], hit: n.any.filter((x) => selected.has(x)) }));
    return { q, groups, missing: groups.filter((g) => !g.hit.length).length };
  };
  const hits = (e: Eval) => e.groups.filter((g) => g.hit.length).length;

  function card(e: Eval, kind: 'on' | 'near' | 'lock', fresh = false): string {
    const q = esc(e.q.q[locale]);
    if (kind === 'on') {
      const tag = e.groups.length > 1 ? p.tagCross : p.tagSingle;
      return `<article class="ins on${fresh ? ' fresh' : ''}"><span class="tag">${tag}</span><span class="q">${q}</span><span class="via">${p.via} ${esc(and(e.groups.map((g) => g.hit[0]!)))}</span></article>`;
    }
    const first = e.groups.find((g) => !g.hit.length);
    const tag = kind === 'near' && first ? `${p.tagMissing} ${esc(first.label)}` : p.tagNeeds;
    const req = e.groups.map((g) => `<span class="${g.hit.length ? 'ok' : ''}">${g.hit.length ? `✓ ${esc(g.hit[0]!)}` : esc(g.label)}</span>`).join('');
    return `<article class="ins"><span class="tag">${tag}</span><span class="q">${q}</span><div class="req">${req}</div></article>`;
  }

  function render() {
    const all = QUESTIONS.map(evaluate);
    const total = QUESTIONS.length;
    const on = all.filter((e) => !e.missing).sort((a, b) => b.groups.length - a.groups.length);
    let html = '';

    if (!selected.size) {
      html = `<div class="ins-grid">${all.filter((e) => e.groups.length > 1).slice(0, 6).map((e) => card(e, 'lock')).join('')}</div>`;
    } else {
      const near = all.filter((e) => e.missing === 1 && e.groups.length > 1 && hits(e) > 0)
        .sort((a, b) => b.groups.length - a.groups.length);
      const rest = all.filter((e) => e.missing && !near.includes(e))
        .sort((a, b) => hits(b) - hits(a) || b.groups.length - a.groups.length);
      const locks: [Eval, 'near' | 'lock'][] = [...near.map((e) => [e, 'near'] as [Eval, 'near']), ...rest.map((e) => [e, 'lock'] as [Eval, 'lock'])].slice(0, 3);
      const onVis = expanded ? on : on.slice(0, 6);
      // Las bloqueadas van en posiciones salteadas para que la rejilla no quede toda naranja.
      const lockSlots = new Set([1, 5, 6]);
      const cards: string[] = [];
      let oi = 0, li = 0;
      for (let pos = 0; pos < onVis.length + locks.length; pos++) {
        const wantLock = lockSlots.has(pos) || oi >= onVis.length;
        if (wantLock && li < locks.length) { const [e, k] = locks[li++]!; cards.push(card(e, k)); }
        else if (oi < onVis.length) { const e = onVis[oi++]!; cards.push(card(e, 'on', !shown.has(e.q.id))); }
      }
      if (!on.length) html += `<p class="ins-empty">${p.empty}</p>`;
      html += `<div class="ins-grid">${cards.join('')}</div>`;
      if (on.length > 6) html += `<button type="button" class="more" data-more>${expanded ? p.less : fill(p.more, { n: on.length - 6 })}</button>`;
      shown = new Set(on.map((e) => e.q.id));
    }
    insEl!.innerHTML = html;
    insEl!.querySelector('[data-more]')?.addEventListener('click', () => { expanded = !expanded; render(); });

    document.getElementById('inscount')!.textContent = selected.size
      ? fill(p.count, { on: on.length, rest: total - on.length })
      : fill(p.countNone, { total });

    const list = [...selected];
    const st = document.getElementById('stacktxt')!;
    const cta = document.getElementById('stackcta')!;
    if (!list.length) { st.innerHTML = p.stackNone; cta.setAttribute('aria-disabled', 'true'); }
    else { st.innerHTML = fill(p.stack, { list: esc(and(list)), on: on.length, total }); cta.setAttribute('aria-disabled', 'false'); }

    const wants = on.slice(0, 3).map((e) => e.q.want[locale]);
    const message = list.length
      ? fill(p.msgIntro, { list: and(list) }) + (wants.length ? fill(p.msgWant, { list: and(wants) }) : '') + p.msgEnd
      : '';
    const detail: StackChange = { stack: list, questions: on.map((e) => e.q.id), message };
    document.dispatchEvent(new CustomEvent<StackChange>('stack:change', { detail }));
  }

  render();
}
