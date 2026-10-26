import { useContext } from 'react';
import * as THREE from 'three';
import { AnimationContext } from '../animations/AnimationCoordinator';
import { useQualityProfile } from '../config/qualityProfiles';
import { ViewportProfile } from '../types';
import { glslNoise } from './WeatherConfig';

export function AnimatedClouds({ profile }: { profile: ViewportProfile }) {
  const coordinator = useContext(AnimationContext)!;
  const quality = useQualityProfile(profile);
  return <mesh name="LayeredCloudAtmosphere" renderOrder={1000}>
    <sphereGeometry args={[75, 24, 16]} />
    <shaderMaterial key={quality.cloudLayers} side={THREE.BackSide} depthWrite={false} uniforms={coordinator.weatherUniforms}
      defines={{ CLOUD_LAYERS: quality.cloudLayers }}
      vertexShader={`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`}
      fragmentShader={`uniform float uTime;uniform float uWet;varying vec3 vWorld;${glslNoise}
      void main(){vec3 ray=normalize(vWorld-cameraPosition);float elevation=max(0.,ray.y);
        vec3 sky=mix(vec3(.46,.55,.61),vec3(.20,.31,.42),smoothstep(0.,.8,elevation));
        float optical=0.;vec3 clouds=vec3(0.);
        for(int i=0;i<CLOUD_LAYERS;i++){
          float layer=float(i);float h=8.+layer*.7;float distanceToLayer=(h-cameraPosition.y)/max(ray.y,.065);
          vec3 p=cameraPosition+ray*distanceToLayer;
          p.x+=uTime*(.12+layer*.013);p.z+=sin(uTime*.014+layer)*.6;
          float density=smoothstep(.34,.69,fbm(p*vec3(.043,.13,.043)+vec3(0,layer*.21,0)));
          density*=smoothstep(0.,.12,ray.y)*(.23+uWet*.09);
          float light=fbm(p*.032+vec3(0,2.2,0));
          vec3 shade=mix(vec3(.29,.37,.44),vec3(.73,.77,.79),light);
          clouds+=(1.-optical)*density*shade;optical+=(1.-optical)*density;
        }
        vec3 color=sky*(1.-optical)+clouds;
        color=mix(vec3(.55,.62,.66),color,smoothstep(-.09,.16,ray.y));
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`} />
  </mesh>;
}
