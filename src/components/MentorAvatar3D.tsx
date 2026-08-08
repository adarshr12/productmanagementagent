"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A real WebGL 3D figure (Three.js via react-three-fiber) — a stylized bust
 * (head + shoulders + collar) rather than a flat icon or a monogram, so it
 * actually reads as "someone," not an initial in a circle. Deliberately
 * abstract/non-photoreal rather than attempting a photorealistic human,
 * which isn't achievable without a pre-built/rigged 3D asset — this is a
 * console-friendly stylized figure, not a placeholder.
 */
function Figure({ speaking }: { speaking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // idle: slow head-turn + gentle bob, never a full spin
      group.current.rotation.y = Math.sin(t * 0.5) * 0.35;
      group.current.position.y = Math.sin(t * 1.1) * 0.05;
    }
    if (head.current) {
      const speakPulse = speaking ? 1 + Math.sin(t * 10) * 0.015 : 1;
      head.current.scale.setScalar(speakPulse);
    }
  });

  return (
    <group ref={group}>
      {/* shoulders / torso — "wearing something" via a distinct blazer shape,
          wider than the head so the silhouette reads as a body, not a blob */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <capsuleGeometry args={[0.68, 0.4, 8, 24]} />
        <meshStandardMaterial color="#1b2636" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* collar / neckline — a visible gap between head and shoulders */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.24, 0.34, 0.28, 32]} />
        <meshStandardMaterial color="#131c28" roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh ref={head} position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.46, 48, 48]} />
        <meshStandardMaterial
          color="#e8eef3"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* visor — a glowing "face" focal point, sci-fi register instead of
          attempting literal facial features */}
      <mesh position={[0, 0.95, 0.4]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.56, 0.14, 0.1]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={speaking ? 2.6 : 1.5}
          roughness={0.2}
        />
      </mesh>
      {/* accent lapel line */}
      <mesh position={[0, -0.05, 0.66]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.045, 0.55, 0.02]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={speaking ? 2.2 : 1.2}
        />
      </mesh>
    </group>
  );
}

export function MentorAvatar3D({
  size = 200,
  speaking = false,
}: {
  size?: number;
  speaking?: boolean;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.35), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <Canvas
        camera={{ position: [0, 0.15, 4.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.1} />
        <hemisphereLight args={["#dfeeff", "#0a0e14", 0.9]} />
        <directionalLight position={[1.5, 2, 2.5]} intensity={1.6} />
        <directionalLight position={[-1.5, 0.5, 2]} intensity={0.8} />
        <pointLight position={[0, -0.5, 2]} intensity={0.6} color="#22d3ee" />
        <Suspense fallback={null}>
          <Figure speaking={speaking} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-accent-500/40" />
    </div>
  );
}
