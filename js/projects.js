/* ==========================================================================
   projects.js — domain filter chips. The expand/collapse (A15) is native
   <details> plus a CSS grid-template-rows transition, so it needs no JS.
   ========================================================================== */

import { $, $$ } from './utils.js';

export function initProjects() {
  const chips = $('#project-chips');
  const grid  = $('#projects-grid');
  if (!chips || !grid) return;

  const cards = $$('.project-card', grid);
  const empty = $('#projects-empty');

  function apply(filter) {
    let shown = 0;

    cards.forEach((card) => {
      const domains = (card.dataset.domain || '').split(',').filter(Boolean);
      const match = filter === 'All' || domains.includes(filter);
      card.classList.toggle('hidden', !match);
      if (match) card.style.setProperty('--i', shown++);
    });

    empty?.classList.toggle('hidden', shown > 0);
  }

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    apply(chip.dataset.filter);
  });
}
