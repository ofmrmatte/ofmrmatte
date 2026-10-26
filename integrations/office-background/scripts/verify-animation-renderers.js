async (page) => {
  await page.goto('http://127.0.0.1:5174/?progress=0.76');
  await page.bringToFront();
  const data = await page.evaluate(async () => {
    const timeline = await import('/src/office-3d/animations/DevelopmentTimeline.ts');
    const previews = await import('/src/office-3d/screens/ApplicationPreviews.ts');
    const editor = await import('/src/office-3d/screens/CodeEditorRenderer.ts');
    const terminal = await import('/src/office-3d/screens/TerminalRenderer.ts');
    const clock = await import('/src/office-3d/screens/RealTimeClock.ts');
    const rain = await import('/src/office-3d/weather/RainParticles.tsx');
    const seedA = rain.createRainGeometry(480), seedB = rain.createRainGeometry(480);
    const a = seedA.attributes.aSeed.array, b = seedB.attributes.aSeed.array;
    if (!a.every((v, i) => v === b[i])) throw new Error('Rain seed is not deterministic');
    seedA.dispose(); seedB.dispose();
    const host = document.createElement('section'); host.id = 'renderer-check';
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0c111c;overflow:auto;';
    const canvas = document.createElement('canvas'); canvas.id = 'renderer-check-canvas'; canvas.width = 1280; canvas.height = 720; host.append(canvas); document.body.append(host);
    const c = canvas.getContext('2d');
    const hash = () => { const d = c.getImageData(0, 0, 1280, 720).data; let sum = 0; for (let i = 0; i < d.length; i += 37) sum = (Math.imul(sum, 31) + d[i]) | 0; return sum; };
    const projects = [];
    for (let i = 0; i < 4; i++) {
      previews.drawApplicationPreview(c, timeline.sampleDevelopmentTime(i * 64 + 31)); const partial = hash();
      previews.drawApplicationPreview(c, timeline.sampleDevelopmentTime(i * 64 + 39)); const full = hash();
      previews.drawApplicationPreview(c, timeline.sampleDevelopmentTime(i * 64 + 50)); const later = hash();
      if (partial === full || full === later) throw new Error('Preview does not evolve: ' + i);
      projects.push({ project: timeline.PROJECTS[i].id, partial, full, later });
    }
    editor.drawCodeEditor(c, timeline.sampleDevelopmentTime(3)); const early = hash();
    editor.drawCodeEditor(c, timeline.sampleDevelopmentTime(5)); const typed = hash();
    if (early === typed) throw new Error('Editor did not change');
    terminal.drawTerminal(c, timeline.sampleDevelopmentTime(22), 1280, 720); const compiling = hash();
    terminal.drawTerminal(c, timeline.sampleDevelopmentTime(26), 1280, 720); const completed = hash();
    if (compiling === completed) throw new Error('Terminal did not progress');
    const expectedClock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    if (clock.readLocalClock().time !== expectedClock) throw new Error('Local clock mismatch');
    return { passed: true, projects, editor: { early, typed }, terminal: { compiling, completed }, expectedClock, deterministicRain: true };
  });
  for (let i = 0; i < 4; i++) {
    await page.evaluate(async index => { const T = await import('/src/office-3d/animations/DevelopmentTimeline.ts'); const R = await import('/src/office-3d/screens/ApplicationPreviews.ts'); R.drawApplicationPreview(document.querySelector('#renderer-check-canvas').getContext('2d'), T.sampleDevelopmentTime(index * 64 + 45)); }, i);
    await page.locator('#renderer-check-canvas').screenshot({ path: `artifacts/animations/preview-${data.projects[i].project}.png` });
  }
  await page.evaluate(() => document.querySelector('#renderer-check').remove());
  return data;
}
