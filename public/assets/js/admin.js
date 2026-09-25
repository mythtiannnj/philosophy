/* ============================================================
   Admin panel — loads /api/config (not /config.json)
   ============================================================ */
(function () {
  let CONFIG = null;

  // ---------- Helpers ----------
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function log(msg, type = 'info') {
    const box = document.getElementById('syslog');
    if (!box) return;
    const ts = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = `<span class="ts">[${ts}]</span><span class="msg ${type}">${esc(msg)}</span>`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  // ---------- Profile ----------
  function renderProfile(p) {
    const avatarEl = document.getElementById('admin-avatar');
    avatarEl.src = p.avatar;
    avatarEl.alt = p.name;
    avatarEl.onerror = () => {
      // fallback if remote avatar fails
      avatarEl.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="#0d1422"/>
          <text x="50" y="58" text-anchor="middle" font-size="40" fill="#22d3ee" font-family="sans-serif">${(p.name || 'C')[0]}</text>
        </svg>`);
    };

    document.getElementById('admin-name').innerHTML =
      esc(p.name) +
      (p.verified
        ? `<span class="verified-badge" title="Verified">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="20 6 9 17 4 12"/>
             </svg>
           </span>`
        : '');

    document.getElementById('admin-role').textContent = p.role || '';
    document.getElementById('admin-location').innerHTML =
      `<i class="fas fa-location-dot"></i> ${esc(p.location || '')}`;
    document.getElementById('admin-joined').innerHTML =
      `<i class="fas fa-calendar"></i> Joined ${esc(p.joined || '')}`;
    document.getElementById('admin-bio').textContent = p.bio || '';

    const q = document.getElementById('admin-quote');
    const qa = document.getElementById('admin-quote-author');
    if (q && p.quote) {
      q.textContent = `“${p.quote}”`;
      qa.textContent = `— ${p.quoteAuthor || ''}`;
    }

    const linksWrap = document.getElementById('admin-links');
    linksWrap.innerHTML = '';
    const linkMeta = {
      website: { icon: 'fa-globe',    label: 'Website' },
      twitter: { icon: 'fa-twitter',  label: 'Twitter' },
      github:  { icon: 'fa-github',   label: 'GitHub'  },
      email:   { icon: 'fa-envelope', label: 'Email'   },
    };
    Object.entries(p.links || {}).forEach(([k, v]) => {
      if (!v) return;
      const meta = linkMeta[k] || { icon: 'fa-link', label: k };
      const a = document.createElement('a');
      a.href = k === 'email' ? `mailto:${v}` : v;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `<i class="fab ${meta.icon}"></i> ${meta.label}`;
      linksWrap.appendChild(a);
    });
  }

  // ---------- Endpoints ----------
  function renderEndpoints(list) {
    const wrap = document.getElementById('endpoint-list');
    wrap.innerHTML = '';
    list.forEach(ep => {
      const row = document.createElement('div');
      row.className = 'api-row';
      row.innerHTML = `
        <span class="method">${esc(ep.method)}</span>
        <code>${esc(ep.path)}</code>
        <span class="status ${ep.active ? '' : 'offline'}">
          <span class="dot"></span>${ep.active ? 'Active' : 'Offline'}
        </span>
        <div class="actions">
          <button class="mini-btn" data-endpoint="${esc(ep.path)}">Test</button>
        </div>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('[data-endpoint]').forEach(btn => {
      btn.addEventListener('click', () => pingEndpoint(btn.dataset.endpoint));
    });
  }

  // ---------- Preferences ----------
  function renderPreferences(list) {
    const wrap = document.getElementById('pref-list');
    wrap.innerHTML = '';
    list.forEach(pref => {
      const row = document.createElement('div');
      row.className = 'setting-row';
      row.innerHTML = `
        <div>
          <div class="name">${esc(pref.name)}</div>
          <div class="desc">${esc(pref.desc)}</div>
        </div>
        <div class="switch ${pref.default ? 'on' : ''}" data-pref="${esc(pref.id)}"></div>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        sw.classList.toggle('on');
        log(`Preference "${sw.dataset.pref}" → ${sw.classList.contains('on') ? 'ON' : 'OFF'}`);
      });
    });
  }

  // ---------- Live stats ----------
  async function loadStats() {
    try {
      const [p, q, k] = await Promise.all([
        fetch('/api/philosophers').then(r => r.json()),
        fetch('/api/quotes').then(r => r.json()),
        fetch('/api/keyideas').then(r => r.json()),
      ]);
      document.getElementById('admin-philosophers').textContent = Array.isArray(p) ? p.length : '—';
      document.getElementById('admin-quotes').textContent       = Array.isArray(q) ? q.length : '—';
      document.getElementById('admin-ideas').textContent        = Array.isArray(k) ? k.length : '—';
      log(`Loaded ${p.length} philosophers · ${q.length} quotes · ${k.length} ideas.`, 'ok');
    } catch (e) {
      log('Failed to load stats: ' + e.message, 'warn');
    }
  }

  async function pingEndpoint(url) {
    log(`Testing ${url}…`);
    const start = performance.now();
    try {
      const r = await fetch(url);
      const elapsed = Math.round(performance.now() - start);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const size = Array.isArray(data) ? data.length : Object.keys(data).length;
      log(`${url} → OK (${elapsed}ms · ${size} records)`, 'ok');
    } catch (e) {
      log(`${url} → FAIL (${e.message})`, 'warn');
    }
  }

  // ---------- Clock ----------
  function tick() {
    const el = document.getElementById('admin-time');
    if (el) el.textContent = new Date().toLocaleTimeString();
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', async () => {
    setInterval(tick, 1000);
    tick();

    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      CONFIG = await res.json();
    } catch (e) {
      log('Failed to load /api/config: ' + e.message, 'warn');
      return;
    }

    const admin = CONFIG.admin || {};
    renderProfile(admin.profile || {});
    renderEndpoints(admin.endpoints || []);
    renderPreferences(admin.preferences || []);
    loadStats();

    log(`Admin console ready · ${CONFIG.site?.name || 'Site'} v${CONFIG.site?.version || '?'}`, 'ok');
  });
})();