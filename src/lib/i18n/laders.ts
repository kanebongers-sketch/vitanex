// GEGENEREERD — per taal: kern (<taal>.json) + één bestand per gebied (<gebied>/<taal>.json).
// Nieuw gebied? Voeg het toe aan GEBIEDEN en aan elke taal hieronder.

import type { Taal } from './talen'
import type { Woordenboek } from './vertaal'

export const GEBIEDEN = ["voortgang", "lichaam", "mentaal", "vita", "account", "site", "coaching", "werk"] as const

type Lader = () => Promise<Woordenboek[]>

const lees = (m: { default: unknown }) => m.default as Woordenboek

export const LADERS: Record<Taal, Lader> = {
  nl: () => Promise.all([
    import('./woordenboeken/nl.json').then(lees),
    import('./woordenboeken/voortgang/nl.json').then(lees),
    import('./woordenboeken/lichaam/nl.json').then(lees),
    import('./woordenboeken/mentaal/nl.json').then(lees),
    import('./woordenboeken/vita/nl.json').then(lees),
    import('./woordenboeken/account/nl.json').then(lees),
    import('./woordenboeken/site/nl.json').then(lees),
    import('./woordenboeken/coaching/nl.json').then(lees),
    import('./woordenboeken/werk/nl.json').then(lees),
  ]),
  en: () => Promise.all([
    import('./woordenboeken/en.json').then(lees),
    import('./woordenboeken/voortgang/en.json').then(lees),
    import('./woordenboeken/lichaam/en.json').then(lees),
    import('./woordenboeken/mentaal/en.json').then(lees),
    import('./woordenboeken/vita/en.json').then(lees),
    import('./woordenboeken/account/en.json').then(lees),
    import('./woordenboeken/site/en.json').then(lees),
    import('./woordenboeken/coaching/en.json').then(lees),
    import('./woordenboeken/werk/en.json').then(lees),
  ]),
  zh: () => Promise.all([
    import('./woordenboeken/zh.json').then(lees),
    import('./woordenboeken/voortgang/zh.json').then(lees),
    import('./woordenboeken/lichaam/zh.json').then(lees),
    import('./woordenboeken/mentaal/zh.json').then(lees),
    import('./woordenboeken/vita/zh.json').then(lees),
    import('./woordenboeken/account/zh.json').then(lees),
    import('./woordenboeken/site/zh.json').then(lees),
    import('./woordenboeken/coaching/zh.json').then(lees),
    import('./woordenboeken/werk/zh.json').then(lees),
  ]),
  hi: () => Promise.all([
    import('./woordenboeken/hi.json').then(lees),
    import('./woordenboeken/voortgang/hi.json').then(lees),
    import('./woordenboeken/lichaam/hi.json').then(lees),
    import('./woordenboeken/mentaal/hi.json').then(lees),
    import('./woordenboeken/vita/hi.json').then(lees),
    import('./woordenboeken/account/hi.json').then(lees),
    import('./woordenboeken/site/hi.json').then(lees),
    import('./woordenboeken/coaching/hi.json').then(lees),
    import('./woordenboeken/werk/hi.json').then(lees),
  ]),
  es: () => Promise.all([
    import('./woordenboeken/es.json').then(lees),
    import('./woordenboeken/voortgang/es.json').then(lees),
    import('./woordenboeken/lichaam/es.json').then(lees),
    import('./woordenboeken/mentaal/es.json').then(lees),
    import('./woordenboeken/vita/es.json').then(lees),
    import('./woordenboeken/account/es.json').then(lees),
    import('./woordenboeken/site/es.json').then(lees),
    import('./woordenboeken/coaching/es.json').then(lees),
    import('./woordenboeken/werk/es.json').then(lees),
  ]),
  ar: () => Promise.all([
    import('./woordenboeken/ar.json').then(lees),
    import('./woordenboeken/voortgang/ar.json').then(lees),
    import('./woordenboeken/lichaam/ar.json').then(lees),
    import('./woordenboeken/mentaal/ar.json').then(lees),
    import('./woordenboeken/vita/ar.json').then(lees),
    import('./woordenboeken/account/ar.json').then(lees),
    import('./woordenboeken/site/ar.json').then(lees),
    import('./woordenboeken/coaching/ar.json').then(lees),
    import('./woordenboeken/werk/ar.json').then(lees),
  ]),
  fr: () => Promise.all([
    import('./woordenboeken/fr.json').then(lees),
    import('./woordenboeken/voortgang/fr.json').then(lees),
    import('./woordenboeken/lichaam/fr.json').then(lees),
    import('./woordenboeken/mentaal/fr.json').then(lees),
    import('./woordenboeken/vita/fr.json').then(lees),
    import('./woordenboeken/account/fr.json').then(lees),
    import('./woordenboeken/site/fr.json').then(lees),
    import('./woordenboeken/coaching/fr.json').then(lees),
    import('./woordenboeken/werk/fr.json').then(lees),
  ]),
  bn: () => Promise.all([
    import('./woordenboeken/bn.json').then(lees),
    import('./woordenboeken/voortgang/bn.json').then(lees),
    import('./woordenboeken/lichaam/bn.json').then(lees),
    import('./woordenboeken/mentaal/bn.json').then(lees),
    import('./woordenboeken/vita/bn.json').then(lees),
    import('./woordenboeken/account/bn.json').then(lees),
    import('./woordenboeken/site/bn.json').then(lees),
    import('./woordenboeken/coaching/bn.json').then(lees),
    import('./woordenboeken/werk/bn.json').then(lees),
  ]),
  pt: () => Promise.all([
    import('./woordenboeken/pt.json').then(lees),
    import('./woordenboeken/voortgang/pt.json').then(lees),
    import('./woordenboeken/lichaam/pt.json').then(lees),
    import('./woordenboeken/mentaal/pt.json').then(lees),
    import('./woordenboeken/vita/pt.json').then(lees),
    import('./woordenboeken/account/pt.json').then(lees),
    import('./woordenboeken/site/pt.json').then(lees),
    import('./woordenboeken/coaching/pt.json').then(lees),
    import('./woordenboeken/werk/pt.json').then(lees),
  ]),
  ru: () => Promise.all([
    import('./woordenboeken/ru.json').then(lees),
    import('./woordenboeken/voortgang/ru.json').then(lees),
    import('./woordenboeken/lichaam/ru.json').then(lees),
    import('./woordenboeken/mentaal/ru.json').then(lees),
    import('./woordenboeken/vita/ru.json').then(lees),
    import('./woordenboeken/account/ru.json').then(lees),
    import('./woordenboeken/site/ru.json').then(lees),
    import('./woordenboeken/coaching/ru.json').then(lees),
    import('./woordenboeken/werk/ru.json').then(lees),
  ]),
  ur: () => Promise.all([
    import('./woordenboeken/ur.json').then(lees),
    import('./woordenboeken/voortgang/ur.json').then(lees),
    import('./woordenboeken/lichaam/ur.json').then(lees),
    import('./woordenboeken/mentaal/ur.json').then(lees),
    import('./woordenboeken/vita/ur.json').then(lees),
    import('./woordenboeken/account/ur.json').then(lees),
    import('./woordenboeken/site/ur.json').then(lees),
    import('./woordenboeken/coaching/ur.json').then(lees),
    import('./woordenboeken/werk/ur.json').then(lees),
  ]),
}

/** Voegt kern + gebieden samen (elk gebied heeft één eigen top-level sleutel). */
export function voegSamen(delen: readonly Woordenboek[]): Woordenboek {
  return Object.assign({}, ...delen) as Woordenboek
}
