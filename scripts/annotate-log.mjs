import fs from 'node:fs';
const file = process.argv[2];
const title = process.argv[3] || 'Empire CI log';
if (!file || !fs.existsSync(file)) process.exit(0);
const text = fs.readFileSync(file, 'utf8').slice(-Number(process.argv[4] || 3300)).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
console.log(`::error title=${title}::${text}`);
