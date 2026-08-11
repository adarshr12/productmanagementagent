"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";

gsap.registerPlugin(useGSAP);

const CAMERA_FOV = 30;
const CAMERA_Z = 1.85;

/**
 * Loads a real rigged full-body GLB avatar and frames chest-up — head,
 * shoulders, and hands — like someone sitting across a video call, not a
 * profile-picture crop. These exports have no facial blendshapes, so
 * "speaking" is conveyed through head/hand motion rather than lip sync.
 */
function Figure({ src, speaking }: { src: string; speaking: boolean }) {
  const { scene: cached } = useGLTF(src);
  // useGLTF caches and reuses the same Object3D graph by URL. Cloning (with
  // bone bindings intact) is required so multiple instances of the same
  // model don't fight over one shared skeleton — reparenting the raw cached
  // scene into a second instance silently empties the first.
  const scene = useMemo(() => SkeletonUtils.clone(cached), [cached]);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const headBone = useRef<THREE.Object3D | null>(null);
  const neckBone = useRef<THREE.Object3D | null>(null);
  const leftArm = useRef<THREE.Object3D | null>(null);
  const rightArm = useRef<THREE.Object3D | null>(null);
  const framed = useRef(false);

  useEffect(() => {
    headBone.current = scene.getObjectByName("Head") || null;
    neckBone.current = scene.getObjectByName("Neck") || null;
    leftArm.current = scene.getObjectByName("LeftArm") || null;
    rightArm.current = scene.getObjectByName("RightArm") || null;

    // Bring the arms out of the T-pose bind into a relaxed, open gesture —
    // elbows down, hands raised toward the chest, like someone mid-explanation.
    if (leftArm.current) leftArm.current.rotation.z = 1.4;
    if (rightArm.current) rightArm.current.rotation.z = -1.4;

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

  // Frame the shot chest-up regardless of each model's exact bind pose /
  // scale — read the head and chest bones' actual world positions after the
  // first matrix update instead of hardcoding an offset per model.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (!framed.current && headBone.current && inner.current) {
      inner.current.updateMatrixWorld(true);
      const head = new THREE.Vector3();
      headBone.current.getWorldPosition(head);
      const chest = new THREE.Vector3();
      const chestBone =
        scene.getObjectByName("Spine1") || scene.getObjectByName("Spine");
      if (chestBone) chestBone.getWorldPosition(chest);
      else chest.set(head.x, head.y - 0.45, head.z);

      const topY = head.y + 0.17;
      const bottomY = chest.y - 0.32;
      const centerY = (topY + bottomY) / 2;
      inner.current.position.set(-head.x, -centerY, 0);
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
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 0.8) * 0.02;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.sin(t * 0.8 + 1) * 0.02;
    }
  });

  useEffect(() => {
    if (!headBone.current) return;
    if (!speaking) return;
    const tweens = [
      gsap.to(headBone.current.rotation, {
        z: 0.025,
        duration: 0.18,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }),
    ];
    if (leftArm.current) {
      tweens.push(
        gsap.to(leftArm.current.rotation, {
          z: "+=0.08",
          duration: 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        })
      );
    }
    if (rightArm.current) {
      tweens.push(
        gsap.to(rightArm.current.rotation, {
          z: "-=0.08",
          duration: 0.46,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        })
      );
    }
    return () => {
      tweens.forEach((tw) => tw.kill());
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
  const width = size;
  const height = Math.round(size * 1.22);
  // Fade the bottom edge into whatever it's sitting on instead of cutting
  // it off with a hard rectangle — reads as a portrait, not a framed photo.
  const fadeMask = "linear-gradient(to bottom, black 70%, transparent 100%)";

  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduceMotion) return;

      // Entrance: rise and settle instead of just appearing.
      gsap.from(root.current, {
        opacity: 0,
        y: 28,
        scale: 0.94,
        duration: 0.9,
        ease: "power3.out",
      });

      // Idle parallax: the figure tilts toward the cursor, like it's
      // paying attention to where you are on the page.
      const setX = gsap.quickTo(tilt.current, "rotateY", {
        duration: 0.7,
        ease: "power3.out",
      });
      const setY = gsap.quickTo(tilt.current, "rotateX", {
        duration: 0.7,
        ease: "power3.out",
      });

      const onMove = contextSafe!((e: PointerEvent) => {
        const rect = root.current?.getBoundingClientRect();
        if (!rect) return;
        const px = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const py = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        setX(Math.max(-1, Math.min(1, px)) * 6);
        setY(Math.max(-1, Math.min(1, py)) * -5);
      });
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative shrink-0" style={{ width, height }}>
      <div
        className="orb-pulse pointer-events-none absolute rounded-full"
        style={{
          inset: -size * 0.22,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.38), rgba(34,211,238,0.07) 55%, transparent 72%)",
          filter: "blur(14px)",
          animationDuration: speaking ? "1.3s" : "3.2s",
        }}
        aria-hidden="true"
      />
      <div
        ref={tilt}
        className="relative overflow-hidden"
        style={{
          width,
          height,
          maskImage: fadeMask,
          WebkitMaskImage: fadeMask,
          transformStyle: "preserve-3d",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
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
      </div>
    </div>
  );
}
