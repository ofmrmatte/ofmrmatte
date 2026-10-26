async (page) => {
  const base = 'http://127.0.0.1:4173', errors = [], failed = [], samples = [];
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const waitForState = async (predicate, argument, limit = 45000) => {
    for (let waited = 0; waited < limit; waited += 250) {
      if (await page.evaluate(predicate, argument)) return;
      await page.waitForTimeout(250);
    }
    throw new Error('Application state deadline exceeded');
  };
  const consoleListener = event => { if (event.type() === 'error') errors.push(event.text()); };
  const responseListener = response => { if (response.status() >= 400) failed.push(response.url()); };
  page.on('console', consoleListener); page.on('response', responseListener);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${base}/?progress=0.76`);
  await page.bringToFront();
  await waitForState(() => window.__officeDiagnostics?.animation?.elapsed >= 3);
  const a = await page.evaluate(() => window.__officeDiagnostics);
  await page.screenshot({ path: 'artifacts/animations/live-coding.png' });
  await page.waitForTimeout(2600);
  const b = await page.evaluate(() => window.__officeDiagnostics);
  check(b.progress === a.progress && b.animation.elapsed > a.animation.elapsed, 'Time must advance without scrolling');
  check(b.screenVersions[0] > a.screenVersions[0] && b.screenVersions[2] > a.screenVersions[2], 'Editor and terminal must animate');
  check(b.weather.time > a.weather.time && b.weather.rain.exteriorMaxX < -3.2, 'Weather time and rain outside the reveal');
  const wall = b.animation.clock.time;
  const nativeTime = await page.evaluate(() => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()));
  check(wall === nativeTime, 'Phone uses browser local time');
  const rate = (b.animation.draws.ide - a.animation.draws.ide) / (b.animation.elapsed - a.animation.elapsed);
  check(rate <= 21, 'Canvas editor frame-rate cap');
  await waitForState(() => window.__officeDiagnostics?.animation?.phase === 'PREVIEW_INTERACTIVE');
  const preview = await page.evaluate(() => window.__officeDiagnostics);
  check(preview.animation.project === 'dashboard' && preview.animation.previewProgress === 1 && preview.animation.buildProgress === 1, 'Coordinated code → build → matching preview');
  await page.screenshot({ path: 'artifacts/animations/live-dashboard.png' });
  await page.goto(base);
  await page.bringToFront();
  await waitForState(() => window.__officeDiagnostics?.plantLoaded);
  for (const [i, p] of [0, .28, .52, .76, 1].entries()) {
    await page.evaluate(p => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * p, behavior: 'instant' }), p);
    await page.waitForTimeout(1300);
    const d = await page.evaluate(() => window.__officeDiagnostics);
    check(d.activeScene === i + 1 && d.bounds.overlaps.length === 0, 'Scroll camera or furniture regression');
    samples.push(d);
  }
  await page.getByRole('button', { name: 'Cena 1: VISÃO GERAL' }).click(); await page.waitForTimeout(1800);
  await page.screenshot({ path: 'artifacts/animations/live-rainy-office.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(2400);
  const mobile = await page.evaluate(() => window.__officeDiagnostics);
  check(mobile.profile === 'mobile' && mobile.weather.rain.particleCount === 480, 'Mobile quality profile');
  await page.screenshot({ path: 'artifacts/animations/live-mobile.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(1400);
  const reducedA = await page.evaluate(() => window.__officeDiagnostics);
  await page.waitForTimeout(1300);
  const reducedB = await page.evaluate(() => window.__officeDiagnostics);
  check(Math.abs(reducedB.animation.elapsed - reducedA.animation.elapsed) < .01 && reducedB.weather.time === reducedA.weather.time, 'Reduced motion freezes nonessential movement');
  const clockJump = await page.evaluate(() => {
    window.__clockTestDate = Date; const target = Date.now() + 360000;
    const Native = Date; window.Date = class extends Native { constructor(value) { super(value === undefined ? target : value); } static now() { return target; } };
    window.dispatchEvent(new Event('focus'));
    return { timestamp: target, time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()) };
  });
  await page.waitForTimeout(1300);
  const jumped = await page.evaluate(() => window.__officeDiagnostics.animation.clock);
  await page.evaluate(() => { window.Date = window.__clockTestDate; delete window.__clockTestDate; window.dispatchEvent(new Event('focus')); });
  check(jumped.time === clockJump.time && jumped.timestamp === clockJump.timestamp, 'Phone resynchronizes on focus while animations are paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(600); const hiddenA = await page.evaluate(() => window.__officeDiagnostics.animation.elapsed);
  await page.waitForTimeout(1200); const hiddenB = await page.evaluate(() => window.__officeDiagnostics.animation.elapsed);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1400);
  check(hiddenA === hiddenB, 'Hidden tab pauses the render loop');
  const memory = [];
  for (const width of [1440, 390, 1440, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    await waitForState(expected => window.__officeDiagnostics?.profile === expected, width === 390 ? 'mobile' : 'desktop', 15000);
    await page.waitForTimeout(1200);
    memory.push(await page.evaluate(() => ({ profile: window.__officeDiagnostics.profile, memory: window.__officeDiagnostics.memory })));
  }
  const desktop = memory.filter(row => row.profile === 'desktop');
  check(desktop.at(-1).memory.geometries <= desktop[0].memory.geometries + 3 && desktop.at(-1).memory.textures <= desktop[0].memory.textures + 1, 'GPU resource counts plateau across quality changes');
  check(!errors.length && !failed.length, `Console/network failures: ${JSON.stringify({ errors, failed })}`);
  page.off('console', consoleListener); page.off('response', responseListener);
  return { passed: true, stationary: { before: a, after: b, editorFPS: rate }, preview, cameraSamples: samples, mobile, reducedMotion: true, clockFocusSync: true, hiddenPause: true, memory, errors, failed };
}
