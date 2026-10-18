// ─── Fit Factory Club, illustraties: materiaal als losse onderdelen (PUUR) ──
// Barbell met schijven, dumbbell, kettlebell, banken, rek, kabel met katrol en
// drie machines, in dezelfde rustige vlakke stijl als het figuur. Elk stuk geeft
// zijn ankerpunten (waar een hand of voet aanhaakt) en zijn lagen, verdeeld over
// de dieptevakken: de verre schijf achter het lichaam, de nabije ervoor.
// De vloer ligt op y = 0; alles erboven heeft een negatieve y.

import type { Laag, Vak } from './laag'
import type { MateriaalHouding, MateriaalSoort } from './typen'
import { plus, punt, assen, v, type Vec } from './vec'
import { ellips, gladGesloten, lijnstuk, rondeRechthoek } from './vorm'

export const VLOER = 0

export interface MateriaalStand {
  readonly id: string
  readonly soort: MateriaalSoort
  readonly pos: Vec
  readonly hoek: number
  readonly maat: Readonly<Record<string, number>>
  readonly kabelVan?: Vec
}

export interface MateriaalContext {
  readonly aanzicht: 'zij' | 'voor'
  /** Verschuiving van de nabije schijf ten opzichte van de stang. */
  readonly plaatSchuif: Vec
}

type Deel = Partial<Record<Vak, Laag[]>>

export const PLAAT_SCHUIF = 24

function m(s: MateriaalStand, sleutel: string, standaard: number): number {
  return s.maat[sleutel] ?? standaard
}

/** Waar een hand of voet aan dit stuk vastpakt. */
export function ankers(s: MateriaalStand): Record<string, Vec> {
  const a = assen(s.pos, s.hoek)
  switch (s.soort) {
    case 'seatedRow':
      return { voet: plus(s.pos, v(m(s, 'voetX', 70), m(s, 'voetY', -8))) }
    case 'legPress': {
      const slede = sledePunt(s)
      return { voet: slede }
    }
    case 'kettlebell':
      return { greep: s.pos, links: punt(a, 0, -4.2), rechts: punt(a, 0, 4.2) }
    default:
      return { greep: s.pos }
  }
}

// ── Vrije gewichten ─────────────────────────────────────────────────────────

function schijf(c: Vec, r: number, schuif: Vec, sleutel: string, ver: boolean, glas = false): Laag[] {
  // De dikte van de schijf: een tweede rand iets naar de stang toe.
  const l = Math.hypot(schuif.x, schuif.y) || 1
  const rand = v(c.x - (schuif.x / l) * 2.6, c.y - (schuif.y / l) * 2.6)
  if (glas) {
    // Doorzichtig getekend (zoals een fantoomlijn): het lichaam erachter blijft zichtbaar.
    return [
      { sleutel: `${sleutel}-vlak`, d: ellips(c, r, r), kleur: 'schijfGlas' },
      { sleutel: `${sleutel}-rand`, d: ellips(c, r - 0.7, r - 0.7), kleur: 'schijfRand', lijn: 1.4 },
      { sleutel: `${sleutel}-naaf`, d: ellips(c, 3.6, 3.6), kleur: 'metaal' },
      { sleutel: `${sleutel}-gat`, d: ellips(c, 1.5, 1.5), kleur: 'metaalDonker' },
    ]
  }
  return [
    { sleutel: `${sleutel}-dikte`, d: ellips(rand, r, r), kleur: 'schijfRand' },
    { sleutel: `${sleutel}-vlak`, d: ellips(c, r, r), kleur: ver ? 'schijfVer' : 'schijf' },
    { sleutel: `${sleutel}-ring`, d: ellips(c, r * 0.72, r * 0.72), kleur: 'schijfRand', lijn: 0.7 },
    { sleutel: `${sleutel}-naaf`, d: ellips(c, 3.6, 3.6), kleur: 'metaal' },
    { sleutel: `${sleutel}-gat`, d: ellips(c, 1.5, 1.5), kleur: 'metaalDonker' },
  ]
}

