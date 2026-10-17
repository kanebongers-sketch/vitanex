// ─── Fit Factory Club, training: koppeling oefening naar RepDB-illustratie ───
// RepDB (repdb.co, github.com/RepDB/exercise-dataset, gratis versie) is de
// hoofdbron voor beelden bij oefeningen: meer oefeningen en een consistente,
// vlakke stijl. Licentie: gratis ook commercieel in een app, met zichtbare
// bronvermelding "Exercise data by RepDB (repdb.co)"; niet herpubliceren als
// dataset of API; bijsnijden, schalen en herkleuren mag; niet gebruiken voor
// generatieve AI. Zie public/club/oefeningen-repdb/ATTRIBUTION.txt.
//
// Handmatig gekoppeld op beweging EN materiaal: liever geen beeld dan een beeld
// dat iets anders laat zien. Sinds migratie 400 is RepDB de enige beeldstijl:
// oefeningen zonder RepDB-match staan op inactief en zijn vervangen.
// `id` is de RepDB-id (tevens de bestandsnaam: <id>-start.webp, <id>-eind.webp),
// `titel` de Engelse naam daar, ter controle door het importscript.
//
// Gebruikt door scripts/club/repdb-import.mjs (haalt de beelden op) en migratie
// 395_club_oefening_repdb.sql en 400_club_oefeningen_repdb_vervangen.sql (zetten
// de paden in de database).

export interface RepdbKoppeling {
  naam: string
  id: string
  titel: string
}

