/* ==========================================================================
   main.js — boot sequence (§10.1).

   Order matters: theme first (flash), then the parts that do not depend on
   content.json, then the data, then everything that observes rendered DOM.
   A content.json failure degrades gracefully — nav, hero and the CV download
   all still work.
   ========================================================================== */

import { loadContent }                       from './content.js';
import { renderAll }                         from './render.js';
import { initReveal }                        from './reveal.js';
import { initNav }                           from './nav.js';
import { initTheme }                         from './theme.js';
import { initHeroCanvas, initMagneticCta }   from './hero-canvas.js';
import { initCounters }                      from './counters.js';
import { initSkills }                        from './skills.js';
import { initProjects }                      from './projects.js';
import { initPublication }                   from './publication.js';
import { initTimeline }                      from './timeline.js';

// Tells the inline <head> watchdog that the modules are alive, so it leaves
// the reveal system armed instead of unhiding everything (§7.7).
window.__portfolioBooted = true;

initTheme();
initNav();
initHeroCanvas();
initMagneticCta();

try {
  const content = await loadContent();
  renderAll(content);
} catch (err) {
  console.error('[portfolio] content load failed:', err);
  document.body.dataset.contentError = 'true';
}

initReveal();
initCounters();
initSkills();
initProjects();
initPublication();
initTimeline();
