// ─── Rekening: hart en conditie (horloge) ───────────────────────────────────
// Twee metingen die je horloge levert en die in groot onderzoek sterk met
// levensduur samenhangen. Zelfde regel als rekening.ts: alleen het cijfer uit de
// bron plus jouw eigen meting, geen persoonlijke voorspelling. De grenzen
// ("laag", "hoog") zijn die van de onderzoeken zelf, niet van ons.

import type { Bron, RekeningRegel } from './rekening'

const BRON_CONDITIE: Bron = {
  titel: 'Kodama e.a., JAMA (2009) — 33 studies, 102.980 mensen',
  url: 'https://doi.org/10.1001/jama.2009.681',
}
const BRON_RUSTHARTSLAG: Bron = {
  titel: 'Zhang e.a., CMAJ (2016) — 46 studies, 1,2 miljoen mensen',
  url: 'https://doi.org/10.1503/cmaj.150535',
}

/** 1 MET = 3,5 ml/kg/min. Kodama: < 7,9 MET laag, ≥ 10,9 MET hoog. */
const MET = 3.5
export const VO2MAX_LAAG = Math.round(7.9 * MET * 10) / 10 // 27,7
export const VO2MAX_HOOG = Math.round(10.9 * MET * 10) / 10 // 38,2
/** Zhang: vergeleken met de laagste groep stijgt het risico vanaf 60 slagen. */
export const RUSTHARTSLAG_ZONE = 60

function komma(n: number): string {
  return n.toLocaleString('nl-NL', { maximumFractionDigits: 1 })
}

export function conditieRegel(vo2max: number): RekeningRegel {
  const goed = vo2max >= VO2MAX_HOOG
  const groep = vo2max < VO2MAX_LAAG ? 'laag' : goed ? 'hoog' : 'gemiddeld'
  const tekort = Math.max(0, VO2MAX_HOOG - vo2max)
  return {
    id: 'vo2max',
    goed,
    jij: `Je VO2max (conditie) is ${komma(vo2max)}. Dat valt in dit onderzoek in de groep "${groep}".`,
    getal: '−13%',
    getalUitleg: 'minder kans op vroegtijdig overlijden per 3,5 punt VO2max hoger',
    onderzoek: `Conditie is een van de sterkste voorspellers die we kennen. In 33 studies ging elke 3,5 punt VO2max hoger samen met 13% minder kans om vroegtijdig te overlijden. Onder ${komma(VO2MAX_LAAG)} heet dat onderzoek je conditie laag, vanaf ${komma(VO2MAX_HOOG)} hoog. Een verband in grote groepen, geen persoonlijke voorspelling.`,
    stap: goed ? null : `Je zit ${komma(tekort)} punt onder "hoog". Stevig wandelen, fietsen of hardlopen waarbij je net niet meer kunt praten, een paar keer per week, is wat je conditie omhoog brengt.`,
    bronnen: [BRON_CONDITIE],
  }
}

export function rusthartslagRegel(rusthartslag: number): RekeningRegel {
  const goed = rusthartslag < RUSTHARTSLAG_ZONE
  const r = Math.round(rusthartslag)
  return {
    id: 'rusthartslag',
    goed,
    jij: `Je rusthartslag is normaal ${r} slagen per minuut.`,
    getal: '+9%',
    getalUitleg: 'meer kans op vroegtijdig overlijden per 10 slagen hogere rusthartslag',
    onderzoek: goed
      ? 'Je zit onder de 60, de groep met het laagste risico in dit onderzoek. Daarboven steeg het risico met ongeveer 9% per 10 slagen, ook binnen wat artsen "normaal" noemen. Een verband, geen bewijs dat verlagen je leven verlengt.'
      : `In 46 studies steeg het risico op vroegtijdig overlijden met ongeveer 9% per 10 slagen hogere rusthartslag, ook binnen wat artsen "normaal" noemen (60–100). Boven de 80 lag het risico 45% hoger dan in de laagste groep. Een verband, geen bewijs dat verlagen je leven verlengt.`,
    stap: goed ? null : 'Regelmatige duurtraining en genoeg slaap gaan bij de meeste mensen samen met een lagere rusthartslag. Schiet hij plotseling omhoog of voel je je niet goed: overleg met je huisarts.',
    bronnen: [BRON_RUSTHARTSLAG],
  }
}
