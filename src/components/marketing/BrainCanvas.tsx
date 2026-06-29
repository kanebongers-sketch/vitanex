'use client'

import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_COLORS, COLORS, STEP_REGION } from './theme'

// Anatomisch hersenmodel (70k vertices, geometry-only). Herkomst: Justin0Brien/Brain
// (MIT-repo); oorspronkelijke modelbron niet sluitend te verifiëren.
const MODEL_URL = '/models/brain.glb'
useGLTF.preload(MODEL_URL)

const PILLAR_COLORS = BRAIN_COLORS.map((hex) => new THREE.Color(hex))
const NAVY = new THREE.Color(COLORS.navyDeep)
const DISPLAY_SIZE = 2.8
const TILT = 0.62

const BASE_DIST = 2.5    // afstand tot het vlak (ingezoomd)
const ZOOM_EXTRA = 1.6   // extra afstand halverwege de overgang (uitzoomen)
const CLIP_FRAC = 0.38   // onderste deel (stam/onderkant) wegknippen

const ORBIT_H = 1.0     // hoeveel vanaf de zijkant van het vlak (horizontale outward)
const ORBIT_ELEV = 1.2  // hoeveel van bovenaf (hoger = steiler) → schuin-boven
const WORLD_UP = new THREE.Vector3(0, 1, 0)
const CARD_SHIFT = 0.18 // vlak licht naar rechts schuiven (desktop) langs de info-kaart
// Intro/startbeeld: vóór het brein, schuin van boven, uitgezoomd en gecentreerd.
const INTRO_H = 1.5
const INTRO_ELEV = 1.05
const INTRO_DIST = 6.2

// Kijkrichting per vlak: vanaf de eigen kant van het brein, schuin van bovenaf.
// Horizontaal wijst naar buiten (rondom de perimeter), met een vaste elevatie
// zodat elk vlak vanuit zijn eigen hoek schuin-boven goed in beeld komt.
function buildCamDirs(centroids: THREE.Vector3[]): THREE.Vector3[] {
  const center = new THREE.Vector3()
  centroids.forEach((c) => center.add(c))
  center.multiplyScalar(1 / (centroids.length || 1))
  return centroids.map((c) => {
    const hx = c.x - center.x, hz = c.z - center.z
    const hlen = Math.hypot(hx, hz) || 1
    return new THREE.Vector3((hx / hlen) * ORBIT_H, ORBIT_ELEV, (hz / hlen) * ORBIT_H).normalize()
  })
}

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

