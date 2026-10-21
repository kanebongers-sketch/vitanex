// ─── Fit Factory Club, 3D-oefenbeelden: bibliotheek via bouwstenen (PUUR) ───
// Elke oefening staat in een eigen bestand in deze map: een paar regels data op
// een bouwsteen per bewegingspatroon (../bouw). De naam is exact de naam in de
// oefenbibliotheek (beelden-repdb.ts en de coaching); de test controleert dat.
//
// Een nieuwe oefening toevoegen:
// 1. kies het patroon: squat, hinge, swing, lunge, heupstrek, legPress,
//    beenMachine, calfRaise (../bouw/benen), vloertrek voor deadlifts vanaf de
//    vloer (../bouw/vloertrek), armOefening voor drukken, trekken, curl,
//    extensie en raise (../bouw/boven), boogOefening voor fly, pec deck en
//    crossover (../bouw/boog), smithDrukken (../bouw/smith), pushUp
//    (../bouw/push-up), plank of crunch (../bouw/core), reverseCrunch, legRaise
//    of hollowHold (../bouw/liggend);
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
import { SCHUIN_BANKDRUKKEN_BARBELL } from './schuin-bankdrukken-met-barbell'
import { BANKDRUKKEN_SMALLE_GREEP } from './bankdrukken-met-smalle-greep'
import { PUSH_UP_KNIEEN } from './push-up-op-knieen'
import { PUSH_UP_VOETEN_VERHOOGD } from './push-up-met-voeten-verhoogd'
import { PUSH_UP_HANDEN_VERHOOGD } from './push-up-met-handen-verhoogd'
import { PUSH_UP_SMALLE_HANDEN } from './push-up-met-smalle-handen'
import { BANKDRUKKEN_SMITH } from './bankdrukken-in-de-smith-machine'
import { SCHUIN_BANKDRUKKEN_SMITH } from './schuin-bankdrukken-in-de-smith-machine'
import { DUMBBELL_FLY } from './dumbbell-fly'
import { SCHUINE_DUMBBELL_FLY } from './schuine-dumbbell-fly'
import { PEC_DECK } from './pec-deck'
import { CABLE_CROSSOVER } from './cable-crossover'
import { OVERHEAD_PRESS } from './overhead-press'
import { ROW_DUMBBELLS } from './voorovergebogen-row-met-dumbbells'
import { BARBELL_ROW } from './barbell-row'
import { SEATED_CABLE_ROW } from './seated-cable-row'
import { FACE_PULL } from './face-pull'
import { BARBELL_ROW_ONDERHANDS } from './barbell-row-met-onderhandse-greep'
import { T_BAR_ROW } from './t-bar-row'
import { ROW_SCHUINE_BANK } from './row-op-een-schuine-bank'
import { SEATED_ROW_MACHINE } from './seated-row-machine'
import { SEATED_CABLE_ROW_BREED } from './seated-cable-row-met-brede-greep'
import { LAT_PULLDOWN_ONDERHANDS } from './lat-pulldown-met-onderhandse-greep'
import { LAT_PULLDOWN_V_GREEP } from './lat-pulldown-met-v-greep'
import { STRAIGHT_ARM_PULLDOWN } from './straight-arm-pulldown'
import { REVERSE_FLY_MACHINE } from './reverse-fly-machine'
import { DUMBBELL_CURL } from './dumbbell-curl'
import { HAMMER_CURL } from './hammer-curl'
import { BARBELL_CURL } from './barbell-curl'
import { CURL_AAN_DE_KABEL } from './curl-aan-de-kabel'
import { CURL_EZ_STANG } from './curl-met-ez-stang'
import { CURL_SCHUINE_BANK } from './curl-op-een-schuine-bank'
import { HAMMER_CURL_KABEL } from './hammer-curl-aan-de-kabel'
import { BICEPS_CURL_MACHINE } from './biceps-curl-machine'
import { TRICEPS_PUSHDOWN } from './triceps-pushdown'
import { OVERHEAD_EXTENSION } from './triceps-extension-boven-het-hoofd'
import { SKULL_CRUSHER } from './skull-crusher'
import { TRICEPS_KICKBACK } from './triceps-kickback'
import { TRICEPS_EXTENSION_LIGGEND } from './triceps-extension-liggend-met-dumbbell'
import { TRICEPS_EXTENSION_KABEL } from './triceps-extension-boven-het-hoofd-aan-de-kabel'
import { DIPS_OP_EEN_BANK } from './dips-op-een-bank'
import { LATERAL_RAISE } from './lateral-raise'
import { FRONT_RAISE } from './front-raise-met-dumbbells'
import { SHOULDER_PRESS_MACHINE } from './shoulder-press-machine'
import { REVERSE_FLY } from './reverse-fly'
import { UPRIGHT_ROW_DUMBBELLS } from './upright-row-met-dumbbells'
import { SCHOUDERS_OPHALEN_DUMBBELLS } from './schouders-ophalen-met-dumbbells'
import { SCHOUDERS_OPHALEN_BARBELL } from './schouders-ophalen-met-barbell'
import { PLANK } from './plank'
import { CRUNCH } from './crunch'
import { REVERSE_CRUNCH } from './reverse-crunch'
import { LEG_RAISE_LIGGEND } from './leg-raise-liggend'
import { HOLLOW_HOLD } from './hollow-hold'
import { SQUAT_NAAR_BANK } from './squat-naar-een-bank'
import { ACHTERWAARTSE_LUNGE } from './achterwaartse-lunge'
import { BULGARIAN_SPLIT_SQUAT } from './bulgarian-split-squat'
import { SUMO_SQUAT_DB } from './sumo-squat-met-dumbbell'
import { SQUAT_SMITH } from './squat-in-de-smith-machine'
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
  SQUAT_NAAR_BANK,
  SUMO_SQUAT_DB,
  SQUAT_SMITH,
  RDL_BARBELL,
  RDL_DUMBBELLS,
  KETTLEBELL_SWING,
  GOOD_MORNING,
  TRAP_BAR_DEADLIFT,
  SUMO_DEADLIFT,
  DEADLIFT_KETTLEBELL,
  LUNGE_DUMBBELLS,
  ACHTERWAARTSE_LUNGE_DB,
  ACHTERWAARTSE_LUNGE,
  SPLIT_SQUAT_DB,
  BULGARIAN_SPLIT_SQUAT,
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
  SCHUIN_BANKDRUKKEN_BARBELL,
  BANKDRUKKEN_SMALLE_GREEP,
  PUSH_UP_KNIEEN,
  PUSH_UP_VOETEN_VERHOOGD,
  PUSH_UP_HANDEN_VERHOOGD,
  PUSH_UP_SMALLE_HANDEN,
  BANKDRUKKEN_SMITH,
  SCHUIN_BANKDRUKKEN_SMITH,
  DUMBBELL_FLY,
  SCHUINE_DUMBBELL_FLY,
  PEC_DECK,
  CABLE_CROSSOVER,
  OVERHEAD_PRESS,
  ROW_DUMBBELLS,
  BARBELL_ROW,
  SEATED_CABLE_ROW,
  BARBELL_ROW_ONDERHANDS,
  T_BAR_ROW,
  ROW_SCHUINE_BANK,
  SEATED_ROW_MACHINE,
  SEATED_CABLE_ROW_BREED,
  FACE_PULL,
  LAT_PULLDOWN_ONDERHANDS,
  LAT_PULLDOWN_V_GREEP,
  STRAIGHT_ARM_PULLDOWN,
  REVERSE_FLY_MACHINE,
  DUMBBELL_CURL,
  HAMMER_CURL,
  BARBELL_CURL,
  CURL_AAN_DE_KABEL,
  CURL_EZ_STANG,
  CURL_SCHUINE_BANK,
  HAMMER_CURL_KABEL,
  BICEPS_CURL_MACHINE,
  TRICEPS_PUSHDOWN,
  OVERHEAD_EXTENSION,
  SKULL_CRUSHER,
  TRICEPS_KICKBACK,
  TRICEPS_EXTENSION_LIGGEND,
  TRICEPS_EXTENSION_KABEL,
  DIPS_OP_EEN_BANK,
  LATERAL_RAISE,
  FRONT_RAISE,
  SHOULDER_PRESS_MACHINE,
  REVERSE_FLY,
  UPRIGHT_ROW_DUMBBELLS,
  SCHOUDERS_OPHALEN_DUMBBELLS,
  SCHOUDERS_OPHALEN_BARBELL,
  PLANK,
  CRUNCH,
  REVERSE_CRUNCH,
  LEG_RAISE_LIGGEND,
  HOLLOW_HOLD,
]
