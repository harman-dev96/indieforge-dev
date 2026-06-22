import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, useGLTF, Stage, Html } from "@react-three/drei";
import { Maximize2, Minimize2, RotateCw } from "lucide-react";

function PlaceholderModel({ wireframe, color }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.5; });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={ref}>
        <mesh>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color={color} wireframe={wireframe} metalness={0.7} roughness={0.25}
            emissive={color} emissiveIntensity={0.3} />
        </mesh>
        <mesh>
          <torusKnotGeometry args={[0.7, 0.22, 100, 16]} />
          <meshStandardMaterial color="#F59E0B" wireframe={wireframe} metalness={0.6} roughness={0.3}
            emissive="#F59E0B" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function GLTFModel({ url, wireframe }) {
  const { scene } = useGLTF(url, true);
  React.useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.wireframe = !!wireframe;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene, wireframe]);
  return (
    <Stage adjustCamera={1.4} intensity={0.4} environment={null} shadows="contact">
      <primitive object={scene} />
    </Stage>
  );
}

function Loader() {
  return <Html center><div className="text-teal-300 text-sm">Loading model…</div></Html>;
}

export default function AssetViewer({ wireframe, lighting, modelUrl }) {
  const wrapRef = useRef(null);
  const [fs, setFs] = useState(false);
  const lightingColors = { purple: "#7C3AED", teal: "#14B8A6", amber: "#F59E0B" };
  const color = lightingColors[lighting] || lightingColors.purple;

  const toggleFullscreen = () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) wrapRef.current.requestFullscreen?.().then(() => setFs(true));
    else document.exitFullscreen?.().then(() => setFs(false));
  };

  React.useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full bg-slate-950">
      <Canvas camera={{ position: [0, 0.5, 4.5], fov: 50 }} dpr={[1, 2]} shadows>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1} color={color} />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#F59E0B" />
        <Suspense fallback={<Loader />}>
          {modelUrl ? <GLTFModel url={modelUrl} wireframe={wireframe} /> : <PlaceholderModel wireframe={wireframe} color={color} />}
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} makeDefault />
      </Canvas>
      <button
        data-testid="viewer-fullscreen"
        onClick={toggleFullscreen}
        className="absolute bottom-3 right-3 chip border-teal-400/50 text-teal-200 hover:bg-teal-500/20"
        title="Fullscreen"
      >
        {fs ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {fs ? "Exit" : "Fullscreen"}
      </button>
      <div className="absolute bottom-3 left-3 chip border-slate-700 text-slate-400 pointer-events-none">
        <RotateCw className="w-3 h-3" /> Drag to orbit · scroll to zoom
      </div>
    </div>
  );
}
