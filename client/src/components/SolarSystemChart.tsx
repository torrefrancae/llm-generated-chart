import * as d3 from 'd3';
import { buildPlanets, type SolarParams } from '@/lib/solarSystem';
import styles from '@/components/SolarSystemChart.module.css';
import React from 'react';

interface Props {
  params: SolarParams;
}

export default function SolarSystemChart({ params }: Props) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const paramsRef = React.useRef(params);
  paramsRef.current = params;

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const width = Math.max(320, host.clientWidth || 720);
    const height = Math.max(260, host.clientHeight || Math.round(width * 0.55));
    const cx = width / 2;
    const cy = height / 2;

    const svg = d3
      .select(host)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', 'Interactive solar system chart');

    const defs = svg.append('defs');
    const glow = defs
      .append('radialGradient')
      .attr('id', 'sun-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    glow.append('stop').attr('offset', '0%').attr('stop-color', '#fff6d5');
    glow.append('stop').attr('offset', '45%').attr('stop-color', '#f5b942');
    glow.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(245,185,66,0)');

    const scene = svg.append('g');
    const stars = d3.range(90).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.7 + 0.2,
    }));
    scene
      .selectAll('circle.star')
      .data(stars)
      .join('circle')
      .attr('class', 'star')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => d.r)
      .attr('fill', '#e8f1ff')
      .attr('opacity', (d) => d.o);

    const orbits = scene.append('g').attr('class', 'orbits');
    const bodies = scene.append('g').attr('class', 'bodies');
    const sun = scene.append('g').attr('transform', `translate(${cx},${cy})`);
    sun.append('circle').attr('r', 54).attr('fill', 'url(#sun-glow)');
    const sunCore = sun.append('circle').attr('fill', '#ffe08a').attr('stroke', '#f5b942').attr('stroke-width', 2);

    const tip = d3
      .select(host)
      .append('div')
      .attr('class', styles.tip)
      .style('opacity', 0);

    let frame = 0;
    const timer = d3.timer((elapsed) => {
      const p = paramsRef.current;
      const planets = buildPlanets(p);
      const ecc = Math.max(0, Math.min(0.48, p.eccentricity));
      sunCore.attr('r', p.starRadius);

      orbits
        .selectAll('ellipse')
        .data(planets, (d) => (d as { id: string }).id)
        .join('ellipse')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('rx', (d) => d.orbit)
        .attr('ry', (d) => d.orbit * (1 - ecc * 0.55))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(232,241,255,0.16)')
        .attr('stroke-dasharray', '3 7');

      const planetSel = bodies
        .selectAll('g.planet')
        .data(planets, (d) => (d as { id: string }).id)
        .join((enter) => {
          const g = enter.append('g').attr('class', 'planet');
          g.append('path').attr('class', 'trail').attr('fill', 'none');
          g.append('circle')
            .attr('class', 'disk')
            .style('cursor', 'pointer')
            .on('mouseenter', function (event, d) {
              tip
                .style('opacity', 1)
                .style('left', `${event.offsetX + 12}px`)
                .style('top', `${event.offsetY - 8}px`)
                .html(
                  `<strong>${d.name}</strong><span>Orbit ${Math.round(d.orbit)} · period ${d.period.toFixed(1)}s</span>`
                );
            })
            .on('mousemove', (event) => {
              tip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 8}px`);
            })
            .on('mouseleave', () => tip.style('opacity', 0));
          g.append('text').attr('class', 'label');
          g.append('g').attr('class', 'moons');
          return g;
        });

      planetSel.each(function (d, i) {
        const g = d3.select(this);
        const t = ((elapsed / 1000) * p.orbitSpeed * (Math.PI * 2)) / d.period + d.phase;
        const rx = d.orbit;
        const ry = d.orbit * (1 - ecc * 0.55);
        const x = cx + Math.cos(t) * rx;
        const y = cy + Math.sin(t) * ry;
        g.attr('transform', `translate(${x},${y})`);
        g.select('circle.disk')
          .attr('r', d.size)
          .attr('fill', d.color)
          .attr('stroke', 'rgba(255,255,255,0.35)')
          .attr('stroke-width', 1);

        g.select('text.label')
          .attr('y', -d.size - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', p.showLabels ? 'rgba(236,254,255,0.78)' : 'transparent')
          .attr('font-size', 11)
          .attr('font-family', 'IBM Plex Sans, sans-serif')
          .text(d.name);

        if (p.showTrails) {
          const trail = d3.range(18).map((step) => {
            const tt = t - step * 0.08;
            return [cx + Math.cos(tt) * rx - x, cy + Math.sin(tt) * ry - y] as [number, number];
          });
          g.select('path.trail')
            .attr('d', d3.line()(trail))
            .attr('stroke', d.color)
            .attr('stroke-opacity', 0.35)
            .attr('stroke-width', 1.5);
        } else {
          g.select('path.trail').attr('d', null);
        }

        const moonData = d3.range(d.moons).map((m) => ({ id: `${d.id}-m${m}`, m }));
        g.select('g.moons')
          .selectAll('circle')
          .data(moonData, (m) => (m as { id: string }).id)
          .join('circle')
          .attr('r', 1.8)
          .attr('fill', '#dbe7ff')
          .attr('cx', (m) => Math.cos(t * (2.4 + m.m) + i) * (d.size + 7 + m.m * 4))
          .attr('cy', (m) => Math.sin(t * (2.4 + m.m) + i) * (d.size + 7 + m.m * 4));
      });

      frame += 1;
      if (frame % 40 === 0) {
        scene
          .selectAll('circle.star')
          .attr('opacity', () => Math.random() * 0.55 + 0.25);
      }
    });

    return () => {
      timer.stop();
      tip.remove();
      svg.remove();
    };
  }, []);

  return <div className={styles.stage} ref={hostRef} />;
}
