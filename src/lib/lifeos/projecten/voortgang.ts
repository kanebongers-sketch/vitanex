// ─── LifeOS — voortgang & groepering voor het projectenbord ─────────────────
// Puur bestand: geen fetch, geen DB, geen React. Het bord stelt twee vragen die
// je zónder DOM kunt nagaan — en waar een verkeerd antwoord ("3/8 klaar") precies
// de stille onwaarheid is die de rest van deze laag bewaakt. Dus testbaar.
//
// Bewust NIET afhankelijk van `Taak`: `projecten.ts` houdt met opzet vol dat een
// project niets van een taak weet. Deze helper leent alleen de twee velden die
// hij écht nodig heeft (`projectId`, `klaar`) via een structurele grens. Een
// echte `Taak` voldoet daaraan, dus het bord geeft gewoon `Taak[]` door.

import type { Project } from './projecten'

/** Het minimum dat het bord van een taak hoeft te weten om te tellen. */
export interface TaakStatus {
  klaar: boolean
}

/** Het minimum om een taak bij een project te plaatsen. */
export interface TaakPlaatsing {
  projectId: string | null
}

export interface Voortgang {
  klaar: number
  totaal: number
}

/**
 * Hoeveel taken zijn af, van het totaal. `0/0` is een geldige uitkomst — een
 * project zonder taken is echt leeg, geen fout en geen "bijna klaar".
 */
export function voortgang(taken: readonly TaakStatus[]): Voortgang {
  let klaar = 0
  for (const taak of taken) if (taak.klaar) klaar++
  return { klaar, totaal: taken.length }
}

/**
 * 0–100, afgerond. Zonder taken 0 — nooit een verzonnen percentage op een lege
 * teller (delen door nul mag hier geen NaN of 100 opleveren).
 */
export function voortgangProcent({ klaar, totaal }: Voortgang): number {
  if (totaal <= 0) return 0
  return Math.round((klaar / totaal) * 100)
}

export interface ProjectGroep<T> {
  project: Project
  taken: T[]
}

export interface Groepering<T> {
  /** Eén groep per project, in de volgorde waarin de projecten binnenkwamen. */
  groepen: ProjectGroep<T>[]
  /** Taken zonder (bekend) project — de "Zonder project"-bak. */
  zonderProject: T[]
}

/**
 * Verdeelt alle taken over hun project. Behoudt de volgorde van `projecten`
 * (de API sorteert al: actief eerst, dan op naam) en geeft elk project ook een
 * lege lijst als er geen taken bij horen.
 *
 * Een taak met een `projectId` dat niet in de lijst voorkomt valt terug op
 * "zonder project" i.p.v. te verdwijnen: liever zichtbaar op de verkeerde plek
 * dan stil weg. In de praktijk komt dat niet voor omdat het bord álle projecten
 * ophaalt (ook gearchiveerde), maar de terugval is de eerlijke keuze.
 */
export function groepeerPerProject<T extends TaakPlaatsing>(
  projecten: readonly Project[],
  taken: readonly T[],
): Groepering<T> {
  const perId = new Map<string, T[]>()
  for (const project of projecten) perId.set(project.id, [])

  const zonderProject: T[] = []
  for (const taak of taken) {
    const bak = taak.projectId !== null ? perId.get(taak.projectId) : undefined
    if (bak) bak.push(taak)
    else zonderProject.push(taak)
  }

  const groepen = projecten.map((project) => ({ project, taken: perId.get(project.id) ?? [] }))
  return { groepen, zonderProject }
}
