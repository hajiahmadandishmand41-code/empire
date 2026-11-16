#!/usr/bin/env bash
set -euo pipefail
url=${1:?URL required}
deadline=$((SECONDS + ${2:-300}))
until curl --fail --silent --show-error "$url" >/dev/null; do
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for $url" >&2
    exit 1
  fi
  sleep 3
done
echo "Ready: $url"
