// ─── LifeOS — lead tracker (PUUR, ook client) ───────────────────────────────
// Het model van de Excel-tracker die het PT-team gebruikte (per club een tab):
// datum, naam, contact, club, bron, interesse, status, volgende stap,
// opvolgdatum, Google review / referral gevraagd, "kent iemand", notities.
// Plus de samenvatting die jij in het wekelijkse coachgesprek ziet. Geen fetch, geen DB.

import { isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'

function keuze<const T extends readonly string[]>(lijst: T) {
  return (v: unknown): v is T[number] => typeof v === 'string' && (lijst as readonly string[]).includes(v)
}

export const LEAD_STATUSSEN = ['nieuw', 'opvolgen', 'proefles', 'intake', 'later', 'geen_interesse', 'geen_klant', 'klant'] as const
export type LeadStatus = (typeof LEAD_STATUSSEN)[number]
export const STATUS_LABEL: Record<LeadStatus, string> = {
  nieuw: 'Nieuw',
  opvolgen: 'Opvolgen',
  proefles: 'Proefles ingepland',
  intake: 'Intake ingepland',
  later: 'Later opvolgen',
  geen_interesse: 'Geen interesse',
  geen_klant: 'Geen klant geworden',
  klant: 'Klant geworden',
}
/** Nog in de pijplijn (niet afgesloten). */
export const OPEN_STATUSSEN: readonly LeadStatus[] = ['nieuw', 'opvolgen', 'proefles', 'intake', 'later']
export const isStatus = keuze(LEAD_STATUSSEN)

/** Waarom iemand na een intake of proefles geen klant werd (optioneel, bij status geen_klant). */
export const GEEN_KLANT_REDENEN = ['te_duur', 'geen_tijd', 'zelf_trainen', 'elders', 'anders'] as const
export type GeenKlantReden = (typeof GEEN_KLANT_REDENEN)[number]
export const GEEN_KLANT_REDEN_LABEL: Record<GeenKlantReden, string> = {
  te_duur: 'Te duur',
  geen_tijd: 'Geen tijd',
  zelf_trainen: 'Traint liever zelf',
  elders: 'Gaat ergens anders',
  anders: 'Anders',
}
export const isGeenKlantReden = keuze(GEEN_KLANT_REDENEN)

export const LEAD_BRONNEN = ['vloer', 'walk_in', 'intake', 'proefles', 'referral', 'social', 'mailing', 'bellen', 'anders'] as const
export type LeadBron = (typeof LEAD_BRONNEN)[number]
export const BRON_LABEL: Record<LeadBron, string> = {
  vloer: 'Vloer',
  walk_in: 'Walk-in',
  intake: 'Intake',
  proefles: 'Proefles',
  referral: 'Referral',
  social: 'Social media',
  mailing: 'Mailing',
  bellen: 'Bellen',
  anders: 'Anders',
}
export const isBron = keuze(LEAD_BRONNEN)

export const INTERESSES = ['koud', 'lauw', 'warm', 'direct', 'niet_relevant'] as const
export type Interesse = (typeof INTERESSES)[number]
export const INTERESSE_LABEL: Record<Interesse, string> = {
  koud: 'Koud',
  lauw: 'Lauw',
  warm: 'Warm',
  direct: 'Direct plannen',
  niet_relevant: 'Niet relevant',
}
export const isInteresse = keuze(INTERESSES)

export const STAPPEN = ['bellen', 'appen', 'mailen', 'proefles_plannen', 'intake_plannen', 'later_opvolgen', 'afgesloten'] as const
export type VolgendeStap = (typeof STAPPEN)[number]
export const STAP_LABEL: Record<VolgendeStap, string> = {
  bellen: 'Bellen',
  appen: 'Appen',
  mailen: 'Mailen',
  proefles_plannen: 'Proefles plannen',
  intake_plannen: 'Intake plannen',
  later_opvolgen: 'Later opvolgen',
  afgesloten: 'Afgesloten',
}
export const isStap = keuze(STAPPEN)

export interface Lead {
  id: string
  naam: string
  contact: string | null
  club: Club | null
  bron: LeadBron
  interesse: Interesse | null
  status: LeadStatus
  volgendeStap: VolgendeStap | null
  /** YYYY-MM-DD of null. */
  opvolgdatum: string | null
  /** HH:MM of null: een tijd bij de opvolgdatum ("bel morgen 10:00"). Alleen met een datum. */
  opvolgtijd: string | null
  reviewGevraagd: boolean
  referralGevraagd: boolean
  kentIemand: string | null
  notitie: string | null
  /** Alleen bij status geen_klant: waarom niet. */
  geenKlantReden: GeenKlantReden | null
  /** Het logboek, nieuwste eerst. Ontbreekt = niet meegeladen. */
  logboek?: LeadNotitie[]
  /** Dagsleutel YYYY-MM-DD: wanneer gesproken. */
  gesprokenOp: string
  aangemaaktOp: string
}

export type NieuweLead = Omit<Lead, 'id' | 'aangemaaktOp' | 'logboek'>

/**
 * Eén contactmoment bij een lead ("gebeld, voicemail"): wat er gebeurde, en als
 * dat in hetzelfde moment is vastgelegd, de status daarna en de volgende opvolging.
 */
export interface LeadNotitie {
  id: string
  /** YYYY-MM-DD */
  datum: string
  tekst: string
  /** Naam van wie het schreef. */
  door: string | null
  aangemaaktOp: string
  /** De status na dit moment; null = niet gewijzigd. */
  status: LeadStatus | null
  /** De afgesproken volgende opvolging (YYYY-MM-DD, HH:MM); null = geen. */
  opvolgdatum: string | null
  opvolgtijd: string | null
}

/** Wat je in één contactmoment vastlegt. Velden die ontbreken (`undefined`) laten de lead ongemoeid. */
export interface ContactmomentInvoer {
  tekst: string
  status?: LeadStatus
  /** null = geen opvolging meer (bv. klant geworden). */
  opvolgdatum?: string | null
  opvolgtijd?: string | null
}

const TIJD = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

/** "10:00" of "10:00:00" → "10:00"; anders null. */
export function leesTijd(v: unknown): string | null {
  return typeof v === 'string' && TIJD.test(v) ? v.slice(0, 5) : null
}

export const MAX_LEADNOTITIE = 500

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }
const DAG = /^\d{4}-\d{2}-\d{2}$/

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[^\S\n]+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, max)
}

