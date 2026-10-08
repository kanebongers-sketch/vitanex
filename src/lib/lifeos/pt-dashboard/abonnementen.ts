// ─── Fit Factory PT — abonnementen en klanten (PUUR) ────────────────────────
// Bron: "Fit Factory Personal Training Abonnementen 2026" (pdf). Prijzen per maand,
// incl. btw; Eersel wijkt af. Elk abonnement: 3 maanden vast, daarna maandelijks
// opzegbaar met een opzegtermijn van één volledige kalendermaand.
// Prijswijziging? Alleen hier aanpassen.

import { CLUB_LABEL, isClub, type Club } from './clubs'

export const ABONNEMENTEN = ['1x', '2x', 'duo_1x', 'duo_2x', '1x_2w', 'duo_start', 'challenge', 'coaching'] as const
export type Abonnement = (typeof ABONNEMENTEN)[number]

interface AbonnementInfo {
  label: string
  kort: string
  /** Prijs per maand in euro, incl. btw (bij duo: per duo). */
  prijs: number
  prijsEersel: number
  duo: boolean
  /** Gemiddeld; 0,5 bij eens per twee weken. */
  sessiesPerWeek: number
}

export const ABONNEMENT: Record<Abonnement, AbonnementInfo> = {
  '1x': { label: '1x per week', kort: '1x p/w', prijs: 299, prijsEersel: 319, duo: false, sessiesPerWeek: 1 },
  '2x': { label: '2x per week', kort: '2x p/w', prijs: 499, prijsEersel: 519, duo: false, sessiesPerWeek: 2 },
  duo_1x: { label: 'Duo · 1x per week', kort: 'Duo 1x', prijs: 399, prijsEersel: 419, duo: true, sessiesPerWeek: 1 },
  duo_2x: { label: 'Duo · 2x per week', kort: 'Duo 2x', prijs: 599, prijsEersel: 619, duo: true, sessiesPerWeek: 2 },
  // De volgende staan niet in de abonnementen-pdf, wel in het PT-dashboard (Excel)
  // van Fit Factory. Bij challenge en coaching is het aantal sessies per week
  // niet bekend: ze tellen niet mee in "sessies per week".
  '1x_2w': { label: '1x per 2 weken', kort: '1x p/2w', prijs: 169, prijsEersel: 169, duo: false, sessiesPerWeek: 0.5 },
  duo_start: { label: 'Duo · startactie (1x per week)', kort: 'Duo start', prijs: 299, prijsEersel: 299, duo: true, sessiesPerWeek: 1 },
  challenge: { label: 'Challenge (6 weken)', kort: 'Challenge', prijs: 399, prijsEersel: 419, duo: false, sessiesPerWeek: 0 },
  coaching: { label: 'Coaching', kort: 'Coaching', prijs: 139, prijsEersel: 139, duo: false, sessiesPerWeek: 0 },
}

export const VASTE_MAANDEN = 3

export function isAbonnement(v: unknown): v is Abonnement {
  return typeof v === 'string' && (ABONNEMENTEN as readonly string[]).includes(v)
}

/** Maandprijs voor dit abonnement op deze club (Eersel wijkt af). */
export function maandprijs(abonnement: Abonnement, club: Club): number {
  const a = ABONNEMENT[abonnement]
  return club === 'eersel' ? a.prijsEersel : a.prijs
}

/** Wat een klant werkelijk betaalt: de afwijkende prijs (korting, actie) als die er is, anders de standaardprijs. */
export function klantPrijs(k: Pick<PtKlant, 'abonnement' | 'club' | 'prijsAfwijkend'>): number {
  return k.prijsAfwijkend ?? maandprijs(k.abonnement, k.club)
}

/**
 * De klant zoals een PT'er hem krijgt: zonder afwijkende prijs. PT'ers zien geen
 * bedragen, ook niet in de data die naar hun browser gaat.
 */
export function zonderPrijs(k: PtKlant): PtKlant {
  return { ...k, prijsAfwijkend: null }
}

export const STOP_REDENEN = ['doel_behaald', 'financieel', 'tijd', 'blessure', 'verhuisd', 'ontevreden', 'anders'] as const
export type StopReden = (typeof STOP_REDENEN)[number]
export const STOP_REDEN_LABEL: Record<StopReden, string> = {
  doel_behaald: 'Doel behaald',
  financieel: 'Financieel',
  tijd: 'Geen tijd',
  blessure: 'Blessure of ziekte',
  verhuisd: 'Verhuisd',
  ontevreden: 'Niet tevreden',
  anders: 'Anders',
}
export function isStopReden(v: unknown): v is StopReden {
  return typeof v === 'string' && (STOP_REDENEN as readonly string[]).includes(v)
}

