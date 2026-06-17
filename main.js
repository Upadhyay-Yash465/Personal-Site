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
    const ROLES = [
      'industrial engineer',
      'dancer',
      'builder',
      'worldbuilder',
      'debate coach',
      'baker',
    ];
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

  // ── Home: dock the hero name into the header on scroll ────────
  // The big hero name is pinned (position: fixed) and morphed with a
  // transform — translate + scale — from its hero position into the
  // header brand slot. Transform only: GPU-cheap, crisp text, no reflow,
  // wrap-agnostic. The header chrome (--collapse) and hero furniture
  // (--fade) ramp off the same scroll progress.
  const heroName = document.querySelector('.home-hero .hero-name');

  if (heroName && document.body.classList.contains('home') && !reduceMotion) {
    document.body.classList.add('js-collapse');

    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const TOPBAR_H   = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--topbar-h')) || 64;
    const DOCK_FONT  = 1.25 * rootPx;   // docked wordmark size (≈ brand)
    const GAP        = 18;              // gap after the hamburger

    const geo = { left: 0, top: 0, scale: 1, dockLeft: 0, dockTop: 0 };

    const measure = () => {
      // Read the hero geometry with the morph cleared, so we capture the
      // name's true at-rest position and size.
      heroName.style.position = '';
      heroName.style.width = '';
      heroName.style.left = '';
      heroName.style.top = '';
      heroName.style.transform = 'none';

      const r = heroName.getBoundingClientRect();
      const origFont = parseFloat(getComputedStyle(heroName).fontSize);
      geo.left = r.left;
      geo.top  = r.top + window.scrollY;   // scroll-0 viewport top
      geo.scale = DOCK_FONT / origFont;    // shrink to wordmark size

      const dockH = r.height * geo.scale;
      const mb = menuBtn ? menuBtn.getBoundingClientRect() : { right: 0 };
      geo.dockLeft = mb.right + GAP;
      geo.dockTop  = (TOPBAR_H - dockH) / 2;

      // Pin it. Keep the at-rest width so wrapping never changes.
      heroName.style.position = 'fixed';
      heroName.style.width = r.width + 'px';
      heroName.style.left = geo.left + 'px';
      heroName.style.top  = geo.top + 'px';
    };

    const clamp01 = (n) => n < 0 ? 0 : n > 1 ? 1 : n;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const dist = window.innerHeight * 0.62;        // travel range
      const p = clamp01(window.scrollY / dist);

      const tx = (geo.dockLeft - geo.left) * p;
      const ty = (geo.dockTop  - geo.top)  * p;
      const sc = 1 + (geo.scale - 1) * p;
      heroName.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;

      // Header veil tracks the name's arrival — it finishes forming as the
      // name lands (ease-out cubic for a decisive settle). Hero furniture
      // clears early so it's gone before the name leaves.
      const raw = clamp01((p - 0.08) / 0.82);
      const eased = 1 - Math.pow(1 - raw, 3);
      document.body.style.setProperty('--collapse', eased);
      document.body.style.setProperty('--fade', clamp01(1 - p / 0.4));
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { measure(); apply(); }, 120);
    };

    measure();
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Fonts load late and reflow the name — re-measure when they settle.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { measure(); apply(); });
    }
  }

}());
