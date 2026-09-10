/* ==========================================================================
   hero-canvas.js — the waveform background (A1) and the magnetic hero CTA (A14).

   Two sine waves drifting in and out of phase over a faint grid: a direct nod
   to the voltage/current traces of the energy-meter project.
   ========================================================================== */

import { $, debounce, rafThrottle, prefersReducedMotion, onReducedMotionChange } from './utils.js';

const DPR_CAP    = 2;
const GRID_STEP  = 48;
const WAVE_A     = { amp: 42, period: 380, speed: 0.010, width: 2,   alpha: 0.55, token: '--accent'   };
const WAVE_B     = { amp: 28, period: 240, speed: 0.016, width: 1.5, alpha: 0.40, token: '--accent-2' };
const DOTS       = 3;

/** Swap a canvas we cannot or should not run for the CSS gradient fallback. */
function useFallback(canvas) {
  const hero = canvas.closest('.hero');
  canvas.remove();
  if (hero && !hero.querySelector('.hero__canvas-fallback')) {
    const div = document.createElement('div');
    div.className = 'hero__canvas-fallback';
    div.setAttribute('aria-hidden', 'true');
    hero.prepend(div);
  }
}

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** #RRGGBB (or any CSS colour the browser resolves) → rgba() at a given alpha. */
function withAlpha(colour, alpha) {
  const hex = colour.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return colour;
  const n = parseInt(hex, 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

export function initHeroCanvas() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) { useFallback(canvas); return; }

  // Very low-core devices get the static gradient — the loop is not worth it.
  if ((navigator.hardwareConcurrency ?? 4) <= 2) { useFallback(canvas); return; }

  let w = 0, h = 0, dpr = 1;
  let grid = null;              // offscreen grid layer, redrawn only on resize
  let phase = 0;
  let frame = 0;
  let onScreen = true;
  let colours = readColours();

  function readColours() {
    return {
      grid: withAlpha(token('--border-subtle'), 0.35),
      a:    withAlpha(token(WAVE_A.token), WAVE_A.alpha),
      b:    withAlpha(token(WAVE_B.token), WAVE_B.alpha),
      dot:  token('--accent'),
    };
  }

  function buildGrid() {
    grid = document.createElement('canvas');
    grid.width = canvas.width;
    grid.height = canvas.height;

    const g = grid.getContext('2d');
    g.scale(dpr, dpr);
    g.strokeStyle = colours.grid;
    g.lineWidth = 1;

    for (let y = GRID_STEP; y < h; y += GRID_STEP) {
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(w, y + 0.5);
      g.stroke();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    w = rect.width;
    h = rect.height;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
  }

  function wave(cfg, colour, offset) {
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.lineWidth = cfg.width;
    for (let x = 0; x <= w; x += 4) {
      const y = h / 2 + Math.sin(x / cfg.period * Math.PI * 2 + phase * offset) * cfg.amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function sampleDots() {
    ctx.fillStyle = colours.dot;
    for (let i = 0; i < DOTS; i++) {
      const x = (w / (DOTS + 1)) * (i + 1);
      const y = h / 2 + Math.sin(x / WAVE_A.period * Math.PI * 2 + phase * WAVE_A.speed / 0.010) * WAVE_A.amp;
      const r = 3 + Math.sin(phase * 0.04 + i) * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(r, 1.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    if (grid) ctx.drawImage(grid, 0, 0, w, h);
    wave(WAVE_A, colours.a, WAVE_A.speed / 0.010);
    wave(WAVE_B, colours.b, WAVE_B.speed / 0.010);
    sampleDots();
  }

  function loop() {
    phase += 0.010;
    draw();
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (frame || prefersReducedMotion()) return;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  resize();
  if (prefersReducedMotion()) draw();   // one static frame (§7.6)
  else start();

  window.addEventListener('resize', debounce(() => { resize(); draw(); }, 150));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (onScreen) start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(canvas.closest('.hero') ?? canvas);
  }

  onReducedMotionChange(() => {
    if (prefersReducedMotion()) { stop(); draw(); } else start();
  });

  // Theme swap changes every colour the canvas draws with.
  new MutationObserver(() => {
    colours = readColours();
    buildGrid();
    draw();
  }).observe(document.documentElement, { attributeFilter: ['data-theme'] });
}

/* -------------------------------------------------------------------------
   A14 — magnetic primary CTA. Fine pointers only, max 8 px, transform only.
   ------------------------------------------------------------------------- */

export function initMagneticCta() {
  const btn = $('#hero-cv');
  if (!btn || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const RANGE = 90;
  const MAX   = 8;

  // The centre is cached rather than measured per event: calling
  // getBoundingClientRect() on every pointermove forces a synchronous layout,
  // which is a frame killer on a page this tall. Re-measured only when the
  // button can actually have moved.
  let cx = 0, cy = 0;
  let active = false;

  const measure = rafThrottle(() => {
    const r = btn.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  });

  const reset = () => { btn.style.transform = ''; };

  // No pointer maths at all once the hero has scrolled away.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) measure(); else reset();
    }, { threshold: 0 }).observe(btn);
  } else {
    active = true;
    measure();
  }

  window.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('resize', measure);

  window.addEventListener('pointermove', (e) => {
    if (!active || prefersReducedMotion()) return;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > RANGE) {
      if (btn.style.transform) reset();
      return;
    }

    const pull = (1 - dist / RANGE) * MAX;
    btn.style.transform = `translate(${(dx / dist || 0) * pull}px, ${(dy / dist || 0) * pull}px)`;
  }, { passive: true });

  btn.addEventListener('blur', reset);
  onReducedMotionChange(reset);
}
