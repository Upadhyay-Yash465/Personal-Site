(function () {
  'use strict';

  // ── Theme ─────────────────────────────────────────────────────
  const root   = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const STORE  = 'theme';

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORE, theme);
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  };

  // On load: honour saved preference, then system, then default dark
  const saved = localStorage.getItem(STORE);
  applyTheme(saved || getSystemTheme());

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // ── Scrolled header border ────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}());
