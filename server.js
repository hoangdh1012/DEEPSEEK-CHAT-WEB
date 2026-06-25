// ================================================================
// DeepSeek Novel Game - Web Server (Express Backend)
// Proxies API calls to DeepSeek & Gemini (bypass CORS)
// ================================================================

const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ──────────── Health Check ────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ──────────── DeepSeek API Proxy ────────────
app.post('/api/deepseek', (req, res) => {
  const { apiKey, messages, temperature, maxTokens } = req.body;

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Missing API key' });
  }

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: messages || [],
    temperature: temperature || 0.8,
    max_tokens: maxTokens || 4096,
    stream: false
  });

  const options = {
    hostname: 'api.deepseek.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 120000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.choices && json.choices[0] && json.choices[0].message) {
          res.json({ success: true, content: json.choices[0].message.content });
        } else {
          res.json({ success: false, error: json.error?.message || 'Invalid API response' });
        }
      } catch (e) {
        res.json({ success: false, error: `Parse error: ${e.message}` });
      }
    });
  });

  proxyReq.on('error', (e) => {
    res.json({ success: false, error: `Connection error: ${e.message}` });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.json({ success: false, error: 'Request timed out' });
  });

  proxyReq.write(body);
  proxyReq.end();
});

// ──────────── Gemini API Proxy ────────────
app.post('/api/gemini', (req, res) => {
  const { apiKey, messages, temperature, maxTokens } = req.body;

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Missing API key' });
  }

  // Build prompt from messages
  let fullPrompt = '';
  for (const msg of (messages || [])) {
    if (msg.role === 'system') {
      fullPrompt += `[HƯỚNG DẪN]: ${msg.content}\n\n`;
    } else {
      fullPrompt += `${msg.content}\n`;
    }
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: temperature || 0.8,
      maxOutputTokens: maxTokens || 4096,
      topP: 0.95
    }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 120000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.candidates && json.candidates[0] && json.candidates[0].content) {
          res.json({ success: true, content: json.candidates[0].content.parts[0].text });
        } else {
          res.json({ success: false, error: json.error?.message || 'Invalid Gemini response' });
        }
      } catch (e) {
        res.json({ success: false, error: `Parse error: ${e.message}` });
      }
    });
  });

  proxyReq.on('error', (e) => {
    res.json({ success: false, error: `Connection error: ${e.message}` });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.json({ success: false, error: 'Request timed out' });
  });

  proxyReq.write(body);
  proxyReq.end();
});

// ──────────── Serve index.html for all other routes (SPA) ────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ──────────── Start Server ────────────
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  DeepSeek Novel Game - Web Server`);
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`========================================`);
});
