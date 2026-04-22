import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const prefer = args.has('--prefer=theirs') ? 'theirs' : 'ours';

function run(cmd, cmdArgs, options = {}) {
  const commandString = `${cmd} ${cmdArgs.join(' ')}`;
  console.log(`$ ${commandString}`);
  if (!execute) return { status: 0, stdout: '' };

  const result = spawnSync(cmd, cmdArgs, {
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    if (options.capture && result.stdout) process.stdout.write(result.stdout);
    if (options.capture && result.stderr) process.stderr.write(result.stderr);
  }

  return result;
}

console.log(execute
  ? `Running conflict resolver (prefer=${prefer}).`
  : `Dry run conflict resolver (prefer=${prefer}). Pass --execute to apply.`);

run('git', ['status', '--short']);
run('git', ['fetch', 'origin']);

const rebaseResult = run('git', ['rebase', 'origin/main']);
if (!execute) {
  console.log('\nDry run complete.');
  process.exit(0);
}

if (rebaseResult.status === 0) {
  console.log('\nRebase completed with no conflicts.');
  process.exit(0);
}

const conflictResult = run('git', ['diff', '--name-only', '--diff-filter=U'], { capture: true });
const conflicts = String(conflictResult.stdout || '')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

if (!conflicts.length) {
  console.error('\nRebase failed but no unmerged files were detected.');
  process.exit(1);
}

console.log('\nConflicted files:');
for (const file of conflicts) {
  console.log(`- ${file}`);
}

const autoResolvablePatterns = [
  /^docs\//,
  /^\.github\/workflows\//,
  /^scripts\//,
  /^package\.json$/,
];

const autoResolvable = conflicts.filter(file => autoResolvablePatterns.some(pattern => pattern.test(file)));
const manual = conflicts.filter(file => !autoResolvable.includes(file));

for (const file of autoResolvable) {
  run('git', ['checkout', `--${prefer}`, '--', file]);
  run('git', ['add', file]);
}

if (manual.length) {
  console.log('\nManual resolution still required for:');
  for (const file of manual) {
    console.log(`- ${file}`);
  }
  console.log('\nAfter resolving manually, run:');
  console.log('  git add <files>');
  console.log('  git rebase --continue');
  process.exit(2);
}

const continueResult = run('git', ['rebase', '--continue']);
if (continueResult.status !== 0) {
  console.log('\nRebase continuation requires manual intervention.');
  process.exit(2);
}

console.log('\nRebase conflict resolution completed successfully.');
