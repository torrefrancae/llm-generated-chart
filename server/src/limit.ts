import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

export const TRY_MAX = 5;
const DAY_MAX = Number(process.env.CHART_DAILY_MAX || 48);
const WINDOW_MS = 24 * 60 * 60 * 1000;
const GAP_MS = 1200;
const STORE = path.resolve(process.env.CHART_LIMIT_FILE || path.join(__dirname, '../data/limits.json'));

type IpRow = { used: number; resetAt: number; lastAt: number };
type Store = { day: string; global: number; ips: Record<string, IpRow> };

let mem: Store = { day: utcDay(), global: 0, ips: {} };
const inflight = new Set<string>();

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStore(): void {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE, 'utf8')) as Store;
    if (raw && typeof raw === 'object' && raw.ips) {
      mem = {
        day: typeof raw.day === 'string' ? raw.day : utcDay(),
        global: typeof raw.global === 'number' ? raw.global : 0,
        ips: raw.ips,
      };
    }
  } catch {
    mem = { day: utcDay(), global: 0, ips: {} };
  }
  if (mem.day !== utcDay()) {
    mem = { day: utcDay(), global: 0, ips: {} };
  }
}

function saveStore(): void {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(mem), 'utf8');
}

loadStore();

function row(ip: string): IpRow {
  const now = Date.now();
  if (mem.day !== utcDay()) {
    mem = { day: utcDay(), global: 0, ips: {} };
  }
  const hit = mem.ips[ip];
  if (!hit || hit.resetAt <= now) {
    const fresh: IpRow = { used: 0, resetAt: now + WINDOW_MS, lastAt: 0 };
    mem.ips[ip] = fresh;
    return fresh;
  }
  return hit;
}

function isLoopback(remote: string): boolean {
  return remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
}

function cleanIp(value: string): string | null {
  const ip = value.trim();
  if (!ip || ip.toLowerCase() === 'unknown') return null;
  if (!/^[\w.:]+$/.test(ip)) return null;
  return ip;
}

export function socketIp(req: http.IncomingMessage): string {
  const remote = req.socket.remoteAddress || '0.0.0.0';
  if (process.env.CHART_TRUST_PROXY === '1' && isLoopback(remote)) {
    /* Prefer proxy-controlled headers. Avoid leftmost X-Forwarded-For (client-spoofable). */
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string') {
      const parsed = cleanIp(real);
      if (parsed) return parsed;
    }
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) {
      const parts = xf.split(',').map((part) => part.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      const parsed = last ? cleanIp(last) : null;
      if (parsed) return parsed;
    }
  }
  return remote;
}

export function usageFor(ip: string): { used: number; left: number; max: number; resetAt: number; dailyLeft: number } {
  const hit = row(ip);
  const used = Math.max(0, Math.min(TRY_MAX, hit.used));
  return {
    used,
    left: Math.max(0, TRY_MAX - used),
    max: TRY_MAX,
    resetAt: hit.resetAt,
    dailyLeft: Math.max(0, DAY_MAX - mem.global),
  };
}

export function beginFlight(ip: string): boolean {
  if (inflight.has(ip)) return false;
  inflight.add(ip);
  return true;
}

export function endFlight(ip: string): void {
  inflight.delete(ip);
}

export function peekTry(ip: string): { ok: boolean; reason: string; used: number; left: number; max: number } {
  const hit = row(ip);
  if (mem.global >= DAY_MAX) {
    return { ok: false, reason: 'daily', used: hit.used, left: Math.max(0, TRY_MAX - hit.used), max: TRY_MAX };
  }
  if (hit.used >= TRY_MAX) {
    return { ok: false, reason: 'spent', used: hit.used, left: 0, max: TRY_MAX };
  }
  return {
    ok: true,
    reason: '',
    used: hit.used,
    left: Math.max(0, TRY_MAX - hit.used),
    max: TRY_MAX,
  };
}

export function takeTry(ip: string): { ok: boolean; reason: string; used: number; left: number; max: number } {
  const hit = row(ip);
  const now = Date.now();
  if (mem.global >= DAY_MAX) {
    return { ok: false, reason: 'daily', used: hit.used, left: Math.max(0, TRY_MAX - hit.used), max: TRY_MAX };
  }
  if (hit.used >= TRY_MAX) {
    return { ok: false, reason: 'spent', used: hit.used, left: 0, max: TRY_MAX };
  }
  if (hit.lastAt && now - hit.lastAt < GAP_MS) {
    return {
      ok: false,
      reason: 'wait',
      used: hit.used,
      left: Math.max(0, TRY_MAX - hit.used),
      max: TRY_MAX,
    };
  }
  hit.used += 1;
  hit.lastAt = now;
  mem.global += 1;
  saveStore();
  return {
    ok: true,
    reason: '',
    used: hit.used,
    left: Math.max(0, TRY_MAX - hit.used),
    max: TRY_MAX,
  };
}

export function denyMessage(reason: string): string {
  if (reason === 'spent') {
    return `You have used all ${TRY_MAX} chart generates for now. Come back later.`;
  }
  if (reason === 'daily') {
    return 'The chart demo hit its daily generate budget. Come back tomorrow.';
  }
  if (reason === 'wait') {
    return 'Give it a moment, then try again.';
  }
  if (reason === 'busy') {
    return 'One chart at a time.';
  }
  return 'Chart generation is temporarily unavailable.';
}
