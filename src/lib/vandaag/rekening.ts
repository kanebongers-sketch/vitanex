// ─── MentaForce Vandaag-kaart — de rekening: wat kosten je gewoontes je? ───────────────
// Confronterend, maar eerlijk. Elk getal hieronder komt letterlijk uit een
// gepubliceerd onderzoek (bron erbij), of is een rekensom op jouw eigen metingen.
// Wat we bewust NIET doen: een persoonlijk "je verliest 2,3 jaar" uitrekenen.
// Die onderzoeken meten verbanden in grote groepen, geen voorspelling voor één
// mens — wie dat getal toch verzint, liegt met een decimaal erachter.

import { normaal } from './normaal'
import { conditieRegel, rusthartslagRegel } from './rekening-hart'
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
  titel: 'Banach e.a., European Journal of Preventive Cardiology (2023) — 17 studies, 226.889 mensen',
  url: 'https://doi.org/10.1093/eurjpc/zwad229',
}
const BRON_ACTIEF: Bron = {
  titel: 'Veerman e.a., British Journal of Sports Medicine (2024) — levensverwachting en beweging',
  url: 'https://doi.org/10.1136/bjsports-2024-108125',
}
const BRON_SLAAP: Bron = {
  titel: 'Qian e.a., American College of Cardiology (2023) — 172.321 mensen',
  url: 'https://www.acc.org/About-ACC/Press-Releases/2023/02/22/21/35/Getting-Good-Sleep-Could-Add-Years-to-Your-Life',
}

function nl(n: number): string {
  return n.toLocaleString('nl-NL')
}

function uren(minuten: number): string {
  const u = Math.floor(minuten / 60)
  const m = Math.round(minuten % 60)
  if (u === 0) return `${m} minuten`
  return m === 0 ? `${u} uur` : `${u}u${String(m).padStart(2, '0')}`
}

function rondAf(n: number, op: number): number {
  return Math.round(n / op) * op
}

export function stappenRegel(gemiddeld: number): RekeningRegel {
  const jij = `Je loopt normaal zo'n ${nl(rondAf(gemiddeld, 100))} stappen per dag.`
  if (gemiddeld >= STAPPEN_ZONE) {
    return {
      id: 'stappen',
      goed: true,
      jij,
      getal: '−15%',
      getalUitleg: 'minder kans op vroegtijdig overlijden, per 1.000 stappen per dag',
      onderzoek:
        'Je zit in de zone waar het risico in onderzoek afvlakt. Elke 1.000 stappen per dag méér ging samen met 15% minder kans om vroegtijdig te overlijden — en een bovengrens is nog niet gevonden. Het gaat om een verband in grote groepen, geen garantie.',
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
    getal: `${nl(tekort)}`,
    getalUitleg: `stappen per dag tekort op de ${nl(STAPPEN_ZONE)} waar het risico afvlakt`,
    onderzoek:
      'Elke 1.000 stappen per dag méér ging samen met 15% minder kans om vroegtijdig te overlijden. In een Amerikaans model leefde het minst actieve kwart van de 40-plussers tot bijna 11 jaar korter dan het meest actieve kwart. Verbanden in grote groepen — geen persoonlijke voorspelling, wel een duidelijke richting.',
    stap: `Dat is ongeveer ${minuten} minuten extra wandelen per dag.`,
    bronnen: [BRON_STAPPEN, BRON_ACTIEF],
  }
}

export function slaapRegel(gemiddeld: number): RekeningRegel {
  const jij = `Je slaapt normaal ${uren(gemiddeld)} per nacht.`
  if (gemiddeld >= SLAAP_ZONE_MIN) {
    return {
      id: 'slaap',
      goed: true,
      jij,
      getal: '4,7 jaar',
      getalUitleg: 'langer leven bij mannen met vijf gezonde slaapgewoontes (vrouwen: 2,4 jaar)',
      onderzoek:
        'Je haalt de 7 uur — één van de vijf gewoontes uit dit onderzoek. De andere vier: snel inslapen, doorslapen, geen slaapmiddelen en uitgerust wakker worden. Voorlopig onderzoek en een verband, geen bewijs van oorzaak.',
      stap: null,
      bronnen: [BRON_SLAAP],
    }
  }
  const tekort = rondAf(SLAAP_ZONE_MIN - gemiddeld, 5)
  return {
    id: 'slaap',
    goed: false,
    jij,
    getal: '4,7 jaar',
    getalUitleg: 'korter leven bij mannen met hooguit één van vijf gezonde slaapgewoontes (vrouwen: 2,4 jaar)',
    onderzoek:
      'Wie 7–8 uur sliep én de andere vier gewoontes had (snel inslapen, doorslapen, geen slaapmiddelen, uitgerust wakker), leefde gemiddeld langer dan wie er hooguit één had. Jij mist nu al de eerste. Voorlopig onderzoek en een verband, geen bewijs van oorzaak.',
    stap: `Je komt ${uren(tekort)} tekort op 7 uur. Begin met ${tekort > 30 ? '30' : String(tekort)} minuten eerder naar bed.`,
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

export function maakRekening(f: RekeningInvoer): Rekening {
  const slaap = normaal(metLaatste(f.slaapMinuten, f.slaapHistorie), REKENING_MIN)
  const stappen = normaal(metLaatste(f.stappenGisteren, f.stappenHistorie), REKENING_MIN)
  const hartslag = f.herstel ? normaal(metLaatste(f.herstel.rustHartslag, f.herstel.rustHartslagHistorie), REKENING_MIN) : null
  const regels: RekeningRegel[] = []
  if (stappen !== null) regels.push(stappenRegel(stappen))
  if (slaap !== null) regels.push(slaapRegel(slaap))
  if (f.vo2max != null) regels.push(conditieRegel(f.vo2max))
  if (hartslag !== null) regels.push(rusthartslagRegel(hartslag))
  if (regels.length === 0) return { soort: 'te_weinig_data', nodig: REKENING_MIN }
  // Wat je iets kost eerst: daar zit de winst.
  return { soort: 'klaar', regels: [...regels].sort((a, b) => Number(a.goed) - Number(b.goed)) }
}
