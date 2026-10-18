// ─── Fit Factory Club, illustraties: een stand van een oefening (PUUR) ──────
// Meng begin en eind, zet het lichaam en het materiaal neer, laat handen en
// voeten met inverse kinematica aanhaken en geef alle lagen terug. Plus een
// beeldkader dat over de hele beweging past, en een tijdlijn voor de animatie.

import { meng, tijdlijn } from './interpolatie'
import { opVolgorde, voegSamen, type Laag, type Lagen } from './laag'
import { lichaamZij } from './lichaam-zij'
import { ankers, materiaalLagen, PLAAT_SCHUIF, VLOER, type MateriaalContext, type MateriaalStand } from './materiaal'
import { geplaatsteRomp, MATEN, voetPunt, zijSkelet, type Romp, type ZijSkelet } from './skelet-zij'
import type { Doel, MateriaalHouding, Oefening, ZijHouding } from './typen'
import { plus, punt, type Vec } from './vec'
import { lichaamVoor, voorSkelet, type VoorSkelet } from './voor'
import { ellips } from './vorm'

export interface Stand {
  readonly lagen: Laag[]
  readonly skelet: ZijSkelet | VoorSkelet
  readonly materiaal: readonly MateriaalStand[]
  /** Haalde elke hand en voet zijn doel? (voor de tests) */
  readonly bereikt: boolean
}

function plekInRomp(m: MateriaalHouding, romp: Romp): Vec | null {
  const p = m.plek
  if ('wereld' in p) return p.wereld
  if (p.aan === 'bekken' || p.aan === 'lumbaal' || p.aan === 'thoracaal') return punt(romp[p.aan], p.langs, p.dwars)
  return null
}

function standVan(m: MateriaalHouding, pos: Vec): MateriaalStand {
  return { id: m.id, soort: m.soort, pos, hoek: m.hoek ?? 90, maat: m.maat ?? {}, kabelVan: m.kabelVan }
}

function zoeker(geplaatst: ReadonlyMap<string, MateriaalStand>) {
  return (doel: Doel): Vec => {
    if ('wereld' in doel) return doel.wereld
    const s = geplaatst.get(doel.materiaal)
    if (!s) throw new Error(`Materiaal ${doel.materiaal} is nog niet geplaatst (aan een hand vastgemaakt materiaal kan geen doel zijn).`)
    const a = ankers(s)[doel.punt]
    if (!a) throw new Error(`Materiaal ${doel.materiaal} heeft geen ankerpunt ${doel.punt}.`)
    return doel.verschuif ? plus(a, doel.verschuif) : a
  }
}

function aanHand(m: MateriaalHouding, s: ZijSkelet): Vec | null {
  const p = m.plek
  if (!('aan' in p) || (p.aan !== 'handNabij' && p.aan !== 'handVer')) return null
  const arm = p.aan === 'handNabij' ? s.armNabij : s.armVer
  return punt(arm.hand, MATEN.hand + (p.langs ?? 0), p.dwars ?? 0)
}

/** Zachte schaduw op de vloer onder alles wat de vloer raakt. */
function vloerSchaduw(xs: readonly number[]): Laag {
  const x0 = Math.min(...xs) - 10
  const x1 = Math.max(...xs) + 10
  return { sleutel: 'vloer', d: ellips({ x: (x0 + x1) / 2, y: VLOER - 0.6 }, (x1 - x0) / 2, 2.6), kleur: 'vloer' }
}

function vloerBereik(m: MateriaalStand): number[] {
  switch (m.soort) {
    case 'bank': return [m.pos.x - (m.maat.lengte ?? 118) / 2 + 8, m.pos.x + (m.maat.lengte ?? 118) / 2 - 8]
    case 'schuineBank': return [m.pos.x - 36, m.pos.x + 24]
    case 'latPulldown': return [m.pos.x - 20, m.pos.x + (m.maat.toren ?? 44) + 30]
    case 'seatedRow': return [m.pos.x - 30, m.pos.x + (m.maat.voetX ?? 70) + 50]
    case 'legPress': return [m.pos.x - 34, m.pos.x + 125]
    case 'rek': return [m.pos.x - (m.maat.diepte ?? 92) / 2 - 9, m.pos.x + (m.maat.diepte ?? 92) / 2 + 9]
    case 'kabelkolom': return [m.pos.x - 17, m.pos.x + 17]
    default: return []
  }
}

