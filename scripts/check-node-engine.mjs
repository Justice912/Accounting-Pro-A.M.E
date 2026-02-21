import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const configured = packageJson?.engines?.node;
const expected = '24.x';

if (configured !== expected) {
  console.error(`Invalid package.json engines.node: expected "${expected}" but found "${configured ?? 'undefined'}".`);
  console.error('Set "engines": { "node": "24.x" } to match current Vercel runtime requirements.');
  process.exit(1);
}

console.log(`Node engine check passed (${expected}).`);
