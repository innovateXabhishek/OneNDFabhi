/* oneNDF Credit-Readiness Copilot — Render web service
 * Serves the static app AND proxies the live chat to Groq,
 * keeping your GROQ_API_KEY secret on the server (never in the browser).
 *
 * Deploy on Render as a "Web Service":
 *   Build command : npm install
 *   Start command : node server.js
 *   Environment   : add GROQ_API_KEY = <your key from console.groq.com>
 */
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

// --- serve the front-end (index.html + assets in this folder) ---
app.use(express.static(__dirname));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- live chat proxy -> Groq (OpenAI-compatible) ---
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GROQ_API_KEY not set on the server.' });
    }
    const { messages, model } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 350,
        temperature: 0.6,
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'Groq error', status: r.status, detail });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('oneNDF Copilot running on port ' + PORT));
