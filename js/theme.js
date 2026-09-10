/* ==========================================================================
   theme.js — theme toggle + persistence (A16).
   The initial value is set by the inline <head> script before first paint;
   this module only handles switching afterwards.
   ========================================================================== */

import { $ } from './utils.js';

const KEY = 'theme';

function current() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function syncButton(btn, theme) {
  const next = theme === 'light' ? 'dark' : 'light';
  btn.setAttribute('aria-label', `Switch to ${next} theme`);
  btn.setAttribute('aria-pressed', String(theme === 'light'));
}

function apply(theme, btn) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* private mode — session only */ }
  syncButton(btn, theme);
}

export function initTheme() {
  const btn = $('#theme-toggle');
  if (!btn) return;

  syncButton(btn, current());

  btn.addEventListener('click', () => {
    const next = current() === 'light' ? 'dark' : 'light';

    // View Transitions where supported; a plain swap everywhere else.
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => apply(next, btn));
    } else {
      apply(next, btn);
    }
  });

  // Follow the OS only while the visitor has never chosen for themselves.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch { /* ignore */ }
    if (stored) return;
    document.documentElement.dataset.theme = e.matches ? 'light' : 'dark';
    syncButton(btn, current());
  });
}
