import { readFileSync } from 'node:fs';

const auditModulePath = new URL('../src/AuditModule.jsx', import.meta.url);
const source = readFileSync(auditModulePath, 'utf8');

const forbiddenPatterns = [
  { name: 'inline DEFAULT_RISKS declaration', regex: /\bconst\s+DEFAULT_RISKS\b/ },
  { name: 'inline DEFAULT_FINDINGS declaration', regex: /\bconst\s+DEFAULT_FINDINGS\b/ },
  { name: 'inline AuditReportsTab component declaration', regex: /\bfunction\s+AuditReportsTab\b|\bconst\s+AuditReportsTab\s*=/ },
];

const failures = forbiddenPatterns
  .filter(({ regex }) => regex.test(source))
  .map(({ name }) => name);

if (failures.length > 0) {
  console.error('Audit module regression check failed:');
  failures.forEach((failure) => console.error(`- Found ${failure} in src/AuditModule.jsx`));
  process.exit(1);
}

console.log('Audit module regression check passed.');
