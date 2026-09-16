import { SOLAR_PRESETS, type SolarParams } from '@/lib/solarSystem';
import type { EchartParams, StudioKind } from '@/lib/studioModel';
import { CHART_TYPES } from '@/lib/chartTypes';
import styles from '@/components/DynamicParams.module.css';
import React from 'react';

interface Props {
  kind: StudioKind;
  solar: SolarParams;
  echart: EchartParams;
  onSolar: (next: SolarParams) => void;
  onEchart: (next: EchartParams) => void;
  onPresetSolar: (next: SolarParams, label: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DynamicParams({ kind, solar, echart, onSolar, onEchart, onPresetSolar }: Props) {
  const label =
    kind === 'solar' ? 'Solar system' : CHART_TYPES.find((item) => item.id === kind)?.label || kind;

  if (kind === 'solar') {
    return (
      <aside className={styles.panel} aria-label="Solar parameters">
        <p className={styles.kicker}>Parameters</p>
        <h2 className={styles.title}>{label}</h2>
        <p className={styles.copy}>These dials follow the active chart from your prompt.</p>
        <div className={styles.presets}>
          {SOLAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              onClick={() => onPresetSolar(preset.params, preset.label)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className={styles.field}>
          <span>Planets ({solar.planetCount})</span>
          <input
            type="range"
            min={1}
            max={16}
            value={solar.planetCount}
            onChange={(e) => onSolar({ ...solar, planetCount: clamp(Number(e.target.value), 1, 16) })}
          />
        </label>
        <label className={styles.field}>
          <span>Orbit speed ({solar.orbitSpeed.toFixed(2)}x)</span>
          <input
            type="range"
            min={25}
            max={300}
            value={Math.round(solar.orbitSpeed * 100)}
            onChange={(e) => onSolar({ ...solar, orbitSpeed: clamp(Number(e.target.value) / 100, 0.25, 3) })}
          />
        </label>
        <label className={styles.field}>
          <span>Star size ({solar.starRadius})</span>
          <input
            type="range"
            min={14}
            max={48}
            value={solar.starRadius}
            onChange={(e) => onSolar({ ...solar, starRadius: clamp(Number(e.target.value), 14, 48) })}
          />
        </label>
        <label className={styles.field}>
          <span>Eccentricity ({solar.eccentricity.toFixed(2)})</span>
          <input
            type="range"
            min={0}
            max={48}
            value={Math.round(solar.eccentricity * 100)}
            onChange={(e) => onSolar({ ...solar, eccentricity: clamp(Number(e.target.value) / 100, 0, 0.48) })}
          />
        </label>
        <div className={styles.toggles}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={solar.showMoons}
              onChange={(e) => onSolar({ ...solar, showMoons: e.target.checked })}
            />
            Moons
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={solar.showTrails}
              onChange={(e) => onSolar({ ...solar, showTrails: e.target.checked })}
            />
            Trails
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={solar.showLabels}
              onChange={(e) => onSolar({ ...solar, showLabels: e.target.checked })}
            />
            Labels
          </label>
        </div>
        {solar.showMoons ? (
          <>
            <label className={styles.field}>
              <span>Moons min ({solar.moonMin})</span>
              <input
                type="range"
                min={1}
                max={8}
                value={solar.moonMin}
                onChange={(e) => {
                  const moonMin = clamp(Number(e.target.value), 1, 8);
                  onSolar({
                    ...solar,
                    moonMin,
                    moonMax: Math.max(moonMin, solar.moonMax),
                  });
                }}
              />
            </label>
            <label className={styles.field}>
              <span>Moons max ({solar.moonMax})</span>
              <input
                type="range"
                min={1}
                max={8}
                value={solar.moonMax}
                onChange={(e) => {
                  const moonMax = clamp(Number(e.target.value), 1, 8);
                  onSolar({
                    ...solar,
                    moonMax,
                    moonMin: Math.min(solar.moonMin, moonMax),
                  });
                }}
              />
            </label>
          </>
        ) : null}
      </aside>
    );
  }

  const isBarFamily = ['bar', 'grouped-bar', 'stacked-bar', 'horizontal-bar', 'pictorial-bar'].includes(kind);
  const isLineFamily = ['line', 'multi-line', 'area', 'stacked-area'].includes(kind);
  const isPieFamily = ['pie', 'donut', 'rose'].includes(kind);
  const isGauge = kind === 'gauge';

  return (
    <aside className={styles.panel} aria-label={`${label} parameters`}>
      <p className={styles.kicker}>Parameters</p>
      <h2 className={styles.title}>{label}</h2>
      <p className={styles.copy}>Prompt picked this chart. Tweaks update the stage immediately.</p>

      <label className={styles.field}>
        <span>Title</span>
        <input
          className={styles.text}
          value={echart.title}
          onChange={(e) => onEchart({ ...echart, title: e.target.value.slice(0, 60) })}
        />
      </label>

      {!isGauge ? (
        <label className={styles.field}>
          <span>
            {isPieFamily ? 'Slices' : 'Categories'} ({echart.categoryCount})
          </span>
          <input
            type="range"
            min={2}
            max={60}
            value={echart.categoryCount}
            onChange={(e) => onEchart({ ...echart, categoryCount: clamp(Number(e.target.value), 2, 60) })}
          />
        </label>
      ) : null}

      {!isPieFamily && !isGauge ? (
        <label className={styles.field}>
          <span>Series ({echart.seriesCount})</span>
          <input
            type="range"
            min={1}
            max={5}
            value={echart.seriesCount}
            onChange={(e) => onEchart({ ...echart, seriesCount: clamp(Number(e.target.value), 1, 5) })}
          />
        </label>
      ) : null}

      {isGauge ? (
        <>
          <label className={styles.field}>
            <span>Value ({echart.gaugeValue})</span>
            <input
              type="range"
              min={0}
              max={echart.gaugeMax}
              value={echart.gaugeValue}
              onChange={(e) => onEchart({ ...echart, gaugeValue: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span>Max ({echart.gaugeMax})</span>
            <input
              type="range"
              min={10}
              max={200}
              value={echart.gaugeMax}
              onChange={(e) =>
                onEchart({
                  ...echart,
                  gaugeMax: Number(e.target.value),
                  gaugeValue: Math.min(echart.gaugeValue, Number(e.target.value)),
                })
              }
            />
          </label>
        </>
      ) : null}

      <div className={styles.toggles}>
        {isBarFamily ? (
          <>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={echart.stacked}
                onChange={(e) => onEchart({ ...echart, stacked: e.target.checked })}
              />
              Stacked
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={echart.horizontal}
                onChange={(e) => onEchart({ ...echart, horizontal: e.target.checked })}
              />
              Horizontal
            </label>
          </>
        ) : null}
        {isLineFamily ? (
          <>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={echart.smooth}
                onChange={(e) => onEchart({ ...echart, smooth: e.target.checked })}
              />
              Smooth
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={echart.areaFill}
                onChange={(e) => onEchart({ ...echart, areaFill: e.target.checked })}
              />
              Area fill
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={echart.stacked}
                onChange={(e) => onEchart({ ...echart, stacked: e.target.checked })}
              />
              Stacked
            </label>
          </>
        ) : null}
        {isPieFamily ? (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={echart.donut}
              onChange={(e) => onEchart({ ...echart, donut: e.target.checked })}
            />
            Donut
          </label>
        ) : null}
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={echart.showLegend}
            onChange={(e) => onEchart({ ...echart, showLegend: e.target.checked })}
          />
          Legend
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={echart.showLabels}
            onChange={(e) => onEchart({ ...echart, showLabels: e.target.checked })}
          />
          Labels
        </label>
      </div>
    </aside>
  );
}
