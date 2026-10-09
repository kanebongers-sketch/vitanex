// ─── Rekening: hart en conditie (horloge) ───────────────────────────────────
// Twee metingen die je horloge levert en die in groot onderzoek sterk met
// levensduur samenhangen. Zelfde regel als rekening.ts: alleen het cijfer uit de
// bron plus jouw eigen meting, geen persoonlijke voorspelling. De grenzen
// ("laag", "hoog") zijn die van de onderzoeken zelf, niet van ons.

import type { Bron, RekeningRegel } from './rekening'
import { NL, type Taalset } from '@/lib/i18n/taalset'

const BRON_CONDITIE: Bron = {
  titel: 'Kodama et al., JAMA (2009)',
  url: 'https://doi.org/10.1001/jama.2009.681',
}
const BRON_RUSTHARTSLAG: Bron = {
  titel: 'Zhang et al., CMAJ (2016)',
  url: 'https://doi.org/10.1503/cmaj.150535',
}

/** 1 MET = 3,5 ml/kg/min. Kodama: < 7,9 MET laag, ≥ 10,9 MET hoog. */
const MET = 3.5
export const VO2MAX_LAAG = Math.round(7.9 * MET * 10) / 10 // 27,7
export const VO2MAX_HOOG = Math.round(10.9 * MET * 10) / 10 // 38,2
/** Zhang: vergeleken met de laagste groep stijgt het risico vanaf 60 slagen. */
export const RUSTHARTSLAG_ZONE = 60

function komma(n: number, ts: Taalset): string {
  return n.toLocaleString(ts.locale, { maximumFractionDigits: 1 })
}

export function conditieRegel(vo2max: number, ts: Taalset = NL): RekeningRegel {
  const goed = vo2max >= VO2MAX_HOOG
  const groep = ts.t(`rekening.vo2max.${vo2max < VO2MAX_LAAG ? 'laag' : goed ? 'hoog' : 'gemiddeld'}`)
  const tekort = Math.max(0, VO2MAX_HOOG - vo2max)
  return {
    id: 'vo2max',
    goed,
    jij: ts.t('rekening.vo2max.jij', { waarde: komma(vo2max, ts), groep }),
    getal: '−13%',
    getalUitleg: ts.t('rekening.vo2max.uitleg'),
    onderzoek: ts.t('rekening.vo2max.onderzoek', { laag: komma(VO2MAX_LAAG, ts), hoog: komma(VO2MAX_HOOG, ts) }),
    stap: goed ? null : ts.t('rekening.vo2max.stap', { tekort: komma(tekort, ts) }),
    bronnen: [BRON_CONDITIE],
  }
}

export function rusthartslagRegel(rusthartslag: number, ts: Taalset = NL): RekeningRegel {
  const goed = rusthartslag < RUSTHARTSLAG_ZONE
  return {
    id: 'rusthartslag',
    goed,
    jij: ts.t('rekening.rusthartslag.jij', { n: Math.round(rusthartslag) }),
    getal: '+9%',
    getalUitleg: ts.t('rekening.rusthartslag.uitleg'),
    onderzoek: ts.t(goed ? 'rekening.rusthartslag.goedOnderzoek' : 'rekening.rusthartslag.tekortOnderzoek'),
    stap: goed ? null : ts.t('rekening.rusthartslag.stap'),
    bronnen: [BRON_RUSTHARTSLAG],
  }
}
