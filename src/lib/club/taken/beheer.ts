// ─── Fit Factory Club, taken: beheer (PUUR) ─────────────────────────────────
// Verplaatsen binnen een lijst en de lijsten van een vestiging kopieren naar
// een andere. De opslag voert alleen uit wat hier is uitgerekend.

import type { TaakVelden } from './invoer'
import { opVolgorde, type Taak, type Takenlijst } from './typen'

export interface Volgorde {
  id: string
  volgorde: number
}

/**
 * Een item een plek omhoog of omlaag. Geeft de nieuwe volgorde (stappen van 10)
 * van alleen de items die veranderen, of null als het niet kan (al bovenaan).
 */
export function verplaats<T extends { id: string; volgorde: number; naam: string }>(
  items: readonly T[],
  id: string,
  richting: 'omhoog' | 'omlaag',
): Volgorde[] | null {
  const rij = opVolgorde(items)
  const i = rij.findIndex((x) => x.id === id)
  const j = richting === 'omhoog' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= rij.length) return null
  const nieuw = [...rij]
  nieuw[i] = rij[j]
  nieuw[j] = rij[i]
  return nieuw
    .map((x, n) => ({ id: x.id, volgorde: (n + 1) * 10, oud: x.volgorde }))
    .filter((x) => x.volgorde !== x.oud)
    .map(({ id: xid, volgorde }) => ({ id: xid, volgorde }))
}

/** De volgende vrije volgorde achteraan. */
export function volgendeVolgorde(items: readonly { volgorde: number }[]): number {
  return items.reduce((max, x) => Math.max(max, x.volgorde), 0) + 10
}

export interface TeKopierenTaak extends TaakVelden {
  volgorde: number
}

export interface KopieerPlan {
  /** Lijsten die de doelvestiging nog niet heeft, met al hun taken. */
  nieuweLijsten: { naam: string; volgorde: number; taken: TeKopierenTaak[] }[]
  /** Bestaande lijsten (zelfde naam) die taken bijkrijgen die er nog niet in staan. */
  aanvullen: { lijstId: string; taken: TeKopierenTaak[] }[]
  aantalTaken: number
}

function sleutel(naam: string): string {
  return naam.trim().toLowerCase()
}

function alsKopie(t: Taak): TeKopierenTaak {
  return { naam: t.naam, groep: t.groep, frequentie: t.frequentie, perWeekMin: t.perWeekMin, moment: t.moment, volgorde: t.volgorde }
}

/**
 * Wat er gekopieerd moet worden. Alleen actieve lijsten en taken; niets dubbel:
 * een lijst met dezelfde naam wordt aangevuld, een taak met dezelfde naam in die
 * lijst overgeslagen. Afvinkingen gaan nooit mee.
 */
export function kopieerPlan(
  bron: { lijsten: readonly Takenlijst[]; taken: readonly Taak[] },
  doel: { lijsten: readonly Takenlijst[]; taken: readonly Taak[] },
): KopieerPlan {
  const doelLijst = new Map(doel.lijsten.map((l) => [sleutel(l.naam), l]))
  const plan: KopieerPlan = { nieuweLijsten: [], aanvullen: [], aantalTaken: 0 }
  let volgorde = volgendeVolgorde(doel.lijsten)
  for (const lijst of opVolgorde(bron.lijsten).filter((l) => l.actief)) {
    const taken = opVolgorde(bron.taken.filter((t) => t.lijstId === lijst.id && t.actief))
    const bestaand = doelLijst.get(sleutel(lijst.naam))
    if (!bestaand) {
      plan.nieuweLijsten.push({ naam: lijst.naam, volgorde, taken: taken.map(alsKopie) })
      plan.aantalTaken += taken.length
      volgorde += 10
      continue
    }
    const al = doel.taken.filter((t) => t.lijstId === bestaand.id)
    const namen = new Set(al.map((t) => sleutel(t.naam)))
    const start = volgendeVolgorde(al)
    const nieuw = taken.filter((t) => !namen.has(sleutel(t.naam))).map((t, i) => ({ ...alsKopie(t), volgorde: start + i * 10 }))
    if (nieuw.length > 0) {
      plan.aanvullen.push({ lijstId: bestaand.id, taken: nieuw })
      plan.aantalTaken += nieuw.length
    }
  }
  return plan
}
