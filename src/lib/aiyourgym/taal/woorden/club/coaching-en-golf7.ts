// Engelse coaching van de Blender-oefeningen uit golf 7 (05-11-2026): de
// restlijst met banken, dumbbells, barbell, trap bar en kabel. Het Nederlands in
// de oefenbibliotheek (src/lib/club/training/coaching) is de bron; dit zegt
// precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF7: Readonly<Record<string, Coaching>> = {
  'Push-up met handen verhoogd': {
    kernpunten: [
      { punt: 'Body like a plank', uitleg: 'A straight line from your head to your heels. Core and glutes on, hips do not sag.' },
      { punt: 'Hands under your shoulders', uitleg: 'Slightly wider than shoulder width on the edge, fingers pointing forward.' },
      { punt: 'Elbows angled back', uitleg: 'About 45 degrees from your body, not flared out wide. That keeps your shoulders calm.' },
      { punt: 'Chest to the edge', uitleg: 'Lower until your chest almost touches the bench, then push the bench away from you.' },
    ],
    opstelling: [
      'Place your hands on a bench, box or the bar of a smith machine and walk your feet back.',
      'The higher your hands, the easier it is. Choose a height at which you can do every rep cleanly.',
    ],
    stappen: [
      'Brace your core and glutes.',
      'Lower under control until your chest almost touches the edge.',
      'Push yourself back up until your arms are straight, body still in a straight line.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Squeeze your glutes harder and pull your belly button in. Choose a higher support if they keep sagging.' },
      { fout: 'Elbows flare out wide', beter: 'Turn your elbows back at an angle, towards your hips.' },
      { fout: 'Head drops forward', beter: 'Look down just in front of your hands. Your chest touches the edge first, not your chin.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push yourself back up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Place your hands higher, for example against a wall.',
    zwaarder: 'Place your hands lower until you can do the regular push-up on the floor.',
  },
  'Trap bar deadlift': {
    kernpunten: [
      { punt: 'In the middle of the bar', uitleg: 'The weight hangs beside you, right above the middle of your feet. That way you pull straight up.' },
      { punt: 'Chest up, back long', uitleg: 'Your back stays in the same position from start to finish. Look at the floor a few metres in front of you.' },
      { punt: 'Push the floor away', uitleg: 'Think of pushing with your legs, not pulling with your back. Hips and shoulders rise together.' },
      { punt: 'Stand tall at the top, done', uitleg: 'Squeeze your glutes and stand tall. Do not lean back and do not shrug your shoulders.' },
    ],
    opstelling: [
      'Step into the trap bar with your feet hip width apart, the middle of your foot under the handles.',
      'Push your hips back and down until you can grip the handles with straight arms.',
    ],
    stappen: [
      'Breathe in, brace your core and take the slack out of the bar until it almost lifts off.',
      'Push the floor away until you stand tall, knees and hips extending at the same time.',
      'Lower the bar by moving your hips back first and then bending your knees.',
    ],
    fouten: [
      { fout: 'Hips shoot up first', beter: 'Start with your chest a little higher and push with your legs, so your hips and shoulders rise together.' },
      { fout: 'Lower back rounds', beter: 'Use less weight, brace your core harder and keep your chest up before you start to pull.' },
      { fout: 'Leaning back at the top', beter: 'Stop when you stand tall with your glutes squeezed. Your shoulders stay above your hips.' },
    ],
    ademhaling: 'Breathe in and brace your core before you pull, breathe out when you stand at the top or the bar is back down.',
    tempo: '1 count up, a short pause, 2 counts back to the floor.',
    makkelijker: 'Use the high handles if the bar has them, or raise the plates on a platform.',
    zwaarder: 'Use the low handles or pause for a count at the bottom just above the floor.',
  },
  'Suitcase carry': {
    kernpunten: [
      { punt: 'Do not lean', uitleg: 'The weight pulls you sideways. Your torso stays upright, as if you are walking between two walls.' },
      { punt: 'Shoulders level', uitleg: 'The shoulder on the side of the weight does not drop and the other one does not hike up.' },
      { punt: 'Core on', uitleg: 'Brace your core all the way around, especially on the side without the weight.' },
      { punt: 'Walk calmly', uitleg: 'Small, calm steps in a straight line. Do not rush.' },
    ],
    opstelling: [
      'Place a kettlebell next to your foot and pick it up with a straight back, as in a deadlift.',
    ],
    stappen: [
      'Stand up tall with the kettlebell in one straight arm beside you.',
      'Walk tall for the set distance or time.',
      'Put the kettlebell down with a straight back and switch hands.',
    ],
    fouten: [
      { fout: 'Torso bends towards the weight', beter: 'Use a lighter kettlebell and push the top of your head up towards the ceiling.' },
      { fout: 'Arm pinned against your leg', beter: 'Let the kettlebell hang freely, just beside your leg.' },
      { fout: 'Walking fast and wobbly', beter: 'Walk slower with smaller steps and look straight ahead.' },
    ],
    ademhaling: 'Keep breathing calmly, short and high, while your core stays braced.',
    tempo: 'Calm walking pace, 20 to 40 metres or 30 seconds per side.',
    makkelijker: 'Use a lighter kettlebell and walk a shorter distance.',
    zwaarder: 'Pick a heavier kettlebell or walk a longer distance.',
  },
  'Zijwaarts buigen met dumbbell': {
    kernpunten: [
      { punt: 'Sideways only', uitleg: 'You bend as if between two panes of glass. Not forward and not backward.' },
      { punt: 'Up with the other side', uitleg: 'You come back up by tensing the side without the dumbbell. That is where you should feel it.' },
      { punt: 'Hips stay still', uitleg: 'Your hips do not shift sideways. Only your torso bends.' },
      { punt: 'Not too far', uitleg: 'Go as far as you can without twisting, usually until the dumbbell is around your knee.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your knees soft.',
      'Hold a dumbbell in a straight arm beside your thigh and place your other hand on your hip or by your head.',
    ],
    stappen: [
      'Brace your core and stand tall.',
      'Bend slowly sideways towards the dumbbell.',
      'Come back up to standing by tensing your other side.',
      'Switch hands after the set.',
    ],
    fouten: [
      { fout: 'Torso twists or bends forward', beter: 'Keep your chest facing forward. If needed, do the exercise with your back along a wall.' },
      { fout: 'Too heavy and with momentum', beter: 'Choose a weight you can move calmly. Swinging mostly loads your lower back.' },
      { fout: 'Hips shift sideways', beter: 'Keep your pelvis straight above your feet and bend only above your waist.' },
    ],
    ademhaling: 'Breathe in as you bend sideways and breathe out as you come back up.',
    tempo: '2 counts to the side, a short pause, 2 counts back.',
    makkelijker: 'Do it without weight, with your hand along your leg.',
    zwaarder: 'Hold the bottom for 2 counts or use a slightly heavier dumbbell.',
  },
  'Bankdrukken met barbell': {
    kernpunten: [
      { punt: 'Shoulder blades together and down', uitleg: 'Pull your shoulder blades together and down before you unrack the bar. That gives you a solid platform and protects your shoulders.' },
      { punt: 'Feet into the floor', uitleg: 'Place your feet flat and slightly back and push them into the floor. You feel tension all the way into your glutes, so you lie stable.' },
      { punt: 'Bar to your lower chest', uitleg: 'Lower the bar to your lower chest, roughly in line with your nipples, and press it in a slight arc back above your shoulders.' },
      { punt: 'Elbows not flared', uitleg: 'Keep your elbows about 45 degrees from your torso. Wide flared elbows put a lot of stress on the front of your shoulder.' },
      { punt: 'Glutes on the bench', uitleg: 'A slight arch in your lower back is fine, but your glutes stay down. If they come up, the weight is too heavy.' },
    ],
    opstelling: [
      'Lie with your eyes directly under the bar and set the safety arms just below chest height, or ask a spotter.',
      'Grip the bar slightly wider than shoulder width with your thumb around it, wrists straight above your elbows.',
    ],
    stappen: [
      'Lift the bar out of the rack and bring it above your shoulders with straight arms.',
      'Lower it under control until it lightly touches your lower chest.',
      'Press it back up in a slight arc until it is above your shoulders.',
    ],
    fouten: [
      { fout: 'Bouncing the bar off your chest', beter: 'Touch your chest lightly and pause briefly. Do not use momentum, your muscles do the work.' },
      { fout: 'Shoulders roll forward', beter: 'Keep your shoulder blades together and down, also at the top. Do not press further than straight arms.' },
      { fout: 'Wrists bend back', beter: 'Place the bar low in your palm, above your forearm. Your knuckles point to the ceiling.' },
      { fout: 'Thumb not around the bar', beter: 'Always wrap your thumb around the bar. An open grip can slip and then the bar falls on your chest.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out once you have pressed the bar past the hardest point.',
    tempo: '2 to 3 counts down, a short pause, powerfully up.',
    makkelijker: 'Use dumbbells or the smith machine, or work with just the bar until the technique is solid.',
    zwaarder: 'Pause the bar on your chest for 2 counts before you press. That makes the bottom part harder.',
  },
  'Bankdrukken met smalle greep': {
    kernpunten: [
      { punt: 'Hands at shoulder width', uitleg: 'Your hands are directly above your shoulders, not touching. A narrower grip only puts more stress on your wrists.' },
      { punt: 'Elbows along your body', uitleg: 'Your elbows almost brush your torso as you lower. That puts the work on your triceps.' },
      { punt: 'Shoulder blades together', uitleg: 'Even with a narrow grip you pull your shoulder blades together and down. That keeps your shoulders stable.' },
      { punt: 'Fully straighten your elbows', uitleg: 'Press until your arms are straight and feel your triceps tighten at the top, but do not snap your elbows into lockout.' },
    ],
    opstelling: [
      'Lie with your eyes under the bar and set the safety arms just below chest height or work with a spotter.',
      'Grip the bar at shoulder width with your thumb around it and place your feet firmly flat on the floor.',
    ],
    stappen: [
      'Lift the bar out of the rack and hold it with straight arms above your chest.',
      'Lower it to your lower chest with your elbows along your body.',
      'Press it straight up by straightening your elbows.',
    ],
    fouten: [
      { fout: 'Hands too close together', beter: 'Place your hands at shoulder width. Thumbs touching does not make the exercise better, only harder on your wrists.' },
      { fout: 'Elbows flare out', beter: 'Keep them close to your torso. If they flare, it becomes a regular bench press and your chest takes over.' },
      { fout: 'Bar drifts to your neck', beter: 'Aim for your lower chest. With narrow hands that is where the bar should land.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out as you press the bar up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Do a push-up with narrow hands or use the smith machine for more support.',
    zwaarder: 'Pause the bar for a count just above your chest before you press.',
  },
  'Dips op een bank': {
    kernpunten: [
      { punt: 'Glutes close to the bench', uitleg: 'Keep your back close along the edge of the bench. If your body drifts forward, a lot of stress goes to your shoulders.' },
      { punt: 'Shoulders away from your ears', uitleg: 'Push yourself up out of your shoulders and keep your chest open. Your neck stays relaxed.' },
      { punt: 'No deeper than horizontal', uitleg: 'Lower until your upper arms are about horizontal. Deeper mostly strains the front of your shoulder.' },
      { punt: 'Elbows pointing back', uitleg: 'Your elbows point straight back, not out. That way your triceps work the most.' },
    ],
    opstelling: [
      'Sit on the edge of a sturdy bench and place your hands beside your glutes, fingers pointing forward.',
      'Slide your glutes off the bench and extend your legs in front of you with your heels on the floor. With bent knees it is easier.',
    ],
    stappen: [
      'Lower by bending your elbows, your back stays close to the bench.',
      'Stop when your upper arms are about horizontal.',
      'Push yourself back up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Body drifts away from the bench', beter: 'Keep your glutes almost against the bench. The further away, the more vulnerable your shoulder position becomes.' },
      { fout: 'Lowering with your legs instead of your arms', beter: 'Bend your elbows, not your knees. Your hips drop straight down along the edge of the bench.' },
      { fout: 'Fingers pointing sideways or back', beter: 'Point your fingers forward over the edge. That is kinder to your wrists and keeps your elbows pointing back.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Place your feet closer to the bench with your knees bent more, so your legs carry more of your weight.',
    zwaarder: 'Place your heels on a second bench or put a plate on your lap.',
  },
  'Dumbbell bankdrukken': {
    kernpunten: [
      { punt: 'Wrists above your elbows', uitleg: 'Your forearms stay vertical, also at the bottom. That way you press straight up and the dumbbells do not wobble.' },
      { punt: 'Shoulder blades together', uitleg: 'Pull your shoulder blades together and down. Your chest is up and your shoulders rest firmly on the bench.' },
      { punt: 'Elbows angled down', uitleg: 'Keep your elbows about 45 degrees from your torso. Flared out wide puts a lot of stress on your shoulders.' },
      { punt: 'Up and slightly together', uitleg: 'Press the dumbbells up and let them come towards each other at the top without touching. You feel your chest contract.' },
    ],
    opstelling: [
      'Sit with the dumbbells upright on your thighs and roll back while your knees help them up.',
      'Hold them above your chest, feet flat on the floor, palms facing your feet or slightly towards each other.',
    ],
    stappen: [
      'Lower the dumbbells until they are beside your chest and you feel a light stretch.',
      'Press them back up and slightly towards each other.',
      'Stop when your arms are almost straight and start again.',
    ],
    fouten: [
      { fout: 'Dumbbells drift towards your head', beter: 'Lower them in line with your mid chest. Too high puts your shoulders in a vulnerable position.' },
      { fout: 'Dropping the dumbbells after the set', beter: 'Bring them back to your chest, place them on your thighs and roll back up to sitting.' },
      { fout: 'Wrists bend back', beter: 'Keep your wrists straight with the dumbbell low in your palm.' },
    ],
    ademhaling: 'Breathe in as the dumbbells lower and breathe out as you press them up.',
    tempo: '2 to 3 counts down, a short pause, 1 count up.',
    makkelijker: 'Choose lighter dumbbells or turn your palms towards each other, many shoulders find that more comfortable.',
    zwaarder: 'Press one arm at a time while the other stays up, so your torso has to stabilise extra.',
  },
  'Push-up met voeten verhoogd': {
    kernpunten: [
      { punt: 'Do not let your hips sag', uitleg: 'With your feet high your hips tend to sag sooner. Brace your core and glutes extra hard.' },
      { punt: 'Hands slightly in front of your shoulders', uitleg: 'Place your hands slightly wider than your shoulders and just in front of your shoulder line. That way you lower straight to your chest.' },
      { punt: 'Elbows angled back', uitleg: 'Keep your elbows about 45 degrees from your torso. That keeps your shoulder in a safe position.' },
      { punt: 'Look in front of your hands', uitleg: 'Your head stays in line with your back. Not with your chin or forehead to the floor.' },
    ],
    opstelling: [
      'Place your feet on a bench and your hands on the floor, slightly wider than your shoulders.',
      'Make a straight line from heels to head with your core and glutes braced.',
    ],
    stappen: [
      'Lower as one unit until your chest is just above the floor.',
      'Push yourself back up until your arms are straight.',
      'Keep your hips in line with your shoulders and feet the whole time.',
    ],
    fouten: [
      { fout: 'Hips hang down', beter: 'Squeeze your glutes. If that does not work, place your feet lower or do regular push-ups first.' },
      { fout: 'Head touches the floor first', beter: 'Bring your chest to the floor, not your face. Look just in front of your hands.' },
      { fout: 'Elbows flared out to the sides', beter: 'Turn your elbows back at an angle. That is better for your shoulders.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Place your feet on a lower step or do a regular push-up.',
    zwaarder: 'Place your feet higher or make the lowering phase last 4 counts.',
  },
  'Schuin bankdrukken met barbell': {
    kernpunten: [
      { punt: 'Bench at 30 to 45 degrees', uitleg: 'A slight incline puts the work on your upper chest. The steeper it is, the more your shoulders take over.' },
      { punt: 'Bar to your upper chest', uitleg: 'Lower the bar to just below your collarbones and press it straight up above your shoulders.' },
      { punt: 'Shoulder blades together and down', uitleg: 'Pull your shoulder blades together and down against the bench. That keeps your shoulders stable.' },
      { punt: 'Glutes on the bench', uitleg: 'Push your feet into the floor but keep your glutes on the seat. Coming up makes the incline flatter.' },
    ],
    opstelling: [
      'Set the bench to 30 to 45 degrees and lie with your eyes roughly under the bar.',
      'Grip the bar slightly wider than shoulder width with your thumb around it and set the safety arms properly or ask a spotter.',
    ],
    stappen: [
      'Lift the bar out of the rack and hold it with straight arms above your shoulders.',
      'Lower it under control to your upper chest.',
      'Press it straight up until it is above your shoulders.',
    ],
    fouten: [
      { fout: 'Bar drops to your mid chest', beter: 'Aim higher, just below your collarbones. That way your forearms stay vertical and you press straight up.' },
      { fout: 'Shoulders slide forward', beter: 'Keep your shoulder blades together, also at the top. Straighten your arms, but do not push your shoulders up with them.' },
      { fout: 'Arching your back to make it easier', beter: 'A slight arch is fine, but your glutes stay on the bench. Take weight off if needed.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out as you press up.',
    tempo: '2 to 3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use dumbbells on the incline bench or the smith machine with the bench inclined.',
    zwaarder: 'Pause the bar on your chest for 1 to 2 counts before you press.',
  },
  'Schuin bankdrukken met dumbbells': {
    kernpunten: [
      { punt: 'Bench at about 30 degrees', uitleg: 'A slight incline is enough for your upper chest. Steeper shifts the work to your shoulders.' },
      { punt: 'Back against the bench', uitleg: 'Keep your upper back and glutes in contact with the bench. Your shoulder blades are together and down.' },
      { punt: 'Wrists above your elbows', uitleg: 'Your forearms stay vertical. That way you press straight up without the dumbbells swinging away.' },
      { punt: 'Lower under control', uitleg: 'Lower the dumbbells calmly until they are beside your upper chest. You feel a stretch across your chest.' },
    ],
    opstelling: [
      'Set the bench to about 30 degrees, sit with the dumbbells on your thighs and bring them up with your knees as you lie back.',
      'Hold them above your upper chest with your feet flat on the floor.',
    ],
    stappen: [
      'Lower the dumbbells until they are beside your upper chest.',
      'Press them up and slightly towards each other.',
      'Stop when your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Bench too steep', beter: 'Lower the bench. Above 45 degrees it becomes more of a shoulder press than a chest exercise.' },
      { fout: 'Elbows flared out to the sides', beter: 'Keep your elbows angled under the dumbbells, about 45 degrees from your torso.' },
      { fout: 'Dumbbells clank at the top', beter: 'Stop just before they touch. That keeps the tension on your chest.' },
    ],
    ademhaling: 'Breathe in as the dumbbells lower and breathe out as you press them up.',
    tempo: '2 to 3 counts down, a short pause, 1 count up.',
    makkelijker: 'Choose lighter dumbbells or turn your palms towards each other.',
    zwaarder: 'Make the lowering phase last 4 counts or pause at the bottom for 2 counts.',
  },
  'Hip thrust met barbell': {
    kernpunten: [
      { punt: 'Chin towards your chest', uitleg: 'Your gaze follows your torso and looks forward. That keeps your ribs down and your back does not arch.' },
      { punt: 'Shins vertical at the top', uitleg: 'Place your feet so your lower legs are vertical at the top. That is when your glutes work the most.' },
      { punt: 'Squeeze your glutes at the top', uitleg: 'Your hips extend fully through your glutes, not through your lower back. Hold that moment for a count.' },
      { punt: 'Bench under your shoulder blades', uitleg: 'The edge of the bench sits just below your shoulder blades. Your upper back pivots around it like a hinge.' },
    ],
    opstelling: [
      'Sit on the floor with your upper back against a sturdy bench and roll the bar with a pad over your hips.',
      'Feet flat at slightly more than hip width, hands on the bar to keep it still.',
    ],
    stappen: [
      'Brace your core, chin slightly to your chest, and push your heels into the floor.',
      'Drive your hips up until you are straight from shoulders to knees and squeeze your glutes.',
      'Hold briefly and lower under control until your glutes almost touch the floor.',
    ],
    fouten: [
      { fout: 'Head back, arched back', beter: 'Keep your chin slightly to your chest and look forward. Your torso and head move as one unit.' },
      { fout: 'Bar rolls towards your belly', beter: 'Hold the bar still on your hip bones with both hands and always use a thick pad.' },
      { fout: 'Pushing through your toes', beter: 'Put your weight on your heels. Lift your toes slightly if you need to feel that.' },
    ],
    ademhaling: 'Breathe in at the bottom and brace your core, breathe out when you reach the top.',
    tempo: '1 count up, hold for 1 count, 2 counts down.',
    makkelijker: 'Start with an empty bar or do the movement without weight with your shoulders on the bench.',
    zwaarder: 'Place a band around your knees and push it outwards, or hold the top for 3 counts.',
  },
  'Face pull': {
    kernpunten: [
      { punt: 'Elbows high', uitleg: 'Your elbows stay at shoulder height or slightly higher. That way the back of your shoulder works.' },
      { punt: 'Pull the rope apart', uitleg: 'Spread the ends beside your ears as if you are showing a double biceps pose.' },
      { punt: 'Do not lean back', uitleg: 'Your torso stays still. If you have to lean to make it, the weight is too heavy.' },
      { punt: 'Shoulders down', uitleg: 'Keep your neck long. You feel it between and behind your shoulder blades, not in your neck.' },
    ],
    opstelling: [
      'Set the cable with the rope at head height. Grip the rope with your thumbs pointing back and step back until your arms are straight and the weight lifts off the stack.',
      'Stand firmly with one foot slightly in front of the other or with your feet hip width apart.',
    ],
    stappen: [
      'Pull the rope towards your face, elbows going high and wide.',
      'Spread the ends beside your ears and hold the end position briefly.',
      'Let the rope come back slowly until your arms are straight again.',
    ],
    fouten: [
      { fout: 'Elbows drop', beter: 'Keep your elbows at shoulder height. If they drop, it becomes a regular rowing movement.' },
      { fout: 'Too heavy and pulling with your back', beter: 'Choose a light weight and keep your torso still. This is about control, not kilos.' },
      { fout: 'Pulling the rope to your chest', beter: 'Pull the rope towards your nose or forehead, then the right muscles work.' },
    ],
    ademhaling: 'Breathe out as you pull towards your face, breathe in as your arms straighten back.',
    tempo: '1 count pull, hold for 1 count, 2 counts back.',
    makkelijker: 'Use a band at head height instead of the cable.',
    zwaarder: 'Hold the end position for 3 counts or do the exercise half kneeling for a stiller torso.',
  },
  Concentratiecurl: {
    kernpunten: [
      { punt: 'Elbow against your leg', uitleg: 'Your upper arm leans against the inside of your thigh. That way you cannot cheat with your shoulder.' },
      { punt: 'Fully extend', uitleg: 'Let your arm hang almost straight at the bottom. That way you work the full length of your biceps.' },
      { punt: 'Squeeze at the top', uitleg: 'Turn your little finger up slightly and squeeze for a count. You feel your biceps fully contract.' },
    ],
    opstelling: [
      'Sit on the end of a bench with your feet wide and flat on the floor.',
      'Lean forward slightly and place your elbow against the inside of your thigh, the dumbbell hangs between your legs. Rest your other hand on your knee.',
    ],
    stappen: [
      'Start with your arm almost straight and your palm facing forward.',
      'Curl the dumbbell to your shoulder without your upper arm moving.',
      'Squeeze briefly and lower the dumbbell slowly.',
      'After your last rep, put the dumbbell on the floor between your feet and pick it up with your other hand for the other side.',
    ],
    fouten: [
      { fout: 'Elbow off your leg', beter: 'Keep your upper arm pressed against your leg, then your shoulder stays out of it.' },
      { fout: 'Torso moving up with it', beter: 'Your torso stays still. Only your forearm moves.' },
      { fout: 'Lowering too fast', beter: 'Take 3 counts to lower. Light weight and full control works best here.' },
    ],
    ademhaling: 'Breathe out as you curl and breathe in as the dumbbell lowers.',
    tempo: '1 count up, 1 count still, 3 counts down.',
    zwaarder: 'Hold the top for 2 counts or add a few half reps at the bottom after the last rep.',
  },
  'Lat pulldown met onderhandse greep': {
    kernpunten: [
      { punt: 'Elbows close to your body', uitleg: 'With this grip you pull your elbows straight down along your sides. You feel it in the lower part of your lats.' },
      { punt: 'Chest up', uitleg: 'Sit tall with your chest towards the bar. Your shoulders stay down.' },
      { punt: 'Do not hang or swing', uitleg: 'Your torso stays still. Your biceps help a lot, so the weight must not pull your body along.' },
      { punt: 'Back under control', uitleg: 'Let the bar rise calmly until your arms are straight. Do not let it shoot up.' },
    ],
    opstelling: [
      'Lock your thighs under the pad with your feet flat on the floor.',
      'Grip the bar at shoulder width with your palms facing you.',
    ],
    stappen: [
      'Sit with straight arms and set your shoulders down.',
      'Pull the bar to your upper chest with your elbows close to your body.',
      'Let the bar back up under control.',
    ],
    fouten: [
      { fout: 'Falling back to reach the bar', beter: 'Stay almost upright. Use less weight if you have to lean.' },
      { fout: 'Wrists curl in', beter: 'Keep your wrists straight. You pull with your elbows, not with a curl.' },
      { fout: 'Not straightening the arms at the top', beter: 'Go back to straight arms every rep, then you train your back over its full length.' },
    ],
    ademhaling: 'Breathe out as you pull down and breathe in as the bar goes up.',
    tempo: '1 count down, a short pause, 2 to 3 counts up.',
    zwaarder: 'Hold the bottom for 2 counts with your chest towards the bar.',
  },
}