function barbell(s: MateriaalStand, ctx: MateriaalContext): Deel {
  const r = m(s, 'r', 22.5)
  const sch = ctx.plaatSchuif
  const ver = v(s.pos.x - sch.x, s.pos.y - sch.y)
  const nabij = plus(s.pos, sch)
  const glas = m(s, 'glas', 0) === 1
  return {
    // Bij een doorzichtige nabije schijf staat de verre er bijna recht achter: alleen een zacht vlak.
    achter: glas ? [{ sleutel: `${s.id}-ver-vlak`, d: ellips(ver, r, r), kleur: 'schijfGlas' }] : schijf(ver, r, v(-sch.x, -sch.y), `${s.id}-ver`, true),
    verVoor: [{ sleutel: `${s.id}-stang-ver`, d: lijnstuk(ver, s.pos), kleur: 'metaal', lijn: 2.6 }],
    voor: [{ sleutel: `${s.id}-stang-nabij`, d: lijnstuk(s.pos, nabij), kleur: 'metaal', lijn: 2.6 }],
    top: schijf(nabij, r, sch, `${s.id}-nabij`, false, glas),
  }
}

/** Dumbbell met de as in het beeldvlak (hoek = richting van de as). */
function dumbbellZij(s: MateriaalStand, sleutel: string, ver: boolean): Laag[] {
  const a = assen(s.pos, s.hoek)
  const kop = m(s, 'kop', 11)
  return [
    { sleutel: `${sleutel}-stang`, d: rondeRechthoek(s.pos, 15, 2.8, 1.4, s.hoek - 90), kleur: 'metaal' },
    { sleutel: `${sleutel}-kop1`, d: rondeRechthoek(punt(a, 10, 0), 7, kop, 2.2, s.hoek - 90), kleur: ver ? 'schijfVer' : 'schijf' },
    { sleutel: `${sleutel}-kop2`, d: rondeRechthoek(punt(a, -10, 0), 7, kop, 2.2, s.hoek - 90), kleur: ver ? 'schijfVer' : 'schijf' },
    { sleutel: `${sleutel}-kraag1`, d: rondeRechthoek(punt(a, 6, 0), 1.6, kop * 0.62, 0.6, s.hoek - 90), kleur: 'schijfRand' },
    { sleutel: `${sleutel}-kraag2`, d: rondeRechthoek(punt(a, -6, 0), 1.6, kop * 0.62, 0.6, s.hoek - 90), kleur: 'schijfRand' },
  ]
}

/** Dumbbell met de as naar de kijker: je ziet de kop, de andere kop iets verschoven erachter. */
function dumbbellKop(s: MateriaalStand, ver: boolean): Deel {
  const r = m(s, 'kop', 11) / 2
  const schuif = m(s, 'schuif', 3.2)
  const achter = plus(s.pos, v(0, -schuif))
  const voor = plus(s.pos, v(0, schuif))
  const achterLagen: Laag[] = [
    { sleutel: `${s.id}-achter`, d: ellips(achter, r, r), kleur: 'schijfVer' },
    { sleutel: `${s.id}-stang`, d: rondeRechthoek(s.pos, 2.8, schuif * 2, 1.2), kleur: 'metaal' },
  ]
  const voorLagen: Laag[] = [
    { sleutel: `${s.id}-rand`, d: ellips(plus(voor, v(0, -1.2)), r, r), kleur: 'schijfRand' },
    { sleutel: `${s.id}-voor`, d: ellips(voor, r, r), kleur: ver ? 'schijfVer' : 'schijf' },
    { sleutel: `${s.id}-naaf`, d: ellips(voor, r * 0.36, r * 0.36), kleur: 'metaal' },
  ]
  return ver ? { verVoor: achterLagen, midden: voorLagen } : { voor: achterLagen, top: voorLagen }
}

function dumbbell(s: MateriaalStand): Deel {
  const ver = m(s, 'ver', 0) === 1
  if (m(s, 'eind', 0) === 1) return dumbbellKop(s, ver)
  const lagen = dumbbellZij(s, s.id, ver)
  return ver ? { verVoor: lagen } : { voor: lagen }
}

