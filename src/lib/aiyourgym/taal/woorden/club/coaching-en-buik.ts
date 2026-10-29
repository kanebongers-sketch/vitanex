// Engelse coaching van de buikoefeningen uit golf 1A (29-10-2026). Het
// Nederlands in de oefenbibliotheek (src/lib/club/training/coaching) is de bron;
// dit zegt precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_BUIK: Readonly<Record<string, Coaching>> = {
  Crunch: {
    kernpunten: [
      { punt: 'Shoulders off the floor', uitleg: 'You only curl up your upper back. Your lower back stays down, a small movement is enough.' },
      { punt: 'Do not pull on your neck', uitleg: 'Your fingers only touch your head lightly. Your neck relaxes, your abs do the work.' },
      { punt: 'Space under your chin', uitleg: 'Keep a fist of space between chin and chest. Look diagonally up at the ceiling.' },
      { punt: 'Lower slowly', uitleg: 'Lower calmly and do not let your head drop to the floor. That part counts too.' },
    ],
    opstelling: [
      'Lie on your back with your knees bent and your feet flat, hip width apart.',
      'Place your fingertips at your temples or cross your arms over your chest.',
    ],
    stappen: [
      'Brace your core and draw your belly button in slightly.',
      'Curl your head and shoulders up until your shoulder blades just leave the floor.',
      'Hold briefly and feel your abs contract.',
      'Roll back down slowly until your shoulders are down again.',
    ],
    fouten: [
      { fout: 'Pulling the head up with the hands', beter: 'Cross your arms over your chest. Once that works, your hands may go lightly back to your head.' },
      { fout: 'Coming all the way up to sitting', beter: 'Stop once your shoulder blades are off the floor. Going higher takes the work out of your abs.' },
      { fout: 'Fast and with momentum', beter: 'Count calmly. Better 12 controlled reps than 30 with a swing.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Keep your arms straight by your sides and slide your hands towards your heels.',
    zwaarder: 'Hold a weight plate against your chest or hold the top for 3 counts.',
  },
  'Reverse crunch': {
    kernpunten: [
      { punt: 'Curl your pelvis up', uitleg: 'You roll your glutes off the floor by bringing your pelvis towards your ribs. A few centimetres is enough.' },
      { punt: 'No leg swing', uitleg: 'Your knees stay at the same angle. If you swing, your legs do the work instead of your abs.' },
      { punt: 'Roll back slowly', uitleg: 'Roll back one vertebra at a time until your glutes are down again. Do not drop.' },
      { punt: 'Hands relaxed', uitleg: 'Your arms rest by your sides for balance. If you push hard, your arms help too much.' },
    ],
    opstelling: [
      'Lie on your back with your arms by your sides and your palms on the floor.',
      'Lift your legs until your bent knees are above your hips.',
    ],
    stappen: [
      'Brace your core and draw your belly button in.',
      'Curl your pelvis up so your glutes just leave the floor.',
      'Roll back under control until your knees are above your hips again.',
    ],
    fouten: [
      { fout: 'Swinging the legs towards the head', beter: 'Keep your knees at a fixed angle and only move your pelvis. Start every rep from stillness.' },
      { fout: 'Pushing with the hands', beter: 'Rest your hands lightly or lift them a few centimetres off the floor.' },
      { fout: 'Dropping back to the floor', beter: 'Lower over 2 counts. Braking counts just as much as curling up.' },
    ],
    ademhaling: 'Breathe out as you curl your pelvis up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 counts back.',
    makkelijker: 'Start with your feet on the floor and only lift your pelvis slightly.',
    zwaarder: 'Do it on an incline bench with your head higher than your hips.',
  },
  'Leg raise liggend': {
    kernpunten: [
      { punt: 'Lower back on the floor', uitleg: 'The lower your legs go, the more your back wants to arch. It stays down, and that decides how low you go.' },
      { punt: 'Lower slowly', uitleg: 'Lowering is the hard part. Brake your legs, do not let them drop.' },
      { punt: 'Legs together and long', uitleg: 'Keep your feet together and your legs almost straight. That keeps the movement calm and tight.' },
      { punt: 'Do not tap the floor', uitleg: 'Stop just above the floor. That keeps the tension on your abs for the whole set.' },
    ],
    opstelling: [
      'Lie on your back on a mat with your hands flat under your glutes.',
      'Straighten your legs and keep your feet together.',
    ],
    stappen: [
      'Press your lower back into the floor and brace your core.',
      'Lift your legs until they point straight up.',
      'Lower them over 3 counts until just above the floor.',
    ],
    fouten: [
      { fout: 'Lower back lifts and arches', beter: 'Bend your knees a little or lower your legs less far. Back on the floor comes before depth.' },
      { fout: 'Letting the legs drop', beter: 'Count 3 counts out loud on the way down. If you can no longer do that, end the set.' },
      { fout: 'Swinging up with momentum', beter: 'Start every rep from stillness just above the floor.' },
    ],
    ademhaling: 'Breathe out as you lift your legs and breathe in as they lower.',
    tempo: '2 counts up, 3 counts down.',
    makkelijker: 'Bend your knees to a right angle, or lower one leg at a time.',
    zwaarder: 'Lift your pelvis slightly off the floor at the top, or hold your legs 5 cm above the floor.',
  },
  'Hollow hold': {
    kernpunten: [
      { punt: 'Lower back into the mat', uitleg: 'Your lower back stays against the floor the whole time. That matters more than how low your legs are.' },
      { punt: 'Ribs down', uitleg: 'Pull your ribs towards your hips, as if pressing your stomach flat.' },
      { punt: 'Long and low', uitleg: 'Arms next to your ears and legs straight, both a little off the floor.' },
      { punt: 'Keep breathing calmly', uitleg: 'Take short, calm breaths in and out without letting go of your core.' },
    ],
    opstelling: [
      'Lie on your back on a mat with your arms overhead and your legs straight.',
    ],
    stappen: [
      'Press your lower back into the mat and brace your core.',
      'Lift your shoulders, arms and legs a little until you form a slight banana shape.',
      'Hold this position for the agreed time and then lower everything calmly.',
    ],
    fouten: [
      { fout: 'Lower back lifts', beter: 'Lift your legs higher or bend your knees until your lower back is against the floor again.' },
      { fout: 'Neck pulls up', beter: 'Chin slightly towards your chest and look at your toes. The movement comes from your abs.' },
      { fout: 'Holding the breath', beter: 'Keep taking short, calm breaths. If you cannot, make the position easier.' },
    ],
    ademhaling: 'Keep breathing calmly while you hold your core braced.',
    tempo: 'Hold for 15 to 30 seconds and build up.',
    makkelijker: 'Bend your knees and keep your arms by your sides.',
    zwaarder: 'Hold longer, or rock gently back and forth without losing the position.',
  },
  'Dead bug': {
    kernpunten: [
      { punt: 'Lower back on the floor', uitleg: 'This is the whole exercise. If your lower back lifts, you reach too far. It stays down the whole time.' },
      { punt: 'Extend slowly', uitleg: 'The slower your arm and leg move, the harder your abs have to work to stay still.' },
      { punt: 'Ribs down', uitleg: 'Your ribs drop towards your pelvis. That keeps your torso short and firm.' },
      { punt: 'Move crosswise', uitleg: 'Left arm with right leg, then right arm with left leg. The other arm and leg stay still.' },
    ],
    opstelling: [
      'Lie on your back with your arms straight up above your shoulders.',
      'Lift your legs with your knees at a right angle above your hips.',
    ],
    stappen: [
      'Gently press your lower back into the floor and brace your core.',
      'Reach your left arm behind your head and extend your right leg to just above the floor.',
      'Bring them back to the middle under control.',
      'Repeat with the other arm and the other leg.',
    ],
    fouten: [
      { fout: 'Arched back when the leg gets low', beter: 'Extend your leg less far or keep it higher. Only go further once your back stays down.' },
      { fout: 'Going back and forth too fast', beter: 'Count 3 counts per extension. It is about control, not numbers.' },
      { fout: 'Holding the breath', beter: 'Breathe out as you extend. If you cannot breathe calmly, the variation is too hard.' },
    ],
    ademhaling: 'Breathe out slowly as your arm and leg extend and breathe in as you come back.',
    tempo: '3 counts to extend, a short pause, 2 counts back.',
    makkelijker: 'Only move your legs and tap your heel on the floor while your knee stays bent.',
    zwaarder: 'Hold a light dumbbell in your hands or hold the extended position for 3 counts.',
  },
  'Crunch met draai': {
    kernpunten: [
      { punt: 'Shoulder to knee', uitleg: 'Your shoulder turns towards the opposite knee, not just your elbow. That is how your obliques really work.' },
      { punt: 'Curl up first, then rotate', uitleg: 'First come up a little, then rotate. Rotating flat on the floor does very little.' },
      { punt: 'Do not pull your head', uitleg: 'Your hands only touch your ears lightly. Your neck stays in line with your back.' },
      { punt: 'Hips stay down', uitleg: 'Your lower body does not move. Only your upper body rotates.' },
    ],
    opstelling: [
      'Lie on your back with your knees bent and your feet flat on the floor.',
      'Place your fingertips at your ears with your elbows wide.',
    ],
    stappen: [
      'Curl your shoulders off the floor by bracing your abs.',
      'Rotate your right shoulder towards your left knee.',
      'Lower under control back to the middle and to the floor.',
      'Repeat to the other side.',
    ],
    fouten: [
      { fout: 'Only snapping the elbow forward', beter: 'Keep your elbows wide and let your whole shoulder turn. The elbow follows by itself.' },
      { fout: 'Pulling on the head', beter: 'Take your hands off your head and cross them on your chest until the movement comes from your torso.' },
      { fout: 'Switching too fast', beter: 'Return to the middle on every rep. A calm pace, felt on each side.' },
    ],
    ademhaling: 'Breathe out as you curl up and rotate, breathe in as you lower.',
    tempo: '1 count up and rotate, a short pause, 2 counts back.',
    makkelijker: 'Cross your arms over your chest and only rotate a little.',
    zwaarder: 'Hold each rotation at the top for 2 counts or hold a light weight plate against your chest.',
  },
  'Fietsende crunch': {
    kernpunten: [
      { punt: 'Slowly, do not pedal', uitleg: 'It is not a race. Pause briefly on each twist, so your obliques do the work instead of momentum.' },
      { punt: 'Lower back stays down', uitleg: 'Your lower back stays against the floor, even as your leg extends. Extend higher if it lifts.' },
      { punt: 'Shoulder to knee', uitleg: 'Turn your whole shoulder towards the bent knee, not just your elbow.' },
      { punt: 'Really extend the leg', uitleg: 'The other leg extends fully. That makes the exercise hard and complete.' },
    ],
    opstelling: [
      'Lie on your back with your fingertips at your ears and your elbows wide.',
      'Lift your shoulders slightly off the floor and raise your legs with your knees above your hips.',
    ],
    stappen: [
      'Pull in your right knee and turn your left shoulder towards it while your left leg extends.',
      'Hold the twist for one count.',
      'Switch to the other side under control.',
    ],
    fouten: [
      { fout: 'Swinging fast back and forth', beter: 'Halve the pace. One rep every 2 counts is enough to really feel your abs.' },
      { fout: 'Only tapping with the elbows', beter: 'Keep your elbows wide and rotate from your chest. Your elbow does not need to touch your knee.' },
      { fout: 'Arched back when extending', beter: 'Extend your leg at a higher angle instead of low above the floor.' },
    ],
    ademhaling: 'Breathe out on every twist and breathe in as you pass through the middle.',
    tempo: '1 count to twist, hold for 1 count, switch calmly.',
    makkelijker: 'Keep your feet on the floor and only rotate your upper body side to side.',
    zwaarder: 'Extend your leg lower above the floor, as long as your lower back stays flat.',
  },
  'Russian twist': {
    kernpunten: [
      { punt: 'Back long, chest open', uitleg: 'Lean back with a long back, not a rounded one. That keeps the load on your abs and not your lower back.' },
      { punt: 'Rotate with your chest', uitleg: 'Your chest and shoulders turn too, not just your hands. Your hands follow your breastbone.' },
      { punt: 'Knees still', uitleg: 'Your knees keep pointing forward. If they sway along, you are not rotating from your torso.' },
      { punt: 'Calm pace', uitleg: 'Pause briefly on each side. Switching fast feels hard, but you are mostly swinging.' },
    ],
    opstelling: [
      'Sit on a mat with your knees bent and clasp your hands in front of your chest.',
      'Lean back slightly until your abs engage and lift your feet a little off the floor. If you still wobble, keep your heels lightly on the floor.',
    ],
    stappen: [
      'Set your torso with a long back.',
      'Rotate your chest and hands to the left.',
      'Come back through the middle and rotate to the right.',
    ],
    fouten: [
      { fout: 'Rounded lower back', beter: 'Sit up a little more and lift your chest. Leaning back less is fine.' },
      { fout: 'Only the arms move', beter: 'Keep your hands in front of your breastbone and let your shoulders rotate along.' },
      { fout: 'Leaning back too far', beter: 'Only lean back as far as your back stays long. Put your heels down if you start to wobble.' },
    ],
    ademhaling: 'Breathe out on every twist to the side and breathe in as you pass through the middle.',
    tempo: '1 count to twist, a short pause, 1 count back. Each side counts as one rep.',
    makkelijker: 'Put your heels on the floor, sit more upright and rotate less far.',
    zwaarder: 'Hold a weight plate or kettlebell in front of your chest.',
  },
}
