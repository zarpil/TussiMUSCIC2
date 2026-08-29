import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vElevation;
  varying float vDistort;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float t = uTime;
    float s = uScroll;
    
    // Fast-moving primary waves
    float wave1 = sin(pos.x * 1.2 + t * 1.8 + s * 0.6) * (0.5 + sin(t * 0.3) * 0.2);
    float wave2 = cos(pos.x * 0.7 + t * 1.4 - s * 0.4) * (0.6 + cos(t * 0.25) * 0.15);
    float wave3 = sin(pos.x * 2.5 + pos.y * 1.5 + t * 2.2) * 0.15;
    float wave4 = cos(pos.y * 2.0 + t * 1.6 + pos.x * 0.8) * 0.3;
    float wave5 = sin(pos.x * 0.4 + pos.y * 0.6 + t * 0.9 + s * 0.8) * 0.4;
    
    // Scroll-driven distortion — gets wilder as you scroll
    float scrollDistort = sin(pos.x * 2.0 + s * 3.0) * cos(pos.y * 1.5 + s * 2.0) * s * 0.06;
    
    // Mouse push
    float dx = pos.x * 0.15 - uMouse.x;
    float dy = pos.y * 0.15 - uMouse.y;
    float mouseDist = exp(-3.0 * (dx * dx + dy * dy));
    float mouseWarp = mouseDist * 0.6 * sin(t * 3.0);
    
    float elevation = wave1 + wave2 + wave3 + wave4 + wave5 + scrollDistort + mouseWarp;
    pos.z += elevation;
    vElevation = elevation;
    vDistort = scrollDistort;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 uColorTint;
  varying vec2 vUv;
  varying float vElevation;
  varying float vDistort;
  
  vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }
  
  void main() {
    float t = uTime;
    float s = uScroll;
    float phase = s / 8.0; // 0..1 over full scroll
    
    // Animated UV for flowing color
    float flowUv = vUv.x * 1.5 + sin(t * 0.4) * 0.4 + cos(t * 0.3 + vUv.y * 2.0) * 0.2;
    
    // 3 aurora types that morph between each other
    // Type 1: Classic green/teal northern lights
    vec3 c1 = pal(flowUv, 
      vec3(0.05, 0.6, 0.45), vec3(0.3, 0.5, 0.35),
      vec3(1.0, 1.0, 0.5), vec3(0.0, 0.1, 0.2));
    
    // Type 2: Deep space purple/cyan nebula
    vec3 c2 = pal(flowUv + phase * 0.5,
      vec3(0.35, 0.1, 0.55), vec3(0.45, 0.35, 0.5),
      vec3(0.8, 0.6, 1.0), vec3(0.15, 0.0, 0.35));
    
    // Type 3: Solar fire — magenta/amber
    vec3 c3 = pal(flowUv + phase,
      vec3(0.55, 0.15, 0.25), vec3(0.5, 0.35, 0.25),
      vec3(1.0, 0.7, 0.5), vec3(0.0, 0.05, 0.15));
    
    // Smooth 3-way crossfade
    float p = phase * 2.0;
    vec3 color;
    if (p < 1.0) {
      color = mix(c1, c2, smoothstep(0.0, 1.0, p));
    } else {
      color = mix(c2, c3, smoothstep(1.0, 2.0, p));
    }
    
    // Pulsing intensity
    float pulse = 0.75 + 0.25 * sin(t * 1.2 + vUv.x * 6.0);
    float vertFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
    float flicker = 0.7 + 0.3 * sin(t * 4.0 + vUv.x * 15.0) * cos(t * 2.5 + vUv.y * 10.0);
    float elevGlow = smoothstep(-0.5, 1.2, vElevation);
    
    float alpha = elevGlow * vertFade * flicker * pulse * 0.75;
    
    // Bloom
    vec3 glow = color * (1.2 + vElevation * 0.5 + phase * 0.15) * uColorTint;
    
    gl_FragColor = vec4(glow, alpha);
  }
