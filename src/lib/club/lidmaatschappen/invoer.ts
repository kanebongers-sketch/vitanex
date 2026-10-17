// ─── Club, lidmaatschappen: invoer van de pagina controleren (PUUR) ─────────
// Systeemgrens: alles wat binnenkomt wordt hier gecontroleerd voordat het de
// database in gaat. Vestigingen alleen uit de eigen sportschool.

import { normaliseerTag, MAX_TAG } from '@/lib/club/leden/invoer'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { normaliseerTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { MAX_LESSEN_PER_WEEK, MAX_NAAM, MAX_OMSCHRIJVING_LABEL, MAX_OMSCHRIJVING_VORM, isKleur, type Kleur } from './model'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function mis<T>(fout: string): Uitslag<T> {
  return { ok: false, fout }
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function tekst(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

export interface VormInvoer {
  naam: string
  omschrijving: string
  vestigingen: string[] | null
  groepslessen: boolean
  maxLessenPerWeek: number | null
  dalVan: string | null
  dalTot: string | null
  dalWeekendVrij: boolean
  kleur: Kleur
  actief: boolean
}

type Vestigingen = readonly Pick<VestigingInfo, 'sleutel'>[]

function leesVestigingen(v: unknown, eigen: Vestigingen): Uitslag<string[] | null> {
  if (v === null || v === undefined || v === 'alle') return { ok: true, waarde: null }
  if (!Array.isArray(v) || !v.every((s) => typeof s === 'string')) return mis('Kies de vestigingen.')
  const slugs = new Set(eigen.map((x) => x.sleutel))
  const lijst = [...new Set(v)]
  if (lijst.length === 0) return mis('Kies minstens een vestiging, of alle vestigingen.')
  if (lijst.some((s) => !slugs.has(s))) return mis('Een van de vestigingen hoort niet bij je sportschool.')
  // Alle vestigingen aangevinkt = alle (ook toekomstige).
  return { ok: true, waarde: lijst.length === slugs.size ? null : eigen.map((x) => x.sleutel).filter((s) => lijst.includes(s)) }
}

function leesMax(v: unknown): Uitslag<number | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : Number.NaN
  if (!Number.isInteger(n) || n < 1 || n > MAX_LESSEN_PER_WEEK) return mis(`Het maximum aantal lessen per week is een heel getal van 1 tot ${MAX_LESSEN_PER_WEEK}, of leeg.`)
  return { ok: true, waarde: n }
}

function leesDaluren(o: Record<string, unknown>): Uitslag<{ van: string | null; tot: string | null; weekendVrij: boolean }> {
  const leeg = (x: unknown) => x === null || x === undefined || x === ''
  if (leeg(o.dalVan) && leeg(o.dalTot)) return { ok: true, waarde: { van: null, tot: null, weekendVrij: false } }
  const van = normaliseerTijd(o.dalVan)
  const tot = normaliseerTijd(o.dalTot)
  if (!van || !tot) return mis('Vul bij daluren een begin- en eindtijd in, of laat beide leeg.')
  if (tijdNaarMinuten(tot) <= tijdNaarMinuten(van)) return mis('De daluren moeten eindigen na het begin.')
  return { ok: true, waarde: { van, tot, weekendVrij: o.dalWeekendVrij === true } }
}

export function leesVorm(body: unknown, eigen: Vestigingen): Uitslag<VormInvoer> {
  const o = object(body)
  if (!o) return mis('Ongeldige invoer.')
  const naam = tekst(o.naam)
  if (!naam) return mis('Geef de vorm een naam, zoals hij in Sportivity heet.')
  if (naam.length > MAX_NAAM) return mis(`Een naam mag maximaal ${MAX_NAAM} tekens zijn.`)
  const omschrijving = tekst(o.omschrijving)
  if (omschrijving.length > MAX_OMSCHRIJVING_VORM) return mis(`De omschrijving mag maximaal ${MAX_OMSCHRIJVING_VORM} tekens zijn.`)
  const vestigingen = leesVestigingen(o.vestigingen, eigen)
  if (!vestigingen.ok) return vestigingen
  const groepslessen = o.groepslessen !== false
  const max = groepslessen ? leesMax(o.maxLessenPerWeek) : ({ ok: true, waarde: null } as const)
  if (!max.ok) return max
  const dal = leesDaluren(o)
  if (!dal.ok) return dal
  if (o.kleur !== undefined && !isKleur(o.kleur)) return mis('Kies een kleur uit de lijst.')
  return {
    ok: true,
    waarde: {
      naam,
      omschrijving,
      vestigingen: vestigingen.waarde,
      groepslessen,
      maxLessenPerWeek: max.waarde,
      dalVan: dal.waarde.van,
      dalTot: dal.waarde.tot,
      dalWeekendVrij: dal.waarde.weekendVrij,
      kleur: isKleur(o.kleur) ? o.kleur : 'amber',
      actief: o.actief !== false,
    },
  }
}

export interface LabelInvoer {
  naam: string
  omschrijving: string
  kleur: Kleur
}

export function leesLabel(body: unknown): Uitslag<LabelInvoer> {
  const o = object(body)
  if (!o) return mis('Ongeldige invoer.')
  const ruw = typeof o.naam === 'string' ? o.naam : ''
  if (!ruw.trim()) return mis('Geef het label een naam.')
  const naam = normaliseerTag(ruw)
  if (!naam) return mis(`Een labelnaam heeft letters of cijfers en is maximaal ${MAX_TAG} tekens.`)
  const omschrijving = tekst(o.omschrijving)
  if (omschrijving.length > MAX_OMSCHRIJVING_LABEL) return mis(`De omschrijving mag maximaal ${MAX_OMSCHRIJVING_LABEL} tekens zijn.`)
  if (o.kleur !== undefined && !isKleur(o.kleur)) return mis('Kies een kleur uit de lijst.')
  return { ok: true, waarde: { naam, omschrijving, kleur: isKleur(o.kleur) ? o.kleur : 'blauw' } }
}

/** DELETE-body van een label: moet de tag ook van de leden af? */
export function leesTagsOok(body: unknown): boolean {
  const o = object(body)
  return o?.tagsOok === true
}
