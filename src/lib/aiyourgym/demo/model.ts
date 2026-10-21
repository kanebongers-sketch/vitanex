// ─── AI Your Gym, demo: van ruwe demo-rijen naar schermen (PUUR) ────────────
// De live demo op /aiyourgym/demo toont de echte Club-schermen van de Voorbeeld
// Gym als momentopname. bron.ts haalt de rijen op (alleen die sportschool,
// alleen demo = true); hier rekenen we ze om naar wat de schermen tonen.
// Geen e-mail, telefoon, geboortedatum of gezondheidsgegevens: die halen we
// niet eens op. Namen tonen we als voornaam plus voorletter.

import { dagSleutel, maandagVan, plusDagen, tijdNl } from '@/lib/club/cijfers/tijd'

// ── Ruwe rijen (precies de kolommen die bron.ts ophaalt) ─────────────────────

export interface RuwLid {
  id: string
  voornaam: string
  achternaam: string
  vestiging: string
  status: string
  abonnement: string | null
  lid_sinds: string | null
}

export interface RuwLes {
  id: string
  vestiging: string
  start_op: string
  eind_op: string
  capaciteit: number
  lestype_id: string | null
  zaal_id: string | null
}

export interface RuwReservering {
  les_id: string
  lid_id: string
  status: string
}

export interface RuwDienst {
  vestiging: string
  datum: string
  begin: string
  eind: string
  medewerker_id: string | null
}

export interface RuwLead {
  naam: string
  bron: string | null
  status: string
  vestiging: string
}

export interface RuwOefening {
  dag: number
  volgorde: number
  sets: number | null
  herhalingen: string | null
  rust_sec: number | null
  naam: string
}

export interface RuwSchema {
  naam: string
  doel: string | null
  weken: number | null
  dag_titels: string[] | null
}

export interface RuwMeting {
  datum: string
  gewicht_kg: number | null
  buikomtrek_cm: number | null
}

export interface RuwChallenge {
  titel: string
  soort: string
  doel: number
  start_op: string
  eind_op: string
}

export interface RuwVoeding {
  doel: string | null
  kcal: number | null
  eiwit_g: number | null
  koolhydraten_g: number | null
  vet_g: number | null
}

export interface Naam {
  id: string
  naam: string
}

export interface Vestiging {
  vestiging: string
  naam: string
  standaard: boolean
}

export interface DemoRuw {
  organisatie: { naam: string; kleur: string; thema: 'donker' | 'licht' }
  vestigingen: Vestiging[]
  /** De dag (NL) van het laatste bezoek: daar hangt de momentopname aan. */
  peildag: string
  lessen: RuwLes[]
  reserveringen: RuwReservering[]
  lestypen: Naam[]
  zalen: Naam[]
  medewerkers: Naam[]
  diensten: RuwDienst[]
  leads: RuwLead[]
  bezoekenPerDag: { dag: string; aantal: number }[]
  maand: { bezoeken: number; nieuweLeden: number; actieveLeden: number; perBron: Record<string, number> }
  lid: {
    rij: RuwLid
    bezoekDagen: string[]
    schema: RuwSchema | null
    oefeningen: RuwOefening[]
    metingen: RuwMeting[]
    voeding: RuwVoeding | null
    /** Lessen waarvoor het lid geboekt staat, na nu (ook buiten deze week). */
    komendeLessen: RuwLes[]
  }
  challenges: RuwChallenge[]
}

// ── Hulp ──────────────────────────────────────────────────────────────────

export function tijdVan(iso: string): string {
  return tijdNl(new Date(iso))
}

/** "Sanne de Vries" wordt "Sanne V." */
export function korteNaam(voornaam: string, achternaam: string): string {
  const delen = achternaam.trim().split(/\s+/).filter(Boolean)
  const laatste = delen.at(-1) ?? ''
  return laatste ? `${voornaam.trim()} ${laatste[0].toUpperCase()}.` : voornaam.trim()
}

/** Een volledige naam in een veld ("Sanne de Vries") als korte naam. */
export function korteNaamUit(volledig: string): string {
  const [voor, ...rest] = volledig.trim().split(/\s+/)
  return korteNaam(voor ?? '', rest.join(' '))
}

function naamMap(lijst: readonly Naam[]): Map<string, string> {
  return new Map(lijst.map((n) => [n.id, n.naam]))
}

export function bezetting(lesId: string, reserveringen: readonly RuwReservering[]): number {
  return reserveringen.filter((r) => r.les_id === lesId && (r.status === 'geboekt' || r.status === 'aanwezig')).length
}

export function wachtlijst(lesId: string, reserveringen: readonly RuwReservering[]): number {
  return reserveringen.filter((r) => r.les_id === lesId && r.status === 'wachtlijst').length
}

// ── Schermen ──────────────────────────────────────────────────────────────

export interface DemoLes {
  id: string
  dag: string
  tijd: string
  eind: string
  naam: string
  zaal: string
  bezet: number
  capaciteit: number
  wachtlijst: number
}

