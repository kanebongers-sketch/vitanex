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

const HOTSPOT_FRAC = [
  [0.50, 0.22],
  [0.74, 0.38],
  [0.30, 0.40],
  [0.62, 0.58],
  [0.38, 0.66],
  [0.52, 0.78],
]

const PARTICLE_COLORS = ['#2DD4BF', '#3B82F6', '#8B5CF6']

export default function BrainCanvas({ activePillar, scrollProgress }: BrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const activePillarRef = useRef(activePillar)
  const scrollRef = useRef(scrollProgress)

  useEffect(() => { activePillarRef.current = activePillar }, [activePillar])
  useEffect(() => { scrollRef.current = scrollProgress }, [scrollProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 700
    const H = 700
    canvas.width = W
    canvas.height = H

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Load brain image
    const img = new Image()
    img.src = '/Brain.png'
    imgRef.current = img

    // Init particles — scattered around the brain area
    type Particle = {
      x: number; y: number; vx: number; vy: number
      size: number; speed: number; offset: number; colorIdx: number
    }

    const particles: Particle[] = Array.from({ length: 500 }, () => {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * 260 + 80
      return {
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.6 + 0.3,
        speed: Math.random() * 0.006 + 0.002,
        offset: Math.random() * Math.PI * 2,
        colorIdx: [0, 0, 0, 1, 1, 1, 1, 2, 2][Math.floor(Math.random() * 9)],
      }
    })

    let time = 0
    let rotation = 0

    function tick() {
      if (!ctx || !canvas) return

      const ap = activePillarRef.current
      const sp = scrollRef.current

      if (!prefersReduced) time += 0.016

      // Smooth rotation driven by scroll (±15°)
      const targetRot = (sp - 0.5) * 0.52
      rotation += (targetRot - rotation) * 0.06
      const floatY = prefersReduced ? 0 : Math.sin(time * 0.5) * 10

      ctx.clearRect(0, 0, W, H)

      // ── Draw brain image with rotation ──────────────────────────────────────
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        ctx.save()
        ctx.translate(W / 2, H / 2 + floatY)
        ctx.rotate(rotation)
        ctx.drawImage(imgRef.current, -W / 2, -H / 2, W, H)
        ctx.restore()
      }

      // ── Active zone glow over the brain ─────────────────────────────────────
      const accentColor = PILLAR_COLORS[ap]
      const [hx, hy] = HOTSPOT_FRAC[ap]
      const gx = hx * W
      const gy = hy * H + floatY
      const zoneGrd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90)
      zoneGrd.addColorStop(0, accentColor + '55')
      zoneGrd.addColorStop(0.5, accentColor + '18')
      zoneGrd.addColorStop(1, 'transparent')
      ctx.fillStyle = zoneGrd
      ctx.beginPath()
      ctx.arc(gx, gy, 90, 0, Math.PI * 2)
      ctx.fill()

      // ── Particles ───────────────────────────────────────────────────────────
      particles.forEach((p, i) => {
        if (!prefersReduced) {
          if (i < 40) {
            // Pull toward active hotspot
            p.x += (gx - p.x) * 0.007
            p.y += (gy - p.y) * 0.007
          } else {
            p.x += p.vx
            p.y += p.vy
            if (p.x < 0) p.x = W
            if (p.x > W) p.x = 0
            if (p.y < 0) p.y = H
            if (p.y > H) p.y = 0
          }
        }

        const twinkle = 0.3 + 0.7 * Math.sin(time * p.speed * 100 + p.offset)
        const color = i < 40 ? accentColor : PARTICLE_COLORS[p.colorIdx]
        const alpha = Math.floor(twinkle * 200).toString(16).padStart(2, '0')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color + alpha
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(tick)
    }

    // Start loop; wait for image so first frame isn't blank
    if (img.complete) {
      animRef.current = requestAnimationFrame(tick)
    } else {
      img.onload = () => { animRef.current = requestAnimationFrame(tick) }
      img.onerror = () => { animRef.current = requestAnimationFrame(tick) }
    }

    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
