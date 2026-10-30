// ─── Club, training: de Blender-oefeningen als testbibliotheek ──────────────
// Alleen voor tests. De kenmerken zoals in club_oefeningen (gelezen 28-10-2026,
// golf 1 op 29-10-2026, nagekeken 30-10-2026): patroon, spiergroep, materiaal,
// niveau, belasting en primaire spieren. blender-bibliotheek.test.ts bewaakt
// dat dit precies de renderlijst is.

import type { Oefening } from './rijen'
import { oef } from './voorstel-test-bib'

export const BLENDER_BIB: readonly Oefening[] = [
  oef('Back squat', 'squat', 'benen', 'barbell', 3, ['knie', 'rug'], ['quadriceps', 'bilspieren']),
  oef('Front squat', 'squat', 'benen', 'barbell', 3, ['knie', 'pols'], ['quadriceps', 'bilspieren']),
  oef('Deadlift', 'heupscharnier', 'benen', 'barbell', 3, ['rug', 'knie'], ['bilspieren', 'hamstrings', 'onderrug']),
  oef('Glute bridge', 'heupscharnier', 'billen', 'geen', 1, [], ['bilspieren']),
  oef('Lunge met barbell', 'lunge', 'benen', 'barbell', 3, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Overhead press', 'duwen_verticaal', 'schouders', 'barbell', 3, ['schouder', 'rug'], ['voorste_schouder']),
  oef('Push-up', 'duwen_horizontaal', 'borst', 'geen', 1, ['schouder', 'pols'], ['borstspieren']),
  oef('Barbell row', 'trekken_horizontaal', 'rug', 'barbell', 2, ['rug'], ['latissimus', 'rhomboideus']),
  oef('Barbell curl', 'isolatie', 'biceps', 'barbell', 2, ['elleboog', 'pols'], ['biceps']),
  oef('Plank', 'core', 'buik', 'geen', 1, [], ['rechte_buikspier', 'diepe_buikspier']),
  // Golf 1 (29-10-2026), kenmerken gelezen uit club_oefeningen.
  oef('Push-up op knieën', 'duwen_horizontaal', 'borst', 'geen', 1, ['schouder', 'pols'], ['borstspieren']),
  oef('Push-up met smalle handen', 'duwen_horizontaal', 'triceps', 'geen', 2, ['schouder', 'pols'], ['triceps']),
  oef('Glute bridge op een been', 'heupscharnier', 'billen', 'geen', 2, [], ['bilspieren']),
  oef('Zijplank', 'core', 'buik', 'geen', 1, ['schouder'], ['schuine_buikspieren']),
  oef('Superman', 'isolatie', 'onderrug', 'geen', 1, ['rug'], ['onderrug']),
  oef('Roemeense deadlift met barbell', 'heupscharnier', 'benen', 'barbell', 2, ['rug'], ['hamstrings', 'bilspieren']),
  oef('Sumo deadlift', 'heupscharnier', 'benen', 'barbell', 3, ['rug', 'heup'], ['bilspieren', 'quadriceps', 'adductoren']),
  oef('Good morning', 'heupscharnier', 'onderrug', 'barbell', 3, ['rug'], ['onderrug', 'hamstrings']),
  oef('Barbell row met onderhandse greep', 'trekken_horizontaal', 'rug', 'barbell', 2, ['rug', 'elleboog'], ['latissimus', 'rhomboideus']),
  oef('Schouders ophalen met barbell', 'isolatie', 'schouders', 'barbell', 1, ['nek'], ['trapezius']),
  oef('Thruster met barbell', 'squat', 'hele_lichaam', 'barbell', 3, ['knie', 'schouder', 'pols'], ['quadriceps', 'bilspieren', 'voorste_schouder']),
  oef('Squat met lichaamsgewicht', 'squat', 'benen', 'geen', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Achterwaartse lunge', 'lunge', 'benen', 'geen', 1, ['knie'], ['bilspieren', 'quadriceps']),
  oef('Split squat', 'lunge', 'benen', 'geen', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Walking lunge met lichaamsgewicht', 'lunge', 'benen', 'geen', 1, ['knie'], ['quadriceps', 'bilspieren']),
  oef('Zijwaartse lunge', 'lunge', 'benen', 'geen', 2, ['knie', 'heup'], ['quadriceps', 'bilspieren', 'adductoren']),
  oef('Calf raise met lichaamsgewicht', 'isolatie', 'kuiten', 'geen', 1, ['enkel'], ['kuiten']),
  oef('Pike push-up', 'duwen_verticaal', 'schouders', 'geen', 2, ['schouder', 'pols'], ['voorste_schouder']),
  oef('Mountain climber', 'explosief', 'buik', 'geen', 2, ['pols', 'schouder'], ['rechte_buikspier', 'heupbuigers']),
  oef('Bird dog', 'core', 'onderrug', 'geen', 1, [], ['onderrug', 'diepe_buikspier']),
  oef('Squat jump', 'explosief', 'benen', 'geen', 2, ['knie', 'enkel'], ['quadriceps', 'bilspieren']),
  oef('Burpee', 'explosief', 'hele_lichaam', 'geen', 2, ['knie', 'pols', 'schouder'], ['hart_longen', 'quadriceps', 'bilspieren']),
  // Golf 1A, buik (29-10-2026).
  oef('Crunch', 'core', 'buik', 'geen', 1, ['nek'], ['rechte_buikspier']),
  oef('Reverse crunch', 'core', 'buik', 'geen', 1, [], ['rechte_buikspier']),
  oef('Leg raise liggend', 'core', 'buik', 'geen', 2, ['rug'], ['rechte_buikspier', 'heupbuigers']),
  oef('Hollow hold', 'core', 'buik', 'geen', 2, ['rug'], ['rechte_buikspier', 'diepe_buikspier']),
  oef('Dead bug', 'core', 'buik', 'geen', 1, [], ['diepe_buikspier', 'rechte_buikspier']),
  oef('Crunch met draai', 'core', 'buik', 'geen', 1, ['nek'], ['schuine_buikspieren']),
  oef('Fietsende crunch', 'core', 'buik', 'geen', 2, ['nek'], ['schuine_buikspieren', 'rechte_buikspier']),
  oef('Russian twist', 'core', 'buik', 'geen', 2, ['rug'], ['schuine_buikspieren']),
]