export const REPDB_KOPPELING: readonly RepdbKoppeling[] = [
  // Borst
  { naam: 'Chest press machine', id: 'chest-press-machine', titel: 'Machine Chest Press' },
  { naam: 'Push-up', id: 'push-up', titel: 'Push-Up' },
  { naam: 'Push-up op knieën', id: 'knee-push-ups', titel: 'Knee Push Ups' },
  { naam: 'Bankdrukken met barbell', id: 'bench-press', titel: 'Barbell Bench Press' },
  { naam: 'Dumbbell bankdrukken', id: 'db-bench-press', titel: 'Dumbbell Bench Press' },
  { naam: 'Schuin bankdrukken met dumbbells', id: 'incline-db-press', titel: 'Incline Dumbbell Press' },
  { naam: 'Pec deck', id: 'pec-deck', titel: 'Pec Deck' },
  { naam: 'Dumbbell fly', id: 'db-fly', titel: 'Dumbbell Fly' },
  { naam: 'Schuin bankdrukken met barbell', id: 'incline-bench-press', titel: 'Incline Barbell Bench Press' },
  { naam: 'Schuine dumbbell fly', id: 'incline-dumbbell-fly', titel: 'Incline Dumbbell Fly' },
  { naam: 'Cable crossover', id: 'cable-fly', titel: 'Cable Fly' },
  { naam: 'Dips voor de borst', id: 'dips', titel: 'Chest Dips' },
  { naam: 'Push-up met voeten verhoogd', id: 'decline-push-up', titel: 'Decline Push-Up' },
  { naam: 'Pullover met dumbbell', id: 'db-pullover', titel: 'Dumbbell Pullover' },
  { naam: 'Bankdrukken in de smith machine', id: 'smith-machine-bench-press', titel: 'Smith Machine Bench Press' },
  // Rug en onderrug
  { naam: 'Lat pulldown', id: 'lat-pulldown', titel: 'Lat Pulldown' },
  { naam: 'Assisted pull-up', id: 'assisted-pull-ups', titel: 'Assisted Pull Ups' },
  { naam: 'Pull-up', id: 'pull-up', titel: 'Pull-Up' },
  { naam: 'Chin-up', id: 'chin-ups', titel: 'Chin-Ups' },
  { naam: 'Seated cable row', id: 'seated-cable-row', titel: 'Seated Cable Row' },
  { naam: 'Seated row machine', id: 'chest-supported-machine-row', titel: 'Chest-Supported Machine Row' },
  { naam: 'Eenarmige dumbbell row', id: 'single-arm-db-row', titel: 'Single-Arm Dumbbell Row' },
  { naam: 'Barbell row', id: 'barbell-row', titel: 'Bent-Over Barbell Row' },
  { naam: 'Row op een schuine bank', id: 'chest-supported-db-row', titel: 'Chest-Supported Dumbbell Row' },
  { naam: 'Inverted row', id: 'inverted-row', titel: 'Inverted Row' },
  { naam: 'Straight arm pulldown', id: 'straight-arm-pulldown', titel: 'Straight-Arm Pulldown' },
  { naam: 'Back extension', id: 'back-extension', titel: 'Back Extension' },
  { naam: 'Superman', id: 'superman', titel: 'Superman' },
  { naam: 'T-bar row', id: 't-bar-row', titel: 'T-Bar Row' },
  { naam: 'Lat pulldown met V-greep', id: 'v-bar-lat-pulldown', titel: 'V-Bar Lat Pulldown' },
  { naam: 'Lat pulldown met onderhandse greep', id: 'reverse-grip-lat-pulldown', titel: 'Reverse Grip Lat Pulldown' },
  { naam: 'Pull-up met neutrale greep', id: 'neutral-grip-pull-ups', titel: 'Neutral Grip Pull Ups' },
  { naam: 'Barbell row met onderhandse greep', id: 'reverse-grip-bent-over-row', titel: 'Reverse Grip Bent Over Row' },
  { naam: 'Good morning', id: 'good-morning', titel: 'Good Morning' },
  // Schouders
  { naam: 'Face pull', id: 'face-pull', titel: 'Cable Face Pull' },
  { naam: 'Shoulder press machine', id: 'machine-shoulder-press', titel: 'Machine Shoulder Press' },
  { naam: 'Dumbbell shoulder press', id: 'seated-db-press', titel: 'Seated Dumbbell Shoulder Press' },
  { naam: 'Overhead press', id: 'ohp', titel: 'Barbell Overhead Press' },
  { naam: 'Landmine press', id: 'landmine-press', titel: 'Landmine Press' },
  { naam: 'Lateral raise', id: 'lateral-raise', titel: 'Dumbbell Lateral Raise' },
  { naam: 'Lateral raise aan de kabel', id: 'cable-lateral-raise', titel: 'Cable Lateral Raise' },
  { naam: 'Reverse fly', id: 'dumbbell-reverse-fly', titel: 'Dumbbell Reverse Fly' },
  { naam: 'Band pull-apart', id: 'band-pull-apart', titel: 'Band Pull Apart' },
  { naam: 'Pike push-up', id: 'pike-push-ups', titel: 'Pike Push Ups' },
  { naam: 'Schouders ophalen met dumbbells', id: 'db-shrug', titel: 'Dumbbell Shrug' },
  { naam: 'Upright row met dumbbells', id: 'dumbbell-upright-row', titel: 'Dumbbell Upright Row' },
  { naam: 'Front raise met dumbbells', id: 'dumbbell-front-raise', titel: 'Dumbbell Front Raise' },
  // Biceps
  { naam: 'Dumbbell curl', id: 'bicep-curl', titel: 'Dumbbell Bicep Curl' },
  { naam: 'Hammer curl', id: 'hammer-curl', titel: 'Dumbbell Hammer Curl' },
  { naam: 'Barbell curl', id: 'barbell-curl', titel: 'Barbell Curl' },
  { naam: 'Curl aan de kabel', id: 'cable-curl', titel: 'Cable Curl' },
  { naam: 'Preacher curl machine', id: 'machine-preacher-curl', titel: 'Machine Preacher Curl' },
  { naam: 'Concentratiecurl', id: 'concentration-curl', titel: 'Concentration Curl' },
  { naam: 'Curl met EZ-stang', id: 'ez-bar-curl', titel: 'EZ-Bar Curl' },
  { naam: 'Preacher curl met barbell', id: 'barbell-preacher-curl', titel: 'Barbell Preacher Curl' },
  { naam: 'Curl op een schuine bank', id: 'incline-db-curl', titel: 'Incline Dumbbell Curl' },
  // Triceps
  { naam: 'Triceps pushdown', id: 'tricep-pushdown', titel: 'Cable Tricep Pushdown' },
  { naam: 'Triceps extension boven het hoofd', id: 'overhead-tricep-extension', titel: 'Overhead Tricep Extension' },
  { naam: 'Skull crusher', id: 'skull-crusher', titel: 'Skull Crusher' },
  { naam: 'Dips op een bank', id: 'bench-dips', titel: 'Bench Dips' },
  { naam: 'Push-up met smalle handen', id: 'close-grip-push-ups', titel: 'Close Grip Push Ups' },
  { naam: 'Triceps kickback', id: 'tricep-kickback', titel: 'Dumbbell Tricep Kickback' },
  { naam: 'Bankdrukken met smalle greep', id: 'close-grip-bench-press', titel: 'Close-Grip Bench Press' },
  {
    naam: 'Eenarmige triceps extension boven het hoofd',
    id: 'single-arm-dumbbell-overhead-tricep-extension',
    titel: 'Single-Arm Dumbbell Overhead Tricep Extension',
  },
  { naam: 'Triceps extension liggend met dumbbell', id: 'lying-tricep-extension', titel: 'Lying Tricep Extension' },
  // Benen
  { naam: 'Leg press', id: 'leg-press', titel: 'Leg Press' },
  { naam: 'Goblet squat', id: 'goblet-squat', titel: 'Goblet Squat' },
  { naam: 'Squat met lichaamsgewicht', id: 'bodyweight-squat', titel: 'Bodyweight Squat' },
  { naam: 'Squat naar een bank', id: 'box-squat', titel: 'Box Squat' },
  { naam: 'Back squat', id: 'squat', titel: 'Barbell Back Squat' },
  { naam: 'Front squat', id: 'front-squat', titel: 'Front Squat' },
  { naam: 'Hack squat', id: 'hack-squat', titel: 'Hack Squat' },
  { naam: 'Wall sit', id: 'wall-sit', titel: 'Wall Sit' },
  { naam: 'Lunge met dumbbells', id: 'db-lunge', titel: 'Dumbbell Lunge' },
  { naam: 'Achterwaartse lunge', id: 'bodyweight-reverse-lunge', titel: 'Bodyweight Reverse Lunge' },
  { naam: 'Bulgarian split squat', id: 'bulgarian-split-squat', titel: 'Bulgarian Split Squat' },
  { naam: 'Step-up', id: 'step-ups', titel: 'Step Ups' },
  { naam: 'Leg extension', id: 'leg-extension', titel: 'Leg Extension' },
  { naam: 'Leg curl liggend', id: 'leg-curl', titel: 'Lying Leg Curl' },
  { naam: 'Leg curl zittend', id: 'seated-leg-curl', titel: 'Seated Leg Curl' },
  { naam: 'Roemeense deadlift met dumbbells', id: 'dumbbell-romanian-deadlift', titel: 'Dumbbell Romanian Deadlift' },
  { naam: 'Roemeense deadlift met barbell', id: 'romanian-deadlift', titel: 'Romanian Deadlift' },
  { naam: 'Deadlift', id: 'deadlift', titel: 'Barbell Deadlift' },
  { naam: 'Adductor machine', id: 'hip-adduction', titel: 'Hip Adduction' },
  { naam: 'Lunge met barbell', id: 'barbell-lunge', titel: 'Barbell Lunge' },
  { naam: 'Achterwaartse lunge met dumbbells', id: 'reverse-lunge', titel: 'Reverse Lunge' },
  { naam: 'Squat met dumbbells', id: 'db-squat', titel: 'Dumbbell Squat' },
  { naam: 'Squat in de smith machine', id: 'smith-machine-squat', titel: 'Smith Machine Squat' },
  // Billen en kuiten
  { naam: 'Hip thrust met barbell', id: 'hip-thrust', titel: 'Barbell Hip Thrust' },
  { naam: 'Hip thrust machine', id: 'plate-loaded-glute-drive', titel: 'Plate-Loaded Glute Drive' },
  { naam: 'Glute bridge', id: 'glute-bridge', titel: 'Glute Bridge' },
  { naam: 'Glute bridge op een been', id: 'single-leg-glute-bridge', titel: 'Single Leg Glute Bridge' },
  { naam: 'Kickback aan de kabel', id: 'cable-kickback', titel: 'Cable Glute Kickback' },
  { naam: 'Abductor machine', id: 'hip-abduction', titel: 'Machine Hip Abduction' },
  { naam: 'Zijwaarts stappen met elastiek', id: 'banded-lateral-walk', titel: 'Banded Lateral Walk' },
  { naam: 'Calf raise staand', id: 'machine-calf-raise', titel: 'Machine Calf Raise' },
  { naam: 'Calf raise zittend', id: 'seated-calf-raise', titel: 'Seated Calf Raise' },
  // Buik en romp
  { naam: 'Plank', id: 'plank', titel: 'Plank' },
  { naam: 'Zijplank', id: 'side-plank', titel: 'Side Plank' },
  { naam: 'Dead bug', id: 'dead-bug', titel: 'Dead Bug' },
  { naam: 'Bird dog', id: 'bird-dog', titel: 'Bird-Dog' },
  { naam: 'Crunch', id: 'crunches', titel: 'Crunches' },
  { naam: 'Pallof press', id: 'cable-pallof-press', titel: 'Cable Pallof Press' },
  { naam: 'Cable crunch', id: 'cable-crunch', titel: 'Cable Crunch' },
  { naam: 'Hanging knee raise', id: 'hanging-knee-raise', titel: 'Hanging Knee Raise' },
  { naam: 'Russian twist', id: 'russian-twist', titel: 'Russian Twist' },
  { naam: 'Ab wheel rollout', id: 'ab-wheel-rollout', titel: 'Ab Wheel Rollout' },
  { naam: 'Leg raise liggend', id: 'lying-leg-raise', titel: 'Lying Leg Raise' },
  { naam: 'Crunch met draai', id: 'cross-body-crunch', titel: 'Cross-Body Crunch' },
  { naam: 'Fietsende crunch', id: 'bicycle-crunch', titel: 'Bicycle Crunch' },
  { naam: 'Reverse crunch', id: 'reverse-crunches', titel: 'Reverse Crunches' },
  { naam: 'Zijwaarts buigen met dumbbell', id: 'dumbbell-side-bend', titel: 'Dumbbell Side Bend' },
  // Hele lichaam en explosief
  { naam: 'Farmer walk', id: 'dumbbell-farmers-walk', titel: "Dumbbell Farmer's Walk" },
  { naam: 'Turkish get-up', id: 'kettlebell-turkish-get-ups', titel: 'Kettlebell Turkish Get Ups' },
  { naam: 'Kettlebell swing', id: 'kettlebell-swing', titel: 'Kettlebell Swing' },
  { naam: 'Burpee', id: 'burpees', titel: 'Burpees' },
  { naam: 'Squat jump', id: 'jump-squat', titel: 'Jump Squat' },
  { naam: 'Box jump', id: 'box-jump', titel: 'Box Jump' },
  { naam: 'Mountain climber', id: 'mountain-climbers', titel: 'Mountain Climbers' },
  { naam: 'Medicine ball slam', id: 'medicine-ball-slam', titel: 'Medicine Ball Slam' },
  { naam: 'Battle ropes', id: 'battle-ropes', titel: 'Battle Ropes' },
  // Cardio
  { naam: 'Wandelen op de loopband', id: 'incline-treadmill-walk', titel: 'Incline Treadmill Walk' },
  { naam: 'Hardlopen op de loopband', id: 'treadmill-running', titel: 'Treadmill Running' },
  { naam: 'Crosstrainer', id: 'elliptical-trainer', titel: 'Elliptical Trainer' },
  { naam: 'Hometrainer', id: 'stationary-bike', titel: 'Stationary Bike' },
  { naam: 'Roeiergometer', id: 'rowing-machine', titel: 'Rowing Machine' },
  { naam: 'Traploper', id: 'stair-climber', titel: 'Stair Climber' },
  { naam: 'Airbike', id: 'air-bike', titel: 'Air Bike' },
  { naam: 'Touwtjespringen', id: 'jump-rope', titel: 'Jump Rope' },
]

