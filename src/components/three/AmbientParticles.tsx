'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  color?: [number, number, number]
  count?: number
  opacity?: number
}

export default function AmbientParticles({
  color = [0.114, 0.620, 0.459],
  count = 80,
  opacity = 0.55,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!canvas || !container) return

    const w = container.clientWidth || 600
    const h = container.clientHeight || 400

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    camera.position.z = 5

    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3
      velocities[i * 3]     = (Math.random() - 0.5) * 0.003
      velocities[i * 3 + 1] = Math.random() * 0.0025 + 0.0005
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001
    }

    const geo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    geo.setAttribute('position', posAttr)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:    { value: 0 },
        uOpacity: { value: opacity },
        uColor:   { value: new THREE.Color(color[0], color[1], color[2]) },
      },
      vertexShader: `
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vAlpha = sin(uTime * 0.6 + position.x * 0.5) * 0.35 + 0.65;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (2.5 + sin(uTime * 0.9 + position.y) * 1.0) * (250.0 / -gl_Position.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 xy = gl_PointCoord - 0.5;
          float r = length(xy);
          if (r > 0.5) discard;
          float alpha = (1.0 - r * 2.0) * vAlpha * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    const clock = new THREE.Clock()

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      mat.uniforms.uTime.value = elapsed

      for (let i = 0; i < count; i++) {
        positions[i * 3]     += velocities[i * 3]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]
        if (positions[i * 3 + 1] > 5)   positions[i * 3 + 1] = -4.5
        if (positions[i * 3]     > 8.5)  positions[i * 3]     = -8.5
        if (positions[i * 3]     < -8.5) positions[i * 3]     =  8.5
      }
      posAttr.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [count, opacity]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}
