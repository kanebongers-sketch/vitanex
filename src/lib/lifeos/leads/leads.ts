// ─── LifeOS — lead tracker (PUUR, ook client) ───────────────────────────────
// Het model van de Excel-tracker die het PT-team gebruikte (per club een tab):
// datum, naam, contact, club, bron, interesse, status, volgende stap,
// opvolgdatum, Google review / referral gevraagd, "kent iemand", notities.
// Plus de samenvatting die jij in het wekelijkse coachgesprek ziet. Geen fetch, geen DB.

import { isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'

function keuze<const T extends readonly string[]>(lijst: T) {
  return (v: unknown): v is T[number] => typeof v === 'string' && (lijst as readonly string[]).includes(v)
}

export const LEAD_STATUSSEN = ['nieuw', 'opvolgen', 'proefles', 'intake', 'later', 'geen_interesse', 'klant'] as const
export type LeadStatus = (typeof LEAD_STATUSSEN)[number]
export const STATUS_LABEL: Record<LeadStatus, string> = {
  nieuw: 'Nieuw',
  opvolgen: 'Opvolgen',
  proefles: 'Proefles ingepland',
  intake: 'Intake ingepland',
  later: 'Later opvolgen',
  geen_interesse: 'Geen interesse',
  klant: 'Klant geworden',
}
/** Nog in de pijplijn (niet afgesloten). */
export const OPEN_STATUSSEN: readonly LeadStatus[] = ['nieuw', 'opvolgen', 'proefles', 'intake', 'later']
export const isStatus = keuze(LEAD_STATUSSEN)

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
  reviewGevraagd: boolean
  referralGevraagd: boolean
  kentIemand: string | null
  notitie: string | null
  /** Dagsleutel YYYY-MM-DD: wanneer gesproken. */
  gesprokenOp: string
  aangemaaktOp: string
}

export type NieuweLead = Omit<Lead, 'id' | 'aangemaaktOp'>

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
export function leesNieuweLead(body: unknown, vandaag: string): Lees<NieuweLead> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = tekst(o.naam, 120)
  if (!naam) return { ok: false, fout: 'Vul de naam in van wie je gesproken hebt.' }
  if (!isBron(o.bron)) return { ok: false, fout: 'Kies hoe je diegene gesproken hebt (bron).' }
  let gesprokenOp = vandaag
  if (typeof o.gesprokenOp === 'string' && DAG.test(o.gesprokenOp)) {
    if (o.gesprokenOp > vandaag) return { ok: false, fout: 'De datum ligt in de toekomst.' }
    gesprokenOp = o.gesprokenOp
  }
  const opvolgdatum = typeof o.opvolgdatum === 'string' && DAG.test(o.opvolgdatum) ? o.opvolgdatum : null
  return {
    ok: true,
    waarde: {
      naam,
      contact: tekst(o.contact, 160),
      club: isClub(o.club) ? o.club : null,
      bron: o.bron,
      interesse: isInteresse(o.interesse) ? o.interesse : null,
      status: isStatus(o.status) ? o.status : 'nieuw',
      volgendeStap: isStap(o.volgendeStap) ? o.volgendeStap : null,
      opvolgdatum,
      reviewGevraagd: o.reviewGevraagd === true,
      referralGevraagd: o.referralGevraagd === true,
      kentIemand: tekst(o.kentIemand, 200),
      notitie: tekst(o.notitie, 1000),
      gesprokenOp,
    },
  }
}

/** Eén lead uit JSON (API-antwoord), of null. */
export function leesLead(ruw: unknown): Lead | null {
  const x = obj(ruw)
  if (!x || typeof x.id !== 'string' || typeof x.aangemaaktOp !== 'string') return null
  const r = leesNieuweLead(x, '9999-12-31')
  return r.ok ? { id: x.id, aangemaaktOp: x.aangemaaktOp, ...r.waarde } : null
}

/** Moet deze lead vandaag (of eerder) opgevolgd worden? */
export function moetOpvolgen(l: Pick<Lead, 'status' | 'opvolgdatum'>, vandaag: string): boolean {
  return OPEN_STATUSSEN.includes(l.status) && l.opvolgdatum !== null && l.opvolgdatum <= vandaag
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
  'achievements', 'actief', 'ademhaling', 'admin', 'agent', 'api', 'auth', 'bedankt', 'bestanden', 'burnout', 'chat',
  'checkin', 'coach', 'coaching', 'contact', 'content', 'dankbaarheid', 'dashboard', 'declaraties', 'directory', 'disc',
  'doelen', 'doelkeuze', 'enps', 'focus', 'fonts', 'gezondheid', 'groeien', 'groeiplan', 'home', 'hr', 'instellingen',
  'inzichten', 'journal', 'kanebongers', 'koppelingen', 'lead', 'FitFactoryPT', 'fitfactorypt', 'lifeos', 'login', 'loonstroken', 'meditatie',
  'mentale-sterkte', 'mijn-coach', 'mijn-content', 'mijn-gesprekken', 'mijn-rapport', 'mijn-taken', 'mijn-traject',
  'mijn-voeding', 'nieuws', 'niveau', 'onboarding', 'patronen', 'pijler', 'portaal', 'prestaties', 'profiel',
  'programma', 'projecten', 'protocollen', 'psych-veiligheid', 'pulse-survey', 'rapport', 'reflectie', 'register',
  'robots', 'roosters', 'setup', 'slaap', 'sport', 'stappen', 'stemming', 'stemming-kalender', 'stress', 'surveys',
  'team', 'team-uitdagingen', 'training', 'uitdagingen', 'uitnodiging', 'uren', 'vandaag', 'verlof', 'voeding',
  'voortgang', 'voorwaarden', 'wachtwoord-reset', 'wachtwoord-vergeten', 'water', 'welzijn', 'werkgeluk',
  'favicon', 'models', 'brand', 'logo', 'brain', 'theme-init',
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
