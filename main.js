(function () {
  'use strict';

  const root  = document.documentElement;
  const STORE = 'theme';

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORE, theme);
    document.querySelectorAll('.theme-toggle').forEach(t =>
      t.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'));
  };

  applyTheme(localStorage.getItem(STORE) || getSystemTheme());

  document.querySelectorAll('.theme-toggle').forEach(t =>
    t.addEventListener('click', () =>
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
    )
  );

  // ── Hamburger menu / nav overlay ──────────────────────────────
  const menuBtn = document.getElementById('menu-btn');
  const overlay = document.getElementById('nav-overlay');

  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if (overlay) overlay.setAttribute('aria-hidden', String(!open));
  };

  if (menuBtn) {
    menuBtn.addEventListener('click', () =>
      setMenu(!document.body.classList.contains('menu-open')));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  // Close on link click (links navigate to a new page anyway)
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  // ── Role cycler — rotates the hero subtitle word ──────────────
  const cycler = document.getElementById('role-cycler');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (cycler && !reduceMotion) {
    let ROLES = [
      'industrial engineer',
      'dancer',
      'builder',
      'worldbuilder',
      'debate coach',
      'baker',
    ];
    // content.md is the source of truth — swap in its roles when it loads.
    document.addEventListener('content:ready', () => {
      const r = window.SITE_CONTENT && window.SITE_CONTENT['home.roles'];
      if (Array.isArray(r) && r.length) {
        ROLES = r.map(x => (x && x.text) || x).filter(Boolean);
      }
    });
    let i = 0;
    setInterval(() => {
      cycler.classList.add('is-swapping');
      setTimeout(() => {
        i = (i + 1) % ROLES.length;
        cycler.textContent = ROLES[i];
        cycler.classList.remove('is-swapping');
      }, 280);
    }, 2400);
  }

  // ── Home: the cover collapses into the header (à la scroll-driven
  //    cover-to-fixed-header) + the wheel spins with scroll velocity ──
  // The full-height .cover is fixed; scrolling drives its height 100vh →
  // --topbar-h, so its own bottom border travels up into the header hairline.
  // The name (pinned fixed, transform-morphed) docks top-left; the hamburger
  // and theme toggle pop in (--chrome); hero furniture fades out (--fade).
  // The sigil spins continuously — slow idle drift plus a scroll-velocity term
  // (scroll down → clockwise, scroll up → counter-clockwise, faster than idle).
  const cover     = document.querySelector('.cover');
  const coverName = document.getElementById('cover-name');
  const sigil     = document.getElementById('hero-sigil');
  const clamp01   = (n) => n < 0 ? 0 : n > 1 ? 1 : n;

  if (cover && coverName && document.body.classList.contains('home') && !reduceMotion) {
    document.body.classList.add('js-cover');

    const rootPx   = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const TOPBAR_H = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--topbar-h')) || 64;
    const DOCK_FONT = 1.6 * rootPx;    // docked wordmark size (px) — kept big + crisp
    const GAP       = 18;              // gap after the hamburger

    const geo = { restLeft: 0, restTop: 0, restFont: 0, dockLeft: 0, dockTop: 0 };

    // Capture the name's at-rest (centred) geometry, then pin it as fixed with a
    // top-left origin. The morph animates font-size (crisp at every size) plus a
    // translate, rather than transform-scaling a huge glyph down (which blurs).
    const measure = () => {
      coverName.style.fontSize  = '';   // back to the CSS clamp() for the read
      coverName.style.position  = 'absolute';
      coverName.style.left      = '50%';
      coverName.style.top       = '50%';
      coverName.style.width     = 'auto';
      coverName.style.transform = 'translate(-50%, -50%)';

      const r  = coverName.getBoundingClientRect();
      const cs = getComputedStyle(coverName);
      geo.restFont = parseFloat(cs.fontSize);
      geo.restLeft = r.left;
      geo.restTop  = r.top;             // viewport coords (cover is fixed at top)

      const lhRatio = (parseFloat(cs.lineHeight) || geo.restFont) / geo.restFont;
      const dockH   = DOCK_FONT * lhRatio;
      const mb      = menuBtn ? menuBtn.getBoundingClientRect() : { right: 0 };
      geo.dockLeft  = mb.right + GAP;
      // Optical lift: "Yash" is cap-heavy with almost no descender, so its
      // lowercase mass sits below the geometric centre. Nudge up ~0.1em so the
      // x-height — not the empty box bottom — lines up with the hamburger bar.
      geo.dockTop   = (TOPBAR_H - dockH) / 2 - DOCK_FONT * 0.1;

      // Pin top-left; width stays auto so the font-size morph reflows crisply.
      coverName.style.position  = 'fixed';
      coverName.style.left      = r.left + 'px';
      coverName.style.top       = r.top + 'px';
      coverName.style.width     = 'auto';
      coverName.style.transform = 'none';
    };

    // ── Wheel spin: persistent rAF so the idle drift runs even when still ──
    const IDLE_DPS  = 5;     // idle degrees / second
    const SCROLL_K  = 0.2;   // degrees per scrolled pixel (the reactive term)
    let angle  = 0;
    let lastY  = window.scrollY;
    let lastT  = performance.now();
    const body = document.body;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      const y  = window.scrollY;
      const dy = y - lastY; lastY = y;

      // Spin: idle drift + scroll velocity (down +CW, up −CCW, faster than idle).
      angle += IDLE_DPS * dt + dy * SCROLL_K;

      const vh    = window.innerHeight;
      const range = Math.max(1, vh - TOPBAR_H);
      const p     = clamp01(y / range);

      // Cover height: 100vh → topbar. Its bottom border rides up into the bar.
      cover.style.height = (vh - (vh - TOPBAR_H) * p) + 'px';

      // Name morph: centre → docked top-left wordmark. Font-size shrinks (crisp)
      // and the top-left corner travels to the header slot.
      coverName.style.fontSize = (geo.restFont + (DOCK_FONT - geo.restFont) * p) + 'px';
      coverName.style.transform =
        `translate(${(geo.dockLeft - geo.restLeft) * p}px, ${(geo.dockTop - geo.restTop) * p}px)`;

      // Chrome pops in over the last ~40% of the collapse.
      const chrome = clamp01((p - 0.6) / 0.4);
      body.style.setProperty('--chrome', chrome);
      body.classList.toggle('chrome-on', chrome > 0.01);

      // Hero furniture clears early so it's gone before the bar forms.
      body.style.setProperty('--fade', clamp01(1 - p / 0.55));

      // Wheel rides the collapse: spin + shrink as it's drawn into the bar.
      if (sigil) {
        sigil.style.transform =
          `translate(-50%, -50%) rotate(${angle}deg) scale(${1 - 0.6 * p})`;
      }

      requestAnimationFrame(frame);
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }

    measure();
    requestAnimationFrame(frame);
  }

  // ── Cover: mouse-weight particle field ────────────────────────
  // A grid of faint dots. The cursor repels nearby dots; a spring pulls each
  // back to its home with damping, so a moving cursor leaves a ripple/wake and
  // "feels like it has weight". Canvas-only, behind the wheel; skipped under
  // reduced motion. Inspired by the antigravity.google hero.
  const fx = document.getElementById('cover-fx');

  if (fx && cover && document.body.classList.contains('home') && !reduceMotion) {
    const ctx = fx.getContext('2d');

    const SPACING = 46;     // grid pitch (px)
    const RADIUS  = 130;    // cursor influence radius
    const PUSH    = 2.4;    // repulsion strength
    const SPRING  = 0.045;  // pull back to home
    const DAMP    = 0.86;   // velocity damping (the heft / settle)
    const DOT     = 1.15;   // dot radius
    const GOLD    = '212,165,116';

    let dots = [], W = 0, H = 0, dpr = 1;
    const mouse = { x: -9999, y: -9999, on: false };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      fx.width = W * dpr; fx.height = H * dpr;
      fx.style.width = W + 'px'; fx.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(W / SPACING);
      const rows = Math.ceil(H / SPACING);
      const offX = (W - (cols - 1) * SPACING) / 2;
      const offY = (H - (rows - 1) * SPACING) / 2;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const hx = offX + c * SPACING;
          const hy = offY + r * SPACING;
          dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
        }
      }
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; };
    const onLeave = () => { mouse.on = false; mouse.x = mouse.y = -9999; };

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const r2 = RADIUS * RADIUS;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        let ax = (d.hx - d.x) * SPRING;
        let ay = (d.hy - d.y) * SPRING;

        if (mouse.on) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < r2 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const f = (1 - dist / RADIUS) * PUSH;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }

        d.vx = (d.vx + ax) * DAMP;
        d.vy = (d.vy + ay) * DAMP;
        d.x += d.vx; d.y += d.vy;

        // Displacement from home drives brightness — pushed dots glow, the wake
        // glows brightest, the field rests faint.
        const ox = d.x - d.hx, oy = d.y - d.hy;
        const disp = Math.min(1, Math.sqrt(ox * ox + oy * oy) / 26);
        const alpha = 0.12 + disp * 0.55;

        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT + disp * 1.1, 0, 6.2832);
        ctx.fillStyle = `rgba(${GOLD},${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    };

    let fxResize;
    window.addEventListener('resize', () => {
      clearTimeout(fxResize);
      fxResize = setTimeout(build, 150);
    });
    cover.addEventListener('mousemove', onMove);
    cover.addEventListener('mouseleave', onLeave);

    build();
    requestAnimationFrame(tick);
  }

}());
