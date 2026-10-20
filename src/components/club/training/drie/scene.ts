// ─── Fit Factory Club, 3D-oefenbeelden: scene ────────────────────────────────
// Renderer, studiobelichting (hoofdlicht, vullicht en twee randlichten die met
// de camera meedraaien), zacht omgevingslicht, vloer met schaduw, zachte
// contactschaduw onder voeten en handen, figuur en materiaal. Geen zware
// nabewerking: soepel op een telefoon. Geen React: dezelfde code draait in het
// losse prototype en in de app.

import {
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { figuurIn, type Figuur } from '@/lib/club/training/3d/kinematica'
import { houdingOp, lusDuur } from '@/lib/club/training/3d/interpolatie'
import type { Camera, Oefening3d } from '@/lib/club/training/3d/typen'
import { bouwFiguur } from './figuur'
import { bouwMateriaal } from './materiaal'
import type { Palet } from './palet'
import { maakFiguurMaterialen, ruimMaterialenOp } from './stoffen'
import { GeoBak } from './vormen'

export type Thema = 'donker' | 'licht'

export interface SceneOpties {
  readonly accent: string
  readonly thema: Thema
  /** Eigen camerastandpunt (bijvoorbeeld een close-up); standaard dat van de oefening. */
  readonly camera?: Camera
}

export interface Scene3d {
  /** Lengte van een herhaling in seconden. */
  readonly duur: number
  /** Aantal driehoeken van het figuur (voor het meten). */
  readonly driehoeken: number
  /** Zet de beweging op tijd `t` (seconden) en teken. */
  teken(t: number): void
  grootte(breedte: number, hoogte: number): void
  ruimOp(): void
}

const KLEUREN = {
  donker: {
    huid: '#b38b72', shirt: '#33363d', broek: '#1c1e22', schoen: '#2b2d33', zool: '#e9e6e0', haar: '#2b221c',
    schaduw: 0.5, vlek: 0.55, contact: 0.7, hemel: 0.45, rand: 2.4, omgeving: 0.55, gloed: 0.32, glans: 0.22, belichting: 1.05,
  },
  licht: {
    huid: '#b38b72', shirt: '#3b3f47', broek: '#24262b', schoen: '#30333a', zool: '#f1eee8', haar: '#2b221c',
    schaduw: 0.24, vlek: 0.3, contact: 0.42, hemel: 0.6, rand: 1.4, omgeving: 0.65, gloed: 0.26, glans: 0.08, belichting: 1.0,
  },
} as const

function verloop(stops: readonly [number, string][]): Texture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    for (const [o, kleur] of stops) g.addColorStop(o, kleur)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function maakPalet(o: Oefening3d, opties: SceneOpties): Palet {
  const k = KLEUREN[opties.thema]
  return {
    huid: new Color(k.huid),
    shirt: new Color(k.shirt),
    broek: new Color(k.broek),
    schoen: new Color(k.schoen),
    zool: new Color(k.zool),
    haar: new Color(k.haar),
    accent: new Color(opties.accent),
    spieren: new Set(o.spieren),
  }
}

function materiaalMaterialen(accent: Color) {
  return {
    staal: new MeshStandardMaterial({ color: '#d4d7dc', roughness: 0.22, metalness: 0.95 }),
    staalMat: new MeshStandardMaterial({ color: '#b9bcc2', roughness: 0.42, metalness: 0.9 }),
    schijf: new MeshStandardMaterial({ color: '#2b2d32', roughness: 0.55, metalness: 0.15 }),
    accent: new MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.3 }),
    kussen: new MeshStandardMaterial({ color: '#2f3036', roughness: 0.78 }),
    frame: new MeshStandardMaterial({ color: '#8b8f97', roughness: 0.38, metalness: 0.75 }),
    mat: new MeshStandardMaterial({ color: '#34363b', roughness: 0.95 }),
    kabel: new MeshStandardMaterial({ color: '#1e1f22', roughness: 0.6 }),
  }
}

function camera(k: Camera, aspect: number): PerspectiveCamera {
  const c = new PerspectiveCamera(30, aspect, 0.05, 50)
  const h = (k.hoek * Math.PI) / 180
  const v = (k.hoogte * Math.PI) / 180
  const d = k.afstand
  c.position.set(k.doel.x + Math.sin(h) * Math.cos(v) * d, k.doel.y + Math.sin(v) * d, k.doel.z + Math.cos(h) * Math.cos(v) * d)
  c.lookAt(k.doel.x, k.doel.y, k.doel.z)
  return c
}

/** Plek van een licht: hoek ten opzichte van de camera, hoogte in graden. */
function rondom(o: Oefening3d, hoek: number, hoogte: number, afstand: number): Vector3 {
  const h = ((o.camera.hoek + hoek) * Math.PI) / 180
  const v = (hoogte * Math.PI) / 180
  return new Vector3(Math.sin(h) * Math.cos(v) * afstand, Math.sin(v) * afstand, Math.cos(h) * Math.cos(v) * afstand)
    .add(new Vector3(o.camera.doel.x, 0, o.camera.doel.z))
}

