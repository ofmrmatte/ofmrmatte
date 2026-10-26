import { ScreenAnimationState } from '../animations/DevelopmentTimeline';
import { Ctx, UI, text, panel, line, pill, reveal, ease, progress, transitionOverlay } from './canvasUI';

const monthly = [.29, .37, .34, .52, .46, .6, .56, .73, .64, .82, .76, .94];
const halfYear = monthly.slice(6);
function graph(c: Ctx, x: number, y: number, width: number, height: number, amount: number, accent: string, area = true, values = monthly) {
  for (let i = 0; i < 4; i++) line(c, x, y + i * height / 3, x + width, y + i * height / 3, '#26364a');
  const end = ease(amount) * (values.length - 1), intervals = values.length - 1;
  const points: [number, number][] = [];
  for (let i = 0; i <= Math.floor(end); i++) points.push([x + i / intervals * width, y + height * (1 - values[i])]);
  if (end % 1 && Math.ceil(end) < values.length) { const i = Math.floor(end), v = values[i] + (values[i + 1] - values[i]) * (end % 1); points.push([x + end / intervals * width, y + height * (1 - v)]); }
  if (points.length < 2) return;
  if (area) { const fill = c.createLinearGradient(0, y, 0, y + height); fill.addColorStop(0, `${accent}4d`); fill.addColorStop(1, `${accent}00`); c.fillStyle = fill; c.beginPath(); c.moveTo(x, y + height); points.forEach(([px, py]) => c.lineTo(px, py)); c.lineTo(points.at(-1)![0], y + height); c.closePath(); c.fill(); }
  c.strokeStyle = accent; c.lineWidth = 3; c.beginPath(); points.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
}
function heading(c: Ctx, title: string, subtitle: string, s: ScreenAnimationState) {
  text(c, title, 233, 124, 28); text(c, subtitle, 234, 149, 13, UI.muted);
  panel(c, 1072, 94, 170, 34, '#223149', 6); text(c, s.project.id === 'admin' ? '+ Invite person' : s.project.id === 'scheduling' ? '+ New booking' : 'Export report ↗', 1088, 116, 13, s.project.accent);
}
function dashboard(c: Ctx, s: ScreenAnimationState) {
  const p = s.previewProgress;
  const filtered = s.interactiveTime % 22 >= 12;
  heading(c, 'Business overview', 'A clear view of your business. All figures are synthetic.', s);
  panel(c, 879, 94, 177, 34, '#243349', 5); text(c, filtered ? 'Last 6 months  ⌄' : 'Last 12 months  ⌄', 891, 116, 12, s.project.accent);
  [['Total revenue', 128420, '+12.8%', '$'], ['Active customers', 2840, '+8.2%', ''], ['Conversion rate', 4.8, '+0.6%', '%']].forEach(([label, value, change, unit], i) => {
    reveal(c, p * 3 - i * .28, 232 + i * 342, 177, 322, 120, () => {
      const x = 232 + i * 342; panel(c, x, 177, 322, 120); text(c, String(label), x + 21, 206, 14, UI.muted);
      const n = Number(value) * ease(Math.max(0, p * 1.2 - i * .1));
      text(c, `${unit === '$' ? '$' : ''}${n.toLocaleString('en-US', { maximumFractionDigits: unit === '%' ? 1 : 0 })}${unit === '%' ? '%' : ''}`, x + 20, 252, 33);
      text(c, `${change}  vs previous period`, x + 20, 277, 12, UI.green);
    });
  });
  reveal(c, p * 2 - .3, 232, 318, 662, 260, () => {
    panel(c, 232, 318, 662, 260); text(c, 'Revenue performance', 254, 350, 17); text(c, 'JAN — DEC   /   DEMO YEAR', 640, 349, 11, UI.muted);
    graph(c, 274, 377, 574, 149, p, s.project.accent, true, filtered ? halfYear : monthly);
    (filtered ? ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']).forEach((v, i) => text(c, v, 274 + i * 109, 551, 11, UI.muted));
  });
  reveal(c, p * 2 - .5, 914, 318, 346, 260, () => {
    panel(c, 914, 318, 346, 260); text(c, 'Acquisition', 936, 350, 17);
    ['Organic', 'Direct', 'Referral', 'Partners'].forEach((label, i) => { const y = 382 + i * 45; text(c, label, 936, y, 12, UI.muted); panel(c, 936, y + 10, Math.max(2, (230 - i * 36) * ease(p)), 12, i % 2 ? '#a0a9e8' : s.project.accent, 3); });
  });
  reveal(c, p * 2 - .85, 232, 597, 1028, 81, () => {
    panel(c, 232, 597, 1028, 81); text(c, 'Recent activity', 253, 624, 14);
    text(c, 'Demo invoice #1048     Studio subscription     $480.00', 253, 653, 13, UI.muted);
    pill(c, 'PAID', 1107, 652, UI.green, 110);
    graph(c, 798, 615, 255, 42, (s.interactiveTime % 10) / 10, UI.green, false);
  });
}

const users = [['AR', 'Alex Rivera', 'alex@example.test', 'Admin', 'Active'], ['SC', 'Sam Chen', 'sam@example.test', 'Editor', 'Active'], ['JV', 'Jordan Vale', 'jordan@example.test', 'Viewer', 'Invited'], ['MK', 'Morgan Kim', 'morgan@example.test', 'Editor', 'Active'], ['TL', 'Taylor Lane', 'taylor@example.test', 'Viewer', 'Invited'], ['RP', 'Robin Park', 'robin@example.test', 'Admin', 'Active']];
function admin(c: Ctx, s: ScreenAnimationState) {
  const t = s.interactiveTime % 20, activeOnly = t >= 7 && t < 15, reports = t >= 15;
  heading(c, reports ? 'Access reports' : 'People & access', 'Roles, permissions and a little more clarity. Fictional demo records.', s);
  panel(c, 233, 176, 1026, 80); text(c, '24', 256, 215, 26); text(c, 'TEAM MEMBERS', 305, 213, 12, UI.muted);
  text(c, '18', 553, 215, 26); text(c, 'ACTIVE SESSIONS', 601, 213, 12, UI.muted); pill(c, 'ALL SYSTEMS READY', 1021, 216, UI.green, 205);
  reveal(c, s.previewProgress * 1.8 - .2, 233, 276, 1026, 407, () => {
    panel(c, 233, 276, 1026, 407); panel(c, 256, 297, 410, 35, '#1b293b', 5); text(c, '⌕  Search people…', 271, 321, 14, UI.muted);
    panel(c, 1014, 297, 214, 35, '#26334b', 5); text(c, `${activeOnly ? 'Active people' : 'All statuses'}    ⌄`, 1030, 320, 13, s.project.accent);
    ['NAME', 'EMAIL', 'ROLE', 'STATUS'].forEach((v, i) => text(c, v, [275, 521, 891, 1080][i], 367, 11, UI.muted));
    line(c, 255, 383, 1232, 383);
    const rows = activeOnly ? users.filter(u => u[4] === 'Active') : users;
    rows.forEach((u, i) => { const y = 413 + i * 45; const alpha = ease(s.previewProgress * 3 - i * .18); c.save(); c.globalAlpha *= alpha;
      panel(c, 264, y - 17, 27, 27, '#34405b', 13); text(c, u[0], 268, y + 1, 10); text(c, u[1], 304, y + 1, 14); text(c, u[2], 521, y + 1, 13, UI.muted); text(c, reports ? (i % 2 ? 'Read only' : 'Full access') : u[3], 891, y + 1, 13, UI.muted); pill(c, u[4], 1070, y + 1, u[4] === 'Active' ? UI.green : '#efc68e', 105); line(c, 256, y + 17, 1231, y + 17); c.restore();
    });
    if (t >= 4 && t < 7) { panel(c, 1014, 337, 214, 105, '#34415a', 6); ['All statuses', 'Active people', 'Pending invitations'].forEach((v, i) => text(c, `${i === 1 ? '›' : ' '} ${v}`, 1030, 360 + i * 30, 12, i === 1 ? s.project.accent : UI.text)); }
  });
}

const nodes = [{ x: 320, y: 270, label: 'Webhook', sub: 'RECEIVED' }, { x: 585, y: 270, label: 'Normalize', sub: 'PROCESSING' }, { x: 850, y: 270, label: 'Validate', sub: 'VALIDATING' }, { x: 1115, y: 270, label: 'CRM sync', sub: 'INTEGRATING' }, { x: 1115, y: 477, label: 'Database', sub: 'PERSISTING' }, { x: 850, y: 477, label: 'Notification', sub: 'NOTIFYING' }, { x: 585, y: 477, label: 'Complete', sub: 'COMPLETED' }];
function automation(c: Ctx, s: ScreenAnimationState) {
  heading(c, 'Order synchronization', 'Webhook → validation → integration. A deterministic workflow demonstration.', s);
  panel(c, 233, 178, 1026, 441); const t = s.interactiveTime % 12, active = Math.min(7, Math.floor(t / 1.3));
  c.save(); c.globalAlpha *= ease(s.previewProgress);
  for (let x = 250; x < 1250; x += 22) for (let y = 195; y < 605; y += 22) { c.fillStyle = '#29374a'; c.fillRect(x, y, 1, 1); }
  nodes.slice(1).forEach((b, i) => {
    const a = nodes[i]; line(c, a.x, a.y, b.x, b.y, i < active ? '#448b7e' : '#364354', 2);
    if (i <= active && !s.reducedMotion) for (let j = 0; j < 3; j++) { const u = (s.elapsed * .34 + j / 3) % 1; c.fillStyle = i < active ? '#6adcb7' : '#d3f4e9'; c.beginPath(); c.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 3, 0, Math.PI * 2); c.fill(); }
  });
  nodes.forEach((n, i) => { const done = i < active, running = i === active; const alpha = ease(s.previewProgress * 2 - i * .12); c.save(); c.globalAlpha *= alpha;
    panel(c, n.x - 82, n.y - 42, 164, 84, running ? '#27483f' : '#1b2939', 9);
    c.strokeStyle = done || running ? s.project.accent : '#35455a'; c.lineWidth = running ? 2 : 1; c.strokeRect(n.x - 82, n.y - 42, 164, 84);
    text(c, `${done ? '✓' : String(i + 1).padStart(2, '0')}  ${n.label}`, n.x - 66, n.y - 5, 16, done ? UI.green : UI.text);
    text(c, done ? 'COMPLETE' : running ? n.sub : 'WAITING', n.x - 65, n.y + 21, 10, running ? s.project.accent : UI.muted); c.restore();
  }); c.restore();
  pill(c, active >= 7 ? 'RUN COMPLETED' : 'WORKFLOW RUNNING', 254, 659, UI.green, 190);
  text(c, `DEMO EVENT / ORDER-${String(1048 + Math.floor(s.interactiveTime / 12)).padStart(4, '0')}`, 697, 658, 13, UI.muted, 'monospace');
}

