'use client'

// ─── Interactief neuraal-netwerk achter het 3D-brein ─────────────────────────
// Premium, rustige achtergrond: een wolk van cyaan nodes met dunne synaps-lijnen
// tussen nabije nodes. Rendert BINNEN een bestaande <Canvas> (geen eigen Canvas).
// Strikt 2-kleurig: alleen cyaan-tinten op de navy achtergrond.
//
// Diepte: nodes dichter bij de camera zijn iets groter én feller; nodes ver weg
// zijn kleiner en zwakker (per-vertex alpha o.b.v. z, in een onBeforeCompile-shader).
// Lijnen vervagen met afstand via per-vertex alpha. Een hele subtiele cyaan
// radial-glow geeft atmosfeer/diepte-fade. Twinkel = heel langzame opacity-
// variatie per node via een tijd-uniform. Geen flikkering.
//
// Beweging is bewust traag (Lando-niveau): heel langzame rotatie + subtiele
// drift, plus lichte parallax die met de muis meebeweegt. Geen flashy effecten.
// prefers-reduced-motion: reduce → rotatie/twinkel/parallax uit, statisch frame.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './theme'

interface NeuralBackgroundProps {
  /** Aantal nodes in de wolk (geclamped 120–320). */
  nodeCount?: number
  /** Maximaal aantal synaps-verbindingen per node. */
  maxLinksPerNode?: number
  /** Afstand-drempel waaronder twee nodes verbonden worden. */
  linkDistance?: number
  /** Sterkte van de muis-parallax (0 = uit). */
  parallaxStrength?: number
}

// Verspreiding van de nodewolk (ruim, achter het brein dat ~2.8 units groot is).
const SPREAD_X = 10
const SPREAD_Y = 6
const Z_NEAR = -2
const Z_FAR = -10

interface NeuralGeometry {
  points: THREE.BufferGeometry
  lines: THREE.BufferGeometry
}

// Normaliseert een z-waarde naar 0 (ver weg) … 1 (dichtbij). Gebruikt voor
// per-vertex diepte op zowel nodes als lijnen.
function depthFromZ(z: number): number {
  const t = (z - Z_FAR) / (Z_NEAR - Z_FAR)
  return Math.min(1, Math.max(0, t))
}

// Bouwt de node-posities + synaps-lijnsegmenten één keer (in useMemo).
// Naast posities krijgen nodes een per-vertex diepte (aDepth) en een willekeurige
// fase (aSeed) voor de twinkel. Lijnen krijgen per-vertex diepte (aDepth) zodat
// verre verbindingen vervagen.
function buildNeuralGeometry(
  nodeCount: number,
  maxLinksPerNode: number,
  linkDistance: number,
): NeuralGeometry {
  const positions = new Float32Array(nodeCount * 3)
  const nodeDepth = new Float32Array(nodeCount)
  const nodeSeed = new Float32Array(nodeCount)

  for (let i = 0; i < nodeCount; i++) {
    const z = Z_NEAR + Math.random() * (Z_FAR - Z_NEAR)
    positions[i * 3] = (Math.random() - 0.5) * SPREAD_X * 2
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y * 2
    positions[i * 3 + 2] = z
    nodeDepth[i] = depthFromZ(z)
    nodeSeed[i] = Math.random() * Math.PI * 2
  }

  const points = new THREE.BufferGeometry()
  points.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  points.setAttribute('aDepth', new THREE.BufferAttribute(nodeDepth, 1))
  points.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1))
  points.computeBoundingSphere()

  // Synaps-paren: voor elke node de dichtstbijzijnde buren binnen de drempel,
  // beperkt tot maxLinksPerNode. Een paar wordt maar één keer toegevoegd.
  const linkVerts: number[] = []
  const linkDepth: number[] = []
  const seen = new Set<string>()
  const thresholdSq = linkDistance * linkDistance

  for (let i = 0; i < nodeCount; i++) {
    const ix = positions[i * 3]
    const iy = positions[i * 3 + 1]
    const iz = positions[i * 3 + 2]

    const neighbours: { j: number; distSq: number }[] = []
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue
      const dx = ix - positions[j * 3]
      const dy = iy - positions[j * 3 + 1]
      const dz = iz - positions[j * 3 + 2]
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq <= thresholdSq) neighbours.push({ j, distSq })
    }
    neighbours.sort((a, b) => a.distSq - b.distSq)

    const limit = Math.min(maxLinksPerNode, neighbours.length)
    for (let n = 0; n < limit; n++) {
      const j = neighbours[n].j
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key)) continue
      seen.add(key)
      const jz = positions[j * 3 + 2]
      linkVerts.push(ix, iy, iz, positions[j * 3], positions[j * 3 + 1], jz)
      // Diepte per eindpunt: dichterbij = feller lijn.
      linkDepth.push(depthFromZ(iz), depthFromZ(jz))
    }
  }

  const lines = new THREE.BufferGeometry()
  lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkVerts), 3))
  lines.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(linkDepth), 1))
  lines.computeBoundingSphere()

  return { points, lines }
}

// Shader-uniform-bundel die we per-frame muteren (twinkel-tijd).
interface TimeUniform {
  uTime: { value: number }
}

