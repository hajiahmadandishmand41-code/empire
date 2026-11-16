import fs from 'node:fs';

// Emit a bounded GitHub annotation only when the log contains a real failure
// marker. A failed browser test must not label a successful migrate container
// as failed merely because its log ends with EMPIRE_SEEDED.
const file = process.argv[2];
const title = process.argv[3] || 'Empire CI log';
const limit = Math.min(Number(process.argv[4] || 3500), 3500);
if (!file || !fs.existsSync(file)) process.exit(0);

const clean = (value) => value.replace(/\u001b\[[0-9;]*m/g, '');
const lines = clean(fs.readFileSync(file, 'utf8')).split(/\r?\n/);
const noise = /\[Spree Event\]|\[ActiveJob\]|payload:|DEPRECATION|SimpleCov\.add_group/;
const failure = /Failures:|Failure\/Error:|rake aborted!|ActiveRecord::[A-Za-z]+Error|I18n::Invalid|NoMethodError|ArgumentError|RecordInvalid|NameError|RuntimeError|FrozenError|LoadError|SyntaxError|StandardError|Permission denied|EACCES|Missing permission|\bFATAL\b|\bERROR\b|Expected:|Received:|expected .* got/;
const hits = [];
for (let i = 0; i < lines.length; i += 1) {
  if (!noise.test(lines[i]) && failure.test(lines[i])) hits.push(i);
}
if (hits.length === 0) process.exit(0);

const selected = new Set();
for (const hit of hits) {
  for (let i = Math.max(0, hit - 2); i <= Math.min(lines.length - 1, hit + 3); i += 1) selected.add(i);
}
const excerpt = [...selected].sort((a, b) => a - b).map((i) => `${i + 1}:${lines[i]}`).join('\n').slice(-limit);
const escape = (value) => value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
console.log(`::error title=${escape(title)}::${escape(excerpt)}`);
