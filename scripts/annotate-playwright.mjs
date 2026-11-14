import fs from 'node:fs';

// Surface every failed Playwright test as its own bounded GitHub annotation.
// The generic command tail truncates the middle failures in a multi-test run.
const file = process.argv[2] || 'storefront/test-results/results.json';
if (!fs.existsSync(file)) process.exit(0);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const escape = (value) => String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const clean = (value) => String(value || '').replace(/\u001b\[[0-9;]*m/g, '');
let failed = 0;
function visit(suites) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results?.at(-1);
        if (spec.ok && result?.status === 'passed') continue;
        failed += 1;
        const errors = (result?.errors || []).map((error) => clean(error.message)).join('\n');
        const snapshot = clean(result?.errorContext?.body || result?.errorContext?.attachment?.body || '');
        const message = `${spec.file}:${spec.line}\n${errors}\n${snapshot ? `\nPage snapshot:\n${snapshot}` : ''}`.slice(0, 3500);
        console.log(`::error title=${escape(spec.title)}::${escape(message)}`);
      }
    }
    visit(suite.suites);
  }
}
visit(report.suites);
const stats = report.stats || {};
console.log(`Playwright stats: expected=${stats.expected ?? 0} unexpected=${stats.unexpected ?? 0} skipped=${stats.skipped ?? 0} flaky=${stats.flaky ?? 0}`);
if (failed > 0 || (stats.unexpected ?? 0) > 0) process.exitCode = 1;
