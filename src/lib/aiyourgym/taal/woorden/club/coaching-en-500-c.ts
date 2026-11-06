// Engelse coaching van de uitbreiding van migratie 500, deel C (vloer en romp).
// Het Nederlands (coaching/uitbreiding-500-c.ts) is de bron.

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_500_C: Readonly<Record<string, Coaching>> = {
  'Frog pump': {
    kernpunten: [
      { punt: 'Soles together', uitleg: 'The soles of your feet touch and your knees fall out. That makes your glutes work extra.' },
      { punt: 'Squeeze hard at the top', uitleg: 'The movement is small. Squeeze your glutes as hard as you can at the top.' },
      { punt: 'Lower back neutral', uitleg: 'Do not push through into an arched back. Your ribs stay down.' },
    ],
    opstelling: [
      'Lie on your back with the soles of your feet together and your knees out.',
      'Rest your arms next to your body on the floor.',
    ],
    stappen: [
      'Push your hips up by squeezing your glutes.',
      'Hold briefly at the top.',
      'Lower calmly until your glutes are just above the floor.',
    ],
    fouten: [
      { fout: 'Arched back at the top', beter: 'Stop earlier and brace your core.' },
      { fout: 'Too fast in a row', beter: 'Hold for one count at the top every time.' },
    ],
    ademhaling: 'Breathe out as you push up and in as you lower.',
    tempo: '1 count up, 1 count hold, 1 count down.',
    makkelijker: 'Choose the glute bridge with your feet flat.',
    zwaarder: 'Place a dumbbell on your hips.',
  },
  'Hip thrust op een been': {
    kernpunten: [
      { punt: 'Hips stay level', uitleg: 'The side of your free leg does not drop. Your hips stay at the same height.' },
      { punt: 'Drive through your heel', uitleg: 'Your weight is on the heel of your standing leg. That makes your glute work most.' },
      { punt: 'Chin slightly tucked', uitleg: 'Look forward, not at the ceiling. Your ribs stay down.' },
    ],
    opstelling: [
      'Lean your upper back against a bench.',
      'Place one foot flat on the floor and extend your other leg upwards.',
    ],
    stappen: [
      'Push your hips up until you are straight from knee to shoulder.',
      'Squeeze your glute at the top.',
      'Lower calmly and switch legs after the set.',
    ],
    fouten: [
      { fout: 'Hip drops on the free side', beter: 'Brace your core and go less high.' },
      { fout: 'Arched back at the top', beter: 'Chin to your chest and ribs down.' },
    ],
    ademhaling: 'Breathe out as you push up and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose the single leg glute bridge on the floor.',
    zwaarder: 'Place a dumbbell on your hips.',
  },
  'Donkey kick': {
    kernpunten: [
      { punt: 'Knee stays bent', uitleg: 'Your knee stays at a right angle. You push the sole of your foot to the ceiling.' },
      { punt: 'Back stays straight', uitleg: 'Your lower back does not arch. Stop when your thigh is in line with your torso.' },
      { punt: 'Work from your glute', uitleg: 'You feel it in your glute, not in your lower back.' },
    ],
    opstelling: [
      'Get on your hands and knees with your hands under your shoulders and your knees under your hips.',
    ],
    stappen: [
      'Push one foot with a bent knee up towards the ceiling.',
      'Stop when your thigh is in line with your torso and squeeze your glute.',
      'Lower your leg calmly and switch after the set.',
    ],
    fouten: [
      { fout: 'Arched lower back', beter: 'Brace your core and lift your leg less high.' },
      { fout: 'Swinging the leg', beter: 'Go slowly and hold briefly at the top.' },
    ],
    ademhaling: 'Breathe out as you push up and in as you lower.',
    tempo: '1 count up, 1 count hold, 1 count down.',
    makkelijker: 'Make the movement smaller.',
    zwaarder: 'Put a band around your feet or knees.',
  },
  'Fire hydrant': {
    kernpunten: [
      { punt: 'Torso stays still', uitleg: 'Your torso does not tilt to the other side. Only your leg moves.' },
      { punt: 'Knee bent', uitleg: 'Your knee stays at a right angle as you lift it to the side.' },
      { punt: 'Arms straight', uitleg: 'Your arms stay straight and your weight in the middle.' },
    ],
    opstelling: [
      'Get on your hands and knees with your hands under your shoulders and your knees under your hips.',
    ],
    stappen: [
      'Lift one bent leg to the side until your knee is at hip height.',
      'Hold briefly.',
      'Lower your leg calmly and switch after the set.',
    ],
    fouten: [
      { fout: 'Torso leans away', beter: 'Keep your shoulders square and lift your leg less high.' },
      { fout: 'Too fast', beter: 'Go slowly and hold for one count at the top.' },
    ],
    ademhaling: 'Breathe out as you lift and in as you lower.',
    tempo: '1 count up, 1 count hold, 1 count down.',
    makkelijker: 'Make the movement smaller.',
    zwaarder: 'Put a band around your knees.',
  },
  'Archer push-up': {
    kernpunten: [
      { punt: 'Body is a plank', uitleg: 'Your body stays a straight line from head to heels.' },
      { punt: 'Straight arm supports', uitleg: 'Your straight arm only supports. The bent arm does the work.' },
      { punt: 'Side to side', uitleg: 'Lower towards one hand and then the other in turns.' },
    ],
    opstelling: [
      'Get into a push-up with your hands very wide and your fingers angled out.',
    ],
    stappen: [
      'Lower towards one hand while your other arm stays straight.',
      'Push back to the middle.',
      'Then lower towards the other hand.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Brace your core and glutes.' },
      { fout: 'Straight arm bends too', beter: 'Keep that arm straight. Go less deep if it does not work yet.' },
    ],
    ademhaling: 'Breathe in as you lower and out as you push up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Do it with your hands on a bench.',
    zwaarder: 'Pause for 2 counts at the bottom.',
  },
  'Plank shoulder tap': {
    kernpunten: [
      { punt: 'Hips stay still', uitleg: 'Your hips do not sway from side to side when you lift a hand.' },
      { punt: 'Feet wide', uitleg: 'With your feet wide you are more stable. Closer together is harder.' },
      { punt: 'Tap calmly', uitleg: 'Tap your shoulder calmly. Speed is not the goal.' },
    ],
    opstelling: [
      'Hold a high plank with your hands under your shoulders and your feet hip width apart.',
    ],
    stappen: [
      'Tap your opposite shoulder with one hand.',
      'Place your hand back on the floor.',
      'Do the same with the other hand.',
    ],
    fouten: [
      { fout: 'Hips rotate along', beter: 'Widen your feet and brace your core.' },
      { fout: 'Hips sag', beter: 'Glutes on and body in a straight line.' },
    ],
    ademhaling: 'Breathe calmly, out on every tap.',
    tempo: 'About one tap per 2 counts.',
    makkelijker: 'Do it from your knees.',
    zwaarder: 'Place your feet closer together.',
  },
  'Bear crawl': {
    kernpunten: [
      { punt: 'Knees low', uitleg: 'Your knees hover a few centimetres above the floor.' },
      { punt: 'Back flat', uitleg: 'Your back stays flat like a table. Your hips do not rise.' },
      { punt: 'Hand and foot together', uitleg: 'Move your opposite hand and foot at the same time. Small steps.' },
    ],
    opstelling: [
      'Get on your hands and feet with your hands under your shoulders and your knees under your hips.',
      'Lift your knees a few centimetres off the floor.',
    ],
    stappen: [
      'Lift one hand and the opposite foot a few centimetres at the same time and put them down again.',
      'Do the same with the other hand and foot.',
      'Crawl like this on the spot or a little forward, without putting your knees down.',
    ],
    fouten: [
      { fout: 'Hips rise', beter: 'Keep your knees low and your back flat.' },
      { fout: 'Steps too big', beter: 'Take small steps, then your torso stays still.' },
    ],
    ademhaling: 'Breathe calmly.',
    tempo: 'Calm and steady, for time or distance.',
    makkelijker: 'Hold your knees above the floor without crawling.',
    zwaarder: 'Also crawl backwards or sideways.',
  },
  'V-up': {
    kernpunten: [
      { punt: 'Roll your torso up', uitleg: 'Roll your torso up from your abs. You do not throw yourself up with a straight back.' },
      { punt: 'Legs straight', uitleg: 'Your legs stay straight and rise together with your torso.' },
      { punt: 'Lower calmly', uitleg: 'Lower under control until you are just above the floor.' },
    ],
    opstelling: [
      'Lie on your back with your legs straight and your arms straight behind your head.',
    ],
    stappen: [
      'Lift your straight legs and your torso at the same time.',
      'Reach for your feet with your hands.',
      'Lower calmly without fully relaxing.',
    ],
    fouten: [
      { fout: 'Swinging to get up', beter: 'Go slower or bend your knees.' },
      { fout: 'Lower back drops onto the floor', beter: 'Lower under control and brace your core.' },
    ],
    ademhaling: 'Breathe out as you come up and in as you lower.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Bend your knees as you come up.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Flutter kicks': {
    kernpunten: [
      { punt: 'Lower back on the floor', uitleg: 'Your lower back stays against the floor. If it lifts, raise your legs higher.' },
      { punt: 'Small kicks', uitleg: 'Your legs move up and down in small kicks in turns.' },
      { punt: 'Legs straight', uitleg: 'Your legs stay straight with your toes lightly pointed.' },
    ],
    opstelling: [
      'Lie on your back with your hands next to your hips or under your glutes.',
      'Lift your straight legs a little off the floor.',
    ],
    stappen: [
      'Move your legs up and down in small kicks in turns.',
      'Keep your lower back against the floor.',
      'Keep going until the time is up.',
    ],
    fouten: [
      { fout: 'Lower back lifts', beter: 'Raise your legs higher or make the kicks smaller.' },
      { fout: 'Holding your breath', beter: 'Breathe calmly at a steady rhythm.' },
    ],
    ademhaling: 'Breathe calmly and rhythmically.',
    tempo: 'Brisk and steady, for time.',
    makkelijker: 'Raise your legs higher or bend your knees a little.',
    zwaarder: 'Keep your legs lower above the floor.',
  },
  'Hollow rock': {
    kernpunten: [
      { punt: 'Fixed curve', uitleg: 'Your body stays one fixed curve, like a banana. You do not lose the shape.' },
      { punt: 'Lower back stays round', uitleg: 'Your lower back stays slightly rounded against the floor. You do not arch.' },
      { punt: 'Rock from the whole shape', uitleg: 'The rock comes from your whole shape, not from your legs or arms.' },
    ],
    opstelling: [
      'Lie on your back in the hollow hold: lower back on the floor, shoulders and straight legs lifted.',
      'Stretch your arms alongside your ears.',
    ],
    stappen: [
      'Rock towards your shoulders.',
      'Rock back towards your glutes without losing the shape.',
      'Keep going at a calm rhythm.',
    ],
    fouten: [
      { fout: 'Shape falls apart', beter: 'Make the rock smaller or bend your knees.' },
      { fout: 'Arched back', beter: 'Raise your legs higher until your lower back is rounded again.' },
    ],
    ademhaling: 'Breathe calmly in short breaths and keep your core tight.',
    tempo: 'Calmly back and forth, for time.',
    makkelijker: 'Choose the hollow hold without rocking.',
    zwaarder: 'Make the rock bigger with your arms and legs lower.',
  },
  'Copenhagen plank': {
    kernpunten: [
      { punt: 'Body straight', uitleg: 'Your body is one straight line from head to foot. Your hips do not sag.' },
      { punt: 'Top leg carries', uitleg: 'Your top leg presses into the bench. You feel it on the inside of your thigh.' },
      { punt: 'Start with your knee', uitleg: 'With your knee on the bench it is lighter. With your foot on it, it is much harder.' },
    ],
    opstelling: [
      'Lie on your side next to a bench with your forearm under your shoulder.',
      'Place the inside of your top ankle on the bench, or your knee if it needs to be easier.',
    ],
    stappen: [
      'Lift your hips until your body is straight.',
      'Let your bottom leg hang loose or lift it towards the bench.',
      'Hold and switch sides when the time is up.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Place your knee on the bench instead of your foot.' },
      { fout: 'Hips rotate away', beter: 'Keep your hips stacked and your torso straight.' },
    ],
    ademhaling: 'Breathe calmly, do not hold your breath.',
    tempo: 'Hold, for time.',
    makkelijker: 'Place your knee on the bench and hold for less time.',
    zwaarder: 'Place your foot on the bench and lift your bottom leg along.',
  },
}
