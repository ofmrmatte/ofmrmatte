import { useContext, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AnimationContext } from '../animations/AnimationCoordinator';
import { pbrLibrary } from '../materials/pbrLibrary';
import { BackgroundContext } from '../config/qualityProfiles';

const drops = `
uniform float uTime;
varying vec2 vWetCoord;
float wetHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wetField(vec2 p){
  vec2 grid=p*vec2(36.,44.);vec2 cell=floor(grid);float seed=wetHash(cell);
  vec2 q=fract(grid)-.5;vec2 center=vec2(wetHash(cell+3.),wetHash(cell+7.))*.42-.21;
  float staticDrop=(1.-smoothstep(.035,.15,length((q-center)*vec2(1.,1.35))))*step(.63,seed);
  float col=floor(p.x*12.);float h=wetHash(vec2(col,5.));
  float travel=p.y*3.2+uTime*(.013+h*.022)+h*18.;
  float row=floor(travel);float vary=wetHash(vec2(col,row));
  vec2 r=vec2(fract(p.x*12.)-.5+sin(travel*.7+h*6.)*.045,fract(travel)-.5);
  r.x+=(h-.5)*.23;
  float radius=.075+vary*.035;float head=(1.-smoothstep(radius*.45,radius,length(r*vec2(1.3,.65))))*step(.38,h);
  float trail=exp(-abs(r.x)*115.)*smoothstep(-.04,.16,r.y)*(1.-smoothstep(.16,.48,r.y))*.14*step(.38,h);
  return max(staticDrop,head)+trail;
}
`;
export function useWetWindowMaterial() {
  const coordinator = useContext(AnimationContext)!;
  const background = useContext(BackgroundContext);
  const material = useMemo(() => {
    if (background) {
      // A transparent surface needs no physical transmission pass behind portfolio text.
      // Keep one droplet sample; the full tour retains its refractive normal detail.
      const m = new THREE.MeshBasicMaterial({ color: '#b4cad6', transparent: true, opacity: .045, depthWrite: false, side: THREE.DoubleSide });
      m.name = 'BackgroundWetGlass';
      m.onBeforeCompile = shader => {
        shader.uniforms.uTime = coordinator.weatherUniforms.uTime;
        shader.vertexShader = `varying vec2 vWetCoord;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWetCoord=(modelMatrix*vec4(transformed,1.)).zy;');
        shader.fragmentShader = `${drops}\n${shader.fragmentShader}`.replace('#include <alphatest_fragment>', 'diffuseColor.a+=wetField(vWetCoord)*.12;\n#include <alphatest_fragment>');
      };
      m.customProgramCacheKey = () => 'atelier-background-glass-v1';
      return m;
    }
    const m = pbrLibrary.getArchitecturalGlass().clone() as THREE.MeshPhysicalMaterial;
    m.name = 'AnimatedWetArchitecturalGlass'; m.opacity = .085; m.roughness = .075;
    m.onBeforeCompile = shader => {
      shader.uniforms.uTime = coordinator.weatherUniforms.uTime;
      shader.vertexShader = `varying vec2 vWetCoord;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWetCoord=(modelMatrix*vec4(transformed,1.)).zy;');
      shader.fragmentShader = `${drops}\n${shader.fragmentShader}`.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        float wet=wetField(vWetCoord);
        vec2 slope=vec2(wetField(vWetCoord+vec2(.0009,0.))-wetField(vWetCoord-vec2(.0009,0.)),wetField(vWetCoord+vec2(0.,.0009))-wetField(vWetCoord-vec2(0.,.0009)));
        normal=normalize(normal+vec3(slope*.65,0.));
        roughnessFactor=mix(roughnessFactor,.12,min(1.,wet));
        diffuseColor.a=clamp(diffuseColor.a+wet*.23+length(slope)*.24,0.,.42);
      `);
    };
    m.customProgramCacheKey = () => 'atelier-wet-glass-v1';
    return m;
  }, [coordinator, background]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}