/** Het formulier van de PT'er → een lead, of een leesbare fout. `vandaag` = YYYY-MM-DD. */
/**
 * Formulier → lead. Bij invoer is de club verplicht (`clubVerplicht`, standaard);
 * bij het inlezen van een opgeslagen lead niet, zodat een oude lead zonder club
 * niet stil uit lijsten verdwijnt.
 */
export function leesNieuweLead(body: unknown, vandaag: string, { clubVerplicht = true } = {}): Lees<NieuweLead> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = tekst(o.naam, 120)
  if (!naam) return { ok: false, fout: 'Vul de naam in van wie je gesproken hebt.' }
  if (!isBron(o.bron)) return { ok: false, fout: 'Kies hoe je diegene gesproken hebt (bron).' }
  // Verplicht: zonder club ziet de clubmanager de lead niet (zie club-filter).
  if (clubVerplicht && !isClub(o.club)) return { ok: false, fout: 'Kies de club waar je diegene gesproken hebt.' }
  let gesprokenOp = vandaag
  if (typeof o.gesprokenOp === 'string' && DAG.test(o.gesprokenOp)) {
    if (o.gesprokenOp > vandaag) return { ok: false, fout: 'De datum ligt in de toekomst.' }
    gesprokenOp = o.gesprokenOp
  }
  const opvolgdatum = typeof o.opvolgdatum === 'string' && DAG.test(o.opvolgdatum) ? o.opvolgdatum : null
  const opvolgtijd = opvolgdatum ? leesTijd(o.opvolgtijd) : null
  const status = isStatus(o.status) ? o.status : 'nieuw'
  return {
    ok: true,
    waarde: {
      naam,
      contact: tekst(o.contact, 160),
      club: isClub(o.club) ? o.club : null,
      bron: o.bron,
      interesse: isInteresse(o.interesse) ? o.interesse : null,
      status,
      volgendeStap: isStap(o.volgendeStap) ? o.volgendeStap : null,
      opvolgdatum,
      opvolgtijd,
      reviewGevraagd: o.reviewGevraagd === true,
      referralGevraagd: o.referralGevraagd === true,
      kentIemand: tekst(o.kentIemand, 200),
      notitie: tekst(o.notitie, 1000),
      geenKlantReden: status === 'geen_klant' && isGeenKlantReden(o.geenKlantReden) ? o.geenKlantReden : null,
      gesprokenOp,
    },
  }
}

