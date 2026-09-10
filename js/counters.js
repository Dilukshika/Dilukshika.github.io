/* ==========================================================================
   counters.js — stat count-up (A6). Fires at 50 % visibility, once.
   ========================================================================== */

import { $$, prefersReducedMotion } from './utils.js';

const DURATION = 1600;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function countUp(el, target) {
  const start = performance.now();

  const step = (now) => {
    const t = Math.min((now - start) / DURATION, 1);
    el.textContent = String(Math.round(easeOutExpo(t) * target));
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function initCounters() {
  const nodes = $$('[data-count]');
  if (!nodes.length) return;

  const finish = (el) => { el.textContent = el.dataset.count; };

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    nodes.forEach(finish);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);

      const target = Number(el.dataset.count);
      if (Number.isFinite(target)) countUp(el, target);
      else finish(el);
    }
  }, { threshold: 0.5 });

  nodes.forEach((el) => observer.observe(el));
}