/**
 * Migratie 400 (besluit eigenaar: overal dezelfde beeldstijl, alleen RepDB).
 * Nieuwe oefeningen die een oefening uit REPDB_GEEN_MATCH vervangen, plus
 * Sumo squat met dumbbell, die bij nader inzien wel een passend RepDB-beeld
 * heeft (een dumbbell tussen de benen) en daarom actief blijft.
 */
export const REPDB_KOPPELING_400: readonly RepdbKoppeling[] = [
  { naam: 'Adductie staand met elastiek', id: 'banded-standing-hip-adduction', titel: 'Banded Standing Hip Adduction' },
  { naam: 'Calf raise met lichaamsgewicht', id: 'bodyweight-calf-raise', titel: 'Bodyweight Calf Raise' },
  { naam: 'Squat met elastiek boven de knieen', id: 'banded-squat', titel: 'Banded Squat' },
  { naam: 'Thruster met barbell', id: 'thruster', titel: 'Thruster' },
  { naam: 'Walking lunge met lichaamsgewicht', id: 'walking-lunge', titel: 'Walking Lunge' },
  { naam: 'Sumo squat met dumbbell', id: 'db-sumo-squat', titel: 'Dumbbell Sumo Squat' },
]

/**
 * Migratie 400: elke oefening uit REPDB_GEEN_MATCH staat op inactief en is
 * vervangen door de dichtstbijzijnde oefening met een RepDB-beeld (zelfde
 * beweging, zo dicht mogelijk materiaal). Schema's verwijzen nu naar de nieuwe.
 * Sumo squat met dumbbell ontbreekt hier: die kreeg zelf een RepDB-beeld.
 */