function scheduling(c: Ctx, s: ScreenAnimationState) {
  heading(c, 'Your schedule', 'A calmer calendar. Every appointment below is a fictional demo.', s);
  const t = s.interactiveTime % 18, selected = t > 3, confirmed = t > 8;
  reveal(c, s.previewProgress * 1.5, 233, 178, 698, 500, () => {
    panel(c, 233, 178, 698, 500); text(c, 'NOVEMBER 2026', 257, 211, 18); text(c, '‹    ›', 839, 211, 18, UI.muted);
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((v, i) => text(c, v, 277 + i * 93, 252, 12, UI.muted));
    for (let cell = 0; cell < 42; cell++) {
      const day = cell - 5; if (day < 1 || day > 30) continue;
      const col = cell % 7, row = Math.floor(cell / 7), x = 250 + col * 94, y = 270 + row * 61;
      panel(c, x, y, 88, 55, day === 12 && selected ? '#524333' : '#1a2636', 5);
      text(c, String(day), x + 10, y + 21, 14, day === 12 && selected ? s.project.accent : UI.text);
      if ([3, 7, 12, 17, 21, 26].includes(day)) { panel(c, x + 9, y + 33, day === 12 && confirmed ? 68 : 43, 5, day === 12 ? s.project.accent : '#4c8b83', 2); }
    }
  });
  reveal(c, s.previewProgress * 2 - .5, 950, 178, 310, 500, () => {
    panel(c, 950, 178, 310, 500); text(c, selected ? 'Thursday, Nov 12' : 'Choose a day', 973, 213, 18); text(c, 'Consultation · 30 minutes', 973, 242, 13, UI.muted);
    ['09:00', '10:30', '11:00', '14:00', '15:30', '16:00'].forEach((slot, i) => { const x = 973 + i % 2 * 132, y = 276 + Math.floor(i / 2) * 57; const active = selected && i === 3; panel(c, x, y, 116, 41, active ? '#745638' : '#223147', 5); text(c, slot, x + 31, y + 27, 15, active ? '#ffe0b5' : UI.text); });
    text(c, 'CLIENT', 974, 475, 11, UI.muted); text(c, 'Alex / demo customer', 974, 503, 15);
    panel(c, 974, 536, 261, 45, confirmed ? '#244c40' : selected ? '#9c744c' : '#263448', 6); text(c, confirmed ? '✓ Appointment confirmed' : 'Confirm appointment', 989, 565, 14, '#f0e3d2');
    if (confirmed) { text(c, 'Calendar updated', 975, 615, 14, UI.green); text(c, 'Confirmation is simulated.', 975, 639, 12, UI.muted); }
  });
}

