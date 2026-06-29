'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_COLORS, COLORS } from './theme'

// Anatomisch hersenmodel (70k vertices, geometry-only). Herkomst: Justin0Brien/Brain
// (MIT-repo); oorspronkelijke modelbron niet sluitend te verifiëren.
const MODEL_URL = '/models/brain.glb'
useGLTF.preload(MODEL_URL)

const PILLAR_COLORS = BRAIN_COLORS.map((hex) => new THREE.Color(hex))
const NAVY = new THREE.Color(COLORS.navyDeep)
const DISPLAY_SIZE = 2.8
const TILT = 0.62 // kantelhoek voor schuin bovenaanzicht

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Meet de hersenstam-richting: het verst gelegen punt vanaf het zwaartepunt.
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

// Highlight-shader: actief deel feller, andere delen gedimd (uActive = -1 → neutraal).
function addHighlight(mat: THREE.MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uActive = { value: -1 }
    shader.vertexShader =
      'attribute float aRegion;\nuniform float uActive;\nvarying float vFactor;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vFactor = (uActive < 0.0) ? 1.0 : ((abs(aRegion - uActive) < 0.5) ? 1.28 : 0.28);',
      )
    shader.fragmentShader =
      'varying float vFactor;\n' +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n  diffuseColor.rgb *= vFactor;',
      )
    mat.userData.shader = shader
  }
}

// Kleurt het brein in 6 delen, schrijft een aRegion-attribuut (voor highlight +
// klikdetectie), dempt de onderkant naar navy en centreert/schaalt.
function prepareBrain(scene: THREE.Object3D): THREE.Object3D {
  const root = scene.clone(true)

  const stemDir = computeStemDir(root)
  const qLateral = new THREE.Quaternion().setFromUnitVectors(stemDir, new THREE.Vector3(0, -1, 0))
  root.quaternion.copy(qLateral)
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const xMin = box.min.x, xSpan = (box.max.x - box.min.x) || 1  // voor-achter
  const yMin = box.min.y, ySpan = (box.max.y - box.min.y) || 1  // hoogte

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
    const regions = new Float32Array(pos.count)

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)

      const hemi = v.z >= center.z ? 1 : 0
      const band = Math.min(2, Math.max(0, Math.floor(((v.x - xMin) / xSpan) * 3)))
      const region = hemi * 3 + band
      regions[i] = region
      const c = PILLAR_COLORS[region]

      let shade = 1
      if (nrm) {
        const dx = v.x - center.x, dy = v.y - center.y, dz = v.z - center.z
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        vn.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i)).applyMatrix3(normalMat).normalize()
        const ao = (vn.x * dx + vn.y * dy + vn.z * dz) / l
        shade = 0.34 + 0.66 * smooth(0.05, 0.9, ao)
      }

      const heightF = smooth(0.34, 0.62, (v.y - yMin) / ySpan)
      colors[i * 3]     = THREE.MathUtils.lerp(NAVY.r, c.r * shade, heightF)
      colors[i * 3 + 1] = THREE.MathUtils.lerp(NAVY.g, c.g * shade, heightF)
      colors[i * 3 + 2] = THREE.MathUtils.lerp(NAVY.b, c.b * shade, heightF)
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aRegion', new THREE.BufferAttribute(regions, 1))
    mesh.geometry = geo
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.0 })
    addHighlight(mat)
    mesh.material = mat
  })

  // Kantelen naar schuin bovenaanzicht (L-R → horizontaal, kruin → naar camera).
  const ca = Math.cos(TILT), sa = Math.sin(TILT)
  const qTilt = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, ca, -sa),
      new THREE.Vector3(0, sa, ca),
      new THREE.Vector3(1, 0, 0),
    ),
  )
  root.quaternion.premultiply(qTilt)
  root.updateMatrixWorld(true)

  const box2 = new THREE.Box3().setFromObject(root)
  const c2 = box2.getCenter(new THREE.Vector3())
  const size2 = box2.getSize(new THREE.Vector3())
  const maxDim = Math.max(size2.x, size2.y, size2.z) || 1
  const scale = DISPLAY_SIZE / maxDim
  root.scale.setScalar(scale)
  root.position.set(-c2.x * scale, -c2.y * scale, -c2.z * scale)
  return root
}

interface BrainModelProps {
  activeRegion: number | null
  onRegionChange?: (region: number | null) => void
}

function BrainModel({ activeRegion, onRegionChange }: BrainModelProps) {
  const { scene } = useGLTF(MODEL_URL)
  const brain = useMemo(() => prepareBrain(scene), [scene])
  const materials = useMemo(() => {
    const list: THREE.MeshStandardMaterial[] = []
    brain.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) list.push(m.material as THREE.MeshStandardMaterial) })
    return list
  }, [brain])

  const groupRef = useRef<THREE.Group>(null)
  const activeRef = useRef<number>(-1)
  activeRef.current = activeRegion ?? -1

  // Vaste schuine-bovenaanzicht-oriëntatie; alleen een heel subtiele yaw-wieg.
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.04
    }
    for (const m of materials) {
      const s = m.userData.shader as { uniforms: { uActive: { value: number } } } | undefined
      if (s) s.uniforms.uActive.value = activeRef.current
    }
  })

  const regionFromEvent = (e: ThreeEvent<PointerEvent>): number | null => {
    const mesh = e.object as THREE.Mesh
    const aRegion = mesh.geometry?.attributes?.aRegion as THREE.BufferAttribute | undefined
    if (!aRegion || !e.face) return null
    return Math.round(aRegion.getX(e.face.a))
  }

  return (
    <group
      ref={groupRef}
      onPointerMove={(e) => { if (!onRegionChange) return; const r = regionFromEvent(e); if (r != null) { e.stopPropagation(); onRegionChange(r) } }}
      onPointerDown={(e) => { if (!onRegionChange) return; const r = regionFromEvent(e); if (r != null) { e.stopPropagation(); onRegionChange(r) } }}
    >
      <primitive object={brain} />
    </group>
  )
}

interface BrainCanvasProps {
  activeRegion?: number | null
  onRegionChange?: (region: number | null) => void
}

export default function BrainCanvas({ activeRegion = null, onRegionChange }: BrainCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 5.0], fov: 40, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(COLORS.navy), 1)}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[2, 6, 4]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, 3, 1]} intensity={0.7} color={COLORS.cyan} />
      <pointLight position={[0, 1, 5]} intensity={0.5} color="#ffffff" distance={16} />

      <Suspense fallback={null}>
        <BrainModel activeRegion={activeRegion} onRegionChange={onRegionChange} />
      </Suspense>
    </Canvas>
  )
}
