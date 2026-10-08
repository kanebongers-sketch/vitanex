// ─── LifeOS — lead tracker (PUUR, ook client) ───────────────────────────────
// Wat een PT'er invult op zijn eigen lead-pagina, en de samenvatting die jij in
// het wekelijkse coachgesprek ziet. Geen fetch, geen DB.

export const LEAD_STATUSSEN = ['gesproken', 'afspraak', 'proefles', 'klant', 'geen_interesse'] as const
export type LeadStatus = (typeof LEAD_STATUSSEN)[number]
export const STATUS_LABEL: Record<LeadStatus, string> = {
  gesproken: 'Gesproken',
  afspraak: 'Afspraak gepland',
  proefles: 'Proefles gehad',
  klant: 'Klant geworden',
  geen_interesse: 'Geen interesse',
}

export const LEAD_BRONNEN = ['gym', 'social', 'via_via', 'website', 'anders'] as const
export type LeadBron = (typeof LEAD_BRONNEN)[number]
export const BRON_LABEL: Record<LeadBron, string> = {
  gym: 'In de gym',
  social: 'Social media',
  via_via: 'Via via',
  website: 'Website',
  anders: 'Anders',
}

export interface Lead {
  id: string
  naam: string
  contact: string | null
  bron: LeadBron
  status: LeadStatus
  notitie: string | null
  /** Dagsleutel YYYY-MM-DD: wanneer gesproken. */
  gesprokenOp: string
  aangemaaktOp: string
}

export interface NieuweLead {
  naam: string
  contact: string | null
  bron: LeadBron
  status: LeadStatus
  notitie: string | null
  gesprokenOp: string
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, max)
}
export function isStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSSEN as readonly string[]).includes(v)
}
export function isBron(v: unknown): v is LeadBron {
  return typeof v === 'string' && (LEAD_BRONNEN as readonly string[]).includes(v)
}

/** Het formulier van de PT'er → een nieuwe lead, of een leesbare fout. `vandaag` = YYYY-MM-DD. */
export function leesNieuweLead(body: unknown, vandaag: string): Lees<NieuweLead> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = tekst(o.naam, 120)
  if (!naam) return { ok: false, fout: 'Vul de naam in van wie je gesproken hebt.' }
  if (!isBron(o.bron)) return { ok: false, fout: 'Kies waar je diegene gesproken hebt.' }
  const status = isStatus(o.status) ? o.status : 'gesproken'
  let gesprokenOp = vandaag
  if (typeof o.gesprokenOp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.gesprokenOp)) {
    if (o.gesprokenOp > vandaag) return { ok: false, fout: 'De datum ligt in de toekomst.' }
    gesprokenOp = o.gesprokenOp
  }
  return { ok: true, waarde: { naam, contact: tekst(o.contact, 160), bron: o.bron, status, notitie: tekst(o.notitie, 500), gesprokenOp } }
}

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
 * De link-code: gewoon de naam ("joey"). Bestaat die al (twee Joeys), dan
 * "joey-2", "joey-3", … De pincode beveiligt de leads, niet de URL.
 */
export function linkCodeVoor(naam: string, bezet: ReadonlySet<string>): string {
  const basis = slugVoorNaam(naam)
  if (!bezet.has(basis)) return basis
  let n = 2
  while (bezet.has(`${basis}-${n}`)) n++
  return `${basis}-${n}`
}

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

export interface LeadSamenvatting {
  /** Nieuwe leads sinds het vorige gesprek. */
  nieuw: number
  /** Per status, over de nieuwe leads. */
  perStatus: Record<LeadStatus, number>
  /** Totaal klant geworden ooit (uit alle meegegeven leads). */
  klantenTotaal: number
  /** De nieuwe leads zelf, nieuwste eerst (max 12). */
  lijst: Lead[]
  /** Vanaf wanneer geteld (ISO). */
  sinds: string
}

/** Samenvatting voor het coachgesprek: wat er sinds `sinds` bijkwam. */
export function vatLeadsSamen(leads: readonly Lead[], sinds: Date): LeadSamenvatting {
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
    lijst: nieuw.slice(0, 12),
    sinds: sinds.toISOString(),
  }
}

/** Eén lead uit JSON (API-antwoord), of null. */
export function leesLead(ruw: unknown): Lead | null {
  const x = obj(ruw)
  if (!x || typeof x.id !== 'string' || typeof x.naam !== 'string' || !isBron(x.bron) || !isStatus(x.status)) return null
  return {
    id: x.id, naam: x.naam, bron: x.bron, status: x.status,
    contact: typeof x.contact === 'string' ? x.contact : null,
    notitie: typeof x.notitie === 'string' ? x.notitie : null,
    gesprokenOp: typeof x.gesprokenOp === 'string' ? x.gesprokenOp : '',
    aangemaaktOp: typeof x.aangemaaktOp === 'string' ? x.aangemaaktOp : '',
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
  return { nieuw: o.nieuw, perStatus, klantenTotaal: typeof o.klantenTotaal === 'number' ? o.klantenTotaal : 0, lijst, sinds: o.sinds }
}

/** Eén regel voor het verslag/de mail: "5 nieuwe leads · 2 afspraak · 1 klant". */
export function leadRegel(s: LeadSamenvatting): string {
  if (s.nieuw === 0) return 'Geen nieuwe leads ingevuld sinds het vorige gesprek.'
  const delen = (['afspraak', 'proefles', 'klant'] as const).filter((k) => s.perStatus[k] > 0).map((k) => `${s.perStatus[k]} ${STATUS_LABEL[k].toLowerCase()}`)
  return `${s.nieuw} nieuwe lead${s.nieuw === 1 ? '' : 's'}${delen.length ? ` · ${delen.join(' · ')}` : ''}`
}

const DAG_NL = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' })

/** De dagsleutel (YYYY-MM-DD) van `nu` in Nederlandse tijd. */
export function dagSleutelNl(nu: Date): string {
  return DAG_NL.format(nu)
}