export const REPDB_VERVANGING: Readonly<Record<string, string>> = {
  'Cable fly': 'Cable crossover',
  'Row met elastiek': 'Seated cable row',
  'Dips aan de brug': 'Dips voor de borst',
  'Walking lunge': 'Walking lunge met lichaamsgewicht',
  'Calf raise op een trede': 'Calf raise met lichaamsgewicht',
  'Thruster met dumbbells': 'Thruster met barbell',
  'Reverse fly liggend op een bank': 'Reverse fly',
  'Reverse fly met elastiek': 'Band pull-apart',
  'Step-up met dumbbells': 'Step-up',
  'Squat met elastiek': 'Squat met elastiek boven de knieen',
  'Leg curl staand': 'Leg curl liggend',
  'Adductie aan de kabel': 'Adductie staand met elastiek',
  'Kuitpers in de leg press': 'Calf raise staand',
  'Biceps curl met elastiek': 'Curl aan de kabel',
  'Triceps pushdown met touw': 'Triceps pushdown',
  'Crunch met benen op een bank': 'Crunch',
}

/**
 * Hadden in migratie 395 geen RepDB-beeld: RepDB heeft geen versie met dezelfde
 * beweging en hetzelfde materiaal. Sinds migratie 400 staan ze op inactief en
 * zijn ze vervangen (REPDB_VERVANGING), behalve Sumo squat met dumbbell
 * (REPDB_KOPPELING_400).
 */
