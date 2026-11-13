#!/usr/bin/env bash
# Run a real command, preserve its exit code, and expose a bounded failure tail
# as a GitHub annotation (the sandbox cannot download Actions artifact redirects).
set -uo pipefail
mkdir -p "${RUNNER_TEMP:-/tmp}/empire-ci"
log=$(mktemp "${RUNNER_TEMP:-/tmp}/empire-ci/command-XXXXXX.log")
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [[ "$status" -ne 0 && "${GITHUB_ACTIONS:-}" == "true" ]]; then
  tail_text=$(tail -c 12000 "$log")
  tail_text=${tail_text//'%'/'%25'}
  tail_text=${tail_text//$'\r'/'%0D'}
  tail_text=${tail_text//$'\n'/'%0A'}
  printf '::error title=Empire CI command failed (exit %s)::%s\n' "$status" "$tail_text"
fi
exit "$status"
