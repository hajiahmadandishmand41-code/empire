#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -e .env ]]; then
  echo '.env already exists; refusing to overwrite credentials.' >&2
  exit 1
fi
node <<'JS'
const fs = require('fs');
const crypto = require('crypto');
const random = (bytes) => crypto.randomBytes(bytes).toString('hex');
const values = {
  POSTGRES_PASSWORD: random(24), SECRET_KEY_BASE: random(64),
  ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY: random(32),
  ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY: random(32),
  ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT: random(32),
  MISSION_CONTROL_USER: 'empire', MISSION_CONTROL_PASSWORD: random(24),
  SPREE_PUBLISHABLE_KEY: `pk_${random(16)}`,
  ADMIN_EMAIL: 'admin@empire.test', ADMIN_PASSWORD: random(16),
};
let text = fs.readFileSync('.env.example', 'utf8');
for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`;
  text = new RegExp(`^#?\\s*${key}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^#?\\s*${key}=.*$`, 'm'), line)
    : `${text}\n${line}`;
}
fs.writeFileSync('.env', text, { mode: 0o600 });
console.log('Created .env with random local credentials. Read ADMIN_PASSWORD there for the demo admin.');
JS
