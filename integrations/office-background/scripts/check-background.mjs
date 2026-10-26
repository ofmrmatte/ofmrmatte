import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/office-3d/animations/FrameBudget.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { FrameBudget } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const samples = [];
for (const refresh of [60, 120, 144]) for (const limit of [1, 24, 30]) {
  const budget = new FrameBudget(); let frames = 0, time = 0;
  for (let i = 0; i <= refresh * 10; i++) {
    const result = budget.tick(i * 1000 / refresh, limit);
    if (result !== null) { frames++; assert.ok(result >= time); time = result; }
  }
  assert.ok(Math.abs(frames - (limit * 10 + 1)) <= 1, `${refresh} Hz / ${limit} fps: ${frames}`);
  assert.ok(Math.abs(time - 10) < 1 / limit + .001, 'Animation time follows rendered time');
  const resumed = new FrameBudget(time);
  assert.equal(resumed.tick(900000, limit), time, 'Resume excludes time spent hidden');
  let resumedTime = time;
  for (let i = 1; i <= refresh; i++) {
    const result = resumed.tick(900000 + i * 1000 / refresh, limit);
    if (result !== null) resumedTime = result;
  }
  assert.ok(Math.abs(resumedTime - time - 1) < 1 / limit + .001, 'Resume advances normally');
  samples.push({ refresh, limit, frames });
}
console.log(JSON.stringify({ passed: true, cadence: samples, resumeWithoutJump: true }, null, 2));
