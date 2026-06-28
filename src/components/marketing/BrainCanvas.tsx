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

// Hotspot positions on brain surface (world space, brain at rest)
const HOTSPOT_3D: [number, number, number][] = [
  [ 0.05,  0.92,  0.35],  // energie  — top
  [ 1.38,  0.12,  0.00],  // slaap    — right
  [-1.38,  0.12,  0.00],  // stress   — left
  [ 0.80, -0.42,  0.60],  // stemming — front-right
  [-0.80, -0.52,  0.22],  // beweging — front-left
  [ 0.05, -0.88, -0.32],  // voeding  — bottom
]

// ── Brain mesh ─────────────────────────────────────────────────────────────────

// Multi-octave sine noise → simulates gyri / sulci
function foldNoise(x: number, y: number, z: number): number {
  const a = Math.sin(x * 4.13 + z * 2.71 + y * 1.37) * Math.cos(y * 3.91 + x * 1.13)
  const b = Math.sin(y * 7.33 + x * 3.17) * Math.cos(z * 5.73 + y * 2.31) * 0.50
  const c = Math.cos(z * 11.13 + x * 5.37) * Math.sin(x * 8.71 + z * 4.13) * 0.25
  const d = Math.sin(x * 19.31 + y * 7.13 + z * 9.37) * 0.125
  return a + b + c + d   // ≈ [-1, 1]
}

function buildBrainGeo(): THREE.BufferGeometry {
  // IcosahedronGeometry detail 6 → 40 962 vertices, 81 920 faces
  const geo = new THREE.IcosahedronGeometry(1.0, 6)
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i)
    const oy = pos.getY(i)
    const oz = pos.getZ(i)

    // Stretch unit sphere to brain proportions
    const bx = ox * 1.52
    const by = oy * 0.87
    const bz = oz * 1.05

    // Surface normal from center
    const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1
    const nx = bx / bl, ny = by / bl, nz = bz / bl

    // Cortical fold displacement — applied radially
    const fold = foldNoise(nx * 2.9, ny * 2.9, nz * 2.9) * 0.115

    // Interhemispheric fissure: groove at top center (narrow Gaussian in x)
    const fis = Math.max(0, ny - 0.20) * Math.exp(-nx * nx / 0.028) * 0.42

    // Combined displacement (outward = positive, inward = negative)
    const d = fold - fis

    pos.setXYZ(i, bx + nx * d, by + ny * d, bz + nz * d)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// ── Synapse particle cloud on brain surface ────────────────────────────────────