export function drawApplicationPreview(c: Ctx, s: ScreenAnimationState) {
  c.fillStyle = '#0c1421'; c.fillRect(0, 0, 1280, 720);
  panel(c, 0, 0, 1280, 38, '#202a38', 0); panel(c, 14, 7, 259, 31, '#111b28', 6); text(c, `${s.project.name}    ×`, 30, 28, 13);
  panel(c, 0, 38, 1280, 30, '#172333', 0); text(c, '‹   ›   ↻', 16, 59, 16, UI.muted); panel(c, 133, 42, 998, 21, '#0b1524', 5); text(c, `⌑  ${s.project.host}`, 153, 57, 12, '#abbcd0');
  panel(c, 0, 68, 208, 630, '#101c2b', 0); text(c, s.project.name.split(' / ')[0], 24, 111, 21, s.project.accent);
  const items = s.project.id === 'admin' ? ['Overview', 'People & access', 'Roles', 'Reports', 'Settings'] : s.project.id === 'automation' ? ['Overview', 'Workflows', 'Connections', 'Run history', 'Settings'] : s.project.id === 'scheduling' ? ['Overview', 'Calendar', 'Customers', 'Services', 'Settings'] : ['Overview', 'Analytics', 'Customers', 'Reports', 'Settings'];
  items.forEach((item, i) => { const selected = s.project.id === 'dashboard' ? 0 : s.project.id === 'admin' && s.interactiveTime % 20 >= 15 ? 3 : 1; const active = i === selected; if (active) panel(c, 13, 143 + i * 45, 182, 35, '#23354d', 5); text(c, `${['◈', '▦', '⊙', '≡', '⚙'][i]}  ${item}`, 27, 167 + i * 45, 14, active ? '#e0e9f6' : UI.muted); });
  text(c, 'LOCAL DEMO', 25, 663, 11, UI.muted);
  if (s.localTime < 29 && !s.reducedMotion) {
    heading(c, s.project.name.split(' / ')[1], 'Waiting for the matching development build…', s);
    for (let i = 0; i < 3; i++) { panel(c, 233 + i * 342, 180, 322, 120); panel(c, 254 + i * 342, 207, 125, 9, '#26374b', 3); panel(c, 254 + i * 342, 241, 207, 21, '#203047', 4); }
    panel(c, 233, 323, 1027, 344); text(c, s.phase === 'PREVIEW_LOADING' ? 'Loading application modules…' : 'Your preview will appear here.', 523, 469, 18, UI.muted);
    progress(c, 475, 497, 380, s.phase === 'PREVIEW_LOADING' ? (s.localTime - 27) / 2 : s.buildProgress * .85, s.project.accent);
  } else {
    ({ dashboard, admin, automation, scheduling })[s.project.id](c, s);
  }
  panel(c, 208, 697, 1072, 23, '#172333', 0); text(c, 'INTERACTIVE DEMONSTRATION · SYNTHETIC DATA · NO NETWORK REQUESTS', 234, 713, 10, UI.muted);
  transitionOverlay(c, s.localTime, s.transition, 1280, 720);
}
