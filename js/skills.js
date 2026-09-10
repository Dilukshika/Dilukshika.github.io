/* ==========================================================================
   skills.js — meter fill (A7). Adds .is-filled; the scaleX transition and its
   60 ms per-item stagger live in CSS, so nothing here touches layout.
   ========================================================================== */

import { $$, prefersReducedMotion } from './utils.js';

export function initSkills() {
  const meters = $$('.meter');
  if (!meters.length) return;

  const fill = (el) => el.classList.add('is-filled');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    meters.forEach(fill);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      fill(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.4 });

  meters.forEach((el) => observer.observe(el));
}
