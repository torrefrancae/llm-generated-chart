import * as fs from 'fs';
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

export function applyChartEnv(): void {
  const candidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../../sh/.env.cursor'),
    path.resolve(process.cwd(), '../../sh/.env.cursor'),
    path.resolve(process.cwd(), '../sh/.env.cursor'),
  ];
  for (const file of candidates) applyEnvFile(file);
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
