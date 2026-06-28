'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

interface BrainCanvasProps {
  activePillar: number
  scrollProgress: number
}

const PILLAR_COLORS = [
  new THREE.Color('#F5A524'),
  new THREE.Color('#818CF8'),
  new THREE.Color('#2DD4BF'),
  new THREE.Color('#C084FC'),
  new THREE.Color('#FB7185'),
  new THREE.Color('#34D399'),
]

// 3D hotspot positions on brain surface (world space, unrotated)
const HOTSPOT_3D: [number, number, number][] = [
  [ 0.05,  0.70,  0.35],  // energie   — top
  [ 1.15,  0.10,  0.00],  // slaap     — right
  [-1.15,  0.10,  0.00],  // stress    — left
  [ 0.60, -0.35,  0.55],  // stemming  — front right
  [-0.60, -0.45,  0.20],  // beweging  — front left
  [ 0.05, -0.72, -0.30],  // voeding   — bottom back
]

// ── Brain point cloud ──────────────────────────────────────────────────────────

function pseudoFold(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 8.31 + y * 4.13 + z * 2.71) * 0.5 +
    Math.sin(y * 10.73 + z * 5.37 + x * 3.17) * 0.3 +
    Math.sin(z * 6.91 + x * 7.13 + y * 9.29) * 0.2
  ) * 0.095
}

function generateBrainCloud(total: number) {
  const TEAL  = new THREE.Color('#2DD4BF')
  const CYAN  = new THREE.Color('#67E8F9')
  const BLUE  = new THREE.Color('#6366F1')
  const WHITE = new THREE.Color('#BAE6FD')

  const positions: number[] = []
  const colors: number[]    = []

  const surfaceTarget = Math.round(total * 0.82)

  // ─ Surface particles: two-lobe brain shape ─
  let placed = 0
  while (placed < surfaceTarget) {
    const side  = Math.random() < 0.5 ? -1.0 : 1.0
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)

    const sx = Math.sin(phi) * Math.cos(theta)
    const sy = Math.sin(phi) * Math.sin(theta)
    const sz = Math.cos(phi)

    // Large lobe offset so two hemispheres are clearly visible
    let x = sx * 0.88 + side * 0.64
    let y = sy * 0.82 - 0.04
    let z = sz * 0.96

    // Interhemispheric fissure: reject particles near midline at upper half
    const fissureW = 0.14 * Math.max(0, (y + 0.10) / 0.90)
    if (Math.abs(x) < fissureW) continue

    // Flat bottom
    if (y < -0.80) continue

    // Cortical folding displacement
    const fold = pseudoFold(x, y, z)
    const len  = Math.sqrt(x * x + y * y + z * z) || 1
    x += (x / len) * fold
    y += (y / len) * fold
    z += (z / len) * fold

    positions.push(x, y, z)

    // Color gradient by height + lateral position
    const t   = (y + 0.90) / 1.80       // 0=bottom, 1=top
    const lat = Math.abs(x) / 1.55      // 0=center, 1=edge
    const rnd = Math.random()
    let c: THREE.Color
    if      (rnd < 0.52) c = TEAL.clone().lerp(CYAN, t)
    else if (rnd < 0.80) c = BLUE.clone().lerp(TEAL, lat)
    else                 c = WHITE.clone().multiplyScalar(0.75 + Math.random() * 0.25)

    colors.push(c.r, c.g, c.b)
    placed++
  }

  // ─ Volume particles (dim interior depth) ─
  let vp = 0
  const volumeTarget = total - surfaceTarget
  while (vp < volumeTarget) {
    const x = (Math.random() - 0.5) * 3.0
    const y = (Math.random() - 0.5) * 1.85
    const z = (Math.random() - 0.5) * 2.10
    if ((x / 1.48) ** 2 + (y / 0.93) ** 2 + (z / 1.05) ** 2 > 0.88) continue
    positions.push(x, y, z)
    const c = BLUE.clone().multiplyScalar(0.22)
    colors.push(c.r, c.g, c.b)
    vp++
  }

  return {
    positions: new Float32Array(positions),
    colors:    new Float32Array(colors),
  }
}

// ── Neural connection lines ────────────────────────────────────────────────────

