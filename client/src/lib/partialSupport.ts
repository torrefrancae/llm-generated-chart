export type PartialAlertState = {
  title: string;
  body: string;
  unsupported: string[];
};

const UNSUPPORTED_EXTRAS: Array<{ re: RegExp; label: string }> = [
  {
    re: /\bdual[-\s]?axis\b|\bsecondary axis\b|\bcombo chart\b|\boverlaid line\b|\bmixed (bar|column).*(line|curve)\b/i,
    label: 'dual-axis / bar+line combo overlays',
  },
  { re: /\b3d\b|\bthree[-\s]?dimensional\b|\bhologram\b/i, label: '3D rendering' },
  { re: /\bchoropleth\b|\bgeo(?:graphic)? map\b|\bmap chart\b/i, label: 'geographic map layers' },
  { re: /\bgantt\b|\btimeline chart\b/i, label: 'Gantt / project timeline lanes' },
  { re: /\brings?\b|\basteroid(?:s| belt)?\b|\bblack hole\b|\bbinary star\b|\bcomet\b/i, label: 'rings, asteroids, or other space scenery beyond planets and moons' },
];

export function collectPromptExtraWarnings(text: string): string[] {
  const found: string[] = [];
  for (const item of UNSUPPORTED_EXTRAS) {
    if (item.re.test(text)) found.push(item.label);
  }
  return found;
}

export function collectSolarCapWarnings(text: string): string[] {
  const warnings: string[] = [];
  const planets = text.match(/(\d+)\s*(planets?|worlds?|bodies)/i);
  if (planets && Number(planets[1]) > 16) {
    warnings.push(`planet count capped at 16 (you asked for ${planets[1]})`);
  }
  const moonsRange = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*moons?/i);
  if (moonsRange) {
    const hi = Math.max(Number(moonsRange[1]), Number(moonsRange[2]));
    if (hi > 8) {
      warnings.push(`moons per planet capped at 8 (you asked for up to ${hi})`);
    }
  } else {
    const moonsFixed = text.match(/(\d+)\s*moons?(?:\s+each)?/i);
    if (moonsFixed && Number(moonsFixed[1]) > 8 && !/\bno moons?/i.test(text)) {
      warnings.push(`moons per planet capped at 8 (you asked for ${moonsFixed[1]})`);
    }
  }
  const points = text.match(/(\d+)\s*(?:data\s+)?points?/i);
  if (points && Number(points[1]) > 60) {
    warnings.push(`data points capped at 60 (you asked for ${points[1]})`);
  }
  return warnings;
}

export function buildPartialAlert(unsupported: string[], drawnLabel: string): PartialAlertState | null {
  const unique = [...new Set(unsupported.map((item) => item.trim()).filter(Boolean))];
  if (!unique.length) return null;
  return {
    title: 'Partial chart',
    body: `We drew ${drawnLabel}, but part of your request is not supported here.`,
    unsupported: unique,
  };
}

export function normalizeWarningList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 6);
}