function lichten(scene: Scene, o: Oefening3d, thema: Thema): void {
  const k = KLEUREN[thema]
  const doel = new Vector3(o.camera.doel.x, 0.7, o.camera.doel.z)
  scene.add(new HemisphereLight('#f4f1ec', '#4a4542', k.hemel))
  const sleutel = new DirectionalLight('#fff2e2', 2.5)
  sleutel.position.copy(rondom(o, 38, 52, 5))
  sleutel.target.position.copy(doel)
  sleutel.castShadow = true
  sleutel.shadow.mapSize.set(1024, 1024)
  const s = sleutel.shadow.camera
  s.left = -1.6
  s.right = 1.6
  s.top = 1.6
  s.bottom = -1.6
  s.near = 1
  s.far = 10
  sleutel.shadow.bias = -0.0005
  sleutel.shadow.normalBias = 0.025
  const vul = new DirectionalLight('#dfe7ff', 0.55)
  vul.position.copy(rondom(o, -55, 18, 5))
  vul.target.position.copy(doel)
  const rand1 = new DirectionalLight('#ffffff', k.rand)
  rand1.position.copy(rondom(o, 150, 30, 5))
  rand1.target.position.copy(doel)
  const rand2 = new DirectionalLight('#e6edff', k.rand * 0.7)
  rand2.position.copy(rondom(o, -140, 40, 5))
  rand2.target.position.copy(doel)
  scene.add(sleutel, sleutel.target, vul, vul.target, rand1, rand1.target, rand2, rand2.target)
}

interface Contact {
  readonly meshes: readonly Mesh[]
  zet(f: Figuur): void
}

/** Zachte donkere vlekjes waar voeten en handen de vloer raken. */
function contactSchaduw(bak: GeoBak, tex: Texture, sterkte: number, handen: boolean): Contact {
  const maak = (b: number, l: number) => {
    const m = new Mesh(bak.houd(new PlaneGeometry(b, l)), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: sterkte }))
    m.rotation.x = -Math.PI / 2
    m.renderOrder = 1
    return m
  }
  const voeten = [maak(0.2, 0.38), maak(0.2, 0.38)]
  const hand = [maak(0.14, 0.2), maak(0.14, 0.2)]
  const vooruit = new Vector3()
  const zet = (m: Mesh, x: number, y: number, z: number, hoek: number, laag: number) => {
    const op = Math.max(0, 1 - y / laag)
    m.visible = op > 0.02
    m.position.set(x, 0.0015, z)
    m.rotation.z = hoek
    ;(m.material as MeshBasicMaterial).opacity = sterkte * op
  }
  return {
    meshes: handen ? [...voeten, ...hand] : voeten,
    zet(f: Figuur) {
      for (let i = 0; i < 2; i++) {
        const v = f.voeten[i]
        vooruit.set(0, 0, 0.07).applyQuaternion(v.rot)
        zet(voeten[i], v.pos.x + vooruit.x, v.pos.y - 0.08, v.pos.z + vooruit.z, Math.atan2(vooruit.x, vooruit.z), 0.2)
        if (handen) {
          const h = f.handen[i]
          vooruit.set(0, 0.05, 0).applyQuaternion(h.rot)
          zet(hand[i], h.pos.x + vooruit.x, h.pos.y - 0.035, h.pos.z + vooruit.z, 0, 0.15)
        }
      }
    },
  }
}

export function maakScene3d(canvas: HTMLCanvasElement, o: Oefening3d, opties: SceneOpties): Scene3d {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  const k = KLEUREN[opties.thema]
  renderer.toneMappingExposure = k.belichting
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const omgeving = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = omgeving
  scene.environmentIntensity = k.omgeving
  lichten(scene, o, opties.thema)

  const bak = new GeoBak()
  const accent = new Color(opties.accent)
  const mat = materiaalMaterialen(accent)
  const figuurMat = maakFiguurMaterialen({ accent, gloed: k.gloed, glans: k.glans })
  const vloer = new Mesh(bak.houd(new PlaneGeometry(12, 12)), new ShadowMaterial({ opacity: k.schaduw }))
  vloer.rotation.x = -Math.PI / 2
  vloer.receiveShadow = true
  scene.add(vloer)
  const vlekTex = verloop([[0, 'rgba(0,0,0,0.85)'], [0.35, 'rgba(0,0,0,0.4)'], [0.7, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0)']])
  const vlek = new Mesh(bak.houd(new PlaneGeometry(2.6, 2.6)), new MeshBasicMaterial({ map: vlekTex, transparent: true, opacity: k.vlek, depthWrite: false }))
  vlek.rotation.x = -Math.PI / 2
  vlek.position.set(o.camera.doel.x, 0.001, o.camera.doel.z)
  scene.add(vlek)
  const contactTex = verloop([[0, 'rgba(0,0,0,0.9)'], [0.45, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']])
  const contact = contactSchaduw(bak, contactTex, k.contact, o.handen === 'plat')
  scene.add(...contact.meshes)

  const figuur = bouwFiguur(bak, figuurMat, o, maakPalet(o, opties))
  const materiaal = bouwMateriaal(bak, mat, o.materiaal)
  scene.add(figuur.groep, materiaal.groep)

  const kader = opties.camera ?? o.camera
  let cam = camera(kader, 1)

  return {
    duur: lusDuur(o.sleutels),
    driehoeken: figuur.driehoeken,
    teken(t: number) {
      const h = houdingOp(o.sleutels, t)
      const f = figuurIn(o, h)
      figuur.zet(f)
      contact.zet(f)
      materiaal.zet(f, h)
      renderer.render(scene, cam)
    },
    grootte(breedte: number, hoogte: number) {
      renderer.setSize(breedte, hoogte, false)
      cam = camera(kader, breedte / Math.max(1, hoogte))
    },
    ruimOp() {
      bak.ruimOp()
      vlekTex.dispose()
      contactTex.dispose()
      omgeving.dispose()
      pmrem.dispose()
      ruimMaterialenOp(figuurMat)
      const losse = [...Object.values(mat), vloer.material, vlek.material, ...contact.meshes.map((m) => m.material as MeshBasicMaterial)]
      for (const m of losse) m.dispose()
      renderer.dispose()
    },
  }
}
