import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

/** Futuristic three.js environment: reflective floor grid, light ring portal, drifting particles, beams. */
const Scene: React.FC<{ energy: number }> = ({ energy }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const particles = useMemo(() => {
    const n = 420, pos = new Float32Array(n * 3);
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 16; pos[i * 3 + 1] = r() * 14 - 4; pos[i * 3 + 2] = -r() * 14 + 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g;
  }, []);
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(40, 40, '#168BFF', '#0d3a73');
    (g.material as THREE.Material).transparent = true; (g.material as THREE.Material).opacity = 0.35; return g;
  }, []);
  return (
    <>
      <color attach="background" args={['#03070F']} />
      <fog attach="fog" args={['#03070F', 6, 22]} />
      <ambientLight intensity={0.4} />
      <primitive object={grid} position={[0, -3.2, -4 + ((t * 0.6) % 1)]} />
      {/* portal rings behind the device */}
      <group position={[0, 0.6, -3.4]} rotation={[0, 0, t * 0.25]} scale={1.3}>
        <mesh><torusGeometry args={[2.55, 0.018, 16, 160]} /><meshBasicMaterial color="#5DB2FF" transparent opacity={0.85 * energy} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 3]}><torusGeometry args={[2.85, 0.008, 12, 160, Math.PI * 1.2]} /><meshBasicMaterial color="#168BFF" transparent opacity={0.6 * energy} /></mesh>
        <mesh rotation={[0, 0, -t * 0.6]}><torusGeometry args={[3.25, 0.012, 12, 160, Math.PI * 0.5]} /><meshBasicMaterial color="#C8D3E0" transparent opacity={0.35 * energy} /></mesh>
      </group>
      {/* soft glow disc */}
      <mesh position={[0, 0.6, -3.6]}><circleGeometry args={[2.5, 64]} /><meshBasicMaterial color="#0b2d5c" transparent opacity={0.55 * energy} /></mesh>
      {/* light beams */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * 2.6, 3.2, -5]} rotation={[0, 0, sgn * (0.42 + Math.sin(t * 0.7) * 0.05)]}>
          <coneGeometry args={[1.4, 10, 32, 1, true]} />
          <meshBasicMaterial color="#168BFF" transparent opacity={0.07 * energy} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <points geometry={particles} position={[0, (t * 0.35) % 2, 0]}>
        <pointsMaterial size={0.035} color="#8cc8ff" transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
};

export const Stage3D: React.FC<{ energy?: number }> = ({ energy = 1 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 0.4, 7.5] }} gl={{ antialias: true }}>
      <Scene energy={energy} />
    </ThreeCanvas>
  );
};
