const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const PHILO_API = 'https://philosophersapi.com/api';

// ---- Load server-side config (root, not /public) ----
const CONFIG_PATH = path.join(__dirname, 'config.json');
let CONFIG = {};
try {
  CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  console.log('✓ Loaded config.json');
} catch (e) {
  console.error('✗ Failed to load config.json:', e.message);
  CONFIG = { site: { name: 'Philosophy Explorer' } };
}

// Static files (public only)
app.use(express.static(path.join(__dirname, 'public')));

// ---- Page routes ----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/philosophy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'philosophy.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ---- Config API (exposes only what's safe to share) ----
app.get('/api/config', (req, res) => {
  const safeConfig = {
    site: CONFIG.site || {},
    admin: {
      profile: CONFIG.admin?.profile || {},
      stats: CONFIG.admin?.stats || {},
      endpoints: CONFIG.admin?.endpoints || [],
      preferences: CONFIG.admin?.preferences || [],
    },
  };
  res.json(safeConfig);
});

// ---- Data proxies ----
app.get('/api/philosophers', async (req, res) => {
  try {
    const r = await fetch(`${PHILO_API}/philosophers`);
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: 'fetch failed' }); }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const r = await fetch(`${PHILO_API}/quotes`);
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: 'fetch failed' }); }
});

app.get('/api/keyideas', async (req, res) => {
  try {
    const r = await fetch(`${PHILO_API}/keyideas`);
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: 'fetch failed' }); }
});

// ---- Error pages ----
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

app.listen(PORT, () => console.log(`🧠 Philosophy server at http://localhost:${PORT}`));