---
name: Yash Upadhyay
description: Biopunk ink-ritual personal site — a dark forge lit by rare gold, with Garba-vivid bursts.
colors:
  ink-0: "#0d0c14"
  ink-1: "#11111b"
  ink-2: "#181825"
  surface: "#1e1e2e"
  ash: "#cdd6f4"
  ash-dim: "#9399b2"
  ash-faint: "#585b70"
  gold: "#d4a574"
  gold-deep: "#b98a52"
  blood: "#c14a55"
  viral: "#4ac0b4"
  mauve: "#cba6f7"
  border: "#26263a"
  border-faint: "#1b1b2a"
  garba-marigold: "#f5a623"
  garba-magenta: "#d6336c"
  garba-indigo: "#5566f0"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3.5rem, 13vw, 11rem)"
    fontWeight: 300
    lineHeight: 0.86
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.6rem, 8vw, 5.5rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.4rem, 3.2vw, 2.3rem)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)"
    fontWeight: 300
    lineHeight: 1.32
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.9
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, IBM Plex Mono, monospace"
    fontSize: "0.68rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  pill: "2px"
  round: "50%"
spacing:
  xs: "0.5rem"
  sm: "0.9rem"
  md: "1.5rem"
  lg: "3rem"
  gutter: "3rem"
components:
  section-label:
    textColor: "{colors.gold}"
    typography: "{typography.label}"
  contact-link:
    textColor: "{colors.ash}"
    typography: "{typography.title}"
  contact-link-hover:
    textColor: "{colors.gold}"
  theme-toggle:
    textColor: "{colors.ash-faint}"
    rounded: "{rounded.round}"
    size: "1.7rem"
  nav-link:
    textColor: "{colors.ash}"
    typography: "{typography.headline}"
---

# Design System: Yash Upadhyay

## 1. Overview

**Creative North Star: "The Quiet Forge"**

This is a dark workshop. The page is cooled metal — near-black inks borrowed from Catppuccin Mocha — and the design only lights up where work is happening: a strip of gold under a section label, a single hover that draws a line, the teal glow on a specimen that's alive. The engineer comes first. Mono labels read like machine readouts; the Fraunces serif sets the human statements the engineer chooses to make out loud. The site is the proof — its restraint and finish *are* the portfolio, so nothing is decorated that isn't load-bearing.

The forge is quiet, not cold. Warmth comes from the gold's organic, hand-mixed tone (not a flat brand-yellow) and from Fraunces' optical-size contrast, which keeps large type expressive rather than corporate. One room breaks the rule on purpose: the Dance/Garba surface detonates into marigold, magenta, and indigo — the forge throwing sparks — because that work *is* color and celebration. That contrast only reads because everywhere else holds its restraint.

This system explicitly rejects the **dev-bro terminal portfolio** (neon-green-on-black, matrix rain, "I use Arch btw" — the mono here is a precision instrument, never the whole identity) and **overdesigned award-site excess** (scroll-jacking, motion that buries content, unreadable Awwwards reels). It also refuses the cross-project AI scaffolding: eyebrow kickers on every section, `01/02/03` reflex numbering, identical card grids, gradient text, and cream/sand minimalism.

**Key Characteristics:**
- Dark-first (`#11111b`); light "ritual paper" parchment is the secondary mode, both must pass AA independently.
- Gold is rationed — rare and earned, never structural wallpaper.
- Mono for labels/readouts, serif for statements, sans for prose — three voices, one hand.
- Motion serves comprehension and atmosphere; it never scroll-jacks and always has a reduced-motion path.
- Legible to a stranger in seconds; layered with depth for the friend who keeps scrolling.

## 2. Colors

A cooled near-black metal base, lit sparingly by a hand-mixed gold, with two cool work-lights (blood, viral) and a contained color detonation reserved for dance.

### Primary
- **Forge Gold** (`#d4a574`): The signature and the rarest. Section labels, the active nav link, the single hover underline-draw on links, focus outlines. Its deeper sibling **Gold Deep** (`#b98a52`) carries pressed/active states. Gold marks where attention is *earned* — never a default heading color.

### Secondary
- **Cost Blood** (`#c14a55`): The "ritual that costs" signal. Scoped to the Tower specimen glow and moments of weight/warning. Used sparingly; it reads as a wound, not an accent.
- **Viral Teal** (`#4ac0b4`): The "something is alive" glow. The Lucky Boy specimen, the active music cover, tech/biopunk highlights. The forward-looking counterpart to gold's tradition.