function kettlebell(s: MateriaalStand): Deel {
  const a = assen(s.pos, s.hoek)
  // Handvat: een gesloten lus (buitenrand en binnenrand, gat via evenodd).
  const buiten = [punt(a, -6, -7.2), punt(a, 1.6, -6.4), punt(a, 2.4, 0), punt(a, 1.6, 6.4), punt(a, -6, 7.2)]
  const binnen = [punt(a, -6.4, 4.6), punt(a, -0.6, 4.2), punt(a, -0.2, 0), punt(a, -0.6, -4.2), punt(a, -6.4, -4.6)]
  return {
    tussen: [
      { sleutel: `${s.id}-handvat`, d: `${gladGesloten(buiten, 0.8)}${gladGesloten(binnen, 0.8)}`, kleur: 'metaalDonker', evenodd: true },
      { sleutel: `${s.id}-bol`, d: gladGesloten([punt(a, -5.5, -6.5), punt(a, -10, -10.2), punt(a, -17, -10.6), punt(a, -22.6, -6.6), punt(a, -24, 0), punt(a, -22.6, 6.6), punt(a, -17, 10.6), punt(a, -10, 10.2), punt(a, -5.5, 6.5)]), kleur: 'schijf' },
      { sleutel: `${s.id}-glans`, d: ellips(punt(a, -11.5, 4.4), 2.2, 3.6, s.hoek + 30), kleur: 'glans' },
      { sleutel: `${s.id}-voet`, d: rondeRechthoek(punt(a, -23.6, 0), 1.6, 12, 0.8, s.hoek - 90), kleur: 'schijfRand' },
    ],
  }
}

// ── Banken en rek ───────────────────────────────────────────────────────────

function poot(x: number, boven: number, vloer: number, sleutel: string): Laag[] {
  return [
    { sleutel: `${sleutel}-staander`, d: rondeRechthoek(v(x, (boven + vloer) / 2 - 1), 4.4, vloer - boven - 2, 1.2), kleur: 'frame' },
    { sleutel: `${sleutel}-voet`, d: rondeRechthoek(v(x, vloer - 1.4), 16, 2.8, 1.4), kleur: 'frame' },
  ]
}

function bank(s: MateriaalStand): Deel {
  const l = m(s, 'lengte', 118)
  const dik = 8.5
  const vloer = m(s, 'vloer', VLOER)
  const midden = plus(s.pos, v(0, dik / 2))
  const balk = s.pos.y + dik + 2.6
  return {
    achter: [
      { sleutel: `${s.id}-balk`, d: rondeRechthoek(v(s.pos.x, balk), l - 24, 4.2, 1.4), kleur: 'frame' },
      ...poot(s.pos.x - l / 2 + 16, balk, vloer, `${s.id}-poot1`),
      ...poot(s.pos.x + l / 2 - 16, balk, vloer, `${s.id}-poot2`),
    ],
    midden: [
      { sleutel: `${s.id}-kussen`, d: rondeRechthoek(midden, l, dik, 3.6), kleur: 'kussen' },
      { sleutel: `${s.id}-naad`, d: rondeRechthoek(plus(midden, v(0, -dik / 2 + 1.1)), l - 4, 1, 0.5), kleur: 'glans' },
    ],
  }
}

/** Een bank met een rugleuning onder een hoek (graden vanaf horizontaal). pos = zitvlak. */
function schuineBank(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const scheef = -(90 - m(s, 'leuning', 80))
  const zit = plus(s.pos, v(0, 4))
  // De leuning begint achter de zit en loopt omhoog, iets naar achteren.
  const richt = assen(plus(s.pos, v(-15, 6)), scheef)
  const balk = s.pos.y + 13
  return {
    achter: [
      { sleutel: `${s.id}-balk`, d: rondeRechthoek(v(s.pos.x - 6, balk), 60, 4.2, 1.4), kleur: 'frame' },
      { sleutel: `${s.id}-steun`, d: lijnstuk(v(s.pos.x - 26, balk), punt(richt, 30, -6)), kleur: 'frame', lijn: 4 },
      ...poot(s.pos.x - 28, balk, vloer, `${s.id}-poot1`),
      ...poot(s.pos.x + 16, balk, vloer, `${s.id}-poot2`),
    ],
    midden: [
      { sleutel: `${s.id}-leuning`, d: rondeRechthoek(punt(richt, 36, -4.3), 8.5, 72, 3.6, scheef), kleur: 'kussen' },
      { sleutel: `${s.id}-zit`, d: rondeRechthoek(zit, 38, 8.5, 3.6), kleur: 'kussen' },
    ],
  }
}

