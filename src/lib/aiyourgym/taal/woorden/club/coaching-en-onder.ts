// Engelse coaching van de Blender-oefeningen uit golf 1 (29-10-2026): benen,
// heupscharnier en sprongen. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_ONDER: Readonly<Record<string, Coaching>> = {
  'Glute bridge op een been': {
    kernpunten: [
      { punt: 'Hips stay level', uitleg: 'Both hip bones at the same height. If the free side drops, the glute of your standing leg works too little.' },
      { punt: 'Drive through your heel', uitleg: 'Your standing foot is flat and you push mainly through your heel. That puts the work in your glute, not your knee.' },
      { punt: 'Less height is fine', uitleg: 'Go as high as you can without tilting or arching. A clean small movement is better.' },
      { punt: 'Keep the free leg still', uitleg: 'The straight leg floats along calmly. Do not swing it to get up.' },
    ],
    opstelling: [
      'Lie on your back with one foot flat on the floor, heel close to your glutes, and extend the other leg in line with its thigh.',
      'Place your arms by your sides with your palms on the floor for support.',
    ],
    stappen: [
      'Brace your core and press your heel into the floor.',
      'Lift your hips while your pelvis stays level and squeeze your glute.',
      'Hold for one count, lower calmly and do all reps before you switch.',
    ],
    fouten: [
      { fout: 'Pelvis tilts to the free side', beter: 'Make the movement smaller until your hips stay level. Put your hands on your hip bones to check if needed.' },
      { fout: 'Pushing with the lower back', beter: 'Keep your ribs down and stop once your glute is fully squeezed. Going higher only arches your back.' },
      { fout: 'Hamstring cramp', beter: 'Place your standing foot closer to your glutes and push more through your heel.' },
    ],
    ademhaling: 'Breathe out as you lift, breathe in as you lower.',
    tempo: 'Per leg: 1 count up, hold for 2 counts, 2 counts down.',
    makkelijker: 'Keep your free leg bent with the foot in the air, or do the regular glute bridge.',
    zwaarder: 'Put your shoulders on a bench, or place a weight on the hip of your standing leg.',
  },
  'Roemeense deadlift met barbell': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Push your glutes back as if you were closing a door with them. The bar lowers along with it.' },
      { punt: 'Bar along your legs', uitleg: 'The bar slides down along your thighs. If it drifts away from your legs, it gets heavy on your back.' },
      { punt: 'Back straight', uitleg: 'Your back stays neutral, from neck to tailbone. Look at the floor a few metres in front of you.' },
      { punt: 'Knees slightly bent', uitleg: 'Your knees bend a little and stay there. It is not a squat.' },
      { punt: 'Squeeze your glutes at the top', uitleg: 'Come up by driving your hips forward. Do not lean back.' },
    ],
    opstelling: [
      'Grip the bar at hip width with your palms facing you, for example from a rack at hip height.',
      'Stand tall with your feet hip width apart and the bar against your thighs. Shoulders down and back.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Push your hips back and let the bar slide down your legs until you feel a strong stretch in your hamstrings.',
      'Drive your hips forward and stand up, the bar stays close to your legs.',
    ],
    fouten: [
      { fout: 'Back rounds at the bottom', beter: 'Stop sooner. Only lower as far as your back stays straight, often just below your knees.' },
      { fout: 'Knees keep bending further', beter: 'Lock your knees into a slight bend and move only from your hips.' },
      { fout: 'Bar hangs out in front', beter: 'Engage your lats, as if pulling your armpits towards your hips. The bar slides along your trousers.' },
    ],
    ademhaling: 'Breathe in and brace before you lower, breathe out when you are almost upright.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use dumbbells or a light bar and lower less deep.',
    zwaarder: 'Add weight or pause for 2 counts in the stretch at the bottom.',
  },
  'Sumo deadlift': {
    kernpunten: [
      { punt: 'Knees out', uitleg: 'Your knees follow your toes. That makes room for your torso and keeps the bar close to you.' },
      { punt: 'Shins almost vertical', uitleg: 'The bar is against your shins and your hips are closer to the bar than in a regular deadlift.' },
      { punt: 'Chest up, back long', uitleg: 'Torso more upright than in a regular deadlift. Your back stays in the same position throughout.' },
      { punt: 'Spread the floor', uitleg: 'Think of pushing your feet outwards as you stand up. Then your glutes and inner thighs join in.' },
    ],
    opstelling: [
      'Stand wide with your toes turned out, the bar over the middle of your feet.',
      'Grip the bar at shoulder width between your knees, arms straight and hanging straight down.',
    ],
    stappen: [
      'Push your knees out, breathe in and brace your core.',
      'Take the slack out of the bar and push the floor away until you stand tall.',
      'Lower the bar along your legs: hips back first, then bend your knees.',
    ],
    fouten: [
      { fout: 'Knees cave in', beter: 'Actively push your knees out in line with your toes. Take a slightly narrower stance if you cannot.' },
      { fout: 'Bar drifts away from your legs', beter: 'Keep the bar against your shins and thighs. Pull it towards you with straight arms.' },
      { fout: 'Hips too low, like a squat', beter: 'Only lower far enough to grip the bar with straight arms. It stays a hip movement.' },
    ],
    ademhaling: 'Breathe in and brace before every rep, breathe out when you are at the top.',
    tempo: '1 count up, a short pause, 2 counts back to the floor.',
    makkelijker: 'Start with a kettlebell between your feet in the same wide stance.',
    zwaarder: 'Pause for one count just above the floor before you come back up.',
  },
  'Good morning': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'You do not bend forward, you push your glutes towards the wall behind you. Your torso tilts along with it.' },
      { punt: 'Back stays straight', uitleg: 'One long line from head to tailbone. As soon as your back rounds, stop and come back up.' },
      { punt: 'Knees slightly bent', uitleg: 'A small bend that stays the same. Do not sink further into your knees, or it becomes a squat.' },
      { punt: 'Bar tight on your upper back', uitleg: 'Pull the bar into your shoulders and keep your shoulder blades together. That keeps your upper back firm.' },
    ],
    opstelling: [
      'Start with a stick or an empty bar. Place the bar on your upper back as in a squat, not on your neck.',
      'Feet hip width apart, knees slightly bent, elbows pointing slightly down.',
    ],
    stappen: [
      'Breathe in, brace your core and push your hips back.',
      'Let your torso tilt forward with a straight back until you feel a stretch in your hamstrings or your torso is almost horizontal.',
      'Drive your hips forward and stand up, glutes squeezed.',
    ],
    fouten: [
      { fout: 'Rounded lower back at the bottom', beter: 'Go less deep. Your movement stops where your back is still straight, even if that is well above horizontal.' },
      { fout: 'Knees keep bending further', beter: 'Set the slight knee bend at the start and keep it the same. Only your hips move.' },
      { fout: 'Too much weight too soon', beter: 'This is a technique exercise. Build up calmly and keep every rep clean.' },
    ],
    ademhaling: 'Breathe in and brace before you lower, breathe out when you are almost upright.',
    tempo: '3 counts down, a short pause, 1 to 2 counts up.',
    makkelijker: 'Do the movement with a stick along your back to feel whether your back stays straight.',
  },
  'Thruster met barbell': {
    kernpunten: [
      { punt: 'Elbows high', uitleg: 'The bar rests on the front of your shoulders with your elbows forward. That keeps your torso upright in the squat.' },
      { punt: 'Knees in line with your toes', uitleg: 'Push your knees slightly out as you lower. Do not let them cave in.' },
      { punt: 'One fluid movement', uitleg: 'The drive from your legs flows into the press overhead. Not a squat followed by a separate press.' },
      { punt: 'Bar over your midfoot', uitleg: 'At the top the bar is right above your midfoot, arms next to your ears and your head slightly through your arms.' },
      { punt: 'Ribs down at the top', uitleg: 'Brace your core and glutes so your back does not arch when your arms are straight.' },
    ],
    opstelling: [
      'Start with an empty bar or a light weight. Grip it just outside shoulder width and rest it on the front of your shoulders.',
      'Feet at shoulder width, toes slightly out, elbows forward.',
    ],
    stappen: [
      'Lower into a front squat until your thighs are about horizontal, chest up.',
      'Drive up powerfully and press the bar straight overhead in the same movement.',
      'Bring the bar back to your shoulders under control and go straight into the next squat.',
    ],
    fouten: [
      { fout: 'Elbows drop in the squat', beter: 'Keep your elbows high and your chest open. Go less deep if the bar rolls forward.' },
      { fout: 'Bar travels in an arc around your head', beter: 'Briefly pull your head back and press the bar straight up past your face.' },
      { fout: 'Arched back during the press', beter: 'Brace your core and glutes at the top. Your arms go up, your ribs stay down.' },
      { fout: 'Bar drops hard onto your shoulders', beter: 'Catch it with your arms and bend your knees slightly before you go into the squat again.' },
    ],
    ademhaling: 'Breathe in and brace before you lower, breathe out forcefully during the press.',
    tempo: '2 counts down, explosive up and through the press.',
    makkelijker: 'Use an empty bar or do the thruster with light dumbbells.',
    zwaarder: 'Add weight in small steps or do a set number of reps against the clock.',
  },
  'Squat met lichaamsgewicht': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Lower as if sitting on a chair just behind you. Your hips go back and down.' },
      { punt: 'Knees follow your toes', uitleg: 'Your knees move in the direction of your toes. They do not cave in.' },
      { punt: 'Heels on the floor', uitleg: 'Your whole foot stays flat. You feel the weight on your midfoot and heels.' },
      { punt: 'Chest up', uitleg: 'Arms out in front help you balance. Your back stays straight.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips and your toes turned slightly out.',
      'Reach your arms forward at shoulder height or hold your hands in front of your chest.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Lower your hips back and down, as deep as you can with a straight back.',
      'Push the floor away and stand up, glutes squeezed.',
    ],
    fouten: [
      { fout: 'Knees cave in', beter: 'Push your knees out, in line with your toes.' },
      { fout: 'Heels come up', beter: 'Sit back more and keep your weight on your midfoot and heels. Widen your stance slightly if needed.' },
      { fout: 'Rounded back at the bottom', beter: 'Go less deep. Depth comes naturally as your mobility improves.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you stand up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Squat to a bench or hold on to a rack.',
    zwaarder: 'Hold a dumbbell in front of your chest (goblet squat) or lower over 4 counts.',
  },
  'Achterwaartse lunge': {
    kernpunten: [
      { punt: 'Big step back', uitleg: 'With a long step your front knee stays over your foot and you feel the work in your glute and thigh.' },
      { punt: 'Weight on your front heel', uitleg: 'Your front leg does the work. The back leg is mainly support and balance.' },
      { punt: 'Torso upright', uitleg: 'Chest up and eyes forward, core lightly braced. That keeps your lower back calm.' },
      { punt: 'Lower straight down', uitleg: 'Think of an elevator: your hip drops vertically, not forward. Back knee stops just above the floor.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your hands on your hips or in front of your chest.',
      'Stand next to a rack or wall if your balance is still shaky, so you can hold on.',
    ],
    stappen: [
      'Take a big step back with one leg and place the ball of that foot down.',
      'Lower under control until both knees are at about a right angle.',
      'Drive through the heel of your front foot and bring your back leg back next to the other one.',
      'Switch legs or first do all reps on one side.',
    ],
    fouten: [
      { fout: 'Step back too small', beter: 'Step further back, so your front heel stays down and your weight rests on your front leg.' },
      { fout: 'Front knee caves in', beter: 'Push your knee slightly out, towards your second and third toe.' },
      { fout: 'Pushing off with the back leg', beter: 'Come up from your front leg. The back leg only follows.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push back up.',
    tempo: 'Per leg: 2 counts down, a short pause, 1 count back.',
    makkelijker: 'Hold on to a rack or wall and lower less deep.',
    zwaarder: 'Hold a dumbbell in each hand or a kettlebell in front of your chest.',
  },
  'Split squat': {
    kernpunten: [
      { punt: 'Feet stay put', uitleg: 'You do not step. You place your feet once and then only move up and down.' },
      { punt: 'Lower straight down', uitleg: 'Your hip drops like an elevator. Back knee stops just above the floor.' },
      { punt: 'Torso upright', uitleg: 'Chest up and core lightly braced. Your shoulders stay above your hips.' },
      { punt: 'Weight on the front leg', uitleg: 'Push up through your whole front foot. The back leg is support.' },
    ],
    opstelling: [
      'Take a big stride: front foot flat, back foot on the ball, feet hip width apart side by side.',
      'Put your hands on your hips or hold a rack if your balance wobbles.',
    ],
    stappen: [
      'Lower straight down until your back knee is just above the floor.',
      'Push back up through your front foot.',
      'Do all reps on this leg, then switch.',
    ],
    fouten: [
      { fout: 'Sliding forward as you lower', beter: 'Lower straight down. Your front knee may travel forward, but your hip stays in the middle.' },
      { fout: 'Front heel comes up', beter: 'Place your feet further apart and consciously press your heel into the floor.' },
      { fout: 'Torso slumps forward', beter: 'Chest up and eyes forward. A slight forward lean is fine, collapsing is not.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: 'Per leg: 2 counts down, a short pause, 1 count up.',
    makkelijker: 'Lower less deep and hold on with one hand.',
    zwaarder: 'Hold a dumbbell in each hand or pause for 2 counts at the bottom.',
  },
  'Walking lunge met lichaamsgewicht': {
    kernpunten: [
      { punt: 'Hands on your hips', uitleg: 'That keeps your arms still and shows you right away whether your torso stays upright.' },
      { punt: 'Big step forward', uitleg: 'A long step gives two angles of about 90 degrees at the bottom and spares your front knee.' },
      { punt: 'Drive through your front heel', uitleg: 'Your front leg lifts you up and forward. You feel it in your glute and thigh.' },
      { punt: 'Knee off the floor', uitleg: 'Stop with your back knee just above the floor. Do not tap or bang it.' },
    ],
    opstelling: [
      'Make sure you have a clear lane of at least 10 metres.',
      'Stand with your feet hip width apart and your hands on your hips.',
    ],
    stappen: [
      'Take a big step forward and lower until your back knee almost touches the floor.',
      'Drive up through your front heel and bring your back leg forward into the next step.',
      'Repeat and keep walking at a calm rhythm.',
    ],
    fouten: [
      { fout: 'Feet on one line', beter: 'Walk at hip width, as if on two rails. That keeps you balanced.' },
      { fout: 'Torso falls forward', beter: 'Chest up and eyes forward. Lower straight down instead of forward.' },
      { fout: 'Speeding up', beter: 'Keep every step equally calm. Momentum makes the lunge sloppy and hard on your knee.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '2 counts down, 1 count up and on. Every step is one rep.',
    makkelijker: 'Bring your feet together briefly after each step and lower less deep.',
    zwaarder: 'Hold a dumbbell in each hand or walk a longer lane.',
  },
  'Zijwaartse lunge': {
    kernpunten: [
      { punt: 'Step wide to the side', uitleg: 'A long step gives you room to lower. Both feet point forward.' },
      { punt: 'Hips back', uitleg: 'Lower as if sitting sideways on a chair. Your knee stays over your foot.' },
      { punt: 'Other leg straight', uitleg: 'The leg you are not lowering on stays long. That is where you feel your inner thigh stretch.' },
      { punt: 'Whole foot on the floor', uitleg: 'Both feet stay flat. Push back through the heel of your bent leg.' },
    ],
    opstelling: [
      'Stand tall with your feet together and your hands in front of your chest.',
    ],
    stappen: [
      'Step wide to the side and lower onto that leg, hips back and chest up.',
      'Lower until your thigh is about horizontal or as far as you can with a straight back.',
      'Push yourself back to the middle powerfully and switch sides.',
    ],
    fouten: [
      { fout: 'Knee shoots far past the toes', beter: 'Move your hips further back, so your weight stays on the middle of your foot and your heel.' },
      { fout: 'Torso folds forward', beter: 'Chest up and eyes forward. Lower less deep if needed.' },
      { fout: 'Heel comes off the floor', beter: 'Make the step slightly smaller and press your whole foot into the floor.' },
    ],
    ademhaling: 'Breathe in as you lower to the side, breathe out as you push back.',
    tempo: 'Per side: 2 counts down, 1 count back to the middle.',
    makkelijker: 'Lower less deep and hold on to a rack in front of you.',
    zwaarder: 'Hold a dumbbell or kettlebell in front of your chest.',
  },
  'Calf raise met lichaamsgewicht': {
    kernpunten: [
      { punt: 'As high as you can', uitleg: 'Push until you are really on the balls of your feet. The last centimetres are the hardest and the most useful.' },
      { punt: 'Press through your big toe', uitleg: 'That keeps your ankle straight and stops your foot rolling to the outside.' },
      { punt: 'Knees straight, not locked', uitleg: 'Your legs stay straight but not locked. Your calves lift you, not your knees.' },
      { punt: 'Lower slowly', uitleg: 'Lower calmly until your heels touch the floor. Do not drop and bounce straight back up.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your toes pointing straight ahead.',
      'Hold a wall or rack if your balance wobbles.',
    ],
    stappen: [
      'Push yourself up through the balls of your feet until you are as high on your toes as possible.',
      'Hold for one count at the top and squeeze your calves.',
      'Lower your heels over 2 to 3 counts until they touch the floor.',
    ],
    fouten: [
      { fout: 'Half range, fast up and down', beter: 'Use the full range from heels on the floor to high on your toes, and count calmly.' },
      { fout: 'Weight on the outside of your foot', beter: 'Push up mainly through your big toe. That keeps your ankle straight and stable.' },
      { fout: 'Bouncing with the knees', beter: 'Keep your legs straight. If you bend your knees, your thighs do the work.' },
    ],
    ademhaling: 'Breathe out as you rise, breathe in as your heels lower.',
    tempo: '1 count up, hold for 1 count, 3 counts down.',
    makkelijker: 'Hold a rack with both hands and do fewer reps.',
    zwaarder: 'Do it on one leg, or hold a dumbbell in the hand on the side of your standing leg.',
  },
  'Squat jump': {
    kernpunten: [
      { punt: 'Short squat, then explode', uitleg: 'Do not go too deep, about a quarter to half squat, and jump up powerfully right away.' },
      { punt: 'Land softly', uitleg: 'Land on the balls of your feet and roll through to your heels. Bend your knees and hips, as if landing without a sound.' },
      { punt: 'Knees out', uitleg: 'On take off and landing your knees point the same way as your toes.' },
      { punt: 'Arms help', uitleg: 'Swing your arms back as you dip and up as you jump.' },
    ],
    opstelling: [
      'Stand on a firm, non slippery surface with your feet hip width apart.',
      'Make sure there is enough space above and around you.',
    ],
    stappen: [
      'Dip quickly into a short squat and swing your arms back.',
      'Jump up explosively, extending your hips, knees and ankles.',
      'Land softly and absorb the landing in a short squat.',
      'Pause briefly or jump again right away once you control the landing.',
    ],
    fouten: [
      { fout: 'Landing hard and stiff', beter: 'Give at the landing. If you can hear your landing, it is too hard.' },
      { fout: 'Knees cave in on landing', beter: 'Land with your knees over your feet. Jump lower until that goes well.' },
      { fout: 'Carrying on when tired', beter: 'Stop when your jumps get lower or sloppier. Quality over quantity.' },
    ],
    ademhaling: 'Breathe out sharply on take off, breathe in on landing.',
    tempo: 'Explosive up, soft landing, controlled into the next rep.',
    makkelijker: 'Do a fast bodyweight squat and rise onto your toes without jumping.',
    zwaarder: 'Jump higher or do the box jump.',
  },
}
