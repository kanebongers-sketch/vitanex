'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Anatomisch hersenmodel (70k vertices, geometry-only). Herkomst: Justin0Brien/Brain
// (MIT-repo); oorspronkelijke modelbron niet sluitend te verifiëren — vervang door
// een model met expliciete commerciële licentie indien nodig vóór productie.
const MODEL_URL = '/models/brain.glb'
useGLTF.preload(MODEL_URL)

// Pillar-kleuren als THREE.Color (sRGB → linear handled door ColorManagement)
const PILLAR_COLORS = ['#F97316', '#6366F1', '#2DD4BF', '#A78BFA', '#FB7185', '#34D399']
  .map((hex) => new THREE.Color(hex))

// 6 gelijke zones: 6 asrichtingen vanuit het midden van het model
const REGION_DIRS: [number, number, number][] = [
  [ 0,  0,  1],  // Energie   — voor
  [-1,  0,  0],  // Slaap     — links
  [ 1,  0,  0],  // Stress    — rechts
  [ 0,  1,  0],  // Stemming  — boven
  [ 0,  0, -1],  // Beweging  — achter
  [ 0, -1,  0],  // Voeding   — onder
]

// Rotaties die elke zone naar de camera (+Z) draaien
const TARGET_ROTATIONS: [number, number][] = [
  [0,            0],            // voor
  [0,            Math.PI / 2],  // links
  [0,           -Math.PI / 2],  // rechts
  [Math.PI / 2,  0],            // boven
  [0,            Math.PI],      // achter
  [-Math.PI / 2, 0],            // onder
]

const DISPLAY_SIZE = 3.0

// Extra draai om de gewenste kijkzijde (laterale profielweergave) te kiezen
const VIEW_SPIN = 0

// Meet de hersenstam-richting in render-ruimte: het verst gelegen punt vanaf
// het zwaartepunt is de stam-tip. Houdt rekening met node-transforms.
function computeStemDir(root: THREE.Object3D): THREE.Vector3 {
  root.updateMatrixWorld(true)
  const v = new THREE.Vector3()
  let sx = 0, sy = 0, sz = 0, n = 0
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const p = m.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m.matrixWorld)
      sx += v.x; sy += v.y; sz += v.z; n++
    }
  })
  const cx = sx / n, cy = sy / n, cz = sz / n
  let fd = -1, fx = 0, fy = 0, fz = 0
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const p = m.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m.matrixWorld)
      const d = (v.x - cx) ** 2 + (v.y - cy) ** 2 + (v.z - cz) ** 2
      if (d > fd) { fd = d; fx = v.x; fy = v.y; fz = v.z }
    }
  })
  return new THREE.Vector3(fx - cx, fy - cy, fz - cz).normalize()
}

// Laadt het GLB-brein, kleurt het in 6 gelijke zones en centreert/schaalt het.
function prepareBrain(scene: THREE.Object3D): THREE.Object3D {
  const root = scene.clone(true)

  // Stam recht naar beneden draaien + gewenste kijkzijde
  const stemDir = computeStemDir(root)
  const toDown = new THREE.Quaternion().setFromUnitVectors(
    stemDir,
    new THREE.Vector3(0, -1, 0)
  )
  const spin = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0), VIEW_SPIN
  )
  root.quaternion.copy(spin.multiply(toDown))
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1

  const v = new THREE.Vector3()

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    const geo = mesh.geometry.clone()
    const pos = geo.attributes.position as THREE.BufferAttribute
    const nrm = geo.attributes.normal as THREE.BufferAttribute | undefined
    const normalMat = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
    const vn = new THREE.Vector3()
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      const dx = v.x - center.x, dy = v.y - center.y, dz = v.z - center.z
      const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
      const nx = dx / l, ny = dy / l, nz = dz / l

      // Winner-takes-all: scherpe grens tussen de 6 zones, geen menging
      let region = 0, maxDot = -Infinity
      for (let k = 0; k < 6; k++) {
        const d = nx * REGION_DIRS[k][0] + ny * REGION_DIRS[k][1] + nz * REGION_DIRS[k][2]
        if (d > maxDot) { maxDot = d; region = k }
      }

      // Cavity-shading: groeven (normaal wijkt af van radiaal) worden donker,
      // gyri-toppen blijven helder → duidelijke donkere sulci-lijnen.
      let shade = 1
      if (nrm) {
        vn.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i)).applyMatrix3(normalMat).normalize()
        const ao = vn.x * nx + vn.y * ny + vn.z * nz
        shade = 0.32 + 0.68 * THREE.MathUtils.smoothstep(ao, 0.05, 0.9)
      }

      const c = PILLAR_COLORS[region]
      colors[i * 3]     = c.r * shade
      colors[i * 3 + 1] = c.g * shade
      colors[i * 3 + 2] = c.b * shade
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    mesh.geometry = geo
    mesh.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.62,
      metalness: 0.0,
    })
  })

  // Centreren op de oorsprong en schalen naar een vaste weergavegrootte
  const scale = DISPLAY_SIZE / maxDim
  root.scale.setScalar(scale)
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

  return root
}

interface BrainModelProps {
  activePillar: number
}

function BrainModel({ activePillar }: BrainModelProps) {
  const { scene } = useGLTF(MODEL_URL)
  const brain = useMemo(() => prepareBrain(scene), [scene])

  const groupRef   = useRef<THREE.Group>(null)
  const rotRef     = useRef({ x: 0.0, y: 0.0 })
  const autoRef    = useRef(true)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPillar = useRef(-1)

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
      rotRef.current.y += delta * 0.12
      rotRef.current.x = THREE.MathUtils.lerp(rotRef.current.x, 0.0, delta * 1.2)
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
    <group ref={groupRef} rotation={[0.0, 0.0, 0]}>
      <primitive object={brain} />
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
      state.camera.position.x, mouse.current.x * 0.25, 0.05
    )
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y, 0.3 - mouse.current.y * 0.15, 0.05
    )
    state.camera.lookAt(0, 0, 0)
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
      camera={{ position: [0.4, 0.3, 5.4], fov: 42, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#ffffff" />
      <pointLight position={[0, -3, 3]} intensity={0.7} color="#ffffff" distance={14} />

      <Suspense fallback={null}>
        <BrainModel activePillar={activePillar} />
      </Suspense>
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.12} radius={0.3} luminanceThreshold={0.92} />
      </EffectComposer>
    </Canvas>
  )
}
