/* ==========================================================================
   render.js — content.json → DOM.
   Every interpolated value goes through escapeHtml(); every href through
   safeUrl() (§10.4). A missing section is skipped, not half-rendered (§10.5).
   ========================================================================== */

import { $, escapeHtml, safeUrl, icon, levelWord } from './utils.js';

/* -------------------------------------------------------------------------
   Small builders
   ------------------------------------------------------------------------- */

const tags = (list = []) =>
  `<ul class="tags">${list.map((t) => `<li class="tag">${escapeHtml(t)}</li>`).join('')}</ul>`;

const bullets = (list = []) =>
  `<ul class="bullets">${list.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`;

const sectionHead = (number, eyebrow, title, titleId, lede) => `
  <header class="section-head" data-reveal>
    <p class="section-head__eyebrow"><span class="mono">${escapeHtml(number)}</span> ${escapeHtml(eyebrow)}</p>
    <h2${titleId ? ` id="${escapeHtml(titleId)}"` : ''}>${escapeHtml(title)}</h2>
    ${lede ? `<p class="section-head__lede">${escapeHtml(lede)}</p>` : ''}
  </header>`;

/* -------------------------------------------------------------------------
   About
   ------------------------------------------------------------------------- */

function renderStats(stats) {
  const host = $('#stats');
  if (!host || !Array.isArray(stats) || !stats.length) return;

  host.innerHTML = stats.map((s, i) => {
    const suffix = s.suffix ? `<span class="stat__suffix">${escapeHtml(s.suffix)}</span>` : '';
    const value = s.animate
      ? `<span data-count="${escapeHtml(s.value)}">0</span>${suffix}`
      : `${escapeHtml(s.value)}${suffix}`;
    return `
      <div class="stat" style="--i:${i}">
        <p class="stat__value">${value}</p>
        <p class="stat__label">${escapeHtml(s.label)}</p>
      </div>`;
  }).join('');
}

function renderAbout(profile) {
  const prose = $('#about-prose');
  if (prose && Array.isArray(profile.summary)) {
    prose.innerHTML = profile.summary.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  }

  const kv = $('#about-kv');
  if (!kv) return;

  // No phone number and no street-level address: this page is public and gets
  // scraped. Region + email + LinkedIn is all a recruiter needs to make first
  // contact; the precise detail lives in the CV, which is sent deliberately.
  const rows = [
    ['Location', profile.location],
    ['Status', 'Seeking sponsorship'],
    ['Email', profile.email],
  ].filter(([, v]) => v);

  kv.innerHTML = rows.map(([k, v]) => `
    <div class="kv__row">
      <dt class="kv__key">${escapeHtml(k)}</dt>
      <dd class="kv__val">${escapeHtml(v)}</dd>
    </div>`).join('');
}

/* -------------------------------------------------------------------------
   Skills
   ------------------------------------------------------------------------- */

function renderSkills(skills, display = 'meters') {
  const host = $('#skills-grid');
  if (!host || !Array.isArray(skills) || !skills.length) return;

  host.innerHTML = skills.map((group, gi) => {
    const body = display === 'tags'
      ? tags(group.items.map((it) => it.name))
      : `<ul class="meters">${group.items.map((it, i) => `
          <li class="meter" style="--i:${i}">
            <span class="meter__label">${escapeHtml(it.name)}</span>
            <span class="meter__track" role="img"
                  aria-label="${escapeHtml(it.name)}: ${levelWord(it.level)}">
              <span class="meter__fill" style="--level:${(it.level / 100).toFixed(2)}"></span>
            </span>
          </li>`).join('')}</ul>`;

    return `
      <div class="skill-group${display === 'tags' ? ' skill-group--tags' : ''}"
           data-reveal style="--i:${gi}">
        <div class="skill-group__head">
          <span class="skill-group__icon">${icon(group.icon || 'code')}</span>
          <h3 class="skill-group__title">${escapeHtml(group.category)}</h3>
        </div>
        ${body}
      </div>`;
  }).join('');
}

/* -------------------------------------------------------------------------
   Projects
   ------------------------------------------------------------------------- */

function pipeline(nodes = []) {
  if (!nodes.length) return '';
  const arrow = `<span class="pipeline__arrow" aria-hidden="true">${icon('arrow-right')}</span>`;
  const inner = nodes
    .map((n) => `<span class="pipeline__node">${escapeHtml(n)}</span>`)
    .join(arrow);
  return `<div class="pipeline" role="img"
               aria-label="Data pipeline: ${escapeHtml(nodes.join(' to '))}">${inner}</div>`;
}

