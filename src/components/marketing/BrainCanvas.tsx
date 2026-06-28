'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface BrainCanvasProps {
  activePillar: number
  scrollProgress: number
}

const PILLAR_COLORS_HEX = [0xF5A524, 0x6366F1, 0x2DD4BF, 0xA78BFA, 0xFB7185, 0x34D399]
const PILLAR_COLORS_STR = ['#F5A524', '#6366F1', '#2DD4BF', '#A78BFA', '#FB7185', '#34D399']

// Hotspot positions in normalized device coords (-1..1) mapped to plane surface
const HOTSPOT_UV = [
  [0.0,  0.35],  // energie   — top center
  [0.7,  0.1],   // slaap     — right mid
  [-0.65, 0.1],  // stress    — left mid
  [0.35, -0.2],  // stemming  — center right low
  [-0.3, -0.45], // beweging  — left low
  [0.05, -0.65], // voeding   — center bottom
]

export default function BrainCanvas({ activePillar, scrollProgress }: BrainCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const apRef = useRef(activePillar)
  const spRef = useRef(scrollProgress)

  useEffect(() => { apRef.current = activePillar }, [activePillar])
  useEffect(() => { spRef.current = scrollProgress }, [scrollProgress])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Scene + Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200)
    camera.position.z = 4.2

    // ── Brain plane (AdditiveBlending → black becomes transparent) ──────────
    const BRAIN_W = 5.5
    const BRAIN_H = 3.0  // matches 1408/768 aspect ratio
    const brainGeo = new THREE.PlaneGeometry(BRAIN_W, BRAIN_H)
    const brainMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const brain = new THREE.Mesh(brainGeo, brainMat)
    scene.add(brain)

    // Glow halo — slightly larger, more transparent copy
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x6699ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(BRAIN_W * 1.25, BRAIN_H * 1.25),
      haloMat
    )
    halo.position.z = -0.01
    scene.add(halo)

    // Load texture
    const loader = new THREE.TextureLoader()
    loader.load(
      '/brain.png',
      (tex) => {
        brainMat.map = tex
        brainMat.opacity = 1
        brainMat.needsUpdate = true
        haloMat.map = tex
        haloMat.opacity = 0.18
        haloMat.needsUpdate = true
      },
      undefined,
      (err) => { console.error('brain.png laad fout:', err) }
    )

    // ── Particles ────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 1800
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const offsets = new Float32Array(PARTICLE_COUNT)
    const baseColors = [
      new THREE.Color('#2DD4BF'),
      new THREE.Color('#3B82F6'),
      new THREE.Color('#8B5CF6'),
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute in a flattened ellipsoid around the brain
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.0 + Math.random() * 2.5
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 1.8
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.0
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.6

      const c = baseColors[Math.floor(Math.random() * baseColors.length)]
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      sizes[i]   = Math.random() * 3.5 + 0.8
      speeds[i]  = Math.random() * 0.006 + 0.001
      offsets[i] = Math.random() * Math.PI * 2
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Active hotspot sprite (glowing dot at pillar location) ───────────────
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = 128
    glowCanvas.height = 128
    const gc = glowCanvas.getContext('2d')!
    const grad = gc.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.2, 'rgba(255,255,255,0.6)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.15)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    gc.fillStyle = grad
    gc.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(glowCanvas)

    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(PILLAR_COLORS_STR[0]),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      })
    )
    glowSprite.scale.set(1.2, 1.2, 1)
    scene.add(glowSprite)

    // ── State for smooth lerping ─────────────────────────────────────────────
    let currentRotY   = 0
    let currentRotX   = 0
    let currentCamZ   = 4.2
    let currentGlowX  = 0
    let currentGlowY  = 0
    let mouseTargetX  = 0
    let mouseTargetY  = 0
    let time          = 0
    let animId        = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseTargetX = (e.clientX / window.innerWidth  - 0.5) * 0.6
      mouseTargetY = (e.clientY / window.innerHeight - 0.5) * -0.3
    }
    if (!prefersReduced) window.addEventListener('mousemove', onMouseMove)

    // ── Render loop ──────────────────────────────────────────────────────────
    function animate() {
      animId = requestAnimationFrame(animate)
      if (!prefersReduced) time += 0.012

      const sp  = spRef.current
      const ap  = apRef.current

      // Scroll → rotation (brain rotates 180° across full scroll section)
      const targetRotY = sp * Math.PI * 1.1
      const targetRotX = prefersReduced ? 0 : Math.sin(time * 0.4) * 0.06
      currentRotY += (targetRotY - currentRotY) * 0.04
      currentRotX += (targetRotX + mouseTargetY * 0.5 - currentRotX) * 0.06

      // Camera zoom in as you scroll deeper
      const targetCamZ = 4.2 - sp * 1.0
      currentCamZ += (targetCamZ - currentCamZ) * 0.04

      // Mouse parallax on camera
      camera.position.x += (mouseTargetX * 0.5 - camera.position.x) * 0.05
      camera.position.y += (mouseTargetY * 0.3 - camera.position.y) * 0.05
      camera.position.z  = currentCamZ
      camera.lookAt(scene.position)

      brain.rotation.y   = currentRotY
      brain.rotation.x   = currentRotX
      halo.rotation.y    = currentRotY
      halo.rotation.x    = currentRotX

      // Particles rotate slowly + tilt with mouse
      particles.rotation.y = time * 0.06 + currentRotY * 0.1
      particles.rotation.x = mouseTargetY * 0.2

      // Update particle twinkle via opacity cycles
      particleMat.opacity = 0.55 + Math.sin(time * 1.2) * 0.15

      // Glowing hotspot sprite position (in brain local space)
      const [hsx, hsy] = HOTSPOT_UV[ap]
      const targetGlowX = hsx * (BRAIN_W * 0.45)
      const targetGlowY = hsy * (BRAIN_H * 0.45)
      currentGlowX += (targetGlowX - currentGlowX) * 0.08
      currentGlowY += (targetGlowY - currentGlowY) * 0.08

      // Rotate hotspot with brain
      const cosR = Math.cos(currentRotY)
      const sinR = Math.sin(currentRotY)
      glowSprite.position.x = currentGlowX * cosR
      glowSprite.position.y = currentGlowY + Math.sin(time * 0.5) * 0.05
      glowSprite.position.z = currentGlowX * sinR + 0.05

      const glowColor = new THREE.Color(PILLAR_COLORS_STR[ap])
      ;(glowSprite.material as THREE.SpriteMaterial).color = glowColor
      const pulse = 0.7 + Math.sin(time * 3) * 0.3
      glowSprite.scale.set(1.0 * pulse, 1.0 * pulse, 1)

      // Tint halo to active pillar color
      haloMat.color = new THREE.Color(PILLAR_COLORS_HEX[ap])
      haloMat.opacity = 0.08 + pulse * 0.06

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return
      const nW = mount.clientWidth
      const nH = mount.clientHeight
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      brainGeo.dispose()
      brainMat.dispose()
      haloMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      glowTex.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'none' }}
    />
  )
}
