import type { Trainingsschema } from './types'

// Trainingsschema — 6-daagse PPL (Push/Pull/Legs, twee varianten).
// Bron: Kane's Excel, sheet "Trainingschema". Doel = Massa, fase = maintenance.
//
// De bron heeft 22 weken naast elkaar met progressie in gewicht/reps. We leggen
// hier WEEK 1 vast als startpunt (sets · reps · RPE · startgewicht). De A/B-
// achtervoegsels zijn van ons: de bron noemt beide sessies "Push"/"Pull"/"Legs",
// maar het zijn verschillende oefeningen — A/B maakt de keuze eenduidig.
//
// Handmatige correcties op zichtbare bron-invoerfouten (geen verzonnen data):
//   • Cable fly: week 1 stond op 134 kg (week 2–4: 27–32 kg) — een kennelijke
//     typefout, dus gewicht op null gezet i.p.v. een misleidend getal te tonen.
//   • Weighted pull-ups: week 1 = 0 kg extra = lichaamsgewicht → gewicht null.
//   • Leg press (Legs B): week 1-gewicht leeg in de bron → null.

export const TRAINING: Trainingsschema = {
  doel: 'Massa',
  fase: 'maintenance',
  week: 1,
  sessies: [
    {
      naam: 'Push A',
      cardio: '20 min · niveau 8 · ~130 bpm',
      oefeningen: [
        { naam: 'JM press (Smith machine)', sets: 3, reps: '6-10', rpe: 7, gewicht: 68 },
        { naam: 'Incline chest press', sets: 3, reps: '8-12', rpe: 7, gewicht: 81.3 },
        { naam: 'Cable fly', sets: 3, reps: '10-15', rpe: 7, gewicht: null },
        { naam: 'Cross body tricep extension', sets: 3, reps: '10-15', rpe: 7, gewicht: 18 },
        { naam: 'Shoulder press', sets: 3, reps: '8-12', rpe: 7, gewicht: 26 },
        { naam: 'Cable side raise (heuphoogte)', sets: 3, reps: '8-12', rpe: 7, gewicht: 9 },
      ],
    },
    {
      naam: 'Pull A',
      oefeningen: [
        { naam: 'Barbell row (1 sec hold)', sets: 2, reps: '6-10', rpe: 7, gewicht: 85 },
        { naam: 'Close grip pulldowns', sets: 2, reps: '10-15', rpe: 7, gewicht: 66 },
        { naam: 'Chest supported row', sets: 2, reps: '6-10', rpe: 7, gewicht: 79 },
        { naam: 'EZ-bar preacher curl', sets: 3, reps: '8-12', rpe: 7, gewicht: 15 },
        { naam: 'Face pulls', sets: 3, reps: '8-12', rpe: 7, gewicht: 45 },
        { naam: 'Hammer curl', sets: 3, reps: '6-10', rpe: 7, gewicht: 20 },
      ],
    },
    {
      naam: 'Legs A',
      oefeningen: [
        { naam: 'Straight leg calf raise', sets: 3, reps: '6-10', rpe: 7, gewicht: 60 },
        { naam: 'Single lying leg curl', sets: 3, reps: '8-12', rpe: 7, gewicht: 54 },
        { naam: 'Smith squats', sets: 3, reps: '10-20', rpe: 7, gewicht: 60 },
        { naam: 'Leg extension', sets: 4, reps: '10-15', rpe: 7, gewicht: 73 },
        { naam: 'Glute drive', sets: 3, reps: '6-10', rpe: 7, gewicht: 80 },
      ],
    },
    {
      naam: 'Push B',
      cardio: '20 min · niveau 8 · ~130 bpm',
      oefeningen: [
        { naam: 'Smith machine skull crushers', sets: 3, reps: '8-12', rpe: 7, gewicht: 6.25 },
        { naam: 'Cable tricep kickbacks', sets: 3, reps: '8-12', rpe: 7, gewicht: 23 },
        { naam: 'Plate loaded flat chest press', sets: 3, reps: '8-12', rpe: 7, gewicht: 80 },
        { naam: 'Pec deck', sets: 3, reps: '10-15', rpe: 7, gewicht: 134 },
        { naam: 'Cable lateral raises', sets: 3, reps: '8-12', rpe: 7, gewicht: 11.3 },
        { naam: 'Reverse pec deck', sets: 3, reps: '8-12', rpe: 7, gewicht: 79 },
      ],
    },
    {
      naam: 'Pull B',
      cardio: '20 min · niveau 8 · ~130 bpm',
      oefeningen: [
        { naam: 'Weighted close grip pull-ups', sets: 2, reps: 'AMRAP', rpe: 7, gewicht: null },
        { naam: 'Cable row', sets: 2, reps: '6-10', rpe: 7, gewicht: 73 },
        { naam: 'Hyperextensie (weighted)', sets: 2, reps: '8-12', rpe: 7, gewicht: 16 },
        { naam: 'Incline dumbbell curl', sets: 3, reps: '6-10', rpe: 7, gewicht: 16 },
        { naam: 'Barbell shrugs', sets: 3, reps: '5-8', rpe: 7, gewicht: 110 },
        { naam: 'Face-away Bayesian curl', sets: 3, reps: '8-12', rpe: 7, gewicht: 25.3 },
      ],
    },
    {
      naam: 'Legs B',
      cardio: '20 min · niveau 8 · ~130 bpm',
      oefeningen: [
        { naam: 'RDL', sets: 2, reps: '6-10', rpe: 7, gewicht: 100 },
        { naam: 'Leg extension', sets: 3, reps: '8-12', rpe: 7, gewicht: 120 },
        { naam: 'Seated leg curl', sets: 3, reps: '8-12', rpe: 7, gewicht: 73 },
        { naam: 'Bulgarian split squats', sets: 3, reps: '6-10', rpe: 7, gewicht: 12 },
        { naam: 'Leg press', sets: 3, reps: '8-12', rpe: 7, gewicht: null },
        { naam: 'Straight leg calf raises', sets: 3, reps: '6-10', rpe: 7, gewicht: 80 },
      ],
    },
  ],
}