/** Eén lead uit JSON (API-antwoord), of null. */
export function leesLead(ruw: unknown): Lead | null {
  const x = obj(ruw)
  if (!x || typeof x.id !== 'string' || typeof x.aangemaaktOp !== 'string') return null
  const r = leesNieuweLead(x, '9999-12-31', { clubVerplicht: false })
  if (!r.ok) return null
  const lead: Lead = { id: x.id, aangemaaktOp: x.aangemaaktOp, ...r.waarde }
  return Array.isArray(x.logboek) ? { ...lead, logboek: x.logboek.flatMap((n) => leesLeadNotitie(n) ?? []) } : lead
}

/** Eén logboeknotitie uit JSON (API-antwoord), of null. */
export function leesLeadNotitie(ruw: unknown): LeadNotitie | null {
  const x = obj(ruw)
  if (!x || typeof x.id !== 'string' || typeof x.tekst !== 'string' || typeof x.aangemaaktOp !== 'string') return null
  if (typeof x.datum !== 'string' || !DAG.test(x.datum)) return null
  const opvolgdatum = typeof x.opvolgdatum === 'string' && DAG.test(x.opvolgdatum) ? x.opvolgdatum : null
  return {
    id: x.id, datum: x.datum, tekst: x.tekst, door: typeof x.door === 'string' ? x.door : null, aangemaaktOp: x.aangemaaktOp,
    status: isStatus(x.status) ? x.status : null, opvolgdatum, opvolgtijd: opvolgdatum ? leesTijd(x.opvolgtijd) : null,
  }
}

/** De tekst van een nieuwe notitie (spaties samengevouwen, ingekort), of een fout. */
export function leesLeadNotitieTekst(body: unknown): Lees<string> {
  const t = tekst(obj(body)?.tekst, MAX_LEADNOTITIE)
  return t ? { ok: true, waarde: t } : { ok: false, fout: 'Schrijf kort wat er is gebeurd.' }
}

/**
 * Een contactmoment: tekst verplicht; status en opvolging alleen als ze
 * meegestuurd zijn. Een afgesloten status (klant, geen klant, geen interesse)
 * wist de opvolging: daar valt niets meer op te volgen.
 */
export function leesContactmoment(body: unknown): Lees<ContactmomentInvoer> {
  const o = obj(body)
  const t = leesLeadNotitieTekst(body)
  if (!o || !t.ok) return t.ok ? { ok: false, fout: 'Ongeldige invoer.' } : t
  const uit: ContactmomentInvoer = { tekst: t.waarde }
  if (o.status !== undefined) {
    if (!isStatus(o.status)) return { ok: false, fout: 'Kies een geldige status.' }
    uit.status = o.status
  }
  if (o.opvolgdatum !== undefined) {
    if (o.opvolgdatum !== null && o.opvolgdatum !== '' && (typeof o.opvolgdatum !== 'string' || !DAG.test(o.opvolgdatum))) {
      return { ok: false, fout: 'Kies een geldige opvolgdatum.' }
    }
    uit.opvolgdatum = typeof o.opvolgdatum === 'string' && o.opvolgdatum ? o.opvolgdatum : null
    uit.opvolgtijd = uit.opvolgdatum ? leesTijd(o.opvolgtijd) : null
  }
  if (uit.status && !OPEN_STATUSSEN.includes(uit.status)) {
    uit.opvolgdatum = null
    uit.opvolgtijd = null
  }
  return { ok: true, waarde: uit }
}

/** Moet deze lead vandaag (of eerder) opgevolgd worden? */
export function moetOpvolgen(l: Pick<Lead, 'status' | 'opvolgdatum'>, vandaag: string): boolean {
  return OPEN_STATUSSEN.includes(l.status) && l.opvolgdatum !== null && l.opvolgdatum <= vandaag
}

/**
 * De logische volgorde van een leadlijst: eerst wat aandacht nodig heeft, dan
 * de rest. Open leads: te laat (langst te laat eerst), vandaag, zonder plan
 * (langst wachtend eerst), daarna op opvolgdatum. Afgesloten leads (klant,
 * geen klant, geen interesse) onderaan, nieuwste gesprek eerst.
 */
