'use client'

// ─── Interactief neuraal-netwerk achter het 3D-brein ─────────────────────────
// Premium, rustige achtergrond: een wolk van cyaan nodes met dunne synaps-lijnen
// tussen nabije nodes. Rendert BINNEN een bestaande <Canvas> (geen eigen Canvas).
// Strikt 2-kleurig: alleen cyaan-tinten op de navy achtergrond.
//
// Nodes liggen op een jittered grid (gestratificeerd), zodat ze egaal verdeeld
// zijn en er geen felle clusters/hub-nodes ontstaan. Verbindingen alleen tussen
// nodes die ECHT dichtbij liggen (lage linkDistance, max 2 per node): korte,
// lokale synapsen i.p.v. lange spaken door het beeld.
//
// Diepte: nodes dichter bij de camera zijn iets groter én feller; nodes ver weg
// zijn kleiner en zwakker (per-vertex alpha o.b.v. z, in een onBeforeCompile-shader).
// Lijnen vervagen met afstand via per-vertex alpha en zijn bewust heel subtiel
// (fluistering, geen lijnenspel). Geen atmosfeer-glow-sprite: die gaf een waas
// over de navy. Twinkel = heel langzame opacity-variatie per node via een
// tijd-uniform. Geen flikkering.
//
// Beweging is bewust traag (Lando-niveau): heel langzame rotatie + subtiele
// drift, plus lichte parallax die met de muis meebeweegt. Geen flashy effecten.
// prefers-reduced-motion: reduce → rotatie/twinkel/parallax uit, statisch frame.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './theme'

interface NeuralBackgroundProps {
  /** Aantal nodes in de wolk (geclamped 120–300). */
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

// Gelijkmatige spreiding: leg de nodes op een jittered grid (gestratificeerd)
// i.p.v. puur willekeurig. Dat voorkomt felle clusters/hubs en houdt het web
// egaal verdeeld. We kiezen een raster dat het aantal nodes benadert.
function buildJitteredGrid(nodeCount: number): Float32Array {
  const aspect = SPREAD_X / SPREAD_Y
  // cols * rows ≈ nodeCount, met cols/rows ≈ aspect.
  const rows = Math.max(1, Math.round(Math.sqrt(nodeCount / aspect)))
  const cols = Math.max(1, Math.ceil(nodeCount / rows))

  const positions = new Float32Array(nodeCount * 3)
  // Cel-jitter: ~70% van een cel, zodat cellen elkaar net niet overlappen maar
  // het raster onzichtbaar wordt (organisch, niet geometrisch).
  const cellW = (SPREAD_X * 2) / cols
  const cellH = (SPREAD_Y * 2) / rows
  const jitter = 0.7

  let i = 0
  for (let r = 0; r < rows && i < nodeCount; r++) {
    for (let c = 0; c < cols && i < nodeCount; c++) {
      const cx = -SPREAD_X + (c + 0.5) * cellW
      const cy = -SPREAD_Y + (r + 0.5) * cellH
      const x = cx + (Math.random() - 0.5) * cellW * jitter
      const y = cy + (Math.random() - 0.5) * cellH * jitter
      const z = Z_NEAR + Math.random() * (Z_FAR - Z_NEAR)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      i++
    }
  }
  return positions
}

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
  // Gelijkmatige, jittered-grid spreiding (geen clusters/hubs).
  const positions = buildJitteredGrid(nodeCount)
  const nodeDepth = new Float32Array(nodeCount)
  const nodeSeed = new Float32Array(nodeCount)

  for (let i = 0; i < nodeCount; i++) {
    nodeDepth[i] = depthFromZ(positions[i * 3 + 2])
    nodeSeed[i] = Math.random() * Math.PI * 2
  }

  const points = new THREE.BufferGeometry()
  points.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  points.setAttribute('aDepth', new THREE.BufferAttribute(nodeDepth, 1))
  points.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1))
  points.computeBoundingSphere()

  // Synaps-paren: voor elke node de dichtstbijzijnde buren binnen de drempel,
  // beperkt tot maxLinksPerNode. Een paar wordt maar één keer toegevoegd.
  // De afstand weegt Z licht (Z_WEIGHT): nodes die in BEELD dichtbij liggen
  // verbinden, terwijl de grote Z-spreiding niet onnodig lijnen blokkeert. Zo
  // ontstaan korte, lokale synapsen i.p.v. lange spaken dwars over het scherm.
  const Z_WEIGHT = 0.35
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
      const dz = (iz - positions[j * 3 + 2]) * Z_WEIGHT
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
  nodeCount = 240,
  maxLinksPerNode = 2,
  linkDistance = 1.4,
  parallaxStrength = 0.6,
}: NeuralBackgroundProps = {}) {
  const groupRef = useRef<THREE.Group>(null)

  // prefers-reduced-motion één keer lezen (niet per frame).
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const safeNodeCount = Math.max(120, Math.min(300, Math.round(nodeCount)))

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
      size: 0.12,
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
           // Diepte 0 (ver) … 1 (dichtbij): grootte 0.6x → 1.15x (ingetogen,
           // geen grote nodes vooraan die afleiden).
           float depthScale = mix(0.6, 1.15, aDepth);
           // Twinkel: heel langzame, kleine opacity-ademhaling (uit bij reduced).
           float tw = mix(1.0, 0.78 + 0.22 * sin(uTime * 0.5 + aSeed), 1.0 - uReduced);
           // Alpha: ver weg zwakker, dichtbij feller, plus twinkel.
           vAlpha = mix(0.16, 0.8, aDepth) * tw;`,
        )
        // Grootte schalen ná de standaard gl_PointSize-berekening; harde cap in
        // px zodat near-nodes nooit groot/fel uitslaan.
        .replace(
          'gl_PointSize = size;',
          'gl_PointSize = min(size * depthScale, 3.5);',
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
           // Fluistering: ver weg ~0.04, dichtbij ~0.11. Diepte-fade blijft.
           vLineAlpha = mix(0.04, 0.11, aDepth);`,
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

  // Bewust GEEN atmosfeer-glow-sprite: een grote additieve radial-glow gaf een
  // zichtbare cyaan waas/halo waardoor de navy "mistig" werd. De diepte-fade
  // komt nu volledig uit de per-vertex alpha op nodes en lijnen. Navy blijft navy.

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
      <lineSegments geometry={lines} material={linesMaterial} frustumCulled={false} />
      <points geometry={points} material={pointsMaterial} frustumCulled={false} />
    </group>
  )
}
