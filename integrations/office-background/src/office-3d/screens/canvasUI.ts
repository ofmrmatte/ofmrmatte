export type Ctx = CanvasRenderingContext2D;
export const UI = { bg: '#0c111c', panel: '#141d2b', line: '#253347', text: '#e2e9f4', muted: '#8192aa', green: '#70d9b2' };
export const ease = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
export function text(c: Ctx, value: string, x: number, y: number, size = 16, color = UI.text, font = 'sans-serif') {
  const readableSize = size <= 18 ? size * 1.2 : size;
  c.font = `${readableSize}px ${font}`; c.fillStyle = color; c.fillText(value, x, y);
}
export function panel(c: Ctx, x: number, y: number, w: number, h: number, fill = UI.panel, radius = 10) {
  c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
}
export function line(c: Ctx, x: number, y: number, x2: number, y2: number, color = UI.line, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
}
export function progress(c: Ctx, x: number, y: number, w: number, amount: number, color: string) {
  panel(c, x, y, w, 5, '#263449', 2); if (amount > 0) panel(c, x, y, Math.max(3, w * Math.min(1, amount)), 5, color, 2);
}
export function pill(c: Ctx, label: string, x: number, y: number, color = UI.green, width = 82) {
  panel(c, x, y - 18, width, 27, '#203331', 5); text(c, label, x + 10, y, 12, color);
}
export function reveal(c: Ctx, amount: number, x: number, y: number, w: number, h: number, draw: () => void) {
  const a = ease(amount); if (!a) return;
  c.save(); c.globalAlpha *= a; c.beginPath(); c.rect(x, y + (1 - a) * 12, w, h); c.clip();
  c.translate(0, (1 - a) * 12); draw(); c.restore();
}
export function transitionOverlay(c: Ctx, localTime: number, transition: number, w: number, h: number) {
  const alpha = Math.max(1 - ease(localTime / 1.1), ease(transition));
  if (alpha > 0) { c.fillStyle = `rgba(10,17,29,${alpha})`; c.fillRect(0, 0, w, h); }
}
