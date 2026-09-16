# AI Chart Generator (`llm-generated-chart`)

Separate sample app for [torrefranca.site](https://torrefranca.site). Talk about ~30 chart types; a Cursor-backed API invents dummy data; the Next.js UI renders it with ECharts.

## URLs

| Mode | URL |
|---|---|
| Local | http://127.0.0.1:3092/sample/ai-generate-app/ |
| Production static mount | https://torrefranca.site/sample/ai-generate-app/ |
| Local API | http://127.0.0.1:3093/health |
| Production API (recommended) | https://torrefranca.site/api/chart/ |

`basePath` and `assetPrefix` are fixed to `/sample/ai-generate-app` so the static export drops cleanly into `public_html/sample/ai-generate-app/` on Z.com shared hosting.

## Setup

1. Copy Cursor keys into `../../sh/.env.cursor` (or `chart-runtime/.env`) as `API_KEY1=...` / `CURSOR_API_KEY=...`.
2. Install and run headless:

```bash
cd apps/llm-generated-chart
chmod +x serve.sh
./serve.sh --headless --port=3092
```

3. Stop:

```bash
./serve.sh --restore
```

## Static export for shared hosting

```bash
CHART_EXPORT=1 npm run build
```

Upload the `out/` folder to `~/public_html/sample/ai-generate-app/`.

Exclude `/sample/` from the SPA fallback rewrite in the site root `.htaccess` (same pattern as `/anthony/`).

Mount `chart-runtime` behind `/api/chart` on Passenger (or another Node endpoint). The browser uses `/api/chart` off localhost and `http://127.0.0.1:3093` while developing.

## Stack

- Next.js App Router + static export
- ECharts (`echarts-for-react`)
- `chart-runtime` Node sidecar using `@cursor/sdk`
