# Dilukshika Sivanathan — Portfolio

A fast, animated, single-page static portfolio. No framework, no build step, no
backend. Full design rationale lives in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Run it locally

The page fetches `data/content.json`, so it must be served over HTTP —
double-clicking `index.html` will show the hero but not the sections below it
(browsers block `fetch()` on `file://`).

**On this machine (no Node or Python installed), use the bundled script:**

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Then open <http://localhost:8090>. Ctrl+C in that window stops it.

It defaults to port **8090** rather than the usual 8080 because AgentService
already holds 8080 on this machine and requests to it hang instead of failing.
Pass `-Port 9000` to use a different one.

If you install one of these later, any of them works just as well:

```bash
python -m http.server 8000        # Python 3
npx serve .                       # Node
php -S localhost:8000             # PHP
```

VS Code users: the **Live Server** extension works too — right-click
`index.html` → *Open with Live Server*.

---

## Update the content

**`data/content.json` is the only file you need to edit.** Nothing rebuilds;
save it and refresh the page.

| To do this | Edit this key |
|---|---|
| Change your headline, tagline, email, location, links | `profile` |
| Change the four number tiles | `stats` |
| Add or reword a skill | `skills[].items[]` — `level` is 0–100 |
| Show skills as tag pills instead of meters | `"skillsDisplay": "tags"` |
| Add a project | append an object to `projects` |
| Update the paper | `publication` |
| Add a job | `experienceGroups` — one entry per employer, `roles[]` inside it |
| Add a qualification | `education` |

Rules worth knowing:

- **A job with two titles at one employer** goes in as one `experienceGroups`
  entry with two objects in `roles` (that's how the SPAR entry works).
- `"type": "technical"` gives an experience entry the accent-coloured timeline
  node and opens its detail by default. Use it for the roles you want read.
- `"featured": true` on a project gives it the gradient top edge and, on wide
  screens, the full-width first slot.
- Project `domain` values become the filter chips automatically — no other
  change needed.
- Every `links[].url` must be `https:`, `mailto:` or `tel:`. Anything else is
  dropped at render time and logged to the console.
- **Keep the phone number and home address off this site.** This page is public
  and gets scraped: anything published here is copied within days and cannot be
  taken back. `profile.location` stays at county level (`Cambridgeshire, United
  Kingdom`) — not the town, never the street. Email and LinkedIn are the contact
  routes; a recruiter who needs to call gets the number from the CV.

If `content.json` is malformed, the page detects it, hides the JSON-driven
sections, and shows a short fallback with the email address and CV link — so a
typo never leaves a blank page.

---

## Replace the CV

Drop the new PDF at `assets/cv/Dilukshika_Sivanathan_CV.pdf` (same filename) and
update `profile.cvSize` in `content.json`. All five download buttons point at
`profile.cvPath`, so there's one place to change if you rename it.

**Check the PDF before you copy it in.** This file is downloadable by anyone who
finds the site, so it needs the same treatment as the page: no street address
(county and country is enough), and no phone number unless you accept that it
becomes public. Keep the full version as a separate file for applications you
send directly — the project root is git-ignored for exactly this, so a draft
left there is never published.

---

## Fonts

The site ships on system font stacks, so there are no missing-file requests out
of the box. To switch to the designed typefaces:

1. Put these five files in `assets/fonts/`:
   `space-grotesk-500.woff2`, `space-grotesk-700.woff2`, `inter-400.woff2`,
   `inter-600.woff2`, `jetbrains-mono-400.woff2`
2. Uncomment the `@font-face` block at the top of `css/03-base.css`.

Nothing else changes — the token stacks in `css/01-tokens.css` already name
them first.

---

## Images still to add

The layout works without these; each has a designed fallback.

| File | Size | Fallback in use today |
|---|---|---|
| `assets/img/profile.webp` (+ `.jpg`) | 600×600 | The gradient **DS** monogram |
| `assets/img/og-image.png` | 1200×630 | Social previews show text only |

To use the headshot, add the file and put an `<img>` inside `.avatar` in
`index.html`, above the `.avatar__monogram` span.

---

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/Dilukshika/Dilukshika.github.io.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / root**.
It goes live at `https://dilukshika.github.io/` within a minute or two.

`.nojekyll` is already committed so GitHub Pages serves the files as-is.

After the first deploy, check that the canonical URL in `index.html`,
`sitemap.xml` and `robots.txt` matches the real address.

---

## Project structure

```
index.html          The page shell — hero and meta are hardcoded here
404.html            Styled not-found page
data/content.json   ★ the only file you edit to update content
css/                main.css imports 01-tokens → 07-utilities, in @layer order
js/                 ES modules, booted by main.js
assets/             icons (SVG sprite), cv, fonts, img
tools/serve.ps1     Local dev server for Windows — no Node/Python needed
```

---

## Accessibility & motion

- Keyboard-navigable throughout; skip link first in the DOM; focus ring never
  removed.
- Respects `prefers-reduced-motion` — animations become instant states rather
  than being broken, and the change is honoured live without a reload.
- Respects `prefers-contrast: more`.
- Theme follows the OS until you pick one, then remembers your choice.

## Licence

Code: MIT (see [`LICENSE`](LICENSE)). Written content, the CV and the
publication text are © Dilukshika Sivanathan and not covered by that licence.
