# Impeccable Setup + Home Critique & Fixes (2026-06-16)

Session record: ran the `/impeccable` design skill on the site. Produced project
design context (PRODUCT.md, DESIGN.md, sidecar, live config), critiqued the home
page (`index.html`), and shipped a round of code fixes. Written for a cold reader.

## What `/impeccable` is / how it's wired here

`/impeccable` is a frontend-design skill (global, at `~/.claude/skills/impeccable/`).
It reads two root files before any work:
- **PRODUCT.md** — strategic ("who/what/why"): register, users, purpose, brand
  personality, anti-references, design principles, a11y bar.
- **DESIGN.md** — visual ("how it looks"): Google Stitch DESIGN.md format (YAML
  token frontmatter + 6 fixed sections: Overview, Colors, Typography, Elevation,
  Components, Do's and Don'ts).

Supporting files it generated:
- `.impeccable/design.json` — sidecar the live panel renders (component HTML/CSS
  snippets, 8-step tonal ramps, shadow/motion/breakpoint tokens, narrative). Extends
  the DESIGN.md frontmatter; doesn't duplicate it.
- `.impeccable/live/config.json` — live-mode config. `files: ["*.html"]` (root-served
  multi-page static), `insertBefore: </body>`, `commentSyntax: html`, `cspChecked: true`.
  CSP detector reported `null` (nothing to patch).
- `.impeccable/critique/<timestamp>__index-html.md` — persisted critique snapshot
  (backlog that `/impeccable polish` can consume).
- `.impeccable/config.local.json` — pre-existing; design-hook consent = accepted.

### Strategic decisions captured in PRODUCT.md
- **Register: `brand`** (personal portfolio — design IS the product).
- **Audience: both equally** — cold recruiters/collaborators AND curious peers/friends.
  Must read credible to a stranger in seconds AND reward a friend who digs deeper.
