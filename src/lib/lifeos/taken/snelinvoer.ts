// ─── LifeOS — snel een taak invoeren (puur) ─────────────────────────────────
// Eén regel, zoals je hem zou zeggen: "morgen Ruben bellen #werk". Hieruit halen
// we de dag en de categorie; de rest is de titel. Geen formulier met drie velden.
//
//   Dag       vandaag · morgen · overmorgen · maandag…zondag (ook di/wo/do/vr/za)
//             · volgende week (= maandag) · volgende week vrijdag · 3/10 · 3-10 · 3 okt
//   Deadline  "vóór/voor/uiterlijk/deadline" + een dag: "offerte vóór vr" zet de
//             deadline, niet de geplande dag. Beide mag: "morgen offerte vóór vr".
//   Categorie #woord (het eerste #woord; hoofdletter vooraan)
//
// Herkennen we niets, dan blijft de hele tekst de titel en is de taak "ooit". Een
// weekdag betekent de eerstvolgende keer, vandaag inbegrepen ("vrijdag" op vrijdag
// = vandaag). Een datum in het verleden van dit jaar schuift naar volgend jaar.

export interface SnelleTaak {
  titel: string
  /** YYYY-MM-DD of null (= ooit). */
  datum: string | null
  /** YYYY-MM-DD of null: wanneer het uiterlijk af moet. */
  deadline: string | null
  categorie: string | null
}

/** Woorden die van de dag erna een deadline maken. */
const DEADLINE_WOORDEN = '(?:vóór|voor|uiterlijk|deadline)'

const WEEKDAGEN: Record<string, number> = {
  // Geen "ma" en "zo": dat zijn ook gewone woorden ("ma bellen", "zo snel mogelijk").
  zondag: 0,
  maandag: 1,
  dinsdag: 2, di: 2,
  woensdag: 3, wo: 3,
  donderdag: 4, do: 4,
  vrijdag: 5, vr: 5,
  zaterdag: 6, za: 6,
}

const MAANDEN: Record<string, number> = {
  jan: 1, januari: 1, feb: 2, februari: 2, mrt: 3, maart: 3, apr: 4, april: 4, mei: 5,
  jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, augustus: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, nov: 11, november: 11, dec: 12, december: 12,
}

function sleutel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function plus(vandaag: Date, dagen: number): Date {
  return new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + dagen)
}

/** Een geldige dag/maand in dit jaar, of volgend jaar als die al voorbij is. */
function datumVan(dag: number, maand: number, vandaag: Date): Date | null {
  if (maand < 1 || maand > 12 || dag < 1 || dag > 31) return null
  let d = new Date(vandaag.getFullYear(), maand - 1, dag)
  if (d.getMonth() !== maand - 1) return null // 31 feb e.d.
  if (d.getTime() < plus(vandaag, 0).getTime()) d = new Date(vandaag.getFullYear() + 1, maand - 1, dag)
  return d
}

interface Treffer {
  datum: Date
  /** Het stuk tekst dat wegmoet uit de titel. */
  patroon: RegExp
}

const WEEKDAG_NAMEN = Object.keys(WEEKDAGEN).sort((a, b) => b.length - a.length).join('|')

/** Volgende week op een weekdag: de maandag van volgende week + de weekdag (zo = einde van die week). */
function volgendeWeekOp(vandaag: Date, weekdag: number): Date {
  const maandag = ((8 - vandaag.getDay()) % 7) || 7
  return plus(vandaag, maandag + ((weekdag + 6) % 7))
}

/**
 * Zoekt een dag-uitdrukking. Met `alsDeadline` alleen na een deadline-woord
 * ("vóór vr"); anders alleen zónder (zodat "vóór vr" geen geplande dag wordt).
 */
function vindDag(tekst: string, vandaag: Date, alsDeadline: boolean): Treffer | null {
  const kandidaten: [string, (m: RegExpMatchArray) => Date | null][] = [
    [`(volgende week) (${WEEKDAG_NAMEN})`, (m) => volgendeWeekOp(vandaag, WEEKDAGEN[m[3].toLowerCase()])],
    ['(volgende week)', () => plus(vandaag, ((8 - vandaag.getDay()) % 7) || 7)],
    ['(overmorgen)', () => plus(vandaag, 2)],
    ['(morgen)', () => plus(vandaag, 1)],
    ['(vandaag)', () => plus(vandaag, 0)],
    ['(\\d{1,2})[/-](\\d{1,2})', (m) => datumVan(Number(m[2]), Number(m[3]), vandaag)],
    [`(\\d{1,2}) (${Object.keys(MAANDEN).join('|')})`, (m) => datumVan(Number(m[2]), MAANDEN[m[3].toLowerCase()], vandaag)],
    [`(${WEEKDAG_NAMEN})`, (m) => plus(vandaag, (WEEKDAGEN[m[2].toLowerCase()] - vandaag.getDay() + 7) % 7)],
  ]
  for (const [bron, maak] of kandidaten) {
    // Zonder deadline-woord mag er ook géén direct vóór staan: anders pakt de
    // gewone dag-zoeker het stuk "vr" uit "vóór vr" alsnog als geplande dag.
    const patroon = alsDeadline
      ? new RegExp(`(^|\\s)${DEADLINE_WOORDEN}\\s+${bron}(?=\\s|$)`, 'i')
      : new RegExp(`(^|\\s)(?<!${DEADLINE_WOORDEN}\\s+)${bron}(?=\\s|$)`, 'i')
    const m = tekst.match(patroon)
    if (!m) continue
    const datum = maak(m)
    if (datum) return { datum, patroon }
  }
  return null
}

export function leesSnelleTaak(invoer: string, vandaag: Date): SnelleTaak {
  let tekst = ` ${invoer.trim()} `

  let categorie: string | null = null
  const hash = tekst.match(/(^|\s)#([\p{L}\p{N}_-]+)/u)
  if (hash) {
    categorie = hash[2].charAt(0).toUpperCase() + hash[2].slice(1)
    tekst = tekst.replace(hash[0], ' ')
  }

  // Eerst de deadline, dan pas de geplande dag: anders ziet de dag-zoeker het
  // "vr" in "vóór vr" en plant hij de taak op vrijdag.
  let deadline: string | null = null
  const uiterlijk = vindDag(tekst, vandaag, true)
  if (uiterlijk) {
    deadline = sleutel(uiterlijk.datum)
    tekst = tekst.replace(uiterlijk.patroon, ' ')
  }

  let datum: string | null = null
  const dag = vindDag(tekst, vandaag, false)
  if (dag) {
    datum = sleutel(dag.datum)
    tekst = tekst.replace(dag.patroon, ' ')
  }

  const titel = tekst.replace(/\s+/g, ' ').trim()
  // Alleen een dag of categorie, zonder titel? Dan was het geen dag maar de taak zelf.
  if (!titel) return { titel: invoer.trim(), datum: null, deadline: null, categorie: null }
  return { titel: titel.charAt(0).toUpperCase() + titel.slice(1), datum, deadline, categorie }
}