function rek(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const hoog = m(s, 'hoogte', 218)
  const breed = m(s, 'diepte', 92)
  const pin = m(s, 'pin', 66)
  const xs = [s.pos.x - breed / 2, s.pos.x + breed / 2]
  const lagen: Laag[] = xs.flatMap((x, i) => [
    { sleutel: `${s.id}-staander${i}`, d: rondeRechthoek(v(x, vloer - hoog / 2), 5.5, hoog, 1.2), kleur: 'frameVer' as const },
    { sleutel: `${s.id}-voet${i}`, d: rondeRechthoek(v(x, vloer - 1.5), 18, 3, 1.2), kleur: 'frameVer' as const },
  ])
  return {
    achter: [
      ...lagen,
      { sleutel: `${s.id}-boven`, d: rondeRechthoek(v(s.pos.x, vloer - hoog + 2.5), breed + 5.5, 5, 1.2), kleur: 'frameVer' },
      { sleutel: `${s.id}-onder`, d: rondeRechthoek(v(s.pos.x, vloer - 4), breed, 3, 1.2), kleur: 'frameVer' },
      { sleutel: `${s.id}-pin`, d: rondeRechthoek(v(s.pos.x, vloer - pin), breed + 14, 3.2, 1.6), kleur: 'frame' },
    ],
  }
}

// ── Kabels en machines ──────────────────────────────────────────────────────

function katrol(c: Vec, sleutel: string): Laag[] {
  return [
    { sleutel: `${sleutel}-wiel`, d: ellips(c, 4.6, 4.6), kleur: 'frame' },
    { sleutel: `${sleutel}-as`, d: ellips(c, 1.5, 1.5), kleur: 'metaal' },
  ]
}

function kabel(van: Vec, naar: Vec, sleutel: string): Laag {
  return { sleutel: `${sleutel}-kabel`, d: lijnstuk(van, naar), kleur: 'kabel', lijn: 0.8 }
}

function kabelkolom(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const hoog = m(s, 'hoogte', 205)
  const katrolY = m(s, 'katrol', 40)
  return {
    achter: [
      { sleutel: `${s.id}-kolom`, d: rondeRechthoek(v(s.pos.x, vloer - hoog / 2), 9, hoog, 2), kleur: 'frame' },
      { sleutel: `${s.id}-voet`, d: rondeRechthoek(v(s.pos.x, vloer - 1.6), 34, 3.2, 1.4), kleur: 'frame' },
      { sleutel: `${s.id}-slede`, d: rondeRechthoek(v(s.pos.x - 6.5, vloer - katrolY), 6, 12, 1.6), kleur: 'metaalDonker' },
      ...katrol(v(s.pos.x - 9, vloer - katrolY), `${s.id}-katrol`),
    ],
  }
}

/** Handvat aan een kabel: een V-greep (zijaanzicht), met kabel vanaf kabelVan. */
function handvat(s: MateriaalStand): Deel {
  const a = assen(s.pos, s.hoek)
  const lus = [punt(a, -2.4, -3), punt(a, 2.8, -3.4), punt(a, 3.6, 0), punt(a, 2.8, 3.4), punt(a, -2.4, 3), punt(a, -6.4, 1), punt(a, -7.6, 0), punt(a, -6.4, -1)]
  return {
    midden: s.kabelVan ? [kabel(s.kabelVan, punt(a, -7.2, 0), s.id)] : [],
    tussen: [{ sleutel: `${s.id}-greep`, d: gladGesloten(lus, 0.8), kleur: 'metaalDonker' }],
  }
}

/** De stang van een lat pulldown, iets schuin gezien: een kort stuk met de kabel naar boven. */
function latstang(s: MateriaalStand): Deel {
  return {
    tussen: [
      ...(s.kabelVan ? [kabel(s.kabelVan, s.pos, s.id)] : []),
      { sleutel: `${s.id}-stang`, d: rondeRechthoek(s.pos, 22, 3, 1.5, s.hoek - 90), kleur: 'metaal' },
      { sleutel: `${s.id}-greep`, d: rondeRechthoek(s.pos, 12, 3.4, 1.7, s.hoek - 90), kleur: 'metaalDonker' },
    ],
  }
}

