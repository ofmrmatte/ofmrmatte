/** A capped render clock. Each new instance resumes from the last rendered time. */
export class FrameBudget {
  private previous: number | undefined;
  private remainder = 0;
  private pending = 0;
  constructor(private elapsed = 0) {}
  tick(now: number, fps: number): number | null {
    if (this.previous === undefined) { this.previous = now; return this.elapsed; }
    const delta = Math.max(0, Math.min(100, now - this.previous));
    this.previous = now; this.remainder += delta; this.pending += delta;
    const interval = 1000 / fps;
    if (this.remainder + .001 < interval) return null;
    this.remainder = Math.max(0, this.remainder - interval * Math.floor((this.remainder + .001) / interval));
    this.elapsed += this.pending / 1000; this.pending = 0;
    return this.elapsed;
  }
}
