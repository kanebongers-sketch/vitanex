// ─── Fit Factory Club, 3D-oefenbeelden: scene ────────────────────────────────
// Renderer, studiobelichting (hoofdlicht, vullicht en twee randlichten die met
// de camera meedraaien), zacht omgevingslicht, vloer met schaduw, zachte
// contactschaduw onder voeten en handen, figuur en materiaal. Geen zware
// nabewerking: soepel op een telefoon. Geen React: dezelfde code draait in het
// losse prototype en in de app.

import {
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
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
import { lusDuur } from '@/lib/club/training/3d/interpolatie'
import { houdingVan } from '@/lib/club/training/3d/beweging'
import { getekendeSpieren, spierSterktes } from '@/lib/club/training/3d/spieren'
import type { Camera, Oefening3d } from '@/lib/club/training/3d/typen'
import { bouwFiguur } from './figuur'
import { bouwMateriaal, type MateriaalMeshes, type Zicht } from './materiaal'
import { maakMateriaalMaterialen, type Thema } from './materiaal-delen'
import type { Palet } from './palet'
import { maakFiguurMaterialen, ruimMaterialenOp } from './stoffen'
import { GeoBak } from './vormen'

export type { Thema } from './materiaal-delen'

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
    huid: '#ad8b79', shirt: '#33363d', broek: '#1c1e22', schoen: '#2b2d33', zool: '#e9e6e0', haar: '#2b221c',
    schaduw: 0.5, vlek: 0.55, contact: 0.7, hemel: 0.45, rand: 2.4, omgeving: 0.55, gloed: 0.32, glans: 0.22, belichting: 1.05,
  },
  licht: {
    huid: '#ad8b79', shirt: '#3b3f47', broek: '#24262b', schoen: '#30333a', zool: '#f1eee8', haar: '#2b221c',
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
    spieren: new Set(getekendeSpieren(o)),
    sterkte: spierSterktes(o),
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

/** Richting van een licht: hoek ten opzichte van de camera die echt kijkt, hoogte in graden. */
function rondom(kader: Camera, hoek: number, hoogte: number): Vector3 {
  const h = ((kader.hoek + hoek) * Math.PI) / 180
  const v = (hoogte * Math.PI) / 180
  return new Vector3(Math.sin(h) * Math.cos(v), Math.sin(v), Math.cos(h) * Math.cos(v))
}

/** Hoofdlicht hoog en iets opzij (korte, rustige slagschaduw), vul- en randlichten volgen de camera. */
function lichten(scene: Scene, kader: Camera, thema: Thema): DirectionalLight {
  const k = KLEUREN[thema]
  const doel = new Vector3(kader.doel.x, 0.7, kader.doel.z)
  scene.add(new HemisphereLight('#f4f1ec', '#4a4542', k.hemel))
  const sleutel = new DirectionalLight('#fff2e2', 2.5)
  sleutel.position.copy(rondom(kader, 32, 62)).multiplyScalar(5).add(doel)
  sleutel.target.position.copy(doel)
  sleutel.castShadow = true
  sleutel.shadow.bias = -0.0004
  sleutel.shadow.normalBias = 0.02
  const vul = new DirectionalLight('#dfe7ff', 0.55)
  vul.position.copy(rondom(kader, -55, 18)).multiplyScalar(5).add(doel)
  vul.target.position.copy(doel)
  const rand1 = new DirectionalLight('#ffffff', k.rand)
  rand1.position.copy(rondom(kader, 150, 30)).multiplyScalar(5).add(doel)
  rand1.target.position.copy(doel)
  const rand2 = new DirectionalLight('#e6edff', k.rand * 0.7)
  rand2.position.copy(rondom(kader, -140, 40)).multiplyScalar(5).add(doel)
  rand2.target.position.copy(doel)
  scene.add(sleutel, sleutel.target, vul, vul.target, rand1, rand1.target, rand2, rand2.target)
  return sleutel
}

/**
 * Meet de hele beweging (figuur en materiaal over de lus) en zet de
 * schaduwcamera van het hoofdlicht er precies omheen: geen afgekapte
 * schaduw bij elke camerahoek, en zo scherp mogelijk binnen de schaduwkaart.
 */
function pasSchaduwAan(licht: DirectionalLight, doos: Box3): void {
  const midden = doos.getCenter(new Vector3())
  const straal = Math.max(0.8, doos.getSize(new Vector3()).length() / 2 + 0.25)
  const richting = licht.position.clone().sub(licht.target.position).normalize()
  licht.target.position.copy(midden)
  licht.position.copy(midden).addScaledVector(richting, straal + 3)
  const s = licht.shadow.camera
  s.left = -straal
  s.right = straal
  s.top = straal
  s.bottom = -straal
  s.near = 0.5
  s.far = 2 * straal + 6
  s.updateProjectionMatrix()
  const kaart = straal > 1.5 ? 2048 : 1024
  licht.shadow.mapSize.set(kaart, kaart)
}

/**
 * Loop de beweging een keer door: het materiaal meet zijn slag (kabel,
 * hefboom) en we krijgen de ruimte die figuur en materiaal samen innemen.
 */
function meetBeweging(o: Oefening3d, materiaal: MateriaalMeshes): Box3 {
  const duur = lusDuur(o.sleutels)
  const stappen = 24
  const standen = Array.from({ length: stappen }, (_, i) => {
    const h = houdingVan(o, (i / stappen) * duur)
    return { h, f: figuurIn(o, h) }
  })
  for (const { f, h } of standen) materiaal.meet(f, h)
  const doos = new Box3()
  for (const { f, h } of standen.filter((_, i) => i % 6 === 0)) {
    materiaal.zet(f, h)
    doos.expandByObject(materiaal.groep)
    const punten = [f.hoofd.pos, f.borst.pos, f.bekken.pos, ...f.handen.map((x) => x.pos), ...f.voeten.map((x) => x.pos), ...f.benen.map((x) => x.midden), ...f.armen.map((x) => x.midden)]
    for (const p of punten) doos.expandByPoint(p)
  }
  // Ruimte voor hoofd, schouders en schoenen rond de gewrichtspunten.
  return doos.expandByScalar(0.12)
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
  const kader = opties.camera ?? o.camera
  const sleutel = lichten(scene, kader, opties.thema)

  const bak = new GeoBak()
  const accent = new Color(opties.accent)
  const mat = maakMateriaalMaterialen(accent, opties.thema)
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
  let cam = camera(kader, 1)
  const zicht: Zicht = { oog: cam.position.clone() }
  const materiaal = bouwMateriaal(bak, mat, o.materiaal, zicht)
  scene.add(figuur.groep, materiaal.groep)
  pasSchaduwAan(sleutel, meetBeweging(o, materiaal))

  return {
    duur: lusDuur(o.sleutels),
    driehoeken: figuur.driehoeken,
    teken(t: number) {
      const h = houdingVan(o, t)
      const f = figuurIn(o, h)
      figuur.zet(f)
      contact.zet(f)
      materiaal.zet(f, h)
      renderer.render(scene, cam)
    },
    grootte(breedte: number, hoogte: number) {
      renderer.setSize(breedte, hoogte, false)
      cam = camera(kader, breedte / Math.max(1, hoogte))
      zicht.oog.copy(cam.position)
    },
    ruimOp() {
      bak.ruimOp()
      vlekTex.dispose()
      contactTex.dispose()
      omgeving.dispose()
      pmrem.dispose()
      ruimMaterialenOp(figuurMat)
      mat.ruimOp()
      const losse = [vloer.material, vlek.material, ...contact.meshes.map((m) => m.material as MeshBasicMaterial)]
      for (const m of losse) m.dispose()
      renderer.dispose()
    },
  }
}
