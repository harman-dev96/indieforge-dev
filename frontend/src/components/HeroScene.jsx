import React, { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Environment, MeshDistortMaterial } from "@react-three/drei";

function Spaceship({ position = [-2.4, 0.4, 0] }) {
  const ref = React.useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.4; });
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <group ref={ref} position={position}>
        <mesh>
          <coneGeometry args={[0.35, 1.4, 16]} />
          <meshStandardMaterial color="#14B8A6" metalness={0.85} roughness={0.2} emissive="#14B8A6" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <torusGeometry args={[0.5, 0.07, 8, 24]} />
          <meshStandardMaterial color="#7C3AED" metalness={0.6} roughness={0.3} emissive="#7C3AED" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

function RobotHead({ position = [2.2, 0.3, -0.4] }) {
  return (
    <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[-0.22, 0.1, 0.52]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#14B8A6" emissive="#14B8A6" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.22, 0.1, 0.52]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2} />
        </mesh>
      </group>
    </Float>
  );
}

function EnergySword({ position = [0, -0.8, 0.8] }) {
  return (
    <Float speed={2.4} rotationIntensity={0.3} floatIntensity={1.4}>
      <group position={position} rotation={[0, 0, Math.PI / 6]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
          <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
          <meshStandardMaterial color="#0F172A" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function TreasureChest({ position = [0, 1.4, -0.6] }) {
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.9}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.9, 0.55, 0.6]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.6} roughness={0.4} emissive="#F59E0B" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.45, 24, 24, 0, Math.PI]} />
          <MeshDistortMaterial color="#F59E0B" speed={1.4} distort={0.05} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0.5, 5.2], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#7C3AED" />
        <pointLight position={[-5, -5, 2]} intensity={0.8} color="#14B8A6" />
        <Suspense fallback={null}>
          <Spaceship />
          <RobotHead />
          <EnergySword />
          <TreasureChest />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
