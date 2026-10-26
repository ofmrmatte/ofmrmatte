import { createContext } from 'react';
import { sampleDevelopmentTime } from './DevelopmentTimeline';

export class AnimationCoordinator {
  elapsed = 0;
  readonly state = sampleDevelopmentTime(0);
  readonly weatherUniforms = { uTime: { value: 0 }, uWet: { value: .78 } };
  advance(delta: number, scroll: number, reduced: boolean, hidden: boolean) {
    if (!hidden && !reduced && Number.isFinite(delta)) this.elapsed += Math.min(.25, Math.max(0, delta));
    sampleDevelopmentTime(this.elapsed, scroll, reduced, this.state);
    this.weatherUniforms.uTime.value = this.elapsed;
    return this.state;
  }
}
export const AnimationContext = createContext<AnimationCoordinator | null>(null);
