import * as THREE from 'three';
import type { CSSProperties } from 'react';

export type ViewportProfile = 'desktop' | 'tablet' | 'mobile';

export interface CameraWaypoint {
  id: string;
  label: string;
  scrollRange: [number, number];
  position: THREE.Vector3Tuple;
  target: THREE.Vector3Tuple;
  fov: number;
}

export interface ScrollStateRef {
  progress: number;
  velocity: number;
  activeSceneIndex: number;
  reducedMotion: boolean;
}

export interface OfficeExperienceProps {
  debugHUD?: boolean;
  externalScrollProgress?: number;
  /** Decorative, bounded rendering for a portfolio hero or page background. */
  mode?: 'experience' | 'background';
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Darkness of the foreground readability layer, between 0 and 1. */
  overlayOpacity?: number;
}

declare global {
  interface Window {
    __officeDiagnostics?: {
      profile: ViewportProfile; progress: number; activeScene: number; reducedMotion: boolean; plantLoaded: boolean;
      camera: number[]; fov: number; measuredFPS: number;
      memory: { geometries: number; textures: number }; screenVersions: number[];
      animation: ReturnType<import('./screens/ScreenTextureEngine').ScreenTextureEngine['diagnostics']>;
      weather: { time: number; rain?: Record<string, unknown> }; dpr: number;
      bounds: { overlaps: string[]; objects: { name: string; min: number[]; max: number[] }[] };
      mode?: 'experience' | 'background'; targetFPS?: number;
    };
  }
}
