import ChartCanvas from '@/components/ChartCanvas';
import ChartNoticePanel from '@/components/ChartNotice';
import DynamicParams from '@/components/DynamicParams';
import PartialAlert from '@/components/PartialAlert';
import PromptDock from '@/components/PromptDock';
import SolarSystemChart from '@/components/SolarSystemChart';
import { fetchUsage, generateChart, QuotaError, type ChartPayload } from '@/lib/api';
import { applyStudioPrompt, STUDIO_PROMPT_SAMPLES } from '@/lib/applyStudioPrompt';
import { noticeForUnknownOrFailed, noticeFromLlmReject, type ChartNotice } from '@/lib/chartNotice';
import { isChartTypeId } from '@/lib/chartTypes';
import {
  buildPartialAlert,
  collectPromptExtraWarnings,
  collectSolarCapWarnings,
  type PartialAlertState,
} from '@/lib/partialSupport';
import { readLocalQuota, TRY_MAX, type QuotaState } from '@/lib/quota';
import {
  buildPayloadFromParams,
  DEFAULT_ECHART,
  DEFAULT_SOLAR,
  detectStudioKind,
  echartParamsFromPayload,
  payloadHasData,
  type EchartParams,
  type SolarParams,
  type StudioKind,
} from '@/lib/studioModel';
import styles from '@/components/Studio.module.css';
import React from 'react';

