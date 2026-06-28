'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// RGB floats for each pillar (Energie, Slaap, Stress, Stemming, Beweging, Voeding)
const PILLAR_RGB: [number, number, number][] = [
  [0.976, 0.451, 0.086],  // #F97316 oranje
  [0.388, 0.400, 0.945],  // #6366F1 indigo
  [0.176, 0.831, 0.749],  // #2DD4BF teal
  [0.655, 0.545, 0.980],  // #A78BFA paars
  [0.984, 0.443, 0.522],  // #FB7185 roze
  [0.204, 0.827, 0.600],  // #34D399 groen
]

// Richtingsvectoren voor de 6 hersenregio's
const REGION_DIRS: [number, number, number][] = [
  [ 0,  0,  1],  // Energie   — voorkant
  [-1,  0,  0],  // Slaap     — linkerkant
  [ 1,  0,  0],  // Stress    — rechterkant
  [ 0,  1,  0],  // Stemming  — bovenkant
  [ 0,  0, -1],  // Beweging  — achterkant
  [ 0, -1,  0],  // Voeding   — onderkant
]

const TARGET_ROTATIONS: [number, number][] = [
  [0,  0],
  [0, -Math.PI / 2],
  [0,  Math.PI / 2],
  [-Math.PI / 2, 0],
  [0,  Math.PI],
  [Math.PI / 2, 0],
]

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

function ss(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function buildBrainGeometry(activePillar: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1.0, 6)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i), oy = pos.getY(i), oz = pos.getZ(i)
    const bx = ox * 1.35, by = oy * 0.82, bz = oz * 1.02
    const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1
    const nx = bx / bl, ny = by / bl, nz = bz / bl

    const dy2 = by - Math.max(0, -ny - 0.05) * 0.22
    const tBulge = ss(0.48, 0.90, Math.abs(nx)) * ss(0.38, -0.28, ny) * 0.18
    const dx2 = bx + Math.sign(bx) * tBulge

    const fis = Math.max(0, ny - 0.08) * (0.92 - 0.30 * nz * nz) *
                Math.exp(-nx * nx / 0.011) * 0.55

    const fold = gyriJS(nx, ny, nz)
    const d = fold * 0.18 - fis * 0.7
    pos.setXYZ(i, dx2 + nx * d, dy2 + ny * d, bz + nz * d)

    // Harde regio-toewijzing: winnaar pakt alles, geen menging
    let maxDot = -Infinity, region = 0
    for (let k = 0; k < 6; k++) {
      const [rx, ry, rz] = REGION_DIRS[k]
      const dot = nx * rx + ny * ry + nz * rz
      if (dot > maxDot) { maxDot = dot; region = k }
    }

    const [pr, pg, pb] = PILLAR_RGB[region]

    // Scherpe sulci: puur zwart in groeven, volle kleur op gyri-pieken
    const fNorm = Math.min(1, Math.max(0, fold / 0.30))
    const sulci = ss(0.18, 0.28, fNorm)  // smalle overgang = duidelijke zwarte lijnen

    // Actieve regio 30% helderder
    const activeMult = region === activePillar ? 1.30 : 1.0

    colors[i * 3]     = pr * sulci * activeMult
    colors[i * 3 + 1] = pg * sulci * activeMult
    colors[i * 3 + 2] = pb * sulci * activeMult
  }

  pos.needsUpdate = true
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

interface BrainMeshProps {
  activePillar: number
}

function BrainMesh({ activePillar }: BrainMeshProps) {
  const groupRef   = useRef<THREE.Group>(null)
  const rotRef     = useRef({ x: 0.18, y: 0.3 })
  const autoRef    = useRef(true)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPillar = useRef(-1)

  const brainGeo = useMemo(() => buildBrainGeometry(activePillar), [activePillar])

  useEffect(() => {
    if (prevPillar.current === activePillar) return
    prevPillar.current = activePillar

    autoRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { autoRef.current = true }, 6000)
  }, [activePillar])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (autoRef.current) {
      rotRef.current.y += delta * 0.10
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, 0.18, delta * 1.2
      )
    } else {
      const [tx, ty] = TARGET_ROTATIONS[activePillar]
      let dy = ty - rotRef.current.y
      while (dy >  Math.PI) dy -= 2 * Math.PI
      while (dy < -Math.PI) dy += 2 * Math.PI

      const speed = 1 - Math.exp(-delta * 2.8)
      rotRef.current.x += (tx - rotRef.current.x) * speed
      rotRef.current.y += dy * speed
    }

    groupRef.current.rotation.x = rotRef.current.x
    groupRef.current.rotation.y = rotRef.current.y
  })

  return (
    <group ref={groupRef} rotation={[0.18, 0.3, 0]}>
      <mesh geometry={brainGeo}>
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.05} />
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
      state.camera.position.x, mouse.current.x * 0.22, 0.05
    )
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y, 0.6 - mouse.current.y * 0.15, 0.05
    )
    state.camera.lookAt(0, 0.1, 0)
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
      camera={{ position: [1.2, 0.5, 5.0], fov: 46, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.LinearToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight color="#ffffff" intensity={0.6} />
      <directionalLight position={[2, 4, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-3, 2, 2]} intensity={1.0} color="#ffffff" />
      <pointLight position={[0, -3, 3]} intensity={1.2} color="#ffffff" distance={12} />

      <BrainMesh activePillar={activePillar} />
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.15} radius={0.30} luminanceThreshold={0.95} />
      </EffectComposer>
    </Canvas>
  )
}
