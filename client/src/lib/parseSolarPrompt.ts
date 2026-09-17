import { DEFAULT_SOLAR, SOLAR_PRESETS, type SolarParams } from '@/lib/solarSystem';

export type SolarPromptResult = {
  params: SolarParams;
  summary: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const SOLAR_PROMPT_SAMPLES = [
  'Crowded nursery with trails',
  'Only 3 giant planets, slow orbits, big sun',
  '8 classic worlds with moons and labels',
  'Eccentric swarm, 11 planets, no moons',
  'Moon garden, medium speed',
  'Quiet system: 5 planets, slow waltz, trails on',
];

export function parseSolarPrompt(raw: string, current: SolarParams = DEFAULT_SOLAR): SolarPromptResult {
  const text = raw.trim().toLowerCase();
  if (!text) {
    return { params: current, summary: 'Empty prompt. Params unchanged.' };
  }

  const wantsClassic =
    /\b(correct|realistic|accurate|proper|real|true[-\s]?to[-\s]?life|classic|default|reset)\b/.test(
      text
    ) && /\b(solar|system|planets?|worlds?|sun)\b/.test(text);

  const preset = SOLAR_PRESETS.find(
    (item) => text.includes(item.id) || text.includes(item.label.toLowerCase())
  );
  let params: SolarParams = {
    ...(wantsClassic ? { ...DEFAULT_SOLAR } : preset ? preset.params : current),
  };
  const notes: string[] = [];
  if (wantsClassic) notes.push('classic real-scale layout');
  else if (preset) notes.push(`${preset.label} base`);

  const countMatch = text.match(/(\d+)\s*(planets?|worlds?|bodies)/);
  if (countMatch) {
    params.planetCount = clamp(Number(countMatch[1]), 1, 16);
    notes.push(`${params.planetCount} planets`);
  } else if (/\bcrowded|nursery|swarm|many\b/.test(text)) {
    params.planetCount = clamp(Math.max(params.planetCount, 12), 1, 16);
    notes.push('crowded count');
  } else if (/\bfew|sparse|quiet|twin|giant\b/.test(text)) {
    params.planetCount = clamp(Math.min(params.planetCount, 4), 1, 16);
    notes.push('fewer planets');
  }

  if (/\b(fast|racing|quick|rapid)\b/.test(text)) {
    params.orbitSpeed = 1.8;
    notes.push('fast orbits');
  } else if (/\b(slow|waltz|drift|patient|calm)\b/.test(text)) {
    params.orbitSpeed = 0.35;
    notes.push('slow orbits');
  } else if (/\bmedium\b/.test(text)) {
    params.orbitSpeed = 1;
    notes.push('medium speed');
  }

  if (/\b(big|huge|large)\s+sun\b|\bstar\s+(big|huge|large)\b/.test(text)) {
    params.starRadius = 40;
    notes.push('large star');
  } else if (/\b(small|tiny)\s+sun\b|\bstar\s+(small|tiny)\b/.test(text)) {
    params.starRadius = 18;
    notes.push('small star');
  }

  if (/\beccentric|stretched|elliptical|oval\b/.test(text)) {
    params.eccentricity = 0.42;
    notes.push('high eccentricity');
  } else if (/\bcircular|round orbits|soft ellipses\b/.test(text)) {
    params.eccentricity = 0.06;
    notes.push('near-circular');
  }

  if (/\bno moons?|without moons?|hide moons?\b/.test(text)) {
    params.showMoons = false;
    notes.push('moons off');
  } else if (/\bmoons?|moon garden\b/.test(text)) {
    params.showMoons = true;
    notes.push('moons on');
  }

  const moonsEach = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*moons?(?:\s+each)?/);
  if (moonsEach) {
    const a = clamp(Number(moonsEach[1]), 1, 8);
    const b = clamp(Number(moonsEach[2]), 1, 8);
    params.showMoons = true;
    params.moonMin = Math.min(a, b);
    params.moonMax = Math.max(a, b);
    notes.push(`moons ${params.moonMin}-${params.moonMax} each`);
  } else {
    const moonsFixed = text.match(/(\d+)\s*moons?(?:\s+each)?/);
    if (moonsFixed && !/\bno moons?/.test(text)) {
      const n = clamp(Number(moonsFixed[1]), 1, 8);
      params.showMoons = true;
      params.moonMin = n;
      params.moonMax = n;
      notes.push(`${n} moons each`);
    }
  }

  if (/\bno trails?|without trails?|hide trails?\b/.test(text)) {
    params.showTrails = false;
    notes.push('trails off');
  } else if (/\btrails?\b/.test(text)) {
    params.showTrails = true;
    notes.push('trails on');
  }

  if (/\bno labels?|hide labels?|without labels?\b/.test(text)) {
    params.showLabels = false;
    notes.push('labels off');
  } else if (/\blabels?\b/.test(text)) {
    params.showLabels = true;
    notes.push('labels on');
  }

  if (/\bclassic\b/.test(text) && !preset && !wantsClassic) {
    params = { ...DEFAULT_SOLAR };
    notes.push('classic sol');
  }

  /* Vague "make a solar system" with no knobs still lands on classic so Generate always does something. */
  if (!notes.length && /\b(solar|system|planets?)\b/.test(text)) {
    params = { ...DEFAULT_SOLAR };
    notes.push('classic solar defaults');
  }

  return {
    params,
    summary: notes.length ? `Applied: ${notes.join(', ')}.` : 'Parsed prompt with light tweaks.',
  };
}
