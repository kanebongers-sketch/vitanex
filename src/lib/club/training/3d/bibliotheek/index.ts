// ─── Fit Factory Club, 3D-oefenbeelden: bibliotheek via bouwstenen (PUUR) ───
// Elke oefening staat in een eigen bestand in deze map: een paar regels data op
// een bouwsteen per bewegingspatroon (../bouw). De naam is exact de naam in de
// oefenbibliotheek (beelden-repdb.ts en de coaching); de test controleert dat.
//
// Een nieuwe oefening toevoegen:
// 1. kies het patroon: squat, hinge, swing, lunge, heupstrek, legPress,
//    beenMachine, calfRaise (../bouw/benen), vloertrek voor deadlifts vanaf de
//    vloer (../bouw/vloertrek), armOefening voor drukken, trekken,
//    curl, extensie en raise (../bouw/boven), plank of crunch (../bouw/core);
// 2. maak een bestand <naam>.ts met de naam en de paar getallen die anders zijn
//    dan de standaard (kopieer de dichtstbijzijnde oefening);
// 3. zet hem hieronder in BIBLIOTHEEK_3D en draai de test (grenzen, voeten,
//    handen, vloer, lus, naam in de bibliotheek).

import { BACK_SQUAT_3D } from './back-squat'
import { BANKDRUKKEN_3D } from './bankdrukken-met-barbell'
import { DEADLIFT_3D } from './deadlift'
import { LAT_PULLDOWN_3D } from './lat-pulldown'
import { PUSH_UP_3D } from './push-up'
import { SCHOUDERDRUKKEN_3D } from './dumbbell-shoulder-press'
import { GOBLET_SQUAT } from './goblet-squat'
import { SQUAT_LICHAAMSGEWICHT } from './squat-met-lichaamsgewicht'
import { SQUAT_DUMBBELLS } from './squat-met-dumbbells'
import { RDL_BARBELL } from './roemeense-deadlift-met-barbell'
import { RDL_DUMBBELLS } from './roemeense-deadlift-met-dumbbells'
import { KETTLEBELL_SWING } from './kettlebell-swing'
import { GOOD_MORNING } from './good-morning'
import { TRAP_BAR_DEADLIFT } from './trap-bar-deadlift'
import { SUMO_DEADLIFT } from './sumo-deadlift'
import { DEADLIFT_KETTLEBELL } from './deadlift-met-kettlebell'
import { LUNGE_DUMBBELLS } from './lunge-met-dumbbells'
import { ACHTERWAARTSE_LUNGE_DB } from './achterwaartse-lunge-met-dumbbells'
import { SPLIT_SQUAT_DB } from './split-squat-met-dumbbells'
import { HIP_THRUST } from './hip-thrust-met-barbell'
import { GLUTE_BRIDGE } from './glute-bridge'
import { HIP_THRUST_DUMBBELL } from './hip-thrust-met-dumbbell'
import { GLUTE_BRIDGE_EEN_BEEN } from './glute-bridge-op-een-been'
import { LEG_PRESS } from './leg-press'
import { LEG_EXTENSION } from './leg-extension'
import { LEG_CURL_ZITTEND } from './leg-curl-zittend'
import { CALF_RAISE } from './calf-raise-staand'
import { DUMBBELL_BANKDRUKKEN } from './dumbbell-bankdrukken'
import { SCHUIN_BANKDRUKKEN_DB } from './schuin-bankdrukken-met-dumbbells'
import { CHEST_PRESS_MACHINE } from './chest-press-machine'
import { OVERHEAD_PRESS } from './overhead-press'
import { ROW_DUMBBELLS } from './voorovergebogen-row-met-dumbbells'
import { BARBELL_ROW } from './barbell-row'
import { SEATED_CABLE_ROW } from './seated-cable-row'
import { FACE_PULL } from './face-pull'
import { LAT_PULLDOWN_ONDERHANDS } from './lat-pulldown-met-onderhandse-greep'
import { DUMBBELL_CURL } from './dumbbell-curl'
import { HAMMER_CURL } from './hammer-curl'
import { BARBELL_CURL } from './barbell-curl'
import { TRICEPS_PUSHDOWN } from './triceps-pushdown'
import { OVERHEAD_EXTENSION } from './triceps-extension-boven-het-hoofd'
import { LATERAL_RAISE } from './lateral-raise'
import { FRONT_RAISE } from './front-raise-met-dumbbells'
import { PLANK } from './plank'
import { CRUNCH } from './crunch'
import type { Oefening3d } from '../typen'

/** De zes oefeningen van het eerste prototype (met de hand afgesteld, eigen houdingen). */
export const PROTOTYPE_3D: readonly Oefening3d[] = [
  BACK_SQUAT_3D,
  BANKDRUKKEN_3D,
  DEADLIFT_3D,
  LAT_PULLDOWN_3D,
  PUSH_UP_3D,
  SCHOUDERDRUKKEN_3D,
]

/** Alle oefeningen die via de bouwstenen in 3D staan, gegroepeerd per patroon. */
export const BIBLIOTHEEK_3D: readonly Oefening3d[] = [
  GOBLET_SQUAT,
  SQUAT_LICHAAMSGEWICHT,
  SQUAT_DUMBBELLS,
  RDL_BARBELL,
  RDL_DUMBBELLS,
  KETTLEBELL_SWING,
  GOOD_MORNING,
  TRAP_BAR_DEADLIFT,
  SUMO_DEADLIFT,
  DEADLIFT_KETTLEBELL,
  LUNGE_DUMBBELLS,
  ACHTERWAARTSE_LUNGE_DB,
  SPLIT_SQUAT_DB,
  HIP_THRUST,
  GLUTE_BRIDGE,
  HIP_THRUST_DUMBBELL,
  GLUTE_BRIDGE_EEN_BEEN,
  LEG_PRESS,
  LEG_EXTENSION,
  LEG_CURL_ZITTEND,
  CALF_RAISE,
  DUMBBELL_BANKDRUKKEN,
  SCHUIN_BANKDRUKKEN_DB,
  CHEST_PRESS_MACHINE,
  OVERHEAD_PRESS,
  ROW_DUMBBELLS,
  BARBELL_ROW,
  SEATED_CABLE_ROW,
  FACE_PULL,
  LAT_PULLDOWN_ONDERHANDS,
  DUMBBELL_CURL,
  HAMMER_CURL,
  BARBELL_CURL,
  TRICEPS_PUSHDOWN,
  OVERHEAD_EXTENSION,
  LATERAL_RAISE,
  FRONT_RAISE,
  PLANK,
  CRUNCH,
]
