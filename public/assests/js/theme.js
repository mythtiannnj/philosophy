(function () {
  const STORAGE_KEY = 'philosophy-theme';
  const DEFAULT = 'dark';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT;
  }

  function applyTheme(name) {
    document.body.setAttribute('data-theme', name);
    localStorage.setItem(STORAGE_KEY, name);
    document.querySelectorAll('.theme-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === name);
    });
  }

  // Apply immediately (before paint) to avoid flash
  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle button').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
  });
})();