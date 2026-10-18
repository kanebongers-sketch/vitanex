// ─── Fit Factory Club, illustraties: hip thrust, plank en lateral raise ─────
// Zie coaching/romp-billen.ts, buik.ts en schouders-cardio.ts.

import type { Oefening, VoorHouding } from '../typen'
import { aan, arm, armNaar, been, beenNaar, wereld, zij } from './hulp'

// ── Hip thrust ──────────────────────────────────────────────────────────────
// Bovenrug (onderkant schouderbladen) op de rand van een bank, voeten plat.
// Bovenin: romp horizontaal, scheenbenen verticaal, kin naar de borst.

const HT_BANK = { id: 'bank', soort: 'bank' as const, plek: { wereld: { x: -60, y: -42 } }, maat: { lengte: 118 } }
const HT_STANG = { id: 'stang', soort: 'barbell' as const, plek: { aan: 'bekken' as const, langs: 1.5, dwars: 12.6 }, maat: { glas: 1 } }
const HT_VOETEN = beenNaar(wereld(84, -7.5), -1, 90)

export const HIP_THRUST: Oefening = {
  naam: 'Hip thrust met barbell',
  repdb: 'hip-thrust',
  heen: 'concentrisch',
  spieren: { primair: ['bilspieren'], secundair: ['hamstrings', 'quadriceps'] },
  plaatSchuif: { x: 5, y: -3 },
  toont: [
    'Bank onder de schouderbladen, de bovenrug draait om de rand',
    'Stang in de heupplooi, handen houden hem op zijn plek',
    'Bovenin: romp horizontaal en scheenbenen verticaal',
    'Kin naar de borst, blik mee naar voren',
  ],
  begin: zij({
    anker: { punt: 'heup', op: { x: 38, y: -24 } },
    bekken: -46,
    hoofd: 28,
    armNabij: armNaar(aan('stang'), 1, [0.82, 0.86]),
    beenNabij: HT_VOETEN,
    materiaal: [HT_BANK, HT_STANG],
  }),
  eind: zij({
    anker: { punt: 'heup', op: { x: 40, y: -55 } },
    bekken: -90,
    hoofd: 36,
    armNabij: armNaar(aan('stang'), 1, [0.82, 0.86]),
    beenNabij: HT_VOETEN,
    materiaal: [HT_BANK, HT_STANG],
  }),
}

// ── Plank ───────────────────────────────────────────────────────────────────
// Op de onderarmen, ellebogen recht onder de schouders. Begin: knieen op de
// grond (de opbouw); eind: knieen los, een rechte lijn van hoofd tot hielen.

const ELLEBOOG = { punt: 'elleboogNabij' as const, op: { x: 40, y: -4.6 } }

export const PLANK: Oefening = {
  naam: 'Plank',
  repdb: 'plank',
  heen: 'concentrisch',
  spieren: { primair: ['rechte_buikspier', 'diepe_buikspier'], secundair: ['schuine_buikspieren', 'bilspieren', 'voorste_schouder', 'quadriceps'] },
  toont: [
    'Ellebogen recht onder de schouders, onderarmen plat',
    'Een rechte lijn van hoofd tot hielen: geen hangende heupen, geen billen omhoog',
    'Buik en billen aangespannen, de grond wegduwen',
  ],
  begin: zij({
    anker: ELLEBOOG,
    bekken: 73,
    hoofd: 2,
    armNabij: arm(180, 90),
    beenNabij: been(253, 17, 252),
    materiaal: [],
  }),
  eind: zij({
    anker: ELLEBOOG,
    bekken: 84.8,
    hoofd: 2,
    armNabij: arm(180, 90),
    beenNabij: been(264.8, 0, 168),
    materiaal: [],
  }),
}

// ── Lateral raise (vooraanzicht) ────────────────────────────────────────────
// Rechtop, armen zijwaarts tot schouderhoogte met een lichte buiging in de
// elleboog; de ellebogen leiden (handen niet hoger dan de ellebogen).

const LR_DB = [
  { id: 'db-r', soort: 'dumbbell' as const, plek: { aan: 'handNabij' as const }, maat: { eind: 1, kop: 11, schuif: 2.6 } },
  { id: 'db-l', soort: 'dumbbell' as const, plek: { aan: 'handVer' as const }, maat: { eind: 1, kop: 11, schuif: 2.6 } },
]

function lr(armSpreiding: number, elleboog: number): VoorHouding {
  return { aanzicht: 'voor', heup: { x: 0, y: -95 }, armSpreiding, elleboog, beenSpreiding: 5, knie: 6, materiaal: LR_DB }
}

export const LATERAL_RAISE: Oefening = {
  naam: 'Lateral raise',
  repdb: 'lateral-raise',
  heen: 'concentrisch',
  spieren: { primair: ['middelste_schouder'], secundair: ['trapezius'] },
  toont: [
    'Vooraanzicht: zo zie je de zijwaartse beweging het best',
    'Tot schouderhoogte, niet hoger',
    'Ellebogen leiden: lichte buiging, handen niet boven de ellebogen',
    'Schouders laag, niet zwaaien met de romp',
  ],
  begin: lr(9, 12),
  eind: lr(86, 14),
}
