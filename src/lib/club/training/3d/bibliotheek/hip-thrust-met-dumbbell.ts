// 3D-oefening: Hip thrust met dumbbell. Naam exact zoals in de oefenbibliotheek.
// Zelfde beweging als de hip thrust met barbell: onderkant van de
// schouderbladen op de rand van een dwarse bank, voeten plat op heupbreedte,
// schenen bovenin verticaal, kin naar de borst. Heupen omhoog tot het lichaam
// recht is van knie tot schouder, een tel vasthouden met de billen aan en
// rustig zakken tot de billen net boven de grond zijn. De dumbbell ligt dwars in
// de plooi van de heupen, de koppen rusten op de dijen; beide handen houden de
// greep vast met de ellebogen naar buiten.

import { heupstrek } from '../bouw/benen'
import { metMoment } from '../bouw/basis'
import type { Oefening3d, Sleutel } from '../typen'

const RUW = heupstrek({ naam: 'Hip thrust met dumbbell', steun: 'bank', last: 'stang' })

/** Dumbbell in de heupplooi (frame van het bekken): handvat net boven de dijen. */
const HALTER = { lastY: -0.01, lastZ: 0.165, greep: 0.045 } as const

/** Tempo volgens de coaching: 1 tel omhoog, 1 tel vasthouden, 2 tellen omlaag. */
const TIJDEN: readonly Pick<Sleutel, 'vast' | 'naarVolgende'>[] = [
  { vast: 0.5, naarVolgende: 0.5 },
  { vast: 0, naarVolgende: 0.5 },
  { vast: 1.0, naarVolgende: 1.0 },
  { vast: 0, naarVolgende: 1.0 },
]

export const HIP_THRUST_DUMBBELL: Oefening3d = metMoment({
  ...RUW,
  materiaal: [...RUW.materiaal.filter((m) => m.soort !== 'stang'), { soort: 'halterDwars' }],
  elleboogRichting: { x: 0.85, y: 0.45, z: -0.25 },
  sleutels: RUW.sleutels.map((s, i) => ({ ...s, ...TIJDEN[i % TIJDEN.length], houding: { ...s.houding, ...HALTER } })),
})
