// ─── Club, rep-speler: van render en schemaregel naar een plan (PUUR) ───────

import { doelVan } from './doel'
import { leesRepTempo } from './tempo'
import { maakHerhalingPlan, maakVasthoudPlan } from './tijdlijn'
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
  tempo: string | null | undefined
}

export function planVoor(render: RenderTiming, set: SetVoorschrift): RepPlan {
  if (render.soort === 'vasthouden') {
    const doel = doelVan({ soort: 'vasthouden', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: 0 })
    return maakVasthoudPlan({ frames: render.frames, fps: render.fps, doelSec: doel.soort === 'vasthouden' ? doel.sec : 30 })
  }
  const basis = { fases: render.fases, frames: render.frames, heenIs: render.heenIs, tempo: leesRepTempo(set.tempo), woorden: render.woorden }
  const eenRep = maakHerhalingPlan({ ...basis, reps: 1 })
  const doel = doelVan({ soort: 'herhaling', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: eenRep.repDuur })
  return maakHerhalingPlan({ ...basis, reps: doel.soort === 'herhaling' ? doel.reps : 10 })
}
