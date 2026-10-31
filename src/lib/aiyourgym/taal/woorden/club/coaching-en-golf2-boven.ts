// Engelse coaching van de Blender-oefeningen uit golf 2 (31-10-2026): op de bank,
// schouders, armen en roeien met dumbbells, EZ-stang en banken. Het Nederlands in
// de oefenbibliotheek (src/lib/club/training/coaching) is de bron; dit zegt
// precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'
import { COACHING_EN_GOLF2_ARMEN } from './coaching-en-golf2-armen'

export const COACHING_EN_GOLF2_BOVEN: Readonly<Record<string, Coaching>> = {
  'Dumbbell fly': {
    kernpunten: [
      { punt: 'Elbows slightly bent', uitleg: 'A small bend that stays the same for the whole rep. Your arms move as a fixed arc from your shoulders.' },
      { punt: 'Wide arc', uitleg: 'Lower the dumbbells out to the sides as if you hug a big barrel. You feel a stretch across your chest.' },
      { punt: 'Stop at a light stretch', uitleg: 'Go no further than your elbows at about bench height. Deeper mainly pulls on the front of your shoulder.' },
      { punt: 'Shoulder blades together', uitleg: 'Keep your shoulder blades together and your chest open, also at the bottom. That keeps the stretch in your chest.' },
    ],
    opstelling: [
      'Lie on a flat bench with the dumbbells above your chest, palms facing each other and elbows slightly bent.',
      'Feet flat on the floor and shoulder blades together.',
    ],
    stappen: [
      'Lower your arms out to the sides in a wide arc until you feel a light stretch in your chest.',
      'Bring them back along the same arc above your chest.',
      'Do not let the dumbbells tap together at the top, that keeps the tension on.',
    ],
    fouten: [
      { fout: 'Elbows bend more and more', beter: 'Lock the bend in. If your elbows bend a lot, it becomes a press. Use lighter dumbbells.' },
      { fout: 'Lowering too deep', beter: 'Stop when your elbows are at bench height. If it pulls at the front of your shoulder, make the arc smaller.' },
      { fout: 'Weight too heavy', beter: 'Go lighter. In the fly the stretch and the control count, not the kilos.' },
    ],
    ademhaling: 'Breathe in as your arms open and breathe out as you bring them back together.',
    tempo: '3 counts open, a short pause, 2 counts back.',
    makkelijker: 'Use the pec deck or make the arc smaller with even lighter dumbbells.',
    zwaarder: 'Pause in the stretch at the bottom for 2 counts before you come back.',
  },
  'Schuine dumbbell fly': {
    kernpunten: [
      { punt: 'Elbows slightly bent', uitleg: 'A small fixed bend, as if you hug a tree. You move from your shoulders.' },
      { punt: 'Palms facing each other', uitleg: 'Start with your palms facing each other above your chest. That keeps the movement kind to your shoulders.' },
      { punt: 'Stop at a light stretch', uitleg: 'Lower your arms until you feel a stretch in your upper chest, no further than your elbows at bench height.' },
      { punt: 'Back against the bench', uitleg: 'Your shoulder blades rest together against the bench. Your chest stays open.' },
    ],
    opstelling: [
      'Set the bench to 30 to 45 degrees and lie with the dumbbells above your chest, palms facing each other.',
      'Feet flat on the floor and elbows slightly bent.',
    ],
    stappen: [
      'Lower your arms out to the sides in a wide arc.',
      'Stop at a light stretch in your chest.',
      'Bring them back along the same arc above your chest.',
    ],
    fouten: [
      { fout: 'Elbows bend more and more', beter: 'Keep the bend the same. If it still happens, the weight is too heavy.' },
      { fout: 'Too deep into the stretch', beter: 'Stop with your elbows at bench height. Deeper puts strain on the front of your shoulder.' },
      { fout: 'Dumbbells drift towards your head', beter: 'Lower them out to the sides in line with your upper chest, not towards your ears.' },
    ],
    ademhaling: 'Breathe in as your arms open and breathe out as you bring them back.',
    tempo: '3 counts open, a short pause, 2 counts back.',
    makkelijker: 'Use lighter dumbbells and make the arc smaller.',
    zwaarder: 'Pause in the stretch at the bottom for 2 counts.',
  },
  'Pullover met dumbbell': {
    kernpunten: [
      { punt: 'Lower back on the bench', uitleg: 'Brace your core so your lower back does not arch when the dumbbell goes behind your head.' },
      { punt: 'Arms slightly bent', uitleg: 'A small fixed bend in your elbows. You move from your shoulders, not from your elbows.' },
      { punt: 'As far as comfortable', uitleg: 'Lower the dumbbell behind your head until you feel a stretch in your chest and sides, no further.' },
      { punt: 'Back to above your chest', uitleg: 'Bring the dumbbell along the same arc back to straight above your chest. Hold the tension there briefly.' },
    ],
    opstelling: [
      'Lie lengthwise on a flat bench with your feet flat on the floor.',
      'Hold a dumbbell with both hands on the inside of the plate, above your chest.',
    ],
    stappen: [
      'Lower the dumbbell in an arc behind your head with slightly bent arms.',
      'Stop at a comfortable stretch.',
      'Bring it back along the same arc above your chest.',
    ],
    fouten: [
      { fout: 'Arched lower back', beter: 'Brace your core and press your lower back towards the bench. Make the movement smaller if you cannot.' },
      { fout: 'Elbows bend and straighten', beter: 'Keep the bend the same. If your elbows start bending, it becomes a triceps exercise.' },
      { fout: 'Too far behind your head', beter: 'Stop when your upper arms are about beside your ears, or earlier if your shoulder pinches.' },
    ],
    ademhaling: 'Breathe in deeply as the dumbbell lowers behind your head and breathe out as you bring it back.',
    tempo: '3 counts down, a short pause, 2 counts back.',
    makkelijker: 'Use a lighter dumbbell and make the arc smaller.',
    zwaarder: 'Pause in the stretch at the bottom for 2 counts.',
  },
  'Skull crusher': {
    kernpunten: [
      { punt: 'Upper arms still', uitleg: 'Your upper arms stay in the same place, tilted slightly back. Only your elbows bend and straighten.' },
      { punt: 'Elbows towards your feet', uitleg: 'Your elbows point towards your feet, not out. That keeps the tension on your triceps.' },
      { punt: 'Bar towards your forehead', uitleg: 'Lower the bar to just above your forehead or slightly behind it. Your elbows stay in place.' },
      { punt: 'Light and controlled', uitleg: 'The bar comes down towards your head. Choose a weight you lower calmly, this is not an exercise to go heavy.' },
    ],
    opstelling: [
      'Lie on a flat bench with your feet flat on the floor and grip the EZ bar on the angled parts with your palms angled towards your feet.',
      'Hold the bar with straight arms above your chest and tilt your arms slightly back.',
    ],
    stappen: [
      'Bend your elbows and lower the bar towards your forehead.',
      'Stop just above your forehead with your elbows in place.',
      'Straighten your arms back to the start.',
    ],
    fouten: [
      { fout: 'Elbows flare out', beter: 'Keep your elbows at shoulder width and pointing towards your feet. If they drift out, go lighter.' },
      { fout: 'Upper arms move along', beter: 'Lock your upper arms. If they swing back and forth, it becomes a pullover and your triceps work less.' },
      { fout: 'Bar drops too fast', beter: 'Lower the bar over 2 to 3 counts. Close to your head you need full control.' },
    ],
    ademhaling: 'Breathe in as the bar lowers and breathe out as you straighten.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use two light dumbbells or do the triceps pushdown on the cable.',
    zwaarder: 'Lower the bar behind your head instead of to your forehead, that gives more stretch.',
  },
  'Triceps extension liggend met dumbbell': {
    kernpunten: [
      { punt: 'Elbows to the ceiling', uitleg: 'Your elbows point up and stay in the same place. Only your forearms move.' },
      { punt: 'Lower beside your head', uitleg: 'Lower the dumbbells in an arc beside your head. That way you feel a stretch in the back of your arms.' },
      { punt: 'Palms facing each other', uitleg: 'A dumbbell in each hand, palms facing each other. That keeps your wrists straight and your elbows calm.' },
      { punt: 'Calm tempo', uitleg: 'No momentum. Lower over 3 counts and straighten under control.' },
    ],
    opstelling: [
      'Lie on a flat bench with your feet flat on the floor.',
      'Hold a dumbbell in each hand with straight arms above your chest, palms facing each other.',
    ],
    stappen: [
      'Bend your elbows and lower the dumbbells in an arc beside your head.',
      'Stop at a good stretch in your triceps.',
      'Straighten your arms back to above your chest.',
    ],
    fouten: [
      { fout: 'Elbows drift out', beter: 'Keep your elbows at shoulder width and pointing at the ceiling. Go lighter if they keep drifting.' },
      { fout: 'Upper arms drop back too', beter: 'Lock your upper arms. If they move along, it becomes a pullover.' },
      { fout: 'Arched lower back', beter: 'Brace your core so your lower back stays on the bench.' },
    ],
    ademhaling: 'Breathe in as the dumbbells lower and breathe out as you straighten.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use lighter dumbbells and make the movement slightly smaller.',
    zwaarder: 'Pause at the bottom for 2 counts or lower the dumbbells over 4 counts.',
  },
  'Dumbbell shoulder press': {
    kernpunten: [
      { punt: 'Core tight', uitleg: 'A firm torso keeps your lower back neutral. Without tension your back arches as you press.' },
      { punt: 'Elbows slightly forward', uitleg: 'Elbows a little in front of your body, not straight out to the sides. That feels better in your shoulder joint.' },
      { punt: 'Wrists over elbows', uitleg: 'Your forearm stands upright under the dumbbell, so you press up in a straight line.' },
      { punt: 'Lower under control', uitleg: 'Let the dumbbells come back calmly to shoulder height, do not drop them.' },
    ],
    opstelling: [
      'Set the backrest of the bench upright or almost upright and sit with your feet firmly on the floor.',
      'Bring the dumbbells to your shoulders, palms facing forward or turned slightly towards each other.',
    ],
    stappen: [
      'Brace your core and press your back lightly against the backrest.',
      'Press the dumbbells up until they almost meet above your head, without locking your elbows.',
      'Lower them under control until your hands are at shoulder height again.',
    ],
    fouten: [
      { fout: 'Lower back arches', beter: 'Set the backrest a bit more upright, brace your core and keep your ribs down. If it is too heavy, choose lighter dumbbells.' },
      { fout: 'Elbows straight out to the sides', beter: 'Turn your elbows a little forward, about a hand width in front of your body.' },
      { fout: 'Half reps', beter: 'Lower the dumbbells until your hands are at shoulder height. The work is in the bottom part.' },
      { fout: 'Dumbbells tap together', beter: 'Stop just before they touch. That keeps the tension on your shoulders.' },
    ],
    ademhaling: 'Breathe in at the bottom, breathe out as you press up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Press one arm at a time or use the shoulder press machine.',
    zwaarder: 'Do the exercise standing, so your torso has to work harder to stay still.',
  },
  'Arnold press': {
    kernpunten: [
      { punt: 'Rotate as you press', uitleg: 'Your palms turn from facing you to facing forward as the dumbbells go up.' },
      { punt: 'Back against the backrest', uitleg: 'Your upper back and glutes stay against the bench. That way you press with your shoulders, not your back.' },
      { punt: 'Ribs down', uitleg: 'Brace your core so you do not arch your back as your arms go overhead.' },
      { punt: 'Start light', uitleg: 'The rotation makes this harder than a regular press. Choose a weight you control neatly.' },
    ],
    opstelling: [
      'Set the backrest almost upright and sit down with your feet flat on the floor.',
      'Hold the dumbbells in front of your shoulders with your palms facing you, elbows in front of your body.',
    ],
    stappen: [
      'Press the dumbbells up and turn your palms forward at the same time.',
      'Finish with straight arms above your shoulders.',
      'Lower the dumbbells and turn your hands back to the start position.',
    ],
    fouten: [
      { fout: 'Arched back', beter: 'Press your back against the backrest and keep your ribs down. Set the backrest more upright or use less weight.' },
      { fout: 'Rotating first, then pressing', beter: 'Make it one smooth movement: rotating and pressing happen at the same time.' },
      { fout: 'Dumbbells tap at the top', beter: 'Stop with the dumbbells above your shoulders, a small distance apart.' },
    ],
    ademhaling: 'Breathe out as you press, breathe in as you lower the dumbbells.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Do a regular dumbbell shoulder press without rotation.',
    zwaarder: 'Lower the dumbbells over 3 counts.',
  },
  'Lateral raise': {
    kernpunten: [
      { punt: 'Up to shoulder height', uitleg: 'Stop when your arms are horizontal. Higher shifts the work to your neck, not your shoulder.' },
      { punt: 'No swinging', uitleg: 'Your torso stays still. Choose a light weight you lift with control.' },
      { punt: 'Elbows lead', uitleg: 'Think of pushing your elbows out to the sides, your hands follow. That way you feel it on the side of your shoulder.' },
      { punt: 'Shoulders down', uitleg: 'Your shoulders drop away from your ears, your neck stays long and relaxed.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and a dumbbell beside each leg. Bend your elbows slightly and keep that angle the whole time.',
    ],
    stappen: [
      'Raise your arms out to the sides until your hands are at shoulder height.',
      'Pause briefly with the dumbbells level, your little finger no higher than your thumb.',
      'Lower your arms slowly to just beside your legs.',
    ],
    fouten: [
      { fout: 'Swinging with your body', beter: 'Choose a lighter weight and stand still. In this exercise light and neat beats heavy and sloppy.' },
      { fout: 'Shoulders shrug up', beter: 'Press your shoulders down before you start and think of making your arms long out to the sides.' },
      { fout: 'Arms above shoulder height', beter: 'Stop when your arms are horizontal, then the tension stays on your shoulder.' },
    ],
    ademhaling: 'Breathe out as you raise the dumbbells, breathe in as they lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Do the exercise seated on a bench or one arm at a time.',
    zwaarder: 'Lower the dumbbells more slowly or do the cable version for tension through the whole movement.',
  },
  'Front raise met dumbbells': {
    kernpunten: [
      { punt: 'No swing', uitleg: 'Your torso stays still. If you swing from your back, the weight is too heavy.' },
      { punt: 'To just above shoulder height', uitleg: 'Lifting higher adds little and puts more pressure on your shoulder. Eye level is your end point.' },
      { punt: 'Elbow slightly bent', uitleg: 'A small bend you hold, that spares your elbow and keeps the work in your shoulder.' },
      { punt: 'Lower slowly', uitleg: 'Take 2 counts for the way down. That is where your shoulder works the most.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and a dumbbell in front of each thigh, palms facing your legs. Core lightly braced.',
    ],
    stappen: [
      'Raise both arms forward with a small bend in your elbows to just above shoulder height.',
      'Pause briefly with the dumbbells side by side.',
      'Lower them slowly to in front of your thighs.',
    ],
    fouten: [
      { fout: 'Swinging from the hips', beter: 'Choose a lighter weight and squeeze your glutes and core. Only your arms move.' },
      { fout: 'Shoulders shrug to your ears', beter: 'Keep your shoulders down and your neck long as you raise your arms.' },
      { fout: 'Lifting too high', beter: 'Stop at eye level. Higher is not better for this exercise.' },
    ],
    ademhaling: 'Breathe out as you raise the dumbbells, breathe in as they lower.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Raise one arm at a time, alternating, or do the exercise seated so you cannot swing.',
    zwaarder: 'Pause at the top for 2 counts or use a weight plate with both hands.',
  },
  'Upright row met dumbbells': {
    kernpunten: [
      { punt: 'Elbows lead', uitleg: 'Pull up with your elbows, your hands follow. Your elbows stay higher than your wrists.' },
      { punt: 'Up to shoulder height', uitleg: 'Stop when your elbows are at shoulder height. Higher can pinch your shoulder.' },
      { punt: 'Close to your body', uitleg: 'The dumbbells stay just in front of your body for the whole movement.' },
      { punt: 'Torso still', uitleg: 'Do not swing or lean back. Your legs and back do not help.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart. Hold the dumbbells in front of your thighs with your palms facing you.',
    ],
    stappen: [
      'Pull the dumbbells up along your body with your elbows leading.',
      'Stop when your elbows are at shoulder height.',
      'Lower the dumbbells under control to in front of your thighs.',
    ],
    fouten: [
      { fout: 'Pulling too high', beter: 'Stop at shoulder height, especially if your shoulders are sensitive. If it pinches, stop a bit lower.' },
      { fout: 'Wrists higher than elbows', beter: 'Think of bringing your elbows to the ceiling. Your hands hang loosely below them.' },
      { fout: 'Swinging with your body', beter: 'Choose a lighter weight and keep your torso still. Only your arms move.' },
    ],
    ademhaling: 'Breathe out as you pull the dumbbells up, breathe in as they lower.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Pull less high, to just below your chest, or choose a lighter weight.',
    zwaarder: 'Hold the top for 2 counts or use a cable with a straight bar.',
  },
  'Schouders ophalen met dumbbells': {
    kernpunten: [
      { punt: 'Straight up and down', uitleg: 'Pull your shoulders straight up towards your ears. Rolling adds nothing and is less kind to your shoulder.' },
      { punt: 'Neck long', uitleg: 'Look straight ahead and keep your chin slightly tucked. Your head does not poke forward.' },
      { punt: 'Arms hang', uitleg: 'Your arms are just hooks. Do not pull with your elbows, the work is in your shoulders.' },
      { punt: 'Hold briefly', uitleg: 'Hold the top for one count. That is where you feel the top of your shoulders and your neck work hardest.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and a dumbbell beside each leg, palms facing you. Arms straight, core lightly braced.',
    ],
    stappen: [
      'Pull your shoulders straight up towards your ears.',
      'Hold the top for one count.',
      'Lower your shoulders calmly until they are all the way down.',
    ],
    fouten: [
      { fout: 'Rolling your shoulders', beter: 'Move only straight up and down. That is enough and calmer on your shoulder joint.' },
      { fout: 'Poking your head forward', beter: 'Keep your chin slightly tucked and look straight ahead, as if the back of your head rests against a wall.' },
      { fout: 'Tiny range with too much weight', beter: 'Choose a weight with which you really get your shoulders to your ears and lower them all the way again.' },
    ],
    ademhaling: 'Breathe out as you shrug up, breathe in as your shoulders lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Use lighter dumbbells and do not hold at the top.',
    zwaarder: 'Hold the top for 3 counts or use a bar or trap bar for more weight.',
  },
  'Voorovergebogen row met dumbbells': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Bend forward from your hips until your torso is at about 45 degrees. Knees slightly bent.' },
      { punt: 'Back straight and still', uitleg: 'Your torso does not move. If it comes up, the weight is too heavy.' },
      { punt: 'Elbows towards your hips', uitleg: 'Pull the dumbbells along your body towards your hips, not straight up to your chest.' },
      { punt: 'Shoulder blades together', uitleg: 'Squeeze your shoulder blades together at the top and let them go again at the bottom.' },
    ],
    opstelling: [
      'Take a dumbbell in each hand and stand with your feet hip width apart.',
      'Bend forward from your hips with a straight back, the dumbbells hanging below your shoulders.',
    ],
    stappen: [
      'Pull the dumbbells towards your hips, elbows along your body.',
      'Hold briefly with your shoulder blades together.',
      'Lower the dumbbells under control until your arms are straight.',
    ],
    fouten: [
      { fout: 'Torso comes up', beter: 'Keep your torso at the same angle. Use less weight if you have to swing.' },
      { fout: 'Rounded back', beter: 'Chest forward and core on. Bend forward less if your back rounds.' },
      { fout: 'Shoulders shrug up', beter: 'Think of bringing your elbows back, not of lifting your hands.' },
    ],
    ademhaling: 'Breathe out as you pull, breathe in as you lower the dumbbells.',
    tempo: '1 count pull, a short hold, 2 counts down.',
    makkelijker: 'Do the row on an incline bench, so your chest is supported.',
    zwaarder: 'Hold the top for 2 counts or use heavier dumbbells.',
  },
  'Row op een schuine bank': {
    kernpunten: [
      { punt: 'Chest on the bench', uitleg: 'Your chest stays against the bench the whole time. That gives your lower back a rest and only your back pulls.' },
      { punt: 'Elbows beside your torso', uitleg: 'Pull until your elbows are beside your body, not far behind it.' },
      { punt: 'Shoulders away from ears', uitleg: 'Pull your elbows back. Your shoulders stay down.' },
      { punt: 'Hang out at the bottom', uitleg: 'Let your arms straighten fully and your shoulder blades spread a little. Then you feel a stretch in your back.' },
    ],
    opstelling: [
      'Set the backrest to about 30 to 45 degrees and lie with your chest on it.',
      'Place your feet firmly on the floor or against the foot rest and let a dumbbell hang straight down in each hand.',
    ],
    stappen: [
      'Let the dumbbells hang with straight arms.',
      'Pull both dumbbells up until your elbows are beside your torso and squeeze your shoulder blades together.',
      'Lower them under control.',
    ],
    fouten: [
      { fout: 'Chest comes off the bench', beter: 'Keep contact with the bench. If you come up, the weight is too heavy.' },
      { fout: 'Head up and neck kinked', beter: 'Keep your head in line with your back, look at the floor or let your chin rest just over the edge.' },
      { fout: 'Shoulders shrug up', beter: 'Think of your elbows towards your hips, not your hands towards your armpits.' },
    ],
    ademhaling: 'Breathe out as you pull the dumbbells up and breathe in as they lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    zwaarder: 'Hold the top for 2 counts or row alternately with a pause at the top.',
  },
  'Reverse fly': {
    kernpunten: [
      { punt: 'Back straight', uitleg: 'Bend from your hips with a flat back. Your chest stays open, your lower back does not round.' },
      { punt: 'Arms wide to the sides', uitleg: 'Raise your arms out to the sides until they are in line with your torso, not back towards your hips.' },
      { punt: 'Neck relaxed', uitleg: 'Look at a point on the floor slightly ahead of you. Your head stays in line with your back.' },
      { punt: 'Light weight', uitleg: 'The back of your shoulder is a small muscle. With too much weight your back takes over.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and your knees slightly bent. Bend forward from your hips until your torso is almost horizontal, dumbbells hanging below your shoulders.',
    ],
    stappen: [
      'Raise the dumbbells out to the sides with a slight bend in your elbows.',
      'Stop when your arms are in line with your torso and briefly squeeze your shoulder blades together.',
      'Lower them calmly to below your shoulders.',
    ],
    fouten: [
      { fout: 'Torso comes up as you lift', beter: 'Stay bent forward. If you come up, you use your back to swing: choose a lighter weight.' },
      { fout: 'Rounded lower back', beter: 'Push your hips back and keep your chest open. Bend your knees more if your hamstrings are tight.' },
      { fout: 'Craning your neck up', beter: 'Look at the floor in front of you. Your neck stays long in line with your back.' },
    ],
    ademhaling: 'Breathe out as you raise your arms, breathe in as they lower.',
    tempo: '1 count up, a short hold, 2 counts down.',
    makkelijker: 'Do the exercise lying on an incline bench, so your back does not have to hold anything.',
    zwaarder: 'Hold the top for 2 counts or lower the dumbbells more slowly.',
  },
  ...COACHING_EN_GOLF2_ARMEN,
}