export default function Studio() {
  const [kind, setKind] = React.useState<StudioKind>('solar');
  const [solar, setSolar] = React.useState<SolarParams>(DEFAULT_SOLAR);
  const [echart, setEchart] = React.useState<EchartParams>(DEFAULT_ECHART);
  const [topic, setTopic] = React.useState('sample market');
  const [prompt, setPrompt] = React.useState('');
  const [status, setStatus] = React.useState(
    `Ask for a chart. Up to ${TRY_MAX} LLM generates per visitor, then the lamp rests.`
  );
  const [waiting, setWaiting] = React.useState(false);
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const [notice, setNotice] = React.useState<ChartNotice | null>(null);
  const [partialAlert, setPartialAlert] = React.useState<PartialAlertState | null>(null);
  const [quota, setQuota] = React.useState<QuotaState>(() => readLocalQuota());
  const requestId = React.useRef(0);

  React.useEffect(() => {
    void fetchUsage().then(setQuota);
  }, []);

  const spent = quota.left <= 0;

  const paintFromParams = React.useCallback(
    (nextKind: StudioKind, nextEchart: EchartParams, nextTopic: string) => {
      if (nextKind === 'solar' || !isChartTypeId(nextKind)) {
        setPayload(null);
        return;
      }
      setPayload(buildPayloadFromParams(nextKind, nextEchart, nextTopic));
    },
    []
  );

  const showNotice = React.useCallback((next: ChartNotice) => {
    setNotice(next);
    setPartialAlert(null);
    setPayload(null);
    setWaiting(false);
    setStatus(next.title);
  }, []);

  const applyPartial = React.useCallback((unsupported: string[], drawnLabel: string) => {
    const alert = buildPartialAlert(unsupported, drawnLabel);
    setPartialAlert(alert);
    if (alert) {
      setStatus(`Partial chart: ${drawnLabel} ready, with unsupported extras noted.`);
    }
  }, []);

  const applyPrompt = React.useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const id = ++requestId.current;
      setPrompt('');
      setNotice(null);
      setPartialAlert(null);
      setPayload(null);

      const local = applyStudioPrompt(text, { kind, solar, echart });
      setSolar(local.solar);
      setEchart(local.echart);
      setTopic(local.topic);

      /* Planet / moon / solar prompts stay on the D3 stage and do not spend an LLM try. */
      if (detectStudioKind(text) === 'solar' || local.kind === 'solar') {
        setKind('solar');
        setWaiting(false);
        setStatus(local.summary || 'Solar system ready.');
        applyPartial(
          [...collectPromptExtraWarnings(text), ...collectSolarCapWarnings(text)],
          'a solar system'
        );
        return;
      }

      if (quota.left <= 0) {
        showNotice(
          noticeFromLlmReject(
            `You have used all ${TRY_MAX} LLM chart generates for now. Solar presets still work. Come back later for more charts.`,
            STUDIO_PROMPT_SAMPLES.filter((sample) => /solar|planet/i.test(sample)).concat(
              STUDIO_PROMPT_SAMPLES.slice(0, 3)
            )
          )
        );
        return;
      }

      setWaiting(true);
      setStatus('Checking against supported chart types...');

      try {
        const { outcome, quota: nextQuota } = await generateChart(text, []);
        if (id !== requestId.current) return;
        setQuota(nextQuota);

        if (!outcome.supported) {
          showNotice(noticeFromLlmReject(outcome.reason, outcome.suggestions));
          return;
        }

        if (outcome.kind === 'solar') {
          setKind('solar');
          setPayload(null);
          setStatus(outcome.reply || local.summary || 'Solar system ready.');
          applyPartial(
            [
              ...(outcome.warnings || []),
              ...collectPromptExtraWarnings(text),
              ...collectSolarCapWarnings(text),
            ],
            'a solar system'
          );
          return;
        }

        if (!payloadHasData(outcome.payload)) {
          showNotice(noticeForUnknownOrFailed(text, 'failed'));
          return;
        }

        setKind(outcome.payload.chartType);
        setEchart(echartParamsFromPayload(outcome.payload, local.echart));
        setPayload(outcome.payload);
        setStatus(
          `${outcome.payload.reply || 'Chart ready.'} (${nextQuota.left} of ${nextQuota.max} LLM generates left)`
        );
        applyPartial(
          [
            ...(outcome.warnings || []),
            ...collectPromptExtraWarnings(text),
            ...collectSolarCapWarnings(text),
          ],
          `a ${outcome.payload.chartType.replace(/-/g, ' ')} chart`
        );
      } catch (err) {
        if (id !== requestId.current) return;
        if (err instanceof QuotaError) {
          setQuota({ used: err.used, left: err.left, max: err.max });
          showNotice(
            noticeFromLlmReject(err.message, [
              'Solar system with 12 fast planets and trails',
              'Slow waltz solar system with moons',
              'Candlestick chart of 12 trading sessions',
            ])
          );
          return;
        }
        showNotice(noticeForUnknownOrFailed(text, 'failed'));
      } finally {
        if (id === requestId.current) setWaiting(false);
      }
    },
    [kind, solar, echart, quota.left, showNotice, applyPartial]
  );

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.brand}>AI Chart Generator</p>
        <p className={styles.lede}>
          Up to {TRY_MAX} LLM chart generates per visitor. Solar scenes stay free.
        </p>
      </header>

      <section className={styles.workspace} aria-label="Chart studio">
        <div className={styles.stageColumn}>
          {partialAlert ? (
            <PartialAlert alert={partialAlert} onDismiss={() => setPartialAlert(null)} />
          ) : null}
          <div className={styles.stage}>
            {notice ? (
              <ChartNoticePanel notice={notice} onSuggest={(sample) => void applyPrompt(sample)} />
            ) : waiting ? (
              <ChartCanvas payload={null} busy />
            ) : kind === 'solar' ? (
              <SolarSystemChart params={solar} />
            ) : (
              <ChartCanvas payload={payloadHasData(payload) ? payload : null} busy={false} />
            )}
          </div>
        </div>

        <DynamicParams
          kind={kind}
          solar={solar}
          echart={echart}
          onSolar={(next) => {
            setSolar(next);
            setStatus('Solar parameters updated.');
          }}
          onEchart={(next) => {
            setEchart(next);
            if (kind !== 'solar' && isChartTypeId(kind) && !waiting && !notice) {
              paintFromParams(kind, next, topic);
            }
            setStatus('Parameters updated.');
          }}
          onPresetSolar={(next, label) => {
            setKind('solar');
            setSolar(next);
            setPayload(null);
            setNotice(null);
            setPartialAlert(null);
            setWaiting(false);
            setStatus(`${label} loaded.`);
          }}
        />

        <PromptDock
          value={prompt}
          busy={waiting}
          spent={spent}
          quota={quota}
          placeholder="Ask for a chart, e.g. stacked bar of Q3 sales, or solar system with 10 fast planets"
          submitLabel="Generate"
          samples={STUDIO_PROMPT_SAMPLES}
          status={status}
          onChange={setPrompt}
          onSubmit={(value) => void applyPrompt(value)}
          onSample={(sample) => void applyPrompt(sample)}
        />
      </section>
    </div>
  );
}