export const KLANT_STATUSSEN = ['actief', 'bevroren', 'opgezegd', 'gestopt'] as const
export type KlantStatus = (typeof KLANT_STATUSSEN)[number]
export const KLANT_STATUS_LABEL: Record<KlantStatus, string> = {
  actief: 'Actief',
  bevroren: 'Bevroren',
  opgezegd: 'Opgezegd',
  gestopt: 'Gestopt',
}
export function isKlantStatus(v: unknown): v is KlantStatus {
  return typeof v === 'string' && (KLANT_STATUSSEN as readonly string[]).includes(v)
}

export interface PtKlant {
  id: string
  naam: string
  contact: string | null
  duoPartner: string | null
  club: Club
  abonnement: Abonnement
  /** YYYY-MM-DD */
  startdatum: string
  status: KlantStatus
  /** YYYY-MM-DD, alleen bij opgezegd/gestopt. */
  opgezegdOp: string | null
  notitie: string | null
  leadId: string | null
  /** Maandprijs als die afwijkt van de standaard (korting, actie). Alleen eigenaren/beheerder; voor PT'ers altijd null. */
  prijsAfwijkend: number | null
  /** Waarom de klant opzegde of stopte; alleen bij opgezegd/gestopt. */
  stopReden: StopReden | null
}

// ─── Datums (dagsleutels, geen tijdzones) ─────────────────────────────────────

function deel(d: string): [number, number, number] {
  const [j, m, dag] = d.split('-').map(Number)
  return [j, m, dag]
}
function sleutel(j: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(j, m - 1, d))
  return dt.toISOString().slice(0, 10)
}

/** `start` + n maanden − 1 dag: de laatste dag van de vaste periode. */
export function eindeVastePeriode(start: string, maanden = VASTE_MAANDEN): string {
  const [j, m, d] = deel(start)
  // Date.UTC rolt over: 31 jan + 1 maand = 3 maart; begrens op de laatste dag.
  const laatsteDag = new Date(Date.UTC(j, m - 1 + maanden + 1, 0)).getUTCDate()
  return sleutel(j, m - 1 + maanden + 1, Math.min(d, laatsteDag) - 1)
}

/**
 * Laatste abonnementsdag bij opzeggen op `opgezegdOp`: een volledige
 * kalendermaand opzegtermijn (dus t/m het einde van de maand ná de opzegmaand),
 * maar nooit vóór het einde van de vaste periode.
 */
export function laatsteDag(start: string, opgezegdOp: string): string {
  const [j, m] = deel(opgezegdOp)
  // Dag 0 van maand m+2 = de laatste dag van de maand ná de opzegmaand.
  const naTermijn = sleutel(j, m + 2, 0)
  const vast = eindeVastePeriode(start)
  return naTermijn > vast ? naTermijn : vast
}

/** Telt deze klant mee in de maandwaarde (en als "lopend")? */
export function isLopend(k: Pick<PtKlant, 'status' | 'startdatum' | 'opgezegdOp'>, vandaag: string): boolean {
  if (k.status === 'gestopt' || k.startdatum > vandaag) return false
  if (k.status === 'opgezegd') return k.opgezegdOp !== null && laatsteDagVan(k) >= vandaag
  return true
}

function laatsteDagVan(k: Pick<PtKlant, 'startdatum' | 'opgezegdOp'>): string {
  return k.opgezegdOp ? laatsteDag(k.startdatum, k.opgezegdOp) : '9999-12-31'
}

export interface KlantSamenvatting {
  lopend: number
  bevroren: number
  /** Som van de maandprijzen van lopende, niet-bevroren abonnementen (incl. btw). */
  maandwaarde: number
  /** Klanten (incl. duo-partners) in lopende abonnementen. */
  personen: number
  /** Sessies per week over de lopende, niet-bevroren abonnementen. */
  sessiesPerWeek: number
  /** Vaste periode loopt binnen 30 dagen af (moment voor een verlenggesprek). */
  vastBijnaKlaar: PtKlant[]
}

export function vatKlantenSamen(klanten: readonly PtKlant[], vandaag: string): KlantSamenvatting {
  const lopend = klanten.filter((k) => isLopend(k, vandaag))
  const betalend = lopend.filter((k) => k.status !== 'bevroren')
  const over30 = plusDagen(vandaag, 30)
  return {
    lopend: lopend.length,
    bevroren: lopend.filter((k) => k.status === 'bevroren').length,
    maandwaarde: betalend.reduce((s, k) => s + klantPrijs(k), 0),
    personen: lopend.reduce((s, k) => s + (ABONNEMENT[k.abonnement].duo ? 2 : 1), 0),
    sessiesPerWeek: betalend.reduce((s, k) => s + ABONNEMENT[k.abonnement].sessiesPerWeek, 0),
    vastBijnaKlaar: lopend
      .filter((k) => k.status === 'actief')
      .filter((k) => {
        const e = eindeVastePeriode(k.startdatum)
        return e >= vandaag && e <= over30
      })
      .sort((a, b) => eindeVastePeriode(a.startdatum).localeCompare(eindeVastePeriode(b.startdatum))),
  }
}

export function plusDagen(dag: string, n: number): string {
  const [j, m, d] = deel(dag)
  return sleutel(j, m, d + n)
}

