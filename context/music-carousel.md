# Music Carousel — Implementation Notes

## HTML Structure

```
#music (.carousel-section .music-full)
├── .carousel-section-head.music-head   — "MUSIC" label + desc (centered)
├── .carousel-outer#music-outer         — horizontal scroll container
│   └── .carousel-perspective           — perspective: 40em wrapper (MUST be between scroll container and flex list)
│       └── ul.carousel-cards.music-carousel#music-carousel   — flex list of cards
│           └── li.carousel-card[data-idx][data-url]
│               └── .cover-wrap
│                   └── img.cover-art | div.cover-thumb   — the 3D-animating element
├── .music-meta#music-meta              — OUTSIDE 3D context (avoids overlap bug)
│   ├── p#meta-album
│   ├── p#meta-song
│   ├── p#meta-artist
│   └── button.why-btn#why-btn
├── audio#preview-audio
├── .now-playing
└── .spotify-connect
aside.why-panel#why-panel               — sibling of #music, in body
```

**Critical**: `.cover-meta` must NOT be inside `.carousel-card`. The 3D `translateZ` transform causes it to overlap adjacent cards. The `#music-meta` block lives outside the `.carousel-perspective` wrapper entirely.

## Cover-flow 3D Animation

```css
@keyframes rotate-cover {
  0%   { transform: translateX(-100%) rotateY(-45deg); }
  35%  { transform: translateX(0)     rotateY(-45deg); }
  50%  { transform: rotateY(0deg)     translateZ(1em) scale(1.18); }
  65%  { transform: translateX(0)     rotateY(45deg); }
  100% { transform: translateX(100%)  rotateY(45deg); }
}
```

Driven by `animation-timeline: view(inline)` — as each card scrolls through the horizontal viewport, the animation progress tracks it. Center card (50%) gets the scale-up + forward pop.

`perspective` must be on `.carousel-perspective`, NOT on `.carousel-cards` (which is the flex container). Putting perspective on a flex container breaks `transform-style: preserve-3d`.

## Centering First/Last Cards

```css
.carousel-cards {
  padding-inline: calc(50vw - var(--cc-size) / 2);
}
```

Must use `50vw` not `50%`. `50%` resolves to 50% of the UL's total scroll width (all cards combined), which is far too large.

## IntersectionObserver (active card detection)

```js
new IntersectionObserver(entries => { ... }, {
  root:       scrollContainer,   // the .carousel-outer
  rootMargin: '0px -40% 0px -40%',
  threshold:  [0, 0.2, 0.4, 0.6, 0.8, 1],
})
```

The `-40%` rootMargin means only a card that occupies the central 20% of the scroll container triggers activation.

## ALBUMS Data Shape

```js
{
  title:      'Album name',
  artist:     'Artist name',
  trackName:  'Track to display',
  cover:      '',            // Spotify fills this on connect
  preview:    '',            // 30s MP3 URL — Spotify fills this on connect
  spotifyUrl: 'https://open.spotify.com/album/...',
  why:        'Personal note shown in the side panel.',
}
```

## Spotify PKCE OAuth

Client-side only (no server). Flow:
1. User clicks "Connect Spotify"
2. `startPKCE()` generates code verifier + challenge, redirects to Spotify
3. Spotify redirects back with `?code=...`
4. `exchangeCode()` POSTs to `https://accounts.spotify.com/api/token`
5. Token stored in `sessionStorage` (1 hour expiry)
6. `enrichFromSpotify()` fetches album art + preview URLs, re-renders cards

Client ID: `73740a313d01462180de4f4374c8c36f` (in `carousel.js`)
Note: Spotify removed preview URLs for many tracks in 2024. If `preview_url` is null, playback just doesn't trigger.

## Central Meta Update

`onActivate(idx)` callback in `initCarousel()` calls `updateMeta(idx)` which sets:
- `#meta-album` textContent = album title
- `#meta-song` textContent = track name
- `#meta-artist` textContent = artist
- `#why-btn` hidden = !album.why

## Why Panel

`#why-panel` is a fixed aside that slides in from the right via `transform: translateX(100%)` → `translateX(0)` with `.is-open` class. Contains: cover image, album, artist, divider, `why` text, Spotify link.

Close triggers: `#why-panel-close` button, Escape key, click on panel backdrop.

## Scroll-Driven Black Bars

Two `position: fixed` elements (`.music-bar--top`, `.music-bar--bottom`) with `height: 50vh` and `scaleY` driven by JS on every scroll frame via `requestAnimationFrame`.

**Key geometry**:
- Top bar: `transform-origin: bottom center`. Its `bottom` CSS property is pinned to `vh - rect.top` so its bottom edge tracks the section's top edge. Grows upward.
- Bottom bar: `transform-origin: top center`. Its `top` CSS property is pinned to `rect.bottom` so its top edge tracks the section's bottom edge. Grows downward.

**Scale math**:
```js
const lookAhead = vh; // start effect 1 viewport before section enters

// Top bar scale:
if (rect.top >= vh) {
  // Pre-entry: ramp 0 → 1 over lookAhead distance
  topScale = 1 - (rect.top - vh) / lookAhead;
} else {
  // In viewport: naturally track section top edge
  topScale = Math.max(0, Math.min(1, rect.top / halfVh));
}

// Bottom bar: mirror for exit
```

Result: bars start growing one full viewport before the section enters, peak at full when the section is half-in, and retract to 0 when section fills the viewport. Symmetric on exit.

## Scroll Resistance (Immersive Mode)

When `body.music-immersive` is active (section >= 55% visible), wheel events are intercepted:
- Scrolling UP: exits immediately
- Scrolling DOWN: accumulates `exitAccum += deltaY`, blocks `e.preventDefault()` until 420px threshold
- `#exit-progress` bar shows progress toward threshold

Touch equivalent with `touchstart`/`touchmove` listeners.

## Audio Playback

Single `<audio id="preview-audio">` element. On card activation:
- `playPreview(album)` sets `src`, plays at `volume: 0.55`
- Fade-out in last 3 seconds via `timeupdate` event: `volume -= 0.018` per tick
- `stopPreview()` pauses + clears np-dot/track indicators
