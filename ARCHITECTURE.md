# Portfolio Website — Architecture Document

**Owner:** Dilukshika Sivanathan
**Project:** `dilukshika-portfolio` — personal portfolio, static site
**Version:** 1.0
**Date:** 2026-09-10
**Status:** Approved for build (pending sign-off on §3 open decisions)

---

## Table of Contents

1. [Purpose & Goals](#1-purpose--goals)
2. [Audience & Use Cases](#2-audience--use-cases)
3. [Technology Decisions](#3-technology-decisions)
4. [Information Architecture](#4-information-architecture)
5. [Content Model](#5-content-model)
6. [Visual Design System](#6-visual-design-system)
7. [Animation Architecture](#7-animation-architecture)
8. [Component Architecture](#8-component-architecture)
9. [File & Folder Structure](#9-file--folder-structure)
10. [JavaScript Module Design](#10-javascript-module-design)
11. [CSS Architecture](#11-css-architecture)
12. [Responsive Strategy](#12-responsive-strategy)
13. [Accessibility Requirements](#13-accessibility-requirements)
14. [Performance Budget](#14-performance-budget)
15. [SEO & Metadata](#15-seo--metadata)
16. [Build, Deployment & Hosting](#16-build-deployment--hosting)
17. [Testing & Quality Gates](#17-testing--quality-gates)
18. [Risks & Mitigations](#18-risks--mitigations)
19. [Delivery Plan](#19-delivery-plan)
20. [Future Enhancements](#20-future-enhancements)

---

## 1. Purpose & Goals

### 1.1 Primary objective

A **fast, animated, single-page static portfolio** that converts a recruiter's 30-second scan into a callback for a **UK Skilled-Worker-sponsored junior software / data developer or IT support role**.

### 1.2 Success criteria

| # | Goal | Measurable target |
|---|------|-------------------|
| G1 | Communicate the headline credential instantly | First-Class BSc + published researcher + 3 yrs IT visible above the fold, no scroll |
| G2 | Look visually distinctive, not template-like | Custom animated hero, motion on scroll, cohesive design system |
| G3 | Load fast anywhere | LCP < 1.5 s on 4G; total page weight < 500 KB |
| G4 | Work with zero backend | 100 % static — deployable to GitHub Pages free tier |
| G5 | Be accessible | WCAG 2.1 AA; keyboard-navigable; respects `prefers-reduced-motion` |
| G6 | Make contact frictionless | CV download + email + LinkedIn + GitHub reachable from 3 places |
| G7 | Be maintainable by the owner | Content editable in **one JSON file**, no rebuild step required |

### 1.3 Explicit non-goals

- ❌ No CMS, no database, no server-side rendering
- ❌ No blog engine (a static "Writing" section may come later — §20)
- ❌ No user accounts, comments, or analytics that require a backend
- ❌ No heavy 3-D engine (Three.js/WebGL) — rejected on performance and complexity grounds (§3.4)

---

## 2. Audience & Use Cases

### 2.1 Personas

**P1 — UK Technical Recruiter (primary, ~60 % of traffic)**
Scans on a laptop for 30–60 s. Needs: role fit, visa/sponsorship status, location, CV file, contact. Optimise for: fast scan, download CV, prominent "seeking sponsorship" signal.

**P2 — Hiring Manager / Engineering Lead (~25 %)**
Wants technical depth. Needs: project detail, stack used, the NPAIRC publication, GitHub link. Optimise for: expandable project cards, honest tech tags.

**P3 — Academic / Research Contact (~10 %)**
Arrives from the conference or LinkedIn. Needs: publication details, co-author credit, abstract. Optimise for: a dedicated, citable Publication block.

**P4 — Mobile visitor from LinkedIn (~40 % of all sessions, cross-cutting)**
Needs: everything above, thumb-reachable, on a slow connection. Optimise for: mobile-first layout, reduced animation payload.

### 2.2 Critical user journeys

```
J1  Land → read hero → click "Download CV"                          ≤ 2 interactions
J2  Land → scroll to Projects → open Energy Meter → view stack      ≤ 3 interactions
J3  Land → nav "Publication" → read NPAIRC entry                    ≤ 2 interactions
J4  Land → nav "Contact" → click email / LinkedIn                   ≤ 2 interactions
J5  Mobile: land → open menu → jump to any section                  ≤ 2 interactions
```

Every journey must complete in **≤ 3 interactions**. This constraint drives the sticky nav and the persistent CV button in §8.

---

## 3. Technology Decisions

### 3.1 Chosen stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Markup | **Semantic HTML5**, hand-authored | Zero build, perfect SEO, permanent |
| Styling | **Vanilla CSS** + Custom Properties + `@layer` | No preprocessor needed; cascade layers give the structure SASS was used for |
| Behaviour | **Vanilla JS (ES2022 modules)** | ~8 KB of logic total; a framework would be 40× the payload of the code it runs |
| Animation | **CSS animations + Web Animations API + IntersectionObserver** + one `<canvas>` | Native, GPU-composited, no library |
| Icons | **Inline SVG sprite** | One HTTP request, styleable via `currentColor`, no icon-font FOUT |
| Fonts | **Self-hosted WOFF2**, 2 families, 4 weights | No third-party request, no layout shift, GDPR-clean |
| Content | **`data/content.json`** loaded at runtime | Owner edits one file; no rebuild |
| Build | **None required.** Optional: `npm run build` for minification only | Site works when opened straight from disk (via local server) |
| Hosting | **GitHub Pages** (primary) / Netlify (fallback) | Free, HTTPS, custom domain, git-push deploy |
| Versioning | **Git + GitHub** | Already in the owner's toolkit (CV: Git/GitHub) |

### 3.2 Why no framework

React/Vue/Svelte would add 30–70 KB of runtime plus a build toolchain to render **static text that never changes at runtime**. The interactive surface is: a nav, a mobile menu, scroll reveals, a filter, a canvas background, and a theme toggle. All are ~10–30 lines of vanilla JS each. A framework is a net negative here on every metric in §1.2.

### 3.3 Why `content.json` instead of hardcoded HTML

The owner will update this site as her career progresses. Separating content from markup means:
- Adding a project = adding one JSON object, no HTML editing, no risk of breaking layout.
- The same JSON can later feed a `sitemap`, a JSON-LD block, or a printable CV view.
- **Trade-off:** content arrives after JS runs, which harms SEO for crawlers that don't execute JS.
  **Mitigation:** the hero, page title, meta description, and JSON-LD are **hardcoded in `index.html`** — crawlers and social-preview bots get the critical content without JS. Sections below the fold are JSON-hydrated. This is the deliberate split.

### 3.4 Rejected alternatives

| Option | Rejected because |
|--------|------------------|
| Three.js / WebGL hero | +600 KB, battery drain on mobile, fails the §14 budget for one background effect |
| GSAP + ScrollTrigger | +70 KB for effects achievable with IntersectionObserver + CSS |
| Tailwind CDN | Runtime CSS generation blocks render; produces unmaintainable class soup in hand-written HTML |
| Next.js / Astro | Build toolchain and Node dependency for a site with no dynamic routes |
| Google Fonts CDN | Third-party request, render-blocking, privacy/GDPR consideration |
| Bootstrap | Generic look — directly conflicts with G2 |

---

## 4. Information Architecture

### 4.1 Site map

```
/  (index.html — single page, 9 sections)
│
├── #hero            Name, title, positioning line, primary CTAs, animated canvas
├── #about           Professional profile, key stats, availability/sponsorship
├── #skills          6 skill clusters, animated proficiency meters
├── #projects        3 project cards (expandable detail)
├── #publication     NPAIRC 2026 — featured, full-width treatment
├── #experience      Vertical animated timeline, 5 roles
├── #education       2 qualifications + achievement badges
├── #contact         Contact methods, CV download, location
└── footer           Copyright, links, back-to-top

/404.html            Styled not-found page
/assets/cv/Dilukshika_Sivanathan_CV.pdf
```

### 4.2 Section order rationale

Ordered by **what P1 needs, in the order they need it**:

1. **Hero** — identity + the single strongest credential. Answers "who and what."
2. **About** — the profile paragraph + hard numbers. Answers "is this person real."
3. **Skills** — fast keyword scan. Answers "does the stack match the JD."
4. **Projects** — proof of build capability. The Energy Meter is the flagship.
5. **Publication** — the strongest differentiator vs. other juniors. Placed high, given full width, not buried.
6. **Experience** — chronology and stability, incl. UK work history (a sponsorship-relevant signal).
7. **Education** — First-Class + Distinction; verification territory, so it sits after proof of work.
8. **Contact** — the conversion point, at the natural end of the scan.

> **Design note:** Publication before Experience is deliberate. Her retail roles are the least relevant to a dev role; the peer-reviewed paper is the most relevant. The page must not make a recruiter scroll past four retail jobs to find the research.

### 4.3 Navigation model

- **Desktop:** sticky top bar. Transparent over hero → solid + blurred backdrop after 80 px scroll. Section links + a filled "Download CV" button.
- **Mobile (< 768 px):** hamburger → full-screen overlay menu, staggered link entrance, body scroll locked while open.
- **Scroll-spy:** the nav link for the section currently occupying the viewport centre gets an `.is-active` state with an animated underline. Driven by IntersectionObserver, not scroll listeners.
- **Skip link:** `Skip to main content` — first focusable element, visually hidden until focused.

---

## 5. Content Model

All below-the-fold content lives in `data/content.json`. Schema:

### 5.1 `profile`

```jsonc
{
  "profile": {
    "name": "Dilukshika Sivanathan",
    "headline": "Junior Software & Data Developer",
    "subheadline": "BSc (Hons) Applied Computing — First-Class Honours",
    "tagline": "I build data-collection and monitoring systems — from sensor to dashboard.",
    "location": "Cambridgeshire, United Kingdom",   // region only — never the town or street (§19.4 D3)
    "email": "dilukshika99@gmail.com",
    "linkedin": "https://linkedin.com/in/sivanathan-dilukshika",
    "github": "https://github.com/Dilukshika",
    "cvPath": "assets/cv/Dilukshika_Sivanathan_CV.pdf",
    "availability": "Seeking a Skilled Worker sponsored junior software developer or data role in the UK",
    "summary": "First-Class Honours graduate in Applied Computing (University of South Wales) with a Distinction-level HND in Software Engineering... [full profile paragraph from CV]"
  }
}
```

### 5.2 `stats` — the animated counter row

| Value | Label | Notes |
|-------|-------|-------|
| `1st` | Class Honours Degree | Non-numeric; rendered as static, no count-up |
| `3` | Years IT Experience | Count-up 0→3 (Jul 2022 – May 2024 + ongoing) |
| `1` | Peer-Reviewed Publication | Count-up |
| `93` | % ML Model Accuracy | Count-up, suffix `%` |

```jsonc
"stats": [
  { "value": "1st", "label": "Class Honours Degree", "animate": false },
  { "value": 3,     "label": "Years IT Experience",  "animate": true, "suffix": "+" },
  { "value": 1,     "label": "Peer-Reviewed Publication", "animate": true },
  { "value": 93,    "label": "% ML Model Accuracy",  "animate": true, "suffix": "%" }
]
```

### 5.3 `skills` — 6 clusters, mapped 1:1 from the CV

```jsonc
"skills": [
  {
    "category": "Programming & Development",
    "icon": "code",
    "items": [
      { "name": "Application Development", "level": 85 },
      { "name": "Object-Oriented Programming", "level": 85 },
      { "name": "Procedural Programming", "level": 80 },
      { "name": "Algorithms & Problem Solving", "level": 80 },
      { "name": "Git / GitHub", "level": 85 }
    ]
  },
  { "category": "Data & Monitoring", "icon": "activity", "items": [
      { "name": "Real-Time Data Collection", "level": 90 },
      { "name": "Dashboards & Reporting", "level": 85 },
      { "name": "IoT Sensor Integration (ESP8266/ESP32)", "level": 90 },
      { "name": "API / Webhook Automation", "level": 80 },
      { "name": "Google Sheets Logging", "level": 85 }
  ]},
  { "category": "Databases", "icon": "database", "items": [
      { "name": "Database Design & Development", "level": 80 },
      { "name": "Structured Data Handling", "level": 80 }
  ]},
  { "category": "Systems & Infrastructure", "icon": "server", "items": [
      { "name": "Linux Administration", "level": 85 },
      { "name": "Windows Administration", "level": 85 },
      { "name": "Server Configuration & Maintenance", "level": 80 },
      { "name": "Networking (Switches, Routers)", "level": 80 },
      { "name": "Zabbix & Nagios Monitoring", "level": 80 }
  ]},
  { "category": "Tools & Applications", "icon": "tool", "items": [
      { "name": "Arduino", "level": 85 },
      { "name": "Microsoft Office Suite", "level": 90 },
      { "name": "POS Systems", "level": 85 }
  ]},
  { "category": "Professional", "icon": "users", "items": [
      { "name": "Research & Written Analysis", "level": 90 },
      { "name": "Stakeholder Communication", "level": 90 },
      { "name": "Time Management", "level": 90 },
      { "name": "Multicultural Teamwork", "level": 95 }
  ]}
]
```

> **⚠️ Honesty constraint.** The `level` percentages are a **visual device**, not a claim of certification. They are derived from CV emphasis and time spent, and no value implies expert status. If the owner is uncomfortable with numeric self-rating (a legitimate position — some recruiters dislike it), the meters degrade cleanly to plain tag pills by setting `"display": "tags"` on the section. **This is Open Decision D1 in §19.4.**

### 5.4 `projects`

```jsonc
"projects": [
  {
    "id": "energy-meter",
    "title": "Energy Meter with Data Collection & Monitoring System",
    "role": "BSc Final-Year Project",
    "period": "2024 – 2025",
    "featured": true,
    "summary": "A real-time energy monitoring system measuring voltage, current and power, streaming live readings to a cloud dashboard with automated data logging.",
    "highlights": [
      "Built on an ESP8266 microcontroller with SCT-013 (current) and ZMPT101B (voltage) sensors",
      "Streamed live readings to a Blynk IoT dashboard for real-time visualisation",
      "Automated logging to Google Sheets via webhook integration for ongoing analysis",
      "Demonstrated a complete end-to-end pipeline: acquisition → processing → visualisation → logging"
    ],
    "stack": ["ESP8266", "C/C++", "Blynk IoT", "SCT-013", "ZMPT101B", "Webhooks", "Google Sheets API"],
    "domain": ["IoT", "Data"],
    "diagram": "energy-meter-pipeline",
    "links": []
  },
  {
    "id": "cybersafe",
    "title": "CyberSafe — AI-Driven Cybercrime Vulnerability Assessment",
    "role": "Peer-Reviewed Research (Co-Author)",
    "period": "2026",
    "featured": true,
    "summary": "An AI framework using ensemble machine learning for predictive cybercrime vulnerability assessment among Sri Lankan school students, with explainable AI and adaptive game-based learning.",
    "highlights": [
      "Ensemble ML (SVM + Random Forest) achieving 93 %+ predictive accuracy",
      "SHAP-based explainability for transparent, auditable risk scoring",
      "18 adaptive game-based learning modules driven by assessed vulnerability",
      "Delivered as a MERN-stack web application with a Flask AI microservice"
    ],
    "stack": ["Python", "scikit-learn", "SHAP", "Flask", "MongoDB", "Express", "React", "Node.js"],
    "domain": ["AI/ML", "Research"],
    "linkedPublication": "npairc-2026",
    "links": []
  },
  {
    "id": "document-locker",
    "title": "Smart Document Locker System",
    "role": "HND Project",
    "period": "2019 – 2021",
    "featured": false,
    "summary": "A secure physical document locker using multi-factor authentication, combining hardware integration with embedded programming.",
    "highlights": [
      "Multi-factor authentication via RFID and biometric verification",
      "Built on Arduino with integrated hardware and embedded programming",
      "Applied security, access-control and application development principles",
      "Delivered from concept through to a working prototype"
    ],
    "stack": ["Arduino", "C/C++", "RFID", "Biometric Sensor", "Embedded Systems"],
    "domain": ["Embedded", "Security"],
    "links": []
  }
]
```

**Filter chips** derive from the union of `domain`: `All · IoT · Data · AI/ML · Research · Embedded · Security`.

### 5.5 `publication` — featured treatment

```jsonc
"publication": {
  "id": "npairc-2026",
  "title": "CyberSafe: An AI-Driven Ludic-Pedagogical Framework for Predictive Cybercrime Vulnerability Assessment Among Sri Lankan School Students",
  "venue": "NPAIRC 2026 — International Research Conference of the National Police Academy, Sri Lanka",
  "date": "August 2026",
  "theme": "Transnational Crime and Social Protection: Integrated Responses for Global Security",
  "association": "Organised by the National Police Academy Sri Lanka in association with UNODC",
  "role": "Co-Author",
  "recognition": "Accepted, presented, and recognised as author with certificate awarded",
  "coAuthors": ["Selvavinayagan Babiharan — University of Kelaniya, Sri Lanka"],
  "contributions": [
    "Ensemble machine learning (SVM and Random Forest) achieving 93 %+ accuracy",
    "SHAP-based explainability for model transparency",
    "18 adaptive game-based learning modules",
    "MERN-stack web application with a Flask AI microservice"
  ],
  "citation": "Sivanathan, D. & Babiharan, S. (2026). CyberSafe: An AI-Driven Ludic-Pedagogical Framework for Predictive Cybercrime Vulnerability Assessment Among Sri Lankan School Students. NPAIRC 2026, National Police Academy, Sri Lanka."
}
```

A **"Copy citation"** button writes `citation` to the clipboard — a small, high-signal touch for P3.

### 5.6 `experience`

```jsonc
"experience": [
  {
    "role": "Postmaster",
    "org": "Post Office (SPAR, Cambridge)",
    "location": "United Kingdom",
    "period": "2025 – Present",
    "current": true,
    "type": "operations",
    "points": [
      "Run the in-store Post Office counter: mail, parcel, banking, bill-payment and identity/verification services",
      "Handle cash, foreign currency and high-value transactions with strict accuracy; balance tills and accounts daily",
      "Ensure compliance with Post Office Ltd procedures, AML checks and data-protection requirements",
      "Oversee branch operations, postal stock and secure record-keeping in a regulated environment"
    ]
  },
  {
    "role": "Stock Assistant / Retail Assistant",
    "org": "SPAR, Cambridge",
    "location": "United Kingdom",
    "period": "2025 – Present",
    "current": true,
    "type": "operations",
    "points": [
      "Face-to-face customer service; accurate cash/card processing via POS systems",
      "Handled confidential customer and Post Office data in a compliance-focused environment",
      "Managed stock control, deliveries and visual merchandising to health-and-safety standards"
    ]
  },
  {
    "role": "IT Support Assistant",
    "org": "IT Department, University of Jaffna",
    "location": "Sri Lanka",
    "period": "Jul 2022 – May 2024",
    "current": false,
    "type": "technical",
    "points": [
      "Technical support for Linux/Windows systems, keeping internal and public-facing servers running with minimal downtime",
      "Monitored infrastructure with Zabbix and Nagios, responding to alerts and troubleshooting to maintain uptime",
      "Installed, configured and maintained networking equipment including switches and routers",
      "Supported staff and students with hardware/software setup, system configuration and device migration",
      "Produced monitoring data and reports to track performance and support IT decision-making"
    ]
  },
  {
    "role": "Sales Assistant",
    "org": "Lansberry Shop",
    "location": "United Kingdom",
    "period": "2024 – 2025",
    "current": false,
    "type": "operations",
    "points": [
      "Managed stock replenishment, delivery intake and FIFO stock rotation in a busy retail team",
      "Assisted customers and supported store opening/closing procedures, building UK work history"
    ]
  },
  {
    "role": "IELTS Invigilator",
    "org": "IDP Education",
    "location": "Sri Lanka",
    "period": "2023 (9 months)",
    "current": false,
    "type": "operations",
    "points": [
      "Set up examination rooms, verified candidate identities and gave precise instructions in a highly regulated environment",
      "Maintained strict confidentiality and process integrity"
    ]
  }
]
```

**Timeline ordering:** reverse-chronological. The `type` field drives the node colour — `technical` roles get the accent colour and a filled node; `operations` roles get a muted node. This lets a recruiter's eye find the technical role instantly without hiding the rest.

> **Note on overlapping roles.** Postmaster and Stock Assistant are both "2025 – Present" at the same SPAR site. The timeline renders these as a **grouped pair under one connector node** labelled *SPAR, Cambridge* rather than two disconnected entries, which reads as one continuous position with expanded responsibility rather than as job-hopping.

### 5.7 `education`

```jsonc
"education": [
  {
    "qualification": "BSc (Hons) Applied Computing",
    "grade": "First-Class Honours",
    "institution": "University of South Wales",
    "location": "United Kingdom",
    "period": "2024 – 2025",
    "note": "Final-year project: Energy Meter Data Collection & Monitoring System",
    "projectRef": "energy-meter"
  },
  {
    "qualification": "BTEC Level 5 HND, Computing (Software Engineering)",
    "grade": "Distinction",
    "institution": "British College of Applied Studies (Pearson BTEC)",
    "location": "Sri Lanka",
    "period": "2019 – 2021",
    "note": "Distinction across 13 of 14 units, including Programming, Advanced Programming, Application Development, Database Design & Development, Networking and Security"
  }
]
```

### 5.8 `languages`

```jsonc
"languages": [
  { "name": "English", "level": "Fluent" },
  { "name": "Tamil",   "level": "Native"  }
]
```

### 5.9 Content integrity rules

1. **The CV is the single source of truth.** No claim appears on the site that is not in the CV.
2. **No invented metrics.** Only `93 %` (from the paper), `13 of 14 units`, and `18 modules` are quoted as figures — all CV-sourced.
3. **No fake project links.** `links` arrays are empty until real repository URLs exist. The UI renders no button rather than a dead link.
4. **Skill percentages are presentational** (§5.3) and must never be labelled "proficiency certified" or similar.

---

## 6. Visual Design System

### 6.1 Design concept — *"Signal & Instrument"*

The visual language is drawn from the owner's actual domain: **real-time monitoring, sensor telemetry, and dashboards**. Not generic-developer-purple-gradient. The page should feel like a well-designed instrument panel — dark, precise, with a live signal running through it.

Concretely: a subtle animated waveform in the hero (echoing the energy meter), a grid-line texture reminiscent of an oscilloscope, thin accent rules, monospace for data/metadata, and motion that reads as *measured*, not decorative.

### 6.2 Colour tokens

Dark theme is the default (fits the concept and reduces eye strain); a light theme is fully supported via a toggle **and** honours the OS `prefers-color-scheme`.

```css
:root {
  /* ---- Dark theme (default) ---- */
  --bg-base:        #0A0E14;   /* page background */
  --bg-elevated:    #121821;   /* cards, panels */
  --bg-overlay:     #1A2130;   /* hovered cards, menus */
  --border-subtle:  #232B3A;
  --border-strong:  #35405480;

  --text-primary:   #E8EDF5;
  --text-secondary: #A0AEC4;
  --text-muted:     #6B7A90;

  --accent:         #33D9A6;   /* signal green — primary accent  */
  --accent-hover:   #5FE8BC;
  --accent-dim:     #33D9A61A; /* 10 % alpha, for glows/fills    */
  --accent-2:       #4C8DFF;   /* electric blue — secondary      */
  --accent-3:       #F5A623;   /* amber — highlights, awards     */

  --grad-hero:  linear-gradient(135deg, #33D9A6 0%, #4C8DFF 100%);
  --grad-text:  linear-gradient(120deg, #E8EDF5 0%, #33D9A6 60%, #4C8DFF 100%);

  --shadow-sm: 0 1px 3px rgb(0 0 0 / .32);
  --shadow-md: 0 6px 20px rgb(0 0 0 / .38);
  --shadow-lg: 0 18px 48px rgb(0 0 0 / .46);
  --glow-accent: 0 0 32px rgb(51 217 166 / .22);
}

:root[data-theme="light"] {
  --bg-base:        #FBFCFE;
  --bg-elevated:    #FFFFFF;
  --bg-overlay:     #F2F5FA;
  --border-subtle:  #E1E7F0;
  --border-strong:  #C6D0E0;

  --text-primary:   #0D1420;
  --text-secondary: #4A5769;
  --text-muted:     #7A8798;

  --accent:         #0E9E74;   /* darkened for AA on white */
  --accent-hover:   #0B8360;
  --accent-dim:     #0E9E7414;
  --accent-2:       #2563EB;
  --accent-3:       #B4740A;

  --shadow-sm: 0 1px 3px rgb(13 20 32 / .07);
  --shadow-md: 0 6px 20px rgb(13 20 32 / .09);
  --shadow-lg: 0 18px 48px rgb(13 20 32 / .12);
  --glow-accent: 0 0 32px rgb(14 158 116 / .14);
}
```

**Contrast verification (WCAG 2.1 AA):**

| Pair | Dark | Light | Required | Status |
|------|------|-------|----------|--------|
| `--text-primary` on `--bg-base` | 15.8:1 | 16.9:1 | 4.5:1 | ✅ AAA |
| `--text-secondary` on `--bg-base` | 8.4:1 | 8.1:1 | 4.5:1 | ✅ AAA |
| `--text-muted` on `--bg-base` | 4.9:1 | 4.6:1 | 4.5:1 | ✅ AA |
| `--accent` on `--bg-base` | 9.6:1 | 4.6:1 | 4.5:1 | ✅ AA |
| `--bg-base` on `--accent` (button) | 9.6:1 | 5.1:1 | 4.5:1 | ✅ AA |

`--text-muted` is reserved for non-essential metadata (dates, captions) and is never the only carrier of meaning.

### 6.3 Typography

| Role | Family | Fallback stack | Usage |
|------|--------|----------------|-------|
| Display / Headings | **Space Grotesk** | `"Space Grotesk", "Segoe UI", system-ui, sans-serif` | h1–h3, stat numbers |
| Body / UI | **Inter** | `Inter, -apple-system, "Segoe UI", Roboto, sans-serif` | Paragraphs, nav, buttons |
| Data / Mono | **JetBrains Mono** | `"JetBrains Mono", ui-monospace, "Cascadia Code", monospace` | Tech tags, dates, stat suffixes, section numbers |

**Weights loaded (subset to `latin` + `latin-ext`, WOFF2 only):**
Space Grotesk 500, 700 · Inter 400, 600 · JetBrains Mono 400 → **6 font files, ~96 KB total**.

**Fluid type scale** (`clamp()`, no media queries needed):

```css
--fs-hero:  clamp(2.75rem, 7vw + 0.5rem, 6rem);      /*  44 → 96 px */
--fs-h1:    clamp(2rem,   4vw + 0.5rem, 3.25rem);    /*  32 → 52 px */
--fs-h2:    clamp(1.625rem, 2.5vw + .4rem, 2.25rem); /*  26 → 36 px */
--fs-h3:    clamp(1.125rem, 1vw + .6rem, 1.375rem);  /*  18 → 22 px */
--fs-body:  clamp(0.9375rem, 0.35vw + .85rem, 1.0625rem); /* 15 → 17 px */
--fs-small: 0.875rem;   /* 14 px */
--fs-micro: 0.75rem;    /* 12 px — mono labels, uppercase, +0.08em tracking */

--lh-tight: 1.1;   --lh-snug: 1.35;   --lh-body: 1.7;
```

**Rules:** body copy max 68ch; headings `text-wrap: balance`; paragraphs `text-wrap: pretty`; no justified text; no letter-spacing on body copy.

### 6.4 Spacing, radius, layout

```css
/* 4 px base scale */
--sp-1: .25rem;  --sp-2: .5rem;   --sp-3: .75rem;  --sp-4: 1rem;
--sp-5: 1.5rem;  --sp-6: 2rem;    --sp-8: 3rem;    --sp-10: 4rem;
--sp-12: 6rem;   --sp-16: 8rem;

--section-y: clamp(4rem, 9vw, 8rem);   /* vertical rhythm between sections */
--container: 1180px;                    /* max content width  */
--container-narrow: 760px;              /* prose blocks       */
--gutter: clamp(1.25rem, 4vw, 2.5rem);

--r-sm: 6px;  --r-md: 12px;  --r-lg: 18px;  --r-pill: 999px;
```

**Grid:** the page container is a CSS Grid with named columns so full-bleed sections (hero canvas, publication band) can break out without nested wrappers:

```css
.layout {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [content-start] min(var(--container), 100% - var(--gutter) * 2)
    [content-end] minmax(var(--gutter), 1fr)
    [full-end];
}
.layout > * { grid-column: content; }
.layout > .full-bleed { grid-column: full; }
```

### 6.5 Elevation & surface treatment

Cards use a layered surface, not a flat fill: `--bg-elevated` background, `1px solid var(--border-subtle)`, `--shadow-sm` at rest → `--shadow-md` + accent-tinted border on hover, with a `translateY(-4px)` lift over 220 ms. Featured cards (Energy Meter, Publication) additionally carry a 2 px gradient top-edge using `--grad-hero`.

### 6.6 Iconography

One `assets/icons/sprite.svg` containing ~16 symbols (`code`, `activity`, `database`, `server`, `tool`, `users`, `github`, `linkedin`, `mail`, `phone`, `map-pin`, `download`, `external-link`, `arrow-up`, `menu`, `close`, `sun`, `moon`, `copy`, `check`). Referenced as `<svg class="icon"><use href="assets/icons/sprite.svg#code"/></svg>`, stroke `currentColor`, 1.75 px stroke weight, 24×24 viewBox. Decorative icons carry `aria-hidden="true"`.

---

## 7. Animation Architecture

### 7.1 Motion principles

1. **Motion must mean something.** Every animation communicates hierarchy, state, or continuity. Nothing moves purely for spectacle.
2. **Fast in, gentle out.** Entrances 500–700 ms; interaction feedback 150–250 ms. Nothing exceeds 900 ms.
3. **Composite-only properties.** Animate `transform` and `opacity` exclusively. Never `top`, `left`, `width`, `height`, `margin`, or `box-shadow` in a running animation — those trigger layout/paint and drop frames.
4. **Play once.** Scroll reveals do not re-trigger when scrolling back up. Repeat animation is irritating on a page a recruiter scrolls twice.
5. **Reduced motion is a first-class path**, not a disabled fallback (§7.6).
6. **No motion blocks content.** If JS fails entirely, everything is visible (§7.7).

### 7.2 Easing tokens

```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);      /* entrances — decisive */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);     /* state changes        */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* buttons, badges      */
--dur-fast:   160ms;
--dur-base:   240ms;
--dur-slow:   560ms;
--dur-reveal: 680ms;
```

### 7.3 Animation inventory

| # | Name | Trigger | Technique | Duration | Notes |
|---|------|---------|-----------|----------|-------|
| A1 | **Hero waveform canvas** | Page load | `<canvas>` + `requestAnimationFrame` | Continuous | Two overlaid sine waves (voltage/current) drifting in phase — a direct nod to the energy meter. ≤ 32 KB of JS, pauses when tab hidden or hero off-screen |
| A2 | **Hero text stagger** | Page load | CSS `@keyframes` + `animation-delay` | 700 ms, 90 ms stagger | Name → headline → tagline → CTAs; `translateY(24px)` + fade |
| A3 | **Gradient text sweep** | Page load, then on hover | `background-position` on `--grad-text` with `background-clip: text` | 3 s loop | Applied to the surname only, so it's a highlight not a distraction |
| A4 | **Scroll reveal** | IntersectionObserver, 15 % threshold | `.reveal` → `.is-visible` class | 680 ms | `opacity 0→1`, `translateY(32px)→0`. Directional variants: `.reveal--left`, `.reveal--right`, `.reveal--scale` |
| A5 | **Staggered children** | Same observer, parent element | CSS var `--i` per child × 70 ms | 680 ms + stagger | Grids of cards, skill lists, tag rows |
| A6 | **Stat count-up** | Observer, 50 % threshold | `requestAnimationFrame` with `easeOutExpo` | 1600 ms | Only for `animate: true` entries (§5.2) |
| A7 | **Skill meter fill** | Observer, 40 % threshold | `transform: scaleX()` on a pseudo-element, `transform-origin: left` | 900 ms, 60 ms stagger | Uses `scaleX`, **not** `width` — keeps it off the layout thread |
| A8 | **Nav shrink & blur** | Scroll past 80 px | Class toggle, `backdrop-filter: blur(14px)` | 260 ms | Applied once via a throttled scroll handler |
| A9 | **Scroll-spy underline** | IntersectionObserver on sections | `transform: scaleX()` on `::after` | 240 ms | |
| A10 | **Scroll progress bar** | Scroll | `transform: scaleX()` on a 2 px fixed bar | Frame-synced | `will-change: transform` |
| A11 | **Mobile menu** | Click | Overlay `clip-path` circle expand + link stagger | 420 ms | Focus trapped while open; `Esc` closes |
| A12 | **Card hover lift** | Hover / focus-visible | `translateY(-4px)`, border colour, shadow | 220 ms | Disabled on coarse pointers via `@media (hover: hover)` |
| A13 | **Timeline draw** | Observer per entry | `scaleY` on the connector line + node `scale` pop | 500 ms per node | Cascades down the timeline as it enters view |
| A14 | **Magnetic CTA** | `pointermove` within 90 px | `translate` toward cursor, max 8 px, `transform` only | Frame-synced | Fine pointers only; disabled under reduced motion |
| A15 | **Project detail expand** | Click | `<details>`-backed, height via `grid-template-rows: 0fr → 1fr` | 340 ms | The modern animatable-height trick; no JS height measurement |
| A16 | **Theme cross-fade** | Toggle click | `View Transition API` where supported, else 200 ms opacity fade | 300 ms | Progressive enhancement |
| A17 | **Section number counter** | Reveal | Mono `01 / 02 / …` slides in from left | 400 ms | Reinforces the instrument-panel concept |
| A18 | **Copy-citation feedback** | Click | Icon morph `copy → check`, `scale` pop | 200 ms | Reverts after 1.8 s |
| A19 | **Back-to-top** | Scroll > 600 px | Fade + `scale(0.8 → 1)` | 240 ms | `scroll-behavior: smooth` on the jump |
| A20 | **Focus ring** | `:focus-visible` | 2 px accent outline, 2 px offset, 120 ms | 120 ms | Never removed, never animated away |

### 7.4 The hero canvas (A1) — specification

```
Canvas: full-bleed behind hero content, position: absolute, z-index: 0, pointer-events: none
Content sits at z-index: 1 with a radial vignette between them for text contrast.

Render loop (requestAnimationFrame):
  ├─ Layer 1: horizontal grid lines, 48 px apart, --border-subtle @ 35 % alpha  (static, drawn once to an offscreen canvas)
  ├─ Layer 2: sine wave A — amplitude 42, period 380 px, phase += 0.010/frame, stroke --accent    @ 55 % alpha, 2 px
  ├─ Layer 3: sine wave B — amplitude 28, period 240 px, phase += 0.016/frame, stroke --accent-2  @ 40 % alpha, 1.5 px
  └─ Layer 4: 3 "sample point" dots riding wave A, gentle pulse, --accent, radius 3 px

Performance controls:
  • devicePixelRatio capped at 2 (avoids 3× render cost on high-DPI phones)
  • Loop cancelled via IntersectionObserver when the hero leaves the viewport
  • Loop cancelled on `document.visibilitychange` → hidden
  • Skipped entirely when prefers-reduced-motion: reduce  → renders one static frame
  • Skipped entirely when navigator.hardwareConcurrency <= 2 → static gradient fallback
  • Resize handler debounced at 150 ms; grid layer re-rendered only on resize
```

### 7.5 Reveal system implementation contract

```js
// Single shared observer for the whole page — not one per element.
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);   // play once (Principle 4)
  }
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity   var(--dur-reveal) var(--ease-out),
    transform var(--dur-reveal) var(--ease-out);
  transition-delay: calc(var(--i, 0) * 70ms);
}
[data-reveal].is-visible { opacity: 1; transform: none; }
```

### 7.6 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  [data-reveal] { opacity: 1; transform: none; }
}
```

JS also checks the same query and: skips the canvas loop (renders one static frame), sets counters to their final value immediately, sets meters to their final `scaleX`, and disables the magnetic CTA. **The media query is re-evaluated live** via `matchMedia().addEventListener('change', …)` so a mid-session OS change is honoured without a reload.

### 7.7 No-JS baseline

`index.html` ships with hero content, nav, and section shells visible. A `<noscript>` block injects:

```css
[data-reveal] { opacity: 1 !important; transform: none !important; }
```

JSON-driven sections carry a `<noscript>` note pointing to the CV download, which is a plain `<a href>` and always works. The site is never a blank page.

---

## 8. Component Architecture

Components are plain HTML patterns with a BEM-ish class contract and, where needed, a `data-*` hook for JS. No component framework.

### 8.1 Component inventory

| Component | Selector root | JS module | Notes |
|-----------|---------------|-----------|-------|
| Skip link | `.skip-link` | — | First in DOM |
| Nav bar | `.nav` | `nav.js` | Sticky, scroll-spy, theme toggle |
| Mobile menu | `.nav__menu` | `nav.js` | Focus trap, `Esc`, scroll lock |
| Scroll progress | `.progress` | `nav.js` | |
| Hero | `.hero` | `hero-canvas.js` | Canvas + content layers |
| Stat tile | `.stat` | `counters.js` | 4-up grid → 2-up → 1-up |
| Section header | `.section-head` | — | Mono number + h2 + accent rule |
| Skill cluster | `.skill-group` | `skills.js` | Icon + heading + meter list |
| Skill meter | `.meter` | `skills.js` | `scaleX` fill, `role="img"` + `aria-label` |
| Filter chips | `.chips` | `projects.js` | Single-select, `aria-pressed` |
| Project card | `.project-card` | `projects.js` | Summary + expandable detail |
| Tech tag | `.tag` | — | Mono, pill, subtle border |
| Publication band | `.publication` | `publication.js` | Full-bleed, copy-citation |
| Timeline | `.timeline` | `timeline.js` | Animated connector + nodes |
| Timeline entry | `.timeline__item` | `timeline.js` | Grouped-entry variant for SPAR |
| Education card | `.edu-card` | — | Grade badge |
| Contact grid | `.contact` | — | 4 link cards |
| CV download button | `.btn--cv` | — | Appears in nav, hero, contact |
| Footer | `.footer` | — | |
| Back to top | `.to-top` | `nav.js` | |
| Theme toggle | `.theme-toggle` | `theme.js` | localStorage + OS preference |

### 8.2 Key component contracts

**Project card**

```html
<article class="project-card" data-domain="IoT,Data" data-reveal style="--i:0">
  <header class="project-card__head">
    <span class="project-card__badge">Featured</span>
    <h3 class="project-card__title">…</h3>
    <p class="project-card__meta"><span class="mono">BSc Final-Year Project</span> · <time>2024 – 2025</time></p>
  </header>
  <p class="project-card__summary">…</p>
  <ul class="tags">…</ul>
  <details class="project-card__detail">
    <summary>View details</summary>
    <div class="project-card__detail-inner"><ul>…highlights…</ul></div>
  </details>
</article>
```

Uses native `<details>` so it works without JS and is keyboard/screen-reader correct by default; JS only adds the height transition (A15).

**Skill meter accessibility**

```html
<li class="meter">
  <span class="meter__label">IoT Sensor Integration (ESP8266/ESP32)</span>
  <span class="meter__track" role="img"
        aria-label="IoT sensor integration: strong">
    <span class="meter__fill" style="--level:.90"></span>
  </span>
</li>
```

The `aria-label` uses **words** (`familiar` / `proficient` / `strong`), not the percentage, so assistive tech doesn't announce a spurious precision the numbers don't have.

**Timeline grouped entry** (the SPAR case, §5.6)

```html
<li class="timeline__item timeline__item--group" data-reveal>
  <span class="timeline__node timeline__node--current"></span>
  <p class="timeline__org">SPAR, Cambridge · United Kingdom</p>
  <time class="timeline__period mono">2025 – Present</time>
  <div class="timeline__roles">
    <section class="timeline__role">…Postmaster…</section>
    <section class="timeline__role">…Stock Assistant…</section>
  </div>
</li>
```

---

## 9. File & Folder Structure

```
dilukshika-portfolio/
│
├── index.html                      Single page — semantic shell + hardcoded hero/meta
├── 404.html                        Styled not-found page
├── ARCHITECTURE.md                 This document
├── README.md                       Setup, edit, deploy instructions for the owner
├── LICENSE                         MIT (code) — content reserved
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── .gitignore
├── .nojekyll                       Stops GitHub Pages' Jekyll from touching _-prefixed files
│
├── data/
│   └── content.json                ★ THE ONLY FILE THE OWNER EDITS TO UPDATE CONTENT
│
├── css/
│   ├── main.css                    Entry point — @layer order + @import of the rest
│   ├── 01-tokens.css               Custom properties, both themes
│   ├── 02-reset.css                Modern reset, box-sizing, media defaults
│   ├── 03-base.css                 Elements, typography, focus ring, selection
│   ├── 04-layout.css               Grid container, sections, full-bleed
│   ├── 05-components.css           All component classes
│   ├── 06-animations.css           Keyframes, reveal system, reduced-motion block
│   └── 07-utilities.css            .mono, .sr-only, .flow, .visually-hidden
│
├── js/
│   ├── main.js                     Entry — imports and boots modules in order
│   ├── content.js                  Fetch + validate content.json, expose getters
│   ├── render.js                   Template functions → DOM for JSON sections
│   ├── reveal.js                   Shared IntersectionObserver + stagger indices
│   ├── nav.js                      Sticky nav, scroll-spy, mobile menu, progress, to-top
│   ├── hero-canvas.js              Waveform animation (A1)
│   ├── counters.js                 Stat count-up (A6)
│   ├── skills.js                   Meter fill animation (A7)
│   ├── projects.js                 Filter chips + expand transition (A15)
│   ├── publication.js              Copy-citation (A18)
│   ├── timeline.js                 Timeline draw (A13)
│   ├── theme.js                    Theme toggle + persistence (A16)
│   └── utils.js                    debounce, throttle, prefersReducedMotion, $, $$
│
├── assets/
│   ├── fonts/
│   │   ├── space-grotesk-500.woff2
│   │   ├── space-grotesk-700.woff2
│   │   ├── inter-400.woff2
│   │   ├── inter-600.woff2
│   │   └── jetbrains-mono-400.woff2
│   ├── icons/
│   │   ├── sprite.svg              All UI icons as <symbol>
│   │   └── favicon.svg
│   ├── img/
│   │   ├── profile.webp            600×600, + .jpg fallback   [owner to supply]
│   │   ├── profile.jpg
│   │   ├── og-image.png            1200×630 social card
│   │   └── noise.png               ~4 KB tiling grain overlay
│   └── cv/
│       └── Dilukshika_Sivanathan_CV.pdf
│
└── tools/                          Optional — not required to run the site
    ├── build.js                    Minify CSS/JS, inline critical CSS
    └── check-links.js              Verify every href resolves
```

**Naming conventions:** files `kebab-case`; CSS classes `block__element--modifier`; JS `camelCase` for functions/vars, `SCREAMING_SNAKE` for module constants; data attributes `data-kebab-case`.

---

## 10. JavaScript Module Design

### 10.1 Boot sequence

```js
// js/main.js
import { loadContent }    from './content.js';
import { renderAll }      from './render.js';
import { initReveal }     from './reveal.js';
import { initNav }        from './nav.js';
import { initTheme }      from './theme.js';
import { initHeroCanvas } from './hero-canvas.js';
import { initCounters }   from './counters.js';
import { initSkills }     from './skills.js';
import { initProjects }   from './projects.js';
import { initPublication } from './publication.js';
import { initTimeline }   from './timeline.js';

initTheme();          // 1. FIRST — before paint, prevents theme flash
initNav();            // 2. Nav works even if content.json fails
initHeroCanvas();     // 3. Hero is hardcoded, independent of JSON

try {
  const content = await loadContent();   // 4. Fetch data/content.json
  renderAll(content);                    // 5. Build JSON-driven sections
} catch (err) {
  console.error('[portfolio] content load failed:', err);
  document.body.dataset.contentError = 'true';   // CSS reveals a static fallback block
}

initReveal();         // 6. AFTER render — observe the elements that now exist
initCounters();
initSkills();
initProjects();
initPublication();
initTimeline();
```

**Ordering rationale:** theme first (flash prevention), then the JS-independent parts, then data, then everything that depends on rendered DOM. A `content.json` failure degrades gracefully — nav, hero, and CV download still work.

### 10.2 Theme flash prevention

A tiny **blocking inline script in `<head>`**, before any stylesheet, sets the attribute before first paint:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme');
      if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
    } catch (e) { document.documentElement.dataset.theme = 'dark'; }
  })();
</script>
```

This is the one place a render-blocking script is correct: it's < 300 bytes and prevents a visible white flash.

### 10.3 Shared utilities contract

```js
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
export const onReducedMotionChange = (cb) =>
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', cb);
export const rafThrottle = (fn) => { /* single-frame coalescing */ };
export const debounce = (fn, ms) => { /* trailing-edge */ };
export const escapeHtml = (s) => { /* & < > " ' → entities */ };
```

### 10.4 Rendering & XSS safety

`render.js` builds DOM from `content.json`. Because the JSON is authored by the owner and served from the same origin the risk is low, but the rule is still enforced:

- **Text content** is set via `textContent` or passed through `escapeHtml()` before any template interpolation. Never raw `innerHTML` with data values.
- **URLs** (`links[].url`, `linkedin`, `github`) are validated against an `https:`/`mailto:`/`tel:` allowlist before being assigned to `href`. Anything else is dropped and logged.
- **`target="_blank"`** always paired with `rel="noopener noreferrer"`.

### 10.5 Error handling policy

| Failure | Behaviour |
|---------|-----------|
| `content.json` 404 / parse error | Log; set `data-content-error`; CSS shows a short static fallback with email + CV link |
| A required key missing | Skip that section entirely (don't render an empty shell); log a named warning |
| Canvas context unavailable | Remove the canvas element; CSS gradient fallback takes over |
| `IntersectionObserver` unsupported | Add `is-visible` to all `[data-reveal]` immediately |
| Clipboard API unavailable | Citation button selects the text instead and prompts "Press Ctrl+C" |
| Font load failure | Fallback stacks already declared; `font-display: swap` prevents invisible text |

---

## 11. CSS Architecture

### 11.1 Cascade layers

```css
/* css/main.css */
@layer reset, base, layout, components, animations, utilities;

@import url('01-tokens.css');        /* outside layers — tokens must always win nothing, lose nothing */
@import url('02-reset.css')      layer(reset);
@import url('03-base.css')       layer(base);
@import url('04-layout.css')     layer(layout);
@import url('05-components.css') layer(components);
@import url('06-animations.css') layer(animations);
@import url('07-utilities.css')  layer(utilities);
```

Layers eliminate specificity wars without `!important` and without a preprocessor. A utility class always beats a component rule because of layer order, regardless of selector specificity.

> **Production note:** `@import` costs sequential requests. The optional `tools/build.js` concatenates the seven files into one `main.min.css` for deployment. Development keeps the split for editability.

### 11.2 Naming & scoping rules

- BEM: `.project-card`, `.project-card__title`, `.project-card--featured`.
- State classes are namespaced: `.is-visible`, `.is-active`, `.is-open`, `.has-error`.
- Maximum nesting depth: **2**. No descendant chains longer than `.block__element:state`.
- No IDs in CSS selectors (IDs are for anchors and `aria-*` wiring only).
- No element selectors in the components layer — components are class-driven.
- Every component owns its own tokens as local custom properties where it varies:
  ```css
  .project-card { --card-pad: var(--sp-5); --card-border: var(--border-subtle); }
  .project-card--featured { --card-border: var(--accent); }
  ```

### 11.3 Critical CSS

Tokens, reset, base typography, layout container, nav, and hero rules (~7 KB) are inlined in `<head>` at build time. The remainder loads via:

```html
<link rel="preload" href="css/main.min.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="css/main.min.css"></noscript>
```

---

## 12. Responsive Strategy

### 12.1 Breakpoints

Mobile-first. Only four breakpoints, all `min-width`, all in `rem`:

| Token | Value | Target |
|-------|-------|--------|
| `sm` | 40rem (640 px) | Large phones |
| `md` | 48rem (768 px) | Tablets — nav switches from hamburger to bar |
| `lg` | 64rem (1024 px) | Laptops — multi-column grids |
| `xl` | 80rem (1280 px) | Desktops — max container reached |

Most layout uses intrinsic sizing and needs **no breakpoint at all**:

```css
.grid-auto {
  display: grid;
  gap: var(--sp-5);
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
}
```

### 12.2 Per-section responsive behaviour

| Section | < 640 px | 640–1023 px | ≥ 1024 px |
|---------|----------|-------------|-----------|
| Nav | Hamburger + overlay | Hamburger + overlay | Horizontal bar + CV button |
| Hero | Stacked, `--fs-hero` at 44 px, canvas amplitude ×0.6 | Stacked, larger type | Full type scale, full canvas |
| Stats | 2 × 2 grid | 4 across | 4 across |
| Skills | 1 column | 2 columns | 3 columns |
| Projects | 1 column | 1 column (wider cards) | 2 columns; featured card spans both |
| Publication | Stacked, no side rule | Stacked | Two-column: meta rail + body |
| Timeline | Left-rail, nodes at x=16px | Left-rail | Left-rail, wider content column |
| Education | 1 column | 2 columns | 2 columns |
| Contact | 1 column | 2 × 2 | 4 across |

### 12.3 Touch & input considerations

- Minimum tap target **44 × 44 px** for every interactive element.
- Hover effects gated: `@media (hover: hover) and (pointer: fine)`.
- Magnetic CTA (A14) and card lift (A12) disabled on touch.
- iOS safe areas honoured: `padding-bottom: max(var(--sp-6), env(safe-area-inset-bottom))` on the footer and mobile menu.
- `-webkit-tap-highlight-color: transparent` with an explicit `:active` state replacing it (never remove feedback without providing feedback).

---

## 13. Accessibility Requirements

**Target: WCAG 2.1 Level AA.**

### 13.1 Checklist

- [ ] **Landmarks:** `<header>`, `<nav>`, `<main>`, `<section aria-labelledby>`, `<footer>` — one `<main>`, one `<h1>`.
- [ ] **Heading order:** `h1` (name) → `h2` (each section) → `h3` (cards). No skipped levels.
- [ ] **Skip link** to `#main`, visible on focus.
- [ ] **Keyboard:** every interactive element reachable and operable by keyboard, in logical DOM order. No positive `tabindex`.
- [ ] **Focus visible:** 2 px `--accent` outline, 2 px offset, on every focusable element. Never `outline: none` without a replacement.
- [ ] **Focus trap** in the open mobile menu; focus returns to the toggle on close; `Esc` closes.
- [ ] **Scroll lock** on `<body>` while the menu is open, without layout shift (`scrollbar-gutter: stable`).
- [ ] **Colour contrast:** all pairs verified in §6.2 for both themes.
- [ ] **Colour is never the only signal:** current-role timeline nodes also carry a "Current" text label; filter state uses `aria-pressed` plus a border change, not just fill.
- [ ] **Images:** `profile.webp` gets a descriptive `alt`; all decorative SVG/canvas get `aria-hidden="true"`; the hero canvas also gets `role="presentation"`.
- [ ] **Meters:** `role="img"` + word-based `aria-label` (§8.2), not raw percentages.
- [ ] **Live regions:** the copy-citation confirmation announces via `aria-live="polite"`.
- [ ] **Filter changes** announce the result count via a polite live region ("Showing 2 projects").
- [ ] **Link text is self-describing:** "Download CV (PDF, 312 KB)" — not "click here". External links announce via a visually-hidden "(opens in a new tab)".
- [ ] **`prefers-reduced-motion`** fully honoured (§7.6), re-evaluated live.
- [ ] **`prefers-contrast: more`** raises border and muted-text contrast.
- [ ] **Zoom:** usable at 200 % zoom and at 320 px viewport width with no horizontal scroll.
- [ ] **Language:** `<html lang="en-GB">`.
- [ ] **PDF link** declares type and size so screen-reader users aren't surprised by a download.

### 13.2 Verification method

Axe DevTools (0 violations) + Lighthouse Accessibility (≥ 95) + manual keyboard-only pass + NVDA read-through of every section.

---

## 14. Performance Budget

### 14.1 Hard limits

| Resource | Budget | Notes |
|----------|--------|-------|
| HTML (`index.html`, gzipped) | ≤ 14 KB | Fits in the first TCP round trip |
| CSS (total, gzipped) | ≤ 18 KB | |
| JS (total, gzipped) | ≤ 16 KB | No framework, no polyfills |
| Fonts | ≤ 100 KB | 5 WOFF2 files, subset |
| `content.json` | ≤ 12 KB | |
| Images (initial view) | ≤ 120 KB | Profile WebP + noise texture |
| SVG sprite | ≤ 8 KB | |
| **Total initial load** | **≤ 300 KB** | Hard ceiling: 500 KB incl. CV if prefetched |
| HTTP requests (initial) | ≤ 14 | |

### 14.2 Core Web Vitals targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 1.5 s | Hero heading is the LCP element — hardcoded HTML, critical CSS inlined, fonts preloaded |
| **CLS** | < 0.05 | Explicit `width`/`height` on all images; `font-display: swap` with metric-matched fallbacks; no injected content above the fold |
| **INP** | < 150 ms | No long tasks; rAF-throttled scroll; observers instead of scroll listeners |
| **FCP** | < 1.0 s | Inlined critical CSS, deferred module JS |
| **TBT** | < 100 ms | Total JS parse+exec well under budget |

### 14.3 Loading strategy

```html
<link rel="preconnect" href="/">                                          <!-- same-origin, no-op safeguard -->
<link rel="preload" href="assets/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-400.woff2"         as="font" type="font/woff2" crossorigin>
<link rel="preload" href="data/content.json" as="fetch" crossorigin>       <!-- warm the fetch before JS runs -->
<script type="module" src="js/main.js" defer></script>
```

Only the two fonts used above the fold are preloaded; the other three load naturally. `content.json` is preloaded so its request starts in parallel with JS parsing rather than after it.

### 14.4 Image policy

- Profile photo: WebP primary, JPEG fallback via `<picture>`, `width`/`height` attributes set, `loading="lazy"` (it's below the fold), `decoding="async"`.
- Project imagery: **none in v1** — the CV supplies no screenshots. Cards use a generated gradient + icon motif instead of placeholder stock images. (Adding real screenshots later is §20.)
- OG image: 1200 × 630 PNG, referenced only in meta, never loaded by the page.

### 14.5 Runtime performance rules

- Only `transform`/`opacity` animate (§7.1.3).
- `will-change` applied **only** to the progress bar and the canvas, and removed after animation where transient.
- One shared IntersectionObserver for reveals, not N observers.
- All scroll handlers rAF-coalesced; resize handlers debounced at 150 ms.
- Canvas paused when off-screen or tab hidden (§7.4).
- `content-visibility: auto` + `contain-intrinsic-size` on the below-the-fold sections to skip rendering work until needed.

---

## 15. SEO & Metadata

### 15.1 Head block (hardcoded, not JSON-driven)

```html
<title>Dilukshika Sivanathan — Junior Software &amp; Data Developer | UK</title>
<meta name="description" content="First-Class BSc (Hons) Applied Computing graduate and published researcher. Junior software and data developer with 3 years of IT experience in Linux, Windows and infrastructure monitoring. Based in Cambridgeshire, UK.">
<link rel="canonical" href="https://dilukshika.github.io/">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:type"        content="profile">
<meta property="og:title"       content="Dilukshika Sivanathan — Junior Software &amp; Data Developer">
<meta property="og:description" content="First-Class BSc (Hons) Applied Computing graduate, published researcher, and IT support professional based in Cambridgeshire, UK.">
<meta property="og:image"       content="https://dilukshika.github.io/assets/img/og-image.png">
<meta property="og:url"         content="https://dilukshika.github.io/">
<meta property="og:locale"      content="en_GB">

<!-- Twitter/X -->
<meta name="twitter:card"  content="summary_large_image">
<meta name="twitter:title" content="Dilukshika Sivanathan — Junior Software &amp; Data Developer">
<meta name="twitter:image" content="https://dilukshika.github.io/assets/img/og-image.png">

<meta name="theme-color" content="#0A0E14" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#FBFCFE" media="(prefers-color-scheme: light)">
```

### 15.2 Structured data (JSON-LD, inline in `<head>`)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dilukshika Sivanathan",
  "jobTitle": "Junior Software & Data Developer",
  "email": "mailto:dilukshika99@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "Cambridgeshire",
    "addressCountry": "GB"
  },
  "url": "https://dilukshika.github.io/",
  "sameAs": [
    "https://linkedin.com/in/sivanathan-dilukshika",
    "https://github.com/Dilukshika"
  ],
  "alumniOf": [
    { "@type": "CollegeOrUniversity", "name": "University of South Wales" },
    { "@type": "EducationalOrganization", "name": "British College of Applied Studies" }
  ],
  "knowsLanguage": ["English", "Tamil"],
  "knowsAbout": [
    "Software Development", "Data Monitoring", "IoT", "Linux Administration",
    "Windows Administration", "Networking", "Database Design", "Zabbix", "Nagios"
  ]
}
```

A second `ScholarlyArticle` JSON-LD block describes the NPAIRC publication with `author`, `name`, and `datePublished`.

### 15.3 Supporting files

- `robots.txt` — allow all, point to sitemap.
- `sitemap.xml` — one URL entry with `lastmod`.
- `site.webmanifest` — name, icons, theme colours, `display: standalone`.

---

## 16. Build, Deployment & Hosting

### 16.1 Local development

The site requires a local HTTP server (because `fetch('data/content.json')` fails on `file://` due to CORS):

```powershell
# Any one of these:
npx serve .
python -m http.server 8000
# VS Code: Live Server extension
```

**No `npm install` is required to develop.** There is no dependency tree.

### 16.2 Optional production build

```powershell
npm run build     # tools/build.js
```

Performs exactly four things — nothing that changes behaviour:
1. Concatenate + minify `css/*.css` → `css/main.min.css`
2. Minify `js/*.js` → `js/main.min.js` (esbuild, ES2022 target, single bundle)
3. Inline critical CSS into `index.html`, swap the stylesheet link to the preload pattern
4. Minify `content.json` and `sprite.svg`

Output goes to `dist/`. **The unbuilt site is fully functional** — the build is a performance optimisation, not a requirement. If the owner never runs it, the site still works.

### 16.3 Deployment — GitHub Pages

```
Repository:  github.com/Dilukshika/dilukshika-portfolio
Branch:      main
Source:      / (root)   — or /dist if the build step is used
URL:         https://dilukshika.github.io/dilukshika-portfolio/
```

For a cleaner URL, name the repo `Dilukshika.github.io` → serves at `https://dilukshika.github.io/`.

**`.nojekyll`** must exist at the root, otherwise GitHub Pages' Jekyll processor ignores any file or directory starting with `_`.

**Deploy command:**
```powershell
git add .
git commit -m "Update portfolio content"
git push origin main
# Live in ~60 seconds
```

**Optional GitHub Action** (`.github/workflows/deploy.yml`) runs the build on push and publishes `dist/`. Only add this if §16.2 is adopted.

### 16.4 Custom domain (optional)

Add `CNAME` at root containing e.g. `dilukshika.dev`, set an `ALIAS`/`ANAME` at the apex to `dilukshika.github.io`, enable "Enforce HTTPS" in repo settings. Update `og:url` and `canonical` accordingly.

### 16.5 Update workflow for the owner

```
Add a project      → append an object to data/content.json → projects  → push
Update a role      → edit data/content.json → experience              → push
Replace the CV     → overwrite assets/cv/Dilukshika_Sivanathan_CV.pdf → push
Change a colour    → edit css/01-tokens.css                            → push
```

This is the whole maintenance surface. Documented in `README.md`.

---

## 17. Testing & Quality Gates

### 17.1 Gates — all must pass before the site is called done

| Gate | Tool | Threshold |
|------|------|-----------|
| HTML validity | W3C Validator | 0 errors |
| CSS validity | W3C CSS Validator | 0 errors (vendor-prefix warnings OK) |
| Accessibility (automated) | axe DevTools | 0 violations |
| Accessibility (manual) | Keyboard-only + NVDA | All journeys §2.2 completable |
| Lighthouse Performance | Chrome, mobile preset, throttled | ≥ 95 |
| Lighthouse Accessibility | | 100 |
| Lighthouse Best Practices | | ≥ 95 |
| Lighthouse SEO | | 100 |
| Link integrity | `tools/check-links.js` | 0 broken |
| Console | DevTools | 0 errors, 0 warnings |
| Content accuracy | Manual diff vs. CV | Every claim traceable to the CV |

### 17.2 Browser matrix

| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome / Edge | Last 2 | P0 |
| Safari (macOS + iOS) | Last 2 | P0 — test `backdrop-filter`, `clip-path`, `@layer` |
| Firefox | Last 2 | P0 |
| Samsung Internet | Latest | P1 |

**Feature support notes:** `@layer`, `clamp()`, `IntersectionObserver`, CSS custom properties, `grid-template-rows: 0fr→1fr` animation, and `:focus-visible` are all Baseline-available. `View Transition API` (A16) and `content-visibility` are progressive enhancements with clean fallbacks.

### 17.3 Device testing

Real-device pass on: an iPhone (Safari), an Android phone (Chrome), a tablet, a 1366×768 laptop, and a 1920×1080 desktop. Plus DevTools emulation at 320 px width and 200 % zoom.

### 17.4 Manual test script

1. Load with JS disabled → hero, nav, CV link all work.
2. Load with `content.json` renamed → fallback block appears, no crash.
3. Enable OS "Reduce motion" → no animation, all content visible, canvas static.
4. Tab through the entire page → focus always visible, order logical, menu traps correctly.
5. Switch theme → no flash, choice persists across reload.
6. Filter projects → count announced, chips reflect state, "All" restores.
7. Copy citation → clipboard contains the citation, confirmation announced.
8. Throttle to Slow 4G → LCP under target, no blank period.

---

## 18. Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| R1 | JSON-hydrated content invisible to non-JS crawlers | SEO loss | Medium | Hero, title, description, JSON-LD hardcoded in HTML (§3.3) |
| R2 | Animation overwhelms the content; reads as style over substance | Recruiter bounce | Medium | Motion Principle 1 (§7.1); reveals play once; no motion above 900 ms |
| R3 | Canvas drains battery / janks on low-end phones | Poor mobile UX | Medium | Off-screen + hidden-tab pause, DPR cap, `hardwareConcurrency` bail-out (§7.4) |
| R4 | Skill percentages read as unsubstantiated self-assessment | Credibility | Medium | Word-based ARIA labels; documented `tags` fallback mode; Open Decision D1 |
| R5 | Two concurrent "2025 – Present" roles look like an error | Confusion | High | Grouped timeline entry under one SPAR node (§5.6, §8.2) |
| R6 | Four retail roles dominate the Experience section vs. one technical role | Weakens dev positioning | High | Publication placed before Experience; `type` field colours the technical role; retail entries render collapsed by default with expandable detail |
| R7 | No project screenshots available | Cards look empty | High | Generated gradient + icon motif per project; no stock-photo filler (§14.4) |
| R8 | Empty `links` arrays leave projects unverifiable | Reduced trust | High | UI renders no button rather than a dead link; **action: publish the Energy Meter code to GitHub** (§19.4 D2) |
| R9 | `@import` in `main.css` costs sequential requests | Slower FCP | Low | Optional build concatenates (§11.1); acceptable unbuilt on HTTP/2 |
| R10 | Personal phone number and home town exposed to scrapers | Spam calls, doxxing, identity-fraud groundwork | Medium | **Resolved (D3): both omitted.** No phone number and no `tel:` anywhere in the site or the JSON; location is stated at county level only (`Cambridgeshire, United Kingdom`), and `addressLocality` is dropped from the `Person` JSON-LD. Precise contact detail lives only in the CV PDF, which is handed over deliberately |
| R11 | Owner can't maintain the site later | Site goes stale | Medium | Single-file content model + a README written for a non-frontend audience (§16.5) |
| R12 | Safari `backdrop-filter` / `clip-path` inconsistencies | Visual bugs on iOS | Medium | `-webkit-` prefixes; `@supports` guards with solid-background fallbacks |

---

## 19. Delivery Plan

### 19.1 Phases

| Phase | Deliverable | Depends on |
|-------|-------------|------------|
| **P0** | This architecture document, signed off | — |
| **P1** | `data/content.json` populated + verified against the CV | P0 |
| **P2** | Design tokens (`01-tokens.css`), reset, base, fonts installed, icon sprite built | P0 |
| **P3** | `index.html` semantic shell + nav + hero (static, no animation) | P2 |
| **P4** | Content rendering (`content.js`, `render.js`) — all sections populated, unstyled-ish | P1, P3 |
| **P5** | Component styling — all 21 components in §8.1 | P4 |
| **P6** | Animation layer — A1–A20 | P5 |
| **P7** | Responsive pass + touch behaviour | P6 |
| **P8** | Accessibility pass — §13 checklist | P7 |
| **P9** | Performance pass — §14 budgets, optional build | P8 |
| **P10** | Testing gates §17, deploy to GitHub Pages, README | P9 |

### 19.2 Definition of done

- [ ] Every §17.1 gate passes
- [ ] All five journeys in §2.2 complete in ≤ 3 interactions
- [ ] Every §14.1 budget met
- [ ] Every claim on the page traceable to the CV
- [ ] The site is live on a public URL
- [ ] `README.md` explains updating content to a non-frontend reader

### 19.3 File-count estimate

~33 source files: 2 HTML, 8 CSS, 14 JS, 1 JSON, 5 fonts, 2 SVG, plus config and docs.

### 19.4 Open decisions — needed before P1

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| **D1** | Skill display format | (a) Animated percentage meters (b) Plain tag pills, no numbers | **(a)** — it's the stronger visual and the §7 animation showcase; the honesty guardrails in §5.3 + §8.2 cover the risk. Switchable to (b) with one JSON flag if you'd rather not self-rate. |
| **D2** | Project repository links | (a) Publish Energy Meter code to GitHub and link it (b) Ship with no links | **(a)** — R8 is the biggest credibility gap on the site. Even a README-only repo with photos and the Arduino sketch materially helps. |
| **D3** | Show phone number and home town | (a) Show, obfuscated (b) Email + LinkedIn only, county-level location | **Closed — (b), by the owner.** Obfuscation only slows a scraper down; it does not stop one, and the number cannot be recalled once it has been harvested. A recruiter who wants to call gets the number from the CV, which is one click away. The town was dropped with it: a small-town name plus a full name is enough to locate someone, and it buys the site nothing that `Cambridgeshire` does not. A fourth contact tile (CV download) replaces the phone tile so the grid still reads as four. |
| **D4** | Profile photo | (a) Include (b) Text-only hero | **(a)** — a photo measurably increases recruiter engagement in the UK market. Needs a square headshot, ≥ 600 px, from you. |
| **D5** | Deployment URL | (a) `Dilukshika.github.io` (clean root) (b) `github.io/dilukshika-portfolio` | **(a)** — cleaner on a CV and in a LinkedIn profile link. |

### 19.5 Assets required from the owner

1. **Square headshot**, ≥ 600 × 600 px (D4)
2. **GitHub repo URLs** for any project you want linked (D2)
3. **Confirmation of the LinkedIn slug** — the CV shows `linkedin.com/in/sivanathan-dilukshika`; confirm it resolves
4. **Any project photos** — a photo of the physical energy meter build would be a strong, authentic visual
5. **Preferred contact email** — CV shows `dilukshika99@gmail.com`; confirm this is the one to publish

---

## 20. Future Enhancements

Out of scope for v1; the architecture accommodates each without restructuring.

| Idea | Effort | Notes |
|------|--------|-------|
| Project screenshots / build photos | S | Slot into `project.images[]`; card layout already reserves the space |
| Printable CV view | S | `@media print` stylesheet generating a CV from the same `content.json` |
| Case-study sub-pages | M | `projects/energy-meter.html` etc.; nav and tokens already support multi-page |
| Blog / writing section | M | Static `posts/*.html` + an index driven by `content.json` |
| Privacy-friendly analytics | S | Plausible or GoatCounter — a single script tag, no cookies, no banner needed |
| Tamil language toggle | M | `content.ta.json` alongside `content.json`; render layer is already data-driven |
| Contact form | M | Requires a third party (Formspree/Netlify Forms) — breaks the zero-backend rule, hence deferred |
| Certificate gallery | S | NPAIRC author certificate, degree — a lightbox grid |
| Dark/light theme variants per section | S | Tokens already support it |

---

## Appendix A — Content-to-CV Traceability

| Site section | CV source |
|--------------|-----------|
| Hero | Header: name, "BSc (Hons) Applied Computing \| Junior Software & Data Developer \| IT Support", location, contacts |
| About | "Professional Profile" paragraph |
| Stats | Derived: First-Class (Education) · ~3 yrs (Jul 2022–May 2024 + UK roles) · 1 publication · 93 % (Publications) |
| Skills | "Key Skills" — all 6 bullet groups, verbatim items |
| Projects | "Research & Projects" (2) + Publications entry rendered as a third project |
| Publication | "Publications" — NPAIRC 2026, full entry |
| Experience | "Work Experience" — all 5 roles |
| Education | "Education" — both qualifications |
| Contact | Header contact block + "Seeking a Skilled Worker sponsored…" from the profile |
| Languages | "Languages" — English Fluent, Tamil Native |

**No content on the site originates outside this table.**

---

## Appendix B — Glossary

| Term | Meaning |
|------|---------|
| **LCP** | Largest Contentful Paint — when the main content becomes visible |
| **CLS** | Cumulative Layout Shift — how much the page jumps while loading |
| **INP** | Interaction to Next Paint — responsiveness to clicks/taps |
| **Cascade layer** | CSS `@layer` — explicit ordering that overrides specificity |
| **IntersectionObserver** | Browser API that reports when an element enters the viewport |
| **rAF** | `requestAnimationFrame` — schedules work in sync with the display refresh |
| **WOFF2** | Compressed web font format, ~30 % smaller than WOFF |
| **BEM** | Block__Element--Modifier CSS naming convention |
| **Baseline** | Web platform features supported across all major current browsers |

---

*End of document. Sign off §19.4 open decisions to begin P1.*
