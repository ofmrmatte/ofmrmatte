async (page) => {
  const errors = [], samples = {};
  const check = (ok, reason) => { if (!ok) throw new Error(reason); };
  const wait = async (predicate, limit = 15000) => {
    for (let i = 0; i < limit / 200; i++) { if (await page.evaluate(predicate)) return; await page.waitForTimeout(200); }
    throw new Error('Background state deadline exceeded');
  };
  const errorListener = event => { if (event.type() === 'error') errors.push(event.text()); };
  page.on('console', errorListener);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5174/?debug', { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  await wait(() => window.__officeDiagnostics?.plantLoaded);
  await page.evaluate(async () => {
    const F = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    window.__getOffice = () => F._roots.get(document.querySelector('canvas')).store.getState();
  });
  const read = () => page.evaluate(() => {
    const s = window.__getOffice();
    return { time: s.clock.elapsedTime, frame: s.gl.info.render.frame, calls: s.gl.info.render.calls, dpr: s.gl.getPixelRatio(), camera: s.camera.position.toArray(), profile: window.__officeDiagnostics?.profile, active: document.querySelector('.office-background').dataset.active };
  });
  samples.desktop = await read();
  check(await page.evaluate(() => document.documentElement.scrollHeight === innerHeight && !document.querySelector('.office-header,.office-stages,.office-progress') && !!document.querySelector('[aria-hidden="true"] canvas')), 'Decorative background without tour UI or scroll spacer');
  check(samples.desktop.dpr <= 1.26 && samples.desktop.calls < 330, 'Desktop pixel and draw budgets');
  check((await page.evaluate(() => performance.getEntriesByType('resource').filter(x => /gsap|ScrollTrigger|PostProcessingEffects/.test(x.name)).length)) === 0, 'Heavy optional modules should not load');
  await page.evaluate(() => {
    const button = document.createElement('button'); button.id = 'portfolio-click-test'; button.textContent = 'Ver projetos'; button.style.cssText = 'position:fixed;left:24px;top:24px;z-index:5;padding:20px';
    button.onclick = () => { button.dataset.clicked = 'yes'; }; document.body.append(button);
  });
  await page.locator('#portfolio-click-test').click();
  check(await page.locator('#portfolio-click-test').getAttribute('data-clicked') === 'yes', 'Foreground links remain interactive');
  await page.locator('#portfolio-click-test').evaluate(e => e.remove());
  let a = await read(); await page.waitForTimeout(2200); let b = await read();
  samples.desktopMeasuredFPS = (b.frame - a.frame) / (b.time - a.time);
  check(b.time > a.time && samples.desktopMeasuredFPS <= 31.5, 'Actual rendering respects 30 fps cap');
  check(Math.hypot(...b.camera.map((v, i) => v - a.camera[i])) < .03, 'Background camera has subtle motion');
  await page.screenshot({ path: 'artifacts/background/desktop.png', scale: 'css' });
  await page.evaluate(() => {
    const root = document.querySelector('.office-background');
    root.style.position = 'absolute'; root.style.top = '1500px'; root.style.bottom = 'auto'; root.style.height = '900px'; document.body.style.minHeight = '2600px';
  });
  await wait(() => document.querySelector('.office-background').dataset.active === 'false');
  await page.waitForTimeout(300); a = await read(); await page.waitForTimeout(1200); b = await read();
  check(b.frame === a.frame && b.time === a.time, 'Offscreen rendering fully pauses'); samples.offscreenPaused = true;
  await page.evaluate(() => scrollTo(0, 1500));
  await wait(() => document.querySelector('.office-background').dataset.active === 'true');
  await page.waitForTimeout(600); b = await read();
  check(b.time > a.time && b.time - a.time < 1.1, 'Resume excludes hidden duration'); samples.resumeWithoutJump = true;
  await page.evaluate(() => {
    const root = document.querySelector('.office-background'); root.style.position = 'fixed'; root.style.top = '0'; root.style.bottom = '0'; root.style.height = 'auto'; document.body.style.minHeight = ''; scrollTo(0, 0);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
  });
  await wait(() => document.querySelector('.office-background').dataset.active === 'false');
  await page.waitForTimeout(300); a = await read(); await page.waitForTimeout(1200); b = await read();
  check(b.frame === a.frame, 'Visibility event stops rendering'); samples.visibilityPaused = true;
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await wait(() => document.querySelector('.office-background').dataset.active === 'true');
  await page.setViewportSize({ width: 900, height: 900 });
  await wait(() => window.__officeDiagnostics?.profile === 'tablet'); samples.tablet = await read();
  check(await page.evaluate(() => window.__officeDiagnostics.weather.rain.particleCount === 400), 'Tablet weather budget');
  await page.setViewportSize({ width: 390, height: 844 });
  await wait(() => window.__officeDiagnostics?.profile === 'mobile'); samples.mobile = await read();
  check(samples.mobile.dpr <= 1.01 && await page.evaluate(() => window.__officeDiagnostics.weather.rain.particleCount === 220 && window.__officeDiagnostics.targetFPS === 24), 'Mobile quality budget');
  await page.screenshot({ path: 'artifacts/background/mobile.png', scale: 'css' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await wait(() => document.querySelector('.office-background').dataset.reducedMotion === 'true');
  await page.waitForTimeout(1300);
  a = await read(); const animationA = await page.evaluate(() => window.__officeDiagnostics.animation.elapsed);
  await page.waitForTimeout(2200); b = await read(); const animationB = await page.evaluate(() => window.__officeDiagnostics.animation.elapsed);
  check(animationA === animationB && Math.hypot(...b.camera.map((v, i) => v - a.camera[i])) < .00001 && b.frame - a.frame <= 3, 'Reduced motion remains static at 1 fps'); samples.reducedMotion = true;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:5174/?paused', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  check(await page.evaluate(() => document.querySelector('.office-background')?.dataset.active === 'false'), 'Explicit pause prop'); samples.explicitPause = true;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5174/?tour', { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  await wait(() => !!window.__officeDiagnostics?.plantLoaded);
  check(await page.locator('.office-stages button').count() === 5, 'Full tour remains available');
  await page.locator('.office-stages button').nth(3).click();
  await wait(() => window.__officeDiagnostics?.activeScene === 4);
  check(await page.evaluate(() => window.__officeDiagnostics.bounds.overlaps.length === 0), 'Tour camera and furniture retain valid placement'); samples.tour = true;
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded' });
  await page.bringToFront(); await page.waitForTimeout(1500);
  page.off('console', errorListener);
  check(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  return { passed: true, samples, errors };
}
