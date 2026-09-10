/* ==========================================================================
   nav.js — sticky nav (A8), scroll-spy (A9), progress bar (A10),
   mobile menu (A11) and back-to-top (A19).
   Runs before content.json loads, so it must not depend on rendered content.
   ========================================================================== */

import { $, $$, rafThrottle, prefersReducedMotion } from './utils.js';

const STUCK_AT   = 80;
const TO_TOP_AT  = 600;
const FOCUSABLE  = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* -------------------------------------------------------------------------
   Sticky nav, progress bar, back-to-top — one scroll handler for all three
   ------------------------------------------------------------------------- */

function initScrollChrome() {
  const nav      = $('#nav');
  const progress = $('#progress');
  const toTop    = $('#to-top');

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;

    nav?.classList.toggle('is-stuck', y > STUCK_AT);
    toTop?.classList.toggle('is-visible', y > TO_TOP_AT);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();   // correct state on a mid-page reload

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/* -------------------------------------------------------------------------
   Scroll-spy — observer on the sections, not a scroll listener (§4.3)
   ------------------------------------------------------------------------- */

function initScrollSpy() {
  if (!('IntersectionObserver' in window)) return;

  const links = $$('.nav__link');
  const byId  = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
  };

  const visible = new Set();

  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    }
    // The topmost section still crossing the viewport centre wins.
    const active = sections.find((s) => visible.has(s.id));
    if (active) setActive(active.id);
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach((s) => spy.observe(s));
}

/* -------------------------------------------------------------------------
   Mobile menu — focus trapped, Esc closes, body scroll locked (A11)
   ------------------------------------------------------------------------- */

function initMenu() {
  const menu   = $('#menu');
  const toggle = $('#nav-toggle');
  const nav    = $('#nav');
  if (!menu || !toggle) return;

  const iconOpen  = $('.nav__toggle-open', toggle);
  const iconClose = $('.nav__toggle-close', toggle);
  let lastFocus = null;

  const isOpen = () => menu.classList.contains('is-open');

  function open() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    nav?.classList.add('is-menu-open');   // lifts the bar above the overlay
    document.body.classList.add('no-scroll');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    iconOpen?.classList.add('hidden');
    iconClose?.classList.remove('hidden');
    $(FOCUSABLE, menu)?.focus();
  }

  function close() {
    menu.classList.remove('is-open');
    nav?.classList.remove('is-menu-open');
    document.body.classList.remove('no-scroll');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    iconOpen?.classList.remove('hidden');
    iconClose?.classList.add('hidden');
    lastFocus?.focus?.();
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));

  // Any link jumps and closes.
  $$('.menu__link', menu).forEach((a) => a.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;

    const items = $$(FOCUSABLE, menu).filter((el) => el.offsetParent !== null);
    if (!items.length) return;

    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // A resize into the desktop breakpoint must not leave the overlay stuck open.
  matchMedia('(min-width: 48rem)').addEventListener('change', (e) => {
    if (e.matches && isOpen()) close();
  });
}

export function initNav() {
  initScrollChrome();
  initScrollSpy();
  initMenu();
}
