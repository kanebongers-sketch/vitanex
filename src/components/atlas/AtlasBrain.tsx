'use client'

import { useRef, useMemo, useEffect, MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { STRUCTURES } from '@/data/brainStructures'
import { buildSurfacePoints } from './brainDisplace'

// ── GLSL shaders ─────────────────────────────────────────────────────────────

const VERTEX = /* glsl */`
varying vec3  vBrainPos;
varying vec3  vWorldPos;
varying vec3  vNorm;
varying float vFold;

// abs(sin)*abs(cos) creates rounded gyri ridges with narrow sulci valleys
float gyriPattern(vec3 n) {
  // Layer 1: primary gyri — 4-5 large ridges per lobe
  float g1 = abs(sin(n.x * 3.4 + n.z * 2.2 + n.y * 0.8)) *
             abs(cos(n.y * 4.7 + n.x * 1.9 + n.z * 0.5));

  // Layer 2: secondary gyri — 7-9 medium ridges
  float g2 = abs(sin(n.x * 7.8 + n.z * 6.1 + n.y * 2.4)) *
             abs(cos(n.y * 8.9 + n.z * 7.3 + n.x * 3.6));

  // Layer 3: fine tertiary sulci texture
  float g3 = sin(n.x * 15.2 + n.z * 12.8 + n.y * 6.1) *
             cos(n.y * 17.3 + n.x * 9.7  + n.z * 13.4);

  return g1 * 0.20 + g2 * 0.11 + g3 * 0.038;
}

void main() {
  // Realistic brain proportions: wider than tall, elongated anterior-posterior
  vec3 b = vec3(position.x * 1.35, position.y * 0.82, position.z * 1.02);
  float bl = length(b);
  vec3 n = b / max(bl, 0.001);

  // Inferior surface flattening (brain base sits flat)
  b.y -= max(0.0, -n.y - 0.05) * 0.28;

  // Interhemispheric fissure — deep median sagittal groove along vertex
  float topRegion = max(0.0, n.y - 0.08);
  float fis = topRegion * (0.92 - 0.30 * n.z * n.z) * exp(-n.x * n.x / 0.011) * 0.72;

  // Temporal pole bulge — lateral protrusion below equator (visible from sides)
  float tBulge = smoothstep(0.48, 0.90, abs(n.x)) *
                 smoothstep(0.38, -0.28, n.y) * 0.22;
  b.x += sign(b.x) * tBulge;

  float fold = gyriPattern(n * 2.8);

  vFold     = fold;
  vBrainPos = b + n * (fold - fis);
  vNorm     = normalize(n);
  vec4 worldP = modelMatrix * vec4(vBrainPos, 1.0);
  vWorldPos   = worldP.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldP;
}
`

const FRAGMENT = /* glsl */`
uniform vec3  uRegionPos;
uniform vec3  uRegionColor;
uniform float uRegionRadius;
uniform float uTime;
uniform float uTransition;

varying vec3  vBrainPos;
varying vec3  vWorldPos;
varying vec3  vNorm;
varying float vFold;

void main() {
  vec3 base = vec3(0.030, 0.095, 0.195);

  // Fake directional light — creates depth perception without Three.js lights
  vec3  lightDir = normalize(vec3(-0.45, 0.75, 0.65));
  float diffuse  = clamp(dot(vNorm, lightDir), 0.0, 1.0);

  // Ridge/sulci contrast: peaks bright, valleys dark
  float fNorm     = clamp((vFold + 0.04) / 0.32, 0.0, 1.0);
  float ridgeBright = smoothstep(0.42, 1.0, fNorm) * 0.58;
  float sulciDark   = (1.0 - smoothstep(0.0, 0.55, fNorm)) * 0.42;

  // Region highlight in local brain space
  float dist = length(vBrainPos - uRegionPos);
  float hl   = (1.0 - smoothstep(uRegionRadius * 0.30, uRegionRadius * 1.35, dist)) * uTransition;
  float pulse = sin(uTime * 3.5) * 0.5 + 0.5;

  // Fresnel edge glow
  vec3  viewDir = normalize(cameraPosition - vWorldPos);
  float ndotv   = max(dot(vNorm, viewDir), 0.0);
  float fresnel  = pow(1.0 - ndotv, 2.8);

  // Base with diffuse shading, ridge contrast, region highlight
  vec3 baseShaded = base * (0.32 + 0.68 * diffuse);
  vec3 col = mix(baseShaded, uRegionColor * 0.68, hl);
  col += ridgeBright * vec3(0.05, 0.20, 0.44);              // gyri peak brightening
  col  = max(vec3(0.0), col - sulciDark * vec3(0.01, 0.04, 0.09)); // sulci shadowing
  col += uRegionColor * hl * pulse * 0.22;                   // region pulse
  col += vec3(0.03, 0.11, 0.28) * fresnel * 0.55;           // cool silhouette glow
  col += uRegionColor * fresnel * hl * 0.38;                  // colored region edge

  gl_FragColor = vec4(col, 1.0);
}
`

// ── BrainMesh ─────────────────────────────────────────────────────────────────

interface BrainMeshProps {
  activeIdx: number
  transitionRef: MutableRefObject<number>
}

function BrainMesh({ activeIdx, transitionRef }: BrainMeshProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uRegionPos:    { value: new THREE.Vector3(...STRUCTURES[0].regionPos) },
    uRegionColor:  { value: new THREE.Color(STRUCTURES[0].color) },
    uRegionRadius: { value: STRUCTURES[0].regionRadius },
    uTime:         { value: 0 },
    uTransition:   { value: 0 },
  }), [])

  useFrame((state) => {
    if (!matRef.current) return
    const u = matRef.current.uniforms
    u.uTime.value = state.clock.elapsedTime

    const s = STRUCTURES[activeIdx]
    u.uRegionPos.value.set(...s.regionPos)
    u.uRegionColor.value.set(s.color)
    u.uRegionRadius.value = s.regionRadius

    transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, 1, 0.04)
    u.uTransition.value = transitionRef.current
  })

  return (
    <mesh>
      <icosahedronGeometry args={[1.0, 5]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  )
}