function zijStand(h: ZijHouding, o: Oefening): Stand {
  const { romp } = geplaatsteRomp(h)
  const geplaatst = new Map<string, MateriaalStand>()
  for (const m of h.materiaal) {
    const pos = plekInRomp(m, romp)
    if (pos) geplaatst.set(m.id, standVan(m, pos))
  }
  const s = zijSkelet(h, zoeker(geplaatst))
  for (const m of h.materiaal) {
    const pos = aanHand(m, s)
    if (pos) geplaatst.set(m.id, standVan(m, pos))
  }
  const ctx: MateriaalContext = { aanzicht: 'zij', plaatSchuif: o.plaatSchuif ?? { x: PLAAT_SCHUIF, y: 0 } }
  const materiaal = h.materiaal.map((m) => geplaatst.get(m.id)).filter((m): m is MateriaalStand => m !== undefined)
  const lichaam = lichaamZij(s, o.spieren)
  // Alles wat de vloer (bijna) raakt: voeten, knieen, ellebogen, en het materiaal.
  const contact = [
    ...[s.beenNabij, s.beenVer].flatMap((b) => [voetPunt(b.voet, 'hiel'), voetPunt(b.voet, 'teen'), b.onder.o]),
    ...[s.armNabij, s.armVer].map((a) => a.onder.o),
  ].filter((p) => p.y > VLOER - 12)
  const xs = [...contact.map((p) => p.x), ...materiaal.flatMap(vloerBereik)]
  const lagen = voegSamen({ achter: [vloerSchaduw(xs.length ? xs : [s.bekken.o.x])] }, ...materiaal.map((m) => materiaalLagen(m, ctx)), lichaam)
  const bereikt = [s.armNabij, s.armVer, s.beenNabij, s.beenVer].every((l) => l.bereikt)
  return { lagen: opVolgorde(lagen), skelet: s, materiaal, bereikt }
}

function voorStand(h: Extract<Oefening['begin'], { aanzicht: 'voor' }>, o: Oefening): Stand {
  const s = voorSkelet(h)
  const materiaal = h.materiaal.map((m, i) => {
    const arm = s.armen[i % 2]
    return standVan(m, arm.greep)
  })
  const ctx: MateriaalContext = { aanzicht: 'voor', plaatSchuif: { x: PLAAT_SCHUIF, y: 0 } }
  const enkels = s.benen.map((b) => b.enkel.x)
  const lagen: Lagen = voegSamen(
    { achter: [vloerSchaduw(enkels)] },
    ...materiaal.map((m) => materiaalLagen(m, ctx)),
    lichaamVoor(s, o.spieren),
  )
  return { lagen: opVolgorde(lagen), skelet: s, materiaal, bereikt: true }
}

/** De oefening op menging 0 (begin) tot 1 (eind). */
export function standOp(o: Oefening, menging: number): Stand {
  const h = meng(o.begin, o.eind, menging)
  if (h.aanzicht === 'zij') return zijStand(h, o)
  return voorStand(h, o)
}

export interface Kader {
  readonly x: number
  readonly y: number
  readonly b: number
  readonly h: number
}

/** Alle getallen uit een pad, als punten (genoeg voor een omhullend kader). */
function puntenUitPad(d: string): Vec[] {
  const getallen = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  const uit: Vec[] = []
  for (let i = 0; i + 1 < getallen.length; i += 2) uit.push({ x: getallen[i], y: getallen[i + 1] })
  return uit
}

/** Een vierkant kader rond alle standen, met de vloer op een vaste hoogte onderin. */
export function kaderVoor(standen: readonly Stand[], marge = 0.07): Kader {
  return kaderRond(standen.map((s) => s.lagen), marge)
}

/** Een vierkant kader rond lagen (een of meer standen). */
export function kaderRond(lijsten: readonly (readonly Laag[])[], marge = 0.07): Kader {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const lagen of lijsten) {
    for (const l of lagen) {
      for (const p of puntenUitPad(l.d)) {
        x0 = Math.min(x0, p.x)
        x1 = Math.max(x1, p.x)
        y0 = Math.min(y0, p.y)
        y1 = Math.max(y1, p.y)
      }
    }
  }
  const b = x1 - x0
  const h = y1 - y0
  const zijde = Math.max(b, h) * (1 + 2 * marge)
  // Staand (hoger dan breed): de vloer vast onderin. Liggend of breed: verticaal in het midden.
  const y = h >= b * 0.8 ? y1 + zijde * marge * 1.2 - zijde : (y0 + y1) / 2 - zijde / 2 + zijde * 0.04
  return { x: (x0 + x1) / 2 - zijde / 2, y, b: zijde, h: zijde }
}

export interface Animatie {
  readonly kader: Kader
  /** Per laag (zelfde volgorde in elke stand): sleutel, kleur en het pad per beeld. */
  readonly sporen: readonly { readonly laag: Laag; readonly paden: readonly string[] }[]
  readonly momenten: readonly number[]
  readonly beelden: readonly number[]
  readonly duur: number
}

/** Alles voor een vloeiende SVG-animatie: een pad per laag per beeld, met tijdstippen. */
export function animatie(o: Oefening, stappen = 12): Animatie {
  const t = tijdlijn(o.heen, stappen)
  const standen = t.mengingen.map((m) => standOp(o, m))
  const basis = standen[0].lagen
  for (const s of standen) {
    if (s.lagen.length !== basis.length || s.lagen.some((l, i) => l.sleutel !== basis[i].sleutel)) {
      throw new Error(`De lagen van ${o.naam} veranderen tussen standen; dan kan de animatie niet vloeiend.`)
    }
  }
  return {
    kader: kaderVoor(standen),
    sporen: basis.map((laag, i) => ({ laag, paden: standen.map((s) => s.lagen[i].d) })),
    momenten: t.momenten,
    beelden: t.beelden,
    duur: t.duur,
  }
}

