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

  // ── Role cycler — rotates the hero subtitle word ──────────────
  const cycler = document.getElementById('role-cycler');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (cycler && !reduceMotion) {
    const ROLES = [
      'industrial engineer',
      'dancer',
      'builder',
      'worldbuilder',
      'debate coach',
      'baker',
    ];
    let i = 0;
    setInterval(() => {
      cycler.classList.add('is-swapping');
      setTimeout(() => {
        i = (i + 1) % ROLES.length;
        cycler.innerHTML = ROLES[i];
        cycler.classList.remove('is-swapping');
      }, 280);
    }, 2400);
  }
}());
