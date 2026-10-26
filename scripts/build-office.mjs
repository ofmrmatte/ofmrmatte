import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'integrations/office-background');
const output = resolve(root, 'public/office');
const marker = resolve(output, '.office-build.json');
for (const args of [['ci', '--no-audit', '--no-fund'], ['run', 'build']]) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: source, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Only replace the dedicated output directory previously created by this script.
if (output !== resolve(root, 'public', 'office') || !output.startsWith(resolve(root, 'public') + sep)) throw new Error('Invalid office output path');
if (existsSync(output) && !existsSync(marker)) throw new Error('Refusing to replace an unmarked office directory');
rmSync(output, { recursive: true, force: true });
cpSync(resolve(source, 'dist'), output, { recursive: true });
writeFileSync(marker, JSON.stringify({ source: 'integrations/office-background', base: '/office/' }, null, 2) + '\n');
console.log('Published standalone office build to public/office.');
