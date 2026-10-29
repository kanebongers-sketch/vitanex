// ─── Club, rep-speler: de tijdlijn van een set (PUUR) ───────────────────────
// Van een tempo en de fases van een render naar "welk beeld staat er op
// seconde t". De speler geeft hier altijd AFSPEEL_TEMPO aan (1 seconde heen,
// 1 terug, besluit Kane 29-10-2026); een schematempo alleen voor de tekst. Een herhaling is een reeks segmenten (heen, vast,
// terug, rust); welke tempo-seconden bij de heenweg horen hangt af van de
// render: bij een squat is de heenweg het zakken (excentrisch), bij een curl het
// optillen (concentrisch). De frames binnen een segment lopen lineair mee: de
// natuurlijke versnelling zit al in de render zelf.
// Een houdoefening (plank) heeft geen herhalingen maar een doeltijd; de render
// speelt dan als rustige lus op zijn eigen snelheid.

import { secTekst } from './tempo'
import type { FaseWoorden, FrameBereik, FrameFases, HeenIs, HerhalingPlan, RepPlan, Segment, Stand, Tempo, VasthoudPlan } from './typen'

export function standaardWoorden(heenIs: HeenIs): FaseWoorden {
  return heenIs === 'excentrisch' ? { heen: 'omlaag', terug: 'omhoog', vast: 'vast' } : { heen: 'omhoog', terug: 'omlaag', vast: 'vast' }
}