### Tertiary
- **Taste Mauve** (`#cba6f7`): The most restrained accent. Index-card labels in the Books/Taste field-guide only. If it appears anywhere structural, it's wrong.
- **Garba Trio** — **Marigold** (`#f5a623`), **Magenta** (`#d6336c`), **Indigo** (`#5566f0`): The detonation. Hard-scoped to the Dance/Garba surface. Forbidden anywhere else on the site.

### Neutral
- **Ash** (`#cdd6f4`): Primary text and display type on dark surfaces.
- **Ash Dim** (`#9399b2`): Secondary prose, supporting copy. The contrast-risk color — verify ≥4.5:1 on whatever ink it sits over.
- **Ash Faint** (`#585b70`): Tertiary/disabled, fine print, mono asides. Large or non-essential text only; it will fail AA as body copy.
- **Ink ramp** — `#0d0c14` / `#11111b` (page) / `#181825` / `#1e1e2e` (surface): tonal layering, darkest to lightest, used for depth instead of shadows.
- **Border** (`#26263a`) / **Border Faint** (`#1b1b2a`): hairline structure, never colored stripes.

### Named Rules
**The Earned-Gold Rule.** Gold appears on ≤10% of any screen and only on ritual moments: a section label, the active link, one hover, a focus ring. Its scarcity is the entire effect. The moment gold becomes a default heading color or a structural border, the forge stops glowing and starts decorating — delete it.

**The Containment Rule.** The Garba trio and Taste mauve are quarantined to their own rooms (Dance; Books/Taste). They never leak into the shared chrome. The detonation only lands because the rest of the site stays in greyscale-plus-gold.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** DM Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with IBM Plex Mono fallback)

**Character:** A variable serif with real optical-size contrast paired against a clean humanist sans and a precise monospace — the aesthete, the speaker, and the engineer in one hand. Fraunces carries weight and expression at scale; DM Sans stays out of the way for reading; JetBrains Mono is the machine-readout voice for everything labelled or catalogued.

### Hierarchy
- **Display** (Fraunces 300, `clamp(3.5rem, 13vw, 11rem)`, lh 0.86, ls −0.035em): The hero name. One per page, set tight and large.
- **Headline** (Fraunces 300, `clamp(2.6rem, 8vw, 5.5rem)`, lh 0.95, ls −0.03em): Page/section headers and full-screen nav links.
- **Title** (Fraunces 400, `clamp(1.4rem, 3.2vw, 2.3rem)`, lh 1.16): Tenet statements, specimen names, sub-heads.
- **Lead** (Fraunces 300 *italic*, `clamp(1.7rem, 3.6vw, 2.6rem)`, lh 1.32): The italic opening statement of a section (e.g. the About lead). The "said aloud" voice.
- **Body** (DM Sans 400, 0.95rem, lh 1.9): Prose. Hold to ~52–60ch (`max-width` already enforces this); never let a measure run past ~65ch.
- **Label** (JetBrains Mono 400, 0.68rem, ls 0.18em, UPPERCASE): Section labels, kickers, tags, ledger meta, column headers. The readout voice.

### Named Rules
**The Three-Voices Rule.** Mono labels, serif statements, sans prose. Each has one job. A heading never goes mono; a label never goes serif; prose never goes display. Mixing the voices muddies the hand.

**The Tight-Display Rule.** Display and headline serif always set with negative tracking (−0.03 to −0.035em) and sub-1.0 line-height. Loose, default-tracked large serif reads as a stock template, not a forged object.

## 4. Elevation

Flat by structure, lit by glow. This system uses **no drop shadows for depth** — layering is tonal, climbing the ink ramp (`#0d0c14` → `#11111b` → `#181825` → `#1e1e2e`) to push a surface forward. The only "shadows" are *colored glows*: a teal or blood box-shadow that signals a specimen is alive or costs something. Depth here is light from within, not a shadow cast from above.

### Shadow Vocabulary
- **Alive Glow** (`box-shadow: 0 0 …` in `--viral` teal): the active music cover, the Lucky Boy specimen. Signals life/forward-motion. Never ambient — it's a state.
- **Cost Glow** (`box-shadow: 0 0 …` in `--blood`): the Tower specimen. Signals weight/cost.
- **Topbar veil** (`backdrop-filter: blur(14px)` over `ink-1` at 80%): the only blur in the system, and only on the fixed chrome. Glass is forbidden everywhere else.

### Named Rules
**The Glow-Not-Drop Rule.** If you reach for a grey `box-shadow` to lift a card, stop — climb the ink ramp instead. Shadows in this system are colored and meaningful (alive / cost), never neutral and decorative.

