# AI Chart Generator (`llm-generated-chart`)

Node app that serves a **static React** frontend and a **Cursor-backed API**. No Next.js server is required on hosting.

## Why this shape

Z.com shared hosting will not run Next.js backend/API routes. This repo builds React to static files, then a small Express process:

1. serves those files under `/sample/ai-generate-app/`
2. handles `/sample/ai-generate-app/api/*` with `@cursor/sdk`

## URLs

| Mode | URL |
|---|---|
| Local (one Node process) | http://127.0.0.1:3092/sample/ai-generate-app/ |
| Local API health | http://127.0.0.1:3092/sample/ai-generate-app/api/health |
| Production static folder | `public_html/sample/ai-generate-app/` |
| Production API mount | Passenger app at `/sample/ai-generate-app` or `/api/chart` |

## Commands

```bash
npm install
chmod +x serve.sh
./serve.sh --headless --port=3092
./serve.sh --restore
```

Manual:

```bash
npm run build
CHART_PORT=3092 CHART_SERVE_STATIC=1 npm start
```

Dev (Vite UI on 3092, API on 3093):

```bash
npm run dev
```

## Keys

Do **not** put secrets in the repo root or under `public_html`.

Create a private env file outside the checkout, then either export `CHART_ENV_FILE` or use one of the default locations:

- `~/.config/etorrefranca4-chart/env`
- `~/etorrefranca4-secrets/chart.env`

```bash
mkdir -p ~/.config/etorrefranca4-chart
cp .env.example ~/.config/etorrefranca4-chart/env
chmod 600 ~/.config/etorrefranca4-chart/env
# edit that file and set API_KEY1 / CURSOR_API_KEY
```

## Hosting notes

- `npm run build` writes UI to `dist/client` and server to `server/dist`
- On Z.com you can either:
  - run the Node app under Passenger for the whole `/sample/ai-generate-app` path, or
  - copy `dist/client` into `public_html/sample/ai-generate-app/` and mount only the API
- Root `.htaccess` must exclude `/sample/` from the SPA fallback (gate repo already has this)