function projectLinks(links = []) {
  const safe = links
    .map((l) => ({ ...l, url: safeUrl(l.url) }))
    .filter((l) => l.url);
  if (!safe.length) return '';

  return `<div class="project-card__links">${safe.map((l) => `
    <a class="btn btn--ghost" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
      ${escapeHtml(l.label || 'Open')}${icon('external-link')}
    </a>`).join('')}</div>`;
}

function renderProjects(projects) {
  const host = $('#projects-grid');
  if (!host || !Array.isArray(projects) || !projects.length) return;

  host.innerHTML = projects.map((p, i) => `
    <article class="project-card${p.featured ? ' project-card--featured' : ''}"
             id="project-${escapeHtml(p.id)}"
             data-domain="${escapeHtml((p.domain || []).join(','))}"
             data-reveal style="--i:${i}">
      ${p.featured ? '<span class="project-card__badge">Featured</span>' : ''}
      <h3 class="project-card__title">${escapeHtml(p.title)}</h3>
      <p class="project-card__meta">
        <span>${escapeHtml(p.role)}</span>
        <span aria-hidden="true">·</span>
        <time>${escapeHtml(p.period)}</time>
      </p>
      <p class="project-card__summary">${escapeHtml(p.summary)}</p>
      ${pipeline(p.pipeline)}
      ${tags(p.stack)}
      <details class="project-card__detail">
        <summary>View details ${icon('chevron-down')}</summary>
        <div class="project-card__detail-wrap">
          <div class="project-card__detail-inner">
            ${bullets(p.highlights)}
            ${projectLinks(p.links)}
          </div>
        </div>
      </details>
    </article>`).join('');

  // Filter chips, derived from the domains actually present.
  const chips = $('#project-chips');
  if (!chips) return;

  const domains = [...new Set(projects.flatMap((p) => p.domain || []))];
  chips.innerHTML = ['All', ...domains].map((d, i) => `
    <button class="chip" type="button" data-filter="${escapeHtml(d)}"
            aria-pressed="${i === 0 ? 'true' : 'false'}">${escapeHtml(d)}</button>`).join('');
}

/* -------------------------------------------------------------------------
   Publication
   ------------------------------------------------------------------------- */

function renderPublication(pub) {
  const host = $('#publication-body');
  if (!host || !pub) return;

  const authors = ['Dilukshika Sivanathan', ...(pub.coAuthors || [])]
    .map((a) => escapeHtml(a)).join(' · ');

  host.innerHTML = `
    ${sectionHead('04', 'Publication', 'Peer-reviewed research', null,
      'The clearest signal that I can take a problem from question to evidence.')}

    <div class="publication__grid">
      <div class="publication__rail" data-reveal="left">
        <span class="publication__award">${icon('award')} ${escapeHtml(pub.recognition || 'Accepted & presented')}</span>
        <p class="publication__venue">${escapeHtml(pub.venue)}</p>
        <p class="mono muted">${escapeHtml(pub.date)} · ${escapeHtml(pub.role)}</p>
        <p class="publication__theme">${escapeHtml(pub.theme)}</p>
        <p class="muted" style="font-size:var(--fs-small)">${escapeHtml(pub.association)}</p>
      </div>

      <div class="publication__body" data-reveal="right">
        <h3 class="publication__title" id="publication-title">${escapeHtml(pub.title)}</h3>
        <p class="publication__authors">${authors}</p>
        ${bullets(pub.contributions)}

        <div class="citation">
          <p class="citation__text" id="citation-text">${escapeHtml(pub.citation)}</p>
          <button class="btn btn--ghost copy-btn" id="copy-citation" type="button">
            ${icon('copy', 'icon icon-copy')}${icon('check', 'icon icon-check')}
            <span class="copy-btn__label">Copy citation</span>
          </button>
        </div>
      </div>
    </div>`;
}

/* -------------------------------------------------------------------------
   Experience
   ------------------------------------------------------------------------- */