export function lessenVan(ruw: Pick<DemoRuw, 'lessen' | 'reserveringen' | 'lestypen' | 'zalen'>): DemoLes[] {
  const typen = naamMap(ruw.lestypen)
  const zalen = naamMap(ruw.zalen)
  return [...ruw.lessen]
    .sort((a, b) => a.start_op.localeCompare(b.start_op))
    .map((l) => ({
      id: l.id,
      dag: dagSleutel(new Date(l.start_op)),
      tijd: tijdVan(l.start_op),
      eind: tijdVan(l.eind_op),
      naam: (l.lestype_id && typen.get(l.lestype_id)) || 'Les',
      zaal: (l.zaal_id && zalen.get(l.zaal_id)) || '',
      bezet: bezetting(l.id, ruw.reserveringen),
      capaciteit: l.capaciteit,
      wachtlijst: wachtlijst(l.id, ruw.reserveringen),
    }))
}

export interface DemoVandaag {
  dag: string
  binnen: number
  lessen: DemoLes[]
  diensten: { naam: string; tijd: string }[]
  leads: { naam: string; bron: string; status: string }[]
}

const OPEN_LEAD = new Set(['nieuw', 'contact', 'proefles'])

export function bouwVandaag(ruw: DemoRuw, vestiging: string): DemoVandaag {
  const mensen = naamMap(ruw.medewerkers)
  return {
    dag: ruw.peildag,
    binnen: ruw.bezoekenPerDag.find((b) => b.dag === ruw.peildag)?.aantal ?? 0,
    lessen: lessenVan(ruw).filter((l) => l.dag === ruw.peildag),
    diensten: ruw.diensten
      .filter((d) => d.datum === ruw.peildag && d.vestiging === vestiging)
      .sort((a, b) => a.begin.localeCompare(b.begin))
      .map((d) => ({ naam: d.medewerker_id && mensen.get(d.medewerker_id) ? korteNaamUit(mensen.get(d.medewerker_id) ?? '') : 'Open dienst', tijd: `${d.begin.slice(0, 5)} tot ${d.eind.slice(0, 5)}` })),
    leads: ruw.leads
      .filter((l) => OPEN_LEAD.has(l.status))
      .slice(0, 5)
      .map((l) => ({ naam: korteNaamUit(l.naam), bron: l.bron ?? '', status: l.status })),
  }
}

export interface DemoWeek {
  maandag: string
  dagen: { dag: string; lessen: DemoLes[] }[]
}

export function bouwWeek(ruw: DemoRuw): DemoWeek {
  const maandag = maandagVan(ruw.peildag)
  const lessen = lessenVan(ruw)
  const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(maandag, i))
  return { maandag, dagen: dagen.map((dag) => ({ dag, lessen: lessen.filter((l) => l.dag === dag) })) }
}

export interface DemoLidKaart {
  naam: string
  voornaam: string
  status: string
  abonnement: string
  vestiging: string
  lidSinds: string | null
  bezoeken30: number
  laatsteBezoek: string | null
  wekenOpRij: number
  bezoekenMaand: number
  schema: string | null
  meting: { datum: string; gewicht: number | null; buik: number | null } | null
  metingen: number
}

/** Hoeveel weken (ma tot en met zo) op rij met minstens een bezoek, tot en met de week van de peildag. */
export function wekenOpRij(bezoekDagen: readonly string[], peildag: string): number {
  const weken = new Set(bezoekDagen.map((d) => maandagVan(d)))
  let maandag = maandagVan(peildag)
  if (!weken.has(maandag)) maandag = plusDagen(maandag, -7)
  let n = 0
  while (weken.has(maandag)) {
    n += 1
    maandag = plusDagen(maandag, -7)
  }
  return n
}

export function bouwLidKaart(ruw: DemoRuw): DemoLidKaart {
  const { rij, bezoekDagen, schema, metingen } = ruw.lid
  const van30 = plusDagen(ruw.peildag, -29)
  const maandBegin = `${ruw.peildag.slice(0, 7)}-01`
  const gesorteerd = [...bezoekDagen].filter((d) => d <= ruw.peildag).sort()
  const laatste = [...metingen].sort((a, b) => b.datum.localeCompare(a.datum))[0] ?? null
  return {
    naam: korteNaam(rij.voornaam, rij.achternaam),
    voornaam: rij.voornaam,
    status: rij.status,
    abonnement: rij.abonnement ?? 'Lidmaatschap',
    vestiging: ruw.vestigingen.find((v) => v.vestiging === rij.vestiging)?.naam ?? '',
    lidSinds: rij.lid_sinds,
    bezoeken30: new Set(gesorteerd.filter((d) => d >= van30)).size,
    laatsteBezoek: gesorteerd.at(-1) ?? null,
    wekenOpRij: wekenOpRij(gesorteerd, ruw.peildag),
    bezoekenMaand: new Set(gesorteerd.filter((d) => d >= maandBegin)).size,
    schema: schema?.naam ?? null,
    meting: laatste ? { datum: laatste.datum, gewicht: laatste.gewicht_kg, buik: laatste.buikomtrek_cm } : null,
    metingen: metingen.length,
  }
}

