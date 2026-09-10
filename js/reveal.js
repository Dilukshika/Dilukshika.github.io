/* ==========================================================================
   reveal.js — one shared IntersectionObserver for every [data-reveal] on the
   page (§7.5). Plays once: the element is unobserved as soon as it lands.
   ========================================================================== */

import { $$ } from './utils.js';

let observer = null;

/** Everything visible at once — the no-IntersectionObserver path (§10.5). */
function revealAll() {
  $$('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
}

export function initReveal() {
  if (!('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  $$('[data-reveal]').forEach((el) => observer.observe(el));
}

/** Observe elements added after boot (none today; keeps the module honest). */
export function observeReveal(el) {
  if (observer) observer.observe(el);
  else el.classList.add('is-visible');
}
