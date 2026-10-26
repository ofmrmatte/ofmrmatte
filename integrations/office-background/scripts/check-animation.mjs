import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const compile = relative => ts.transpileModule(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const timelineUrl = moduleUrl(compile('../src/office-3d/animations/DevelopmentTimeline.ts'));
const { PROJECTS, CYCLE_SECONDS, sampleDevelopmentTime } = await import(timelineUrl);
const expected = [[.5, 'IDLE'], [2, 'CODING'], [8.5, 'AUTOCOMPLETE'], [19, 'COMPILING'], [23, 'TESTING'], [26, 'BUILD_COMPLETE'], [28, 'PREVIEW_LOADING'], [31, 'PREVIEW_REVEAL'], [45, 'PREVIEW_INTERACTIVE'], [62, 'TRANSITIONING']];
let statesChecked = 0, codeFilesChecked = 0;
for (let project = 0; project < 4; project++) {
  for (const [time, phase] of expected) {
    const result = sampleDevelopmentTime(project * CYCLE_SECONDS + time);
    assert.equal(result.project.id, PROJECTS[project].id); assert.equal(result.phase, phase); statesChecked++;
    if (time < 29) assert.equal(result.previewProgress, 0);
    if (time >= 29) assert.equal(result.buildProgress, 1);
  }
  for (const file of PROJECTS[project].files) {
    const result = ts.transpileModule(file.code, { fileName: file.name, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0, file.name); codeFilesChecked++;
  }
}
assert.equal(sampleDevelopmentTime(256).project.id, 'dashboard');
assert.equal(sampleDevelopmentTime(45, 0).project.id, sampleDevelopmentTime(45, 1).project.id);
const coordinatorSource = compile('../src/office-3d/animations/AnimationCoordinator.ts')
  .replace("'./DevelopmentTimeline'", JSON.stringify(timelineUrl))
  .replace("'react'", JSON.stringify(pathToFileURL(require.resolve('react')).href));
const { AnimationCoordinator } = await import(moduleUrl(coordinatorSource));
const coordinator = new AnimationCoordinator();
for (let i = 0; i < 120; i++) coordinator.advance(1 / 60, .76, false, false);
assert.ok(Math.abs(coordinator.elapsed - 2) < .0001);
const before = coordinator.elapsed;
coordinator.advance(60, .2, false, false); assert.equal(coordinator.elapsed, before + .25);
coordinator.advance(1, .2, true, false); assert.equal(coordinator.elapsed, before + .25);
coordinator.advance(1, .2, false, true); assert.equal(coordinator.elapsed, before + .25);

const clockUrl = moduleUrl(compile('../src/office-3d/screens/RealTimeClock.ts'));
const zones = [];
for (const zone of ['America/Sao_Paulo', 'Asia/Tokyo', 'America/New_York']) {
  const program = `const {readLocalClock}=await import(${JSON.stringify(clockUrl)});const now=new Date('2026-10-26T15:05:00Z');console.log(JSON.stringify(readLocalClock(now)));`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', program], { env: { ...process.env, TZ: zone }, encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  const expectedTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone }).format(new Date('2026-10-26T15:05:00Z'));
  assert.equal(result.time, expectedTime); assert.equal(result.timeZone, zone); zones.push({ zone, time: result.time, date: result.date });
}
globalThis.window = new EventTarget(); globalThis.document = new EventTarget();
const NativeDate = Date; let instant = NativeDate.parse('2026-10-26T15:05:00Z');
globalThis.Date = class extends NativeDate { constructor(value) { super(value === undefined ? instant : value); } static now() { return instant; } };
const { RealTimeClock } = await import(clockUrl); let notifications = 0;
const clock = new RealTimeClock(() => notifications++);
instant += 360000; window.dispatchEvent(new Event('focus')); assert.equal(clock.current.timestamp, instant);
instant += 86400000; document.dispatchEvent(new Event('visibilitychange')); assert.equal(clock.current.timestamp, instant);
clock.dispose(); const calls = notifications;
window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); assert.equal(notifications, calls);
globalThis.Date = NativeDate;
console.log(JSON.stringify({ passed: true, statesChecked, codeFilesChecked, zones, focusAndVisibilitySync: true, disposeListeners: true, largeDeltaClamp: true, hiddenAndReducedMotionPause: true }, null, 2));
