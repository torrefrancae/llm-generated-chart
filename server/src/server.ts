import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { generateChartOutcome, type ChatTurn } from './generate';
import { applyChartEnv } from './key';
import {
  beginFlight,
  denyMessage,
  endFlight,
  peekTry,
  socketIp,
  takeTry,
  usageFor,
} from './limit';

applyChartEnv();

const PORT = Number(process.env.CHART_PORT || process.env.CHART_API_PORT || 0);
const BASE = '/sample/ai-generate-app';
const SERVE_STATIC = process.env.CHART_SERVE_STATIC === '1';
const CLIENT_DIST = path.resolve(__dirname, '../../dist/client');
const ALLOWED_ORIGINS = new Set(
  String(process.env.CHART_CORS_ORIGINS || 'https://torrefranca.site,http://127.0.0.1:3092,http://localhost:3092')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

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

function publicError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/chart service unavailable|missing cursor api key/i.test(msg)) return 'Chart service is not configured yet.';
  if (/chart agent|no json|quiet/i.test(msg)) return 'Chart generation failed. Try a simpler prompt.';
  return 'Chart generation failed.';
}

function mountApi(app: express.Express, prefix: string) {
  app.get(`${prefix}/health`, (_req, res) => {
    res.json({ ok: true, service: 'llm-generated-chart' });
  });

  app.get(`${prefix}/usage`, (req, res) => {
    const ip = socketIp(req);
    res.json({ ok: true, ...usageFor(ip) });
  });

  app.post(`${prefix}/generate`, async (req, res) => {
    const ip = socketIp(req);
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) {
        res.status(400).json({ error: 'message required', ...usageFor(ip) });
        return;
      }

      const gate = peekTry(ip);
      if (!gate.ok) {
        res.status(429).json({
          error: denyMessage(gate.reason),
          code: gate.reason,
          used: gate.used,
          left: gate.left,
          max: gate.max,
        });
        return;
      }

      if (!beginFlight(ip)) {
        res.status(429).json({
          error: denyMessage('busy'),
          code: 'busy',
          ...usageFor(ip),
        });
        return;
      }

      const reserved = takeTry(ip);
      if (!reserved.ok) {
        endFlight(ip);
        res.status(429).json({
          error: denyMessage(reserved.reason),
          code: reserved.reason,
          used: reserved.used,
          left: reserved.left,
          max: reserved.max,
        });
        return;
      }

      try {
        const outcome = await generateChartOutcome(message, asHistory(req.body?.history));
        res.json({
          ...outcome,
          used: reserved.used,
          left: reserved.left,
          max: reserved.max,
        });
      } finally {
        endFlight(ip);
      }
    } catch (err) {
      endFlight(ip);
      res.status(500).json({ error: publicError(err), ...usageFor(ip) });
    }
  });
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

/* Dev API on bare paths; prod Passenger often strips to /api/chart; unified local also serves sample path. */
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

if (PORT > 0) {
  app.listen(PORT, '127.0.0.1', () => {
    process.stdout.write(
      `llm-generated-chart listening on http://127.0.0.1:${PORT}${SERVE_STATIC ? BASE + '/' : ' (api)'}\n`
    );
  });
} else {
  /* Passenger injects the socket when listen() is called with no port. */
  app.listen();
}
