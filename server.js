const express = require('express');
const path = require('path');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'onendf-credit-copilot.html'));
});

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
  try {

    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: 'GROQ_API_KEY missing'
      });
    }

    const { messages, model } = req.body;

    const response = await fetch(GROQ_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },

      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.6,
        max_tokens: 350
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || '';

    res.json({
      reply
    });

  } catch (err) {

    res.status(500).json({
      error: String(err)
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});
