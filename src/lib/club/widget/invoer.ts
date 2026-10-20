// ─── Club, boekingswidget: invoer controleren (PUUR) ────────────────────────
// Twee grenzen: de aanvraag van een bezoeker (nog geen lid) op de website van
// een sportschool, en de instellingen die de eigenaar in Club opslaat. Alles
// van buiten is `unknown`; foutteksten zijn Nederlands en kunnen zo in beeld.

import { normaliseerEmail, normaliseerTelefoon } from '@/lib/club/leads/dubbel'
import { isUuid } from '@/lib/club/kern/organisatie'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { leesDomeinen } from './kader'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const goed = <T>(waarde: T): Uitkomst<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string): Uitkomst<T> => ({ ok: false, fout: tekst })

/** Een aanvraag is klein: alles boven deze grens wordt geweigerd voordat hij gelezen is. */
export const MAX_AANVRAAG_BYTES = 4096

export const KLEURMODI = ['huisstijl', 'licht', 'donker'] as const
export type Kleurmodus = (typeof KLEURMODI)[number]

export const KLEURMODUS_LABEL: Record<Kleurmodus, string> = {
  huisstijl: 'Zoals je huisstijl',
  licht: 'Licht',
  donker: 'Donker',
}

export function isKleurmodus(v: unknown): v is Kleurmodus {
  return typeof v === 'string' && (KLEURMODI as readonly string[]).includes(v)
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Zonder stuurtekens en met enkele spaties; null als het leeg of te lang is. */
function schoneTekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().replace(/\s+/g, ' ')
  return t.length >= 1 && t.length <= max ? t : null
}

const EMAIL = /^[^\s@"<>,;]+@[^\s@"<>,;]+\.[a-z]{2,}$/
const TELEFOON = /^\+?[0-9 ()-]{8,25}$/

export type AanvraagSoort ='proefles' | 'kennismaking'

export interface WidgetAanvraag {
  soort: AanvraagSoort
  /** De gekozen les bij een proefles; null bij een kennismaking. */
  lesId: string | null
  naam: string
  email: string
  telefoon: string
}

export type AanvraagUitslag = Uitkomst<WidgetAanvraag> | { ok: 'spam' }

/**
 * De aanvraag van een bezoeker. Naam, e-mail, telefoon en akkoord met de
 * privacyverklaring zijn verplicht. Een ingevuld honeypotveld ("website") is
 * een bot: die krijgt hetzelfde antwoord als een echte aanvraag, maar er
 * gebeurt niets.
 */
export function leesWidgetAanvraag(body: unknown): AanvraagUitslag {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  if (typeof r.website === 'string' && r.website.trim() !== '') return { ok: 'spam' }
  if (r.soort !== 'proefles' && r.soort !== 'kennismaking') return fout('Kies een les of een kennismaking.')
  const lesId = r.soort === 'proefles' ? r.lesId : null
  if (r.soort === 'proefles' && !isUuid(lesId)) return fout('Kies een les.')
  const naam = schoneTekst(r.naam, 120)
  if (!naam || naam.length < 2) return fout('Vul je naam in.')
  const emailRuw = schoneTekst(r.email, 160)
  const email = emailRuw ? normaliseerEmail(emailRuw) : null
  if (!email || !EMAIL.test(email)) return fout('Vul een geldig e-mailadres in.')
  const telefoon = schoneTekst(r.telefoon, 40)
  if (!telefoon || !TELEFOON.test(telefoon) || !normaliseerTelefoon(telefoon)) return fout('Vul een geldig telefoonnummer in.')
  if (r.akkoord !== true) return fout('Geef toestemming dat we contact met je opnemen.')
  return goed({ soort: r.soort, lesId: typeof lesId === 'string' ? lesId : null, naam, email, telefoon })
}

export interface WidgetInstellingenInvoer {
  vestiging: string
  aan: boolean
  domeinen: string[]
  lestypeIds: string[]
  kleurmodus: Kleurmodus
  privacyUrl: string | null
}

/** Een link naar de privacyverklaring: leeg mag, anders https en hooguit 300 tekens. */
export function leesPrivacyUrl(v: unknown): Uitkomst<string | null> {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return goed(null)
  if (typeof v !== 'string' || v.trim().length > 300) return fout('De link naar de privacyverklaring is te lang.')
  try {
    const url = new URL(v.trim())
    if (url.protocol !== 'https:' || url.username || url.password) return fout('De link naar de privacyverklaring moet met https:// beginnen.')
    return goed(url.toString())
  } catch {
    return fout('De link naar de privacyverklaring klopt niet.')
  }
}

export function leesWidgetInstellingen(body: unknown): Uitkomst<WidgetInstellingenInvoer> {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  if (!isVestigingSlug(r.vestiging)) return fout('Onbekende vestiging.')
  if (typeof r.aan !== 'boolean') return fout('Kies of de widget aan of uit staat.')
  const domeinen = leesDomeinen(r.domeinen ?? [])
  if (!domeinen.ok) return fout(domeinen.fout)
  if (!Array.isArray(r.lestypeIds) || r.lestypeIds.length > 200 || !r.lestypeIds.every(isUuid)) return fout('Ongeldige keuze van lessen.')
  if (!isKleurmodus(r.kleurmodus)) return fout('Kies een kleurmodus.')
  const privacy = leesPrivacyUrl(r.privacyUrl)
  if (!privacy.ok) return privacy
  return goed({
    vestiging: r.vestiging,
    aan: r.aan,
    domeinen: domeinen.domeinen,
    lestypeIds: [...new Set(r.lestypeIds)],
    kleurmodus: r.kleurmodus,
    privacyUrl: privacy.waarde,
  })
}

/** De instellingen van de widget voor een vestiging, zoals ze in Club en de widget gebruikt worden. */
export interface WidgetInstellingen {
  aan: boolean
  domeinen: string[]
  lestypeIds: string[]
  kleurmodus: Kleurmodus
  privacyUrl: string | null
}

export const STANDAARD_WIDGET: WidgetInstellingen = { aan: false, domeinen: [], lestypeIds: [], kleurmodus: 'huisstijl', privacyUrl: null }

export const WIDGET_KOLOMMEN = 'aan, domeinen, lestype_ids, kleurmodus, privacy_url'

/** Systeemgrens: een rij uit club_widget_instellingen (of geen rij) naar instellingen. */
export function widgetInstellingenUitRij(rij: unknown): WidgetInstellingen {
  const r = obj(rij)
  if (!r) return STANDAARD_WIDGET
  const domeinen = leesDomeinen(Array.isArray(r.domeinen) ? r.domeinen : [])
  const privacy = leesPrivacyUrl(r.privacy_url)
  return {
    aan: r.aan === true,
    domeinen: domeinen.ok ? domeinen.domeinen : [],
    lestypeIds: Array.isArray(r.lestype_ids) ? r.lestype_ids.filter(isUuid) : [],
    kleurmodus: isKleurmodus(r.kleurmodus) ? r.kleurmodus : 'huisstijl',
    privacyUrl: privacy.ok ? privacy.waarde : null,
  }
}
