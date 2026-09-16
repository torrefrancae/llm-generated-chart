import { SOLAR_PRESETS, type SolarParams } from '@/lib/solarSystem';
import styles from '@/components/SolarControls.module.css';
import React from 'react';

interface Props {
  params: SolarParams;
  onChange: (next: SolarParams) => void;
  onPreset: (next: SolarParams, label: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function SolarControls({ params, onChange, onPreset }: Props) {
  const setNum = (key: keyof SolarParams, value: number, min: number, max: number) => {
    onChange({ ...params, [key]: clamp(value, min, max) });
  };

  return (
    <aside className={styles.panel} aria-label="Solar system controls">
      <p className={styles.kicker}>Solar lab</p>
      <h2 className={styles.title}>Tune the system</h2>
      <p className={styles.copy}>Click a sample below, or drag the dials. Recruiters can demo this in one tap.</p>

      <div className={styles.presets} role="list">
        {SOLAR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.preset}
            role="listitem"
            onClick={() => onPreset(preset.params, preset.label)}
          >
            <span className={styles.presetLabel}>{preset.label}</span>
            <span className={styles.presetBlurb}>{preset.blurb}</span>
          </button>
        ))}
      </div>

      <label className={styles.field}>
        <span>Planets ({params.planetCount})</span>
        <input
          type="range"
          min={1}
          max={16}
          value={params.planetCount}
          onChange={(e) => setNum('planetCount', Number(e.target.value), 1, 16)}
        />
      </label>
      <label className={styles.field}>
        <span>Orbit speed ({params.orbitSpeed.toFixed(2)}x)</span>
        <input
          type="range"
          min={25}
          max={300}
          value={Math.round(params.orbitSpeed * 100)}
          onChange={(e) => setNum('orbitSpeed', Number(e.target.value) / 100, 0.25, 3)}
        />
      </label>
      <label className={styles.field}>
        <span>Star size ({params.starRadius})</span>
        <input
          type="range"
          min={14}
          max={48}
          value={params.starRadius}
          onChange={(e) => setNum('starRadius', Number(e.target.value), 14, 48)}
        />
      </label>
      <label className={styles.field}>
        <span>Eccentricity ({params.eccentricity.toFixed(2)})</span>
        <input
          type="range"
          min={0}
          max={48}
          value={Math.round(params.eccentricity * 100)}
          onChange={(e) => setNum('eccentricity', Number(e.target.value) / 100, 0, 0.48)}
        />
      </label>

      <div className={styles.toggles}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={params.showMoons}
            onChange={(e) => onChange({ ...params, showMoons: e.target.checked })}
          />
          Moons
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={params.showTrails}
            onChange={(e) => onChange({ ...params, showTrails: e.target.checked })}
          />
          Trails
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={params.showLabels}
            onChange={(e) => onChange({ ...params, showLabels: e.target.checked })}
          />
          Labels
        </label>
      </div>
    </aside>
  );
}
