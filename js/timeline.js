/* ==========================================================================
   timeline.js — the connector draw (A13).

   The line and node states are CSS, keyed off .is-visible, which the shared
   reveal observer already sets. This module owns the cascade: it renumbers
   --i in DOM order so the draw runs top-down whatever order the JSON is in,
   and it guarantees a visible timeline where IntersectionObserver is missing.
   ========================================================================== */

import { $, $$ } from './utils.js';

export function initTimeline() {
  const timeline = $('#timeline');
  if (!timeline) return;

  const items = $$('.timeline__item', timeline);
  items.forEach((item, i) => item.style.setProperty('--i', i));

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
  }
}