function klem(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Een bereik binnen 0 tot frames - 1, ook als de data niet klopt. */
export function binnen(bereik: FrameBereik, frames: number): FrameBereik {
  const max = Math.max(0, frames - 1)
  const a = klem(Math.round(Number.isFinite(bereik[0]) ? bereik[0] : 0), 0, max)
  const b = klem(Math.round(Number.isFinite(bereik[1]) ? bereik[1] : a), 0, max)
  return [a, b]
}

export interface HerhalingInvoer {
  fases: FrameFases
  frames: number
  heenIs: HeenIs
  tempo: Tempo
  reps: number
  woorden?: FaseWoorden
}

export function maakHerhalingPlan(inv: HerhalingInvoer): HerhalingPlan {
  const frames = Math.max(1, Math.floor(inv.frames))
  const w = inv.woorden ?? standaardWoorden(inv.heenIs)
  const exc = inv.heenIs === 'excentrisch'
  const t = inv.tempo
  const kandidaten: Segment[] = [
    { soort: 'heen', label: w.heen, duur: exc ? t.excentrisch : t.concentrisch, frames: binnen(inv.fases.heen, frames) },
    { soort: 'houden', label: w.vast, duur: exc ? t.pauzeGerekt : t.pauzeSamen, frames: binnen(inv.fases.houden_ver, frames) },
    { soort: 'terug', label: w.terug, duur: exc ? t.concentrisch : t.excentrisch, frames: binnen(inv.fases.terug, frames) },
    { soort: 'rust', label: w.vast, duur: exc ? t.pauzeSamen : t.pauzeGerekt, frames: binnen(inv.fases.rust_eind, frames) },
  ]
  const segmenten = kandidaten.filter((s) => Number.isFinite(s.duur) && s.duur > 0)
  const repDuur = segmenten.reduce((som, s) => som + s.duur, 0)
  const reps = Math.max(1, Math.floor(Number.isFinite(inv.reps) ? inv.reps : 1))
  return { soort: 'herhaling', reps, segmenten, repDuur, totaal: reps * repDuur, frames }
}

export interface VasthoudInvoer {
  frames: number
  fps: number
  doelSec: number
  label?: string
}

export function maakVasthoudPlan(inv: VasthoudInvoer): VasthoudPlan {
  const frames = Math.max(1, Math.floor(inv.frames))
  const doelSec = Math.max(1, Number.isFinite(inv.doelSec) ? inv.doelSec : 30)
  return { soort: 'vasthouden', doelSec, totaal: doelSec, frames, fps: inv.fps > 0 ? inv.fps : 24, lus: [0, frames - 1], label: inv.label ?? 'vasthouden' }
}

function frameIn(bereik: FrameBereik, deel: number): number {
  return Math.round(bereik[0] + (bereik[1] - bereik[0]) * klem(deel, 0, 1))
}

function herhalingStand(plan: HerhalingPlan, t: number): Stand {
  const laatste = plan.segmenten[plan.segmenten.length - 1]
  if (!laatste || plan.repDuur <= 0) {
    return { frame: 0, rep: plan.reps, gedaan: plan.reps, label: '', segment: 'rust', segmentIndex: 0, deel: 1, voortgang: 1, over: 0, klaar: true }
  }
  if (t >= plan.totaal) {
    const i = plan.segmenten.length - 1
    return { frame: laatste.frames[1], rep: plan.reps, gedaan: plan.reps, label: laatste.label, segment: laatste.soort, segmentIndex: i, deel: 1, voortgang: 1, over: 0, klaar: true }
  }
  const tijd = Math.max(0, t)
  const repIndex = Math.min(plan.reps - 1, Math.floor(tijd / plan.repDuur))
  const binnenRep = tijd - repIndex * plan.repDuur
  let begin = 0
  let index = 0
  while (index < plan.segmenten.length - 1 && binnenRep >= begin + plan.segmenten[index].duur) {
    begin += plan.segmenten[index].duur
    index += 1
  }
  const seg = plan.segmenten[index]
  const deel = klem((binnenRep - begin) / seg.duur, 0, 1)
  return {
    frame: klem(frameIn(seg.frames, deel), 0, plan.frames - 1),
    rep: repIndex + 1,
    gedaan: repIndex,
    label: seg.label,
    segment: seg.soort,
    segmentIndex: index,
    deel,
    voortgang: klem(binnenRep / plan.repDuur, 0, 1),
    over: Math.max(0, plan.totaal - tijd),
    klaar: false,
  }
}

function vasthoudStand(plan: VasthoudPlan, t: number): Stand {
  const tijd = klem(t, 0, plan.totaal)
  const klaar = t >= plan.totaal
  const lengte = plan.lus[1] - plan.lus[0] + 1
  const frame = plan.lus[0] + (Math.floor(tijd * plan.fps) % lengte)
  return {
    frame: klem(frame, 0, plan.frames - 1),
    rep: 1,
    gedaan: klaar ? 1 : 0,
    label: plan.label,
    segment: 'houden',
    segmentIndex: 0,
    deel: 0,
    voortgang: klem(tijd / plan.totaal, 0, 1),
    over: Math.max(0, plan.totaal - tijd),
    klaar,
  }
}

/** Wat er op seconde t (speeltijd, niet kloktijd) in beeld staat. */
export function standOp(plan: RepPlan, t: number): Stand {
  const tijd = Number.isFinite(t) ? t : 0
  return plan.soort === 'herhaling' ? herhalingStand(plan, tijd) : vasthoudStand(plan, tijd)
}

/** "2 sec omlaag, 1 sec vast, 2 sec omhoog" of "30 sec vasthouden". `woord` vertaalt een fasewoord (standaard: zoals het is). */
export function tempoUitleg(plan: RepPlan, woord: (w: string) => string = (w) => w): string {
  if (plan.soort === 'vasthouden') return `${Math.round(plan.doelSec)} sec ${woord(plan.label)}`
  return plan.segmenten.map((s) => `${secTekst(s.duur)} ${woord(s.label)}`).join(', ')
}

/** Ligt het verste punt (piek) in beeld? Voor de stilstaande beelden bij minder beweging. */
export function opPiek(stand: Pick<Stand, 'segment' | 'deel'>): boolean {
  if (stand.segment === 'houden') return true
  if (stand.segment === 'heen') return stand.deel >= 0.5
  if (stand.segment === 'terug') return stand.deel < 0.5
  return false
}
