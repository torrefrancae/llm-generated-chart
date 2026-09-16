export type SolarParams = {
  planetCount: number;
  orbitSpeed: number;
  starRadius: number;
  eccentricity: number;
  showMoons: boolean;
  moonMin: number;
  moonMax: number;
  showTrails: boolean;
  showLabels: boolean;
};

export type SolarPreset = {
  id: string;
  label: string;
  blurb: string;
  params: SolarParams;
};

export const DEFAULT_SOLAR: SolarParams = {
  planetCount: 8,
  orbitSpeed: 1,
  starRadius: 28,
  eccentricity: 0.08,
  showMoons: true,
  moonMin: 1,
  moonMax: 3,
  showTrails: true,
  showLabels: true,
};

const MOON_CAP = 8;

function withMoonRange(
  params: Omit<SolarParams, 'moonMin' | 'moonMax'> & Partial<Pick<SolarParams, 'moonMin' | 'moonMax'>>
): SolarParams {
  const moonMin = Math.max(1, Math.min(MOON_CAP, params.moonMin ?? 1));
  const moonMax = Math.max(moonMin, Math.min(MOON_CAP, params.moonMax ?? 3));
  return { ...params, moonMin, moonMax };
}

export const SOLAR_PRESETS: SolarPreset[] = [
  {
    id: 'classic',
    label: 'Classic Sol',
    blurb: 'Eight worlds, calm tempo, soft ellipses',
    params: { ...DEFAULT_SOLAR },
  },
  {
    id: 'nursery',
    label: 'Crowded nursery',
    blurb: 'Fourteen small bodies racing close in',
    params: withMoonRange({
      planetCount: 14,
      orbitSpeed: 1.8,
      starRadius: 22,
      eccentricity: 0.04,
      showMoons: false,
      showTrails: true,
      showLabels: false,
    }),
  },
  {
    id: 'giants',
    label: 'Twin giants',
    blurb: 'Four planets, two heavy gas worlds',
    params: withMoonRange({
      planetCount: 4,
      orbitSpeed: 0.7,
      starRadius: 34,
      eccentricity: 0.12,
      showMoons: true,
      moonMin: 2,
      moonMax: 4,
      showTrails: false,
      showLabels: true,
    }),
  },
  {
    id: 'waltz',
    label: 'Slow waltz',
    blurb: 'Five planets drifting for a patient read',
    params: withMoonRange({
      planetCount: 5,
      orbitSpeed: 0.35,
      starRadius: 30,
      eccentricity: 0.18,
      showMoons: true,
      showTrails: true,
      showLabels: true,
    }),
  },
  {
    id: 'swarm',
    label: 'Eccentric swarm',
    blurb: 'Nine stretched orbits for drama',
    params: withMoonRange({
      planetCount: 9,
      orbitSpeed: 1.25,
      starRadius: 24,
      eccentricity: 0.42,
      showMoons: false,
      showTrails: true,
      showLabels: true,
    }),
  },
  {
    id: 'ring',
    label: 'Moon garden',
    blurb: 'Six planets with busy moon trains',
    params: withMoonRange({
      planetCount: 6,
      orbitSpeed: 1,
      starRadius: 26,
      eccentricity: 0.1,
      showMoons: true,
      moonMin: 2,
      moonMax: 5,
      showTrails: false,
      showLabels: true,
    }),
  },
];

export type PlanetSpec = {
  id: string;
  name: string;
  orbit: number;
  size: number;
  color: string;
  period: number;
  moons: number;
  phase: number;
};

const NAMES = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Ceres',
  'Vesta',
  'Pallas',
  'Hygiea',
  'Eris',
  'Makemake',
  'Haumea',
  'Sedna',
];

const COLORS = [
  '#c4b5a0',
  '#e8b86d',
  '#5ec8e8',
  '#d97757',
  '#d4a574',
  '#e6d5a8',
  '#7ec8c8',
  '#4f7cac',
  '#b8a99a',
  '#9a8f7f',
  '#c9b8a0',
  '#8f9a88',
  '#a8b8c8',
  '#c8a0b0',
  '#b0c4a8',
  '#9aa8b8',
];

function moonsForPlanet(index: number, params: SolarParams): number {
  if (!params.showMoons) return 0;
  const min = Math.max(1, Math.min(MOON_CAP, Math.round(params.moonMin || 1)));
  const max = Math.max(min, Math.min(MOON_CAP, Math.round(params.moonMax || min)));
  const span = max - min + 1;
  return min + ((index * 3 + 1) % span);
}

export function buildPlanets(params: SolarParams): PlanetSpec[] {
  const count = Math.max(1, Math.min(16, Math.round(params.planetCount)));
  return Array.from({ length: count }, (_, i) => {
    const giantBoost = params.planetCount <= 4 && i >= count - 2 ? 1.8 : 1;
    return {
      id: `p-${i}`,
      name: NAMES[i] || `Body ${i + 1}`,
      orbit: 70 + i * (params.planetCount > 10 ? 18 : 28),
      size: (4 + (i % 5) * 1.6) * giantBoost,
      color: COLORS[i % COLORS.length],
      period: 8 + i * 3.2,
      moons: moonsForPlanet(i, params),
      phase: (i * 0.7) % (Math.PI * 2),
    };
  });
}
