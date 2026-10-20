import { gsap, ScrollTrigger, reduceMotion, scrollToY } from './scroll';
import { STEP_BG, STEP_DARK, STEPS } from './theme';

/** Progreso de la historia: 0 (inicio) … 5 (persona). `prog` persigue a `target` con inercia. */
export const storyState = { target: 0, prog: 0 };

const story = document.getElementById('story');
const hdr = document.getElementById('hdr');
const rail = document.getElementById('rail');
const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
const railBtns = Array.from(rail?.querySelectorAll<HTMLButtonElement>('button') ?? []);

if (story) {
  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { storyState.target = self.progress * STEPS; },
  });

  railBtns.forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.s ?? 0);
    const range = story.offsetHeight - window.innerHeight;
    scrollToY(story.offsetTop + (range * i) / STEPS);
  }));

  panels.forEach((p, i) => p.style.setProperty('--scrim', `${STEP_BG[i]}E6`));

  const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-header-dark]'));
  const overDark = () => darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top < 60 && r.bottom > 60;
  });

  let lastY = window.scrollY;
  gsap.ticker.add(() => {
    storyState.prog += (storyState.target - storyState.prog) * (reduceMotion ? 1 : 0.085);
    const prog = storyState.prog;
    const step = Math.min(STEPS, Math.round(prog));
    const inStory = window.scrollY < story.offsetTop + story.offsetHeight - window.innerHeight * 0.5;
    hdr?.classList.toggle('dark', inStory ? STEP_DARK[step]! : overDark());
    // Fuera de la historia la cabecera lleva fondo y se esconde al bajar (reaparece al subir).
    const y = window.scrollY;
    hdr?.classList.toggle('floating', !inStory);
    if (Math.abs(y - lastY) > 4) { hdr?.classList.toggle('hide', !inStory && y > lastY); lastY = y; }
    rail?.classList.toggle('dark', STEP_DARK[step]!);
    rail?.classList.toggle('off', !inStory);
    railBtns.forEach((b, i) => b.classList.toggle('on', i === step));
    if (reduceMotion) return;
    panels.forEach((p, i) => {
      const text = p.querySelector<HTMLElement>('.ptext');
      if (!text) return;
      const d = prog - i;
      text.style.opacity = Math.max(0, 1 - Math.abs(d) * 1.15).toFixed(3);
      text.style.transform = `translate3d(0, ${(-d * 60).toFixed(1)}px, 0)`;
    });
  });

  // La escena 3D se carga aparte, cuando el titular ya está pintado.
  const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch { return false; }
  })();
  if (canvas && hasWebGL) {
    const load = () => import('./story3d').then((m) => m.startScene(canvas, storyState));
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1200 });
    else setTimeout(load, 300);
  }
}
