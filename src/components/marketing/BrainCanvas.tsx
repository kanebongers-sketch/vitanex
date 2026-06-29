'use client'

import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
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
const TILT = 0.62
const OVERVIEW0 = new THREE.Vector3(0, 0, 0)

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

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

// Continue highlight: helderheid op basis van afstand tot de (float) actieve regio.
function addHighlight(mat: THREE.MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uActive = { value: -1 }
    shader.vertexShader =
      'attribute float aRegion;\nuniform float uActive;\nvarying float vFactor;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  float d = abs(aRegion - uActive);\n  float tt = clamp((d - 0.2) / 0.6, 0.0, 1.0);\n  vFactor = (uActive < -0.5) ? 1.0 : mix(1.22, 0.3, tt);',
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

interface PreparedBrain {
  root: THREE.Object3D
  centroids: THREE.Vector3[]
}

function prepareBrain(scene: THREE.Object3D): PreparedBrain {
  const root = scene.clone(true)
  const stemDir = computeStemDir(root)
  const qLateral = new THREE.Quaternion().setFromUnitVectors(stemDir, new THREE.Vector3(0, -1, 0))
  root.quaternion.copy(qLateral)
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const xMin = box.min.x, xSpan = (box.max.x - box.min.x) || 1
  const yMin = box.min.y, ySpan = (box.max.y - box.min.y) || 1
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
  root.updateMatrixWorld(true)

  const sums = Array.from({ length: 6 }, () => new THREE.Vector3())
  const counts = new Array(6).fill(0)
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    const reg = mesh.geometry.attributes.aRegion as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      if (v.y < 0) continue
      const r = Math.round(reg.getX(i))
      sums[r].add(v); counts[r]++
    }
  })
  const centroids = sums.map((s, i) => (counts[i] ? s.multiplyScalar(1 / counts[i]) : new THREE.Vector3()))
  return { root, centroids }
}

// Interactief neuraal deeltjesveld achter het brein (reageert op de muis).
function NeuralBackground() {
  const ref = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const N = 360
    const arr = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12
      arr[i * 3 + 2] = -1.5 - Math.random() * 8
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    g.computeBoundingSphere()
    return g
  }, [])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.025
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, state.pointer.x * 1.1, delta * 2)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, state.pointer.y * 0.7, delta * 2)
  })

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <pointsMaterial color={COLORS.cyan} size={0.13} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

interface BrainModelProps {
  progressRef: MutableRefObject<number>
}

function BrainModel({ progressRef }: BrainModelProps) {
  const { scene } = useGLTF(MODEL_URL)
  const { root, centroids } = useMemo(() => prepareBrain(scene), [scene])
  const materials = useMemo(() => {
    const list: THREE.MeshStandardMaterial[] = []
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) list.push(m.material as THREE.MeshStandardMaterial) })
    return list
  }, [root])

  const camPos = useRef(new THREE.Vector3(0, 0.35, 5))
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))
  const tA = useRef(new THREE.Vector3())
  const tB = useRef(new THREE.Vector3())
  const tLook = useRef(new THREE.Vector3())
  const tPos = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const p = Math.max(0, Math.min(1, progressRef.current))
    const seg = p * 5                       // 6 regio's → 5 segmenten
    const idx = Math.min(4, Math.floor(seg))
    const frac = seg - idx                  // 0..1 binnen het segment

    // Continu interpoleren tussen twee regio-zwaartepunten
    tA.current.copy(centroids[idx] || OVERVIEW0)
    tB.current.copy(centroids[Math.min(5, idx + 1)] || OVERVIEW0)
    const fs = frac * frac * (3 - 2 * frac)
    tLook.current.copy(tA.current).lerp(tB.current, fs)

    // Sterker uit/in-zoomen tijdens de overgang (ver weg in het midden)
    const zoomOut = Math.sin(frac * Math.PI)
    const z = 2.3 + zoomOut * 2.4
    tPos.current.set(
      tLook.current.x * 0.6 + state.pointer.x * 0.18,
      tLook.current.y * 0.6 + 0.15 + state.pointer.y * 0.12,
      z,
    )

    const k = 1 - Math.exp(-delta * 6)
    camPos.current.lerp(tPos.current, k)
    lookAt.current.lerp(tLook.current, k)
    state.camera.position.copy(camPos.current)
    state.camera.lookAt(lookAt.current)

    for (const m of materials) {
      const s = m.userData.shader as { uniforms: { uActive: { value: number } } } | undefined
      if (s) s.uniforms.uActive.value = seg
    }
  })

  return <primitive object={root} />
}

interface BrainCanvasProps {
  progressRef: MutableRefObject<number>
}

export default function BrainCanvas({ progressRef }: BrainCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 5.0], fov: 42, near: 0.1, far: 100 }}
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

      <NeuralBackground />
      <Suspense fallback={null}>
        <BrainModel progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
