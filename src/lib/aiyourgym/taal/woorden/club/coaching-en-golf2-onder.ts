// Engelse coaching van de Blender-oefeningen uit golf 2 (31-10-2026): squat,
// lunge, hinge en dragen met dumbbells en kettlebell. Het Nederlands in de
// oefenbibliotheek (src/lib/club/training/coaching) is de bron; dit zegt precies
// hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF2_ONDER: Readonly<Record<string, Coaching>> = {
  'Goblet squat': {
    kernpunten: [
      { punt: 'Weight against your chest', uitleg: 'Hold the dumbbell or kettlebell close to your breastbone. That keeps your torso upright on its own.' },
      { punt: 'Elbows between your knees', uitleg: 'At the bottom your elbows drop between your knees. That helps you push your knees out.' },
      { punt: 'Heels on the floor', uitleg: 'Your whole foot stays flat. Feel the weight on your midfoot and heels.' },
      { punt: 'Chest up', uitleg: 'Look ahead and keep your chest proud. Your back stays neutral, also at the bottom.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips and your toes turned out a little.',
      'Hold a dumbbell upright with both hands under the top plate, or a kettlebell by the handle, against your chest.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Sit your hips back and down until your thighs are about parallel to the floor.',
      'Push the floor away with your whole foot and stand up.',
    ],
    fouten: [
      { fout: 'Weight drifts away from your chest', beter: 'Pull the weight against your breastbone. If it hangs in front of you, it pulls you forward.' },
      { fout: 'Knees cave in', beter: 'Push your knees out against your elbows, in the direction of your toes.' },
      { fout: 'Rounded back at the bottom', beter: 'Sink less deep, only as far as your back stays neutral.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you come up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Squat to a bench, so you have a fixed depth and something to rely on.',
    zwaarder: 'Use a heavier weight or pause at the bottom for 3 counts.',
  },
  'Squat met dumbbells': {
    kernpunten: [
      { punt: 'Chest up', uitleg: 'The dumbbells hang beside your legs. Keep your chest proud so you do not fold forward.' },
      { punt: 'Heels on the floor', uitleg: 'Your whole foot stays flat. Feel the weight on your midfoot and heels.' },
      { punt: 'Knees towards your toes', uitleg: 'Your knees move in the direction of your toes and do not cave in.' },
      { punt: 'Arms hang still', uitleg: 'Your arms are just hooks. Let the dumbbells hang straight down.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips, toes turned out a little.',
      'Hold a dumbbell beside each leg, palms facing you, shoulders down.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Lower as if you are sitting down until your thighs are about parallel to the floor.',
      'Push the floor away and stand up.',
    ],
    fouten: [
      { fout: 'Torso falls forward', beter: 'Keep your chest up and sit between your heels. Use lighter dumbbells if it keeps happening.' },
      { fout: 'Coming up onto your toes', beter: 'Sit back more and keep your heels on the floor.' },
      { fout: 'Dumbbells bump your knees', beter: 'Turn your hands slightly so the dumbbells hang just beside your legs.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you come up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Squat to a bench or do it without weight.',
    zwaarder: 'Use heavier dumbbells or pause at the bottom for 2 counts.',
  },
  'Sumo squat met dumbbell': {
    kernpunten: [
      { punt: 'Wide stance, toes out', uitleg: 'Your feet are well wider than your shoulders with your toes turned out. That also works your inner thighs.' },
      { punt: 'Knees out', uitleg: 'Your knees point in the direction of your toes. In this wide stance they cave in easily.' },
      { punt: 'Sink straight down', uitleg: 'Your torso stays upright and you lower vertically, as if you slide down along a wall.' },
      { punt: 'Weight hangs between your legs', uitleg: 'Hold the dumbbell with both hands and straight arms. Your arms do nothing.' },
    ],
    opstelling: [
      'Stand wide with your toes turned out.',
      'Hold a dumbbell upright with both hands on the top plate, between your legs.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Sink straight down and push your knees out.',
      'Drive through your heels back up and squeeze your glutes.',
    ],
    fouten: [
      { fout: 'Knees cave in', beter: 'Actively push your knees out. Turn your toes out a little less if needed.' },
      { fout: 'Leaning forward', beter: 'Keep your chest up. Let the dumbbell hang straight below your shoulders.' },
      { fout: 'Stance too wide', beter: 'Bring your feet a bit closer together if your groin pulls or you cannot sink deep.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you come up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Do it without weight or sink less deep.',
    zwaarder: 'Use a heavier dumbbell or a kettlebell and pause at the bottom for 2 counts.',
  },
  'Squat naar een bank': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Reach for the bench behind you with your glutes. Your hips go back and your knees stay calm.' },
      { punt: 'Touch the bench, no plopping', uitleg: 'Just touch the bench with your glutes. You keep the tension and do not sit down.' },
      { punt: 'Knees follow your toes', uitleg: 'Your knees move in the direction of your toes and do not cave in.' },
      { punt: 'Stand up through your heels', uitleg: 'Push the floor away with your whole foot. Do not rock forward to get up.' },
    ],
    opstelling: [
      'Place a sturdy bench behind you that cannot slide.',
      'Stand a small step in front of the bench with your feet slightly wider than your hips, toes turned out a little.',
    ],
    stappen: [
      'Reach your arms out in front of you and brace your core.',
      'Lower under control until your glutes just touch the bench.',
      'Stand up again without momentum.',
    ],
    fouten: [
      { fout: 'Plopping down onto the bench', beter: 'Brake over 3 counts and only touch the bench.' },
      { fout: 'Rocking forward to stand up', beter: 'Keep your chest up and drive through your heels. Use a higher bench if it does not work yet.' },
      { fout: 'Knees cave in', beter: 'Push your knees out, in line with your toes.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you stand up.',
    tempo: '3 counts down, touch, 1 count up.',
    makkelijker: 'Use a higher bench or put a cushion on it.',
    zwaarder: 'Use a lower bench or hold a dumbbell in front of your chest.',
  },
  'Lunge met dumbbells': {
    kernpunten: [
      { punt: 'Big step forward', uitleg: 'A long step keeps your front knee over your foot and gives your glutes more work.' },
      { punt: 'Front knee over your foot', uitleg: 'Your knee points towards your toes and does not cave in when you push off.' },
      { punt: 'Torso upright', uitleg: 'Let the dumbbells hang by your sides and keep your chest up.' },
      { punt: 'Push back hard', uitleg: 'Drive off the heel of your front foot and step back in one movement.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and a dumbbell in each hand, arms straight by your sides.',
    ],
    stappen: [
      'Take a big step forward and plant your foot firmly.',
      'Sink straight down until your back knee almost touches the floor.',
      'Push through your front heel back to the start and switch legs.',
    ],
    fouten: [
      { fout: 'Braking on your toes', beter: 'Land with your whole foot and keep your weight on your midfoot and heel.' },
      { fout: 'Knee caves in', beter: 'Push your front knee slightly out, in line with your toes.' },
      { fout: 'Step too short', beter: 'Step further forward so you make two angles of about 90 degrees at the bottom.' },
    ],
    ademhaling: 'Breathe in as you step out and lower, breathe out as you push back.',
    tempo: '2 counts down, 1 count back to the start.',
    makkelijker: 'Do the reverse lunge, which is easier on your knee.',
    zwaarder: 'Use heavier dumbbells or do the walking lunge.',
  },
  'Achterwaartse lunge met dumbbells': {
    kernpunten: [
      { punt: 'Shoulders down', uitleg: 'Let the dumbbells hang from straight arms and do not shrug your shoulders up to your ears.' },
      { punt: 'Step back far enough', uitleg: 'With a long step your front shin stays almost vertical and your weight stays on your front heel.' },
      { punt: 'Drive through your front heel', uitleg: 'You feel it in the glutes and thigh of your front leg. That leg lifts you up.' },
      { punt: 'Torso stays upright', uitleg: 'The dumbbells do not pull you forward. Chest up, core lightly braced.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and a dumbbell in each hand, palms facing you.',
      'Choose a weight you can hold for the whole set without wobbling.',
    ],
    stappen: [
      'Take a big step back with one leg, landing on the ball of your foot.',
      'Sink straight down until your back knee almost touches the floor.',
      'Push through your front heel and bring your back foot back to the start.',
    ],
    fouten: [
      { fout: 'Wobbling when you step back', beter: 'Do not place your feet on one line but hip width apart, as if you walk on two rails.' },
      { fout: 'Dumbbells swing along', beter: 'Keep your arms still by your sides. If that is hard, use a lighter weight.' },
      { fout: 'Back knee slams into the floor', beter: 'Stop just above the floor and come back under control, without bouncing.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '2 counts down, 1 count back to the start.',
    makkelijker: 'Do the exercise without weight and hold on with one hand.',
    zwaarder: 'Put your front foot on a low step so you can sink deeper.',
  },
  'Split squat met dumbbells': {
    kernpunten: [
      { punt: 'Feet stay put', uitleg: 'You do not step. You place your feet once and then only move up and down.' },
      { punt: 'Sink straight down', uitleg: 'Your hips go down like a lift. Your back knee stops just above the floor.' },
      { punt: 'Drive through your front foot', uitleg: 'Your front leg does the work. Your back leg only helps with balance.' },
      { punt: 'Shoulders down', uitleg: 'Let the dumbbells hang from straight arms and do not shrug your shoulders.' },
    ],
    opstelling: [
      'Take a dumbbell in each hand and take a big stride: front foot flat, back foot on the ball.',
      'Keep your feet hip width apart side by side, as if you stand on two rails.',
    ],
    stappen: [
      'Sink straight down until your back knee is just above the floor.',
      'Push through your whole front foot back up, without locking your knees.',
      'Do all reps on this leg and then switch.',
    ],
    fouten: [
      { fout: 'Feet on one line, wobbling', beter: 'Place your feet hip width apart side by side. That gives you more balance right away.' },
      { fout: 'Front knee caves in', beter: 'Keep your knee in line with your second and third toe.' },
      { fout: 'Stride too short', beter: 'Set your feet further apart so your front heel stays on the floor at the bottom.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Do the exercise without weight and hold on to a rack with one hand.',
    zwaarder: 'Use heavier dumbbells or put your back foot on a bench (Bulgarian split squat).',
  },
  'Bulgarian split squat': {
    kernpunten: [
      { punt: 'Front heel stays down', uitleg: 'You push through your whole front foot. If your heel lifts, your foot is too close to the bench.' },
      { punt: 'Sink straight down', uitleg: 'Your hips go down vertically. You feel it in the glutes and thigh of your front leg.' },
      { punt: 'Back foot relaxed', uitleg: 'Your back leg is only support. Rest the top of your foot or your toes on the bench and do not push with it.' },
      { punt: 'A slight lean is fine', uitleg: 'A small forward lean with a straight back gives your glutes more work. Do not slump.' },
    ],
    opstelling: [
      'Place a bench behind you and rest the top of your back foot on it.',
      'Place your front foot a big step in front of the bench, so your knee is about above your ankle at the bottom.',
      'Hold a dumbbell in each hand, or start without weight.',
    ],
    stappen: [
      'Brace your core and look ahead.',
      'Lower under control until your front thigh is about parallel to the floor.',
      'Drive through your front heel back up without locking your knee.',
    ],
    fouten: [
      { fout: 'Front foot too close to the bench', beter: 'Move your front foot further forward until your heel stays on the floor at the bottom.' },
      { fout: 'Wobbling left and right', beter: 'Do not place your feet on one line but slightly apart, as if you stand on two rails.' },
      { fout: 'Pushing with the back leg', beter: 'Relax your back foot. All the work comes from your front leg.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Do it without weight and hold on to a rack with one hand.',
    zwaarder: 'Use heavier dumbbells or pause at the bottom for 2 counts.',
  },
  'Roemeense deadlift met dumbbells': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Move from your hips, as if you close a door with your glutes. Your knees stay almost still.' },
      { punt: 'Dumbbells along your legs', uitleg: 'Let the dumbbells slide along your thighs and shins. Close to your body spares your lower back.' },
      { punt: 'Back straight', uitleg: 'Your back stays neutral. Feel it in the back of your thighs, not in your lower back.' },
      { punt: 'Come up with your glutes', uitleg: 'Squeeze your glutes and push your hips forward. Standing tall is enough, do not lean back.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and a dumbbell in each hand in front of your thighs, palms facing you.',
      'Knees slightly bent, shoulders down and back.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Push your hips back and let the dumbbells slide down your legs until you feel a stretch in your hamstrings.',
      'Come up by pushing your hips forward.',
    ],
    fouten: [
      { fout: 'Sinking too deep with a rounded back', beter: 'Stop as soon as your back wants to round. Depth comes with time, a straight back comes first.' },
      { fout: 'It turns into a squat', beter: 'Keep a slight bend in your knees and push your hips back, not down.' },
      { fout: 'Head up towards the mirror', beter: 'Keep your neck in line with your back and look at the floor a little ahead of you.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you come up.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use light dumbbells and practise first with your hands along your legs, without weight.',
    zwaarder: 'Do it on one leg, with the other foot slightly behind you for balance.',
  },
  'Deadlift met kettlebell': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'Push your glutes towards the wall behind you. Your knees bend only a little.' },
      { punt: 'Back straight', uitleg: 'A straight line from your head to your tailbone. Chest open, shoulders away from your ears.' },
      { punt: 'Bell between your feet', uitleg: 'The weight stays under you, in the middle between your feet. Then your back does not have to compensate.' },
      { punt: 'Glutes on at the top', uitleg: 'You finish upright with your glutes squeezed, without leaning back.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than hip width, the kettlebell between your feet in line with your ankles.',
    ],
    stappen: [
      'Push your hips back until you grab the handle with both hands and straight arms.',
      'Brace your core and stand up by bringing your hips forward.',
      'Put the kettlebell back in the same spot with the same hip movement.',
    ],
    fouten: [
      { fout: 'Knees far forward, like a squat', beter: 'Push your hips further back. Your shins stay almost vertical.' },
      { fout: 'Rounded back when you lift', beter: 'Chest forward and core on before you lift. If you cannot reach, put the bell on something higher.' },
      { fout: 'Pulling with your arms', beter: 'Your arms are ropes. The weight comes up because your hips move forward.' },
    ],
    ademhaling: 'Breathe in before you lift, breathe out once you stand tall.',
    tempo: '1 count up, a short pause, 2 counts back.',
    makkelijker: 'Put the kettlebell on a step or a few plates, so you do not have to go as low.',
    zwaarder: 'Use a heavier kettlebell or do the exercise on one leg.',
  },
  'Kettlebell swing': {
    kernpunten: [
      { punt: 'Power from your hips', uitleg: 'Your hips snap forward and the bell floats along. Your arms are just ropes, they lift nothing.' },
      { punt: 'Hinge, do not squat', uitleg: 'It is a hip hinge, not a squat. Glutes towards the wall behind you, knees only slightly bent.' },
      { punt: 'Back straight, chest open', uitleg: 'Even as the bell swings between your legs, your back stays long. Shoulders away from your ears.' },
      { punt: 'Tall and tight at the top', uitleg: 'At the top you stand like a plank: glutes and core squeezed. Do not lean back.' },
    ],
    opstelling: [
      'Place the bell half a metre in front of your feet. Feet slightly wider than hip width.',
      'Push your hips back and grab the bell with both hands, back straight.',
    ],
    stappen: [
      'Lift the bell slightly and hike it hard back between your legs, forearms against your thighs.',
      'Drive your hips forward explosively so the bell floats to about chest height.',
      'Let the bell drop back and absorb it by pushing your hips back again.',
    ],
    fouten: [
      { fout: 'Squatting instead of hinging', beter: 'Push your glutes back and keep your shins almost vertical. Your knees bend only a little.' },
      { fout: 'Lifting the bell with your arms', beter: 'Relax your arms and let your hips do the work. The bell stops by itself once your hips are extended.' },
      { fout: 'Rounded back at the bottom', beter: 'Keep your chest open and your eyes a few metres ahead. Use a lighter bell until your back stays straight.' },
      { fout: 'Leaning back at the top', beter: 'Finish upright with your glutes squeezed. Your body forms a straight line, not an arc.' },
    ],
    ademhaling: 'Breathe in briefly as the bell swings back, breathe out hard as your hips drive forward.',
    tempo: 'Explosive up, let the bell drop freely, keep a steady rhythm.',
    makkelijker: 'Practise the hip hinge first with a kettlebell deadlift, without swinging.',
    zwaarder: 'Use a heavier bell or swing with one hand.',
  },
  'Farmer walk': {
    kernpunten: [
      { punt: 'Shoulders down and back', uitleg: 'Pull your shoulders away from your ears. That way you carry the weight with your whole back, not just your neck.' },
      { punt: 'Tall, look ahead', uitleg: 'Walk tall and proud, chin slightly tucked. Do not lean to one side and do not bend forward.' },
      { punt: 'Squeeze hard', uitleg: 'Squeeze the handles as if you want to crush them. A firm grip makes your whole body more stable.' },
      { punt: 'Short, calm steps', uitleg: 'Place your feet in short, controlled steps. Big steps make the weights swing.' },
    ],
    opstelling: [
      'Place the weights beside your feet and pick them up like a deadlift: bend your knees, back straight.',
      'Choose a fixed distance or time and make sure the walking route is clear.',
    ],
    stappen: [
      'Stand up with the weights beside you, shoulders down and core braced.',
      'Walk the distance with short, calm steps without letting the weights swing.',
      'Stop, bend your knees and put the weights down with a straight back.',
    ],
    fouten: [
      { fout: 'Shoulders creep up', beter: 'Consciously press your shoulders down before you start walking and check it along the way.' },
      { fout: 'Torso leans to one side', beter: 'Stand straight between both weights. Choose two equal weights and brace your sides.' },
      { fout: 'Putting down with a rounded back', beter: 'Bend your knees and hips to put the weights down, just as neatly as when you picked them up.' },
    ],
    ademhaling: 'Breathe calmly and evenly, keep your core lightly braced.',
    tempo: 'Calm walking pace with short, controlled steps.',
    makkelijker: 'Choose lighter weights or a shorter distance.',
    zwaarder: 'Carry only one weight on one side, so your torso has to work harder to stay straight.',
  },
}
