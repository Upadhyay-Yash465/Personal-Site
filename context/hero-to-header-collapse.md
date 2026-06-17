# Home hero → header name collapse

How the home page (`index.html`) makes the big hero name **dock into the top
bar** on scroll, with the header bar absent while the hero is at full height.
Inspired by the scroll-driven-animations.style *cover-to-fixed-header* demo,
but implemented in JS rAF (not CSS `animation-timeline`) for reliable docking
and cross-browser behavior.

## Behaviour

- **Full hero (scroll 0):** no header chrome at all — no background, no blur,
  no divider. Only the hamburger (left) and theme toggle (right) float over the
  hero. The name `Yash Upadhyay` is large and centered.
- **Scrolling:** the name is pinned and morphs (transform: translate + scale)
  from its hero position into the header brand slot, just right of the
  hamburger. Simultaneously the header veil forms and the hero furniture
  (sigil, role aside, scroll cue) fades out.
- **Docked (past ~0.62×vh):** the name sits in the bar at ~1.25rem, vertically
  centered; the bar is solid (translucent ink + 14px blur + 1px divider).

## Why JS rAF, not CSS scroll-timeline

The earlier redesign used `animation-timeline: scroll(root)` to fly the name up
(old `@keyframes home-title-travel`). It animated `top/left/font-size` and did
not land in the header reliably (the docked slot ended up off-screen). It was
replaced because:

- Docking needs the **measured** hamburger edge + a gap; CSS can only guess.
- Synchronous measurement of scroll-timeline animations is unreliable (they
  update off the main thread), making it hard to verify/tune.
- JS rAF gives exact control, a clean reduced-motion path, and matches the
  existing music scroll-fill effect pattern in this repo.

## Implementation

### CSS (`style.css`)

- `.topbar` itself is transparent/borderless. Its chrome lives on
  `.topbar::before` (inset:0, z-index:-1) so it can fade/slide independently of
  the buttons. Sub-pages: `::before` opacity defaults to 1 (solid from the
  start). Home: `body.home .topbar::before { opacity: var(--collapse,1);
  transform: translateY(calc((var(--collapse,1) - 1) * 12px)); }` — forms +
  settles as `--collapse` goes 0→1.
- `body.home { padding-top: 0; }` and `.home-hero { min-height: 100vh; }` so the
  hero owns the very top (no reserved header strip). Sub-pages keep the default
  `body { padding-top: var(--topbar-h); }`.
- The morph is gated on `body.home.js-collapse` (class added by JS only when
  enabled), so without JS / under reduced motion the page degrades to a normal
  static header + hero:
  - `body.home.js-collapse .hero-name { position: fixed; transform-origin: top
    left; will-change: transform; pointer-events: none; z-index: 101; }`
  - `body.home.js-collapse .brand { visibility: hidden; }` — kept in layout (not
    `display:none`) so its `margin-right:auto` still pushes the theme toggle to
    the right edge; the morphing name lands over its slot.
  - `body.home.js-collapse .hero-sigil/.hero-aside/.scroll-cue { opacity:
    var(--fade,1); }`
- `.hero-name` entrance (`@keyframes hero-rise`) is **opacity+blur only** — no
  transform — because JS owns `transform` on this element.

### JS (`main.js`, home block)

Runs only when `body.home` and **not** `prefers-reduced-motion`. Adds
`js-collapse`, then:

- `measure()` — clears the morph, reads the name's at-rest rect and computed
  font size, then pins it `position:fixed` at its scroll-0 viewport coords
  (`top = rect.top + scrollY`) with its at-rest **width frozen** (so wrapping
  never changes mid-morph). Computes:
  - `scale = DOCK_FONT / origFont`, `DOCK_FONT = 1.25rem`
  - `dockLeft = menuBtn.right + 18`, `dockTop = (topbarH - rect.height*scale)/2`
- `apply()` (rAF, scroll-guarded) — `p = clamp01(scrollY / (0.62*innerHeight))`:
  - name: `translate(tx*p, ty*p) scale(1+(scale-1)*p)` (transform-only → crisp,
    GPU, no reflow, wrap-agnostic)
  - `--collapse = easeOutCubic(clamp01((p-0.08)/0.82))` — veil tracks the name's
    arrival, settling as it lands
  - `--fade = clamp01(1 - p/0.4)` — furniture clears early
- Re-measures on debounced `resize` and on `document.fonts.ready` (web fonts
  load late and reflow the name).

## Gotchas

- **Transform vs. font-size:** scaling text down via `transform` stays crisp;
  it avoids per-frame layout that animating `font-size` would cause. Width is
  frozen at pin time so the line-wrap captured at rest is preserved through the
  whole morph.
- **No transformed ancestors:** the fixed name must have no `transform`/`filter`
  ancestor or it'd be positioned relative to that ancestor. The hero entrance
  was moved off `.hero-center` onto the name as opacity/blur for this reason.
- **Verifying locally:** a backgrounded preview tab throttles `requestAnimation
  Frame`, so the effect won't update during automated eval/screenshot and
  `getComputedStyle` reads of `--collapse` look stale. Verify with the tab
  foregrounded, or read geometry synchronously after forcing a frame.
