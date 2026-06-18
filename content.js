/*
 * content.js — pulls all written copy from content.md and injects it.
 *
 * Scalar fields land in elements marked  data-content="key".
 * List fields render into containers marked  data-content-list="key"
 * via the templates below. Parsed data is also exposed on
 * window.SITE_CONTENT and a 'content:ready' event fires when done
 * (main.js uses it for the role cycler, carousel.js for music + books).
 */
(function () {
  'use strict';

  // ── Minimal inline markdown → HTML (content is trusted) ──────
  const inline = (s) => (s == null ? '' : String(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\n+/g, ' ')
    .trim());

  // ── Parser: content.md → { scalarKey: string, listKey: [items] } ──
  function parse(md) {
    const data = {};
    const lines = md.split(/\r?\n/);
    let key = null, isList = false, list = null, item = null, lastField = null, buf = [];

    const flush = () => {
      if (key && !isList) data[key] = buf.join('\n').trim();
      buf = [];
    };
    const field = (obj, str) => {
      const m = str.match(/^([A-Za-z_][\w]*):\s?([\s\S]*)$/);
      if (!m) return;
      lastField = m[1];
      const val = m[2];
      obj[lastField] = lastField === 'tags'
        ? val.split(',').map(t => t.trim()).filter(Boolean)
        : val;
    };

    for (const line of lines) {
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flush();
        if (h[1] === '###') {
          let k = h[2].trim();
          if (/\[\]\s*$/.test(k)) {
            isList = true; key = k.replace(/\s*\[\]\s*$/, '').trim();
            list = data[key] = []; item = null;
          } else {
            isList = false; key = k; buf = [];
          }
        } else {            // # or ## — organizational, ends any field
          key = null; isList = false;
        }
        continue;
      }
      if (line.trim().startsWith('#')) continue;   // stray comment line

      if (isList) {
        const li = line.match(/^\s*-\s+(.*)$/);
        if (li) { item = {}; list.push(item); field(item, li[1]); }
        else if (item && /^\s*[A-Za-z_][\w]*:\s?/.test(line)) { field(item, line.trim()); }
        else if (item && lastField && line.trim()) { item[lastField] += ' ' + line.trim(); }
      } else if (key) {
        buf.push(line);
      }
    }
    flush();
    return data;
  }

  // ── List templates (markup must match style.css) ─────────────
  const pad2 = (n) => String(n).padStart(2, '0');
  const BOOK_THUMB = '<div class="cover-thumb"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 22h16v-5H6.5M4 19.5V5a2 2 0 012-2h14v12H6.5"/></svg></div>';
  const SPECIMEN_BRIDGE = '<span class="specimen-bridge" aria-hidden="true"><span>ritual</span><span class="bridge-dot">·</span><span>body</span><span class="bridge-dot">·</span><span>concept</span></span>';

  const TEMPLATES = {
    'home.about.facts': (items) =>
      items.map(it => `<li>${inline(it.text)}</li>`).join(''),

    'home.contact': (items) =>
      items.map(it => {
        const ext = /^https?:/.test(it.href || '');
        const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${it.href}" class="contact-link"${attrs}>${inline(it.label)}</a>`;
      }).join(''),

    'think.manifesto.tenets': (items) =>
      items.map((it, i) =>
        `<li class="tenet"><span class="tenet-num">${pad2(i + 1)}</span>` +
        `<div class="tenet-body"><p class="tenet-stmt">${inline(it.stmt)}</p>` +
        `<p class="tenet-note">${inline(it.note)}</p></div></li>`).join(''),

    'books.list': (items) =>
      items.map((it, i) => {
        const src = it.isbn ? `https://covers.openlibrary.org/b/isbn/${it.isbn}-L.jpg` : it.cover;
        const art = src
          ? `<img class="cover-art" src="${src}" alt="${it.title}" loading="lazy">`
          : BOOK_THUMB;
        return `<li class="carousel-card" data-idx="${i}"><div class="cover-wrap">${art}</div>` +
          `<div class="cover-meta"><p class="cover-title">${inline(it.title)}</p>` +
          `<p class="cover-sub">${inline(it.sub)}</p></div></li>`;
      }).join(''),

    'books.worlds.items': (items) =>
      items.map(it =>
        `<article class="specimen specimen--${it.variant || 'viral'}">` +
        `<header class="specimen-head"><p class="specimen-name">${inline(it.name)}</p>` +
        `<p class="specimen-kind">${inline(it.kind)}</p></header>` +
        `<p class="specimen-logic">${inline(it.logic)}</p>` +
        `<p class="specimen-note">${inline(it.note)}</p>` +
        `<ul class="specimen-tags">${(it.tags || []).map(t => `<li>${t}</li>`).join('')}</ul>` +
        `</article>`).join(SPECIMEN_BRIDGE),

    'books.taste.items': (items) =>
      items.map(it =>
        `<div class="taste-card"><p class="taste-card-head">${inline(it.head)}</p>` +
        `<p class="taste-card-body">${inline(it.body)}</p>` +
        (it.refs ? `<p class="taste-card-refs">${inline(it.refs)}</p>` : '') +
        `</div>`).join(''),

    'projects.ledger': (items) =>
      items.map(it =>
        `<li class="ledger-row"><span class="ledger-date">${inline(it.date)}</span>` +
        `<div class="ledger-body"><p class="ledger-title">` +
        `<span class="ledger-glyph" aria-hidden="true">&rsaquo;</span> ${inline(it.title)} ` +
        `<span class="ledger-role">— ${inline(it.role)}</span></p>` +
        `<p class="ledger-desc">${inline(it.desc)}</p>` +
        `<ul class="ledger-tags">${(it.tags || []).map(t => `<li>${t}</li>`).join('')}</ul>` +
        `</div></li>`).join(''),
  };

  // ── Apply to the DOM ─────────────────────────────────────────
  function apply(data) {
    document.querySelectorAll('[data-content]').forEach(el => {
      const v = data[el.dataset.content];
      if (v != null) el.innerHTML = inline(v);
    });
    document.querySelectorAll('[data-content-list]').forEach(el => {
      const key = el.dataset.contentList;
      const items = data[key];
      const tmpl = TEMPLATES[key];
      if (Array.isArray(items) && tmpl) el.innerHTML = tmpl(items);
    });
  }

  fetch('content.md?v=1', { cache: 'no-cache' })
    .then(r => r.text())
    .then(md => {
      const data = parse(md);
      window.SITE_CONTENT = data;
      apply(data);
      document.dispatchEvent(new CustomEvent('content:ready', { detail: data }));
    })
    .catch(err => console.error('content.md failed to load:', err));
}());
