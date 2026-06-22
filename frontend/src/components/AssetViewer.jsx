import React, { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";

function Model({ wireframe = false, lighting = "purple" }) {
  const ref = React.useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.5; });
  const color = lighting === "purple" ? "#7C3AED" : lighting === "teal" ? "#14B8A6" : "#F59E0B";
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={ref}>
        <mesh>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color={color} wireframe={wireframe} metalness={0.7} roughness={0.25}
            emissive={color} emissiveIntensity={0.35} />
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

export default function AssetViewer({ wireframe, lighting }) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1} color={lighting === "teal" ? "#14B8A6" : "#7C3AED"} />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#F59E0B" />
        <Suspense fallback={null}>
          <Model wireframe={wireframe} lighting={lighting} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