export const REPDB_GEEN_MATCH: readonly string[] = [
  'Cable fly', // RepDB toont alleen hoge katrollen, wij werken op schouderhoogte
  'Row met elastiek',
  'Dips aan de brug', // RepDB toont de borstvariant (voorover), die staat al bij Dips voor de borst
  'Walking lunge', // RepDB zonder dumbbells
  'Calf raise op een trede',
  'Thruster met dumbbells', // RepDB alleen met barbell
  'Reverse fly liggend op een bank',
  'Reverse fly met elastiek',
  'Step-up met dumbbells', // RepDB alleen zonder gewicht
  'Sumo squat met dumbbell', // in 400 alsnog gekoppeld, zie REPDB_KOPPELING_400
  'Squat met elastiek', // RepDB met een lusband boven de knieen
  'Leg curl staand', // RepDB alleen met elastiek
  'Adductie aan de kabel',
  'Kuitpers in de leg press',
  'Biceps curl met elastiek',
  'Triceps pushdown met touw', // RepDB toont een rechte stang
  'Crunch met benen op een bank',
]

/**
 * RepDB-ids met maar een houding ("main"): start en eind zijn hetzelfde beeld.
 * Toon die als een stilstaand beeld, zonder wissel en zonder labels Begin en Eind.
 */
export const REPDB_ENKELE_HOUDING: ReadonlySet<string> = new Set([
  'air-bike',
  'battle-ropes',
  'burpees',
  'dumbbell-farmers-walk',
  'elliptical-trainer',
  'incline-treadmill-walk',
  'jump-rope',
  'plank',
  'side-plank',
  'stair-climber',
  'stationary-bike',
  'treadmill-running',
  'wall-sit',
])

/** Is dit RepDB-pad een oefening met een enkele houding? */
export function isEnkeleHouding(pad: string): boolean {
  const id = /^\/club\/oefeningen-repdb\/(.+)-(?:start|eind)\.webp$/.exec(pad)?.[1]
  return id !== undefined && REPDB_ENKELE_HOUDING.has(id)
}

/** Bestandsnaam: kleine letters, cijfers en losse streepjes. */
export const REPDB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const REPDB_BEELD_PAD = /^\/club\/oefeningen-repdb\/[a-z0-9]+(?:-[a-z0-9]+)*-(?:start|eind)\.webp$/

/** Systeemgrens: alleen paden naar onze eigen RepDB-map komen door. */
export function isRepdbBeeldPad(v: unknown): v is string {
  return typeof v === 'string' && REPDB_BEELD_PAD.test(v)
}

/** Het publieke pad van de begin- of eindhouding. */
export function repdbBeeldBestand(id: string, houding: 'start' | 'eind'): string {
  if (!REPDB_SLUG.test(id)) throw new Error(`Ongeldige RepDB-id: ${id}`)
  return `/club/oefeningen-repdb/${id}-${houding}.webp`
}

/** De bronvermelding die de licentie vraagt, zichtbaar waar de beelden staan. */
export const REPDB_BRON = {
  tekst: 'Illustraties: RepDB (repdb.co)',
  vereist: 'Exercise data by RepDB (repdb.co)',
  bron: 'https://repdb.co',
  /** Waarde van beeld_bron en beeld_licentie in club_oefeningen. */
  waarde: 'RepDB',
  licentie: 'RepDB gratis (bronvermelding)',
} as const