- **Emotional goal:** intrigue/depth + awe-at-craft + warmth (NOT edge-for-edge's-sake).
  The biopunk "ink, ritual, systems that fail" concept is *texture, not the message*.
- **Anti-references:** dev-bro terminal portfolio (neon-green hacker template) and
  overdesigned award-site excess (scroll-jacking, motion that buries content).
- **A11y: WCAG AA**, both light and dark must pass independently.
- **5 principles:** (1) the site is the proof; (2) legible to a stranger, deep for a
  friend; (3) one person, many rooms; (4) theme is texture not message; (5) motion with intent.

### Visual system captured in DESIGN.md
- **Creative North Star: "The Quiet Forge"** — dark workshop (cooled near-black metal),
  lit only where work happens; engineer-first; gold = the rare ritual mark.
- **Gold is rationed** ("The Earned-Gold Rule": ≤10% of any screen, only on section
  labels / active link / one hover / focus rings). Scarcity is the point.
- **Three type voices, one hand:** Fraunces (display/statements), DM Sans (prose),
  JetBrains Mono (labels/readouts). Never mix the voices.
- **Elevation = glow, not drop:** no neutral box-shadows for depth — climb the ink ramp
  tonally; the only shadows are colored teal (alive) / blood (cost) glows.
- **Containment Rule:** the Garba trio (marigold/magenta/indigo) and Taste mauve are
  quarantined to their own rooms (Dance; Books/Taste) and never leak into shared chrome.
  The Garba section is the ONE documented intentional rule-break (gradient-clipped
  NATIONALS text, white-on-color), so the design-hook findings there are expected.

(Token values live in `style.css` `:root` and are mirrored in DESIGN.md frontmatter +
`.impeccable/design.json`. See `context/redesign-aesthetic.md` for the palette/structure
narrative; that file is the accurate current source.)

## Home page critique (`index.html`) — score 32/40 "Good"

Two independent assessments (LLM design review + deterministic `detect.mjs` + browser
evidence via Playwright at 1440 and 390), synthesized.

**Verdict: does NOT look AI-generated.** Distinctive, well-committed; clears the
category-reflex tests. Strengths: the dark hero (Fraunces name over gold sigil ring +
role-cycler with gold underline), token discipline, honest editorial spine.

### Findings (with status after this session)
| Sev | Issue | Status |
|-----|-------|--------|
| P1 | Live `[about-body — placeholder…]` renders on the page | OPEN — needs Yash's real copy |
| P1 | Canonical-mode mismatch: site first-paints light (system pref) with a FOUC | FIXED (no-FOUC init; still honors system pref) |
| P2 | Light-mode gold section-labels failed AA (3.65:1) | FIXED (now 5.53:1) |
| P2 | No favicon (`favicon.ico` 404) | FIXED (inline SVG sigil favicon) |
| P3 | Desktop About right-heavy; home thin for a cold stranger; "Go deeper" dupes nav | OPEN — partly copy-bound; optional `/impeccable layout` later |

Detector false positive worth remembering: **`single-font`** fires because the scanner
only parses Fraunces from the markup, but the page actually loads 3 families on the
fonts `<link>`. **`overused-font` (Fraunces)** is partially valid but a deliberate,
well-paired choice — not a defect.

### Decisions made for the fixes
- First-paint: **honor system preference**, but harden light mode to full AA parity
  (rather than forcing dark). The FOUC was the real bug, not the system-pref behavior.
- Scope this pass: all code fixes; leave About prose for a dedicated copy pass.

## Fixes shipped this session

1. **Light-mode AA contrast** (`style.css`, `:root[data-theme="light"]`):
   `--gold #9a6a2e → #7a4f15`, `--gold-deep #815621 → #62410e`.
   Rationale: gold labels are small (~0.68rem) uppercase mono = need ≥4.5:1. `#7a4f15`
   measures 4.9–5.9:1 across all three light surfaces (ink-1 #ece2cf, surface #f2ead9,
   ink-2 #e3d8c2). Verified rendered: section-label 5.53:1 on #ece2cf. Dark gold
   (#d4a574, 8.42:1) deliberately unchanged.

2. **No-FOUC theme init** — added to `<head>` of all 6 pages, right after the viewport
   meta, before the stylesheet:
   ```html
   <script>(function(){try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
   ```
   Why: `main.js` loads at end of `<body>`, so a light-system machine painted the
   hardcoded `data-theme="dark"` first, then flipped → flash. This blocking head script
   sets the attribute pre-paint. `main.js`'s `applyTheme()` on load is idempotent.
   No-JS users still get the hardcoded `data-theme="dark"` (canonical) fallback.

3. **Favicon** — added to all 6 pages' `<head>` (same insertion point): the ritual
   sigil as an inline SVG data-URI, gold stroke, two concentric circles + a cross
   (simplified from the hero's full asterisk sigil so it reads at 16px):
   ```html
   <link rel="icon" href="data:image/svg+xml,...stroke='%23d4a574'...two circles + vertical/horizontal cross...">
   ```

### Verification (Playwright, local `python -m http.server`)
- Light section-label contrast: **5.53:1** (computed, rendered) ✓
- Console: **0 errors** (favicon 404 gone) ✓
- `link[rel=icon]` present ✓
- Dark mode visually unchanged ✓
- Light-mode deeper gold still reads as bronze-gold, legible on parchment ✓

## Still open / next steps
- **[P1] About copy** — replace the placeholder with real text (facts from Yash;
  then `/impeccable clarify` to shape voice).
- **[P3] Layout** — desktop About rebalance + a "what Yash builds" substance line near
  the hero; `/impeccable layout` once copy exists.
- **Sub-page hook findings** (`em-dash-overuse`, `numbered-section-markers` on
  think.html) live in placeholder copy / a legitimate ordered manifesto — address in
  the copy pass, not as code.
- **Re-run `/impeccable critique index.html`** after the copy lands; the two P1s
  resolving should lift the 32/40.
- **Stale doc:** `context/site-architecture.md` still describes the OLD single-page /
  Cormorant / terracotta version — delete or update it (redesign-aesthetic.md is current).

## Gotchas for future sessions
- `context.mjs` lives in the GLOBAL skill dir (`~/.claude/skills/impeccable/scripts/`),
  not in this repo's `.claude/`. Invoke with the full path.
- A design hook fires `detect.mjs` after every UI-file edit and injects findings as
  system reminders. Don't add `impeccable: ignore` comments; persist ignores only with
  user confirmation via `/impeccable hooks ignore-value … --shared`.
- The Playwright/chrome-devtools MCP: chrome-devtools was locked by an already-running
  browser ("use --isolated"); Playwright worked. To inspect canonical dark mode, set
  `localStorage.theme='dark'` + `data-theme='dark'` (the test browser defaults to light).