export default function NeuralBackground({
  nodeCount = 280,
  maxLinksPerNode = 3,
  linkDistance = 2.6,
  parallaxStrength = 0.6,
}: NeuralBackgroundProps = {}) {
  const groupRef = useRef<THREE.Group>(null)

  // prefers-reduced-motion één keer lezen (niet per frame).
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const safeNodeCount = Math.max(120, Math.min(320, Math.round(nodeCount)))

  const { points, lines } = useMemo(
    () => buildNeuralGeometry(safeNodeCount, maxLinksPerNode, linkDistance),
    [safeNodeCount, maxLinksPerNode, linkDistance],
  )

  // Gedeelde twinkel-uniform tussen build-callback en useFrame.
  const timeUniform = useRef<TimeUniform>({ uTime: { value: 0 } })

  // Points-materiaal: per-vertex grootte/alpha o.b.v. diepte + langzame twinkel.
  // We breiden pointsMaterial uit via onBeforeCompile zodat three's sizeAttenuation
  // en blending behouden blijven.
  const pointsMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(COLORS.cyan),
      size: 0.16,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform.current.uTime
      shader.uniforms.uReduced = { value: reducedMotion ? 1 : 0 }

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute float aDepth;
           attribute float aSeed;
           uniform float uTime;
           uniform float uReduced;
           varying float vAlpha;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           // Diepte 0 (ver) … 1 (dichtbij): grootte 0.55x → 1.35x.
           float depthScale = mix(0.55, 1.35, aDepth);
           // Twinkel: heel langzame, kleine opacity-ademhaling (uit bij reduced).
           float tw = mix(1.0, 0.78 + 0.22 * sin(uTime * 0.5 + aSeed), 1.0 - uReduced);
           // Alpha: ver weg zwakker, dichtbij feller, plus twinkel.
           vAlpha = mix(0.18, 0.95, aDepth) * tw;`,
        )
        // Grootte schalen ná de standaard gl_PointSize-berekening.
        .replace(
          'gl_PointSize = size;',
          'gl_PointSize = size * depthScale;',
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying float vAlpha;`,
        )
        // Ronde, zachte node i.p.v. vierkante sprite + per-vertex alpha.
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `float d = length(gl_PointCoord - vec2(0.5));
           float soft = smoothstep(0.5, 0.06, d);
           vec4 diffuseColor = vec4( diffuse, opacity * vAlpha * soft );`,
        )
    }

    return mat
  }, [reducedMotion])

  // Lijn-materiaal: per-vertex alpha o.b.v. diepte (verre lijnen vervagen).
  const linesMaterial = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(COLORS.cyan),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute float aDepth;
           varying float vLineAlpha;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           // Ver weg ~0.05, dichtbij ~0.24 — ingetogen, premium.
           vLineAlpha = mix(0.05, 0.24, aDepth);`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying float vLineAlpha;`,
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          'vec4 diffuseColor = vec4( diffuse, opacity * vLineAlpha );',
        )
    }

    return mat
  }, [])

  // Atmosfeer: één grote, zeer lage-opacity additieve cyaan radial-glow ver achter
  // de wolk. Geeft diepte-fade zonder heldere waas. Textuur één keer gemaakt.
  const glowTexture = useMemo(() => makeRadialGlow(), [])
  const glowMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(COLORS.cyan),
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [glowTexture],
  )

  // Vooraf gealloceerde doel-vector — geen allocaties per frame in useFrame.
  const parallaxTarget = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    if (reducedMotion) {
      // Statisch frame: geen rotatie/twinkel/parallax. Eénmalig op nul zetten.
      group.rotation.set(0, 0, 0)
      group.position.set(0, 0, 0)
      return
    }

    // Twinkel-tijd voortzetten (gedeeld met het points-materiaal).
    timeUniform.current.uTime.value += delta

    // Rustige rotatie van de hele wolk.
    group.rotation.y += delta * 0.02

    // Subtiele drift/pulse: heel langzame ademhaling op de Z-as.
    const t = state.clock.elapsedTime
    group.rotation.z = Math.sin(t * 0.06) * 0.04

    // Lichte parallax: groep beweegt mee met de muis (frame-rate-onafhankelijk).
    parallaxTarget.current.set(
      state.pointer.x * parallaxStrength,
      state.pointer.y * parallaxStrength * 0.5,
      0,
    )
    const k = 1 - Math.exp(-delta * 2.5)
    group.position.lerp(parallaxTarget.current, k)
  })

  return (
    <group ref={groupRef}>
      {/* Atmosferische cyaan glow, ver achter de wolk. Decoratief. */}
      <sprite position={[0, 0, Z_FAR - 2]} scale={[26, 18, 1]} material={glowMaterial} />
      <lineSegments geometry={lines} material={linesMaterial} frustumCulled={false} />
      <points geometry={points} material={pointsMaterial} frustumCulled={false} />
    </group>
  )
}

// Bouwt een zachte radial-gradient textuur (wit→transparant) voor de glow-sprite.
// De kleur komt uit het SpriteMaterial; de textuur levert alleen de alpha-fade.
function makeRadialGlow(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.25)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