function gewichtstoren(x: number, vloer: number, hoog: number, sleutel: string): Laag[] {
  const stapel = Array.from({ length: 7 }, (_, i) => ({
    sleutel: `${sleutel}-plaat${i}`,
    d: rondeRechthoek(v(x, vloer - 9 - i * 5.2), 15, 4.2, 0.8),
    kleur: 'schijfVer' as const,
  }))
  return [
    { sleutel: `${sleutel}-kast`, d: rondeRechthoek(v(x, vloer - hoog / 2), 22, hoog, 2.5), kleur: 'frameVer' },
    { sleutel: `${sleutel}-geleider`, d: rondeRechthoek(v(x, vloer - hoog / 2 - 4), 1.6, hoog - 16, 0.8), kleur: 'metaal' },
    ...stapel,
  ]
}

/** pos = zitvlak onder de billen. kabelVan = katrol boven de stang. */
function latPulldown(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const torenX = s.pos.x + m(s, 'toren', 44)
  const top = s.kabelVan ?? v(s.pos.x + 18, -215)
  const balkY = top.y - 7
  const padX = s.pos.x + m(s, 'padX', 20)
  const padY = s.pos.y + m(s, 'padY', -24)
  return {
    achter: [
      ...gewichtstoren(torenX + 18, vloer, 150, `${s.id}-toren`),
      { sleutel: `${s.id}-kolom`, d: rondeRechthoek(v(torenX, (vloer + balkY) / 2), 7, vloer - balkY, 2), kleur: 'frame' },
      { sleutel: `${s.id}-arm`, d: rondeRechthoek(v((top.x + torenX) / 2 - 2, balkY), torenX - top.x + 12, 6, 2), kleur: 'frame' },
      ...katrol(top, `${s.id}-katrol`),
      { sleutel: `${s.id}-basis`, d: rondeRechthoek(v((s.pos.x + torenX) / 2 + 8, vloer - 2), torenX - s.pos.x + 60, 4, 1.4), kleur: 'frame' },
      { sleutel: `${s.id}-zuil`, d: rondeRechthoek(v(s.pos.x + 2, (s.pos.y + vloer) / 2 + 4), 5, vloer - s.pos.y - 8, 1.2), kleur: 'frame' },
      { sleutel: `${s.id}-padsteun`, d: lijnstuk(v(padX + 7, padY), v(torenX, padY + 12)), kleur: 'frame', lijn: 3.6 },
    ],
    midden: [
      { sleutel: `${s.id}-zit`, d: rondeRechthoek(plus(s.pos, v(2, 4)), 38, 8.5, 3.6), kleur: 'kussen' },
    ],
    tussen: [
      { sleutel: `${s.id}-pad`, d: ellips(v(padX, padY), 6.2, 6.2), kleur: 'kussen' },
      { sleutel: `${s.id}-padas`, d: ellips(v(padX, padY), 1.6, 1.6), kleur: 'metaal' },
    ],
  }
}

/** pos = zitvlak. Voetplaat via maat voetX/voetY, katrol onder de voetplaat (kabelVan van het handvat). */
function seatedRow(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const voet = plus(s.pos, v(m(s, 'voetX', 70), m(s, 'voetY', -8)))
  const katrolPos = v(voet.x + 10, vloer - 14)
  return {
    achter: [
      ...gewichtstoren(voet.x + 40, vloer, 150, `${s.id}-toren`),
      { sleutel: `${s.id}-kolom`, d: rondeRechthoek(v(voet.x + 16, vloer - 70), 7, 140, 2), kleur: 'frame' },
      ...katrol(katrolPos, `${s.id}-katrol`),
      { sleutel: `${s.id}-balk`, d: rondeRechthoek(v((s.pos.x + voet.x) / 2 + 4, s.pos.y + 13), voet.x - s.pos.x + 46, 4.2, 1.4), kleur: 'frame' },
      ...poot(s.pos.x - 22, s.pos.y + 13, vloer, `${s.id}-poot1`),
      ...poot(voet.x + 2, s.pos.y + 13, vloer, `${s.id}-poot2`),
    ],
    midden: [
      { sleutel: `${s.id}-zit`, d: rondeRechthoek(plus(s.pos, v(-4, 4)), 58, 8.5, 3.6), kleur: 'kussen' },
      { sleutel: `${s.id}-voetsteun`, d: rondeRechthoek(plus(voet, v(5.4, 0)), 4.2, 30, 1.6, -18), kleur: 'frame' },
    ],
  }
}

