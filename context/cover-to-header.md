# Home: cover-to-fixed-header + scroll-velocity wheel

How the home page (`index.html`) hero behaves. Replaces the earlier
"morph the name into a separate top bar" approach — there is no longer a
separate `.topbar` on home.

## The effect

The full-height hero **is** the header. It is one element, `<header class="cover">`,
that collapses into a 64px top bar as you scroll — modeled on
[scroll-driven-animations.style cover-to-fixed-header](https://scroll-driven-animations.style/demos/cover-to-fixed-header/css/).

- The cover is `position: fixed; top:0` and its **height is driven 100vh → `--topbar-h` (64px)** by JS on scroll.
- `body.home.js-cover` gets `padding-top: 100vh` — a scroll runway so page content
  scrolls *up* to meet the collapsed bar. (Animating a fixed element's height does
  not change document scroll length, hence the explicit runway, exactly as the reference notes.)
- The cover's own `border-bottom: 1px solid var(--border)` is the hairline; as the
  cover shrinks it travels up the viewport and lands as the header's bottom border.
- The name (`.cover-name`) is pinned `position: fixed` and morphed by a pure
  `translate + scale` transform from huge-centered to a small top-left wordmark
  beside the hamburger.
- Hamburger + theme toggle live in the top `--topbar-h` band (absolute) and **pop in**
  only over the last 40% of the collapse via `--chrome` (0→1). They are
  `pointer-events:none` until `body.chrome-on` is set, so they're inert at full hero.
- Hero furniture (sigil, aside, scroll-cue) fades out early via `--fade` (1→0).

## Progressive enhancement / reduced motion

- Base CSS (no `js-cover`) = a static `position:relative; height:100vh` hero with the
  controls already visible in their corners and the wheel on a slow CSS `sigil-breathe`
  drift. This is what no-JS **and** `prefers-reduced-motion` users get.
- JS adds `body.js-cover` only when `!reduceMotion`, switching on the fixed/collapse behavior.

## The wheel (sigil) spin

Driven in a **persistent `requestAnimationFrame` loop** (runs even when the page is
still, so the idle drift continues; rAF auto-pauses on hidden tabs).

Each frame accumulates an `angle`:

```
angle += IDLE_DPS * dt + dy * SCROLL_K;
```

- `IDLE_DPS = 5` deg/sec — slow idle drift.
- `dy` = change in `scrollY` since last frame; `SCROLL_K = 0.2` deg per scrolled pixel
  (tuned down from 0.45 — 0.45 felt too fast while scrolling).
- Scroll **down** (dy>0) → angle increases → **clockwise**. Scroll **up** → **counter-clockwise**.
  The scroll term dominates the idle term during any real scroll (hence "faster than idle").

Applied as `transform: translate(-50%,-50%) rotate(${angle}deg) scale(${1 - 0.6*p})`
where `p` is collapse progress, so the wheel also shrinks as it's drawn into the bar.

## Mouse-weight particle field (`.cover-fx` canvas)

A grid of faint gold dots behind the wheel (`#cover-fx`, canvas, `pointer-events:none`,
z-index 0; wheel bumped to z-index 1). The "antigravity.google hero" feel.

Physics per dot, each frame (separate persistent rAF loop):
- spring back to home: `a += (home - pos) * SPRING` (`SPRING = 0.045`).
- cursor repulsion within `RADIUS = 130px`: `a += (dir away) * (1 - dist/RADIUS) * PUSH` (`PUSH = 2.4`).
- `v = (v + a) * DAMP` (`DAMP = 0.86`), `pos += v`. Damping + spring = the heft / ripple settle.
- brightness scales with displacement from home (`alpha 0.12 → ~0.67`), so the wake glows.

Grid pitch `SPACING = 46px`, centered; canvas sized to `innerWidth × innerHeight × min(dpr,2)`.
Listens on `cover` `mousemove`/`mouseleave`. Folded into the `--fade` group so it
clears as the cover collapses. Skipped entirely under reduced motion.

## Key numbers / knobs (main.js)

- Collapse progress: `p = clamp01(scrollY / (innerHeight - TOPBAR_H))`.
- Docked wordmark: only "Yash" (surname span `.cn-rest` fades on `--fade`); size
  `DOCK_FONT = 1.6rem`, morphed via **font-size** interpolation (crisp) not transform-scale
  (scaling a 130px glyph to 20px blurs it). Gap after hamburger: `GAP = 18px`.
- Optical lift: `dockTop -= DOCK_FONT * 0.1`. "Yash" is cap-heavy with ~no descender, so
  its line-box centre sits above the lowercase mass; the lift aligns the x-height with the
  hamburger's middle bar. The inline rect is the *font bounding box* (≈0.98em ascent + 0.26em
  descent = 1.24em), not the 0.86 line-height box — matters when deriving the baseline.
- Chrome pop-in window: `clamp01((p - 0.6) / 0.4)`.
- Furniture fade-out: `clamp01(1 - p / 0.55)`.
- `measure()` reads the name's at-rest centered rect (temporarily `position:absolute;
  left/top:50%; translate(-50%,-50%)`), then pins it `fixed` with `transform-origin:top left`.
  Re-runs on resize (debounced) and on `document.fonts.ready` (late font reflow).

## Gotchas

- **The dev server (`python -m http.server`) caches `style.css`/`main.js` hard.** The
  browser would not pick up edits on a normal reload. Asset refs in `index.html` carry
  `?v=N` query strings — bump N when CSS/JS changes to force a fresh fetch. To verify in a
  browser that already cached, load a never-seen doc URL (`index.html?fresh=<ts>`).
- Name centering at rest depends on the sigil hub and the name sharing the viewport
  center; `measure()` must read the *static/absolute* rect, not the pinned one.
