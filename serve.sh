#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3092}"
API_PORT="${CHART_API_PORT:-3093}"
MODE=""
cd "$ROOT"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --headless) MODE="headless" ;;
    --restore|stop) MODE="restore" ;;
    --port=*) PORT="${1#*=}" ;;
    --port)
      shift
      PORT="${1:-}"
      ;;
    -h|--help)
      echo "Usage: $0 [--headless] [--restore] [--port=3092]"
      exit 0
      ;;
  esac
  shift
done

PID_FILE="$ROOT/.serve-headless-${PORT}.pid"
API_PID_FILE="$ROOT/.serve-headless-api-${API_PORT}.pid"
LOG_FILE="$ROOT/debug.log"

if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  unset npm_config_prefix || true
  # shellcheck disable=SC1091
  . "${HOME}/.nvm/nvm.sh"
  nvm use >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || true
fi

is_web_up() {
  curl -fsS -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/sample/ai-generate-app/" >/dev/null 2>&1
}

is_api_up() {
  curl -fsS -o /dev/null --max-time 2 "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1
}

stop_pid_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    old="$(cat "$file" 2>/dev/null || true)"
    if [[ -n "${old:-}" ]] && kill -0 "$old" 2>/dev/null; then
      pkill -P "$old" 2>/dev/null || true
      kill "$old" 2>/dev/null || true
      sleep 1
      kill -9 "$old" 2>/dev/null || true
    fi
    rm -f "$file"
  fi
}

stop_old() {
  stop_pid_file "$PID_FILE"
  stop_pid_file "$API_PID_FILE"
}

start_api() {
  if is_api_up; then
    echo "chart api already up http://127.0.0.1:${API_PORT}/health"
    return 0
  fi
  stop_pid_file "$API_PID_FILE"
  (
    cd "$ROOT/chart-runtime"
    if [[ ! -d node_modules/@cursor ]]; then
      npm install >>"$LOG_FILE" 2>&1
    fi
    npm run build >>"$LOG_FILE" 2>&1
    mkdir -p sandbox
    NODE_BIN="$(command -v node)"
    nohup sh -c "CHART_API_PORT=\"$API_PORT\" \"$NODE_BIN\" dist/server.js 2>&1 | tr -d '\\000' | stdbuf -oL strings -n 1 >> \"$LOG_FILE\"" >/dev/null 2>&1 &
    echo $! >"$API_PID_FILE"
  )
  for _ in $(seq 1 40); do
    if is_api_up; then
      echo "chart api ready http://127.0.0.1:${API_PORT}/health"
      return 0
    fi
    sleep 1
  done
  echo "chart api failed to start; see $LOG_FILE" >&2
  return 1
}

start_web() {
  if is_web_up; then
    echo "web already up http://127.0.0.1:${PORT}/sample/ai-generate-app/"
    return 0
  fi
  stop_pid_file "$PID_FILE"
  : >"$LOG_FILE"
  if [[ ! -d node_modules/next ]]; then
    npm install >>"$LOG_FILE" 2>&1
  fi
  nohup sh -c "PORT=\"$PORT\" npx next dev -p \"$PORT\" -H 127.0.0.1 2>&1 | tr -d '\\000' | stdbuf -oL strings -n 1 >> \"$LOG_FILE\"" >/dev/null 2>&1 &
  echo $! >"$PID_FILE"
  for _ in $(seq 1 60); do
    if is_web_up; then
      echo "web ready http://127.0.0.1:${PORT}/sample/ai-generate-app/"
      return 0
    fi
    sleep 1
  done
  echo "web failed to start; see $LOG_FILE" >&2
  return 1
}

if [[ "$MODE" == "restore" ]]; then
  stop_old
  echo "stopped llm-generated-chart services"
  exit 0
fi

if [[ "$MODE" != "headless" ]]; then
  echo "Use --headless for detached local serving (required in this workspace)."
  exit 1
fi

stop_old
: >"$LOG_FILE"
start_api
start_web
sleep 5
head -n 80 "$LOG_FILE" || true
echo "open http://127.0.0.1:${PORT}/sample/ai-generate-app/"
