import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type OrbPhase = 
  | 'idle' 
  | 'typing' 
  | 'texting' 
  | 'listening' 
  | 'processing' 
  | 'responding' 
  | 'error' 
  | 'observing' 
  | 'analyzing' 
  | 'talking' 
  | 'suggesting' 
  | 'auto' 
  | 'directAction';

export interface HoloOrbProps {
  phase?: OrbPhase;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero' | string;
  className?: string;
  onClick?: () => void;
  showStatusLabel?: boolean;
  statusLabelPosition?: 'bottom' | 'right' | 'top';
}

// 3D Perlin Noise Shader
const noiseGLSL = /* glsl */ `
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(
      mix(dot(hash3(i), f), dot(hash3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0)), u.x),
      mix(dot(hash3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), dot(hash3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0)), u.x),
      u.y
    ),
    mix(
      mix(dot(hash3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), dot(hash3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1)), u.x),
      mix(dot(hash3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), dot(hash3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1)), u.x),
      u.y
    ),
    u.z
  );
}

float fbm(vec3 p) {
  return noise3(p) * 0.57 + noise3(p * 2.03 + 3.1) * 0.28 + noise3(p * 4.07 + 7.4) * 0.15;
}
`;

const vertexShader = /* glsl */ `
uniform float uTime, uTurbulence, uPulse, uHover, uFlowDirection;
uniform vec2 uPointer;
varying vec3 vPosition, vNormal, vView;
${noiseGLSL}

void main() {
  vec3 n = normalize(position);
  float flow = fbm(n * 3.6 + vec3(uTime * 0.18 * uFlowDirection, -uTime * 0.22, uTime * 0.11));
  vec3 pull = vec3(uPointer * 0.85, 0.8);
  float attraction = exp(-length(n.xy - uPointer * 0.75) * 3.2) * uHover;
  vec3 p = position * (1.0 + flow * uTurbulence * 0.32 + sin(uTime * uPulse) * 0.035);
  p += pull * attraction * 0.2;
  p.xy += vec2(-n.y, n.x) * flow * uHover * 0.14;
  vPosition = p;
  vNormal = normalize(normalMatrix * n);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vView = -view.xyz;
  gl_Position = projectionMatrix * view;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime, uTurbulence, uPulse, uHover;
uniform vec2 uPointer;
uniform vec3 uElectricCyan, uPlasmaViolet, uSapphireBlue;
varying vec3 vPosition, vNormal, vView;
${noiseGLSL}

void main() {
  vec3 p = normalize(vPosition);
  vec3 q = p * 3.2 + vec3(uTime * 0.14, -uTime * 0.2, uTime * 0.1);
  q.xy += uPointer * uHover * 0.35;
  float n = fbm(q + fbm(q + 2.8) * (1.5 + uTurbulence));
  float ribbon = pow(1.0 - abs(sin(p.y * 11.0 + p.x * 3.2 + n * 8.5 - uTime * 0.8)), 10.0);
  float fine = pow(1.0 - abs(sin(p.y * 24.0 - n * 14.0 + uTime * 0.45)), 22.0);
  float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
  float rim = pow(1.0 - facing, 2.6);
  float core = pow(facing, 6.8) * (0.45 + 0.18 * sin(uTime * uPulse));
  float tint = clamp(n * 2.3 + p.x * 0.5 + 0.5, 0.0, 1.0);

  vec3 energy = mix(uSapphireBlue, uPlasmaViolet, tint);
  energy = mix(energy, uElectricCyan, smoothstep(0.18, 0.72, p.x + n) * 0.9);

  vec3 col = energy * (0.09 + ribbon * 1.9 + fine * 0.5 + rim * 0.9);
  col += uElectricCyan * core * 1.4 + mix(uElectricCyan, uPlasmaViolet, 0.45) * pow(facing, 20.0) * 0.75;

  gl_FragColor = vec4(col, 0.84 + ribbon * 0.16);
}
`;

const particleVertex = /* glsl */ `
uniform float uTime, uPulse, uParticleConvergence;
attribute float aSeed;
varying float vSeed;

void main() {
  vSeed = aSeed;
  vec3 p = position;
  float angle = uTime * (0.24 + aSeed * 0.35);
  float c = cos(angle), s = sin(angle);
  p.xz = mat2(c, -s, s, c) * p.xz;

  // Particle convergence: in processing/thinking, particles pull inward
  // in responding/talking, particles ripple outward
  p *= 1.0 + (sin(uTime * uPulse + aSeed * 6.28) * 0.06) + uParticleConvergence * 0.15;

  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = (1.6 + aSeed * 2.4) * (3.8 / -view.z);
}
`;

const particleFragment = /* glsl */ `
uniform vec3 uElectricCyan, uPlasmaViolet;
varying float vSeed;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  vec3 c = mix(uPlasmaViolet, uElectricCyan, vSeed);
  gl_FragColor = vec4(c, (1.0 - smoothstep(0.05, 0.5, d)) * 0.95);
}
`;

