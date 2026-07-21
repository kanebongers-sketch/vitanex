// ─── LifeOS — Finance: types, narrowing en formattering ─────────────────────
// De data-vorm ligt vast in het contract (een parallelle route levert 'm). Hier
// staat de systeemgrens: `unknown` → een smalle, vertrouwde view, met de
// gedeelde narrowers uit `api/http`. Geen cast — een server die iets anders
// teruggeeft dan afgesproken levert een nette fout, geen half object dat drie
// componenten verderop crasht.
//
// Eerlijk boven alles: de kern-cijfers zijn verplicht (ontbreken → fout, niet
// een verzonnen 0). De trend is een nette-om-te-hebben: losse rommelige maanden
// worden overgeslagen i.p.v. de hele kaart op fout te zetten.

import { getalOfNull, isObject, tekstOfNull } from '@/lib/lifeos/api/http'

export interface TrendMaand {
  maand: string
  omzet: number
  kosten: number
  winst: number
}

export interface FinanceOverzicht {
  maand: string
  omzet: number
  kosten: number
  winst: number
  openstaand: number
  verlopenAantal: number
  trend: TrendMaand[]
  aantalTransacties: number
}

export type TransactieSoort = 'omzet' | 'kosten'

/** Wat het snel-toevoegen-formulier naar de server stuurt. */
export interface NieuweTransactie {
  soort: TransactieSoort
  bedrag: number
  omschrijving: string
  datum: string
  categorie?: string
  persoonId?: string
}

// ── Narrowing ────────────────────────────────────────────────────────────────

/** Narrowt één trend-maand. `null` = overslaan (niet de hele kaart laten vallen). */
function leesTrendMaand(ruw: unknown): TrendMaand | null {
  if (!isObject(ruw)) return null
  const maand = tekstOfNull(ruw.maand)
  const omzet = getalOfNull(ruw.omzet)
  const kosten = getalOfNull(ruw.kosten)
  const winst = getalOfNull(ruw.winst)
  if (maand === null || omzet === null || kosten === null || winst === null) return null
  return { maand, omzet, kosten, winst }
}

/** De trend-reeks: alleen de goed-gevormde maanden, in serverkomst-volgorde. */
function leesTrend(ruw: unknown): TrendMaand[] {
  if (!Array.isArray(ruw)) return []
  const uit: TrendMaand[] = []
  for (const rij of ruw) {
    const maand = leesTrendMaand(rij)
    if (maand !== null) uit.push(maand)
  }
  return uit
}

/** Narrowt het `/finance/overzicht`-antwoord. `null` = onverwachte vorm → foutstaat. */
export function leesOverzicht(ruw: unknown): FinanceOverzicht | null {
  if (!isObject(ruw)) return null
  const maand = tekstOfNull(ruw.maand)
  const omzet = getalOfNull(ruw.omzet)
  const kosten = getalOfNull(ruw.kosten)
  const winst = getalOfNull(ruw.winst)
  const openstaand = getalOfNull(ruw.openstaand)
  const verlopenAantal = getalOfNull(ruw.verlopenAantal)
  const aantalTransacties = getalOfNull(ruw.aantalTransacties)

  if (
    maand === null ||
    omzet === null ||
    kosten === null ||
    winst === null ||
    openstaand === null ||
    verlopenAantal === null ||
    aantalTransacties === null
  ) {
    return null
  }

  return {
    maand,
    omzet,
    kosten,
    winst,
    openstaand,
    verlopenAantal,
    aantalTransacties,
    trend: leesTrend(ruw.trend),
  }
}

// ── Formattering & datum-helpers ─────────────────────────────────────────────

// Bewust géén decimalen: het overzicht is een oogopslag, geen grootboek. Zo
// leest `€ 1.234` als één rustig getal i.p.v. `€ 1.234,00`.
const EURO = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEuro(bedrag: number): string {
  return EURO.format(bedrag)
}

function twee(n: number): string {
  return String(n).padStart(2, '0')
}

/** De huidige maand als `YYYY-MM` (lokale tijd). */
export function huidigeMaand(vandaag: Date = new Date()): string {
  return `${vandaag.getFullYear()}-${twee(vandaag.getMonth() + 1)}`
}

/** Vandaag als `YYYY-MM-DD` (lokale tijd) — de default-datum in het formulier. */
export function vandaagDatum(vandaag: Date = new Date()): string {
  return `${vandaag.getFullYear()}-${twee(vandaag.getMonth() + 1)}-${twee(vandaag.getDate())}`
}

/** `YYYY-MM` → een echte datum op de 1e, of `null` bij een onleesbare sleutel. */
function maandNaarDatum(maand: string): Date | null {
  const [jaarRuw, maandRuw] = maand.split('-')
  const jaar = Number(jaarRuw)
  const m = Number(maandRuw)
  if (!Number.isInteger(jaar) || !Number.isInteger(m) || m < 1 || m > 12) return null
  return new Date(jaar, m - 1, 1)
}

/** Korte maandnaam ('jul') uit `YYYY-MM`; faalt naar de ruwe sleutel. */
export function maandKort(maand: string): string {
  const d = maandNaarDatum(maand)
  return d ? d.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '') : maand
}

/** Volledige maand + jaar ('Juli 2026') uit `YYYY-MM`; faalt naar de ruwe sleutel. */
export function maandVolledig(maand: string): string {
  const d = maandNaarDatum(maand)
  if (!d) return maand
  const label = d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Parseert een handmatig getypt bedrag naar een positief getal, of `null`.
 *
 * Nederlandse invoer accepteren zonder te gokken: een komma is de decimaal, dus
 * bij een komma vallen de duizendtal-punten weg ('1.234,56' → 1234.56). Zonder
 * komma blijft de invoer intact ('1234.56'). Fail fast: 0, negatief of onzin → null.
 */
export function parseBedrag(ruw: string): number | null {
  let s = ruw.trim().replace(/\s/g, '')
  if (s === '') return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}
