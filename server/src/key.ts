import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function applyEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const name = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(name in process.env)) process.env[name] = val;
  }
}

function homeSecretCandidates(): string[] {
  const home = process.env.HOME || os.homedir();
  if (!home) return [];
  return [
    path.join(home, '.config', 'etorrefranca4-chart', 'env'),
    path.join(home, 'etorrefranca4-secrets', 'chart.env'),
  ];
}

/**
 * Load secrets from outside the app tree only.
 * Prefer CHART_ENV_FILE, then ~/.config/etorrefranca4-chart/env, then ~/etorrefranca4-secrets/chart.env.
 * Never read or mention repo-relative secret paths from source.
 */
export function applyChartEnv(): void {
  const ordered: string[] = [];
  const explicit = (process.env.CHART_ENV_FILE || '').trim();
  if (explicit) ordered.push(path.resolve(explicit));
  ordered.push(...homeSecretCandidates());
  for (const file of ordered) applyEnvFile(file);
}

export function chartKeys(): string[] {
  const names = Object.keys(process.env)
    .filter((name) => /^API_KEY\d+$/.test(name))
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  const found: string[] = [];
  const seen = new Set<string>();
  for (const name of [...names, 'CURSOR_API_KEY']) {
    const val = (process.env[name] || '').trim();
    if (!val || seen.has(val)) continue;
    seen.add(val);
    found.push(val);
  }
  return found;
}
