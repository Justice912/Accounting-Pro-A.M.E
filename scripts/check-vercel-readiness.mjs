import fs from 'node:fs';

const checks = [
  {
    id: 'vercel-config',
    label: 'vercel.json exists',
    run: () => fs.existsSync('vercel.json'),
  },
  {
    id: 'vite-config',
    label: 'vite.config.js exists',
    run: () => fs.existsSync('vite.config.js'),
  },
  {
    id: 'web-entry',
    label: 'index_accounting.html exists (Vercel entrypoint)',
    run: () => fs.existsSync('index_accounting.html'),
  },
  {
    id: 'workflow',
    label: 'GitHub Actions workflow exists for auto deploy',
    run: () => fs.existsSync('.github/workflows/vercel-deploy.yml'),
  },
  {
    id: 'guide',
    label: 'Deployment guide exists',
    run: () => fs.existsSync('docs/deployment/vercel-github-deploy.md'),
  },
];

let failures = 0;

for (const check of checks) {
  const ok = Boolean(check.run());
  console.log(`${ok ? '✅' : '❌'} ${check.label}`);
  if (!ok) failures += 1;
}

if (failures > 0) {
  console.error(`\n${failures} readiness check(s) failed.`);
  process.exit(1);
}

console.log('\nAll Vercel readiness checks passed.');
