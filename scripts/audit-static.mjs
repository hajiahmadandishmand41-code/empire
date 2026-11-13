import fs from 'node:fs';
import path from 'node:path';
import YAML from '../storefront/node_modules/yaml/dist/index.js';

const root = path.resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => { throw new Error(message); };
const en = JSON.parse(read('storefront/src/locales/en.json'));
const fa = JSON.parse(read('storefront/src/locales/fa-AF.json'));
const ps = JSON.parse(read('storefront/src/locales/ps-AF.json'));
const keys = Object.keys(en).sort();
if (JSON.stringify(keys) !== JSON.stringify(Object.keys(fa).sort())) fail('Dari/English message keys differ');
if (Object.values(fa).some((value) => typeof value !== 'string' || !value.trim())) fail('Empty Dari message');
if (ps.status !== 'draft' || Object.keys(ps.messages).length !== 0) fail('Pashto must remain an explicit empty Draft until reviewed');
const allowedLatin = new Set(['Empire', 'RFQ', 'COD', 'MOQ', 'B2B', 'Stripe']);
for (const [key, value] of Object.entries(fa)) {
  if (/[\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/u.test(value)) fail(`Mixed-script Dari message: ${key}`);
  for (const word of value.match(/[A-Za-z]{2,}/g) || []) if (!allowedLatin.has(word)) fail(`Unnatural Latin text in Dari ${key}: ${word}`);
}
function walk(dir) { return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
const uiFiles = walk('storefront/src').filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes('/locales/'));
const used = new Set();
for (const file of uiFiles) for (const match of read(file).matchAll(/\bt\(["']([a-z_]+)["']\)/g)) used.add(match[1]);
for (const key of used) if (!(key in en)) fail(`Frontend uses missing translation key: ${key}`);
for (const [locale, messages] of [['en', en], ['fa-AF', fa]]) {
  const file = `server/config/locales/${locale}.yml`;
  const generated = YAML.stringify({ [locale]: { empire: messages } });
  if (write) fs.writeFileSync(path.join(root, file), generated);
  else if (read(file) !== generated) fail(`${file} is not synchronized with the storefront catalog`);
  const doc = YAML.parseDocument(read(file), { uniqueKeys: true });
  if (doc.errors.length) fail(`${file}: ${doc.errors.map((e) => e.message).join('; ')}`);
  const yamlKeys = Object.keys(doc.toJS()[locale].empire).sort();
  if (JSON.stringify(yamlKeys) !== JSON.stringify(keys)) fail(`${file} translation coverage mismatch`);
}
const psDoc = YAML.parseDocument(read('server/config/locales/ps-AF.yml'), { uniqueKeys: true });
if (psDoc.errors.length || psDoc.toJS()['ps-AF'].translation_status !== 'draft') fail('Pashto YAML must be valid and Draft');
const forbidden = /TODO-PS|Mannyjad|Manny|د Before|م진|امپراتور|\bpicture\b/i;
for (const file of [...uiFiles, ...walk('server/app').filter((f) => f.endsWith('.rb')), ...walk('server/db/seeds').filter((f) => f.endsWith('.rb'))]) {
  if (forbidden.test(read(file))) fail(`Corrupted text remains in ${file}`);
}
for (const file of ['docker-compose.yml', 'docker-compose.dev.yml']) {
  const doc = YAML.parseDocument(read(file), { uniqueKeys: true });
  if (doc.errors.length) fail(`${file}: ${doc.errors.map((e) => e.message).join('; ')}`);
  const compose = YAML.parse(read(file), { merge: true });
  for (const service of ['web', 'migrate']) {
    const build = compose.services[service].build;
    if (!build || build.context !== '.' || build.dockerfile !== 'server/Dockerfile') fail(`${file}/${service} does not build Empire source`);
  }
  if (Object.values(compose.services).some((service) => typeof service.image === 'string' && service.image.startsWith('ghcr.io/spree/spree'))) fail(`${file} uses a stock Spree runtime image`);
}
const contract = JSON.parse(read('docs/api/api-contract.json'));
const specs = Object.fromEntries(['store', 'admin', 'seller'].map((api) => [api, YAML.parse(read(`docs/api/spree-6.0.4/${api}.yaml`))]));
for (const [api, method, operationPath] of contract.core) {
  if (!specs[api].paths[operationPath]?.[method]) fail(`API contract absent from exact Spree ${contract.spree_version} OpenAPI: ${method.toUpperCase()} ${operationPath}`);
}
if (read('docs/api/spree-6.0.4/SOURCE-COMMIT.txt').trim() !== contract.source_commit) fail('API source commit mismatch');
const lock = read('server/Gemfile.lock');
for (const gem of ['spree', 'spree_core', 'spree_api']) if (!new RegExp(`    ${gem} \\(6\\.0\\.4\\)`).test(lock)) fail(`${gem} is not locked to 6.0.4`);
console.log(JSON.stringify({ status: 'PASS', translation_keys: keys.length, frontend_keys_checked: used.size, pashto: 'Draft (not offered)', core_operations_checked: contract.core.length, empire_operations: contract.empire.length, compose_builds: 'Empire server/Dockerfile', spree: contract.spree_version }));
