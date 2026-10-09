// ─── MentaForce Vandaag-kaart — de rekening: wat kosten je gewoontes je? ───────────────
// Confronterend, maar eerlijk. Elk getal hieronder komt letterlijk uit een
// gepubliceerd onderzoek (bron erbij), of is een rekensom op jouw eigen metingen.
// Wat we bewust NIET doen: een persoonlijk "je verliest 2,3 jaar" uitrekenen.
// Die onderzoeken meten verbanden in grote groepen, geen voorspelling voor één
// mens — wie dat getal toch verzint, liegt met een decimaal erachter.

import { normaal } from './normaal'
import { conditieRegel, rusthartslagRegel } from './rekening-hart'
import { NL, type Taalset } from '@/lib/i18n/taalset'
import type { Feiten } from './types'

/** Waar het sterfterisico in onderzoek afvlakt voor volwassenen onder de 60 (Paluch 2022). */
export const STAPPEN_ZONE = 8000
/** Onder deze grens gaat het om je slaapduur (onderdeel van "7–8 uur" in Qian 2023). */
export const SLAAP_ZONE_MIN = 7 * 60
/** Gewoon wandeltempo: zo veel stappen per minuut, voor de omrekening naar minuten. */
const STAPPEN_PER_MINUUT = 100

export interface Bron {
  titel: string
  url: string
}

export interface RekeningRegel {
  id: 'stappen' | 'slaap' | 'vo2max' | 'rusthartslag'
  /** In de zone (true) of kost het je iets (false)? */
  goed: boolean
  /** Jouw eigen meting, als korte zin. */
  jij: string
  /** Het grote getal en wat het betekent. */
  getal: string
  getalUitleg: string
  /** Wat het onderzoek zegt — letterlijk de bevinding, met de beperking erbij. */
  onderzoek: string
  /** Wat het concreet vraagt. */
  stap: string | null
  bronnen: Bron[]
}

export type Rekening =
  | { soort: 'te_weinig_data'; nodig: number }
  | { soort: 'klaar'; regels: RekeningRegel[] }

const BRON_STAPPEN: Bron = {
  titel: 'Banach et al., European Journal of Preventive Cardiology (2023)',
  url: 'https://doi.org/10.1093/eurjpc/zwad229',
}
const BRON_ACTIEF: Bron = {
  titel: 'Veerman et al., British Journal of Sports Medicine (2024)',
  url: 'https://doi.org/10.1136/bjsports-2024-108125',
}
const BRON_SLAAP: Bron = {
  titel: 'Qian et al., American College of Cardiology (2023)',
  url: 'https://www.acc.org/About-ACC/Press-Releases/2023/02/22/21/35/Getting-Good-Sleep-Could-Add-Years-to-Your-Life',
}

function getal(n: number, ts: Taalset): string {
  return n.toLocaleString(ts.locale)
}

function uren(minuten: number, ts: Taalset): string {
  const u = Math.floor(minuten / 60)
  const m = Math.round(minuten % 60)
  if (u === 0) return ts.t('duur.minuten', { m })
  return m === 0 ? ts.t('duur.uurLang', { u }) : ts.t('duur.uurMin', { u, mm: String(m).padStart(2, '0') })
}

function rondAf(n: number, op: number): number {
  return Math.round(n / op) * op
}

export function stappenRegel(gemiddeld: number, ts: Taalset = NL): RekeningRegel {
  const jij = ts.t('rekening.stappen.jij', { stappen: getal(rondAf(gemiddeld, 100), ts) })
  if (gemiddeld >= STAPPEN_ZONE) {
    return {
      id: 'stappen',
      goed: true,
      jij,
      getal: '−15%',
      getalUitleg: ts.t('rekening.stappen.goedUitleg'),
      onderzoek: ts.t('rekening.stappen.goedOnderzoek'),
      stap: null,
      bronnen: [BRON_STAPPEN],
    }
  }
  const tekort = rondAf(STAPPEN_ZONE - gemiddeld, 100)
  const minuten = Math.max(5, rondAf(tekort / STAPPEN_PER_MINUUT, 5))
  return {
    id: 'stappen',
    goed: false,
    jij,
    getal: getal(tekort, ts),
    getalUitleg: ts.t('rekening.stappen.tekortUitleg', { zone: getal(STAPPEN_ZONE, ts) }),
    onderzoek: ts.t('rekening.stappen.tekortOnderzoek'),
    stap: ts.t('rekening.stappen.stap', { minuten }),
    bronnen: [BRON_STAPPEN, BRON_ACTIEF],
  }
}

export function slaapRegel(gemiddeld: number, ts: Taalset = NL): RekeningRegel {
  const jij = ts.t('rekening.slaap.jij', { duur: uren(gemiddeld, ts) })
  if (gemiddeld >= SLAAP_ZONE_MIN) {
    return {
      id: 'slaap',
      goed: true,
      jij,
      getal: ts.t('rekening.slaap.jaren'),
      getalUitleg: ts.t('rekening.slaap.goedUitleg'),
      onderzoek: ts.t('rekening.slaap.goedOnderzoek'),
      stap: null,
      bronnen: [BRON_SLAAP],
    }
  }
  const tekort = rondAf(SLAAP_ZONE_MIN - gemiddeld, 5)
  return {
    id: 'slaap',
    goed: false,
    jij,
    getal: ts.t('rekening.slaap.jaren'),
    getalUitleg: ts.t('rekening.slaap.tekortUitleg'),
    onderzoek: ts.t('rekening.slaap.tekortOnderzoek'),
    stap: ts.t('rekening.slaap.stap', { tekort: uren(tekort, ts), minuten: tekort > 30 ? 30 : tekort }),
    bronnen: [BRON_SLAAP],
  }
}

/** Hoeveel metingen er per as nodig zijn voordat de rekening iets zegt. */
export const REKENING_MIN = 5

/** De rekening uit je eigen metingen. Zonder genoeg data zegt hij dat eerlijk. */
type RekeningInvoer = Pick<Feiten, 'slaapMinuten' | 'slaapHistorie' | 'stappenGisteren' | 'stappenHistorie'> &
  Partial<Pick<Feiten, 'herstel' | 'vo2max'>>

function metLaatste(laatste: number | null | undefined, historie: readonly number[]): number[] {
  return [...(laatste != null ? [laatste] : []), ...historie]
}

export function maakRekening(f: RekeningInvoer, ts: Taalset = NL): Rekening {
  const slaap = normaal(metLaatste(f.slaapMinuten, f.slaapHistorie), REKENING_MIN)
  const stappen = normaal(metLaatste(f.stappenGisteren, f.stappenHistorie), REKENING_MIN)
  const hartslag = f.herstel ? normaal(metLaatste(f.herstel.rustHartslag, f.herstel.rustHartslagHistorie), REKENING_MIN) : null
  const regels: RekeningRegel[] = []
  if (stappen !== null) regels.push(stappenRegel(stappen, ts))
  if (slaap !== null) regels.push(slaapRegel(slaap, ts))
  if (f.vo2max != null) regels.push(conditieRegel(f.vo2max, ts))
  if (hartslag !== null) regels.push(rusthartslagRegel(hartslag, ts))
  if (regels.length === 0) return { soort: 'te_weinig_data', nodig: REKENING_MIN }
  // Wat je iets kost eerst: daar zit de winst.
  return { soort: 'klaar', regels: [...regels].sort((a, b) => Number(a.goed) - Number(b.goed)) }
}