function renderExperience(groups) {
  const host = $('#timeline');
  if (!host || !Array.isArray(groups) || !groups.length) return;

  host.innerHTML = groups.map((g, i) => {
    const technical = g.type === 'technical';
    const badges = [
      g.current ? '<span class="badge badge--current">Current</span>' : '',
      technical ? '<span class="badge badge--technical">Technical</span>' : '',
    ].join('');

    const roles = (g.roles || []).map((r) => `
      <details class="timeline__role"${technical ? ' open' : ''}>
        <summary>${escapeHtml(r.role)} ${icon('chevron-down')}</summary>
        <div class="timeline__role-wrap">
          <div class="timeline__role-inner">${bullets(r.points)}</div>
        </div>
      </details>`).join('');

    return `
      <li class="timeline__item${technical ? ' timeline__item--technical' : ''}"
          data-reveal style="--i:${i}">
        <span class="timeline__node" aria-hidden="true"></span>
        <div class="timeline__header">
          <h3 class="timeline__org">${escapeHtml(g.org)}</h3>
          <p class="timeline__sub">
            <span>${escapeHtml(g.location)}</span>
            <span>${escapeHtml(g.period)}</span>
            ${badges}
          </p>
        </div>
        <div class="timeline__roles">${roles}</div>
      </li>`;
  }).join('');
}

/* -------------------------------------------------------------------------
   Education & languages
   ------------------------------------------------------------------------- */

function renderEducation(education, languages) {
  const host = $('#education-grid');
  if (host && Array.isArray(education) && education.length) {
    host.innerHTML = education.map((e, i) => `
      <article class="edu-card" data-reveal style="--i:${i}">
        <div class="edu-card__top">
          <span class="badge badge--grade">${escapeHtml(e.grade)}</span>
          <span class="edu-card__period">${escapeHtml(e.period)}</span>
        </div>
        <h3 class="edu-card__qual">${escapeHtml(e.qualification)}</h3>
        <p class="edu-card__inst">${escapeHtml(e.institution)} · ${escapeHtml(e.location)}</p>
        ${e.note ? `<p class="edu-card__note">${escapeHtml(e.note)}</p>` : ''}
      </article>`).join('');
  }

  const langs = $('#langs');
  if (langs && Array.isArray(languages) && languages.length) {
    langs.innerHTML = languages.map((l) => `
      <span class="lang">${escapeHtml(l.name)}
        <span class="lang__level">${escapeHtml(l.level)}</span>
      </span>`).join('');
  }
}

/* -------------------------------------------------------------------------
   Contact
   ------------------------------------------------------------------------- */

function renderContact(profile) {
  const host = $('#contact-links');
  if (!host) return;

  // The phone tile was deliberately dropped (§19.4 D3): a `tel:` link on a
  // public page is free input for number scrapers, and the number is on the CV
  // anyway — which a recruiter downloads, so it reaches them either way.
  const cvValue = profile.cvSize ? `PDF · ${profile.cvSize}` : 'PDF';

  const items = [
    { icon: 'mail',     label: 'Email',    value: profile.email, href: `mailto:${profile.email}` },
    { icon: 'linkedin', label: 'LinkedIn', value: 'sivanathan-dilukshika', href: profile.linkedin, external: true },
    { icon: 'github',   label: 'GitHub',   value: 'Dilukshika',  href: profile.github, external: true },
    { icon: 'download', label: 'CV',       value: cvValue,       href: profile.cvPath, download: true },
  ]
    .map((it) => ({ ...it, href: safeUrl(it.href) }))
    .filter((it) => it.href && it.value);

  host.innerHTML = items.map((it) => `
    <a class="contact-link" href="${escapeHtml(it.href)}"
       ${it.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
       ${it.download ? 'download' : ''}>
      ${icon(it.icon, 'icon contact-link__icon')}
      <span class="contact-link__text">
        <span class="contact-link__label">${escapeHtml(it.label)}</span>
        <span class="contact-link__value">${escapeHtml(it.value)}</span>
      </span>
    </a>`).join('');

  const lede = $('#contact-lede');
  if (lede && profile.availability) {
    lede.textContent = `${profile.availability}. The quickest route is email — I reply the same day.`;
  }
}

/* -------------------------------------------------------------------------
   Cross-cutting bits driven by the same JSON
   ------------------------------------------------------------------------- */

function applyProfileChrome(profile) {
  const cvPath = safeUrl(profile.cvPath);
  if (cvPath) {
    document.querySelectorAll('a[download]').forEach((a) => { a.href = cvPath; });
  }

  const size = $('#cv-size');
  if (size && profile.cvSize) size.textContent = `(PDF, ${profile.cvSize})`;

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* -------------------------------------------------------------------------
   Entry point
   ------------------------------------------------------------------------- */

export function renderAll(content) {
  applyProfileChrome(content.profile);
  renderStats(content.stats);
  renderAbout(content.profile);
  renderSkills(content.skills, content.skillsDisplay);
  renderProjects(content.projects);
  renderPublication(content.publication);
  renderExperience(content.experienceGroups);
  renderEducation(content.education, content.languages);
  renderContact(content.profile);
}
