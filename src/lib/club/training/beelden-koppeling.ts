// ─── Fit Factory Club, training: koppeling oefening naar tekening (PURE DATA) ─
// Welke tekening uit de open dataset van Everkinetic (github.com/everkinetic/data,
// CC BY-SA 4.0) bij welke oefening hoort. Handmatig gekozen op beweging EN
// materiaal: liever geen tekening dan een tekening die iets anders laat zien.
// `id` is het nummer van de oefening in de dataset (bestanden <id>-relaxation.svg
// en <id>-tension.svg), `titel` de Engelse naam daar, ter controle.
//
// Gebruikt door scripts/club/everkinetic-import.mjs (haalt de tekeningen op) en
// migratie 391_club_oefening_beelden.sql (zet de paden in de database).

export interface BeeldKoppeling {
  naam: string
  id: string
  titel: string
}

/** Oefeningen uit de startbibliotheek (migratie 382) met een passende tekening. */
export const KOPPELING_BESTAAND: readonly BeeldKoppeling[] = [
  { naam: 'Chest press machine', id: '0066', titel: 'Bench Press: Machine' },
  { naam: 'Push-up', id: '0077', titel: 'Push Up: Body Weight' },
  { naam: 'Bankdrukken met barbell', id: '0042', titel: 'Bench Press: Barbell' },
  { naam: 'Dumbbell bankdrukken', id: '0055', titel: 'Bench Press: Dumbbell' },
  { naam: 'Schuin bankdrukken met dumbbells', id: '0061', titel: 'Bench Press: Dumbbell (Incline)' },
  { naam: 'Dumbbell fly', id: '0056', titel: 'Dumbbell Flys' },
  { naam: 'Pull-up', id: '0087', titel: 'Pull Ups' },
  { naam: 'Seated cable row', id: '0025', titel: 'Seated Cable Rows' },
  { naam: 'Eenarmige dumbbell row', id: '0024', titel: 'Rear Deltoid Row Dumbbell' },
  { naam: 'Inverted row', id: '0086', titel: 'Body Row' },
  { naam: 'Straight arm pulldown', id: '0092', titel: 'Straight Arm Push Down' },
  { naam: 'Back extension', id: '0103', titel: 'Hyperextensions' },
  { naam: 'Superman', id: '0105', titel: 'Supermans' },
  { naam: 'Lateral raise', id: '0018', titel: 'Lateral Dumbbell Raises' },
  { naam: 'Reverse fly', id: '0032', titel: 'Bent Over Rear Deltoid Raise With Head On Bench' },
  { naam: 'Dumbbell curl', id: '0224', titel: 'Biceps Curl: Dumbbell' },
  { naam: 'Hammer curl', id: '0227', titel: 'Biceps Curl: Dumbbell (Hammer)' },
  { naam: 'Barbell curl', id: '0211', titel: 'Biceps Curl: Barbell' },
  { naam: 'Curl aan de kabel', id: '0212', titel: 'Standing Biceps Curl with Cable' },
  { naam: 'Preacher curl machine', id: '0236', titel: 'Preacher Curl: Machine' },
  { naam: 'Triceps pushdown', id: '0205', titel: 'Triceps Pushdown: Cable' },
  { naam: 'Triceps extension boven het hoofd', id: '0198', titel: 'Triceps Extension: Dumbbell (Standing)' },
  { naam: 'Skull crusher', id: '0183', titel: 'Lying Triceps Press with Barbell' },
  { naam: 'Dips aan de brug', id: '0172', titel: 'Triceps Dips: Body Weight' },
  { naam: 'Push-up met smalle handen', id: '0188', titel: 'Close Triceps Pushup' },
  { naam: 'Triceps kickback', id: '0204', titel: 'Triceps Kickback with Dumbbell' },
  { naam: 'Leg press', id: '0127', titel: 'Leg Press' },
  { naam: 'Back squat', id: '0122', titel: 'Barbell Squat' },
  { naam: 'Front squat', id: '0138', titel: 'Front Squat with Barbell' },
  { naam: 'Hack squat', id: '0123', titel: 'Hack Squat: Machine' },
  { naam: 'Lunge met dumbbells', id: '0115', titel: 'Lunges: Dumbbell' },
  { naam: 'Walking lunge', id: '0121', titel: 'Lunges: Dumbbell (Walking)' },
  { naam: 'Leg extension', id: '0142', titel: 'Leg Extensions' },
  { naam: 'Leg curl liggend', id: '0117', titel: 'Lying Leg Curl Machine' },
  { naam: 'Leg curl zittend', id: '0119', titel: 'Seated Leg Curl' },
  { naam: 'Roemeense deadlift met dumbbells', id: '0107', titel: 'Dead Lifts: Dumbbell' },
  { naam: 'Roemeense deadlift met barbell', id: '0118', titel: 'Romanian Dead Lift' },
  { naam: 'Deadlift', id: '0099', titel: 'Dead Lifts: Barbell' },
  { naam: 'Adductor machine', id: '0157', titel: 'Thigh Adductor' },
  { naam: 'Abductor machine', id: '0156', titel: 'Thigh Abductor' },
  { naam: 'Glute bridge', id: '0109', titel: 'Bridging' },
  { naam: 'Kickback aan de kabel', id: '0112', titel: 'One Legged Cable Kickback' },
  { naam: 'Calf raise staand', id: '0282', titel: 'Standing Calf Raises using Machine' },
  { naam: 'Calf raise zittend', id: '0279', titel: 'Seated Calf Raise using Machine' },
  { naam: 'Zijplank', id: '0113', titel: 'Side Plank' },
]

