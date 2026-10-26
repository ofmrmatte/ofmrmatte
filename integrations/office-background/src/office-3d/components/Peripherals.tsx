import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { pbrLibrary } from '../materials/pbrLibrary';
import { ScreenTextureEngine } from '../screens/ScreenTextureEngine';
import { SPATIAL_SPECS } from '../config/spatialLayout';

interface PeripheralsProps {
  screenEngine: ScreenTextureEngine;
}

export const Peripherals: React.FC<PeripheralsProps> = ({ screenEngine }) => {
  const graphiteMat = useMemo(() => pbrLibrary.getGraphiteMetal(), []);
  const aluminumMat = useMemo(() => pbrLibrary.getAnodizedAluminum(), []);
  const keycapsRef = useRef<THREE.InstancedMesh>(null);
  const legends = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const rows = ['ESC 1 2 3 4 5 6 7 8 9 0 - + DEL', 'TAB Q W E R T Y U I O P [ ] \\ END', 'CAP A S D F G H J K L ; : ENTER', 'SHIFT Z X C V B N M , . / ↑ SHIFT', 'CTRL ALT FN CMD SPACE _ _ _ _ ALT ← ↓ →'];
    ctx.fillStyle = '#d8d9d1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++) {
      if ((row === 0 && col === 14) || (row === 4 && col >= 4 && col < 9) || (row === 2 && col === 14)) continue;
      const isEnter = row === 2 && col === 13;
      const x = -.136 + (col + (isEnter ? .5 : 0)) * .0192, z = -.042 + row * .0192;
      const label = rows[row].split(' ')[col] || '';
      ctx.font = `${label.length > 1 ? 13 : 22}px monospace`;
      ctx.fillText(label, (x + .148) / .296 * 1024, (z + .053) / .106 * 512);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
    return texture;
  }, []);
  useEffect(() => () => { legends.dispose(); coiledCableGeo.dispose(); }, [legends]);

  // Cabo Aviator Coiled (Espiral física sobre o deskmat)
  const coiledCableGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 18;
    for (let i = 0; i <= 140; i++) {
      const t = i / 140;
      const x = -0.14 + t * 0.14;
      const angle = t * turns * Math.PI * 2;
      const y = 0.763 + Math.sin(angle) * 0.0065;
      const z = -0.295 + Math.cos(angle) * 0.0065;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 140, 0.0026, 8, false);
  }, []);

  // Posiciona 80 Keycaps esculpidas ACIMA do chassi (Y = 0.023m) deixando espaço para o Knob no canto superior direito
  useLayoutEffect(() => {
    if (!keycapsRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let idx = 0;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 15; col++) {
        // Espaço reservado para o Rotary Knob na linha 0, coluna 14
        if (row === 0 && col === 14) continue;
        // Barra de espaço ocupa colunas 4 a 9 na linha 4
        if (row === 4 && col > 4 && col < 9) continue;

        const isSpacebar = row === 4 && col === 4;
        const isEnter = row === 2 && col === 13;
        if (row === 2 && col === 14) continue;

        const xOffset = isSpacebar
          ? -0.136 + (col + 2) * 0.0192
          : isEnter
          ? -0.136 + (col + 0.5) * 0.0192
          : -0.136 + col * 0.0192;
        const zOffset = -0.042 + row * 0.0192;

        // Perfil OEM/Cherry com alturas e inclinações sutis por fileira
        const rowHeight = 0.0235 + (4 - row) * 0.0008;
        dummy.position.set(xOffset, rowHeight, zOffset);
        dummy.rotation.set((row - 2) * 0.04, 0, 0);
        dummy.scale.set(isSpacebar ? 4.7 : isEnter ? 1.9 : 1, 1, 1);
        dummy.updateMatrix();
        keycapsRef.current.setMatrixAt(idx, dummy.matrix);

        // Esquema Custom Keycaps: Esc e Enter em Terracota/Laranja, Spacebar e Modificadores em Grafite Escuro, Alfas em Cinza Ardósia Claro
        const isEsc = row === 0 && col === 0;
        const isMod = col === 0 || col >= 13 || row === 4 || row === 0;
        color.set(
          isEsc || isEnter
            ? '#d95338'
            : isSpacebar
            ? '#242832'
            : isMod
            ? '#232730'
            : '#4a5160'
        );
        keycapsRef.current.setColorAt(idx, color);

        idx++;
      }
    }
    keycapsRef.current.count = idx;
    keycapsRef.current.instanceMatrix.needsUpdate = true;
    if (keycapsRef.current.instanceColor) {
      keycapsRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <group name="Peripherals">
      {/* 1. TECLADO MECÂNICO CUSTOM 75% COM ROTARY KNOB E BACKLIGHT */}
      <group name="Keyboard" position={SPATIAL_SPECS.peripherals.keyboard}>
        {/* Base inferior chanfrada em alumínio CNC */}
        <RoundedBox
          args={[0.324, 0.016, 0.134]}
          radius={0.004}
          smoothness={4}
          position={[0, 0.008, 0]}
          castShadow
          receiveShadow
          material={graphiteMat}
        />
        {/* Moldura superior (Top Case) */}
        <RoundedBox
          args={[0.318, 0.006, 0.128]}
          radius={0.003}
          smoothness={3}
          position={[0, 0.0165, 0]}
          castShadow
          receiveShadow
          material={aluminumMat}
        />
        {/* Switch Plate interna iluminada (cria o brilho sutil entre as teclas) */}
        <mesh position={[0, 0.0196, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.296, 0.106]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.55} />
        </mesh>

        {/* Keycaps esculpidas projetadas ACIMA do case */}
        <instancedMesh ref={keycapsRef} args={[undefined, undefined, 85]} castShadow receiveShadow>
          <boxGeometry args={[0.0158, 0.0105, 0.0158]} />
          <meshStandardMaterial roughness={0.38} metalness={0.08} />
        </instancedMesh>
        <mesh position={[0, .033, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[.296, .106]} />
          <meshBasicMaterial map={legends} transparent opacity={.62} depthWrite={false} />
        </mesh>

        {/* Rotary Encoder Knob (Botão giratório usinado em latão/ouro acetinado no canto superior direito) */}
        <mesh position={[0.133, 0.025, -0.042]} castShadow>
          <cylinderGeometry args={[0.0088, 0.0088, 0.012, 28]} />
          <meshStandardMaterial color="#d4a359" roughness={0.25} metalness={0.92} />
        </mesh>

        {/* Barra de LED RGB lateral / frontal discreta */}
        <mesh position={[0.148, 0.0198, 0.01]}>
          <boxGeometry args={[0.003, 0.002, 0.045]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* CABO COILED AVIATOR COM CONECTOR GX16 METÁLICO */}
      <group>
        <mesh geometry={coiledCableGeo} castShadow>
          <meshStandardMaterial color="#272b36" roughness={0.45} metalness={0.2} />
        </mesh>
        {/* Conector Aviator GX16 */}
        <mesh position={[0.025, 0.761, -0.295]} rotation={[0, 0, Math.PI / 2]} castShadow material={aluminumMat}>
          <cylinderGeometry args={[0.0055, 0.0055, 0.036, 20]} />
        </mesh>
      </group>

      {/* 2. MOUSE ERGONÔMICO MX MASTER 3S DETALHADO */}
      <group name="Mouse" position={SPATIAL_SPECS.peripherals.mouse} rotation={[0, -0.1, 0]}>
        {/* Base com aba lateral de descanso do polegar (Thumb Wing) */}
        <RoundedBox
          args={[0.068, 0.01, 0.112]}
          radius={0.005}
          position={[-0.004, 0.005, 0]}
          castShadow
          receiveShadow
          material={graphiteMat}
        />
        <mesh position={[-0.034, 0.004, 0.008]} rotation={[0, 0.15, 0]} castShadow material={graphiteMat}>
          <cylinderGeometry args={[0.018, 0.022, 0.006, 20]} />
        </mesh>

        {/* Corpo anatômico arqueado */}
        <mesh position={[0, 0.018, 0.006]} scale={[0.95, 0.68, 1.52]} castShadow receiveShadow>
          <sphereGeometry args={[0.032, 28, 24]} />
          <meshStandardMaterial color="#1e2026" roughness={0.55} metalness={0.02} />
        </mesh>

        {/* Botões principais Esquerdo e Direito separados por fenda */}
        <RoundedBox
          args={[0.024, 0.006, 0.046]}
          radius={0.002}
          position={[-0.013, 0.031, -0.024]}
          rotation={[0.26, 0, 0.05]}
          castShadow
          material={graphiteMat}
        />
        <RoundedBox
          args={[0.024, 0.006, 0.046]}
          radius={0.002}
          position={[0.013, 0.029, -0.024]}
          rotation={[0.26, 0, -0.08]}
          castShadow
          material={graphiteMat}
        />

        {/* Scroll Wheel Superior MagSpeed em Alumínio Usinado */}
        <mesh
          position={[0, 0.036, -0.028]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={aluminumMat}
        >
          <cylinderGeometry args={[0.0095, 0.0095, 0.0065, 24]} />
        </mesh>

        {/* Scroll Horizontal de Polegar (Thumb Wheel) + LED Verde de Status */}
        <mesh
          position={[-0.028, 0.022, -0.008]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          material={aluminumMat}
        >
          <cylinderGeometry args={[0.0065, 0.0065, 0.016, 20]} />
        </mesh>
        <mesh position={[-0.026, 0.023, 0.006]}>
          <sphereGeometry args={[0.0015, 10, 10]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      </group>

      {/* 3. IPHONE 16 PRO EM STAND MAGSAFE COM ALWAYS-ON DISPLAY E CÂMERA TRIPLA */}
      <group name="Phone" position={SPATIAL_SPECS.peripherals.phone} rotation={[0, -0.42, 0]}>
        {/* Base cilíndrica de alumínio do carregador MagSafe */}
        <mesh position={[0, 0.006, 0]} castShadow receiveShadow material={aluminumMat}>
          <cylinderGeometry args={[0.044, 0.048, 0.012, 32]} />
        </mesh>
        {/* Haste inclinada + disco magnético */}
        <mesh position={[0, 0.052, -0.012]} rotation={[-0.28, 0, 0]} castShadow material={aluminumMat}>
          <boxGeometry args={[0.014, 0.095, 0.008]} />
        </mesh>
        <mesh position={[0, 0.088, 0.002]} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={graphiteMat}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 28]} />
        </mesh>

        {/* Chassi em Titânio Natural do iPhone 16 Pro */}
        <group position={[0, 0.092, 0.011]} rotation={[-0.35, 0, 0]}>
          <RoundedBox
            args={[0.074, 0.152, 0.0085]}
            radius={0.005}
            smoothness={4}
            castShadow
            receiveShadow
            material={aluminumMat}
          />
          {/* Borda frontal preta fina (Bezel) */}
          <mesh position={[0, 0, 0.0044]}>
            <planeGeometry args={[0.070, 0.148]} />
            <meshBasicMaterial color="#050608" />
          </mesh>
          {/* Tela OLED Always-On Display ativa */}
          <mesh position={[0, 0, 0.0046]}>
            <planeGeometry args={[0.067, 0.144]} />
            <meshStandardMaterial
              map={screenEngine.phoneTexture}
              emissiveMap={screenEngine.phoneTexture}
              emissive="#ffffff"
              emissiveIntensity={0.85}
              roughness={0.12}
            />
          </mesh>
          {/* Botões laterais de Titânio */}
          <mesh position={[0.0375, 0.025, 0]} material={aluminumMat}>
            <boxGeometry args={[0.0015, 0.018, 0.003]} />
          </mesh>
          {/* Bump traseiro de câmera tripla Pro */}
          <RoundedBox
            args={[0.034, 0.036, 0.003]}
            radius={0.004}
            position={[0.016, 0.052, -0.005]}
            material={graphiteMat}
          />
        </group>
      </group>

      {/* 4. MICROFONE BROADCAST / CONDENSADOR COM YOKE MOUNT E ANÉIS METÁLICOS */}
      <group name="Microphone" position={SPATIAL_SPECS.peripherals.microphone} rotation={[0, 0.38, 0]}>
        {/* Base pesada com anel LED de status */}
        <mesh position={[0, 0.007, 0]} castShadow receiveShadow material={graphiteMat}>
          <cylinderGeometry args={[0.048, 0.052, 0.014, 32]} />
        </mesh>
        <mesh position={[0, 0.0145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.016, 0.02, 24]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
        {/* Haste + Garfo em U (Yoke Mount) com parafusos recartilhados laterais */}
        <mesh position={[0, 0.042, 0]} castShadow material={graphiteMat}>
          <cylinderGeometry args={[0.007, 0.007, 0.058, 16]} />
        </mesh>
        <mesh position={[0, 0.072, 0]} castShadow material={graphiteMat}>
          <boxGeometry args={[0.064, 0.006, 0.014]} />
        </mesh>
        {[-0.03, 0.03].map((xArm, idx) => (
          <group key={idx} position={[xArm, 0.105, 0]}>
            <mesh castShadow material={graphiteMat}>
              <boxGeometry args={[0.005, 0.068, 0.014]} />
            </mesh>
            <mesh position={[idx === 0 ? -0.006 : 0.006, 0.015, 0]} rotation={[0, 0, Math.PI / 2]} material={aluminumMat}>
              <cylinderGeometry args={[0.007, 0.007, 0.008, 16]} />
            </mesh>
          </group>
        ))}
        {/* Cápsula Broadcast inclinada com anel cromado e espuma acústica */}
        <group position={[0, 0.12, 0.005]} rotation={[-0.48, 0, 0]}>
          <mesh castShadow material={graphiteMat}>
            <cylinderGeometry args={[0.023, 0.023, 0.085, 28]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={aluminumMat}>
            <cylinderGeometry args={[0.0238, 0.0238, 0.008, 28]} />
          </mesh>
          <mesh position={[0, 0.055, 0]} castShadow>
            <capsuleGeometry args={[0.024, 0.032, 16, 24]} />
            <meshStandardMaterial color="#14161b" roughness={0.92} />
          </mesh>
        </group>
      </group>

      {/* 5. SUPORTE + HEADPHONES DE ESTÚDIO À ESQUERDA */}
      <group name="Headphones" position={SPATIAL_SPECS.peripherals.headphones} rotation={[0, 0.45, 0]}>
        <mesh position={[0, 0.006, 0]} castShadow receiveShadow material={aluminumMat}>
          <cylinderGeometry args={[0.06, 0.065, 0.012, 32]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} castShadow material={aluminumMat}>
          <cylinderGeometry args={[0.007, 0.007, 0.25, 20]} />
        </mesh>
        <mesh position={[0, 0.255, 0]} rotation={[Math.PI / 2, 0, 0]} material={graphiteMat}>
          <cylinderGeometry args={[0.014, 0.014, 0.045, 20]} />
        </mesh>

        <group position={[0, 0.175, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.078, 0.011, 16, 32, Math.PI]} />
            <primitive object={pbrLibrary.getLeather()} attach="material" />
          </mesh>
          {[-0.072, 0.072].map((zOffset, i) => (
            <group key={i} position={[0, -0.015, zOffset]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={graphiteMat}>
                <cylinderGeometry args={[0.046, 0.042, 0.032, 28]} />
              </mesh>
              <mesh position={[0, 0, i === 0 ? 0.018 : -0.018]}>
                <torusGeometry args={[0.036, 0.011, 16, 28]} />
                <meshStandardMaterial color="#121316" roughness={0.85} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* 6. CANECA DE CERÂMICA COM PORTA-COPOS E CAFÉ ESPRESSO + CADERNO E CANETA */}
      <group name="Mug" position={SPATIAL_SPECS.peripherals.mug}>
        {/* Porta-copos de cortiça */}
        <mesh position={[0, 0.0025, 0]} receiveShadow>
          <cylinderGeometry args={[0.048, 0.048, 0.005, 28]} />
          <meshStandardMaterial color="#6e4b32" roughness={0.88} />
        </mesh>
        {/* Parede da caneca */}
        <mesh position={[0, 0.048, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.036, 0.09, 32]} />
          <meshStandardMaterial color="#1d1f24" roughness={0.45} />
        </mesh>
        {/* Interior escuro + Crema do Café Espresso */}
        <mesh position={[0, 0.089, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.008, 28]} />
          <meshStandardMaterial color="#0d0e11" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.091, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.005, 28]} />
          <meshStandardMaterial color="#4a2914" roughness={0.22} />
        </mesh>
        {/* Alça */}
        <mesh position={[0.041, 0.048, 0]} castShadow>
          <torusGeometry args={[0.022, 0.0055, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#1d1f24" roughness={0.45} />
        </mesh>
      </group>

      {/* CADERNO MOLESKINE + CANETA EM ALUMÍNIO NA EXTREMIDADE DIREITA DA MESA */}
      <group name="Notebook" position={SPATIAL_SPECS.peripherals.notebook} rotation={[0, 0.18, 0]}>
        <RoundedBox
          args={[0.145, 0.016, 0.21]}
          radius={0.003}
          position={[0, 0.008, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#191b20" roughness={0.75} />
        </RoundedBox>
        {/* Fita elástica laranja do Moleskine */}
        <mesh position={[0.052, 0.0082, 0]}>
          <boxGeometry args={[0.009, 0.0168, 0.211]} />
          <meshStandardMaterial color="#c2593f" roughness={0.6} />
        </mesh>
        {/* Caneta técnica usinada sobre o caderno */}
        <mesh
          position={[-0.01, 0.021, 0.01]}
          rotation={[Math.PI / 2, 0, -0.28]}
          castShadow
          material={aluminumMat}
        >
          <cylinderGeometry args={[0.0045, 0.0045, 0.142, 16]} />
        </mesh>
      </group>
    </group>
  );
};
