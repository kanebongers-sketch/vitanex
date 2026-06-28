'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

const PILLAR_REGIONS: readonly [number, number, number][] = [
  [0,    0.25,  0.68],
  [0,   -0.20,  0.12],
  [0.18,-0.08,  0.14],
  [0,    0.48,  0.82],
  [0,    0.80,  0.06],
  [0,   -0.28, -0.08],
]

const PILLAR_COLORS = ['#F97316', '#6366F1', '#2DD4BF', '#A78BFA', '#FB7185', '#34D399']

function gyriJS(nx: number, ny: number, nz: number): number {
  const n = { x: nx * 2.7, y: ny * 2.7, z: nz * 2.7 }
  const g1 = Math.abs(Math.sin(n.x * 2.6 + n.z * 1.7 + n.y * 0.5)) *
             Math.abs(Math.cos(n.y * 3.4 + n.z * 1.1 + n.x * 0.8))
  const g2 = Math.abs(Math.sin(n.x * 5.8 + n.z * 4.5 + n.y * 1.9)) *
             Math.abs(Math.cos(n.y * 6.9 + n.x * 3.2 + n.z * 5.7))
  const g3 = Math.abs(Math.sin(n.x * 12.1 + n.z * 9.8 + n.y * 4.1)) *
             Math.abs(Math.cos(n.y * 14.0 + n.x * 7.6 + n.z * 11.3)) * 0.55
  const g4 = Math.sin(n.x * 24.3 + n.z * 20.1) *
             Math.cos(n.y * 28.7 + n.x * 16.2 + n.z * 22.9) * 0.4
  return g1 * 0.28 + g2 * 0.15 + g3 * 0.07 + g4 * 0.018
}

function buildBrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1.0, 6)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i), oy = pos.getY(i), oz = pos.getZ(i)
    const bx = ox * 1.35, by = oy * 0.82, bz = oz * 1.02
    const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1
    const nx = bx / bl, ny = by / bl, nz = bz / bl

    let dy2 = by - Math.max(0, -ny - 0.05) * 0.22
    const tBulge = smoothStep(0.48, 0.90, Math.abs(nx)) *
                   smoothStep(0.38, -0.28, ny) * 0.18
    const dx2 = bx + Math.sign(bx) * tBulge

    const topRegion = Math.max(0, ny - 0.08)
    const fis = topRegion * (0.92 - 0.30 * nz * nz) *
                Math.exp(-nx * nx / 0.011) * 0.55

    const foldDisplace = gyriJS(nx, ny, nz)
    const d = foldDisplace * 0.18 - fis * 0.7

    pos.setXYZ(i, dx2 + nx * d, dy2 + ny * d, bz + nz * d)

    // Kleur gebruikt alle octaven voor rijke detail
    const fNorm = Math.min(1, Math.max(0, (foldDisplace + 0.05) / 0.52))
    const t = Math.sqrt(fNorm)
    colors[i * 3]     = 0.52 + (0.80 - 0.52) * t + (0.96 - 0.80) * fNorm * fNorm
    colors[i * 3 + 1] = 0.22 + (0.46 - 0.22) * t + (0.70 - 0.46) * fNorm * fNorm
    colors[i * 3 + 2] = 0.20 + (0.40 - 0.20) * t + (0.62 - 0.40) * fNorm * fNorm
  }

  pos.needsUpdate = true
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const HIGHLIGHT_VERT = /* glsl */`
uniform vec3  uRegionPos;
uniform float uTransition;
uniform float uTime;
varying float vHL;
varying vec3  vWorldPos;
void main() {
  vec3 p = vec3(position.x * 1.40, position.y * 0.86, position.z * 1.06);
  float bl = length(p);
  vec3 n = p / max(bl, 0.001);
  float dist = length(n - uRegionPos);
  vHL = (1.0 - smoothstep(0.3, 1.5, dist)) * uTransition;
  vec4 wp = modelMatrix * vec4(p * 1.012, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const HIGHLIGHT_FRAG = /* glsl */`
uniform vec3  uRegionColor;
uniform float uTime;
varying float vHL;
varying vec3  vWorldPos;
void main() {
  float pulse = sin(uTime * 3.2) * 0.5 + 0.5;
  float alpha = vHL * (0.18 + 0.22 * pulse);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uRegionColor, alpha);
}
`

interface BrainMeshProps {
  activePillar: number
}

function BrainMesh({ activePillar }: BrainMeshProps) {
  const meshRef = useRef<THREE.Group>(null)
  const hlMatRef = useRef<THREE.ShaderMaterial>(null)
  const transitionRef = useRef(0)
  const prevPillar = useRef(activePillar)

  const brainGeo = useMemo(() => buildBrainGeometry(), [])

  const hlUniforms = useMemo(() => ({
    uRegionPos:   { value: new THREE.Vector3(...PILLAR_REGIONS[0]) },
    uRegionColor: { value: new THREE.Color(PILLAR_COLORS[0]) },
    uTransition:  { value: 0 },
    uTime:        { value: 0 },
  }), [])

  useEffect(() => {
    if (prevPillar.current !== activePillar) {
      transitionRef.current = 0
      prevPillar.current = activePillar
    }
  }, [activePillar])

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.10
    if (!hlMatRef.current) return
    const u = hlMatRef.current.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uRegionPos.value.set(...PILLAR_REGIONS[activePillar])
    u.uRegionColor.value.set(PILLAR_COLORS[activePillar])
    transitionRef.current = THREE.MathUtils.lerp(
      transitionRef.current, 1, 1 - Math.exp(-delta * 1.8)
    )
    u.uTransition.value = transitionRef.current
  })

  return (
    <group ref={meshRef} rotation={[0.18, 0.3, 0]}>
      {/* Brain met correcte normals en vertex colours */}
      <mesh geometry={brainGeo}>
        <meshStandardMaterial
          vertexColors
          roughness={0.62}
          metalness={0.0}
          envMapIntensity={0.4}
        />
      </mesh>
      {/* Transparante highlight-laag over het brein */}
      <mesh geometry={brainGeo}>
        <shaderMaterial
          ref={hlMatRef}
          vertexShader={HIGHLIGHT_VERT}
          fragmentShader={HIGHLIGHT_FRAG}
          uniforms={hlUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x, mouse.current.x * 0.28, 0.05
    )
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y, 0.75 - mouse.current.y * 0.18, 0.05
    )
    state.camera.lookAt(0, 0.15, 0)
  })

  return null
}

interface BrainCanvasProps {
  activePillar: number
  scrollProgress: number
}

export default function BrainCanvas({ activePillar }: BrainCanvasProps) {
  return (
    <Canvas
      camera={{ position: [1.4, 0.5, 5.2], fov: 46, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Verlichting voor MeshStandardMaterial */}
      <ambientLight color="#ffcdc0" intensity={1.4} />
      <directionalLight position={[2, 4, 5]} intensity={2.2} color="#ffe8e0" />
      <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#ffddd5" />
      <pointLight position={[0, -3, 3]} intensity={2.5} color="#ff9977" distance={12} />

      <BrainMesh activePillar={activePillar} />
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.45} radius={0.45} luminanceThreshold={0.70} />
      </EffectComposer>
    </Canvas>
  )
}