/** Nieuwe oefeningen uit migratie 391: gangbaar, met een tekening uit de dataset. */
export const KOPPELING_NIEUW: readonly BeeldKoppeling[] = [
  { naam: 'Schouders ophalen met dumbbells', id: '0005', titel: 'Shoulder Shrugs: Dumbbell' },
  { naam: 'Upright row met dumbbells', id: '0016', titel: 'Upright Row: Dumbbell' },
  { naam: 'Front raise met dumbbells', id: '0033', titel: 'Front Dumbbell Raise' },
  { naam: 'Reverse fly liggend op een bank', id: '0023', titel: 'Lying Rear Lateral Raise' },
  { naam: 'Reverse fly met elastiek', id: '0020', titel: "Back Fly's with Exercise Band" },
  { naam: 'Schuin bankdrukken met barbell', id: '0043', titel: 'Bench Press: Barbell (Incline)' },
  { naam: 'Bankdrukken met smalle greep', id: '0049', titel: 'Bench Press: Barbell (Close Grip)' },
  { naam: 'Schuine dumbbell fly', id: '0062', titel: "Incline Dumbbell Fly's" },
  { naam: 'Cable crossover', id: '0048', titel: 'Cable Crossover' },
  { naam: 'Dips voor de borst', id: '0054', titel: 'Chest Dips' },
  { naam: 'Push-up met voeten verhoogd', id: '0075', titel: 'Push Up: Bench (Feet Elevated)' },
  { naam: 'Pullover met dumbbell', id: '0046', titel: 'Dumbbell Bent Arm Pullover' },
  { naam: 'Bankdrukken in de smith machine', id: '0078', titel: 'Bench Press: Smith Machine' },
  { naam: 'T-bar row', id: '0029', titel: 'T-Bar Rows' },
  { naam: 'Lat pulldown met V-greep', id: '0096', titel: 'Pull Down: V Bar' },
  { naam: 'Lat pulldown met onderhandse greep', id: '0093', titel: 'Pull Down: Underhand' },
  { naam: 'Pull-up met neutrale greep', id: '0090', titel: 'Narrow Parallel Grip Chin-ups' },
  { naam: 'Barbell row met onderhandse greep', id: '0026', titel: 'Reverse Grips Bent Over Barbell Rows' },
  { naam: 'Good morning', id: '0101', titel: 'Good Mornings: Barbell' },
  { naam: 'Lunge met barbell', id: '0114', titel: 'Lunges: Barbell' },
  { naam: 'Achterwaartse lunge met dumbbells', id: '0129', titel: 'Lunges: Dumbbell (Rear)' },
  { naam: 'Step-up met dumbbells', id: '0137', titel: 'Step Ups: Dumbbell' },
  { naam: 'Squat met dumbbells', id: '0130', titel: 'Squats: Dumbbells' },
  { naam: 'Squat in de smith machine', id: '0124', titel: 'Squats: Smith Machine' },
  { naam: 'Sumo squat met dumbbell', id: '0152', titel: 'Pile Squat with Dumbbell' },
  { naam: 'Squat met elastiek', id: '0155', titel: 'Squats: Exercise Bands' },
  { naam: 'Leg curl staand', id: '0120', titel: 'Standing Leg Curls' },
  { naam: 'Adductie aan de kabel', id: '0135', titel: 'Hip Adduction' },
  { naam: 'Kuitpers in de leg press', id: '0273', titel: 'Calves Press on Leg Machine' },
  { naam: 'Concentratiecurl', id: '0220', titel: 'Concentration Curls with Dumbbell' },
  { naam: 'Curl met EZ-stang', id: '0226', titel: 'EZ Bar Curl with Barbell' },
  { naam: 'Preacher curl met barbell', id: '0239', titel: 'Preacher Curl: Barbell' },
  { naam: 'Curl op een schuine bank', id: '0214', titel: 'Alternating Incline Curl with Dumbbell' },
  { naam: 'Biceps curl met elastiek', id: '0261', titel: 'Quick Alternating Biceps Curls with Band' },
  { naam: 'Triceps pushdown met touw', id: '0206', titel: 'Triceps Pushdown: Cable (Rope)' },
  { naam: 'Eenarmige triceps extension boven het hoofd', id: '0173', titel: 'Triceps Extension: Dumbbell (One Arm)' },
  { naam: 'Triceps extension liggend met dumbbell', id: '0181', titel: 'Triceps Extension: Dumbbell (Lying)' },
  { naam: 'Leg raise liggend', id: '0021', titel: 'Flat Bench Leg Raises' },
  { naam: 'Crunch met draai', id: '0289', titel: 'Cross Body Crunch' },
  { naam: 'Fietsende crunch', id: '0284', titel: 'Air Bike' },
  { naam: 'Crunch met benen op een bank', id: '0291', titel: 'Crunches' },
  { naam: 'Reverse crunch', id: '0287', titel: 'Bent Knee Hip Raise' },
  { naam: 'Zijwaarts buigen met dumbbell', id: '0294', titel: 'Side Bend with Dumbbell' },
]

export const BEELD_KOPPELING: readonly BeeldKoppeling[] = [...KOPPELING_BESTAAND, ...KOPPELING_NIEUW]

/** Het publieke pad van de begin- of eindhouding. */
export function beeldBestand(id: string, houding: 'start' | 'eind'): string {
  return `/club/oefeningen/${id}-${houding}.svg`
}
