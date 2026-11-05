// Engelse coaching van de Blender-oefeningen uit golf 4 (05-11-2026): de kabeltoren.
// Het Nederlands in de oefenbibliotheek (src/lib/club/training/coaching) is de bron;
// dit zegt precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF4: Readonly<Record<string, Coaching>> = {
  'Seated cable row met brede greep': {
    kernpunten: [
      { punt: 'Torso still and upright', uitleg: 'Your torso stays upright. Do not lean back to move the weight.' },
      { punt: 'Elbows out', uitleg: 'With the wide grip your elbows go out at an angle. That puts the focus on your upper back.' },
      { punt: 'To your lower chest', uitleg: 'Pull the bar to your lower chest, not to your belly or your neck.' },
      { punt: 'Shoulder blades together', uitleg: 'Squeeze your shoulder blades together at the end and let them go again at the start.' },
    ],
    opstelling: [
      'Attach a wide bar to the cable, sit down with your feet on the foot plate and your knees slightly bent.',
      'Take a wide grip on the bar and sit upright with straight arms.',
    ],
    stappen: [
      'Pull the bar to your lower chest with your elbows out at an angle.',
      'Hold briefly with your shoulder blades together.',
      'Let the bar return under control until your arms are straight.',
    ],
    fouten: [
      { fout: 'Leaning back', beter: 'Stay upright. Use less weight if you have to swing with it.' },
      { fout: 'Shoulders shrug up', beter: 'Keep your shoulders low and pull with your elbows, not with your hands.' },
      { fout: 'Falling forward on the way back', beter: 'Let the bar return while your torso stays upright.' },
    ],
    ademhaling: 'Breathe out as you pull, breathe in as the bar returns.',
    tempo: '1 count pull, a short hold, 2 counts back.',
    makkelijker: 'Use less weight or the regular narrow grip.',
    zwaarder: 'Hold the bar against your chest for 2 counts.',
  },
  'Hammer curl aan de kabel': {
    kernpunten: [
      { punt: 'Thumbs up', uitleg: 'Your palms face each other, as if holding a hammer. That way your forearms work too.' },
      { punt: 'Elbows by your sides', uitleg: 'Your elbows stay in the same place next to your sides and do not slide forward.' },
      { punt: 'No swinging', uitleg: 'Your torso stays still. If you swing, the weight is too heavy.' },
      { punt: 'Lower calmly', uitleg: 'The cable pulls through the whole movement. Let the rope return under control.' },
    ],
    opstelling: [
      'Set the cable all the way down with a rope and stand upright close to the machine.',
      'Hold the ends of the rope with your thumbs up, arms straight.',
    ],
    stappen: [
      'Bend your arms until your hands are at your shoulders.',
      'Hold briefly with your biceps squeezed.',
      'Lower the rope under control until your arms are straight.',
    ],
    fouten: [
      { fout: 'Elbows slide forward', beter: 'Keep your elbows against your sides. Use less weight if they move.' },
      { fout: 'Swinging with your back', beter: 'Stand firmly with your knees slightly bent and keep your torso still.' },
      { fout: 'Wrists bend', beter: 'Keep your wrists straight in line with your forearms.' },
    ],
    ademhaling: 'Breathe out as you curl, breathe in as you lower the rope.',
    tempo: '1 count up, a short hold, 2 counts down.',
    makkelijker: 'Use less weight or do the hammer curl with dumbbells.',
    zwaarder: 'Lower the rope over 3 counts or pause for 2 counts halfway.',
  },
  'Triceps extension boven het hoofd aan de kabel': {
    kernpunten: [
      { punt: 'Elbows stay put', uitleg: 'Your upper arms stay still next to your head. Only your forearms move.' },
      { punt: 'Elbows forward', uitleg: 'Your elbows point forward and not wide out to the sides.' },
      { punt: 'Core on', uitleg: 'Your ribs stay down, so you do not arch your back as you straighten your arms.' },
      { punt: 'Lower deep', uitleg: 'Let the rope go far behind your head. That is where your triceps stretch, and that is the useful part.' },
    ],
    opstelling: [
      'Set the cable low with a rope and hold the ends.',
      'Turn your back to the machine, step one foot forward, lean your torso slightly forward and bring the rope behind your head with both hands, elbows next to your ears.',
    ],
    stappen: [
      'Straighten your arms until they are straight above your head.',
      'Lower the rope under control behind your head until you feel a stretch in your triceps.',
      'Straighten again without moving your elbows.',
    ],
    fouten: [
      { fout: 'Elbows flare out', beter: 'Bring them back next to your head. Use less weight if it keeps happening.' },
      { fout: 'Arched back', beter: 'Brace your core and stand in a split stance for balance.' },
      { fout: 'Upper arms move along', beter: 'Keep your elbows in a fixed spot. The movement happens only at your elbows.' },
    ],
    ademhaling: 'Breathe out as you straighten, breathe in as you lower the rope.',
    tempo: '1 count to straighten, a short hold, 2 counts back.',
    makkelijker: 'Use less weight or do the exercise seated with a dumbbell.',
    zwaarder: 'Lower the rope over 3 counts and hold the stretch at the bottom for 1 count.',
  },
  'Exorotatie aan de kabel': {
    kernpunten: [
      { punt: 'Elbow against your side', uitleg: 'Your elbow stays against your side at a right angle. A rolled towel in between helps.' },
      { punt: 'Only your forearm turns', uitleg: 'Your forearm swings out like a door. Your torso does not turn with it.' },
      { punt: 'Light weight', uitleg: 'The muscles that turn your shoulder outwards are small. A light weight is enough.' },
      { punt: 'Calmly back', uitleg: 'Let the cable return under control until your hand is in front of your belly.' },
    ],
    opstelling: [
      'Set the cable at elbow height with a single handle and stand sideways next to it.',
      'Hold the handle with the hand furthest from the machine, elbow at a right angle against your side, your other hand on your hip.',
    ],
    stappen: [
      'Turn your forearm outwards, away from the machine, as far as you can without your elbow coming loose.',
      'Hold briefly.',
      'Let your hand return calmly to in front of your belly and switch sides after the set.',
    ],
    fouten: [
      { fout: 'Elbow comes off your side', beter: 'Clamp a towel between your elbow and your side and keep it there.' },
      { fout: 'Torso turns along', beter: 'Keep your chest facing forward. Make the movement smaller.' },
      { fout: 'Weight too heavy', beter: 'Use the lightest setting there is. You must be able to steer the movement calmly.' },
    ],
    ademhaling: 'Breathe steadily, out as you turn outwards.',
    tempo: '2 counts out, a short hold, 2 counts back.',
    makkelijker: 'Use a light band instead of the cable.',
    zwaarder: 'Hold the end position for 2 counts or do more reps.',
  },
  'Pull-through aan de kabel': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'You push your glutes back towards the machine. Your knees bend slightly and then stay still.' },
      { punt: 'Arms are ropes', uitleg: 'Your arms hang long between your legs and do not pull. All the work comes from your hips.' },
      { punt: 'Back straight', uitleg: 'Even when you lean forward your back stays long and your chest open.' },
      { punt: 'Glutes on at the top', uitleg: 'Finish upright with your glutes squeezed hard, without arching your lower back.' },
    ],
    opstelling: [
      'Set the cable all the way down with a rope and stand with your back to the machine.',
      'Take the rope through between your legs, take two big steps forward and set your feet wide.',
    ],
    stappen: [
      'Send your hips back until you feel a stretch in your hamstrings, the rope between your legs.',
      'Drive your hips forward powerfully until you stand upright.',
      'Squeeze your glutes at the top and let the cable return under control.',
    ],
    fouten: [
      { fout: 'Squatting instead of hinging', beter: 'Keep your shins nearly vertical and push your glutes back instead of down.' },
      { fout: 'Pulling with your arms', beter: 'Let your arms hang straight. The rope moves only because your hips move.' },
      { fout: 'Arched back at the top', beter: 'Stop when you stand straight. Ribs down and glutes on instead of pushing your hips forward.' },
    ],
    ademhaling: 'Breathe in as your hips go back, breathe out as you drive them forward.',
    tempo: '2 counts back, 1 count forward, a short hold.',
    makkelijker: 'Use less weight and go back less far.',
    zwaarder: 'Hold the top for 2 counts and let the cable return over 3 counts.',
  },
  'Cable crunch': {
    kernpunten: [
      { punt: 'Hips stay still', uitleg: 'Your glutes do not sink to your heels. Only your torso curls, or your body weight pulls the weight down.' },
      { punt: 'Ribs to your pelvis', uitleg: 'Think of your breastbone curling towards your navel. You feel your abs contract, not your arms.' },
      { punt: 'Hands at your forehead', uitleg: 'You hold the rope in front of your forehead. Your arms do not pull, they only hold on.' },
      { punt: 'Calmly back', uitleg: 'Do not let the weight snap back. Keep tension on your abs on the way up too.' },
    ],
    opstelling: [
      'Set the pulley high and attach the rope. Choose a light weight.',
      'Kneel half a metre in front of the cable, take the rope and hold your hands in front of your forehead.',
    ],
    stappen: [
      'Come upright on your knees with your hips slightly bent.',
      'Curl your torso down until your elbows move towards your thighs.',
      'Squeeze your abs briefly at the bottom.',
      'Curl back under control until your back is long again.',
    ],
    fouten: [
      { fout: 'Moving up and down with the hips', beter: 'Keep your glutes above your knees. Only curl your spine, as if rolling up a ball.' },
      { fout: 'Pulling with the arms', beter: 'Hold your hands fixed in front of your forehead and keep the distance between hands and head the same.' },
      { fout: 'Weight too heavy', beter: 'Choose a weight that lets you do 12 to 15 calm reps with full control.' },
    ],
    ademhaling: 'Breathe out as you curl down and breathe in as you come back.',
    tempo: '2 counts down, a short pause, 2 counts up.',
    makkelijker: 'Use less weight and make the movement smaller.',
    zwaarder: 'Hold the bottom for 2 counts or come back over 4 counts.',
  },
  'Triceps pushdown': {
    kernpunten: [
      { punt: 'Elbows against your sides', uitleg: 'Your elbows sit next to your ribs and stay there. Only your forearms move.' },
      { punt: 'Straighten fully', uitleg: 'Push until your arms are straight and squeeze your triceps at the bottom.' },
      { punt: 'Stand tall', uitleg: 'Stand upright, at most tilted slightly forward. Do not hang over the bar.' },
      { punt: 'Calmly up', uitleg: 'Let the bar return under control until your forearms are about horizontal.' },
    ],
    opstelling: [
      'Set the cable in the highest position with a straight bar.',
      'Grip the bar at shoulder width, stand close to the machine with your feet hip width apart and your knees slightly bent.',
    ],
    stappen: [
      'Start with your forearms about horizontal and your elbows against your sides.',
      'Push the bar down until your arms are straight.',
      'Hold briefly and let the bar return calmly.',
    ],
    fouten: [
      { fout: 'Elbows slide forward', beter: 'Keep your elbows against your sides. If they move forward, you are pushing with your shoulders.' },
      { fout: 'Leaning over the weight', beter: 'Stand upright. If you have to push with your body, set the pin one hole lighter.' },
      { fout: 'Bar shoots up', beter: 'Slow down the way back and do not let your hands come higher than your chest.' },
    ],
    ademhaling: 'Breathe out as you push down and breathe in as the bar returns.',
    tempo: '1 count down, a short squeeze, 2 to 3 counts up.',
    zwaarder: 'Hold the bottom for 2 counts or do it one arm at a time.',
  },
  'Cable crossover': {
    kernpunten: [
      { punt: 'Step forward, torso still', uitleg: 'Take a step and lean slightly forward. Your torso does not move, or you push with body weight instead of your chest.' },
      { punt: 'Elbows slightly bent', uitleg: 'Keep a small bend in your elbows and do not change it. Your arms are a fixed arc, only your shoulders move.' },
      { punt: 'Hands down and together', uitleg: 'Bring your hands in an arc down to in front of your hips. You feel your lower chest contract.' },
      { punt: 'Shoulders low', uitleg: 'Keep your shoulders away from your ears. If they shrug up, your neck and shoulders take over the work.' },
    ],
    opstelling: [
      'Set both cables in the highest position and take a handle in each hand.',
      'Step forward into a short split stance, core braced and torso slightly forward.',
    ],
    stappen: [
      'Start with your arms wide and slightly bent, you feel a stretch in your chest.',
      'Bring your hands in an arc down and towards each other in front of your body.',
      'Squeeze your chest briefly and let the handles return calmly along the same arc.',
    ],
    fouten: [
      { fout: 'Elbows bend and straighten', beter: 'Lock your elbows in a slight bend. If they bend and straighten, it becomes a pressing exercise.' },
      { fout: 'Torso swings along', beter: 'Plant your feet firmly and brace your core. Choose a lighter weight if you have to swing.' },
      { fout: 'Arms snap back too far', beter: 'Do not let your hands go further back than just behind your body. A light stretch in the chest is enough.' },
    ],
    ademhaling: 'Breathe out as you bring your hands together and breathe in as they return.',
    tempo: '1 count together, a short squeeze, 2 to 3 counts back.',
    makkelijker: 'Do the pec deck: it gives more support and your torso does not have to stay still.',
    zwaarder: 'Let your hands cross slightly at the bottom and hold for 2 counts.',
  },
  'Kickback aan de kabel': {
    kernpunten: [
      { punt: 'Torso stays still', uitleg: 'Only your leg moves. Your upper body and pelvis stay fixed, as if leaning against a wall.' },
      { punt: 'Squeeze your glute', uitleg: 'Think of your glute pushing the leg back. You feel it high in your glute, not in your lower back.' },
      { punt: 'Not too far back', uitleg: 'Stop when your glute is fully squeezed. Swinging further goes through an arched back.' },
      { punt: 'Come back calmly', uitleg: 'Do not let the weight pull you back. Bring your leg forward under control to next to your standing leg.' },
    ],
    opstelling: [
      'Set the pulley in the lowest position and fasten an ankle strap around your ankle.',
      'Stand facing the cable with your hands on your hips, lean slightly forward with a straight back and keep your standing leg slightly bent.',
    ],
    stappen: [
      'Brace your core and fix your pelvis.',
      'Bring your straight leg back and up until your glute is fully squeezed.',
      'Hold for 1 count and bring your leg calmly forward again.',
    ],
    fouten: [
      { fout: 'Arched back on every rep', beter: 'Make the movement smaller and brace your core. Your leg goes no higher than your glute can take it.' },
      { fout: 'Swinging with momentum', beter: 'Use less weight and hold the top for 1 count. You must be able to stop every rep.' },
      { fout: 'Pelvis opens up', beter: 'Keep both hip bones facing the cable. Your leg goes straight back, not out to the side.' },
    ],
    ademhaling: 'Breathe out as you push your leg back, breathe in as it returns.',
    tempo: '1 count back, 1 count hold, 2 counts forward.',
    makkelijker: 'Do it without the cable on hands and knees with a bent knee.',
    zwaarder: 'Pause for 2 counts at the top or add weight while keeping your torso still.',
  },
  'Lateral raise aan de kabel': {
    kernpunten: [
      { punt: 'Shoulder low', uitleg: 'Do not shrug your shoulder up to your ear. You feel it on the side of your shoulder, not in your neck.' },
      { punt: 'Elbow leads', uitleg: 'Your elbow rises first, your hand follows. Keep the bend in your elbow.' },
      { punt: 'To shoulder height', uitleg: 'Stop when your arm is horizontal. That is the end point of the movement.' },
      { punt: 'Torso still', uitleg: 'Do not lean away from the cable to lift more weight. Only your arm moves.' },
    ],
    opstelling: [
      'Set the cable all the way down with a single handle. Stand sideways next to the machine and take the handle with your far hand, across the front of your body.',
      'Put your free hand on your hip.',
    ],
    stappen: [
      'Raise your arm out to the side with a slight bend in the elbow.',
      'Stop at shoulder height and hold briefly.',
      'Let your arm return under control to in front of your hip, with tension on the cable.',
    ],
    fouten: [
      { fout: 'Leaning away from the machine', beter: 'Stand upright with your free hand on your hip. Choose a lower weight if you have to lean.' },
      { fout: 'Arm locked straight', beter: 'Keep a small bend in your elbow. That keeps the work in your shoulder.' },
      { fout: 'Letting the cable snap back', beter: 'Lower the arm over 2 to 3 counts. The cable keeps the tension on, use that.' },
    ],
    ademhaling: 'Breathe out as you raise the arm, breathe in as it lowers.',
    tempo: '1 count up, a short pause, 3 counts down.',
    makkelijker: 'Choose the lowest weight and stop just below shoulder height.',
    zwaarder: 'Hold the top for 2 counts or add a few half reps after your last rep.',
  },
  'Lat pulldown': {
    kernpunten: [
      { punt: 'Chest up', uitleg: 'Sit upright with your chest towards the bar. That way you pull with your back and not with your arms.' },
      { punt: 'Elbows down', uitleg: 'Think of pulling your elbows to your trouser pockets. Your hands are just hooks.' },
      { punt: 'To your upper chest', uitleg: 'The bar passes in front of your face to just below your collarbones. Your chest rises a little to meet it.' },
      { punt: 'Calmly back up', uitleg: 'Let the bar return under control until your arms are straight and you feel a stretch under your armpits.' },
    ],
    opstelling: [
      'Set the pad so your thighs are clamped firmly under it and your feet are flat on the floor.',
      'Grip the bar slightly wider than shoulder width with your palms facing away and sit down with straight arms.',
    ],
    stappen: [
      'Set your shoulders low and lean back only a little.',
      'Pull your elbows down until the bar is at your upper chest.',
      'Let the bar rise calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Leaning far back and yanking', beter: 'Stay nearly upright. If you have to lean to reach the bar, the weight is too heavy.' },
      { fout: 'Pulling the bar behind your head', beter: 'Always pull in front of your face to your chest. That is safer for your shoulders.' },
      { fout: 'Shoulders stay at your ears', beter: 'Start every rep by setting your shoulders down, and only then bend your arms.' },
    ],
    ademhaling: 'Breathe out as you pull the bar down and breathe in as it goes back up.',
    tempo: '1 count down, a short pause, 2 to 3 counts up.',
    zwaarder: 'Hold the bar at the bottom for 2 counts or let it rise over 4 counts.',
  },
  'Lat pulldown met V-greep': {
    kernpunten: [
      { punt: 'Pull with your elbows', uitleg: 'Your hands only hold the handle. Your elbows go down and slightly back.' },
      { punt: 'Lean back a little', uitleg: 'Lean back a little, no more. The handle then comes neatly to your upper chest.' },
      { punt: 'Chest to the handle', uitleg: 'Lift your chest slightly towards the handle. Your shoulder blades go down and together.' },
      { punt: 'Calmly up', uitleg: 'Let the handle return under control until your arms are straight and you feel a stretch in your back.' },
    ],
    opstelling: [
      'Attach the V-handle to the cable and clamp your thighs under the pad.',
      'Hold the handle with your palms facing each other and sit upright with straight arms.',
    ],
    stappen: [
      'Set your shoulders low and lean back a little.',
      'Pull the handle to your upper chest with your elbows along your body.',
      'Let the handle rise calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Too far back, it becomes a row', beter: 'Stay at the same small angle. Your torso does not move.' },
      { fout: 'Pulling with hands and forearms', beter: 'Think of your elbows to your hips. Your hands are just hooks.' },
      { fout: 'Shoulders roll forward at the bottom', beter: 'Keep your chest open and shoulders low, even when the handle is at your chest.' },
    ],
    ademhaling: 'Breathe out as you pull the handle down and breathe in as it goes up.',
    tempo: '1 count down, a short pause, 2 to 3 counts up.',
    zwaarder: 'Let the handle rise over 4 counts.',
  },
  'Seated cable row': {
    kernpunten: [
      { punt: 'Sit upright', uitleg: 'Your torso is upright and stays still. Do not swing with your back to move the weight.' },
      { punt: 'Pull to your belly', uitleg: 'The handle comes to your navel. Your elbows go back along your sides.' },
      { punt: 'Shoulder blades together', uitleg: 'At the end, squeeze your shoulder blades together without shrugging your shoulders.' },
      { punt: 'Under control back', uitleg: 'Let the handle return calmly until your arms are straight and your shoulders move slightly forward.' },
    ],
    opstelling: [
      'Put your feet on the foot plate with your knees slightly bent, not locked.',
      'Take the handle, often the V-handle, and sit upright with straight arms and a neutral back.',
    ],
    stappen: [
      'Start upright with straight arms and your shoulders low.',
      'Pull the handle to your belly and bring your shoulder blades together.',
      'Let the handle return under control without your torso moving along.',
    ],
    fouten: [
      { fout: 'Swinging far forward and back', beter: 'Torso still and upright. A little movement is fine, a rowing boat motion is not.' },
      { fout: 'Lower back rounds on the way back', beter: 'Stay upright with your chest open, even when your arms are straight.' },
      { fout: 'Shoulders shrug to your ears', beter: 'Keep your shoulders low and pull your elbows back.' },
    ],
    ademhaling: 'Breathe out as you pull to your belly and breathe in as the handle returns.',
    tempo: '1 count pull, 1 count pause, 2 counts back.',
    makkelijker: 'Use the seated row machine with chest support, so you do not have to keep your torso still yourself.',
    zwaarder: 'Hold at your belly for 2 counts or let the handle return over 4 counts.',
  },
  'Curl aan de kabel': {
    kernpunten: [
      { punt: 'Elbows by your body', uitleg: 'Your elbows stay against your sides. If they come forward, your shoulder takes over.' },
      { punt: 'One step from the cable', uitleg: 'Stand just far enough that the weight is off the stack at the bottom. Then the tension stays on the whole time.' },
      { punt: 'Under control back', uitleg: 'Do not let the cable pull your arms back. Slow down until your arms are nearly straight.' },
    ],
    opstelling: [
      'Set the pulley all the way down and attach a straight bar, EZ bar or rope.',
      'Stand upright with your feet hip width apart, a small step from the machine, and grip the handle with your palms facing forward.',
    ],
    stappen: [
      'Start with your arms nearly straight and the handle in front of your thighs.',
      'Curl the handle to your chest without moving your elbows.',
      'Squeeze briefly and lower calmly.',
    ],
    fouten: [
      { fout: 'Leaning back', beter: 'Stand upright with your core braced. If you lean, the weight is too heavy.' },
      { fout: 'Weight taps the stack at the bottom', beter: 'Stop just before the plates touch. That keeps the tension on.' },
      { fout: 'Wrists curl along', beter: 'Keep your wrist straight. Your biceps do the work, not your forearms.' },
    ],
    ademhaling: 'Breathe out as you curl and breathe in as you lower the handle.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use the rope with your thumbs up, that is often easier on your wrists.',
    zwaarder: 'Do it one arm at a time with a single handle, or hold the top for 2 counts.',
  },
  'Straight arm pulldown': {
    kernpunten: [
      { punt: 'Arms nearly straight', uitleg: 'Your elbows keep the same slight bend the whole time. Bend them more and it becomes a triceps exercise.' },
      { punt: 'Push in an arc', uitleg: 'Bring the bar in a half circle from head height to your thighs. You feel it under your armpits.' },
      { punt: 'Torso stays still', uitleg: 'You lean slightly forward and stay at that angle. Do not bend along to get the bar down.' },
      { punt: 'Shoulders low', uitleg: 'Keep your shoulders away from your ears, even when the bar is at the top.' },
    ],
    opstelling: [
      'Set the pulley high with a straight bar and grip it at shoulder width.',
      'Take a step back, hinge slightly forward from your hips with a straight back and hold your arms nearly straight in front of you at head height.',
    ],
    stappen: [
      'Start with the bar at head height and your arms nearly straight.',
      'Push the bar in an arc to your thighs.',
      'Let it rise under control until you feel a stretch under your armpits.',
    ],
    fouten: [
      { fout: 'Elbows bend and straighten', beter: 'Lock your elbows in a slight bend. Only your shoulders move.' },
      { fout: 'Torso bends down along', beter: 'Stay at the same angle with your core braced. Use less weight.' },
      { fout: 'Bar shoots back up', beter: 'Slow the way up down to 2 counts. That keeps your back working.' },
    ],
    ademhaling: 'Breathe out as you push the bar down and breathe in as it goes up.',
    tempo: '1 count down, a short pause, 2 counts up.',
    makkelijker: 'Use a rope and a light weight to feel the movement.',
    zwaarder: 'Hold the bottom for 2 counts with your hands against your thighs.',
  },
}