function generateConnections(positions: Float32Array, maxConn: number): Float32Array {
  const n       = positions.length / 3
  const THRESH  = 0.38
  const TSQR    = THRESH * THRESH
  const CS      = THRESH

  const grid = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    const key = `${Math.floor(positions[i * 3] / CS)},${Math.floor(positions[i * 3 + 1] / CS)},${Math.floor(positions[i * 3 + 2] / CS)}`
    const b = grid.get(key)
    if (b) b.push(i)
    else grid.set(key, [i])
  }

  const out: number[] = []
  let conn = 0

  const order = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5)

  for (const i of order) {
    if (conn >= maxConn) break
    const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2]
    const cx = Math.floor(ax / CS), cy = Math.floor(ay / CS), cz = Math.floor(az / CS)
    let pc = 0

    outer:
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nb = grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
          if (!nb) continue
          for (const j of nb) {
            if (j <= i) continue
            const d2 = (ax - positions[j * 3]) ** 2 + (ay - positions[j * 3 + 1]) ** 2 + (az - positions[j * 3 + 2]) ** 2
            if (d2 > TSQR) continue
            out.push(ax, ay, az, positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2])
            conn++
            pc++
            if (pc >= 3 || conn >= maxConn) break outer
          }
        }
      }
    }
  }

  return new Float32Array(out)
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BrainCanvas({ activePillar, scrollProgress }: BrainCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const apRef    = useRef(activePillar)
  const spRef    = useRef(scrollProgress)

  useEffect(() => { apRef.current = activePillar }, [activePillar])
  useEffect(() => { spRef.current = scrollProgress }, [scrollProgress])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W       = mount.clientWidth  || 800
    const H       = mount.clientHeight || 800
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0A0E1A, 1)   // matches lp.bgDeep (brain section bg)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    // ── Scene + Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100)
    camera.position.set(0, 0, 3.7)

    // ── Brain particles ───────────────────────────────────────────────────────
    const { positions, colors } = generateBrainCloud(15000)

    const brainGeo = new THREE.BufferGeometry()
    brainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    brainGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))

    const brainMat = new THREE.PointsMaterial({
      size: 0.027,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const brain = new THREE.Points(brainGeo, brainMat)
    scene.add(brain)

    // ── Neural connection lines ───────────────────────────────────────────────
    const linePositions = generateConnections(positions, 2400)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(lines)

    // ── Hotspot glow sprite ───────────────────────────────────────────────────
    const gc  = Object.assign(document.createElement('canvas'), { width: 128, height: 128 })
    const ctx = gc.getContext('2d')!
    const g   = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0,    'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.22)')
    g.addColorStop(1,    'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(gc)

    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: PILLAR_COLORS[0],
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glowSprite = new THREE.Sprite(glowMat)
    glowSprite.scale.set(0.7, 0.7, 1)
    scene.add(glowSprite)

    // ── Post-processing: Bloom ────────────────────────────────────────────────
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.2, 0.6, 0.05)
    composer.addPass(bloom)

    // ── Animation state ───────────────────────────────────────────────────────
    let rotY   = 0
    let camX   = 0
    let camY   = 0
    let gx     = HOTSPOT_3D[0][0]
    let gy     = HOTSPOT_3D[0][1]
    let gz     = HOTSPOT_3D[0][2]
    let time   = 0
    let animId = 0

    const onMouse = (e: MouseEvent) => {
      camX = (e.clientX / window.innerWidth  - 0.5) * 2
      camY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (!noMotion) window.addEventListener('mousemove', onMouse)

    // ── Render loop ───────────────────────────────────────────────────────────
    function animate() {
      animId = requestAnimationFrame(animate)
      if (!noMotion) time += 0.007

      const sp = spRef.current
      const ap = apRef.current

      // Rotation: slow auto-drift + scroll-driven
      const targetRotY = time * 0.10 + sp * Math.PI * 1.3
      rotY += (targetRotY - rotY) * 0.022

      brain.rotation.y = rotY
      lines.rotation.y = rotY
      brain.rotation.x = camY * 0.14
      lines.rotation.x = camY * 0.14

      // Subtle breathing scale
      const breathe = 1 + Math.sin(time * 0.75) * 0.007
      brain.scale.setScalar(breathe)
      lines.scale.setScalar(breathe)

      // Camera parallax + scroll zoom
      camera.position.x += (camX * 0.40 - camera.position.x) * 0.04
      camera.position.y += (-camY * 0.28 - camera.position.y) * 0.04
      camera.position.z  = 3.7 - sp * 1.0
      camera.lookAt(0, 0, 0)

      // Hotspot: rotate with brain, float gently
      const [hx, hy, hz] = HOTSPOT_3D[ap]
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY)
      const wx = hx * cosR - hz * sinR
      const wz = hx * sinR + hz * cosR
      gx += (wx - gx) * 0.09
      gy += (hy - gy) * 0.09
      gz += (wz - gz) * 0.09
      glowSprite.position.set(gx, gy + Math.sin(time * 2.4) * 0.05, gz)

      glowMat.color = PILLAR_COLORS[ap]
      const pulse = 0.62 + Math.sin(time * 3.8) * 0.38
      glowMat.opacity = 0.88 * pulse
      glowSprite.scale.setScalar(0.48 + pulse * 0.44)

      // Line neural pulse
      lineMat.opacity = 0.065 + Math.sin(time * 1.6) * 0.045

      // Bloom intensifies as you scroll deeper
      bloom.strength = 1.1 + sp * 0.7

      composer.render()
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const nW = mount.clientWidth
      const nH = mount.clientHeight
      if (!nW || !nH) return
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
      composer.setSize(nW, nH)
      bloom.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      brainGeo.dispose()
      brainMat.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      glowTex.dispose()
      glowMat.dispose()
      composer.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
