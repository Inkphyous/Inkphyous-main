"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Clone } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/Snake.glb");

function RotatingLogo() {
  const { scene } = useGLTF("/Snake.glb");
  const groupRef = useRef();
  const [offset, setOffset] = useState([0, 0, 0]);

  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const s = 10;
    setOffset([-center.x * s, -center.y * s, -center.z * s]);
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Clone object={scene} position={offset} scale={10} />
    </group>
  );
}

export default function NavbarLogo3D({ isMobile }) {
  return (
    <div className="header__3d-logo">
      <Canvas
        style={{ width: isMobile ? 38 : 52, height: isMobile ? 38 : 52 }}
        camera={{ position: [0, 0.2, 1.8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <RotatingLogo />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}
