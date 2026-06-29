'use client'

import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_COLORS, COLORS, STEP_REGION } from './theme'
import NeuralBackground from './NeuralBackground'

// Anatomisch hersenmodel (70k vertices, geometry-only). Herkomst: Justin0Brien/Brain
// (MIT-repo); oorspronkelijke modelbron niet sluitend te verifiëren.
const MODEL_URL = '/models/brain.glb'
useGLTF.preload(MODEL_URL)

const PILLAR_COLORS = BRAIN_COLORS.map((hex) => new THREE.Color(hex))
const NAVY = new THREE.Color(COLORS.navyDeep)
const DISPLAY_SIZE = 2.8
const TILT = 0.16

const BASE_DIST = 3.4    // afstand tot het vlak (ingezoomd, heel brein in beeld)
const ZOOM_EXTRA = 1.6   // extra afstand halverwege de overgang (uitzoomen)
const CLIP_FRAC = 0.56   // onderste deel wegknippen langs de eigen kroon-as

// Camera recht van boven met lichte voor-bias → de zes vlakken als een plat
// "wiel"; voor- en achterkant even hoog, onderkant onzichtbaar. Hogere bias =
// schuiner (meer 3D), lagere = vlakker/recht van boven.
const FRONT_BIAS = 0.26
const INTRO_DIST = 6.2   // uitgezoomd intro-overzicht

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

  // Zes even grote vlakken via PCA: vind de horizontale hoofd-assen van de
  // bovenkant (A-P = lange as, L-R = korte as), ongeacht de oriëntatie-roll.
  // Splits L/R op de mediaan en per helft voor/midden/achter op terciles → elk
  // vlak bevat ~1/6 van de bovenkant-vertices (eerlijk verdeeld).
  // Zelfde drempel als de clip (CLIP_FRAC), zodat de zes vlakken worden verdeeld
  // over EXACT het zichtbare deel → elk vlak even groot (gelijk vertex-aandeel).
  const yTopThresh = box.min.y + CLIP_FRAC * (box.max.y - box.min.y)
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
  const nTop = topX.length || 1
  let mx = 0, mz = 0
  for (let i = 0; i < topX.length; i++) { mx += topX[i]; mz += topZ[i] }
  mx /= nTop; mz /= nTop
  let cxx = 0, czz = 0, cxz = 0
  for (let i = 0; i < topX.length; i++) { const dx = topX[i] - mx, dz = topZ[i] - mz; cxx += dx * dx; czz += dz * dz; cxz += dx * dz }
  // Hoofd-as (A-P); oriënteer zo dat 'voor' bij lage projectie ligt
  let ang = 0.5 * Math.atan2(2 * cxz, cxx - czz)
  let ax = Math.cos(ang), az = Math.sin(ang)
  if (ax < 0) { ax = -ax; az = -az }
  const lx = -az, lz = ax           // L-R as (loodrecht op A-P)
  const q = (arr: number[], f: number) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))] : 0
  const aAll: number[] = [], lAll: number[] = []
  for (let i = 0; i < topX.length; i++) {
    const dx = topX[i] - mx, dz = topZ[i] - mz
    aAll.push(dx * ax + dz * az); lAll.push(dx * lx + dz * lz)
  }
  const lMed = q([...lAll].sort((a, b) => a - b), 0.5)
  const aLeft: number[] = [], aRight: number[] = []
  for (let i = 0; i < aAll.length; i++) (lAll[i] < lMed ? aLeft : aRight).push(aAll[i])
  aLeft.sort((a, b) => a - b); aRight.sort((a, b) => a - b)
  const aL1 = q(aLeft, 0.3333), aL2 = q(aLeft, 0.6667)
  const aR1 = q(aRight, 0.3333), aR2 = q(aRight, 0.6667)

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
      const pdx = v.x - mx, pdz = v.z - mz
      const ap = pdx * ax + pdz * az      // voor↔achter langs hoofd-as
      const lp = pdx * lx + pdz * lz      // links↔rechts langs zij-as
      const hemi = lp >= lMed ? 1 : 0
      const b1 = hemi === 1 ? aR1 : aL1
      const b2 = hemi === 1 ? aR2 : aL2
      const band = ap < b1 ? 0 : ap < b2 ? 1 : 2
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

  // Onderkant wegknippen LANGS het eigen horizontale vlak van het gekantelde
  // brein (kroon-as = qTilt·(0,1,0) = (0, sa, ca)). Een wereld-horizontaal vlak
  // snijdt door de kanteling schuin door de anatomie en laat de voorste kwab
  // staan; deze as-uitgelijnde snede haalt de onderkant gelijkmatig weg.
  const clipNormal = new THREE.Vector3(0, sa, ca).normalize()
  let dMin = Infinity, dMax = -Infinity
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      const d = v.dot(clipNormal)
      if (d < dMin) dMin = d
      if (d > dMax) dMax = d
    }
  })
  let clipD = dMin + CLIP_FRAC * (dMax - dMin)

  // Nieuw middelpunt: zwaartepunt van ALLEEN het zichtbare (geclipte) deel.
  // Hercentreer de geometrie zodat dit middelpunt op de oorsprong ligt — zo staat
  // het brein na het wegknippen strak gecentreerd en orbiteert de camera er rond.
  const visSum = new THREE.Vector3()
  let visCount = 0
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld)
      if (v.dot(clipNormal) >= clipD) { visSum.add(v); visCount++ }
    }
  })
  const visCenter = visSum.multiplyScalar(1 / (visCount || 1)).clone()
  root.position.sub(visCenter)
  root.updateMatrixWorld(true)
  clipD -= clipNormal.dot(visCenter)          // clip-vlak meeschuiven met de hercentrering
  const clipPlane = new THREE.Plane(clipNormal.clone(), -clipD)

  // Zwaartepunten per regio (alleen het zichtbare deel, in het nieuwe gecentreerde
  // frame) + clip-plane op elk materiaal zodat de onderkant niet meer rendert.
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
      if (v.dot(clipNormal) < clipD) continue
      const r = Math.round(reg.getX(i))
      sums[r].add(v); counts[r]++
    }
  })
  const centroids = sums.map((s, i) => (counts[i] ? s.multiplyScalar(1 / counts[i]) : new THREE.Vector3()))
  return { root, centroids }
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
  const { waypoints, camUp } = useMemo(() => {
    const center = new THREE.Vector3()
    centroids.forEach((c) => center.add(c))
    center.multiplyScalar(1 / (centroids.length || 1))
    // Front = de twee voorste vlakken (band 0: regio 0 & 3) → de voor-achter-as.
    const frontPt = centroids[0].clone().add(centroids[3]).multiplyScalar(0.5)
    const fh = new THREE.Vector3(frontPt.x - center.x, 0, frontPt.z - center.z)
    if (fh.lengthSq() < 1e-6) fh.set(0, 0, 1)
    fh.normalize()
    // Eén vaste kijkrichting: recht van boven met lichte voor-bias. Camera-up =
    // links-rechts-as (loodrecht op de voor-achter-as), zodat het brein NOOIT
    // scheef/diagonaal kantelt: voor- en achterkant liggen even hoog (horizontaal)
    // en de onderkant blijft onzichtbaar. Per stap schuift/zoomt de camera alleen.
    const lrAxis = new THREE.Vector3(fh.z, 0, -fh.x).normalize()
    const faceDir = new THREE.Vector3(fh.x * FRONT_BIAS, 1, fh.z * FRONT_BIAS).normalize()
    const wps: { look: THREE.Vector3; dir: THREE.Vector3; dist: number; region: number }[] = [
      { look: center, dir: faceDir.clone(), dist: INTRO_DIST, region: -1 },
    ]
    // Zachte pan richting het actieve vlak, maar het brein blijft grotendeels in
    // beeld en gecentreerd (niet helemaal op het vlak-zwaartepunt = randafsnijding).
    STEP_REGION.forEach((r) => wps.push({ look: center.clone().lerp(centroids[r], 0.4), dir: faceDir.clone(), dist: BASE_DIST, region: r }))
    return { waypoints: wps, camUp: lrAxis }
  }, [centroids])

  const camPos = useRef(new THREE.Vector3(0, 0.35, 5))
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))
  const tLook = useRef(new THREE.Vector3())
  const tPos = useRef(new THREE.Vector3())
  const tDir = useRef(new THREE.Vector3())

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

    // Brein staat strak gecentreerd op het nieuwe middelpunt (geen per-vlak shift).
    const introF = Math.max(0, 1 - seg)     // 1 bij het startbeeld (waypoint 0)

    const k = 1 - Math.exp(-delta * 6)
    camPos.current.lerp(tPos.current, k)
    lookAt.current.lerp(tLook.current, k)
    state.camera.position.copy(camPos.current)
    state.camera.up.copy(camUp)               // vaste up → brein altijd recht, geen roll
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
