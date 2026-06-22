'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  color?: [number, number, number]
  intensity?: number
  size?: number
  rotate?: boolean
}

const VERT = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvp = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvp.xyz;
    gl_Position = projectionMatrix * mvp;
  }
`
const FRAG_CORE = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPos);
    float fr = pow(1.0 - max(0.0, dot(v, n)), 2.4);
    float pulse = sin(uTime * 1.1) * 0.05 + 0.95;
    float boost = 0.7 + uIntensity * 0.6;
    vec3 core = uColor * 0.10 * boost;
    vec3 rim  = uColor * fr * 2.2 * pulse * boost;
    float alpha = (0.06 + fr * 0.72) * boost;
    gl_FragColor = vec4(core + rim, alpha);
  }
`
const FRAG_HALO = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPos);
    float fr = pow(1.0 - max(0.0, dot(v, n)), 1.2);
    float pulse = sin(uTime * 1.1 + 0.8) * 0.04 + 0.96;
    float boost = 0.5 + uIntensity * 0.5;
    float alpha = fr * 0.14 * pulse * boost;
    gl_FragColor = vec4(uColor, alpha);
  }
`

export default function GlowOrb({
  color = [0.114, 0.620, 0.459],
  intensity = 0.5,
  size = 160,
  rotate = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const liveRef = useRef({ color, intensity })

  useEffect(() => { liveRef.current = { color, intensity } }, [color, intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 3.2

    const initColor = new THREE.Color(color[0], color[1], color[2])
    const lerpColor = initColor.clone()
    const targetColor = new THREE.Color()

    const uniforms = {
      uColor:     { value: lerpColor },
      uTime:      { value: 0 },
      uIntensity: { value: intensity },
    }

    const coreGeo = new THREE.SphereGeometry(1, 48, 48)
    const coreMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG_CORE,
      transparent: true,
      depthWrite: false,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)

    const haloGeo = new THREE.SphereGeometry(1.35, 32, 32)
    const haloMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG_HALO,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const haloMesh = new THREE.Mesh(haloGeo, haloMat)

    scene.add(haloMesh)
    scene.add(coreMesh)

    const clock = new THREE.Clock()
    let curIntensity = intensity

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      const { color: c, intensity: tgt } = liveRef.current

      curIntensity = THREE.MathUtils.lerp(curIntensity, tgt, 0.04)
      uniforms.uIntensity.value = curIntensity

      targetColor.setRGB(c[0], c[1], c[2])
      lerpColor.lerp(targetColor, 0.05)
      uniforms.uColor.value.copy(lerpColor)
      uniforms.uTime.value = elapsed

      if (rotate) {
        coreMesh.rotation.y = elapsed * 0.07
        coreMesh.rotation.x = Math.sin(elapsed * 0.04) * 0.06
        haloMesh.rotation.copy(coreMesh.rotation)
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      haloGeo.dispose()
      haloMat.dispose()
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
