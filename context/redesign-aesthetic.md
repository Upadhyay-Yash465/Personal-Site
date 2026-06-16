# Personal Site — Redesign Aesthetic System

Major redesign (2026-06) of the vanilla HTML/CSS/JS Firebase-static site to make it
read as personal to Yash Upadhyay. Concept: **biopunk ink-ritual base + Garba-vivid
bursts** — "ink that bleeds, body that transforms, ritual that costs."

## Stack (unchanged)
Pure HTML/CSS/JS, no build step, served at repo root via Firebase Hosting
(`firebase.json`, project `personalsite-e65af`). Files: `index.html`, `style.css`,
`main.js` (theme toggle + role-cycler), `carousel.js` (music immersive + cover-flow —
**logic untouched** in the redesign).

## Palette (CSS vars in `:root`, dark-first; Catppuccin Mocha derived)
- Ink base: `--ink-0 #0d0c14`, `--ink-1 #11111b` (page bg), `--ink-2 #181825`, `--surface #1e1e2e`
- Text: `--ash #cdd6f4`, `--ash-dim #9399b2`, `--ash-faint #585b70`
- Accents: `--gold #d4a574` (primary/ritual), `--blood #c14a55` (cost), `--viral #4ac0b4` (Lucky Boy + tech glow), `--mauve #cba6f7` (taste, sparing)
- Garba burst (scoped to `#raas` only): `--garba-marigold #f5a623`, `--garba-magenta #d6336c`, `--garba-indigo #5566f0`
- Light mode = "ritual paper" parchment variant (`:root[data-theme="light"]`), secondary; dark is canonical.

## Type
- Display: **Fraunces** (variable serif, optical contrast) — names, leads, statements
- Body: **DM Sans**
- Mono: **JetBrains Mono** — labels, ledger, tags, kickers (the "terminal hand")

## Sections (order) & their signature treatment
1. **Hero** — scroll-driven collapse (kept from commit dc87e42). Fraunces name center→top-left, gold ritual-sigil watermark (`.hero-sigil` SVG) fades/rotates out, mono role-cycler (`#role-cycler`, rotated in `main.js`, reduced-motion aware) with gold underline.
2. **Manifesto** (`.manifesto`) — vertical spine (`.tenets` left border) with numbered tenets branching right; even tenets offset to break grid; gold draw-underline on each statement via `animation-timeline: view()`.
3. **KnightRaas + Fitness** (`#raas .garba`) — the color detonation. Gradient-mesh flood of garba colors (`.garba::before`, `garba-bloom` view animation), orbiting dandiya sticks, huge `NATIONALS 2026` (gradient-clipped text; **note:** the `2026` `.garba-year` uses a solid `-webkit-text-fill-color` because nested `background-clip:text` inside an already-clipped parent renders as a solid block). Two columns: The Dance / The Training.
4. **Worldbuilding + Taste** (`.worlds`) — two `.specimen` cards (Lucky Boy = `--viral` glow, Tower = `--blood` glow) flanking a vertical `ritual·body·concept` bridge (`.specimen-bridge`, `writing-mode: vertical-rl`, goes horizontal under 680px). Below: `.taste-grid` index cards (mauve labels).
5. **Ledger** (`.ledger`) — work/projects as mono terminal rows: date col + gold `›` glyph title + role + desc + tag chips; gold left-border scaleY on row hover. Real resume facts (IRLXR, E4C, AESOP, Palm Coast Speech & Debate).
6. **Music** (`#music`) — kept immersive scroll-fill carousel; restyled to ink-black bars + viral-teal glow on active cover (`.music-carousel .carousel-card.is-active .cover-wrap` box-shadow, CSS-only) + teal play button/artist.
7. **Books** — cover-flow carousel, restyled.
8. **Contact** (`.contact`) — Fraunces links with gold underline-draw hover + sigil sign-off.

## Atmosphere
- `.grain` fixed film-grain overlay (data-URI SVG fractal noise, `mix-blend-mode: overlay`, z 9999).
- Scroll progress bar gradient gold→viral.
- Section reveals: `section-reveal` keyframe (translateY + blur) on `animation-timeline: view()`.
- All animations respect `prefers-reduced-motion: reduce` (global guard + JS cycler check).

## Writing status
All prose blocks are labeled placeholders (`[manifesto-note-N]`, `[knightraas-body]`,
`[fitness-body]`, `[lucky-boy-note]`, `[tower-note]`) for Yash to fill. Headlines and
known facts (Nationals 2026, Captain Intern, role names, resume bullets) are filled in.

## Verified
Chrome (devtools MCP) at 1440 + 390 widths: hero collapse, manifesto spine, garba
burst, specimen cards, ledger, music carousel (covers load via Spotify oEmbed + iTunes
previews), mobile stacking. No console errors. Carousel/immersive mechanics intact.
