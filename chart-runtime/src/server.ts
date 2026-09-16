import * as http from 'http';
import { generateChartPayload, type ChatTurn } from './generate';
import { applyChartEnv } from './key';

applyChartEnv();

const PORT = Number(process.env.CHART_API_PORT || 3093);

function json(res: http.ServerResponse, code: number, body: unknown): void {
  const raw = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(raw),
  });
  res.end(raw);
}

function readBody(req: http.IncomingMessage, limit = 12000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/chart/health')) {
    json(res, 200, { ok: true, service: 'llm-generated-chart' });
    return;
  }

  if (
    req.method === 'POST' &&
    (url.pathname === '/generate' || url.pathname === '/api/chart/generate')
  ) {
    try {
      const body = JSON.parse(await readBody(req)) as { message?: string; history?: unknown };
      const message = String(body.message || '').trim();
      if (!message) {
        json(res, 400, { error: 'message required' });
        return;
      }
      const payload = await generateChartPayload(message, asHistory(body.history));
      json(res, 200, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'generate failed';
      json(res, 500, { error: msg });
    }
    return;
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`chart-runtime listening on http://127.0.0.1:${PORT}\n`);
});
