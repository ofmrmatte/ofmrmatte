import { useContext, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AnimationContext } from '../animations/AnimationCoordinator';
import { ViewportProfile } from '../types';
import { useQualityProfile } from '../config/qualityProfiles';
import { WEATHER } from './WeatherConfig';

export function createRainGeometry(count: number) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = plane.index!.clone();
  for (const key of ['position', 'uv']) g.setAttribute(key, plane.attributes[key].clone());
  plane.dispose();
  const seeds = new Float32Array(count * 4);
  let seed = 6421;
  for (let i = 0; i < seeds.length; i++) { seed = Math.imul(seed, 1664525) + 1013904223; seeds[i] = (seed >>> 0) / 4294967296; }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); g.instanceCount = count;
  return g;
}
export function RainParticles({ profile }: { profile: ViewportProfile }) {
  const coordinator = useContext(AnimationContext)!;
  const count = useQualityProfile(profile).rainCount;
  const geometry = useMemo(() => createRainGeometry(count), [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="ExteriorRainGPU" geometry={geometry} frustumCulled={false} renderOrder={2}
    userData={{ exteriorMaxX: WEATHER.rainMaxX, exteriorMinX: WEATHER.rainMinX, particleCount: count, layers: 3 }}>
    <shaderMaterial uniforms={coordinator.weatherUniforms} transparent depthWrite={false} side={THREE.DoubleSide}
      vertexShader={`attribute vec4 aSeed;uniform float uTime;varying vec2 vRainUv;varying float vOpacity;
      void main(){
        float layer=floor(aSeed.x*3.);float within=fract(aSeed.x*3.);
        float x=layer<1.?mix(-3.24,-4.5,within):layer<2.?mix(-4.8,-8.,within):mix(-8.,-15.,within);
        float speed=4.+aSeed.w*4.5;float y=8.-mod(aSeed.y*13.+uTime*speed,13.);
        float z=mix(-4.5,5.5,aSeed.z)+sin(uTime*.16+aSeed.y*31.)*.17;
        x=min(-3.24,x+sin(uTime*.19+aSeed.z*18.)*.08);
        vec4 view=modelViewMatrix*vec4(x,y,z,1.);
        float streak=.055+aSeed.w*.045;vec2 offset=position.xy*vec2(.008,streak);
        offset.x+=offset.y*(.12+.06*sin(uTime*.09));view.xy+=offset;
        vRainUv=uv;vOpacity=(.29-layer*.065)*(.65+aSeed.w*.35);
        gl_Position=projectionMatrix*view;
      }`}
      fragmentShader={`varying vec2 vRainUv;varying float vOpacity;void main(){
        vec2 q=abs(vRainUv-.5)*2.;float a=pow(max(0.,1.-q.x*q.x),2.)*(1.-smoothstep(.25,1.,q.y))*vOpacity;
        if(a<.012)discard;gl_FragColor=vec4(.70,.82,.89,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`} />
  </mesh>;
}
