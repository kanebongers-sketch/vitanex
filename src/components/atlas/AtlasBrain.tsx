'use client'

import { useRef, useMemo, useEffect, MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { STRUCTURES } from '@/data/brainStructures'
import { buildSurfacePoints } from './brainDisplace'

// ── GLSL shaders ─────────────────────────────────────────────────────────────

const VERTEX = /* glsl */`
varying vec3 vBrainPos;
varying vec3 vWorldPos;
varying vec3 vNorm;

float foldNoise(vec3 p) {
  float a = sin(p.x*4.13+p.z*2.71+p.y*1.37)*cos(p.y*3.91+p.x*1.13);
  float b = sin(p.y*7.33+p.x*3.17)*cos(p.z*5.73+p.y*2.31)*0.5;
  float c = cos(p.z*11.13+p.x*5.37)*sin(p.x*8.71+p.z*4.13)*0.25;
  return a+b+c;
}

void main() {
  vec3 b = vec3(position.x*1.52, position.y*0.87, position.z*1.05);
  float bl = length(b);
  vec3 n = b/max(bl,0.001);
  float fold = foldNoise(n*2.9)*0.10;
  float fis = max(0.0,n.y-0.20)*exp(-n.x*n.x/0.028)*0.42;
  vBrainPos = b + n*(fold-fis);
  vNorm = n;
  vec4 worldP = modelMatrix * vec4(vBrainPos, 1.0);
  vWorldPos = worldP.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldP;
}
`

const FRAGMENT = /* glsl */`
uniform vec3  uRegionPos;
uniform vec3  uRegionColor;
uniform float uTime;
uniform float uTransition;

varying vec3 vBrainPos;
varying vec3 vWorldPos;
varying vec3 vNorm;

void main() {
  vec3 base = vec3(0.038, 0.115, 0.210);

  // Highlight distance in local brain space (stays glued to anatomical region)
  float dist = length(vBrainPos - uRegionPos);
  float hl = (1.0 - smoothstep(0.5, 1.85, dist)) * uTransition;
  float pulse = sin(uTime*3.5)*0.5+0.5;

  // Fresnel edge glow
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float ndotv = max(dot(vNorm, viewDir), 0.0);
  float fresnel = pow(1.0 - ndotv, 2.5);

  vec3 col = mix(base, uRegionColor*0.65, hl);
  col += uRegionColor * hl * pulse * 0.20;
  col += vec3(0.04,0.14,0.30) * fresnel * 0.55;
  col += uRegionColor * fresnel * hl * 0.32;

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
    uRegionPos:   { value: new THREE.Vector3(...STRUCTURES[0].regionPos) },
    uRegionColor: { value: new THREE.Color(STRUCTURES[0].color) },
    uTime:        { value: 0 },
    uTransition:  { value: 0 },
  }), [])

  useFrame((state) => {
    if (!matRef.current) return
    const u = matRef.current.uniforms
    u.uTime.value = state.clock.elapsedTime

    const s = STRUCTURES[activeIdx]
    u.uRegionPos.value.set(...s.regionPos)
    u.uRegionColor.value.set(s.color)

    // Smooth transition in
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