// Continue highlight: crossfade tussen twee actieve regio's (uRegionA→uRegionB),
// zodat de volgorde willekeurig mag zijn zonder tussenliggende regio's te raken.
function addHighlight(mat: THREE.MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRegionA = { value: 0 }
    shader.uniforms.uRegionB = { value: 0 }
    shader.uniforms.uMix = { value: 0 }
    shader.uniforms.uIntro = { value: 1 }
    shader.vertexShader =
      'attribute float aRegion;\nuniform float uRegionA;\nuniform float uRegionB;\nuniform float uMix;\nuniform float uIntro;\nvarying float vFactor;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  float mA = 1.0 - step(0.5, abs(aRegion - uRegionA));\n  float mB = 1.0 - step(0.5, abs(aRegion - uRegionB));\n  float w = clamp(mA * (1.0 - uMix) + mB * uMix, 0.0, 1.0);\n  vFactor = mix(mix(0.22, 1.0, uIntro), 1.25, w);',
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
  const yMin = box.min.y, ySpan = (box.max.y - box.min.y) || 1
  const v = new THREE.Vector3()

  // Zes even grote vlakken: eerst links/rechts op de Z-mediaan (twee gelijke
  // helften), daarna per helft voor/midden/achter op X-terciles. Zo bevat elk
  // van de zes vlakken ~1/6 van de bovenkant-vertices.
  const yTopThresh = box.min.y + 0.50 * (box.max.y - box.min.y)
  const topX: number[] = [], topZ: number[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      if (v.y >= yTopThresh) { topX.push(v.x); topZ.push(v.z) }
    }
  })
  const q = (arr: number[], f: number) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))] : 0
  const zMedian = q([...topZ].sort((a, b) => a - b), 0.5) || center.z
  const leftX: number[] = [], rightX: number[] = []
  for (let i = 0; i < topX.length; i++) (topZ[i] < zMedian ? leftX : rightX).push(topX[i])
  leftX.sort((a, b) => a - b); rightX.sort((a, b) => a - b)
  const xL1 = q(leftX, 0.3333), xL2 = q(leftX, 0.6667)
  const xR1 = q(rightX, 0.3333), xR2 = q(rightX, 0.6667)

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
      const hemi = v.z >= zMedian ? 1 : 0
      const b1 = hemi === 1 ? xR1 : xL1
      const b2 = hemi === 1 ? xR2 : xL2
      const band = v.x < b1 ? 0 : v.x < b2 ? 1 : 2
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

  // Wereld-hoogtebereik bepalen om de onderkant (stam) weg te knippen.
  let yMinW = Infinity, yMaxW = -Infinity
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      if (v.y < yMinW) yMinW = v.y
      if (v.y > yMaxW) yMaxW = v.y
    }
  })
  const clipY = yMinW + CLIP_FRAC * (yMaxW - yMinW)
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipY)

  // Zwaartepunten per regio (alleen het zichtbare, bovenste deel) + clip-plane
  // op elk materiaal zetten zodat de onderkant niet meer rendert.
  const sums = Array.from({ length: 6 }, () => new THREE.Vector3())
  const counts = new Array(6).fill(0)
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    ;(mesh.material as THREE.Material).clippingPlanes = [clipPlane]
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    const reg = mesh.geometry.attributes.aRegion as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      if (v.y < clipY) continue
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

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.025
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
  const waypoints = useMemo(() => {
    const camDirs = buildCamDirs(centroids)
    const center = new THREE.Vector3()
    centroids.forEach((c) => center.add(c))
    center.multiplyScalar(1 / (centroids.length || 1))
    // Front = de twee voorste vlakken (band 0: regio 0 & 3). Camera kijkt vandaar.
    const frontPt = centroids[0].clone().add(centroids[3]).multiplyScalar(0.5)
    const fh = new THREE.Vector3(frontPt.x - center.x, 0, frontPt.z - center.z)
    if (fh.lengthSq() < 1e-6) fh.set(0, 0, 1)
    fh.normalize()
    const introDir = new THREE.Vector3(fh.x * INTRO_H, INTRO_ELEV, fh.z * INTRO_H).normalize()
    // Waypoint 0 = uitgezoomd front-overzicht; daarna de zes vlakken.
    const wps: { look: THREE.Vector3; dir: THREE.Vector3; dist: number; region: number }[] = [
      { look: center, dir: introDir, dist: INTRO_DIST, region: -1 },
    ]
    STEP_REGION.forEach((r) => wps.push({ look: centroids[r].clone(), dir: camDirs[r].clone(), dist: BASE_DIST, region: r }))
    return wps
  }, [centroids])

  const camPos = useRef(new THREE.Vector3(0, 0.35, 5))
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))
  const tLook = useRef(new THREE.Vector3())
  const tLookShift = useRef(new THREE.Vector3())
  const tPos = useRef(new THREE.Vector3())
  const tDir = useRef(new THREE.Vector3())
  const tRight = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const p = Math.max(0, Math.min(1, progressRef.current))
    const N = waypoints.length - 1          // 6 segmenten (intro-overzicht + 6 vlakken)
    const seg = p * N
    const idx = Math.min(N - 1, Math.floor(seg))
    const frac = seg - idx
    const fs = frac * frac * (3 - 2 * frac)
    const A = waypoints[idx]
    const B = waypoints[idx + 1]

    tLook.current.copy(A.look).lerp(B.look, fs)
    tDir.current.copy(A.dir).lerp(B.dir, fs).normalize()
    const baseDist = THREE.MathUtils.lerp(A.dist, B.dist, fs)
    const dist = baseDist + Math.sin(frac * Math.PI) * ZOOM_EXTRA
    tPos.current.copy(tLook.current).addScaledVector(tDir.current, dist)

    // Vlak naar rechts schuiven op desktop (niet tijdens het intro-overzicht)
    const introF = Math.max(0, 1 - seg)     // 1 bij het startbeeld (waypoint 0)
    const shift = (state.size.width >= 900 ? CARD_SHIFT : 0) * Math.min(1, seg)
    tRight.current.crossVectors(tDir.current, WORLD_UP).normalize()
    tLookShift.current.copy(tLook.current).addScaledVector(tRight.current, shift)

    const k = 1 - Math.exp(-delta * 6)
    camPos.current.lerp(tPos.current, k)
    lookAt.current.lerp(tLookShift.current, k)
    state.camera.position.copy(camPos.current)
    state.camera.lookAt(lookAt.current)

    for (const m of materials) {
      const s = m.userData.shader as { uniforms: { uRegionA: { value: number }, uRegionB: { value: number }, uMix: { value: number }, uIntro: { value: number } } } | undefined
      if (s) { s.uniforms.uRegionA.value = A.region; s.uniforms.uRegionB.value = B.region; s.uniforms.uMix.value = fs; s.uniforms.uIntro.value = introF }
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
      onCreated={({ gl }) => { gl.setClearColor(new THREE.Color(COLORS.navy), 1); gl.localClippingEnabled = true }}
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
