// ─── Fit Factory Club, training: testbibliotheek voor voorstel en alternatieven ─
// Alleen voor tests. Een kleine maar complete bibliotheek met per
// bewegingspatroon machines, kabels en vrije gewichten, zoals in een club.

import type { Oefening } from './rijen'
import type { Spier } from './spieren'
import type { Materiaal, Niveau, Patroon, Spiergroep, Zone } from './typen'

let teller = 0
export function oef(naam: string, patroon: Patroon, spiergroep: Spiergroep, materiaal: Materiaal, niveau: Niveau = 1, belast: Zone[] = [], spieren: Spier[] = []): Oefening {
  teller += 1
  const id = `00000000-0000-4000-8000-${String(teller).padStart(12, '0')}`
  return { id, naam, spiergroep, spierenPrimair: spieren, spierenSecundair: [], materiaal, niveau, patroon, belast, uitleg: null, aandachtspunten: null, actief: true, beeld: null }
}

export const BIB: Oefening[] = [
  oef('Leg press', 'squat', 'benen', 'machine', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Goblet squat', 'squat', 'benen', 'dumbbell', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Back squat', 'squat', 'benen', 'barbell', 3, ['knie', 'rug'], ['quadriceps', 'bilspieren']),
  oef('Box squat lichaamsgewicht', 'squat', 'benen', 'geen', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Hip thrust', 'heupscharnier', 'billen', 'barbell', 2, [], ['bilspieren']),
  oef('Glute bridge', 'heupscharnier', 'billen', 'geen', 1, [], ['bilspieren']),
  oef('Roemeense deadlift', 'heupscharnier', 'benen', 'dumbbell', 2, ['rug'], ['hamstrings', 'bilspieren']),
  oef('Deadlift', 'heupscharnier', 'onderrug', 'barbell', 3, ['rug'], ['bilspieren', 'hamstrings', 'onderrug']),
  oef('Lunge', 'lunge', 'benen', 'dumbbell', 2, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Step-up', 'lunge', 'benen', 'bank', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Chest press machine', 'duwen_horizontaal', 'borst', 'machine', 1, ['schouder'], ['borstspieren']),
  oef('Push-up', 'duwen_horizontaal', 'borst', 'geen', 1, ['schouder', 'pols'], ['borstspieren', 'triceps']),
  oef('Bankdrukken', 'duwen_horizontaal', 'borst', 'barbell', 2, ['schouder'], ['borstspieren', 'triceps']),
  oef('Dumbbell press', 'duwen_horizontaal', 'borst', 'dumbbell', 2, ['schouder'], ['borstspieren']),
  oef('Band chest press', 'duwen_horizontaal', 'borst', 'band', 1, [], ['borstspieren']),
  oef('Shoulder press machine', 'duwen_verticaal', 'schouders', 'machine', 1, ['schouder'], ['voorste_schouder']),
  oef('Dumbbell shoulder press', 'duwen_verticaal', 'schouders', 'dumbbell', 2, ['schouder'], ['voorste_schouder', 'triceps']),
  oef('Lat pulldown', 'trekken_verticaal', 'rug', 'kabel', 1, ['schouder'], ['latissimus']),
  oef('Pull-up', 'trekken_verticaal', 'rug', 'geen', 3, ['schouder'], ['latissimus', 'biceps']),
  oef('Band pulldown', 'trekken_verticaal', 'rug', 'band', 1, [], ['latissimus']),
  oef('Seated row', 'trekken_horizontaal', 'rug', 'kabel', 1, [], ['rhomboideus', 'latissimus']),
  oef('Dumbbell row', 'trekken_horizontaal', 'rug', 'dumbbell', 1, [], ['latissimus', 'rhomboideus']),
  oef('Band row', 'trekken_horizontaal', 'rug', 'band', 1, [], ['rhomboideus']),
  oef('Biceps curl', 'isolatie', 'biceps', 'dumbbell', 1, [], ['biceps']),
  oef('Kabel curl', 'isolatie', 'biceps', 'kabel', 1, [], ['biceps']),
  oef('Triceps pushdown', 'isolatie', 'triceps', 'kabel', 1, ['elleboog'], ['triceps']),
  oef('Lateral raise', 'isolatie', 'schouders', 'dumbbell', 1, ['schouder'], ['middelste_schouder']),
  oef('Face pull', 'isolatie', 'schouders', 'kabel', 1, [], ['achterste_schouder', 'rhomboideus']),
  oef('Leg extension', 'isolatie', 'benen', 'machine', 1, ['knie'], ['quadriceps']),
  oef('Leg curl', 'isolatie', 'benen', 'machine', 1, [], ['hamstrings']),
  oef('Calf raise', 'isolatie', 'kuiten', 'machine', 1, [], ['kuiten']),
  oef('Hip abduction', 'isolatie', 'billen', 'machine', 1, [], ['abductoren', 'bilspieren']),
  oef('Plank', 'core', 'buik', 'geen', 1, [], ['diepe_buikspier']),
  oef('Dead bug', 'core', 'buik', 'geen', 1, [], ['diepe_buikspier', 'rechte_buikspier']),
  oef('Squat jump', 'explosief', 'benen', 'geen', 2, ['knie', 'enkel'], ['quadriceps', 'bilspieren']),
  oef('Medicine ball slam', 'explosief', 'hele_lichaam', 'overig', 2, ['schouder'], ['latissimus']),
  oef('Roeiergometer', 'cardio', 'cardio', 'cardio_apparaat', 1, [], ['hart_longen']),
  oef('Crosstrainer', 'cardio', 'cardio', 'cardio_apparaat', 1, [], ['hart_longen']),
  oef('Touwtjespringen', 'cardio', 'cardio', 'geen', 2, ['enkel'], ['hart_longen']),
]

export const PER_ID = new Map(BIB.map((o) => [o.id, o]))
export const OP_NAAM = new Map(BIB.map((o) => [o.naam, o]))

export function bibOef(naam: string): Oefening {
  const o = OP_NAAM.get(naam)
  if (!o) throw new Error(`Onbekende testoefening ${naam}`)
  return o
}
