export interface LocalClockReading { time: string; date: string; timeZone: string; timestamp: number }
// Always re-read Date and Intl. Never accumulate seconds or hard-code a zone.
export function readLocalClock(now = new Date()): LocalClockReading {
  const format = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return { time: format.format(now), date: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(now), timeZone: format.resolvedOptions().timeZone, timestamp: now.getTime() };
}
export class RealTimeClock {
  current = readLocalClock();
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor(private onChange: () => void) {
    window.addEventListener('focus', this.sync);
    document.addEventListener('visibilitychange', this.sync);
    this.arm();
  }
  sync = () => {
    if (this.disposed) return;
    this.current = readLocalClock(); this.onChange();
    clearTimeout(this.timer); this.arm();
  };
  private arm() {
    // Minute boundary + a low-frequency check handles OS clock/time-zone changes.
    this.timer = setTimeout(this.sync, Math.min(30000, 60000 - Date.now() % 60000 + 20));
  }
  dispose() {
    this.disposed = true; clearTimeout(this.timer);
    window.removeEventListener('focus', this.sync); document.removeEventListener('visibilitychange', this.sync);
  }
}
