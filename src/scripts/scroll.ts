import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scroll suave compartido. Desactivado con "reducir movimiento". */
export const lenis: Lenis | null = reduceMotion ? null : new Lenis({ lerp: 0.11, wheelMultiplier: 1 });

if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Los enlaces de ancla pasan por Lenis para mantener la inercia.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || a.origin !== location.origin || a.pathname !== location.pathname || !a.hash) return;
    const el = document.querySelector(a.hash);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el as HTMLElement, { offset: 0 });
    history.replaceState(null, '', a.hash);
  });
}

export function scrollToY(y: number): void {
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y });
}

export { gsap, ScrollTrigger };
