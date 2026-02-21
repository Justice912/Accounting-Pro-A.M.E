import { readFileSync } from 'node:fs';

const auditModulePath = new URL('../src/AuditModule.jsx', import.meta.url);
const source = readFileSync(auditModulePath, 'utf8');

function stripStringsAndComments(code) {
  let out = '';
  let i = 0;
  let state = 'code';

  while (i < code.length) {
    const c = code[i];
    const n = code[i + 1];

    if (state === 'code') {
      if (c === '/' && n === '/') {
        state = 'lineComment';
        out += '  ';
        i += 2;
        continue;
      }
      if (c === '/' && n === '*') {
        state = 'blockComment';
        out += '  ';
        i += 2;
        continue;
      }
      if (c === "'") {
        state = 'singleQuote';
        out += ' ';
        i += 1;
        continue;
      }
      if (c === '"') {
        state = 'doubleQuote';
        out += ' ';
        i += 1;
        continue;
      }
      if (c === '`') {
        state = 'template';
        out += ' ';
        i += 1;
        continue;
      }

      out += c;
      i += 1;
      continue;
    }

    if (state === 'lineComment') {
      if (c === '\n') {
        state = 'code';
        out += '\n';
      } else {
        out += ' ';
      }
      i += 1;
      continue;
    }

    if (state === 'blockComment') {
      if (c === '*' && n === '/') {
        state = 'code';
        out += '  ';
        i += 2;
      } else {
        out += c === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    if (state === 'singleQuote') {
      if (c === '\\') {
        out += '  ';
        i += 2;
      } else if (c === "'") {
        state = 'code';
        out += ' ';
        i += 1;
      } else {
        out += c === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    if (state === 'doubleQuote') {
      if (c === '\\') {
        out += '  ';
        i += 2;
      } else if (c === '"') {
        state = 'code';
        out += ' ';
        i += 1;
      } else {
        out += c === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    if (state === 'template') {
      if (c === '\\') {
        out += '  ';
        i += 2;
      } else if (c === '`') {
        state = 'code';
        out += ' ';
        i += 1;
      } else {
        out += c === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }
  }

  return out;
}

const analyzableSource = stripStringsAndComments(source);

const forbiddenPatterns = [
  { name: 'inline DEFAULT_RISKS declaration', regex: /^\s*const\s+DEFAULT_RISKS\b/m },
  { name: 'inline DEFAULT_FINDINGS declaration', regex: /^\s*const\s+DEFAULT_FINDINGS\b/m },
  { name: 'inline AuditReportsTab component declaration', regex: /^\s*(?:function\s+AuditReportsTab\b|const\s+AuditReportsTab\s*=)/m },
];

const failures = forbiddenPatterns
  .filter(({ regex }) => regex.test(analyzableSource))
  .map(({ name }) => name);

if (failures.length > 0) {
  console.error('Audit module regression check failed:');
  failures.forEach((failure) => console.error(`- Found ${failure} in src/AuditModule.jsx`));
  process.exit(1);
}

console.log('Audit module regression check passed.');
