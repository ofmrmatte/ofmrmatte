// Metres. The innermost particle is still outside the exterior window reveal.
export const WEATHER = {
  rainMinX: -15, rainMaxX: -3.24, rainMinY: -5, rainMaxY: 8,
  rainMinZ: -4.5, rainMaxZ: 5.5, overcast: .78,
  sunIntensity: .65, skyFill: 3.35,
} as const;
export const glslNoise = `
float hash3(vec3 p){ p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float n=0.,a=.5;for(int j=0;j<4;j++){n+=a*noise3(p);p=p*2.03+vec3(2.1,7.9,3.4);a*=.5;}return n;}
`;
