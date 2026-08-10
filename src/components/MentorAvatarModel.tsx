"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";

/**
 * Loads a real rigged full-body GLB avatar and frames just the head/shoulders,
 * like a portrait crop. These exports have no facial blendshapes, so "speaking"
 * is a subtle head/shoulder animation rather than lip sync.
 */
function Figure({ src, speaking }: { src: string; speaking: boolean }) {
  const { scene } = useGLTF(src);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const headBone = useRef<THREE.Object3D | null>(null);
  const neckBone = useRef<THREE.Object3D | null>(null);
  const framed = useRef(false);

  useEffect(() => {
    headBone.current = scene.getObjectByName("Head") || null;
    neckBone.current = scene.getObjectByName("Neck") || null;
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.1;
      }
    });
    framed.current = false;
  }, [scene]);

  // Frame the shot on the head regardless of each model's exact bind pose /
  // scale — read the head bone's actual world position after the first
  // matrix update instead of hardcoding an offset per model.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (!framed.current && headBone.current && inner.current) {
      inner.current.updateMatrixWorld(true);
      const headWorld = new THREE.Vector3();
      headBone.current.getWorldPosition(headWorld);
      inner.current.position.set(-headWorld.x, -headWorld.y - 0.07, -headWorld.z);
      framed.current = true;
    }

    if (headBone.current) {
      headBone.current.rotation.y = Math.sin(t * 0.5) * 0.12;
      headBone.current.rotation.x = Math.sin(t * 0.7) * 0.03;
    }
    if (neckBone.current) {
      neckBone.current.rotation.y = Math.sin(t * 0.5) * 0.05;
    }
    if (outer.current) {
      outer.current.position.y = Math.sin(t * 1.1) * 0.006;
    }
  });

  useEffect(() => {
    if (!headBone.current || !speaking) return;
    const tween = gsap.to(headBone.current.rotation, {
      z: 0.025,
      duration: 0.18,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [speaking]);

  return (
    <group ref={outer}>
      <group ref={inner}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export function MentorAvatarModel({
  src,
  size = 200,
  speaking = false,
}: {
  src: string;
  size?: number;
  speaking?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="orb-pulse pointer-events-none absolute rounded-full"
        style={{
          inset: -size * 0.28,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.55), rgba(34,211,238,0.12) 55%, transparent 72%)",
          filter: "blur(6px)",
          animationDuration: speaking ? "1.3s" : "3.2s",
        }}
        aria-hidden="true"
      />
      <div
        className="relative overflow-hidden rounded-full bg-[#0d131c]"
        style={{ width: size, height: size }}
      >
        <Canvas
          camera={{ position: [0, 0, 0.62], fov: 26 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.2} />
          <hemisphereLight args={["#dfeeff", "#0a0e14", 0.9]} />
          <directionalLight position={[1.2, 1.6, 2]} intensity={2.2} />
          <directionalLight position={[-1.5, 0.4, 1.5]} intensity={0.9} />
          <pointLight position={[0, -0.4, 1]} intensity={0.5} color="#22d3ee" />
          <Suspense fallback={null}>
            <Figure src={src} speaking={speaking} />
          </Suspense>
        </Canvas>
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-accent-500/40" />
      </div>
    </div>
  );
}
