# Content system — content.md drives all copy

All written copy on the site lives in **`content.md`**. Edit that file, reload,
and the change appears everywhere it's used. No build step — `content.js` fetches
and parses the markdown at page load (client-side).

## Files

- **`content.md`** — the single source of truth. Human-edited.
- **`content.js`** — fetches `content.md` (`cache: no-cache`), parses it, injects
  into the DOM, exposes `window.SITE_CONTENT`, and fires a `content:ready` event.
  Loaded **before** `main.js`/`carousel.js` on every page.
- Each page's HTML carries `data-content` / `data-content-list` hooks (see below).
- `main.js` (role cycler) and `carousel.js` (music + books) read from
  `window.SITE_CONTENT` on `content:ready`.

## content.md format

```
### key                → a text field; body is the lines until the next heading
### key []             → a list; each item starts "- " with "field: value" lines
```

- Inline markdown in text: `**bold**`, `*italic*`, `` `code` ``, `[link](url)`.
- `tags:` values are comma-split into an array.
- Lines starting `#`/`##` are organizational comments (ignored by the parser).
- Keys are the full dotted name (e.g. `home.about.lead`, `projects.ledger`). A list
  heading `### music.list []` parses to key **`music.list`** (the `[]` is stripped) —
  consumers must use that exact key (carousel.js reads `SITE_CONTENT['music.list']`,
  not `.music`; this bit me once).

## How it's wired into the DOM

- **Scalars:** `<p data-content="home.about.lead">…fallback…</p>` → `content.js`
  sets `innerHTML` to the rendered field. The HTML keeps the current text as a
  fallback if `content.md` ever fails to load.
- **Lists:** `<ol data-content-list="projects.ledger"></ol>` → `content.js` renders
  the items with a template in its `TEMPLATES` map. **If you change a list's markup
  in CSS, update the matching template in `content.js`.** Templates exist for:
  `home.about.facts`, `home.contact`, `think.manifesto.tenets`, `books.list`,
  `books.worlds.items` (specimens — joined by the ritual·body·concept bridge),
  `books.taste.items`, `projects.ledger`.
- **Carousels:** music cards are rendered by `carousel.js` from `SITE_CONTENT['music.list']`
  (covers/previews still enriched live from Spotify oEmbed + iTunes). Book cards are
  rendered by `content.js` (`books.list`); `carousel.js` only wires the drag/snap after
  `content:ready`, with a 2.5s fallback boot if content never loads.
- **Roles** (hero subtitle cycler) come from `SITE_CONTENT['home.roles']`; `main.js`
  swaps its default list on `content:ready`.

## Deliberately NOT in content.md

The brand name "Yash Upadhyay" (woven into the hero collapse markup + nav brand),
nav link labels, and page `<title>`s stay in the HTML.

## Gotchas

- The dev server (`python -m http.server`) caches hard. Asset refs carry `?v=N`
  (content.js v1, main.js v7, carousel.js v3, style.css v6) — bump on change; verify
  in-browser via a never-seen URL like `index.html?fresh=<ts>`.
- `content.js` renders via `innerHTML` with no escaping — content.md is trusted
  (your own copy). Don't paste untrusted HTML into it.
