const express = require('express');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const PHILO_API = 'https://philosophersapi.com/api';

app.use(express.static(path.join(__dirname, 'public')));

// ---- Page routes ----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/philosophy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'philosophy.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ---- API proxy ----
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