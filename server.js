const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── API proxy — /api/brief → Anthropic ───────────────────────────────────────
app.post('/api/brief', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY is not configured.' } });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Anthropic API error:', err);
    return res.status(502).json({ error: { message: 'Failed to reach Anthropic API.' } });
  }
});

// ── API proxy — /api/image → OpenAI gpt-image-2 ──────────────────────────────
app.post('/api/image', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'OPENAI_API_KEY is not configured.' } });
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('OpenAI Image API error:', err);
    return res.status(502).json({ error: { message: 'Failed to reach OpenAI Image API.' } });
  }
});

// ── URL fetch proxy — /api/fetch (for Ruth's article URL ingestion) ───────────
app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: { message: 'URL is required.' } });
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CyberSenseOps/1.0; +https://cybersense.solutions)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });
    if (!response.ok) {
      console.error(`Fetch failed for ${url}: HTTP ${response.status}`);
      return res.status(response.status).json({
        error: { message: `Fetch failed: HTTP ${response.status} for ${url}` }
      });
    }
    const html = await response.text();
    // Strip HTML tags for clean text delivery to the model
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return res.json({ text, url, chars: text.length });
  } catch (err) {
    console.error('URL fetch error:', err);
    return res.status(502).json({ error: { message: `Network error fetching URL: ${err.message}` } });
  }
});

// ── Clean URLs — /agents/:pipeline/:agent ─────────────────────────────────────
app.get('/agents/:pipeline/:agent', (req, res) => {
  const file = path.join(__dirname, 'agents', req.params.pipeline, req.params.agent + '.html');
  res.sendFile(file, err => { if (err) res.status(404).send('Agent not found.'); });
});

// ── Fallback ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CyberSense Ops running on port ${PORT}`);
});
