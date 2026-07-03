'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../theme'
import NeuralBackground from '../NeuralBackground'

// Rustige hero-achtergrond: alleen het cyaan synaps-deeltjesveld op navy,
// zonder brein — zodat de hero-tekst en het e-mailveld alle aandacht krijgen.
// NeuralBackground regelt prefers-reduced-motion zelf (statisch frame).
export default function HeroField() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)

  // Renderlus stilzetten zodra de hero (ruim) uit beeld is — scheelt GPU/batterij.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { rootMargin: '160px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Zachte fade-in bij mount, zodat de canvas niet abrupt inklapt.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="absolute inset-0 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(COLORS.navy), 1)}
        style={{ width: '100%', height: '100%' }}
      >
        <NeuralBackground nodeCount={280} parallaxStrength={0.6} />
      </Canvas>
      {/* Zachte cyaan gloed laag in beeld — sfeer, geen extra kleur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 72%, ${COLORS.cyanSoft} 0%, transparent 65%)`,
        }}
      />
    </div>
  )
}