## 5. Components

### Buttons / Controls
- **Shape:** circular for icon controls (theme toggle, 1.7rem, 50% radius); the site has no filled CTA buttons — actions are links.
- **Theme toggle:** ghost circle, 1px `--border` ring, `--ash-faint` glyph; ring and glyph warm toward gold on hover/focus.
- **Menu button:** three 1.5px `--ash` bars that animate to an X on `body.menu-open`.
- **Focus:** `2px solid var(--gold)` outline, `4px` offset — gold is the universal focus signal.

### Navigation
- **Top bar:** fixed, 64px, translucent `ink-1` at 80% with a 14px backdrop blur and a 1px `--border` bottom. Hamburger sits *left* of the brand name; theme toggle right.
- **Nav overlay:** full-screen; links are Fraunces headline-scale (`clamp(2rem, 7vw, 4.25rem)`, weight 300), `--ash`, masked and translated in with a staggered 0.04s-per-item delay. Active page marked `aria-current="page"`.
- **Mobile:** nav links drop to `clamp(1.8rem, 11vw, 3rem)`; the persistent top bar is unchanged.

### Links (Contact / inline)
- **Contact link:** Fraunces 1.6rem, `--ash`. A 1px gold underline draws in from the left on hover (`scaleX` origin swap right→left), text warms to gold. The signature interaction of the whole site.
- **Focus:** same gold outline as controls.

### Section Label (signature)
- Mono 0.68rem, uppercase, 0.18em tracking, `--gold`, preceded by a 1.6rem gold hairline at 0.6 opacity. This is *the* recurring unit — it replaces the banned eyebrow-kicker by being a deliberate, named, gold-rationed system element rather than a reflexive all-caps tag on every block.

### Specimen Card (signature)
- Used in Worldbuilding/Taste. No filled card chrome — a thin `--glow` (teal or blood) left rule on the logic line, glowing name, mono kind-tag. Depth via the glow, not a box. **Never** nest these.

### Ledger Row (signature)
- Work/projects as mono terminal rows: date column · gold `›` glyph · title · role · description · tag chips. A gold left-border `scaleY` draws on row hover. Reads as a machine log, on-brand for The Quiet Forge.

### Atmosphere
- **Grain:** fixed fractal-noise SVG overlay, 0.05 opacity, `mix-blend-mode: overlay`, `z-index: 9999`. The film over the whole forge.
- **Scroll progress:** gradient gold→viral bar.
- **Reveals:** `section-reveal` (translateY + blur) via `animation-timeline: view()`; never gate content visibility on the class — the default is already visible.

## 6. Do's and Don'ts

### Do:
- **Do** ration gold to ritual moments only — section labels, active link, one hover, focus rings. ≤10% of any screen (The Earned-Gold Rule).
- **Do** keep the three type voices separate: mono labels, Fraunces statements, DM Sans prose.
- **Do** set display/headline serif tight — negative tracking (≥ −0.04em floor), sub-1.0 line-height.
- **Do** convey depth by climbing the ink ramp; reserve `box-shadow` for meaningful teal/blood glows.
- **Do** verify `--ash-dim` (#9399b2) hits ≥4.5:1 on its ink background; push body text toward `--ash` if it's even close. Keep `--ash-faint` for large/non-essential text only.
- **Do** give every animation a `prefers-reduced-motion: reduce` alternative and keep content visible by default.
- **Do** quarantine the Garba trio and Taste mauve to their own pages (The Containment Rule).

### Don't:
- **Don't** build a dev-bro terminal portfolio — no neon-green-on-black, no matrix rain, no "I use Arch btw" hacker template. The mono is a precision instrument, not the identity.
- **Don't** ship overdesigned award-site excess — no scroll-jacking, no motion that buries content, no unreadable choreography.
- **Don't** put an all-caps tracked eyebrow above every section. The gold section-label is the *one* deliberate system unit; don't multiply it into reflex kickers.
- **Don't** add `01/02/03` numbered section markers unless the content is a genuine ordered sequence.
- **Don't** use gradient text (`background-clip: text` on a gradient) or `border-left`/`border-right` > 1px as a colored accent stripe.
- **Don't** use glassmorphism anywhere except the fixed top bar; no decorative blur on cards.
- **Don't** introduce cream/sand/parchment as the *dark* mode's surface — the canonical mode is ink near-black.
- **Don't** nest specimen cards or let any accent (mauve, garba, blood) leak outside its room.
