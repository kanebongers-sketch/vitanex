// ─── Club, rep-speler: van render en schemaregel naar een plan (PUUR) ───────
// Besluit Kane (29-10-2026): het beeld speelt altijd op 1 seconde heen en 1
// seconde terug, zonder vastmomenten. Het tempo uit het schema stuurt het beeld
// niet meer (uitgerekte beelden haperen); het staat erbij als tekst en curve.
// De teller loopt gelijk met het beeld: een herhaling per 2 seconden.

import { doelVan } from './doel'
import { AFSPEEL_TEMPO, leesSchemaTempo } from './tempo'
import { maakHerhalingPlan, maakVasthoudPlan, tempoUitleg } from './tijdlijn'
import type { FaseWoorden, FrameFases, HeenIs, RenderSoort, RepPlan } from './typen'

/** Wat de speler van een render moet weten (los van waar de beelden staan). */
export interface RenderTiming {
  frames: number
  fps: number
  fases: FrameFases
  heenIs: HeenIs
  soort: RenderSoort
  woorden?: FaseWoorden
}

/** Wat het schema voorschrijft voor een set. */
export interface SetVoorschrift {
  herhalingen: string | null | undefined
  tijdSec: number | null | undefined
  /** Alleen voor de tekst; het beeld speelt altijd op AFSPEEL_TEMPO. */
  tempo: string | null | undefined
}

export function planVoor(render: RenderTiming, set: SetVoorschrift): RepPlan {
  if (render.soort === 'vasthouden') {
    const doel = doelVan({ soort: 'vasthouden', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: 0 })
    return maakVasthoudPlan({ frames: render.frames, fps: render.fps, doelSec: doel.soort === 'vasthouden' ? doel.sec : 30 })
  }
  const basis = { fases: render.fases, frames: render.frames, heenIs: render.heenIs, tempo: AFSPEEL_TEMPO, woorden: render.woorden }
  const eenRep = maakHerhalingPlan({ ...basis, reps: 1 })
  const doel = doelVan({ soort: 'herhaling', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: eenRep.repDuur })
  return maakHerhalingPlan({ ...basis, reps: doel.soort === 'herhaling' ? doel.reps : 10 })
}

/**
 * Het tempo uit het schema als tekst bij het beeld: "3 sec omlaag, 1 sec
 * omhoog". Zonder (leesbaar) schematempo het tempo waarop het beeld speelt.
 * Bij vasthouden de doeltijd. `woord` vertaalt een fasewoord.
 */
export function schemaTempoUitleg(render: RenderTiming, set: SetVoorschrift, woord?: (w: string) => string): string {
  const plan = planVoor(render, set)
  if (plan.soort === 'vasthouden') return tempoUitleg(plan, woord)
  const tempo = leesSchemaTempo(set.tempo) ?? AFSPEEL_TEMPO
  const voorschrift = maakHerhalingPlan({ fases: render.fases, frames: render.frames, heenIs: render.heenIs, tempo, woorden: render.woorden, reps: 1 })
  return tempoUitleg(voorschrift, woord)
}
