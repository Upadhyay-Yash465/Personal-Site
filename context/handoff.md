# Handoff — Personal Site

Last updated: 2026-06-14

## What's Done

### Personal Site (`index.html` / `style.css` / `carousel.js`)

- **All 8 sections** live: Hero, About, KnightRaas, Mock Trial, Projects, Music, Books, Contact
- **Music carousel**: 3D cover-flow via CSS `animation-timeline: view(inline)`, IntersectionObserver for active card, mouse drag-to-scroll
- **Spotify PKCE OAuth** wired end-to-end — Client ID already set. User needs to fill ALBUMS array with real album data and `why` text
- **Central meta** (Album Title / Track Name / Artist) renders below the carousel outside the 3D context — no overlap bug
- **"Why this?" side panel** slides in from the right when button is clicked; close via ✕, Escape, or backdrop click
- **Black bars (wheel-driven)**: page freezes when music section top crosses 50% of viewport; bars then grow outward from section edges (upward + downward) driven by wheel delta, not scroll position. 250px to enter, 380px to exit downward; wheel up exits immediately
- **Books carousel**: Three-Body Problem, Project Hail Mary with OpenLibrary cover art; Reverend Insanity + The Climber as placeholders
- **Scroll resistance**: wheel events blocked until 420px accumulation when in music section; progress bar shows resistance state
- **Firebase Hosting + GitHub Actions** auto-deploy set up

### Speech Coach (`Projects/speech-coach/`)

- **CWDAI framework** replacing generic argument analysis: Claim → Warrant → Data → Analysis → Impact
- CWDAI label visibly shown in UI with `[CWDAI]` badge + subtitle
- `ArgumentBlock` component renders 5-row CWDAI grid with color-coded strength badges
- Server prompt updated with full CWDAI schema, Impact types (Quantification/Characterization/Humanization), "must end with people" rule

## Known Bug

### "Why This?" button only shows on album 0
`updateMeta()` in `carousel.js` does `whyBtn.hidden = !album.why` — hides the button when `why` is empty string. Since only album 0 has `why` filled in currently, the button disappears on all other albums. Fix: either always show the button (remove the `hidden` toggle) or fill in `why` for all albums. If you want the button always visible, remove the line `if (whyBtn) { whyBtn.hidden = !album.why; }` from `updateMeta()`.

## Immediately Actionable (fill in content)

### 1. Fill in ALBUMS array (`carousel.js` lines 10–56)

```js
{
  title:      'Igor',
  artist:     'Tyler, the Creator',
  trackName:  'EARFQUAKE',
  cover:      '',            // leave empty, Spotify fills on connect
  preview:    '',            // leave empty, Spotify fills on connect
  spotifyUrl: 'https://open.spotify.com/album/5zi7WsKlIiUXv09tbGLKsE',
  why:        'The production switch at 1:52 in EARFQUAKE is the best thing in music.',
}
```

Once ALBUMS is filled, the "Why this?" button appears per album. If `why` is empty string, button is hidden.

### 2. Add real photos

Photo placeholder `<div class="photo-placeholder">` elements are in the KnightRaas and Mock Trial sections. Replace with `<img>` tags when photos are ready.

### 3. Register Spotify redirect URIs

Current Client ID: `73740a313d01462180de4f4374c8c36f`

In [developer.spotify.com](https://developer.spotify.com/dashboard) → app settings → Redirect URIs, add:
- `http://localhost:8080/`
- `https://personalsite-e65af.web.app/`

## Known Gaps / Deferred Work

### Black bar / freeze tuning
- Freeze trigger: `rect.top <= vh * 0.5` (section top crosses 50% of viewport scrolling down). Tune the `0.5` multiplier in the `scroll` listener in `carousel.js` if the freeze fires too early or late.
- Enter speed: `ENTER_THRESHOLD = 250` px of wheel delta. Lower = faster bars.
- Exit speed: `EXIT_THRESHOLD = 380` px of wheel delta. Lower = easier to leave.
- Bottom bar: when the music section is taller than the viewport (typical), `botTarget = 0` so only the top bar is visible. This is correct behavior.

### Preview URLs
Spotify removed preview URLs for many tracks as of 2024. If a track has no preview, the carousel still works — it just won't auto-play. If you want guaranteed playback, get preview URLs manually via the Spotify developer console and hardcode them in the `preview` field.

### Books section meta
Books carousel currently has `.cover-meta` inside the cards (no 3D overlap issue since books use `cover-art` img, not `translateZ`). Can keep as-is or unify with the music pattern.

### Speech Coach persistence bugs (documented in plan)
- `vocalAnalysis` not saved to MongoDB — Audio tab empty when loading from History
- AI rewrite not persisted after generation — disappears on History load
- No favicon
- Theme toggle button not wired

These are fully planned in `.claude/plans/using-this-skill-determine-recursive-boole.md`.

## Architecture Decisions Worth Knowing

- **`perspective` on wrapper, not scroll container**: If you ever add another carousel, the `div.carousel-perspective` wrapper between `.carousel-outer` and `<ul>` is mandatory. Perspective on a flex container breaks `transform-style: preserve-3d`.
- **`50vw` not `50%` for padding-inline**: The first/last card centering uses `calc(50vw - var(--cc-size) / 2)`. `50%` resolves relative to the UL's total scroll width, not the viewport.
- **`#music-meta` outside `.carousel-perspective`**: `translateZ` in the 3D animation creates a new stacking context that overlaps adjacent elements. All text below the carousel must live outside the perspective wrapper.
- **`scaleY` not `height` for bars**: `transform` is compositor-only (no layout reflow). `height` changes trigger layout on every scroll frame.

## File Map

| File | Purpose |
|------|---------|
| `index.html` | All markup |
| `style.css` | All styles + design tokens |
| `main.js` | Theme toggle only |
| `carousel.js` | Music carousel, Spotify, bars, why panel |
| `context/site-architecture.md` | Stack, tokens, section list |
| `context/music-carousel.md` | Deep dive on carousel + bars |
| `Projects/context/spotify-setup.md` | How to configure Spotify |
| `Projects/speech-coach/context/cwdai-framework.md` | CWDAI argument framework |
| `Projects/speech-coach/context/analysis-prompts.md` | All LLM prompts verbatim |