// ── Particles ─────────────────────────────────────────────────────────────────

interface ParticlesProps {
  activeIdx: number
}

function Particles({ activeIdx }: ParticlesProps) {
  const ptsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  const positions = useMemo(() => buildSurfacePoints(1200), [])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    matRef.current.color.set(STRUCTURES[activeIdx].color)
    matRef.current.opacity = 0.45 + Math.sin(t * 2.3) * 0.25
    if (ptsRef.current) {
      ptsRef.current.rotation.y = Math.sin(t * 0.05) * 0.04
    }
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  return (
    <points ref={ptsRef} geometry={geo}>
      <pointsMaterial
        ref={matRef}
        size={0.016}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        color={STRUCTURES[0].color}
      />
    </points>
  )
}

// ── CameraRig ─────────────────────────────────────────────────────────────────

interface CameraRigProps {
  scrollRef: MutableRefObject<number>
  activeIdx: number
  transitionRef: MutableRefObject<number>
}

function CameraRig({ scrollRef, activeIdx, transitionRef }: CameraRigProps) {
  const targetPos    = useMemo(() => new THREE.Vector3(), [])
  const targetLookAt = useMemo(() => new THREE.Vector3(), [])
  const currentLook  = useMemo(() => new THREE.Vector3(0, 0.2, 0), [])
  const mouseRef     = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  useFrame((state, delta) => {
    const s = STRUCTURES[activeIdx]
    targetPos.set(
      s.cameraPos[0] + mouseRef.current.x * 0.20,
      s.cameraPos[1] - mouseRef.current.y * 0.12,
      s.cameraPos[2],
    )
    targetLookAt.set(...s.cameraTarget)

    const t = 1 - Math.exp(-delta * 2.2)
    state.camera.position.lerp(targetPos, t)
    currentLook.lerp(targetLookAt, t * 1.3)
    state.camera.lookAt(currentLook)

    const cam = state.camera as THREE.PerspectiveCamera
    cam.fov = THREE.MathUtils.lerp(cam.fov, s.cameraFov, t)
    cam.updateProjectionMatrix()

  })

  return null
}

// ── Lights ────────────────────────────────────────────────────────────────────

function Lights() {
  const rimRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!rimRef.current) return
    const t = state.clock.elapsedTime
    rimRef.current.position.set(
      -3.8 * Math.cos(t * 0.22),
      0.5 + Math.sin(t * 0.35) * 0.8,
      -2.8 * Math.sin(t * 0.22),
    )
  })

  return (
    <>
      <ambientLight color="#061525" intensity={8} />
      <directionalLight position={[3, 4, 2]} intensity={4} color="#a8dff8" />
      <pointLight ref={rimRef} color="#00d4ff" intensity={12} distance={14} />
      <pointLight position={[1, -4, 2]} color="#4428ee" intensity={5} distance={10} />
      <pointLight position={[0, 0.5, 4]} color="#5ab8d4" intensity={2.5} distance={8} />
    </>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

interface SceneProps {
  scrollRef: MutableRefObject<number>
  activeIdx: number
}

function Scene({ scrollRef, activeIdx }: SceneProps) {
  const transitionRef = useRef(0)
  const prevIdx = useRef(activeIdx)

  // Reset transition to 0 when region changes so the new region fades in
  useEffect(() => {
    if (prevIdx.current !== activeIdx) {
      transitionRef.current = 0
      prevIdx.current = activeIdx
    }
  }, [activeIdx])

  return (
    <>
      <Lights />
      <BrainMesh activeIdx={activeIdx} transitionRef={transitionRef} />
      <Particles activeIdx={activeIdx} />
      <CameraRig scrollRef={scrollRef} activeIdx={activeIdx} transitionRef={transitionRef} />
      <EffectComposer>
        <Bloom intensity={0.75} radius={0.4} luminanceThreshold={0.42} />
      </EffectComposer>
    </>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

interface AtlasBrainProps {
  scrollRef: MutableRefObject<number>
  activeIdx: number
}

export default function AtlasBrain({ scrollRef, activeIdx }: AtlasBrainProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.6], fov: 52, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene scrollRef={scrollRef} activeIdx={activeIdx} />
    </Canvas>
  )
}