function buildSynapses(brainGeo: THREE.BufferGeometry, count: number): THREE.Points {
  const src  = brainGeo.attributes.position as THREE.BufferAttribute
  const step = Math.max(1, Math.floor(src.count / count))
  const arr  = new Float32Array(count * 3)

  let written = 0
  for (let i = 0; written < count && i < src.count; i += step) {
    const vx = src.getX(i), vy = src.getY(i)
    if (Math.abs(vx) < 0.08 && vy > 0.4) continue  // skip fissure interior
    arr[written * 3]     = vx + (Math.random() - 0.5) * 0.025
    arr[written * 3 + 1] = vy + (Math.random() - 0.5) * 0.025
    arr[written * 3 + 2] = src.getZ(i) + (Math.random() - 0.5) * 0.025
    written++
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(arr.slice(0, written * 3), 3))

  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x40e8ff,
    size: 0.018,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }))
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

    const W  = mount.clientWidth  || 800
    const H  = mount.clientHeight || 800
    const nm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0A0E1A, 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    mount.appendChild(renderer.domElement)

    // ── Scene + Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100)
    camera.position.set(0, 0.15, 3.8)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x061525, 7))

    const mainLight = new THREE.DirectionalLight(0xa8dff8, 5.5)
    mainLight.position.set(3, 4, 2)
    scene.add(mainLight)

    // Orbiting rim light (teal) — creates the "scanning" glow
    const rimLight = new THREE.PointLight(0x00ccff, 14, 14)
    rimLight.position.set(-3.5, 0.5, -2.5)
    scene.add(rimLight)

    // Blue-purple fill from below
    const fillLight = new THREE.PointLight(0x4428ee, 5, 10)
    fillLight.position.set(1.0, -4, 2)
    scene.add(fillLight)

    // Soft forward fill so frontal surface is readable
    const frontLight = new THREE.PointLight(0x70c8e8, 2.5, 8)
    frontLight.position.set(0, 0.5, 4)
    scene.add(frontLight)

    // ── Brain mesh ────────────────────────────────────────────────────────────
    const brainGeo = buildBrainGeo()
    const brainMat = new THREE.MeshPhongMaterial({
      color:     new THREE.Color('#0d2a3d'),
      emissive:  new THREE.Color('#040f1a'),
      specular:  new THREE.Color('#55c8e0'),
      shininess: 110,
    })
    const brain = new THREE.Mesh(brainGeo, brainMat)
    scene.add(brain)

    // ── Synapse particles ─────────────────────────────────────────────────────
    const synapses = buildSynapses(brainGeo, 900)
    scene.add(synapses)

    // ── Active pillar glow sprite ─────────────────────────────────────────────
    const gc  = Object.assign(document.createElement('canvas'), { width: 128, height: 128 })
    const ctx = gc.getContext('2d')!
    const g   = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0,    'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.50, 'rgba(255,255,255,0.20)')
    g.addColorStop(1,    'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(gc)

    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, color: PILLAR_COLORS[0],
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const glowSprite = new THREE.Sprite(glowMat)
    glowSprite.scale.set(0.55, 0.55, 1)
    scene.add(glowSprite)

    // ── Post-processing ───────────────────────────────────────────────────────
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    // Threshold 0.28 → only specular highlights + glows bloom
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.9, 0.55, 0.28)
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
    if (!nm) window.addEventListener('mousemove', onMouse)

    // ── Render loop ───────────────────────────────────────────────────────────
    function animate() {
      animId = requestAnimationFrame(animate)
      if (!nm) time += 0.006

      const sp = spRef.current
      const ap = apRef.current

      // Slow auto-drift + scroll-driven rotation
      const targetRotY = time * 0.08 + sp * Math.PI * 1.4
      rotY += (targetRotY - rotY) * 0.018

      brain.rotation.y    = rotY
      synapses.rotation.y = rotY
      brain.rotation.x    = camY * 0.10
      synapses.rotation.x = camY * 0.10

      // Rim light orbits around brain
      const rimAngle = time * 0.28
      rimLight.position.set(
        -3.8 * Math.cos(rimAngle),
        0.5 + Math.sin(rimAngle * 0.6) * 0.8,
        -2.8 * Math.sin(rimAngle),
      )

      // Camera: parallax + scroll zoom
      camera.position.x += (camX * 0.32 - camera.position.x) * 0.04
      camera.position.y += (-camY * 0.18 + 0.15 - camera.position.y) * 0.04
      camera.position.z  = 3.8 - sp * 0.95
      camera.lookAt(0, 0, 0)

      // Hotspot: rotate with brain, float gently
      const [hx, hy, hz] = HOTSPOT_3D[ap]
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY)
      gx += (hx * cosR - hz * sinR - gx) * 0.08
      gy += (hy + Math.sin(time * 2.2) * 0.05 - gy) * 0.08
      gz += (hx * sinR + hz * cosR - gz) * 0.08
      glowSprite.position.set(gx, gy, gz)

      glowMat.color = PILLAR_COLORS[ap]
      const pulse = 0.65 + Math.sin(time * 3.6) * 0.35
      glowMat.opacity = 0.85 * pulse
      glowSprite.scale.setScalar(0.45 + pulse * 0.40)

      // Synapse opacity twinkle
      ;(synapses.material as THREE.PointsMaterial).opacity = 0.45 + Math.sin(time * 2.3) * 0.30

      // Bloom intensifies slightly on scroll
      bloom.strength = 0.85 + sp * 0.55

      composer.render()
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const nW = mount.clientWidth, nH = mount.clientHeight
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
      synapses.geometry.dispose()
      ;(synapses.material as THREE.PointsMaterial).dispose()
      glowTex.dispose()
      glowMat.dispose()
      composer.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
