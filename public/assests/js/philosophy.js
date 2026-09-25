(function () {
  const API_BASE = 'https://philosophersapi.com';
  let allPhilosophers = [];
  let allQuotes = [];

  function buildImageUrl(p) {
    if (!p) return '';
    if (p.startsWith('http')) return p;
    return API_BASE + p;
  }
  function getFace(p) {
    const i = p.images || {};
    return (
      i.faceImages?.['face500x500'] ||
      i.faceImages?.['face250x250'] ||
      i.faceImages?.['face750x750'] ||
      i.fullImages?.['full600x800'] ||
      i.fullImages?.['full1200x1600'] ||
      i.illustrations?.['ill500x500'] ||
      ''
    );
  }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function renderCard(p, i) {
    const img = buildImageUrl(getFace(p));
    const links = [];
    if (p.speLink) links.push(`<a href="${p.speLink}" target="_blank" rel="noopener">Stanford</a>`);
    if (p.iepLink) links.push(`<a href="${p.iepLink}" target="_blank" rel="noopener">IEP</a>`);
    if (p.wikiTitle) links.push(`<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(p.wikiTitle)}" target="_blank" rel="noopener">Wiki</a>`);

    return `
      <article class="philosopher-card glass animate-reveal" style="animation-delay:${Math.min(i * 0.03, 0.5)}s;">
        <div class="portrait" style="background-image: url('${img}');">
          ${p.life ? `<span class="life-badge">${esc(p.life)}</span>` : ''}
          ${p.school ? `<span class="school-badge">${esc(p.school)}</span>` : ''}
        </div>
        <div class="content">
          <h3>${esc(p.name)}</h3>
          ${p.interests ? `<div class="interests"><i class="fas fa-lightbulb"></i>${esc(p.interests)}</div>` : ''}
          ${p.topicalDescription ? `<p class="topical">${esc(p.topicalDescription)}</p>` : '<p class="topical" style="opacity:0.4;">No description.</p>'}
          ${links.length ? `<div class="links">${links.join('')}</div>` : ''}
        </div>
      </article>`;
  }

  function renderList(list) {
    const grid = document.getElementById('philosopherGrid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<div class="loading">▸ No philosophers match your search.</div>`;
      return;
    }
    grid.innerHTML = list.map((p, i) => renderCard(p, i)).join('');
  }

  async function loadPhilosophers() {
    const grid = document.getElementById('philosopherGrid');
    if (!grid) return;

    // skeleton
    grid.innerHTML = Array.from({ length: 8 }).map(() => `
      <div class="philosopher-card glass" style="pointer-events:none;">
        <div class="skeleton" style="height:260px;border-radius:0;"></div>
        <div class="content">
          <div class="skeleton" style="height:20px;width:70%;margin-bottom:10px;"></div>
          <div class="skeleton" style="height:14px;width:50%;margin-bottom:16px;"></div>
          <div class="skeleton" style="height:52px;width:100%;"></div>
        </div>
      </div>`).join('');

    try {
      const res = await fetch('/api/philosophers');
      const data = await res.json();
      allPhilosophers = Array.isArray(data) ? data : [];
      const countEl = document.getElementById('stat-count');
      if (countEl) countEl.textContent = allPhilosophers.length;
      renderList(allPhilosophers);
    } catch (e) {
      grid.innerHTML = `<div class="error-msg">⚠ Failed to load philosophers.</div>`;
    }
  }

  function pickRandomQuote() {
    if (!allQuotes.length) return;
    const q = allQuotes[Math.floor(Math.random() * allQuotes.length)];
    const philo = allPhilosophers.find(p => p.id === q.philosopher?.id);
    const textEl = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    const refEl = document.getElementById('quoteRef');
    if (!textEl) return;

    textEl.textContent = `“${q.quote}”`;
    authorEl.textContent = `— ${philo ? philo.name : 'Unknown'}`;
    const parts = [];
    if (q.work) parts.push(q.work);
    if (q.year) parts.push(q.year);
    refEl.textContent = parts.join(' · ');

    const sec = document.getElementById('quoteHighlight');
    if (sec) {
      sec.style.animation = 'none';
      void sec.offsetWidth;
      sec.style.animation = 'reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }

  async function loadQuotes() {
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      allQuotes = Array.isArray(data) ? data : [];
      pickRandomQuote();
    } catch (e) {
      const t = document.getElementById('quoteText');
      if (t) t.textContent = 'Could not load quote.';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadPhilosophers().then(loadQuotes);

    const search = document.getElementById('searchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();
        if (!term) return renderList(allPhilosophers);
        const filtered = allPhilosophers.filter(p => {
          const hay = [p.name, p.school, p.interests, p.topicalDescription, p.life]
            .filter(Boolean).join(' ').toLowerCase();
          return hay.includes(term);
        });
        renderList(filtered);
      });
    }

    const refresh = document.getElementById('refreshQuote');
    if (refresh) refresh.addEventListener('click', pickRandomQuote);
  });
})();