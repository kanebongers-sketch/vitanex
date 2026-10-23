// ─── Club startwizard: de stap Lessen opslaan (CLIENT) ──────────────────────
// Het plan uit lessen-plan.ts, een voor een via de gewone API's van Club
// (dezelfde controles als Instellingen). Bij de eerste fout stoppen we; wat al
// gelukt is staat dan in de teruggegeven rijen (een nieuw lestype of een
// nieuwe les heeft dan een id), zodat nog een keer opslaan niets dubbel maakt. Daarna komen de vaste lessen in het rooster voor
// de komende 6 weken, zodat leden meteen kunnen reserveren.

import { stuur } from '@/components/club/leden/stuur'
import { lesVelden, lessenPlan, typeVelden, type LesRij, type TypeRij } from '@/lib/club/start/lessen-plan'

const TYPEN = '/api/club/instellingen/lestypen'
const WEEK = '/api/club/instellingen/weekrooster'

export interface OpslaanStand {
  typen: TypeRij[]
  lessen: LesRij[]
  fout: string | null
  /** Hoeveel lessen er in het rooster kwamen (null = niet gedaan). */
  inRooster: number | null
}

function idUit(data: unknown): string | null {
  return typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string' ? data.id : null
}

function aantalUit(data: unknown): number {
  return typeof data === 'object' && data !== null && 'aangemaakt' in data && typeof data.aangemaakt === 'number' ? data.aangemaakt : 0
}

interface Invoer {
  vestiging: string
  vandaag: string
  typen: TypeRij[]
  lessen: LesRij[]
  basisTypen: readonly TypeRij[]
  basisLessen: readonly LesRij[]
  /** Voortgang voor op de knop, bijvoorbeeld "Lestype Intake". */
  bij: (tekst: string) => void
}

/** Alles opslaan; de rijen komen terug zoals ze nu in de database staan. */
export async function slaLessenOp({ vestiging, vandaag, typen: begin, lessen: beginLessen, basisTypen, basisLessen, bij }: Invoer): Promise<OpslaanStand> {
  const plan = lessenPlan(begin, beginLessen, basisTypen, basisLessen)
  let typen = begin
  let lessen = beginLessen
  const stop = (fout: string): OpslaanStand => ({ typen, lessen, fout, inRooster: null })
  const zetType = (sleutel: string, w: Partial<TypeRij>) => (typen = typen.map((t) => (t.sleutel === sleutel ? { ...t, ...w } : t)))
  const zetLes = (sleutel: string, w: Partial<LesRij>) => (lessen = lessen.map((l) => (l.sleutel === sleutel ? { ...l, ...w } : l)))

  for (const id of plan.lessenUit) {
    bij('Vaste les uitzetten')
    const uit = await stuur(`${WEEK}/${id}`, 'PATCH', { vestiging, actief: false })
    if (!uit.ok) return stop(uit.fout)
  }
  for (const id of plan.typenUit) {
    bij('Lestype uitzetten')
    const uit = await stuur(`${TYPEN}/${id}`, 'PATCH', { vestiging, actief: false })
    if (!uit.ok) return stop(uit.fout)
  }
  for (const w of plan.typenWijzig) {
    bij('Lestype aanpassen')
    const uit = await stuur(`${TYPEN}/${w.id}`, 'PATCH', { vestiging, ...w.velden })
    if (!uit.ok) return stop(uit.fout)
  }
  for (const t of plan.typenNieuw) {
    bij(`Lestype ${t.naam.trim()}`)
    const uit = await stuur(TYPEN, 'POST', { vestiging, ...typeVelden(t) })
    const id = uit.ok ? idUit(uit.data) : null
    if (!uit.ok || !id) return stop(uit.ok ? 'Het lestype is opgeslagen, maar kwam niet goed terug. Ververs de pagina.' : uit.fout)
    zetType(t.sleutel, { id })
  }
  for (const w of plan.lessenWijzig) {
    bij('Vaste les aanpassen')
    const uit = await stuur(`${WEEK}/${w.id}`, 'PATCH', { vestiging, ...w.velden })
    if (!uit.ok) return stop(uit.fout)
  }
  for (const l of plan.lessenNieuw) {
    const lestypeId = typen.find((t) => t.sleutel === l.typeSleutel)?.id
    if (!lestypeId) return stop('Een les hoort bij een lestype dat niet is opgeslagen.')
    bij('Vaste les toevoegen')
    const uit = await stuur(WEEK, 'POST', { vestiging, lestypeId, vanaf: vandaag, ...lesVelden(l) })
    const id = uit.ok ? idUit(uit.data) : null
    if (!uit.ok || !id) return stop(uit.ok ? 'De les is opgeslagen, maar kwam niet goed terug. Ververs de pagina.' : uit.fout)
    zetLes(l.sleutel, { id })
  }
  if (!lessen.some((l) => l.id && l.aan)) return { typen, lessen, fout: null, inRooster: null }
  bij('In het rooster zetten')
  const rooster = await stuur('/api/club/rooster/genereren', 'POST', { vestiging, weken: 6 })
  if (!rooster.ok) return stop(`Je lessen zijn opgeslagen, maar het rooster lukte niet: ${rooster.fout}`)
  return { typen, lessen, fout: null, inRooster: aantalUit(rooster.data) }
}
