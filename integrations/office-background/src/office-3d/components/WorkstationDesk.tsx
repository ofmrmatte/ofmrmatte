import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { pbrLibrary } from '../materials/pbrLibrary';
import { SPATIAL_SPECS } from '../config/spatialLayout';
import { ScreenTextureEngine } from '../screens/ScreenTextureEngine';
import { Solid, Rod } from './Geometry';

interface WorkstationDeskProps {
  screenEngine: ScreenTextureEngine;
}

export const WorkstationDesk: React.FC<WorkstationDeskProps> = ({ screenEngine }) => {
  const walnutMat = useMemo(() => pbrLibrary.getWalnutDesk(), []);
  const graphiteMat = useMemo(() => pbrLibrary.getGraphiteMetal(), []);
  const aluminumMat = useMemo(() => pbrLibrary.getAnodizedAluminum(), []);
  const feltMat = useMemo(() => pbrLibrary.getDeskMatFelt(), []);

  const laptopKeysRef = useRef<THREE.InstancedMesh>(null);

  const { width, depth, topSurfaceY, thickness, centerZ } = SPATIAL_SPECS.desk;
  const floor = SPATIAL_SPECS.rug.top;
  const legHeight = topSurfaceY - thickness - floor;

  // Gera as 78 teclas individuais de perfil baixo do MacBook Pro 16"
  useLayoutEffect(() => {
    if (!laptopKeysRef.current) return;
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 14; col++) {
        if (row === 5 && col > 3 && col < 9) continue;
        const isSpace = row === 5 && col === 3;
        const x = isSpace
          ? -0.122 + (col + 2.2) * 0.0185
          : -0.122 + col * 0.0185;
        const z = -0.058 + row * 0.0175;

        dummy.position.set(x, 0.0082, z);
        dummy.scale.set(isSpace ? 4.8 : 1, 1, row === 0 ? 0.65 : 1);
        dummy.updateMatrix();
        laptopKeysRef.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    laptopKeysRef.current.count = idx;
    laptopKeysRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const cableGeometries = useMemo(() => {
    const curves = [
      // Cabo MagSafe / Thunderbolt trançado saindo da lateral esquerda do MacBook para a Dock
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.37, 0.84, -0.40),
        new THREE.Vector3(0.32, 0.758, -0.49),
        new THREE.Vector3(0.24, 0.758, -0.54),
      ]),
      // Cabo DisplayPort do Monitor Principal
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.10, 1.00, -0.58),
        new THREE.Vector3(-0.14, 0.86, -0.71),
        new THREE.Vector3(-0.18, 0.72, -0.74),
      ]),
      // Cabo do Microfone XLR
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.44, 0.76, -0.26),
        new THREE.Vector3(-0.44, 0.756, -0.52),
        new THREE.Vector3(-0.22, 0.756, -0.68),
      ]),
    ];
    return curves.map((curve) => new THREE.TubeGeometry(curve, 32, 0.0032, 10, false));
  }, []);

  return (
    <group name="WorkstationDesk">
      {/* TAMPO DE NOGUEIRA MACIÇA CHANFRADO */}
      <Solid
        size={[width, thickness, depth]}
        radius={0.006}
        position={[0, topSurfaceY - thickness / 2, centerZ]}
        castShadow
        receiveShadow
        material={walnutMat}
      />

      {/* ESTRUTURA METÁLICA */}
      {[-0.91, 0.91].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0, centerZ]}>
          <mesh position={[0, legHeight / 2 + floor, 0.34]} castShadow receiveShadow material={graphiteMat}>
            <boxGeometry args={[0.05, legHeight, 0.05]} />
          </mesh>
          <mesh position={[0, legHeight / 2 + floor, -0.34]} castShadow receiveShadow material={graphiteMat}>
            <boxGeometry args={[0.05, legHeight, 0.05]} />
          </mesh>
          <mesh position={[0, floor + 0.0175, 0]} castShadow receiveShadow material={graphiteMat}>
            <boxGeometry args={[0.052, 0.035, 0.73]} />
          </mesh>
          <mesh position={[0, legHeight + floor - 0.02, 0]} castShadow material={graphiteMat}>
            <boxGeometry args={[0.052, 0.04, 0.73]} />
          </mesh>
          {[-.34, .34].map(z => <mesh key={z} position={[0, floor + .011, z]} material={pbrLibrary.getPlastic()}><cylinderGeometry args={[.027, .027, .022, 16]} /></mesh>)}
          {[-.28, .28].map(z => <mesh key={z} position={[.027, legHeight + floor - .02, z]} rotation={[0, 0, Math.PI / 2]} material={aluminumMat}><cylinderGeometry args={[.005, .005, .002, 6]} /></mesh>)}
        </group>
      ))}

      {/* CALHA ORGANIZADORA DE CABOS SOB O TAMPO */}
      <mesh position={[0, 0.67, centerZ - 0.28]} castShadow material={graphiteMat}>
        <boxGeometry args={[1.45, 0.05, 0.12]} />
      </mesh>

      {/* DESKMAT PREMIUM EM FELTRO/COURO COM COSTURA DE BORDA */}
      <group position={[-0.04, 0.752, -0.22]}>
        <RoundedBox
          args={[0.94, 0.004, 0.43]}
          radius={0.002}
          smoothness={2}
          receiveShadow
          material={feltMat}
        />
        {/* Etiqueta minimalista de couro no canto do Deskmat */}
        <mesh position={[0.42, 0.0025, 0.18]}>
          <boxGeometry args={[0.045, 0.001, 0.018]} />
          <meshStandardMaterial color="#5c3824" roughness={0.5} />
        </mesh>
      </group>

      {/* BRAÇO ARTICULADO DUPLO VESA (100% atrás dos monitores, sem invadir a frente) */}
      <group position={[-0.24, 0.75, -0.74]}>
        <Rod from={[0, .31, .02]} to={[.14, .31, .13]} radius={.014} material={graphiteMat} />
        <Rod from={[-.08, .31, .02]} to={[-.44, .31, .2]} radius={.014} material={graphiteMat} />
        <Rod from={[-.44, .31, .2]} to={[-.47, .31, .275]} radius={.014} material={graphiteMat} />
        {[[.14, .13], [-.44, .2]].map(([x, z], i) => <mesh key={i} position={[x, .31, z]} material={aluminumMat}><cylinderGeometry args={[.022, .022, .039, 20]} /></mesh>)}
        <mesh position={[0, 0.015, 0]} castShadow material={graphiteMat}>
          <boxGeometry args={[0.09, 0.03, 0.08]} />
        </mesh>
        <mesh position={[0, 0.23, -0.01]} castShadow material={graphiteMat}>
          <cylinderGeometry args={[0.018, 0.018, 0.44, 24]} />
        </mesh>
        <Rod from={[.14, .31, .13]} to={[.14, .31, .147]} radius={.014} material={graphiteMat} />
      </group>

      {/* MONITOR PRINCIPAL 27" 4K + SCREENBAR LED */}
      <group name="PrimaryMonitor" position={SPATIAL_SPECS.equipment.primaryMonitor}>
        <Solid size={[.27, .18, .018]} position={[0, -.015, -.019]} material={graphiteMat} radius={.008} />
        <Solid size={[.065, .065, .008]} position={[0, 0, -.033]} material={aluminumMat} radius={.004} />
        {Array.from({ length: 13 }, (_, i) => <Solid key={i} size={[.0025, .035, .002]} position={[-.09 + i * .015, .045, -.029]} material={pbrLibrary.getPlastic()} radius={.001} />)}
        <RoundedBox
          args={[0.615, 0.362, 0.022]}
          radius={0.005}
          smoothness={4}
          castShadow
          receiveShadow
          material={graphiteMat}
        />
        {/* Chin inferior discreto com LED branco suave */}
        <mesh position={[0, -0.175, 0.0115]}>
          <boxGeometry args={[0.615, 0.01, 0.002]} />
          <meshStandardMaterial color="#14161a" roughness={0.4} />
        </mesh>
        <mesh position={[0.27, -0.175, 0.013]}>
          <sphereGeometry args={[0.0018, 8, 8]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
        {/* Painel IPS ativo */}
        <mesh position={[0, 0.003, 0.0115]}>
          <planeGeometry args={[0.596, 0.336]} />
          <meshStandardMaterial
            map={screenEngine.ideTexture}
            emissiveMap={screenEngine.ideTexture}
            emissive="#ffffff"
            color="#000000"
            emissiveIntensity={1}
            roughness={0.7}
            envMapIntensity={0.03}
          />
        </mesh>
        {/* Luminária ScreenBar detalhada com contrapeso traseiro e dial central */}
        <group position={[0, 0.192, 0.028]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={graphiteMat}>
            <cylinderGeometry args={[0.009, 0.009, 0.48, 24]} />
          </mesh>
          {/* Suporte central com contrapeso cilíndrico */}
          <mesh position={[0, -0.008, -0.025]} castShadow material={aluminumMat}>
            <boxGeometry args={[0.042, 0.024, 0.048]} />
          </mesh>
          <mesh position={[0, -0.022, -0.042]} rotation={[0, 0, Math.PI / 2]} material={graphiteMat}>
            <cylinderGeometry args={[0.014, 0.014, 0.055, 20]} />
          </mesh>
          {/* Difusor LED direcionado para o teclado */}
          <mesh position={[0, -0.008, 0.004]} rotation={[Math.PI / 3, 0, 0]}>
            <planeGeometry args={[0.45, 0.01]} />
            <meshBasicMaterial color="#fff3dc" />
          </mesh>
        </group>
      </group>

      {/* MONITOR SECUNDÁRIO 27" 4K */}
      <group name="SecondaryMonitor" position={SPATIAL_SPECS.equipment.secondaryMonitor} rotation={[0, 0.42, 0]}>
        <Solid size={[.24, .17, .018]} position={[0, -.015, -.019]} material={graphiteMat} radius={.008} />
        <Solid size={[.065, .065, .008]} position={[0, 0, -.032]} material={aluminumMat} radius={.004} />
        <RoundedBox
          args={[0.615, 0.362, 0.022]}
          radius={0.005}
          smoothness={4}
          castShadow
          receiveShadow
          material={graphiteMat}
        />
        <mesh position={[0, 0.003, 0.0115]}>
          <planeGeometry args={[0.596, 0.336]} />
          <meshStandardMaterial
            map={screenEngine.previewTexture}
            emissiveMap={screenEngine.previewTexture}
            emissive="#ffffff"
            color="#000000"
            emissiveIntensity={1}
            roughness={0.7}
            envMapIntensity={0.03}
          />
        </mesh>
      </group>

      {/* MACBOOK PRO 16" DETALHADO (Com tela aberta em pé a 106°, teclado físico, trackpad e speakers) */}
      <group name="Laptop" position={SPATIAL_SPECS.equipment.laptop} rotation={[0, -0.42, 0]}>
        {/* Base do Stand de Alumínio Usinado */}
        <RoundedBox
          args={[0.25, 0.008, 0.22]}
          radius={0.003}
          position={[0, 0.004, 0]}
          castShadow
          receiveShadow
          material={graphiteMat}
        />
        {/* Braços duplos de elevação do Stand */}
        {[-0.085, 0.085].map((xPos, i) => (
          <mesh
            key={i}
            position={[xPos, 0.052, -0.01]}
            rotation={[0.24, 0, 0]}
            castShadow
            material={graphiteMat}
          >
            <boxGeometry args={[0.028, 0.095, 0.012]} />
          </mesh>
        ))}

        {/* CHASSI DO MACBOOK PRO 16" APOIADO NO STAND */}
        <group position={[0, 0.096, 0.01]} rotation={[0.18, 0, 0]}>
          {/* Topcase / Unibody em Alumínio Space Gray */}
          <RoundedBox
            args={[0.356, 0.015, 0.248]}
            radius={0.005}
            smoothness={4}
            castShadow
            receiveShadow
            material={aluminumMat}
          />

          {/* Entalhe frontal para abrir a tampa + Portas Thunderbolt laterais */}
          <mesh position={[0, 0.005, 0.1235]}>
            <boxGeometry args={[0.055, 0.004, 0.004]} />
            <meshStandardMaterial color="#181a1f" roughness={0.4} />
          </mesh>
          {[-0.06, -0.03, 0.0].map((zPort, pIdx) => (
            <mesh key={pIdx} position={[-0.178, 0.001, zPort]}>
              <boxGeometry args={[0.002, 0.0035, 0.01]} />
              <meshStandardMaterial color="#0b0c0e" />
            </mesh>
          ))}

          {/* Berço rebaixado preto fosco do Magic Keyboard */}
          <mesh position={[0, 0.0076, -0.018]}>
            <boxGeometry args={[0.278, 0.001, 0.112]} />
            <meshStandardMaterial color="#0d0e12" roughness={0.65} />
          </mesh>

          {/* Camada sutil de backlight branco sob as teclas do MacBook */}
          <mesh position={[0, 0.0082, -0.018]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.272, 0.106]} />
            <meshBasicMaterial color="#cce4ff" transparent opacity={0.35} />
          </mesh>

          {/* 78 Teclas individuais do MacBook Pro */}
          <instancedMesh ref={laptopKeysRef} args={[undefined, undefined, 84]}>
            <boxGeometry args={[0.016, 0.0022, 0.0145]} />
            <meshStandardMaterial color="#15171d" roughness={0.45} metalness={0.1} />
          </instancedMesh>

          {/* Grades de som laterais (Speaker Grilles) */}
          {[-0.156, 0.156].map((xGrille, gIdx) => (
            <mesh key={gIdx} position={[xGrille, 0.0077, -0.018]}>
              <boxGeometry args={[0.022, 0.0008, 0.108]} />
              <meshStandardMaterial color="#2a2d34" roughness={0.5} metalness={0.6} />
            </mesh>
          ))}

          {/* Force Touch Trackpad amplo na parte frontal */}
          <mesh position={[0, 0.0078, 0.078]}>
            <boxGeometry args={[0.135, 0.0008, 0.076]} />
            <meshStandardMaterial color="#707680" roughness={0.22} metalness={0.85} />
          </mesh>

          {/* DOBRADIÇA CILÍNDRICA PRETA + TAMPA DA TELA ABERTA EM PÉ (106°) */}
          <mesh position={[0, 0.006, -0.118]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.005, 0.24, 16]} />
            <meshStandardMaterial color="#111216" roughness={0.5} />
          </mesh>

          <group position={[0, 0.008, -0.122]} rotation={[-0.26, 0, 0]}>
            {/* Tampa de alumínio */}
            <RoundedBox
              args={[0.356, 0.236, 0.006]}
              radius={0.004}
              smoothness={4}
              position={[0, 0.118, 0]}
              castShadow
              receiveShadow
              material={aluminumMat}
            />
            {/* Moldura preta de vidro (Bezel) */}
            <mesh position={[0, 0.118, 0.0031]}>
              <planeGeometry args={[0.348, 0.228]} />
              <meshStandardMaterial color="#08090c" roughness={0.12} />
            </mesh>
            {/* Tela Liquid Retina XDR ativa com o Terminal */}
            <mesh position={[0, 0.118, 0.0035]}>
              <planeGeometry args={[0.338, 0.214]} />
              <meshStandardMaterial
                map={screenEngine.terminalTexture}
                emissiveMap={screenEngine.terminalTexture}
                emissive="#ffffff"
                color="#000000"
                emissiveIntensity={1}
                roughness={0.7}
                envMapIntensity={0.03}
              />
            </mesh>
            {/* Notch da câmera FaceTime HD no topo central */}
            <mesh position={[0, 0.221, 0.0038]}>
              <planeGeometry args={[0.044, 0.009]} />
              <meshBasicMaterial color="#050608" />
            </mesh>
          </group>
        </group>
      </group>

      {/* DOCK THUNDERBOLT 4 / INTERFACE DE ÁUDIO COM KNOB E PORTAS FRONTAIS */}
      <group position={[0.24, 0.766, -0.55]}>
        <RoundedBox
          args={[0.195, 0.032, 0.088]}
          radius={0.004}
          smoothness={3}
          castShadow
          receiveShadow
          material={aluminumMat}
        />
        {/* Painel frontal escuro */}
        <mesh position={[0, 0, 0.0442]}>
          <planeGeometry args={[0.184, 0.024]} />
          <meshStandardMaterial color="#12141a" roughness={0.35} />
        </mesh>
        {/* Knob metálico de ganho/volume */}
        <mesh position={[0.068, 0, 0.048]} rotation={[Math.PI / 2, 0, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.0085, 0.0085, 0.009, 24]} />
        </mesh>
        {/* LEDs de status e portas USB-C / SD */}
        <mesh position={[-0.072, 0.002, 0.045]}>
          <sphereGeometry args={[0.0022, 12, 12]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
        <mesh position={[-0.058, 0.002, 0.045]}>
          <sphereGeometry args={[0.0022, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {[-0.025, 0.0, 0.025].map((xPort, idx) => (
          <mesh key={idx} position={[xPort, 0, 0.0448]}>
            <boxGeometry args={[0.011, 0.004, 0.002]} />
            <meshBasicMaterial color="#050608" />
          </mesh>
        ))}
      </group>

      {/* CABOS FÍSICOS */}
      {cableGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow>
          <meshStandardMaterial color="#15171c" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
};
