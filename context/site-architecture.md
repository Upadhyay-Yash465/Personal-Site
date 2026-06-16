# Personal Site — Architecture

## Stack

Vanilla HTML/CSS/JS. No framework, no bundler. Two JS files:
- `main.js` — theme toggle, scrolled header border
- `carousel.js` — all carousel, music player, Spotify, immersive bars logic

Hosted on Firebase Hosting. Auto-deploys via GitHub Actions on push to `main`.

## File Structure

```
personal-site/
├── index.html        — single page, all sections
├── style.css         — all styles
├── main.js           — theme toggle
├── carousel.js       — carousel + music player + scroll bars
├── firebase.json     — hosting config
└── Projects/
    ├── speech-coach/ — React/Vite app (separate project)
    └── context/      — notes on Spotify setup
```

## Design Tokens (CSS variables)

```css
--bg:             #141210      /* warm near-black */
--text:           #EBEBEB
--text-secondary: #888888
--accent:         #C0714A      /* terracotta — hover states only */
--border:         #2C2C2C
--font-display:   'Cormorant Garamond'
--font-body:      'DM Sans'
--font-mono:      'IBM Plex Mono'
```

Light mode overrides exist under `[data-theme="light"]`.

## Sections (in order)

1. **Hero** — name + role, full-bleed Cormorant headline
2. **About** — two paragraphs, italic lead
3. **KnightRaas** — `.personal-section` grid (5.5rem label + 1fr body)
4. **Mock Trial** — same grid
5. **Projects** — same grid, `.project-entries` list
6. **Music** — full-screen carousel section (see `music-carousel.md`)
7. **Books** — carousel section, static HTML cards
8. **Contact** — email, GitHub, LinkedIn links

## Scroll Animations

- Scroll progress bar: `.scroll-progress`, `animation-timeline: scroll()`
- Section reveal: `animation-timeline: view()` on section elements
- Photo placeholder reveal: `@keyframes photo-reveal` using `clip-path: inset()`
- Music bars: JS scroll listener (see `music-carousel.md`)

## Grain Texture

Applied via SVG data URI on `body::before`. Adds noise over the dark background.

## Deployment

```
Firebase project: personalsite-e65af
Live URL: https://personalsite-e65af.web.app
GitHub Actions: .github/workflows/ (push to main → deploy)
```
