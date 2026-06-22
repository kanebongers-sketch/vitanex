'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  active: boolean
  width?: number
  height?: number
}

export default function MeditationParticles({ active, width = 600, height = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.z = 5

    const COUNT = 120
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    const phases = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.004
      velocities[i * 3 + 1] = Math.random() * 0.003 + 0.001
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
      phases[i] = Math.random() * Math.PI * 2
    }

    const geo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    geo.setAttribute('position', posAttr)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Color(0.49, 0.23, 0.93) },
      },
      vertexShader: `
        uniform float uTime;
        attribute float phase;
        varying float vAlpha;
        void main() {
          vAlpha = sin(uTime * 0.8 + position.x * 0.3) * 0.4 + 0.6;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (2.0 + sin(uTime + position.y) * 1.0) * (1.0 / -gl_Position.z + 0.5);
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
    let currentOpacity = 0

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Fade in/out
      const targetOpacity = activeRef.current ? 1 : 0
      currentOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.02)
      mat.uniforms.uOpacity.value = currentOpacity
      mat.uniforms.uTime.value = elapsed

      // Update particle positions
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3 + 0] += velocities[i * 3 + 0]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]

        // Wrap top → bottom
        if (positions[i * 3 + 1] > 4) positions[i * 3 + 1] = -3.5
        // Wrap horizontal
        if (positions[i * 3 + 0] > 7.5) positions[i * 3 + 0] = -7.5
        if (positions[i * 3 + 0] < -7.5) positions[i * 3 + 0] = 7.5
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
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block', pointerEvents: 'none',
        borderRadius: 24,
      }}
    />
  )
}
