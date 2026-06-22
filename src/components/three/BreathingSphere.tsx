'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PHASE_COLORS: Record<string, [number, number, number]> = {
  'Inademen':       [0.114, 0.620, 0.459],
  'Snel inademen':  [0.965, 0.620, 0.043],
  'Vasthouden':     [0.486, 0.231, 0.933],
  'Retentie':       [0.486, 0.231, 0.933],
  'Uitademen':      [0.231, 0.510, 0.965],
  'Loslaten':       [0.937, 0.267, 0.267],
}
const DEFAULT_RGB: [number, number, number] = [0.114, 0.620, 0.459]

const VERT = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`

const FRAG_INNER = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(0.0, dot(v, n)), 2.8);
    float pulse = sin(uTime * 1.4) * 0.04 + 0.96;
    vec3 core = uColor * 0.12;
    vec3 rim = uColor * fresnel * 2.4 * pulse;
    float alpha = 0.08 + fresnel * 0.78;
    gl_FragColor = vec4(core + rim, alpha);
  }
`

const FRAG_OUTER = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(0.0, dot(v, n)), 1.4);
    float pulse = sin(uTime * 1.4 + 0.5) * 0.03 + 0.97;
    float alpha = fresnel * 0.16 * pulse;
    gl_FragColor = vec4(uColor, alpha);
  }
`

interface Props {
  scale: number
  phaseName: string
  active: boolean
  size?: number
}

export default function BreathingSphere({ scale, phaseName, active, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const liveRef = useRef({ scale, phaseName, active })

  useEffect(() => {
    liveRef.current = { scale, phaseName, active }
  }, [scale, phaseName, active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 3.0

    const initRGB = PHASE_COLORS[phaseName] ?? DEFAULT_RGB
    const lerpColor = new THREE.Color(initRGB[0], initRGB[1], initRGB[2])
    const targetColor = new THREE.Color()

    const uniforms = {
      uColor: { value: lerpColor },
      uTime: { value: 0 },
    }

    const innerGeo = new THREE.SphereGeometry(1, 64, 64)
    const innerMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG_INNER,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    })
    const innerSphere = new THREE.Mesh(innerGeo, innerMat)

    const outerGeo = new THREE.SphereGeometry(1.28, 32, 32)
    const outerMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG_OUTER,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const outerSphere = new THREE.Mesh(outerGeo, outerMat)

    scene.add(outerSphere)
    scene.add(innerSphere)

    const clock = new THREE.Clock()
    let currentScale = scale

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const { scale: targetScale, phaseName: phase, active: isActive } = liveRef.current
      const elapsed = clock.getElapsedTime()

      currentScale = THREE.MathUtils.lerp(currentScale, targetScale, isActive ? 0.05 : 0.1)
      innerSphere.scale.setScalar(currentScale)
      outerSphere.scale.setScalar(currentScale)

      const rgb = PHASE_COLORS[phase] ?? DEFAULT_RGB
      targetColor.setRGB(rgb[0], rgb[1], rgb[2])
      lerpColor.lerp(targetColor, 0.05)
      uniforms.uColor.value.copy(lerpColor)
      uniforms.uTime.value = elapsed

      innerSphere.rotation.y = elapsed * 0.08
      innerSphere.rotation.x = Math.sin(elapsed * 0.04) * 0.05
      outerSphere.rotation.copy(innerSphere.rotation)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      innerGeo.dispose()
      innerMat.dispose()
      outerGeo.dispose()
      outerMat.dispose()
    }
  }, [size]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', width: size, height: size, pointerEvents: 'none' }}
    />
  )
}
