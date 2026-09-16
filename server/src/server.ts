import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { generateChartPayload, type ChatTurn } from './generate';
import { applyChartEnv } from './key';

applyChartEnv();

const PORT = Number(process.env.CHART_PORT || process.env.CHART_API_PORT || 3092);
const BASE = '/sample/ai-generate-app';
const SERVE_STATIC = process.env.CHART_SERVE_STATIC === '1';
const CLIENT_DIST = path.resolve(__dirname, '../../dist/client');

function asHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((item) => {
      const role = (item as ChatTurn)?.role;
      const content = (item as ChatTurn)?.content;
      if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
      return { role, content: content.slice(0, 400) };
    })
    .filter((item): item is ChatTurn => Boolean(item));
}

function mountApi(app: express.Express, prefix: string) {
  app.get(`${prefix}/health`, (_req, res) => {
    res.json({ ok: true, service: 'llm-generated-chart' });
  });

  app.post(`${prefix}/generate`, async (req, res) => {
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) {
        res.status(400).json({ error: 'message required' });
        return;
      }
      const payload = await generateChartPayload(message, asHistory(req.body?.history));
      res.json(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'generate failed';
      res.status(500).json({ error: msg });
    }
  });
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

/* Dev API on :3093 uses bare paths; prod/unified uses /sample/ai-generate-app/api */
mountApi(app, '');
mountApi(app, `${BASE}/api`);
mountApi(app, '/api/chart');

if (SERVE_STATIC && fs.existsSync(CLIENT_DIST)) {
  app.use(BASE, express.static(CLIENT_DIST, { index: false }));
  app.get([BASE, `${BASE}/`], (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  app.use((req, res, next) => {
    if (!req.path.startsWith(BASE)) return next();
    if (req.path.startsWith(`${BASE}/api`)) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'llm-generated-chart' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(
    `llm-generated-chart listening on http://127.0.0.1:${PORT}${SERVE_STATIC ? BASE + '/' : ' (api)'}\n`
  );
});
