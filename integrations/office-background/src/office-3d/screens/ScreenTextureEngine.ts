import * as THREE from 'three';
import { AnimationCoordinator } from '../animations/AnimationCoordinator';
import { ViewportProfile } from '../types';
import { getQualityProfile } from '../config/qualityProfiles';
import { drawCodeEditor, editorCursor } from './CodeEditorRenderer';
import { drawApplicationPreview } from './ApplicationPreviews';
import { drawTerminal } from './TerminalRenderer';
import { drawPhone } from './PhoneRenderer';
import { RealTimeClock } from './RealTimeClock';

export class ScreenTextureEngine {
  readonly coordinator = new AnimationCoordinator();
  readonly ideTexture: THREE.CanvasTexture;
  readonly previewTexture: THREE.CanvasTexture;
  readonly terminalTexture: THREE.CanvasTexture;
  readonly phoneTexture: THREE.CanvasTexture;
  readonly clock: RealTimeClock;
  private screenBudget = 0;
  private phoneBudget = 0;
  private phoneKey = '';
  private ideKey = '';
  private previewKey = '';
  private terminalKey = '';
  private disposed = false;
  private phoneDirty = true;
  private draws = { ide: 0, preview: 0, terminal: 0, phone: 0 };
  constructor(private readonly background = false) {
    this.ideTexture = this.texture(1280, 720, 1.5);
    this.previewTexture = this.texture(1280, 720, 1.5);
    this.terminalTexture = this.texture(1024, 640, 1.5);
    this.phoneTexture = this.texture(512, 1024);
    this.clock = new RealTimeClock(() => {
      this.phoneDirty = true;
      if (!document.hidden && !this.disposed) this.renderPhone();
    });
    this.renderScreens(); this.renderPhone();
  }
  private texture(width: number, height: number, scale = 1) {
    const canvas = document.createElement('canvas'); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    canvas.getContext('2d')!.setTransform(scale, 0, 0, scale, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; texture.anisotropy = 16;
    return texture;
  }
  private context(texture: THREE.CanvasTexture) { return (texture.image as HTMLCanvasElement).getContext('2d')!; }
  private renderScreens() {
    const s = this.coordinator.state;
    const cursor = editorCursor(s), prefix = `${s.cycle}/${s.phase}/${s.reducedMotion}`;
    const ideKey = `${prefix}/${cursor.index}/${cursor.count}/${s.reducedMotion ? 0 : Math.floor(s.elapsed * 2)}/${Math.floor(s.localTime)}`;
    const previewKey = `${prefix}/${Math.floor(s.buildProgress * 25)}/${(s.localTime < 1.1 || s.localTime >= 29) && !s.reducedMotion ? Math.floor(s.elapsed * 15) : 0}`;
    const terminalKey = `${prefix}/${s.reducedMotion ? 0 : Math.floor(s.elapsed * 5)}`;
    if (ideKey !== this.ideKey) { drawCodeEditor(this.context(this.ideTexture), s); this.ideTexture.needsUpdate = true; this.draws.ide++; this.ideKey = ideKey; }
    if (previewKey !== this.previewKey) { drawApplicationPreview(this.context(this.previewTexture), s); this.previewTexture.needsUpdate = true; this.draws.preview++; this.previewKey = previewKey; }
    if (terminalKey !== this.terminalKey) { drawTerminal(this.context(this.terminalTexture), s); this.terminalTexture.needsUpdate = true; this.draws.terminal++; this.terminalKey = terminalKey; }
  }
  private renderPhone() {
    drawPhone(this.context(this.phoneTexture), this.clock.current, this.coordinator.state);
    this.phoneTexture.needsUpdate = true; this.phoneDirty = false; this.draws.phone++;
  }
  update(delta: number, scroll: number, profile: ViewportProfile, reduced: boolean, hidden = document.hidden) {
    if (this.disposed) return;
    const s = this.coordinator.advance(delta * (this.background ? .8 : 1), scroll, reduced, hidden);
    if (hidden) return;
    this.screenBudget += Math.min(.25, Math.max(0, delta));
    this.phoneBudget += Math.min(.25, Math.max(0, delta));
    if (this.screenBudget >= 1 / (reduced ? 1 : getQualityProfile(profile, this.background).screenFPS)) {
      this.screenBudget = 0; this.renderScreens();
    }
    const notification = s.localTime >= 25 && s.localTime < 42;
    const key = `${s.cycle}/${s.phase}/${Math.floor(s.buildProgress * 20)}/${notification ? Math.floor(s.localTime * 6) : 0}/${reduced}`;
    if (this.phoneDirty || (key !== this.phoneKey && this.phoneBudget >= 1 / 6)) {
      this.phoneKey = key; this.phoneBudget = 0; this.renderPhone();
    }
  }
  diagnostics() {
    const s = this.coordinator.state, cursor = editorCursor(s);
    return { elapsed: s.elapsed, project: s.project.id, cycle: s.cycle, phase: s.phase, localTime: s.localTime,
      file: cursor.file.name, typedCharacters: cursor.count, codeProgress: s.codeProgress,
      buildProgress: s.buildProgress, previewProgress: s.previewProgress, interactiveTime: s.interactiveTime,
      clock: { ...this.clock.current }, draws: { ...this.draws }, disposed: this.disposed };
  }
  dispose() {
    this.disposed = true; this.clock.dispose();
    for (const texture of [this.ideTexture, this.previewTexture, this.terminalTexture, this.phoneTexture]) {
      texture.dispose(); const canvas = texture.image as HTMLCanvasElement; canvas.width = canvas.height = 1;
    }
  }
}