export interface DemoOefening {
  naam: string
  dosis: string
  rust: string | null
}

export interface DemoSchema {
  naam: string
  doel: string | null
  weken: number | null
  dagen: { titel: string; oefeningen: DemoOefening[] }[]
}

function dosisVan(o: RuwOefening): string {
  if (!o.sets) return o.herhalingen ?? ''
  return o.herhalingen ? `${o.sets} × ${o.herhalingen}` : `${o.sets} sets`
}

export function bouwSchema(ruw: DemoRuw): DemoSchema | null {
  const s = ruw.lid.schema
  if (!s) return null
  const dagNummers = [...new Set(ruw.lid.oefeningen.map((o) => o.dag))].sort((a, b) => a - b)
  return {
    naam: s.naam,
    doel: s.doel,
    weken: s.weken,
    dagen: dagNummers.map((dag) => ({
      titel: s.dag_titels?.[dag - 1] ?? `Dag ${dag}`,
      oefeningen: ruw.lid.oefeningen
        .filter((o) => o.dag === dag)
        .sort((a, b) => a.volgorde - b.volgorde)
        .map((o) => ({
          naam: o.naam,
          dosis: dosisVan(o),
          rust: o.rust_sec ? `${o.rust_sec} sec rust` : null,
        })),
    })),
  }
}

export interface DemoCijfers {
  maand: string
  bezoeken: number
  actieveLeden: number
  nieuweLeden: number
  noShows: number
  bezettingPct: number | null
  perDag: { dag: string; aantal: number }[]
  perBron: { bron: string; aantal: number }[]
}

const BRON_LABEL: Record<string, string> = { qr: 'QR-code', bandje: 'Bandje', balie: 'Op naam aan de balie' }

export function bouwCijfers(ruw: DemoRuw): DemoCijfers {
  const maandBegin = `${ruw.peildag.slice(0, 7)}-01`
  const lessen = lessenVan(ruw).filter((l) => l.dag >= maandBegin && l.dag <= ruw.peildag)
  const plekken = lessen.reduce((s, l) => s + l.capaciteit, 0)
  const bezet = lessen.reduce((s, l) => s + Math.min(l.bezet, l.capaciteit), 0)
  const inMaand = new Set(lessen.map((l) => l.id))
  const noShows = ruw.reserveringen.filter((r) => r.status === 'no_show' && inMaand.has(r.les_id)).length
  return {
    maand: maandBegin,
    bezoeken: ruw.maand.bezoeken,
    actieveLeden: ruw.maand.actieveLeden,
    nieuweLeden: ruw.maand.nieuweLeden,
    noShows,
    bezettingPct: plekken > 0 ? Math.round((bezet / plekken) * 100) : null,
    perDag: [...ruw.bezoekenPerDag].sort((a, b) => a.dag.localeCompare(b.dag)),
    perBron: Object.entries(ruw.maand.perBron)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([bron, aantal]) => ({ bron: BRON_LABEL[bron] ?? bron, aantal })),
  }
}

export interface DemoApp {
  voornaam: string
  volgendeLes: { naam: string; wanneer: string; zaal: string } | null
  bezoekenMaand: number
  wekenOpRij: number
  challenge: { titel: string; stand: number; doel: number } | null
  voeding: { doel: string | null; kcal: number; eiwit: number; kh: number; vet: number } | null
}

function challengeStand(c: RuwChallenge, bezoekDagen: readonly string[], peildag: string): number {
  if (c.soort === 'weken_op_rij') return wekenOpRij(bezoekDagen.filter((d) => d >= c.start_op), peildag)
  const tot = c.eind_op < peildag ? c.eind_op : peildag
  return new Set(bezoekDagen.filter((d) => d >= c.start_op && d <= tot)).size
}

export function bouwApp(ruw: DemoRuw, kaart: DemoLidKaart, dagNaam: (dag: string) => string): DemoApp {
  const les = lessenVan({ ...ruw, lessen: ruw.lid.komendeLessen })[0]
  const lopend = ruw.challenges.find((c) => c.start_op <= ruw.peildag && c.eind_op >= ruw.peildag) ?? null
  const v = ruw.lid.voeding
  return {
    voornaam: kaart.voornaam,
    volgendeLes: les ? { naam: les.naam, wanneer: `${dagNaam(les.dag)} ${les.tijd}`, zaal: les.zaal } : null,
    bezoekenMaand: kaart.bezoekenMaand,
    wekenOpRij: kaart.wekenOpRij,
    challenge: lopend ? { titel: lopend.titel, stand: Math.min(challengeStand(lopend, ruw.lid.bezoekDagen, ruw.peildag), lopend.doel), doel: lopend.doel } : null,
    voeding:
      v && v.kcal && v.eiwit_g !== null && v.koolhydraten_g !== null && v.vet_g !== null
        ? { doel: v.doel, kcal: v.kcal, eiwit: v.eiwit_g, kh: v.koolhydraten_g, vet: v.vet_g }
        : null,
  }
}