// ─── Invoer (systeemgrens) ────────────────────────────────────────────────────

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }
/**
 * Formulierinvoer. `prijsAfwijkend` is `undefined` als die niet meegestuurd is:
 * dan blijft de opgeslagen prijs staan (zo wist een PT'er hem nooit bij opslaan).
 */
export type KlantInvoer = Omit<PtKlant, 'id' | 'prijsAfwijkend'> & { prijsAfwijkend?: number | null }

const DAG = /^\d{4}-\d{2}-\d{2}$/

function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, max)
}

/** Als `tekst`, maar regeleinden blijven staan (notities); max 2 lege regels achter elkaar. */
function tekstMetRegels(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return t.length === 0 ? null : t.slice(0, max)
}

/** Formulier → klant, of een leesbare fout. */
export function leesKlantInvoer(body: unknown): Lees<KlantInvoer> {
  if (typeof body !== 'object' || body === null) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  const naam = tekst(o.naam, 120)
  if (!naam) return { ok: false, fout: 'Vul de naam van de klant in.' }
  if (!isClub(o.club)) return { ok: false, fout: 'Kies de club.' }
  if (!isAbonnement(o.abonnement)) return { ok: false, fout: 'Kies het abonnement.' }
  if (typeof o.startdatum !== 'string' || !DAG.test(o.startdatum)) return { ok: false, fout: 'Kies een startdatum.' }
  const status = isKlantStatus(o.status) ? o.status : 'actief'
  const opgezegdOp = typeof o.opgezegdOp === 'string' && DAG.test(o.opgezegdOp) ? o.opgezegdOp : null
  if ((status === 'opgezegd' || status === 'gestopt') && !opgezegdOp) {
    return { ok: false, fout: status === 'opgezegd' ? 'Vul in wanneer er is opgezegd.' : 'Vul in wanneer de klant stopte.' }
  }
  if (opgezegdOp && opgezegdOp < o.startdatum) return { ok: false, fout: 'Opzegdatum ligt vóór de startdatum.' }
  const duo = ABONNEMENT[o.abonnement].duo
  return {
    ok: true,
    waarde: {
      naam,
      contact: tekst(o.contact, 160),
      duoPartner: duo ? tekst(o.duoPartner, 120) : null,
      club: o.club,
      abonnement: o.abonnement,
      startdatum: o.startdatum,
      status,
      opgezegdOp: status === 'opgezegd' || status === 'gestopt' ? opgezegdOp : null,
      notitie: tekstMetRegels(o.notitie, 1000),
      leadId: typeof o.leadId === 'string' && /^[0-9a-f-]{36}$/i.test(o.leadId) ? o.leadId : null,
      stopReden: (status === 'opgezegd' || status === 'gestopt') && isStopReden(o.stopReden) ? o.stopReden : null,
      ...(Object.hasOwn(o, 'prijsAfwijkend') ? { prijsAfwijkend: leesPrijs(o.prijsAfwijkend) } : {}),
    },
  }
}

/** Een maandprijs in euro (0–5000, op centen), of null bij leeg/ongeldig. */
function leesPrijs(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 5000 ? Math.round(n * 100) / 100 : null
}

export function leesKlant(ruw: unknown): PtKlant | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.id !== 'string') return null
  const r = leesKlantInvoer(o)
  return r.ok ? { id: o.id, ...r.waarde, prijsAfwijkend: r.waarde.prijsAfwijkend ?? null } : null
}

/** "€1.297" */
export function euro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

/** "2x per week · Eersel · €519 p/m". Zonder `toonPrijs` (PT'ers zien geen bedragen) valt de prijs weg. */
export function abonnementRegel(k: Pick<PtKlant, 'abonnement' | 'club'> & { prijsAfwijkend?: number | null }, toonPrijs = true): string {
  const basis = `${ABONNEMENT[k.abonnement].label} · ${CLUB_LABEL[k.club]}`
  if (!toonPrijs) return basis
  const prijs = k.prijsAfwijkend ?? maandprijs(k.abonnement, k.club)
  return `${basis} · ${euro(prijs)} p/m${k.prijsAfwijkend != null ? ' (afwijkend)' : ''}`
}

/** Eén regel voor coachgesprek/pdf/mail: "5 lopende abonnementen · €1.795 p/m · 1 bevroren". */
export function klantRegel(s: KlantSamenvatting): string {
  if (s.lopend === 0) return 'Nog geen lopende PT-abonnementen ingevuld.'
  const delen = [`${s.lopend} lopend${s.lopend === 1 ? ' abonnement' : 'e abonnementen'}`, `${euro(s.maandwaarde)} p/m`]
  if (s.bevroren > 0) delen.push(`${s.bevroren} bevroren`)
  if (s.vastBijnaKlaar.length > 0) delen.push(`${s.vastBijnaKlaar.length} einde vaste periode binnen 30 dagen`)
  return delen.join(' · ')
}
