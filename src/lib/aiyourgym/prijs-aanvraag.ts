// ─── AI Your Gym: een prijs op maat aanvragen (PUUR) ────────────────────────
// Systeemgrens van /aiyourgym/prijs-op-maat. Een prijsaanvraag is een gewone
// aanvraag in ayg_demo_aanvragen (migratie 436, geen nieuwe tabel): pakket en
// aantal leden gaan in de opmerking, met "Prijs op maat" vooraan, zodat Kane hem
// op /club/platform herkent. Er gaat niets automatisch naar buiten en er staan
// nergens bedragen (besluit Kane).

import { PAKKETTEN } from './pakketten'
import { leesDemoAanvraag, type DemoAanvraag, type DemoFouten } from './demo-aanvraag'

export const PRIJS_KENMERK = 'Prijs op maat'

export const PRIJS_PAKKETTEN = [
  ...PAKKETTEN.map((p) => ({ sleutel: p.sleutel as string, label: p.naam })),
  { sleutel: 'weet-niet', label: 'Weet ik nog niet' },
] as const satisfies readonly { sleutel: string; label: string }[]

export const PRIJS_LEDEN = [
  { sleutel: 'tot-250', label: 'Tot 250' },
  { sleutel: '250-750', label: '250 tot 750' },
  { sleutel: '750-1500', label: '750 tot 1.500' },
  { sleutel: 'meer-1500', label: 'Meer dan 1.500' },
  { sleutel: 'weet-niet', label: 'Weet ik niet' },
] as const
export type PrijsLeden = (typeof PRIJS_LEDEN)[number]['sleutel']

export type PrijsVeld = keyof DemoFouten | 'pakket' | 'leden'
export type PrijsFouten = Partial<Record<PrijsVeld, string>>
export type PrijsUitslag = { ok: true; waarde: DemoAanvraag } | { ok: false; fouten: PrijsFouten }

/** De drie stappen van het formulier en hun velden (voor fouten per stap). */
export const PRIJS_STAPPEN = [
  { sleutel: 'sportschool', titel: 'Je sportschool', velden: ['soort', 'pakket'] },
  { sleutel: 'omvang', titel: 'Omvang', velden: ['vestigingen', 'leden'] },
  { sleutel: 'contact', titel: 'Contact', velden: ['naam', 'sportschool', 'email', 'telefoon', 'akkoord'] },
] as const satisfies readonly { sleutel: string; titel: string; velden: readonly PrijsVeld[] }[]

/** Komt dit verzoek van het prijsformulier? */
export function isPrijsAanvraag(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as Record<string, unknown>).doel === 'prijs'
}

function labelVan(lijst: readonly { sleutel: string; label: string }[], v: unknown): string | null {
  return lijst.find((x) => x.sleutel === v)?.label ?? null
}

/** De opmerking zoals Kane hem ziet: "Prijs op maat. Pakket: Club. Leden: 250 tot 750." */
export function prijsOpmerking(pakket: string, leden: string): string {
  return `${PRIJS_KENMERK}. Pakket: ${pakket}. Leden: ${leden}.`
}

export function leesPrijsAanvraag(body: unknown): PrijsUitslag {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const pakket = labelVan(PRIJS_PAKKETTEN, b.pakket)
  const leden = labelVan(PRIJS_LEDEN, b.leden)
  const fouten: PrijsFouten = {}
  if (!pakket) fouten.pakket = 'Kies een pakket, of "Weet ik nog niet".'
  if (!leden) fouten.leden = 'Kies ongeveer hoeveel leden je hebt.'

  // Een prijsgesprek heeft geen voorkeursmoment en geen vrije opmerking.
  const basis = leesDemoAanvraag({ ...b, moment: 'maakt-niet-uit', opmerking: '' })
  if (!basis.ok) Object.assign(fouten, basis.fouten)
  if (!basis.ok || !pakket || !leden) return { ok: false, fouten }
  return { ok: true, waarde: { ...basis.waarde, opmerking: prijsOpmerking(pakket, leden) } }
}

/** Alleen de fouten van de velden in deze stap. */
export function prijsFoutenVanStap(stap: number, fouten: PrijsFouten): PrijsFouten {
  const velden: readonly PrijsVeld[] = PRIJS_STAPPEN[stap]?.velden ?? []
  return Object.fromEntries(Object.entries(fouten).filter(([v]) => velden.includes(v as PrijsVeld))) as PrijsFouten
}

/** De eerste stap met een fout, of null. */
export function eersteStapMetPrijsFout(fouten: PrijsFouten): number | null {
  const i = PRIJS_STAPPEN.findIndex((s) => (s.velden as readonly PrijsVeld[]).some((v) => fouten[v]))
  return i === -1 ? null : i
}