export const HoloOrb: React.FC<HoloOrbProps> = ({
  phase = 'idle',
  size = 'md',
  className = '',
  onClick,
  showStatusLabel = false,
  statusLabelPosition = 'bottom',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  const sizeStyles: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-20 h-20',
    hero: 'w-48 h-48 sm:w-56 sm:h-56',
  };

  const resolvedSizeClass = className.includes('w-') && className.includes('h-') 
    ? '' 
    : (sizeStyles[size] || 'w-11 h-11');

  // Map any phase to the 4 Primary States:
  // State A: 'idle'
  // State B: 'listening' | 'typing' (Focused Input)
  // State C: 'processing' | 'analyzing' (Thinking / Processing)
  // State D: 'responding' | 'talking' (Responding / Communicating)
  const getPrimaryStateLabel = (): string => {
    switch (phase) {
      case 'typing':
        return 'Typing...';
      case 'listening':
        return 'Listening...';
      case 'processing':
      case 'analyzing':
        return 'Thinking...';
      case 'responding':
      case 'talking':
        return 'Responding...';
      case 'error':
        return 'Recovering...';
      case 'observing':
        return 'Scanning...';
      case 'auto':
      case 'directAction':
        return 'Auto-Pilot...';
      case 'idle':
      default:
        return 'Ready';
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = 4.2;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const width = container.clientWidth || 44;
      const height = container.clientHeight || 44;
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const uElectricCyan = new THREE.Color('#00f2fe');
      const uPlasmaViolet = new THREE.Color('#7f00ff');
      const uSapphireBlue = new THREE.Color('#0575e6');

      const uniforms = {
        uTime: { value: 0 },
        uTurbulence: { value: 0.14 },
        uPulse: { value: 1.0 },
        uHover: { value: 0 },
        uFlowDirection: { value: 1.0 },
        uParticleConvergence: { value: 0.0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uElectricCyan: { value: uElectricCyan },
        uPlasmaViolet: { value: uPlasmaViolet },
        uSapphireBlue: { value: uSapphireBlue },
      };

      const geometry = new THREE.SphereGeometry(1, 44, 32);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
      });
      const orbMesh = new THREE.Mesh(geometry, material);

      const particleCount = 420;
      const positions = new Float32Array(particleCount * 3);
      const seeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const y = 1 - 2 * (i + 0.5) / particleCount;
        const radius = Math.sqrt(1 - y * y);
        const angle = i * 2.3999632;
        const shell = 1.08 + 0.18 * (0.5 + 0.5 * Math.sin(i * 18.31));
        positions[i * 3] = Math.cos(angle) * radius * shell;
        positions[i * 3 + 1] = y * shell;
        positions[i * 3 + 2] = Math.sin(angle) * radius * shell;
        seeds[i] = (i * 0.6180339) % 1;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

      const particleMat = new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const particleMesh = new THREE.Points(particleGeo, particleMat);

      const group = new THREE.Group();
      group.add(orbMesh);
      group.add(particleMesh);
      scene.add(group);

      const targetPointer = new THREE.Vector2(0, 0);
      const currentPointer = new THREE.Vector2(0, 0);
      let targetHover = 0;
      let currentHover = 0;

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const rect = container.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        targetPointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
        targetPointer.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
        targetHover = 1.6;
      };

      const handlePointerLeave = () => {
        targetPointer.set(0, 0);
        targetHover = 0;
      };

      container.addEventListener('mousemove', handlePointerMove);
      container.addEventListener('mouseleave', handlePointerLeave);
      container.addEventListener('touchmove', handlePointerMove);
      container.addEventListener('touchend', handlePointerLeave);

      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);

        let speedMultiplier = 1.0;
        let targetTurbulence = 0.18;
        let targetPulse = 1.2;
        let targetConvergence = 0.0;
        let targetRotationSpeed = 0.45;

        // --- 4 PRIMARY ORB ANIMATION STATES ---
        if (phase === 'idle') {
          // STATE A — IDLE:
          // Rotates slowly & smoothly, small particles drift gently, calm & ready
          speedMultiplier = 0.38;
          targetTurbulence = 0.08;
          targetPulse = 0.9;
          targetConvergence = 0.0;
          targetRotationSpeed = 0.32;
        } else if (phase === 'listening' || phase === 'typing') {
          // STATE B — LISTENING / INPUT:
          // Reduced/paused large orbital rotation, focused & attentive, gentle rhythmic pulse
          speedMultiplier = 0.45;
          targetTurbulence = 0.22;
          targetPulse = 2.4; // steady attentive heartbeat
          targetConvergence = -0.05;
          targetRotationSpeed = 0.12; // slow orbital rotation to show focused stillness
        } else if (phase === 'processing' || phase === 'analyzing') {
          // STATE C — THINKING / PROCESSING:
          // Gradually increased rotational energy, particles gather/flow inward, subtle pulse shimmers
          speedMultiplier = 2.6;
          targetTurbulence = 0.62;
          targetPulse = 4.2;
          targetConvergence = -0.22; // particles pull inward toward the orb core
          targetRotationSpeed = 1.4;
        } else if (phase === 'responding' || phase === 'talking') {
          // STATE D — RESPONDING:
          // Outward ripple, flowing particle pattern, controlled expansion communicating outward
          speedMultiplier = 2.0;
          targetTurbulence = 0.44;
          targetPulse = 5.2; // outward projection cadence
          targetConvergence = 0.18; // outward particle bloom
          targetRotationSpeed = 0.85;
        } else if (phase === 'error') {
          // Transient Error / Recovery
          speedMultiplier = 1.2;
          targetTurbulence = 0.35;
          targetPulse = 3.0;
          targetRotationSpeed = 0.2;
        } else {
          // Additional specialized states (observing, auto-pilot)
          speedMultiplier = 1.4;
          targetTurbulence = 0.25;
          targetPulse = 2.0;
          targetRotationSpeed = 0.6;
        }

        if (prefersReducedMotion) {
          speedMultiplier *= 0.3;
          targetRotationSpeed *= 0.3;
        }

        uniforms.uTime.value += delta * speedMultiplier;
        uniforms.uTurbulence.value += (targetTurbulence - uniforms.uTurbulence.value) * 0.12;
        uniforms.uPulse.value += (targetPulse - uniforms.uPulse.value) * 0.12;
        uniforms.uParticleConvergence.value += (targetConvergence - uniforms.uParticleConvergence.value) * 0.12;

        currentPointer.lerp(targetPointer, 0.12);
        currentHover += (targetHover - currentHover) * 0.12;
        uniforms.uPointer.value.copy(currentPointer);
        uniforms.uHover.value = currentHover;

        group.rotation.y += delta * targetRotationSpeed;
        group.rotation.x += delta * 0.12;

        renderer?.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 44;
        const h = container.clientHeight || 44;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousemove', handlePointerMove);
        container.removeEventListener('mouseleave', handlePointerLeave);
        container.removeEventListener('touchmove', handlePointerMove);
        container.removeEventListener('touchend', handlePointerLeave);
        if (renderer?.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        renderer?.dispose();
      };
    } catch (err) {
      console.warn('ThreeJS WebGL context init notice:', err);
      setHasWebGL(false);
    }
  }, [phase]);

  const statusLabel = getPrimaryStateLabel();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`OmniAI Living Orb: Status ${statusLabel}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative inline-flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } transition-transform ${resolvedSizeClass} ${className}`}
      title={`OmniAI Living Orb — ${statusLabel}`}
    >
      {/* Dynamic glow halo tuned to 4 primary states */}
      <div 
        className={`absolute inset-0 rounded-full bg-[#000000] transition-all duration-500 border ${
          phase === 'processing' || phase === 'analyzing'
            ? 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.5),0_0_35px_rgba(0,242,254,0.3)] animate-pulse'
            : phase === 'responding' || phase === 'talking'
            ? 'border-[#00f2fe] shadow-[0_0_24px_rgba(0,242,254,0.6),0_0_40px_rgba(127,0,255,0.4)]'
            : phase === 'listening'
            ? 'border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.5)]'
            : phase === 'typing'
            ? 'border-cyan-400/70 shadow-[0_0_14px_rgba(0,242,254,0.4)]'
            : phase === 'error'
            ? 'border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.4)]'
            : 'border-[#00f2fe]/40 shadow-[0_0_14px_rgba(0,242,254,0.25),0_0_20px_rgba(127,0,255,0.18)]'
        }`}
      />

      {/* 3D WebGL Canvas */}
      {hasWebGL ? (
        <div ref={containerRef} className="w-full h-full relative z-10 rounded-full overflow-hidden" />
      ) : (
        <div className="w-full h-full rounded-full bg-[#000000] border border-[#00f2fe]/60 flex items-center justify-center relative z-10">
          <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-tr from-[#0575e6] via-[#7f00ff] to-[#00f2fe] animate-pulse" />
        </div>
      )}

      {/* Active Phase Ping Badge for High Attention States */}
      {(phase === 'processing' || phase === 'analyzing') && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-85" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
        </span>
      )}
      {(phase === 'responding' || phase === 'talking') && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-85" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00f2fe]" />
        </span>
      )}

      {/* Accessible visual status label */}
      {showStatusLabel && (
        <span 
          className={`absolute text-[9px] font-mono tracking-wider whitespace-nowrap drop-shadow-[0_0_6px_rgba(0,242,254,0.6)] z-20 pointer-events-none ${
            statusLabelPosition === 'bottom'
              ? '-bottom-5 left-1/2 -translate-x-1/2 text-[#00f2fe]'
              : statusLabelPosition === 'right'
              ? 'left-full ml-2 text-[#00f2fe]'
              : '-top-5 left-1/2 -translate-x-1/2 text-[#00f2fe]'
          }`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
};