`;

let globalScroll = 0;
let globalMouse = { x: 0, y: 0 };

function AuroraCurtain({ yPos, xPos, zPos, rotX, rotY, scale, timeScale, timeOffset, isMobile, tintColor }: {
  yPos: number; xPos: number; zPos: number; rotX: number; rotY: number;
  scale: [number, number]; timeScale: number; timeOffset: number; isMobile: boolean;
  tintColor: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseY = useRef(yPos);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorTint: { value: new THREE.Vector3(1, 1, 1) }
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t * timeScale + timeOffset;
    uniforms.uScroll.value = globalScroll;
    uniforms.uMouse.value.set(globalMouse.x, globalMouse.y);
    uniforms.uColorTint.value.set(tintColor[0], tintColor[1], tintColor[2]);

    if (meshRef.current) {
      meshRef.current.position.y = baseY.current - globalScroll * 0.4 + Math.sin(t * 0.3 + timeOffset) * 0.15;
      meshRef.current.position.x = xPos + Math.sin(t * 0.15 + timeOffset) * 0.3;
      meshRef.current.rotation.z = Math.sin(t * 0.25 + timeOffset) * 0.04 + globalScroll * 0.008;
      meshRef.current.rotation.x = rotX + Math.sin(globalScroll * 0.25 + timeOffset + t * 0.1) * 0.06;
      const s = 1 + Math.sin(t * 0.2 + globalScroll * 0.3 + timeOffset) * 0.06;
      meshRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={[xPos, yPos, zPos]} rotation={[rotX, rotY, 0]}>
      <planeGeometry args={[scale[0], scale[1], isMobile ? 60 : 160, isMobile ? 30 : 90]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Stars() {
  const count = 1500;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = -5 - Math.random() * 15;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = -globalScroll * 0.12;
      ref.current.rotation.z = state.clock.elapsedTime * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function ScrollTracker() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, globalMouse.x * 0.4, 0.025);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, globalMouse.y * 0.25, 0.025);
    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = THREE.MathUtils.lerp(cam.fov, 65 + globalScroll * 0.6, 0.03);
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

const getRgbFromHex = (hex: string): [number, number, number] => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 1 : r, isNaN(g) ? 1 : g, isNaN(b) ? 1 : b];
};

const getTintColor = (colorType: string, customHex: string): [number, number, number] => {
  switch (colorType) {
    case 'green':
      return [1.8, 0.4, 1.2]; // Neon Pink / Magenta tint
    case 'purple':
      return [1.5, 0.5, 1.8];
    case 'red':
      return [1.8, 0.4, 0.8];
    case 'cyan':
      return [0.8, 1.2, 1.8];
    case 'custom':
      return getRgbFromHex(customHex || '#ff2d87');
    default:
      return [1.8, 0.4, 1.2];
  }
};

export default function AuroraBackground() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [bgSettings, setBgSettings] = useState({
    bgType: 'aurora',
    bgColor: '#0e0714',
    bgUrl: '',
    auroraColor: 'purple',
    auroraCustomColor: '#ff2d87'
  });

  useEffect(() => {
    // Add custom theme class to HTML/Body elements on mount
    document.documentElement.classList.add('aurora-theme-active');
    return () => {
      document.documentElement.classList.remove('aurora-theme-active');
    };
  }, []);

  const fetchSettings = useCallback(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBgSettings({
            bgType: data.bgType || 'aurora',
            bgColor: data.bgColor || '#0a0a1a',
            bgUrl: data.bgUrl || '',
            auroraColor: data.auroraColor || 'green',
            auroraCustomColor: data.auroraCustomColor || '#10b981'
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSettings();
    window.addEventListener('site-settings-updated', fetchSettings);
    return () => {
      window.removeEventListener('site-settings-updated', fetchSettings);
    };
  }, [fetchSettings]);

  const handleScroll = useCallback(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    globalScroll = maxScroll > 0 ? (window.scrollY / maxScroll) * 8 : 0;
  }, []);

  const handleMouse = useCallback((e: MouseEvent) => {
    globalMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    globalMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (!isMobile) window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [handleScroll, handleMouse, isMobile]);

  // Render based on background type
  if (bgSettings.bgType === 'solid') {
    return (
      <div 
        className="fixed inset-0 -z-10 transition-colors duration-500" 
        style={{ backgroundColor: bgSettings.bgColor }} 
      />
    );
  }

  if (bgSettings.bgType === 'image' || bgSettings.bgType === 'gif') {
    return (
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-all duration-500" 
        style={{ backgroundImage: bgSettings.bgUrl ? `url(${bgSettings.bgUrl})` : 'none', backgroundColor: '#030308' }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>
    );
  }

  // Otherwise, default to WebGL Canvas Aurora curtains
  const tint = getTintColor(bgSettings.auroraColor, bgSettings.auroraCustomColor);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 65 }}
        gl={{ antialias: !isMobile, alpha: true }}
        style={{ background: "linear-gradient(180deg, #030308 0%, #060614 30%, #0a0a1a 60%, #050510 100%)" }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
      >
        <ScrollTracker />
        <Stars />
        <AuroraCurtain yPos={3} xPos={-1} zPos={-2.5} rotX={-0.3} rotY={0.05} scale={[20, 7]} timeScale={1} timeOffset={0} isMobile={isMobile} tintColor={tint} />
        <AuroraCurtain yPos={1} xPos={2.5} zPos={-4} rotX={-0.2} rotY={-0.15} scale={[18, 6]} timeScale={0.8} timeOffset={3} isMobile={isMobile} tintColor={tint} />
        {!isMobile && <AuroraCurtain yPos={-1.5} xPos={-2} zPos={-3.5} rotX={-0.15} rotY={0.1} scale={[22, 8]} timeScale={0.9} timeOffset={7} isMobile={isMobile} tintColor={tint} />}
        <AuroraCurtain yPos={-4} xPos={1.5} zPos={-5} rotX={-0.1} rotY={-0.1} scale={[16, 6]} timeScale={0.65} timeOffset={11} isMobile={isMobile} tintColor={tint} />
        {!isMobile && <AuroraCurtain yPos={-7} xPos={-1} zPos={-3} rotX={-0.25} rotY={0.05} scale={[20, 7]} timeScale={0.75} timeOffset={15} isMobile={isMobile} tintColor={tint} />}
      </Canvas>
    </div>
  );
}
