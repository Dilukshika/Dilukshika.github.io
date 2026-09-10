/* ==========================================================================
   utils.js — shared helpers. No DOM side effects on import.
   ========================================================================== */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => REDUCED.matches;

/** Live re-evaluation, so a mid-session OS change is honoured (§7.6). */
export const onReducedMotionChange = (cb) => REDUCED.addEventListener('change', cb);

/** Coalesce bursts of events down to one call per animation frame. */
export function rafThrottle(fn) {
  let frame = 0;
  return (...args) => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; fn(...args); });
  };
}

/** Trailing-edge debounce. */
export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape before any template interpolation (§10.4). */
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

const SAFE_PROTOCOLS = new Set(['https:', 'mailto:', 'tel:']);

/**
 * Allowlist URL protocols before anything reaches an href (§10.4).
 * Relative paths (the CV, in-page anchors) are passed through unchanged.
 * @returns {string} the safe URL, or '' if it was rejected.
 */
export function safeUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  if (/^[#/]/.test(raw) || /^[\w.-]+\//.test(raw)) return raw;   // relative
  try {
    if (SAFE_PROTOCOLS.has(new URL(raw).protocol)) return raw;
  } catch { /* not parseable — fall through */ }
  console.warn('[portfolio] blocked unsafe URL:', raw);
  return '';
}

/** Build one <use> reference into the sprite inlined at the top of <body>. */
export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#${escapeHtml(name)}"/></svg>`;

/** Parse an HTML string into elements, ready to append. */
export function fromHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content;
}

/** Skill level (0-100) → the word screen readers announce (§8.2). */
export function levelWord(level) {
  if (level >= 88) return 'expert';
  if (level >= 82) return 'strong';
  if (level >= 75) return 'proficient';
  return 'familiar';
}
