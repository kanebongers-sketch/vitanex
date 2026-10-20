// ─── Fit Factory Club, 3D-oefenbeelden: scene ────────────────────────────────
// Renderer, belichting (zachte studio met omgevingslicht), vloer met schaduw,
// camera iets schuin van voren, figuur en materiaal. Geen React: dezelfde code
// draait in het losse prototype en in de app.

import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
  type Texture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { figuurIn } from '@/lib/club/training/3d/kinematica'
import { houdingOp, lusDuur } from '@/lib/club/training/3d/interpolatie'
import type { Oefening3d } from '@/lib/club/training/3d/typen'
import { bouwFiguur } from './figuur'
import { bouwMateriaal } from './materiaal'
import { GeoBak } from './vormen'

export type Thema = 'donker' | 'licht'

export interface SceneOpties {
  readonly accent: string
  readonly thema: Thema
}

export interface Scene3d {
  /** Lengte van een herhaling in seconden. */
  readonly duur: number
  /** Zet de beweging op tijd `t` (seconden) en teken. */
  teken(t: number): void
  grootte(breedte: number, hoogte: number): void
  ruimOp(): void
}

const KLEUREN = {
  donker: { huid: '#a8a5a0', kleding: '#4a4c52', haar: '#33322f', schaduw: 0.55, vlek: 0.6, hemel: 0.35 },
  licht: { huid: '#b4b1ab', kleding: '#5d5f66', haar: '#3e3c38', schaduw: 0.22, vlek: 0.32, hemel: 0.5 },
} as const

function vlekTextuur(): Texture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(0,0,0,0.9)')
    g.addColorStop(0.35, 'rgba(0,0,0,0.4)')
    g.addColorStop(0.7, 'rgba(0,0,0,0.1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  return new CanvasTexture(c)
}

function materialen(opties: SceneOpties) {
  const k = KLEUREN[opties.thema]
  const accent = new Color(opties.accent)
  const huid = new MeshStandardMaterial({ color: k.huid, roughness: 0.62, metalness: 0 })
  const spier = new MeshStandardMaterial({ color: new Color(k.huid).lerp(accent, 0.62), roughness: 0.6, metalness: 0 })
  return {
    figuur: {
      romp: new MeshStandardMaterial({ vertexColors: true, roughness: 0.64, metalness: 0 }),
      kleuren: { huid: new Color(k.huid), kleding: new Color(k.kleding), accent },
      huid,
      spier,
      kleding: new MeshStandardMaterial({ color: k.kleding, roughness: 0.85 }),
      schoen: new MeshStandardMaterial({ color: '#2a2b2f', roughness: 0.7 }),
      haar: new MeshStandardMaterial({ color: k.haar, roughness: 0.9 }),
    },
    materiaal: {
      staal: new MeshStandardMaterial({ color: '#d4d7dc', roughness: 0.22, metalness: 0.95 }),
      staalMat: new MeshStandardMaterial({ color: '#b9bcc2', roughness: 0.42, metalness: 0.9 }),
      schijf: new MeshStandardMaterial({ color: '#2b2d32', roughness: 0.55, metalness: 0.15 }),
      accent: new MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.3 }),
      kussen: new MeshStandardMaterial({ color: '#2f3036', roughness: 0.78 }),
      frame: new MeshStandardMaterial({ color: '#8b8f97', roughness: 0.38, metalness: 0.75 }),
      mat: new MeshStandardMaterial({ color: '#34363b', roughness: 0.95 }),
      kabel: new MeshStandardMaterial({ color: '#1e1f22', roughness: 0.6 }),
    },
  }
}

function camera(o: Oefening3d, aspect: number): PerspectiveCamera {
  const c = new PerspectiveCamera(30, aspect, 0.1, 50)
  const h = (o.camera.hoek * Math.PI) / 180
  const v = (o.camera.hoogte * Math.PI) / 180
  const d = o.camera.afstand
  c.position.set(o.camera.doel.x + Math.sin(h) * Math.cos(v) * d, o.camera.doel.y + Math.sin(v) * d, o.camera.doel.z + Math.cos(h) * Math.cos(v) * d)
  c.lookAt(o.camera.doel.x, o.camera.doel.y, o.camera.doel.z)
  return c
}

function lichten(scene: Scene, hemel: number): void {
  scene.add(new HemisphereLight('#ffffff', '#6d6a66', hemel))
  const sleutel = new DirectionalLight('#fff4e8', 2.6)
  sleutel.position.set(1.6, 4.2, 2.6)
  sleutel.castShadow = true
  sleutel.shadow.mapSize.set(2048, 2048)
  sleutel.shadow.camera.left = -1.8
  sleutel.shadow.camera.right = 1.8
  sleutel.shadow.camera.top = 1.8
  sleutel.shadow.camera.bottom = -1.8
  sleutel.shadow.camera.near = 0.5
  sleutel.shadow.camera.far = 10
  sleutel.shadow.bias = -0.0004
  sleutel.shadow.normalBias = 0.02
  sleutel.shadow.radius = 5
  scene.add(sleutel)
  const rand = new DirectionalLight('#e8eefc', 1.3)
  rand.position.set(-2.5, 2.4, -3)
  scene.add(rand)
}

export function maakScene3d(canvas: HTMLCanvasElement, o: Oefening3d, opties: SceneOpties): Scene3d {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const omgeving = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = omgeving
  scene.environmentIntensity = 0.4
  const k = KLEUREN[opties.thema]
  lichten(scene, k.hemel)

  const bak = new GeoBak()
  const mat = materialen(opties)
  const vloer = new Mesh(bak.houd(new PlaneGeometry(12, 12)), new ShadowMaterial({ opacity: k.schaduw }))
  vloer.rotation.x = -Math.PI / 2
  vloer.receiveShadow = true
  scene.add(vloer)
  const vlekTex = vlekTextuur()
  const vlek = new Mesh(bak.houd(new PlaneGeometry(2.4, 2.4)), new MeshBasicMaterial({ map: vlekTex, transparent: true, opacity: k.vlek, depthWrite: false }))
  vlek.rotation.x = -Math.PI / 2
  vlek.position.set(0, 0.001, o.camera.doel.z)
  scene.add(vlek)

  const figuur = bouwFiguur(bak, mat.figuur, o.spieren, o.handen)
  const materiaal = bouwMateriaal(bak, mat.materiaal, o.materiaal)
  scene.add(figuur.groep, materiaal.groep)

  let cam = camera(o, 1)

  return {
    duur: lusDuur(o.sleutels),
    teken(t: number) {
      const h = houdingOp(o.sleutels, t)
      const f = figuurIn(o, h)
      figuur.zet(f)
      materiaal.zet(f, h)
      renderer.render(scene, cam)
    },
    grootte(breedte: number, hoogte: number) {
      renderer.setSize(breedte, hoogte, false)
      cam = camera(o, breedte / Math.max(1, hoogte))
    },
    ruimOp() {
      bak.ruimOp()
      vlekTex.dispose()
      omgeving.dispose()
      pmrem.dispose()
      const { romp, huid, spier, kleding, schoen, haar } = mat.figuur
      for (const m of [romp, huid, spier, kleding, schoen, haar, ...Object.values(mat.materiaal), vloer.material, vlek.material]) m.dispose()
      renderer.dispose()
    },
  }
}
