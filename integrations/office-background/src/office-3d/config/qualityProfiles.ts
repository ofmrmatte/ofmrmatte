import { createContext, useContext } from 'react';
import { ViewportProfile } from '../types';
export const BackgroundContext = createContext(false);
export const QUALITY_PROFILES = {
  desktop: { dpr: [1, 1.6], shadowMap: 2048, environment: 128, ao: 'medium', post: true, msaa: 2, leafCount: 24, screenFPS: 15, rainCount: 1800, cloudLayers: 6 },
  tablet: { dpr: [1, 1.35], shadowMap: 1024, environment: 128, ao: 'low', post: true, msaa: 0, leafCount: 18, screenFPS: 15, rainCount: 1000, cloudLayers: 5 },
  mobile: { dpr: [1, 1.15], shadowMap: 1024, environment: 64, ao: 'low', post: false, msaa: 0, leafCount: 12, screenFPS: 10, rainCount: 480, cloudLayers: 4 },
} as const;
type Quality = { dpr: readonly [number, number]; shadowMap: number; environment: number; ao: 'low' | 'medium'; post: boolean; msaa: number; leafCount: number; screenFPS: number; rainCount: number; cloudLayers: number };
export const BACKGROUND_PROFILES: Record<ViewportProfile, Quality & { frameFPS: number }> = {
  desktop: { dpr: [1, 1.25], shadowMap: 1024, environment: 64, ao: 'low', post: false, msaa: 0, leafCount: 16, screenFPS: 10, rainCount: 650, cloudLayers: 3, frameFPS: 30 },
  tablet: { dpr: [1, 1.15], shadowMap: 1024, environment: 64, ao: 'low', post: false, msaa: 0, leafCount: 12, screenFPS: 8, rainCount: 400, cloudLayers: 2, frameFPS: 30 },
  mobile: { dpr: [1, 1], shadowMap: 512, environment: 64, ao: 'low', post: false, msaa: 0, leafCount: 8, screenFPS: 6, rainCount: 220, cloudLayers: 2, frameFPS: 24 },
};
export const getQualityProfile = (profile: ViewportProfile, background = false): Quality => background ? BACKGROUND_PROFILES[profile] : QUALITY_PROFILES[profile];
export const useQualityProfile = (profile: ViewportProfile) => getQualityProfile(profile, useContext(BackgroundContext));
export const viewportProfile = (width: number): ViewportProfile => width < 768 ? 'mobile' : width < 1100 ? 'tablet' : 'desktop';
