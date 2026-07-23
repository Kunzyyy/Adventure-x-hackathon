import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function RobotModel() {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#5b5fef",
      emissive: "#5b5fef",
      emissiveIntensity: 2,
      roughness: 0.2,
      metalness: 0.3,
    }),
    []
  );

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.15,
      metalness: 0.05,
    }),
    []
  );

  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#2d2d30",
      roughness: 0.3,
      metalness: 0.4,
    }),
    []
  );

  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#5b5fef",
      roughness: 0.2,
      metalness: 0.5,
      emissive: "#5b5fef",
      emissiveIntensity: 0.4,
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.25;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.6) * 0.15;
      headRef.current.rotation.x = Math.sin(t * 0.5) * 0.08;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(t * 0.7) * 0.2 - 0.2;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(t * 0.7 + Math.PI) * 0.2 + 0.2;
    }
    if (eyeLeftRef.current && eyeRightRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.05;
      eyeLeftRef.current.scale.setScalar(s);
      eyeRightRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <RoundedBox args={[1.4, 1.3, 0.9]} radius={0.25} position={[0, 0.1, 0]} material={bodyMat}>
        <meshStandardMaterial {...bodyMat} />
      </RoundedBox>

      {/* Chest accent bar */}
      <RoundedBox args={[0.6, 0.08, 0.15]} radius={0.04} position={[0, 0.35, 0.5]}>
        <meshStandardMaterial {...accentMat} />
      </RoundedBox>

      {/* Chest circle detail */}
      <Sphere args={[0.12, 32, 32]} position={[0, 0.1, 0.55]}>
        <meshStandardMaterial {...accentMat} />
      </Sphere>

      {/* Head */}
      <group ref={headRef} position={[0, 0.95, 0]}>
        <RoundedBox args={[0.9, 0.75, 0.7]} radius={0.2}>
          <meshStandardMaterial {...bodyMat} />
        </RoundedBox>

        {/* Eyes */}
        <Sphere ref={eyeLeftRef} args={[0.1, 32, 32]} position={[-0.18, 0.08, 0.4]}>
          <meshStandardMaterial {...eyeMat} />
        </Sphere>
        <Sphere ref={eyeRightRef} args={[0.1, 32, 32]} position={[0.18, 0.08, 0.4]}>
          <meshStandardMaterial {...eyeMat} />
        </Sphere>

        {/* Mouth smile indicator */}
        <RoundedBox args={[0.25, 0.04, 0.05]} radius={0.02} position={[0, -0.15, 0.38]}>
          <meshStandardMaterial {...darkMat} />
        </RoundedBox>

        {/* Antenna */}
        <RoundedBox args={[0.06, 0.2, 0.06]} radius={0.03} position={[0, 0.5, 0]}>
          <meshStandardMaterial {...darkMat} />
        </RoundedBox>
        <Sphere args={[0.07, 32, 32]} position={[0, 0.63, 0]}>
          <meshStandardMaterial {...accentMat} />
        </Sphere>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.85, 0.25, 0]}>
        <RoundedBox args={[0.25, 0.9, 0.25]} radius={0.1} position={[0, -0.3, 0]}>
          <meshStandardMaterial {...bodyMat} />
        </RoundedBox>
        {/* Hand */}
        <Sphere args={[0.16, 32, 32]} position={[0, -0.8, 0]}>
          <meshStandardMaterial {...accentMat} />
        </Sphere>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.85, 0.25, 0]}>
        <RoundedBox args={[0.25, 0.9, 0.25]} radius={0.1} position={[0, -0.3, 0]}>
          <meshStandardMaterial {...bodyMat} />
        </RoundedBox>
        {/* Hand */}
        <Sphere args={[0.16, 32, 32]} position={[0, -0.8, 0]}>
          <meshStandardMaterial {...accentMat} />
        </Sphere>
      </group>

      {/* Legs */}
      <RoundedBox args={[0.35, 0.5, 0.3]} radius={0.12} position={[-0.3, -0.9, 0]}>
        <meshStandardMaterial {...darkMat} />
      </RoundedBox>
      <RoundedBox args={[0.35, 0.5, 0.3]} radius={0.12} position={[0.3, -0.9, 0]}>
        <meshStandardMaterial {...darkMat} />
      </RoundedBox>

      {/* Shadow disc */}
      <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

export default function AIRobot() {
  return (
    <div className="keal-robot-stage">
      <Canvas
        camera={{ position: [0, 0.5, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-3, 2, -3]} intensity={0.6} />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#5b5fef" />
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
          <RobotModel />
        </Float>
      </Canvas>
    </div>
  );
}
