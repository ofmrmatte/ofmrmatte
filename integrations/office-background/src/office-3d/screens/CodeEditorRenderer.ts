import { DemoFile, ScreenAnimationState } from '../animations/DevelopmentTimeline';
import { Ctx, UI, panel, text, line, ease, transitionOverlay } from './canvasUI';
import { terminalLines } from './TerminalRenderer';
const tracks = new WeakMap<DemoFile, Float32Array>();
const tokenCache = new WeakMap<DemoFile, { value: string; color: string }[][]>();
export function typedCharacters(file: DemoFile, amount: number) {
  if (amount >= 1) return file.code.length;
  let track = tracks.get(file);
  if (!track) {
    track = new Float32Array(file.code.length); let total = 0;
    for (let i = 0; i < track.length; i++) { total += .45 + (i * 17 % 13) / 13 + (file.code[i] === '\n' ? 7 : /[;{},]/.test(file.code[i]) ? 2 : 0); track[i] = total; }
    for (let i = 0; i < track.length; i++) track[i] /= total;
    tracks.set(file, track);
  }
  let low = 0, high = track.length;
  while (low < high) { const mid = (low + high) >>> 1; if (track[mid] < amount) low = mid + 1; else high = mid; }
  return low;
}
function tokens(file: DemoFile) {
  let cached = tokenCache.get(file); if (cached) return cached;
  cached = file.code.split('\n').map(row => (row.match(/("[^"\n]*"|'[^'\n]*'|`[^`]*`|\/\/.*$|\b(?:import|from|export|const|let|return|async|await|function|type|if|throw|new|try|catch|default|as)\b|\b(?:string|number|boolean|Promise|Date|Buffer)\b|\b\d+\b|[\w$]+|\s+|.)/g) ?? []).map(value => ({ value, color: /^['"`]/.test(value) ? '#a9cf98' : /^(import|from|export|const|let|return|async|await|function|type|if|throw|new|try|catch|default|as)$/.test(value) ? '#c3a5ee' : /^(string|number|boolean|Promise|Date|Buffer)$/.test(value) ? '#e5c18b' : /^\d/.test(value) ? '#d49c7d' : value.startsWith('//') ? '#68817d' : '#c3cedf' })));
  tokenCache.set(file, cached); return cached;
}
export function editorCursor(s: ScreenAnimationState) {
  const index = Math.min(2, Math.floor(s.codeProgress * 3));
  const file = s.project.files[index], part = s.codeProgress >= 1 ? 1 : s.codeProgress * 3 % 1;
  const anchor = typedCharacters(file, .56);
  const count = part < .5 ? typedCharacters(file, .12 + part * .88)
    : part < .56 ? anchor - Math.floor(ease((part - .5) / .06) * 10)
    : part < .64 ? anchor - 10 + Math.floor(ease((part - .56) / .08) * 10)
    : typedCharacters(file, .56 + (part - .64) / .36 * .44);
  return { file, index, count };
}
export function drawCodeEditor(c: Ctx, s: ScreenAnimationState) {
  const { file, index, count } = editorCursor(s);
  c.fillStyle = UI.bg; c.fillRect(0, 0, 1280, 720);
  panel(c, 0, 0, 1280, 35, '#182130', 0);
  text(c, '●  ●  ●', 16, 23, 13, '#6f819a'); text(c, `${s.project.name} — workspace`, 465, 23, 14, '#a6b6cc');
  panel(c, 0, 35, 205, 658, '#111a27', 0);
  text(c, 'EXPLORER', 22, 70, 13, UI.muted); text(c, '⌄  workspace', 18, 105, 15);
  s.project.files.forEach((f, i) => { if (i === index) panel(c, 9, 122 + i * 38, 187, 32, '#23334a', 4); text(c, `${f.name.endsWith('tsx') ? 'TSX' : 'TS'}  ${f.name}`, 18, 144 + i * 38, 12, i === index ? s.project.accent : UI.muted); });
  ['components/', 'server/', 'tests/', 'package.json', 'tsconfig.json'].forEach((f, i) => text(c, `› ${f}`, 24, 285 + i * 32, 13, UI.muted));
  s.project.files.forEach((f, i) => { const x = 205 + i * 288; panel(c, x, 35, 287, 38, i === index ? UI.bg : '#141e2c', 0); text(c, f.name, x + 17, 60, 14, i === index ? UI.text : UI.muted); if (i === index) line(c, x, 36, x + 287, 36, s.project.accent, 2); });
  text(c, `src  /  ${file.name}`, 229, 94, 13, UI.muted);
  const visible = file.code.slice(0, count), currentRow = visible.split('\n').length - 1;
  const cursorColumn = visible.length - visible.lastIndexOf('\n') - 1;
  const horizontalOffset = Math.max(0, cursorColumn * 13.2 - 900);
  const first = Math.max(0, currentRow - 10), rows = tokens(file);
  let consumed = 0, cursorX = 282, cursorY = 127;
  c.save(); c.beginPath(); c.rect(205, 108, 1075, 397); c.clip();
  c.font = '22px monospace';
  rows.forEach((row, rowIndex) => {
    const length = row.reduce((sum, t) => sum + t.value.length, 0), remaining = count - consumed;
    const y = 130 + (rowIndex - first) * 32;
    if (remaining >= 0 && rowIndex >= first && y < 505) {
      if (rowIndex === currentRow) panel(c, 209, y - 23, 1067, 32, '#172233', 0);
      text(c, String(rowIndex + 1).padStart(2, ' '), 229, y, 14, '#5c6c83', 'monospace');
      c.save(); c.beginPath(); c.rect(276, 108, 1004, 397); c.clip();
      c.font = '22px monospace'; let x = 282 - horizontalOffset, used = 0;
      for (const token of row) {
        const part = token.value.slice(0, Math.max(0, remaining - used));
        c.fillStyle = token.color; c.fillText(part, x, y); x += c.measureText(part).width; used += token.value.length;
      }
      if (rowIndex === currentRow) { cursorX = x; cursorY = y; }
      c.restore();
    }
    consumed += length + 1;
  });
  if (s.reducedMotion || Math.floor(s.elapsed * 2) % 2 === 0) { c.fillStyle = s.project.accent; c.fillRect(cursorX + 1, cursorY - 22, 2, 27); }
  if (s.phase === 'AUTOCOMPLETE') {
    const suggestions = { dashboard: ['pool.query<Metric>(…)', 'pool.connect()'], admin: ['pool.query(…)', 'pool.connect()'], automation: ['job.updateProgress(…)', 'job.updateData(…)'], scheduling: ['db.transaction(…)', 'db.bookings.create(…)'] }[s.project.id];
    panel(c, Math.min(910, cursorX), Math.min(365, cursorY + 8), 290, 105, '#25354a', 5);
    text(c, `▸ ${suggestions[0]}`, Math.min(922, cursorX + 12), Math.min(393, cursorY + 36), 16, '#b9daff', 'monospace');
    text(c, `  ${suggestions[1]}`, Math.min(922, cursorX + 12), Math.min(422, cursorY + 64), 16, UI.muted, 'monospace');
    text(c, '↵ accept suggestion', Math.min(922, cursorX + 12), Math.min(448, cursorY + 90), 12, UI.muted);
    c.fillStyle = '#78b7ff33'; c.fillRect(282, cursorY - 19, Math.min(680, cursorX - 282), 25);
  }
  c.restore();
  panel(c, 205, 511, 1075, 180, '#0a101b', 0); line(c, 205, 511, 1280, 511);
  text(c, 'TERMINAL   OUTPUT   PROBLEMS', 228, 537, 12, UI.muted);
  terminalLines(s).slice(-4).forEach(([, value, color], i) => text(c, value, 230, 565 + i * 28, 14, color, 'monospace'));
  panel(c, 0, 693, 1280, 27, '#1a2c40', 0);
  text(c, `main  ✓   ${file.language}`, 18, 712, 12, '#b1c7de');
  text(c, `Ln ${currentRow + 1}:${cursorColumn + 1}   UTF-8   DEMO`, 918, 712, 12, '#b1c7de');
  transitionOverlay(c, s.localTime, s.transition, 1280, 720);
}
