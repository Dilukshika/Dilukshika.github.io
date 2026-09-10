/* ==========================================================================
   content.js — fetch and sanity-check data/content.json.
   A missing optional key means "skip that section", never "throw" (§10.5).
   ========================================================================== */

const SOURCE = 'data/content.json';

/** Keys without which the page has nothing to show. */
const REQUIRED = ['profile'];

export async function loadContent() {
  const res = await fetch(SOURCE, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${SOURCE} responded ${res.status}`);

  const data = await res.json();

  for (const key of REQUIRED) {
    if (!data[key]) throw new Error(`${SOURCE} is missing required key "${key}"`);
  }

  // Optional sections: warn once, then let render.js skip them.
  for (const key of ['stats', 'skills', 'projects', 'publication',
                     'experienceGroups', 'education', 'languages']) {
    if (!data[key]) console.warn(`[portfolio] content.json has no "${key}" — section skipped`);
  }

  return data;
}
