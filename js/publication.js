/* ==========================================================================
   publication.js — copy-citation (A18), with a selection fallback for
   browsers without the async clipboard API or on insecure origins (§10.5).
   ========================================================================== */

import { $ } from './utils.js';

const REVERT_AFTER = 1800;

export function initPublication() {
  const btn  = $('#copy-citation');
  const text = $('#citation-text');
  if (!btn || !text) return;

  const label = $('.copy-btn__label', btn);
  let timer = 0;

  function confirm(message) {
    btn.classList.add('is-copied');
    if (label) label.textContent = message;
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove('is-copied');
      if (label) label.textContent = 'Copy citation';
    }, REVERT_AFTER);
  }

  function selectCitation() {
    const range = document.createRange();
    range.selectNodeContents(text);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  btn.addEventListener('click', async () => {
    const citation = text.textContent.trim();

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(citation);
        confirm('Copied');
        return;
      } catch { /* fall through to the selection path */ }
    }

    selectCitation();
    confirm('Press Ctrl+C');
  });
}
