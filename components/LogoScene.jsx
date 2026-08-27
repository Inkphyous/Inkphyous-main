"use client";

import React, { useRef, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Clone } from "@react-three/drei";
import * as THREE from "three";

// Preload the model so it's ready before the component mounts
useGLTF.preload("/Snake.glb");

function Logo({ zooming, onZoomEnd }) {
  const { scene } = useGLTF("/Snake.glb");
  const root = useRef();
  const rotator = useRef();
  const finished = useRef(false);
  const zoomStartTime = useRef(null);
  const pauseDuration = 0.15;

  // Calculate offset from the model's bounding box
  const [offset, setOffset] = useState([0, 0, 0]);

  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // The Clone has scale={10}, so in Three.js the transform is:
    // finalPos = scale * originalPos + position
    // To place the model center at origin: offset = -center * scale
    const cloneScale = 10;
    setOffset([
      -center.x * cloneScale,
      -center.y * cloneScale,
      -center.z * cloneScale,
    ]);
  }, [scene]);

  useFrame((state, delta) => {
    if (rotator.current) {
      rotator.current.rotation.y += delta * (zooming ? 0.8 : 1.0);
    }

    if (zooming && root.current) {
      if (zoomStartTime.current === null) {
        zoomStartTime.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - zoomStartTime.current;
      if (elapsed < pauseDuration) return;

      const zoomTime = elapsed - pauseDuration;
      const zoomDuration = 1.8;
      const progress = Math.min(zoomTime / zoomDuration, 1);

      const easeInOut =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const speed = 0.8 + easeInOut * 1.8;
      root.current.scale.multiplyScalar(1 + delta * speed);

      // Zoom in straight ahead
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 35, delta * 1.5);
      state.camera.updateProjectionMatrix();

      if (!finished.current && root.current.scale.x >= 12) {
        finished.current = true;
        onZoomEnd();
      }
    }
  });

  return (
    <group ref={root}>
      <group ref={rotator}>
        <Clone object={scene} position={offset} scale={10} />
      </group>
    </group>
  );
}

export default function LogoScene({ onIntroComplete }) {
  const [zooming, setZooming] = useState(false);
  const [fading, setFading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const handleClick = useCallback(() => {
    if (!zooming) {
      setZooming(true);
    }
  }, [zooming]);

  const handleZoomEnd = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      onIntroComplete();
    }, 800);
  }, [onIntroComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.8,
        }}
      >
        <source src="/output2.webm" type="video/webm" />
      </video>

      {/* White fade overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "white",
          opacity: fading ? 1 : 0,
          transition: "opacity 600ms ease-in-out",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      />

      <div style={{ position: "absolute", inset: 0, cursor: "pointer", zIndex: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))" }} onClick={handleClick}>
        <Canvas
          style={{ width: "100vw", height: "100vh" }}
          camera={{ position: [0, 0.4, 10], fov: 45 }}
          onCreated={() => setCanvasReady(true)}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Suspense fallback={null}>
            <Logo
              zooming={zooming}
              onZoomEnd={handleZoomEnd}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </div>

      {/* Flashing hint text / Skip button */}
      {!zooming && (
        <div
          style={{
            position: "fixed",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            zIndex: 10001,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#fff",
              fontWeight: 500,
              pointerEvents: "none",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              animation: "pulseText 2s ease-in-out infinite",
            }}
          >
            Press logo to continue
          </p>

          <button
            onClick={handleZoomEnd}
            style={{
              background: "#000",
              border: "1px solid #000",
              padding: "10px 24px",
              borderRadius: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#fff",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "2px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#e11d48";
              e.target.style.color = "#fff";
              e.target.style.borderColor = "#e11d48";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#000";
              e.target.style.color = "#fff";
              e.target.style.borderColor = "#000";
            }}
          >
            Skip Intro
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulseText {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
