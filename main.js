(function () {
  'use strict';

  // ── Theme ─────────────────────────────────────────────────────
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
}());
