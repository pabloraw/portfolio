import { CATEGORY_COLOR, CATEGORY_LABEL, DEMO_SOURCES, SOURCES } from '../data/sources';
import { reduceMotion } from './scroll';
import { pageData } from './page-data';

/**
 * Juego de ingesta: las fuentes caen y se ingestan al pasar el ratón cerca (o al tocarlas).
 * Solo ilustra la ingesta. No deduce nada del visitante: el stack se marca aparte (picker.ts).
 */
const field = document.getElementById('field');
const tbody = document.getElementById('tbody');
const empty = document.getElementById('empty');

if (field && tbody && empty) {
  const { locale, ui } = pageData();
  const g = ui.game;
  const nf = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-GB');
  const $ = (id: string) => document.getElementById(id)!;
  const hint = document.createElement('span');
  hint.className = 'autohint';

  interface Drop { i: number; name: string; el: HTMLButtonElement; x: number; y: number; v: number; w: number; h: number; rot: number; caught: boolean }
  let live: Drop[] = [];
  let queue: number[] = [];
  let done = new Set<string>();
  let totalRows = 0, last = 0, spawnAcc = 0, combo = 0, lastCatch = 0;
  let visible = false, started = false;
  let mode: 'idle' | 'auto' | 'user' | 'after' = 'idle';
  let idleT: ReturnType<typeof setTimeout> | undefined;
  let autoT: ReturnType<typeof setInterval> | undefined;

  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
  const indexOf = (name: string) => SOURCES.findIndex((s) => s.name === name);
  const place = (o: Drop) => { o.el.style.transform = `translate(${o.x}px,${o.y}px) rotate(${o.rot}deg)`; };

  function make(i: number): Drop {
    const s = SOURCES[i]!;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'src';
    b.innerHTML = `<span class="ic" style="background:${CATEGORY_COLOR[s.category]}" aria-hidden="true">${s.name[0]}</span><b>${s.name}</b><small>${CATEGORY_LABEL[locale][s.category]}</small>`;
    const o: Drop = { i, name: s.name, el: b, x: 0, y: 0, v: 0, w: 0, h: 0, rot: 0, caught: false };
    b.addEventListener('pointerenter', () => catchIt(o, true));
    b.addEventListener('click', () => catchIt(o, true));
    return o;
  }

  function spawn(i?: number, yStart?: number): Drop | null {
    if (i === undefined) { const next = queue.shift(); if (next === undefined) return null; i = next; }
    else queue = queue.filter((q) => q !== i);
    const o = make(i);
    field!.appendChild(o.el);
    o.w = o.el.offsetWidth; o.h = o.el.offsetHeight;
    o.x = Math.random() * Math.max(10, field!.clientWidth - o.w - 20) + 10;
    o.y = yStart ?? -50;
    o.v = 0.1 + Math.random() * 0.07; // px/ms
    o.rot = (Math.random() - 0.5) * 10;
    if (!reduceMotion) place(o);
    live.push(o);
    return o;
  }

  function setHint(text: string, go = false) { hint.textContent = text; hint.classList.toggle('go', go); }

  function userTouched() {
    if (mode === 'user') return;
    clearTimeout(idleT); clearInterval(autoT);
    mode = 'user'; setHint(g.hintUser);
  }

  function startIdle() {
    clearTimeout(idleT); clearInterval(autoT);
    mode = 'idle'; setHint(g.hintIdle);
    if (reduceMotion) return;
    idleT = setTimeout(() => {
      if (mode !== 'idle') return;
      mode = 'auto'; setHint(g.hintAuto);
      autoT = setInterval(() => {
        const next = DEMO_SOURCES.find((n) => !done.has(n));
        if (!next) { clearInterval(autoT); mode = 'after'; setHint(g.hintAfter, true); return; }
        let o = live.find((x) => x.name === next && !x.caught && x.y > 0) ?? null;
        if (!o) {
          const stale = live.find((x) => x.name === next);
          if (stale) { stale.el.remove(); live = live.filter((x) => x !== stale); }
          o = spawn(indexOf(next), 40 + Math.random() * field!.clientHeight * 0.45);
        }
        if (o) { const target = o; setTimeout(() => catchIt(target, false), 140); }
      }, 420);
    }, 2200);
  }

  field.addEventListener('pointermove', (e) => {
    userTouched();
    const r = field.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, M = 28;
    for (const o of [...live]) if (px > o.x - M && px < o.x + o.w + M && py > o.y - M && py < o.y + o.h + M) catchIt(o, true);
  });

  function floatLabel(r: DOMRect, rows: number, byUser: boolean) {
    const f = document.createElement('div');
    f.className = 'float';
    f.innerHTML = `+${nf.format(rows)} ${g.rows}` + (byUser && combo > 1 ? `<b>×${combo}</b>` : '');
    Object.assign(f.style, { left: `${r.left + r.width / 2}px`, top: `${r.top}px` });
    document.body.appendChild(f);
    if (reduceMotion) { setTimeout(() => f.remove(), 700); return; }
    f.animate([{ transform: 'translate(-50%,0)', opacity: 1 }, { transform: 'translate(-50%,-46px)', opacity: 0 }],
      { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => f.remove();
  }

  function catchIt(o: Drop, byUser: boolean) {
    if (o.caught || done.has(o.name)) return;
    if (byUser) userTouched();
    o.caught = true;
    live = live.filter((x) => x !== o);
    const now = performance.now();
    if (byUser) { combo = now - lastCatch < 700 ? combo + 1 : 1; lastCatch = now; }
    const big = SOURCES[o.i]!.category === 'database';
    const rows = Math.floor(800 + Math.random() * (big ? 2_400_000 : 180_000));
    const r = o.el.getBoundingClientRect(), tr = tbody!.getBoundingClientRect();
    floatLabel(r, rows, byUser);
    if (reduceMotion) { o.el.remove(); addRow(o, rows); return; }
    const clone = o.el.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, transform: 'none', zIndex: '40', margin: '0', pointerEvents: 'none' });
    document.body.appendChild(clone);
    o.el.remove();
    const dx = tr.left + 16 - r.left, dy = tr.top + 6 - r.top;
    clone.animate([
      { transform: 'scale(1.12) rotate(-3deg)' },
      { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 30}px) scale(.95)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' }).onfinish = () => clone.remove();
    addRow(o, rows);
  }

  function addRow(o: Drop, rows: number) {
    done.add(o.name);
    empty!.hidden = true;
    totalRows += rows;
    const s = SOURCES[o.i]!;
    const row = document.createElement('div');
    row.className = 'trow new';
    row.innerHTML = `<span>${s.name}</span><span class="c-type">${CATEGORY_LABEL[locale][s.category]}</span><span class="n">${nf.format(rows)}</span><span class="ok">${g.ok}</span>`;
    tbody!.prepend(row);
    $('tcount').textContent = `${done.size}/${SOURCES.length} ${g.sources}`;
    $('trows').textContent = `${nf.format(totalRows)} ${g.rows}`;
    $('tbar').style.width = `${(done.size / SOURCES.length) * 100}%`;
    $('tsync').textContent = g.synced;
    if (done.size === SOURCES.length) finish();
  }

  function finish() {
    clearInterval(autoT);
    live.forEach((o) => o.el.remove());
    live = [];
    hint.remove();
    const m = document.createElement('div');
    m.className = 'done-msg';
    m.innerHTML = `<h3>${g.doneTitle}</h3><p>${g.doneText}</p><div class="btns"><a class="btn btn-p" href="#pick"><span>${g.doneCta}</span><span class="arr" aria-hidden="true">↓</span></a><button class="btn btn-g" type="button" data-again><span>${g.again}</span></button></div>`;
    field!.appendChild(m);
    m.querySelector('[data-again]')?.addEventListener('click', reset);
  }

  function reset() {
    field!.querySelectorAll('.src,.done-msg').forEach((e) => e.remove());
    tbody!.querySelectorAll('.trow').forEach((e) => e.remove());
    empty!.hidden = false;
    live = []; done = new Set(); totalRows = 0; combo = 0;
    queue = shuffle(SOURCES.map((_, i) => i));
    field!.appendChild(hint);
    $('tcount').textContent = `0/${SOURCES.length} ${g.sources}`;
    $('trows').textContent = `0 ${g.rows}`;
    $('tbar').style.width = '0';
    $('tsync').textContent = g.waiting;
    if (reduceMotion) {
      field!.classList.add('static');
      while (queue.length) spawn();
    } else {
      for (let k = 0; k < 8; k++) spawn(undefined, Math.random() * field!.clientHeight * 0.8);
    }
    if (visible) startIdle(); else { mode = 'idle'; setHint(g.hintIdle); }
  }

  function tick(now: number) {
    const dt = Math.min(40, now - (last || now));
    last = now;
    if (visible) {
      const H = field!.clientHeight;
      for (const o of [...live]) {
        o.y += o.v * dt;
        place(o);
        if (o.y > H + 10) {
          o.el.remove();
          live = live.filter((x) => x !== o);
          if (!done.has(o.name)) queue.push(o.i);
        }
      }
      spawnAcc += dt;
      if (spawnAcc > 240 && live.length < 9 && done.size < SOURCES.length) { spawnAcc = 0; spawn(); }
    }
    requestAnimationFrame(tick);
  }

  reset();
  new IntersectionObserver((entries) => {
    visible = !!entries[0]?.isIntersecting;
    if (visible && !started) { started = true; startIdle(); }
  }, { threshold: 0.4 }).observe(field);
  if (!reduceMotion) requestAnimationFrame(tick);
}
