'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// De weekring van de ledenapp in 3D: een verzonken spoor en een boog in de
// accentkleur van de sportschool, als glanzend materiaal dat licht vangt. De
// ring kantelt licht mee met de aanwijzer of de telefoon en staat verder stil:
// er wordt alleen een beeld getekend als er iets verandert (geen vaste lus).
// Puur decoratief (aria-hidden); de betekenis staat in de tekst ernaast.

interface Ring3dProps {
  /** Deel van de ring (0 tot 1). */
  deel: number
  /** De accentkleur zoals de huisstijl hem toont (CSS-kleur). */
  kleur: string
  /** Kleur van het spoor. */
  spoor: string
  maat: number
  /** WebGL kon niet starten: de SVG-ring blijft staan. */
  opFout?: () => void
}

const STRAAL = 1
const BUIS = 0.13

function bouwScene(deel: number, kleur: string, spoor: string) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20)
  camera.position.set(0, 0, 4.4)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.1))
  const zon = new THREE.DirectionalLight(0xffffff, 2.2)
  zon.position.set(-2, 3, 4)
  scene.add(zon)
  const groep = new THREE.Group()
  const spoorVorm = new THREE.TorusGeometry(STRAAL, BUIS * 0.82, 24, 128)
  const spoorStof = new THREE.MeshStandardMaterial({ color: new THREE.Color(spoor), roughness: 0.85, metalness: 0 })
  groep.add(new THREE.Mesh(spoorVorm, spoorStof))
  const boogStof = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(kleur), roughness: 0.28, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.2 })
  if (deel > 0) {
    const boogVorm = new THREE.TorusGeometry(STRAAL, BUIS, 32, 160, Math.PI * 2 * Math.min(1, deel))
    const boog = new THREE.Mesh(boogVorm, boogStof)
    // Begin bovenaan en loop met de klok mee, zoals een klok of de 2D-ring.
    boog.rotation.z = -Math.PI / 2
    boog.scale.x = -1
    groep.add(boog)
  }
  scene.add(groep)
  const opruimen = () => {
    groep.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      o.geometry.dispose()
      ;(o.material as THREE.Material).dispose()
    })
  }
  return { scene, camera, groep, opruimen }
}

export function Ring3d({ deel, kleur, spoor, maat, opFout }: Ring3dProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      el.dataset.mislukt = 'true'
      opFout?.()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(maat, maat, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const { scene, camera, groep, opruimen } = bouwScene(deel, kleur, spoor)
    const doel = { x: -0.18, y: 0.12 }
    groep.rotation.set(doel.x, doel.y, 0)
    let frame = 0
    const teken = () => {
      frame = 0
      groep.rotation.x += (doel.x - groep.rotation.x) * 0.18
      groep.rotation.y += (doel.y - groep.rotation.y) * 0.18
      renderer.render(scene, camera)
      if (Math.abs(doel.x - groep.rotation.x) + Math.abs(doel.y - groep.rotation.y) > 0.001) frame = requestAnimationFrame(teken)
    }
    const vraag = () => {
      if (!frame) frame = requestAnimationFrame(teken)
    }
    const kantel = (nx: number, ny: number) => {
      doel.x = -0.18 + ny * 0.32
      doel.y = 0.12 + nx * 0.42
      vraag()
    }
    const opAanwijzer = (e: PointerEvent) => kantel((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    // Alleen de aanwijzer: de bewegingssensor staat uit in de Permissions-Policy (accelerometer=()).
    window.addEventListener('pointermove', opAanwijzer, { passive: true })
    renderer.render(scene, camera)
    return () => {
      window.removeEventListener('pointermove', opAanwijzer)
      if (frame) cancelAnimationFrame(frame)
      opruimen()
      renderer.dispose()
    }
  }, [deel, kleur, spoor, maat, opFout])
  return <canvas ref={canvas} className="club-ring3d-canvas" width={maat} height={maat} style={{ width: maat, height: maat }} aria-hidden />
}