export function vergelijkLeads(vandaag: string): (a: Lead, b: Lead) => number {
  const rang = (l: Lead) => {
    if (!OPEN_STATUSSEN.includes(l.status)) return 4
    if (l.opvolgdatum !== null && l.opvolgdatum < vandaag) return 0
    if (l.opvolgdatum === vandaag) return 1
    if (l.opvolgdatum === null) return 2
    return 3
  }
  return (a, b) => {
    const ra = rang(a)
    const verschil = ra - rang(b)
    if (verschil !== 0) return verschil
    const opDatum =
      ra === 4 ? b.gesprokenOp.localeCompare(a.gesprokenOp)
      : ra === 2 ? a.gesprokenOp.localeCompare(b.gesprokenOp)
      : `${a.opvolgdatum ?? ''} ${a.opvolgtijd ?? '99:99'}`.localeCompare(`${b.opvolgdatum ?? ''} ${b.opvolgtijd ?? '99:99'}`)
    return opDatum || a.naam.localeCompare(b.naam, 'nl')
  }
}

// ─── Link-code ────────────────────────────────────────────────────────────────

/** "Joey van Dijk" → "joey-van-dijk" (alleen a-z, 0-9 en streepjes). */
export function slugVoorNaam(naam: string): string {
  const s = naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return s || 'pt'
}

/**
 * De link-code: gewoon de naam (fitfactorypt.nl/joey). Bestaat die al (twee Joeys)
 * of botst hij met een bestaande pagina (/login, /lead, …), dan "joey-2", "joey-3", …
 * De pincode beveiligt de gegevens, niet de URL.
 */
export function linkCodeVoor(naam: string, bezet: ReadonlySet<string>): string {
  const basis = slugVoorNaam(naam)
  if (!bezet.has(basis) && !GERESERVEERD.has(basis)) return basis
  let n = 2
  while (bezet.has(`${basis}-${n}`)) n++
  return `${basis}-${n}`
}

/**
 * Alle vaste paden op het hoogste niveau: een PT'er mag geen code krijgen die
 * daarmee botst (die pagina zou dan winnen). `routes.test.ts` controleert dat
 * deze lijst de mappen in src/app dekt.
 */
export const GERESERVEERD: ReadonlySet<string> = new Set([
  '1', 'achievements', 'aiyourgym', 'mijn', 'widget', 'actief', 'ademhaling', 'admin', 'agent', 'api', 'auth', 'bedankt', 'bestanden', 'burnout', 'chat',
  'checkin', 'clubinloggen', 'clubkane', 'coach', 'coaching', 'contact', 'content', 'dankbaarheid', 'dashboard', 'declaraties', 'directory', 'disc',
  'doelen', 'doelkeuze', 'enps', 'focus', 'fonts', 'gezondheid', 'groeien', 'groeiplan', 'home', 'hr', 'instellingen',
  'inzichten', 'journal', 'kanebongers', 'koppelingen', 'lead', 'FitFactoryPT', 'fitfactorypt', 'lifeos', 'lifeoskane', 'login', 'loonstroken', 'meditatie',
  'mentale-sterkte', 'mijn-coach', 'mijn-content', 'mijn-gesprekken', 'mijn-rapport', 'mijn-taken', 'mijn-traject',
  'mijn-voeding', 'nieuws', 'niveau', 'onboarding', 'patronen', 'pijler', 'portaal', 'prestaties', 'profiel',
  'programma', 'projecten', 'protocollen', 'psych-veiligheid', 'pulse-survey', 'rapport', 'reflectie', 'register',
  'robots', 'roosters', 'setup', 'slaap', 'sport', 'stappen', 'stemming', 'stemming-kalender', 'stress', 'surveys',
  'team', 'team-uitdagingen', 'training', 'uitdagingen', 'uitnodiging', 'uren', 'vandaag', 'verlof', 'voeding',
  'voortgang', 'voorwaarden', 'wachtwoord-reset', 'wachtwoord-vergeten', 'water', 'welzijn', 'werkgeluk',
  'favicon', 'models', 'brand', 'logo', 'brain', 'theme-init',
  // RELEASE V-webshop (src/app/releasev), bereikbaar via releasev.nl
  'releasev',
])

export const CODE_PATROON = /^[a-z0-9-]{2,60}$/

