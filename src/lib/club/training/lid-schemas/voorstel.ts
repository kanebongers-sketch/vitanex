// ─── Club, training: het startvoorstel voor een lid (PUUR) ──────────────────
// De snelle start in de ledenapp (doel, dagen, materiaal, niveau) gaat door
// dezelfde vaste regels als het voorstel van de trainer (voorstel.ts en
// voorstel-regels.ts). Alleen kiesbare oefeningen met een eigen Blender-render
// en coaching. Er wordt niets opgeslagen: het lid past het voorstel eerst aan.

import { isBlenderOefening } from '../blender-bibliotheek'
import { GEEN_EXTRA, type RegelInvoer } from '../invoer'
import type { Oefening } from '../rijen'
import { stelSchemaVoor, type VoorstelOpties } from '../voorstel'
import type { Doel, Niveau } from '../typen'
import { MATERIAAL_BIJ, type SnelleStart } from './regels'

/** Minuten per training: een uur in de sportschool, korter met minder materiaal. */
const MINUTEN = { thuis: 40, dumbbells: 50, gym: 60 } as const

/** Mag een lid deze oefening kiezen? Actief, niet gearchiveerd en met een eigen Blender-render. */
export function kiesbaarVoorLid(o: Oefening): boolean {
  return o.actief && isBlenderOefening(o.naam)
}

export interface LidVoorstel {
  doel: Doel
  niveau: Niveau
  /** De titels zoals het voorstel ze geeft (Nederlands); de ledenapp vertaalt ze. */
  dagTitels: string[]
  regels: RegelInvoer[]
}

/** Het voorstel; null als er voor deze keuze geen passende oefening is. */
export function lidVoorstel(keuze: SnelleStart, oefeningen: readonly Oefening[], opties: VoorstelOpties = {}): LidVoorstel | null {
  const materiaal = MATERIAAL_BIJ[keuze.materiaal]
  const kandidaten = oefeningen.filter((o) => kiesbaarVoorLid(o) && materiaal.includes(o.materiaal))
  const v = stelSchemaVoor(
    { doelen: [keuze.doel], niveau: keuze.niveau, dagenPerWeek: keuze.dagen, minutenPerSessie: MINUTEN[keuze.materiaal], voorkeuren: ['sportschool'], gezondheid: null },
    kandidaten,
    opties,
  )
  const dagen = v.dagen.filter((d) => d.regels.length > 0)
  if (dagen.length === 0) return null
  return {
    doel: v.doel,
    niveau: v.niveau,
    dagTitels: dagen.map((d) => d.titel),
    regels: dagen.flatMap((d, i) =>
      d.regels.map((r) => ({ dag: i + 1, oefeningId: r.oefeningId, sets: r.sets, herhalingen: r.herhalingen, gewichtKg: null, rustSec: r.rustSec, notitie: null, ...GEEN_EXTRA, rir: r.rir })),
    ),
  }
}
