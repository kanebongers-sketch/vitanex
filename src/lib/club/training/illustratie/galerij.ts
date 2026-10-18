// ─── Fit Factory Club, illustraties: het materiaal los bekeken (PUUR) ───────
// Elk stuk materiaal op zichzelf, voor de vergelijkpagina: zo is te zien dat
// alle onderdelen dezelfde stijl hebben.

import { opVolgorde, voegSamen, type Laag } from './laag'
import { materiaalLagen, PLAAT_SCHUIF, type MateriaalStand } from './materiaal'
import { kaderRond, type Kader } from './scene'
import type { MateriaalSoort } from './typen'
import { v } from './vec'
import { ellips } from './vorm'

export interface Voorbeeld {
  readonly naam: string
  readonly lagen: readonly Laag[]
  readonly kader: Kader
}

function stand(soort: MateriaalSoort, x: number, y: number, extra: Partial<MateriaalStand> = {}): MateriaalStand {
  return { id: soort, soort, pos: v(x, y), hoek: 90, maat: {}, ...extra }
}

const STUKKEN: readonly { naam: string; stukken: readonly MateriaalStand[] }[] = [
  { naam: 'Barbell met schijven', stukken: [stand('barbell', 0, -22.5)] },
  { naam: 'Dumbbell', stukken: [stand('dumbbell', 0, -6)] },
  { naam: 'Kettlebell', stukken: [stand('kettlebell', 0, -26, { hoek: 0 })] },
  { naam: 'Platte bank', stukken: [stand('bank', 0, -44, { maat: { lengte: 118 } })] },
  { naam: 'Schuine bank', stukken: [stand('schuineBank', 0, -46, { maat: { leuning: 60 } })] },
  { naam: 'Rek', stukken: [stand('rek', 0, 0)] },
  { naam: 'Kabel met katrol', stukken: [stand('kabelkolom', 0, 0, { maat: { katrol: 110 } }), stand('handvat', -40, -100, { kabelVan: v(-9, -110) })] },
  { naam: 'Leg press', stukken: [stand('legPress', 0, -48, { maat: { slede: 60 } })] },
  { naam: 'Lat pulldown', stukken: [stand('latPulldown', 0, -47, { maat: { toren: 52, padX: 26, padY: -21 }, kabelVan: v(-9, -214) }), stand('latstang', -9, -150, { kabelVan: v(-9, -214) })] },
  { naam: 'Seated row', stukken: [stand('seatedRow', 0, -39, { maat: { voetX: 88, voetY: -2 } }), stand('handvat', 40, -60, { kabelVan: v(98, -14) })] },
]

export function materiaalVoorbeelden(): Voorbeeld[] {
  const ctx = { aanzicht: 'zij' as const, plaatSchuif: v(PLAAT_SCHUIF, 0) }
  return STUKKEN.map(({ naam, stukken }) => {
    const delen = stukken.map((s) => materiaalLagen(s, ctx))
    const xs = stukken.map((s) => s.pos.x)
    const vloer: Laag = { sleutel: 'vloer', d: ellips(v((Math.min(...xs) + Math.max(...xs)) / 2, -0.6), 30, 2.4), kleur: 'vloer' }
    const lagen = opVolgorde(voegSamen({ achter: [vloer] }, ...delen))
    return { naam, lagen, kader: kaderRond([lagen], 0.1) }
  })
}