/** De pincode die een PT'er kiest: precies 6 cijfers. */
export const PIN_PATROON = /^\d{6}$/

/** Pin-status zoals jij 'm in het dashboard ziet. */
export type PinStatus = 'geen' | 'wacht' | 'actief'

/** Wat Kane met een pincode doet. */
export type PinActie = 'goedkeuren' | 'afwijzen' | 'resetten'

export function isPinStatus(v: unknown): v is PinStatus {
  return v === 'geen' || v === 'wacht' || v === 'actief'
}

// ─── Samenvatting voor het coachgesprek ───────────────────────────────────────

export interface LeadSamenvatting {
  /** Nieuwe leads sinds het vorige gesprek. */
  nieuw: number
  /** Per status, over de nieuwe leads. */
  perStatus: Record<LeadStatus, number>
  /** Totaal klant geworden ooit (uit alle meegegeven leads). */
  klantenTotaal: number
  /** Open leads waarvan de opvolgdatum verstreken is (over álle leads). */
  achterstallig: number
  /** De nieuwe leads zelf, nieuwste eerst (max 12). */
  lijst: Lead[]
  /** Vanaf wanneer geteld (ISO). */
  sinds: string
}

/** Samenvatting voor het coachgesprek: wat er sinds `sinds` bijkwam. `vandaag` = YYYY-MM-DD. */
export function vatLeadsSamen(leads: readonly Lead[], sinds: Date, vandaag: string): LeadSamenvatting {
  const grens = sinds.getTime()
  const nieuw = leads
    .filter((l) => new Date(l.aangemaaktOp).getTime() >= grens)
    .sort((a, b) => b.aangemaaktOp.localeCompare(a.aangemaaktOp))
  const perStatus = Object.fromEntries(LEAD_STATUSSEN.map((s) => [s, 0])) as Record<LeadStatus, number>
  for (const l of nieuw) perStatus[l.status]++
  return {
    nieuw: nieuw.length,
    perStatus,
    klantenTotaal: leads.filter((l) => l.status === 'klant').length,
    achterstallig: leads.filter((l) => moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag).length,
    lijst: nieuw.slice(0, 12),
    sinds: sinds.toISOString(),
  }
}

/** Een samenvatting uit JSON (de pt-gesprekken-API). Kapot → null. */
export function leesLeadSamenvatting(ruw: unknown): LeadSamenvatting | null {
  const o = obj(ruw)
  if (!o || typeof o.nieuw !== 'number' || typeof o.sinds !== 'string' || !Array.isArray(o.lijst)) return null
  const ps = obj(o.perStatus) ?? {}
  const perStatus = Object.fromEntries(LEAD_STATUSSEN.map((s) => [s, typeof ps[s] === 'number' ? (ps[s] as number) : 0])) as Record<LeadStatus, number>
  const lijst = o.lijst.flatMap((l): Lead[] => {
    const lead = leesLead(l)
    return lead ? [lead] : []
  })
  return {
    nieuw: o.nieuw,
    perStatus,
    klantenTotaal: typeof o.klantenTotaal === 'number' ? o.klantenTotaal : 0,
    achterstallig: typeof o.achterstallig === 'number' ? o.achterstallig : 0,
    lijst,
    sinds: o.sinds,
  }
}

/** Eén regel voor het verslag/de mail: "5 nieuwe leads · 1 intake ingepland · 1 klant geworden". */
export function leadRegel(s: LeadSamenvatting): string {
  const achter = s.achterstallig > 0 ? ` · ${s.achterstallig} opvolging${s.achterstallig === 1 ? '' : 'en'} te laat` : ''
  if (s.nieuw === 0) return `Geen nieuwe leads ingevuld sinds het vorige gesprek.${achter}`
  const delen = (['proefles', 'intake', 'klant'] as const)
    .filter((k) => s.perStatus[k] > 0)
    .map((k) => `${s.perStatus[k]} ${STATUS_LABEL[k].toLowerCase()}`)
  return `${s.nieuw} nieuwe lead${s.nieuw === 1 ? '' : 's'}${delen.length ? ` · ${delen.join(' · ')}` : ''}${achter}`
}

const DAG_NL = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' })

/** De dagsleutel (YYYY-MM-DD) van `nu` in Nederlandse tijd. */
export function dagSleutelNl(nu: Date): string {
  return DAG_NL.format(nu)
}
