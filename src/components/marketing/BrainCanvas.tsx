'use client'

import { useEffect, useRef } from 'react'

interface BrainCanvasProps {
  activePillar: number
  scrollProgress: number
}

const PILLAR_COLORS = [
  '#F5A524', // energie
  '#6366F1', // slaap
  '#2DD4BF', // stress
  '#A78BFA', // stemming
  '#FB7185', // beweging
  '#34D399', // voeding
]

export default function BrainCanvas({ activePillar, scrollProgress }: BrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef({
    brainY: 0,
    brainRotation: 0,
    time: 0,
    particles: [] as Array<{
      x: number; y: number; vx: number; vy: number
      opacity: number; size: number; speed: number
      offset: number; colorIdx: number
      ox: number; oy: number
    }>,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const W = 700
    const H = 700
    canvas.width = W
    canvas.height = H

    // Init particles
    const count = 500
    const colorWeights = [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2]
    stateRef.current.particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * 280 + 60
      const x = W / 2 + Math.cos(angle) * r
      const y = H / 2 + Math.sin(angle) * r
      return {
        x, y,
        ox: x, oy: y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        opacity: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.008 + 0.002,
        offset: Math.random() * Math.PI * 2,
        colorIdx: colorWeights[Math.floor(Math.random() * colorWeights.length)],
      }
    })

    const PARTICLE_COLORS = ['#2DD4BF', '#3B82F6', '#8B5CF6']

    function drawBrain(
      ctx: CanvasRenderingContext2D,
      cx: number, cy: number,
      rotation: number, floatY: number,
      active: number
    ) {
      ctx.save()
      ctx.translate(cx, cy + floatY)

      // Outer glow
      const accentColor = PILLAR_COLORS[active]
      const grd = ctx.createRadialGradient(0, 0, 60, 0, 0, 240)
      grd.addColorStop(0, `${accentColor}22`)
      grd.addColorStop(0.5, 'rgba(45,212,191,0.06)')
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(0, 0, 240, 0, Math.PI * 2)
      ctx.fill()

      // Brain silhouette — left hemisphere
      const skew = Math.sin(rotation) * 18
      ctx.save()
      ctx.translate(skew, 0)

      const brainGrd = ctx.createRadialGradient(-30, -20, 20, 0, 0, 180)
      brainGrd.addColorStop(0, 'rgba(45,212,191,0.18)')
      brainGrd.addColorStop(0.4, 'rgba(59,130,246,0.12)')
      brainGrd.addColorStop(0.8, 'rgba(139,92,246,0.08)')
      brainGrd.addColorStop(1, 'rgba(5,7,13,0)')

      ctx.fillStyle = brainGrd
      ctx.strokeStyle = `rgba(45,212,191,${0.15 + Math.abs(Math.sin(rotation)) * 0.1})`
      ctx.lineWidth = 1.2

      // Left lobe
      ctx.beginPath()
      ctx.moveTo(-10, 60)
      ctx.bezierCurveTo(-80, 50, -160, -10, -140, -80)
      ctx.bezierCurveTo(-130, -140, -60, -160, 0, -150)
      ctx.bezierCurveTo(10, -148, 10, -140, 5, -130)
      ctx.bezierCurveTo(-50, -120, -100, -80, -90, -30)
      ctx.bezierCurveTo(-80, 20, -30, 50, -10, 60)
      ctx.fill()
      ctx.stroke()

      // Right lobe
      ctx.beginPath()
      ctx.moveTo(10, 60)
      ctx.bezierCurveTo(80, 50, 160, -10, 140, -80)
      ctx.bezierCurveTo(130, -140, 60, -160, 0, -150)
      ctx.bezierCurveTo(-10, -148, -10, -140, -5, -130)
      ctx.bezierCurveTo(50, -120, 100, -80, 90, -30)
      ctx.bezierCurveTo(80, 20, 30, 50, 10, 60)
      ctx.fill()
      ctx.stroke()

      // Corpus callosum divider
      ctx.beginPath()
      ctx.moveTo(0, -150)
      ctx.lineTo(0, 60)
      ctx.strokeStyle = 'rgba(45,212,191,0.12)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Brain stem
      ctx.beginPath()
      ctx.moveTo(-15, 60)
      ctx.bezierCurveTo(-20, 100, -10, 130, 0, 140)
      ctx.bezierCurveTo(10, 130, 20, 100, 15, 60)
      ctx.fillStyle = 'rgba(45,212,191,0.06)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(45,212,191,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Active zone glow
      const hotspots = [
        { lx: 0, ly: -120 },
        { lx: 90, ly: -40 },
        { lx: -80, ly: -30 },
        { lx: 60, ly: 30 },
        { lx: -60, ly: 50 },
        { lx: 10, ly: 90 },
      ]
      const hs = hotspots[active]
      const zoneGrd = ctx.createRadialGradient(hs.lx, hs.ly, 0, hs.lx, hs.ly, 80)
      zoneGrd.addColorStop(0, `${accentColor}40`)
      zoneGrd.addColorStop(0.5, `${accentColor}15`)
      zoneGrd.addColorStop(1, 'transparent')
      ctx.fillStyle = zoneGrd
      ctx.beginPath()
      ctx.arc(hs.lx, hs.ly, 80, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
      ctx.restore()
    }

    function tick() {
      if (!ctx || !canvas) return
      const s = stateRef.current

      if (!prefersReduced) {
        s.time += 0.016
      }

      // Lerp rotation toward scroll-driven target
      const targetRotation = (scrollProgress - 0.5) * 0.52
      s.brainRotation += (targetRotation - s.brainRotation) * 0.06

      const floatY = prefersReduced ? 0 : Math.sin(s.time * 0.5) * 12

      ctx.clearRect(0, 0, W, H)

      // Background gradient
      const bgGrd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2)
      bgGrd.addColorStop(0, 'rgba(15,21,36,0.4)')
      bgGrd.addColorStop(1, 'transparent')
      ctx.fillStyle = bgGrd
      ctx.fillRect(0, 0, W, H)

      // Particles
      const activeColor = PILLAR_COLORS[activePillar]
      s.particles.forEach((p, i) => {
        if (!prefersReduced) {
          if (i < 40) {
            // Pull toward active hotspot region
            const hotspotX = W * [0.5, 0.74, 0.3, 0.62, 0.38, 0.52][activePillar]
            const hotspotY = H * [0.22, 0.38, 0.40, 0.58, 0.66, 0.78][activePillar]
            p.x += (hotspotX - p.x) * 0.008
            p.y += (hotspotY - p.y) * 0.008
          } else {
            p.x += p.vx
            p.y += p.vy
            // Wrap
            if (p.x < 0) p.x = W
            if (p.x > W) p.x = 0
            if (p.y < 0) p.y = H
            if (p.y > H) p.y = 0
          }
        }

        const twinkle = 0.3 + 0.7 * Math.sin(s.time * p.speed * 100 + p.offset)
        const color = i < 40 ? activeColor : PARTICLE_COLORS[p.colorIdx]
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color + Math.floor(twinkle * 180).toString(16).padStart(2, '0')
        ctx.fill()
      })

      drawBrain(ctx, W / 2, H / 2, s.brainRotation, floatY, activePillar)

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [activePillar, scrollProgress])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
