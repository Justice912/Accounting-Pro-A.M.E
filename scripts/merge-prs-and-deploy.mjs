import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const verbose = args.has('--verbose');

const steps = [
  { cmd: 'gh', args: ['auth', 'status'] },
  { cmd: 'vercel', args: ['whoami'] },
  { cmd: 'git', args: ['checkout', 'main'] },
  { cmd: 'git', args: ['pull', '--ff-only', 'origin', 'main'] },
  { cmd: 'gh', args: ['pr', 'merge', '49', '--merge', '--delete-branch'] },
  { cmd: 'gh', args: ['pr', 'merge', '52', '--merge', '--delete-branch'] },
  { cmd: 'git', args: ['pull', '--ff-only', 'origin', 'main'] },
  { cmd: 'vercel', args: ['pull', '--yes', '--environment=production'] },
  { cmd: 'vercel', args: ['build', '--prod'] },
  { cmd: 'vercel', args: ['deploy', '--prebuilt', '--prod'] },
];

console.log(execute
  ? 'Running PR merge + production deploy workflow...'
  : 'Dry run: planned PR merge + production deploy workflow. Pass --execute to run.');

for (const [index, step] of steps.entries()) {
  const commandString = `${step.cmd} ${step.args.join(' ')}`;
  console.log(`${String(index + 1).padStart(2, '0')}. ${commandString}`);

  if (!execute) continue;

  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: false,
  });

  if (verbose) {
    console.log(`[debug] exit code for "${commandString}": ${result.status}`);
  }

  if (result.status !== 0) {
    console.error(`\nStopped: command failed -> ${commandString}`);
    process.exit(result.status || 1);
  }
}

console.log('\nWorkflow complete.');
