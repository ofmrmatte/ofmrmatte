import { ScreenAnimationState } from '../animations/DevelopmentTimeline';
import { LocalClockReading } from './RealTimeClock';
import { Ctx, text, panel, progress, ease } from './canvasUI';
export function drawPhone(c: Ctx, clock: LocalClockReading, s: ScreenAnimationState) {
  const gradient = c.createLinearGradient(0, 0, 512, 1024);
  gradient.addColorStop(0, '#132a40'); gradient.addColorStop(.5, '#242546'); gradient.addColorStop(1, '#090e18');
  c.fillStyle = gradient; c.fillRect(0, 0, 512, 1024);
  panel(c, 181, 24, 150, 36, '#020409', 19);
  text(c, clock.time, 35, 48, 19, '#dce6f5');
  for (let i = 0; i < 4; i++) panel(c, 395 + i * 8, 47 - i * 4, 5, 7 + i * 4, '#d5dfed', 1);
  c.strokeStyle = '#b5c5d9'; c.lineWidth = 2; c.strokeRect(446, 31, 33, 15); panel(c, 449, 34, 24, 9, '#b7e0ca', 2); panel(c, 481, 35, 3, 7, '#dce6f5', 1);
  c.textAlign = 'center';
  text(c, clock.date.toLocaleUpperCase(), 256, 132, 20, '#c2cfe0');
  text(c, clock.time, 256, 238, 107, '#f0f4fc');
  c.textAlign = 'left';
  panel(c, 36, 290, 440, 136, '#ffffff13', 23);
  text(c, 'WORKSPACE / DEMO', 61, 326, 17, '#a4c8f1', 'monospace');
  text(c, s.project.name, 61, 359, 20, '#e3eaf6');
  text(c, s.phase.toLowerCase().replaceAll('_', ' '), 61, 389, 16, '#a3b6ce');
  progress(c, 61, 405, 386, s.buildProgress, s.project.accent);
  const age = s.localTime - 25, show = age >= 0 && age < 17;
  if (show || s.reducedMotion) {
    const enter = s.reducedMotion ? 1 : ease(age / 1.2) * (1 - ease((age - 15) / 2));
    c.save(); c.globalAlpha = enter; c.translate(0, (1 - enter) * -19);
    const messages = ['Build completed', 'Deployment preview ready', 'Automation executed', 'Database synchronized'];
    panel(c, 36, 453, 440, age > 5 ? 143 : 110, '#ffffff1b', 23);
    text(c, 'DEVELOPMENT · SIMULATED NOTICE', 60, 487, 14, '#b1c7de');
    text(c, messages[s.projectIndex], 60, 523, 22, '#f1f4fb');
    if (age > 5 || s.reducedMotion) text(c, 'A visual demo. No service was contacted.', 60, 562, 14, '#a5bad2');
    c.restore();
  }
  text(c, 'VISUAL DEMONSTRATION', 60, 687, 13, '#8295b0');
  text(c, 'Clock follows your device.', 60, 713, 15, '#aebed4');
  panel(c, 186, 990, 140, 7, '#e9edf5', 4);
}
