// ─── Club, rep-speler: van render en schemaregel naar een plan (PUUR) ───────
// Besluit Kane (03-11-2026): het beeld speelt in het uitvoeringstempo van de
// oefening (uitvoering.ts, bijvoorbeeld squat 2,5 sec omlaag, kort stil, 1 sec
// omhoog). Trage fasen vloeien tussen twee frames (tijdlijn.ts, meng), zodat
// het niet hapert. Het tempo uit het schema stuurt het beeld niet; het staat
// erbij als tekst en curve. De teller loopt gelijk met het beeld.

import { doelVan } from './doel'
import { AFSPEEL_TEMPO, leesSchemaTempo } from './tempo'
import { maakHerhalingPlan, maakVasthoudPlan, tempoUitleg } from './tijdlijn'
import type { Tempo, FaseWoorden, FrameFases, HeenIs, RenderSoort, RepPlan } from './typen'
import type { Uitvoering } from './uitvoering'

/** Wat de speler van een render moet weten (los van waar de beelden staan). */
export interface RenderTiming {
  frames: number
  fps: number
  fases: FrameFases
  heenIs: HeenIs
  soort: RenderSoort
  woorden?: FaseWoorden
  /**
   * Alleen bij een wisselende render (besluit Kane 30-10-2026): de fases van de
   * herhaling rechts; `fases` is dan de herhaling links. Elke kant telt als een
   * herhaling, in hetzelfde uitvoeringstempo.
   */
  fasesRechts?: FrameFases
  /** Uitvoeringstempo van deze oefening (uitvoering.ts); zonder: AFSPEEL_TEMPO. */
  uitvoering?: Pick<Uitvoering, 'tempo' | 'labels'> | null
}

/** Wat het schema voorschrijft voor een set. */
export interface SetVoorschrift {
  herhalingen: string | null | undefined
  tijdSec: number | null | undefined
  /** Alleen voor de tekst; het beeld speelt in het uitvoeringstempo. */
  tempo: string | null | undefined
}

/** Het tempo waarop het beeld speelt: dat van de oefening, anders de terugval. */
export function afspeelTempo(render: Pick<RenderTiming, 'uitvoering'>): Tempo {
  return render.uitvoering?.tempo ?? AFSPEEL_TEMPO
}

export function planVoor(render: RenderTiming, set: SetVoorschrift): RepPlan {
  if (render.soort === 'vasthouden') {
    const doel = doelVan({ soort: 'vasthouden', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: 0 })
    return maakVasthoudPlan({ frames: render.frames, fps: render.fps, doelSec: doel.soort === 'vasthouden' ? doel.sec : 30 })
  }
  const basis = { fases: render.fases, fasesRechts: render.fasesRechts, frames: render.frames, heenIs: render.heenIs, tempo: afspeelTempo(render), labels: render.uitvoering?.labels, woorden: render.woorden }
  const eenRep = maakHerhalingPlan({ ...basis, reps: 1 })
  const doel = doelVan({ soort: 'herhaling', herhalingen: set.herhalingen, tijdSec: set.tijdSec, repDuur: eenRep.repDuur })
  return maakHerhalingPlan({ ...basis, reps: doel.soort === 'herhaling' ? doel.reps : 10 })
}

/**
 * Het tempo uit het schema als tekst bij het beeld: "3 sec omlaag, 1 sec
 * omhoog". Zonder (leesbaar) schematempo het uitvoeringstempo van het beeld.
 * Bij vasthouden de doeltijd. `woord` vertaalt een fasewoord.
 */
export function schemaTempoUitleg(render: RenderTiming, set: SetVoorschrift, woord?: (w: string) => string): string {
  const plan = planVoor(render, set)
  if (plan.soort === 'vasthouden') return tempoUitleg(plan, woord)
  const schema = leesSchemaTempo(set.tempo)
  const tempo = schema ?? afspeelTempo(render)
  const labels = schema ? undefined : render.uitvoering?.labels
  const voorschrift = maakHerhalingPlan({ fases: render.fases, frames: render.frames, heenIs: render.heenIs, tempo, labels, woorden: render.woorden, reps: 1 })
  return tempoUitleg(voorschrift, woord)
}
