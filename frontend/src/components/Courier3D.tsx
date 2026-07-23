import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Text,
  useProgress,
  Html,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────── */

type PackageStatus = "idle" | "loading" | "transit" | "delivered" | "error";

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  lastUpdate: string;
  checkpoints: { time: string; location: string; status: string }[];
}

/* ─── Shaders ───────────────────────────────────────────── */

const hologramVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const hologramFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel edge glow
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.5);
    fresnel = smoothstep(0.0, 1.0, fresnel);

    // Scan lines
    float scan1 = sin(vPosition.y * 30.0 - uTime * 2.0) * 0.5 + 0.5;
    float scan2 = sin(vPosition.y * 15.0 + uTime * 1.5) * 0.5 + 0.5;
    float scanLine = mix(scan1, scan2, 0.3);

    // Edge highlight
    float edge = 1.0 - abs(dot(normal, viewDir));
    edge = pow(edge, 6.0);

    float alpha = fresnel * 0.7 + edge * 0.3 + scanLine * 0.05;
    alpha *= uOpacity;

    vec3 color = mix(uColor, vec3(1.0), fresnel * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Environment Particles ─────────────────────────────── */

function Particles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += 0.0002;
    mesh.current.rotation.x += 0.0001;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#2997ff"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Hologram Ring ─────────────────────────────────────── */

function HologramRing({
  radius = 2.5,
  color = "#2997ff",
}: {
  radius?: number;
  color?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    ringRef.current.rotation.z += 0.003;
    ringRef.current.rotation.y += 0.002;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.003, 16, 100]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Glass Box Package ─────────────────────────────────── */

function GlassPackage({
  status,
  mouseOffset,
}: {
  status: PackageStatus;
  mouseOffset: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Glass shader material
  const glassMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: {
          value: new THREE.Color(
            status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"
          ),
        },
        uOpacity: { value: 0.25 },
      },
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, [status]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth mouse parallax rotation
    const targetRotY = mouseOffset.x * 0.8;
    const targetRotX = mouseOffset.y * 0.5;
    const targetRotZ = mouseOffset.x * 0.15;

    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.z += (targetRotZ - groupRef.current.rotation.z) * 0.05;

    // Gentle floating
    const floatY = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    groupRef.current.position.y = floatY;

    // Update shader time
    glassMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    // Hover scale pulse
    if (boxRef.current) {
      const targetScale = hovered ? 1.06 : 1.0;
      boxRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    // Glow pulse based on status
    if (glowRef.current) {
      const pulseIntensity =
        status === "transit"
          ? 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
          : status === "delivered"
          ? 0.6
          : status === "error"
          ? 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3
          : 0.3;
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = pulseIntensity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main glass box */}
      <group
        ref={boxRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Glass outer shell */}
        <RoundedBox args={[2, 1.3, 1]} radius={0.06} smoothness={4}>
          <shaderMaterial
            key={status}
            args={[
              {
                uniforms: {
                  uTime: { value: 0 },
                  uColor: {
                    value: new THREE.Color(
                      status === "delivered"
                        ? "#30d158"
                        : status === "error"
                        ? "#ff453a"
                        : "#2997ff"
                    ),
                  },
                  uOpacity: { value: 0.25 },
                },
                vertexShader: hologramVertexShader,
                fragmentShader: hologramFragmentShader,
                transparent: true,
                depthWrite: false,
                side: THREE.FrontSide,
              },
            ]}
          />
        </RoundedBox>

        {/* Inner box (metal frame) */}
        <RoundedBox args={[1.85, 1.15, 0.85]} radius={0.04} smoothness={4}>
          <meshPhysicalMaterial
            color="#1a1a1a"
            metalness={0.9}
            roughness={0.2}
            clearcoat={0.3}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.35}
            envMapIntensity={0.8}
          />
        </RoundedBox>

        {/* Tracking barcode line decoration */}
        <mesh position={[0, 0, 0.43]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.2, 0.8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
        </mesh>

        {/* Horizontal accent lines */}
        {[-0.2, 0, 0.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.44]}>
            <boxGeometry args={[1.0, 0.002, 0.001]} />
            <meshBasicMaterial
              color={status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer glow ring */}
      <mesh ref={glowRef}>
        <ringGeometry args={[1.8, 2.1, 64]} />
        <meshBasicMaterial
          color={status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Base platform ring */}
      <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.35, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Status indicator light on top */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.04, 32, 32]} />
        <meshBasicMaterial
          color={status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

/* ─── Status Text ───────────────────────────────────────── */

function StatusText({ status }: { status: PackageStatus }) {
  const getText = () => {
    switch (status) {
      case "idle":
        return "输入单号查询";
      case "loading":
        return "查找中...";
      case "transit":
        return "运输中";
      case "delivered":
        return "已签收";
      case "error":
        return "未找到";
    }
  };

  const getColor = () => {
    switch (status) {
      case "delivered":
        return "#30d158";
      case "error":
        return "#ff453a";
      default:
        return "#2997ff";
    }
  };

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5}>
      <Text
        position={[0, -1.3, 0]}
        fontSize={0.28}
        color={getColor()}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        {getText()}
      </Text>
    </Float>
  );
}

/* ─── Three Scene ───────────────────────────────────────── */

function Scene({
  status,
  mouseOffset,
}: {
  status: PackageStatus;
  mouseOffset: { x: number; y: number };
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        position={[-3, 2, 4]}
        intensity={0.8}
        color="#2997ff"
        distance={10}
      />
      <pointLight position={[3, -1, -2]} intensity={0.3} color="#ffffff" distance={8} />

      {/* Environment reflection */}
      <Environment preset="studio" environmentIntensity={0.4} />

      {/* Particles */}
      <Particles count={150} />

      {/* Hologram rings */}
      <HologramRing radius={2.8} color="#2997ff" />
      <HologramRing
        radius={2.8}
        color={
          status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"
        }
      />

      {/* Glass box */}
      <GlassPackage status={status} mouseOffset={mouseOffset} />

      {/* Status text */}
      <StatusText status={status} />

      {/* Ground shadow */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
      >
        <planeGeometry args={[6, 6]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

      {/* Colored ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial
          color={
            status === "delivered" ? "#30d158" : status === "error" ? "#ff453a" : "#2997ff"
          }
          transparent
          opacity={0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

/* ─── Loading Screen ────────────────────────────────────── */

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-xs tracking-widest uppercase">
          加载中 {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
}

/* ─── Tracking Panel ────────────────────────────────────── */

function TrackingPanel({
  info,
  isOpen,
  onClose,
}: {
  info: TrackingInfo | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!info) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-80 max-h-[80vh] overflow-y-auto glass rounded-3xl p-6 z-20"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M1 1L13 13M13 1L1 13" />
            </svg>
          </button>

          {/* Tracking number */}
          <p className="text-xs text-white/40 uppercase tracking-[0.15em] mb-1">
            快递单号
          </p>
          <p className="text-white text-lg font-semibold mb-6 tracking-wide">
            {info.trackingNumber}
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-6">
            <span
              className={`w-2 h-2 rounded-full ${
                info.status === "已签收"
                  ? "bg-[#30d158]"
                  : info.status === "异常"
                  ? "bg-[#ff453a]"
                  : "bg-[#2997ff]"
              }`}
            />
            <span className="text-sm text-white/80">{info.status}</span>
          </div>

          {/* Route */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-sm text-white/60">{info.origin}</span>
            </div>
            <div className="w-px h-6 bg-white/[0.08] ml-1" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#2997ff]" />
              <span className="text-sm text-white/60">{info.destination}</span>
            </div>
          </div>

          {/* Estimated delivery */}
          <div className="mb-6">
            <p className="text-xs text-white/40 uppercase tracking-[0.15em] mb-1">
              预计送达
            </p>
            <p className="text-white/80 text-sm">{info.estimatedDelivery}</p>
          </div>

          {/* Last update */}
          <div className="mb-6">
            <p className="text-xs text-white/40 uppercase tracking-[0.15em] mb-1">
              最近更新
            </p>
            <p className="text-white/80 text-sm">{info.lastUpdate}</p>
          </div>

          {/* Checkpoints timeline */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-[0.15em] mb-4">
              物流轨迹
            </p>
            <div className="space-y-4">
              {info.checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        i === 0 ? "bg-[#2997ff]" : "bg-white/[0.15]"
                      }`}
                    />
                    {i < info.checkpoints.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-white/80">{cp.status}</p>
                    <p className="text-xs text-white/40 mt-0.5">{cp.location}</p>
                    <p className="text-xs text-white/25 mt-0.5">{cp.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function Courier3D() {
  const [status, setStatus] = useState<PackageStatus>("idle");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Mouse parallax tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseOffset({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Mock tracking data
  const mockLookup = (num: string) => {
    setStatus("loading");
    setPanelOpen(false);

    setTimeout(() => {
      // Simulate different statuses based on number
      const n = parseInt(num.replace(/\D/g, "")) || 0;
      let newStatus: PackageStatus;
      let info: TrackingInfo;

      if (num.length < 6) {
        newStatus = "error";
        info = {
          trackingNumber: num,
          status: "未找到",
          origin: "—",
          destination: "—",
          estimatedDelivery: "—",
          lastUpdate: "—",
          checkpoints: [],
        };
      } else if (n % 3 === 0) {
        newStatus = "delivered";
        info = {
          trackingNumber: num,
          status: "已签收",
          origin: "上海浦东",
          destination: "北京朝阳",
          estimatedDelivery: "2026年6月22日 14:30",
          lastUpdate: "2026年6月22日 14:28 — 已签收",
          checkpoints: [
            {
              time: "06-22 14:28",
              location: "北京朝阳分拣中心",
              status: "已签收 — 本人签收",
            },
            {
              time: "06-22 08:15",
              location: "北京朝阳配送站",
              status: "派送中",
            },
            {
              time: "06-22 03:40",
              location: "北京转运中心",
              status: "已到达",
            },
            {
              time: "06-21 18:00",
              location: "上海浦东分拣中心",
              status: "已发出",
            },
            {
              time: "06-21 14:20",
              location: "上海浦东揽收点",
              status: "已揽收",
            },
          ],
        };
      } else {
        newStatus = "transit";
        info = {
          trackingNumber: num,
          status: "运输中",
          origin: "深圳南山",
          destination: "杭州西湖",
          estimatedDelivery: "2026年6月25日 18:00",
          lastUpdate: "2026年6月24日 10:32 — 运输中",
          checkpoints: [
            {
              time: "06-24 10:32",
              location: "广州转运中心",
              status: "运输中 — 已离开",
            },
            {
              time: "06-24 05:15",
              location: "广州转运中心",
              status: "已到达",
            },
            {
              time: "06-23 20:00",
              location: "深圳南山分拣中心",
              status: "已发出",
            },
            {
              time: "06-23 15:45",
              location: "深圳南山揽收点",
              status: "已揽收",
            },
          ],
        };
      }

      setStatus(newStatus);
      setTrackingInfo(info);

      // Auto open panel for non-error results
      if (newStatus !== "error" && newStatus !== "idle") {
        setTimeout(() => setPanelOpen(true), 800);
      }
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      mockLookup(trackingNumber.trim());
    }
  };

  const handleBoxClick = () => {
    if (trackingInfo && status !== "error" && status !== "idle" && status !== "loading") {
      setPanelOpen(!panelOpen);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* 3D Canvas */}
      <div className="absolute inset-0" onClick={handleBoxClick}>
        <Canvas
          camera={{ position: [0, 0.5, 6], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          dpr={[1, 2]}
          shadows
        >
          <Suspense fallback={<Loader />}>
            <Scene status={status} mouseOffset={mouseOffset} />
          </Suspense>
        </Canvas>
      </div>

      {/* Glass gradient overlays for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Search Input - floating at bottom */}
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSubmit}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3"
      >
        <div className="relative">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="输入快递单号"
            className="w-72 h-12 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-full px-6 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.1] transition-all duration-500 tracking-wider"
          />
          {/* Glow effect on focus */}
          <div className="absolute inset-0 rounded-full opacity-0 focus-within:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-[-1px] rounded-full bg-gradient-to-r from-[#2997ff]/20 via-transparent to-[#2997ff]/20 blur-sm" />
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.15] hover:border-white/[0.2] transition-all duration-500"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </motion.button>
      </motion.form>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-[0.2em]"
      >
        {status === "idle"
          ? "点击包裹查看更多"
          : status === "loading"
          ? ""
          : "点击包裹查看物流详情"}
      </motion.p>

      {/* Tracking panel */}
      <TrackingPanel
        info={trackingInfo}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* Subtle corner branding */}
      <div className="absolute top-8 left-8 z-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/20 text-xs tracking-[0.3em] uppercase"
        >
          Keal Space
        </motion.p>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-2 border-[#2997ff]/30 border-t-[#2997ff]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
