const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID',
  'ANTHROPIC_API_KEY',
];

let missing = 0;

for (const key of required) {
  const value = process.env[key];
  const ok = typeof value === 'string' && value.trim().length > 0;
  console.log(`${ok ? '✅' : '❌'} ${key}`);
  if (!ok) missing += 1;
}

if (missing > 0) {
  console.error(`\nMissing ${missing} required environment variable(s).`);
  process.exit(1);
}

console.log('\nAll VAT Capture environment variables are set.');
