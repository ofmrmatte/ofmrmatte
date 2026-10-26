import { ScreenAnimationState } from '../animations/DevelopmentTimeline';
import { Ctx, UI, panel, text, progress, transitionOverlay } from './canvasUI';
const spinner = ['◐', '◓', '◑', '◒'];
export function terminalLines(s: ScreenAnimationState) {
  const t = s.localTime;
  const lines: [number, string, string][] = [
    [0, '$ npm run dev     # local demonstration', '#79b8ff'],
    [1.5, 'info  checking workspace dependencies…', UI.muted],
    [3.2, 'ready API sandbox / synthetic fixtures', UI.green],
    [6, 'info  PostgreSQL adapter: simulated connection', '#79b8ff'],
    [11, `watch ${s.project.files[1].name} changed`, '#d7ad7b'],
    [16, `watch ${s.project.files[2].name} changed`, '#d7ad7b'],
    [18, 'build compiling TypeScript modules…', '#79b8ff'],
    [20, 'build resolving routes and UI components…', UI.muted],
    [22, 'test  starting simulated checks…', '#b9a4ff'],
    [23, s.projectIndex === 2 ? 'error CRM timeout / retrying [DEMO fixture]' : 'test  validating input and rendering fixtures', s.projectIndex === 2 ? '#ef9393' : '#eac08c'],
    [24, s.projectIndex === 2 ? 'ok    retry resolved / idempotency preserved' : 'ok    demonstration checks completed', UI.green],
    [25, 'ready demo bundle prepared', UI.green],
    [27, `serve ${s.project.host}`, '#79b8ff'],
    [29, 'ready preview connected to matching workspace', UI.green],
    [34, 'watch waiting for updates…', UI.muted],
  ];
  if (t > 37) {
    const index = Math.floor((t - 37) / 3);
    const jobs = ['queue demo event received', 'sync  synthetic record updated', 'api   demo response prepared', 'task  scheduled workflow complete'];
    for (let i = 0; i <= Math.min(index, 7); i++) lines.push([37 + i * 3, `${spinner[i % 4]} ${jobs[(i + s.projectIndex) % jobs.length]}`, i % 3 === 2 ? UI.green : UI.muted]);
  }
  return lines.filter(row => t >= row[0]);
}
export function drawTerminal(c: Ctx, s: ScreenAnimationState, width = 1024, height = 640) {
  c.fillStyle = '#090e17'; c.fillRect(0, 0, width, height);
  panel(c, 0, 0, width, 40, '#182231', 0);
  ['#ef796f', '#edc66d', '#73c59b'].forEach((color, i) => { c.fillStyle = color; c.beginPath(); c.arc(22 + i * 18, 20, 5, 0, Math.PI * 2); c.fill(); });
  text(c, `Terminal — ${s.project.name}`, 95, 26, 15);
  text(c, 'DEMO / NO COMMANDS EXECUTED', width - 290, 26, 12, UI.muted);
  const rows = terminalLines(s), max = Math.floor((height - 125) / 31), visible = rows.slice(-max);
  visible.forEach(([, value, color], i) => text(c, value, 27, 78 + i * 31, 17, color, 'monospace'));
  const processing = ['CODING', 'AUTOCOMPLETE', 'COMPILING', 'TESTING', 'PREVIEW_LOADING'].includes(s.phase);
  text(c, `${processing && !s.reducedMotion ? spinner[Math.floor(s.elapsed * 5) % 4] : '●'} ${s.phase.toLowerCase().replaceAll('_', ' ')}`, 27, height - 51, 15, s.project.accent, 'monospace');
  progress(c, 27, height - 30, width - 54, s.buildProgress, s.project.accent);
  transitionOverlay(c, s.localTime, s.transition, width, height);
}