/** Waar de voeten op de slede staan (45 graden, maat slede = afstand langs de rails). */
function sledePunt(s: MateriaalStand): Vec {
  const rails = assen(plus(s.pos, v(26, -10)), 45)
  return punt(rails, m(s, 'slede', 70), -9)
}

/** pos = zitvlak. Een leg press onder 45 graden met slede, rugleuning en gewichtshouders. */
function legPress(s: MateriaalStand): Deel {
  const vloer = m(s, 'vloer', VLOER)
  const rails = assen(plus(s.pos, v(26, -10)), 45)
  const slede = m(s, 'slede', 70)
  const plaat = punt(rails, slede, -5)
  const leuning = assen(plus(s.pos, v(-8, -4)), -40)
  return {
    achter: [
      { sleutel: `${s.id}-rails`, d: lijnstuk(punt(rails, -6, 6), punt(rails, 128, 6)), kleur: 'frame', lijn: 6 },
      { sleutel: `${s.id}-railvoet`, d: lijnstuk(punt(rails, 128, 6), v(punt(rails, 128, 6).x, vloer)), kleur: 'frame', lijn: 5 },
      { sleutel: `${s.id}-basis`, d: rondeRechthoek(v(s.pos.x + 50, vloer - 2), 150, 4, 1.4), kleur: 'frame' },
      { sleutel: `${s.id}-zuil`, d: lijnstuk(plus(s.pos, v(0, 6)), v(s.pos.x, vloer)), kleur: 'frame', lijn: 5 },
      { sleutel: `${s.id}-leuningsteun`, d: lijnstuk(punt(leuning, 20, 8), v(s.pos.x - 34, vloer)), kleur: 'frame', lijn: 4 },
    ],
    midden: [
      { sleutel: `${s.id}-zit`, d: rondeRechthoek(plus(s.pos, v(4, 4)), 34, 8.5, 3.6, 8), kleur: 'kussen' },
      { sleutel: `${s.id}-leuning`, d: rondeRechthoek(punt(leuning, 30, 4), 8.5, 62, 3.6, -40), kleur: 'kussen' },
      { sleutel: `${s.id}-slede`, d: rondeRechthoek(punt(rails, slede + 10, 1), 46, 6, 2, -45), kleur: 'frame' },
      { sleutel: `${s.id}-plaat`, d: rondeRechthoek(plaat, 5, 44, 1.8, 45), kleur: 'metaalDonker' },
      { sleutel: `${s.id}-houder`, d: rondeRechthoek(punt(rails, slede + 26, 10), 3, 14, 1, 45), kleur: 'metaal' },
      { sleutel: `${s.id}-schijf`, d: ellips(punt(rails, slede + 26, 20), 15, 15), kleur: 'schijf' },
      { sleutel: `${s.id}-schijfnaaf`, d: ellips(punt(rails, slede + 26, 20), 3, 3), kleur: 'metaal' },
    ],
  }
}

/** Lagen van een stuk materiaal. */
export function materiaalLagen(s: MateriaalStand, ctx: MateriaalContext): Deel {
  switch (s.soort) {
    case 'barbell': return barbell(s, ctx)
    case 'dumbbell': return dumbbell(s)
    case 'dumbbellStaand': return { tussen: dumbbellZij({ ...s, hoek: 0 }, s.id, false) }
    case 'kettlebell': return kettlebell(s)
    case 'bank': return bank(s)
    case 'schuineBank': return schuineBank(s)
    case 'rek': return rek(s)
    case 'kabelkolom': return kabelkolom(s)
    case 'handvat': return handvat(s)
    case 'latstang': return latstang(s)
    case 'latPulldown': return latPulldown(s)
    case 'seatedRow': return seatedRow(s)
    case 'legPress': return legPress(s)
  }
}

/** Ondersteunt alleen de vormen die het materiaal in de ruimte zetten; voor tests. */
export function standVan(h: MateriaalHouding, pos: Vec): MateriaalStand {
  return { id: h.id, soort: h.soort, pos, hoek: h.hoek ?? 90, maat: h.maat ?? {}, kabelVan: h.kabelVan }
}

