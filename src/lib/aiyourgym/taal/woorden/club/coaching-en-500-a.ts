// Engelse coaching van de uitbreiding van migratie 500, deel A (barbell en
// dumbbell). Het Nederlands in de oefenbibliotheek (coaching/uitbreiding-500-a.ts)
// is de bron; dit zegt hetzelfde met dezelfde opbouw (coaching.test.ts).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_500_A: Readonly<Record<string, Coaching>> = {
  'Pendlay row': {
    kernpunten: [
      { punt: 'Torso horizontal', uitleg: 'Your torso is almost parallel to the floor and stays there the whole set. That way your back works, not your lower back.' },
      { punt: 'From the floor every rep', uitleg: 'The bar rests still on the floor after every rep. You start again each time without momentum.' },
      { punt: 'Pull explosively', uitleg: 'Pull the bar fast to your lower ribs. Your elbows go back, not wide to the side.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart under the bar, like a deadlift.',
      'Hinge forward with a long back and grip the bar overhand, slightly wider than shoulder width.',
    ],
    stappen: [
      'Brace your core and back so your torso stays still.',
      'Pull the bar explosively to your lower ribs.',
      'Lower the bar under control to the floor and let it rest for a moment.',
    ],
    fouten: [
      { fout: 'Torso rises with the bar', beter: 'Keep your torso horizontal. If it rises, the weight is too heavy.' },
      { fout: 'Lower back rounds', beter: 'Chest slightly forward and hips back. If that fails, use less weight.' },
      { fout: 'Bar bounces off the floor', beter: 'Set it down calmly and let it rest before you pull again.' },
    ],
    ademhaling: 'Breathe in before the pull, hold it while pulling and breathe out when the bar rests on the floor.',
    tempo: 'Explosive up, 1 to 2 counts down, a short pause on the floor.',
    makkelijker: 'Choose the barbell row with your torso a bit higher and without touching the floor every rep.',
    zwaarder: 'Hold the bar against your ribs for one count at the top.',
  },
  'Z-press': {
    kernpunten: [
      { punt: 'Sit tall', uitleg: 'You sit straight on your sit bones without back support. Your torso holds the weight still.' },
      { punt: 'Bar straight up', uitleg: 'The bar travels in a straight line above your head. Your head moves back briefly and then under the bar again.' },
      { punt: 'Do not lean back', uitleg: 'If you lean back, it is too heavy. Your ribs stay down and your core braced.' },
    ],
    opstelling: [
      'Sit on the floor with your legs straight and slightly apart.',
      'Hold the bar on your collarbones with your hands slightly wider than your shoulders.',
    ],
    stappen: [
      'Brace your core and sit as tall as you can.',
      'Press the bar straight up until your arms are straight.',
      'Lower the bar under control to your collarbones.',
    ],
    fouten: [
      { fout: 'Torso falls back', beter: 'Choose a lighter weight. Your torso must be able to hold it.' },
      { fout: 'Knees bend to stay upright', beter: 'Spread your legs a bit wider. If it still fails, practise with your legs slightly bent first.' },
    ],
    ademhaling: 'Breathe in at the bottom, hold it while pressing and breathe out at the top.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Use two light dumbbells or sit with your knees slightly bent.',
    zwaarder: 'Hold the bar at the top for 2 counts with straight arms.',
  },
  'Push press': {
    kernpunten: [
      { punt: 'Short dip, upright torso', uitleg: 'Drop a little straight down through your knees. Your torso stays upright, you do not lean forward.' },
      { punt: 'Legs give the drive', uitleg: 'Drive up hard from your legs. That momentum carries the bar past your head.' },
      { punt: 'Arms finish it', uitleg: 'Then press the bar out to straight arms. At the top it sits above the back of your head.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and the bar on your shoulders in front of your neck.',
      'Grip the bar just outside your shoulders with your elbows slightly in front of the bar.',
    ],
    stappen: [
      'Dip quickly a little through your knees with your weight on your whole foot.',
      'Drive up explosively and press the bar overhead at the same time.',
      'Lower the bar under control to your shoulders and catch it with slightly bent knees.',
    ],
    fouten: [
      { fout: 'Dip too deep', beter: 'The dip is short, about a quarter squat. Going deeper costs momentum.' },
      { fout: 'Leaning forward in the dip', beter: 'Keep your torso upright and your weight in the middle of your foot.' },
      { fout: 'Arched back at the top', beter: 'Squeeze your glutes and brace your core. The bar sits above your head, not behind it.' },
    ],
    ademhaling: 'Breathe in before the dip, hold it while driving up and breathe out at the top.',
    tempo: 'Quick dip, explosive up, 2 counts down.',
    makkelijker: 'Start with the overhead press to learn the arm movement.',
    zwaarder: 'Choose more weight than for the overhead press, your legs help.',
  },
  'Zercher squat': {
    kernpunten: [
      { punt: 'Chest up', uitleg: 'The bar hangs in front of your body and pulls you forward. Keep your chest high and your back stays straight.' },
      { punt: 'Elbows high and tight', uitleg: 'Your hands stay together and your elbows close to your torso. The bar rests still in your arms.' },
      { punt: 'Deep and controlled', uitleg: 'Go as deep as you can with a straight back. Your knees travel over your toes.' },
    ],
    opstelling: [
      'Set the bar in a rack at belly height and rest it in the crook of your elbows.',
      'Stand with your feet slightly wider than your hips and your toes turned out a little.',
    ],
    stappen: [
      'Brace your core and lift the bar out of the rack.',
      'Squat down with your chest up until your thighs are at least parallel to the floor.',
      'Drive up hard until you stand tall.',
    ],
    fouten: [
      { fout: 'Back rounds', beter: 'Chest up and elbows high. Use less weight if it does not work.' },
      { fout: 'Bar sags in the arms', beter: 'Keep your hands together and squeeze your arms in.' },
    ],
    ademhaling: 'Breathe in before you go down, hold it in the squat and breathe out at the top.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Choose the goblet squat with a dumbbell against your chest.',
    zwaarder: 'Pause for 2 counts at the bottom before you come up.',
  },
  'Box squat met barbell': {
    kernpunten: [
      { punt: 'Hips back', uitleg: 'You sit back onto the bench, like onto a chair. Your shins stay almost vertical.' },
      { punt: 'Touch the bench softly', uitleg: 'Sit briefly and stay tight on the bench. Do not drop and do not relax.' },
      { punt: 'Drive from your heels', uitleg: 'Come up without rocking. The power comes from your hips and legs.' },
    ],
    opstelling: [
      'Place a bench behind you so your thighs rest on it just parallel to the floor.',
      'Put the bar on your upper back and stand with your feet slightly wider than your hips.',
    ],
    stappen: [
      'Brace your core and push your hips back.',
      'Sit down until you rest briefly and tight on the bench.',
      'Drive up from your heels until you stand tall.',
    ],
    fouten: [
      { fout: 'Dropping onto the bench', beter: 'Lower under control and touch the bench softly. Stay tight while seated.' },
      { fout: 'Rocking to get up', beter: 'Your torso keeps the same angle. Stand up without leaning back.' },
    ],
    ademhaling: 'Breathe in before you go down, hold it on the bench and breathe out at the top.',
    tempo: '2 counts down, 1 count seated, 1 count up.',
    makkelijker: 'Choose a higher bench or the squat to a bench without a bar.',
    zwaarder: 'Choose a lower bench or sit tight and still for 2 counts.',
  },
  'Floor press met barbell': {
    kernpunten: [
      { punt: 'Upper arms down softly', uitleg: 'Your upper arms touch the floor at the bottom. Set them down softly and pause briefly.' },
      { punt: 'Elbows at an angle', uitleg: 'Your elbows sit about 45 degrees from your torso. That keeps your shoulders safe.' },
      { punt: 'Press from a dead stop', uitleg: 'After the short pause you press the bar back up without momentum.' },
    ],
    opstelling: [
      'Lie on the floor with your knees bent and your feet flat.',
      'Have someone hand you the bar or lift it from a low rack above your chest.',
    ],
    stappen: [
      'Lower the bar until your upper arms touch the floor.',
      'Pause briefly with your arms relaxed on the floor.',
      'Press the bar straight up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Elbows bounce off the floor', beter: 'Set your arms down softly and wait one count before you press.' },
      { fout: 'Elbows flared wide', beter: 'Keep your elbows at an angle next to your torso, not in line with your shoulders.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you press.',
    tempo: '2 counts down, 1 count pause, 1 count up.',
    makkelijker: 'Choose the floor press with dumbbells.',
    zwaarder: 'Pause on the floor for 2 counts at the bottom.',
  },
  'JM press': {
    kernpunten: [
      { punt: 'Narrow grip', uitleg: 'Your hands are about shoulder width apart. That puts the work in your triceps.' },
      { punt: 'Elbows slide forward', uitleg: 'As you lower, your elbows travel towards your feet. The bar comes down towards your chin.' },
      { punt: 'Light and calm', uitleg: 'This is hard on your elbows. Choose a weight that keeps every rep calm.' },
    ],
    opstelling: [
      'Lie on a flat bench with your feet flat on the floor.',
      'Hold the bar above your chest with your hands at shoulder width.',
    ],
    stappen: [
      'Lower the bar towards your chin while your elbows slide forward.',
      'Stop when your forearms almost touch your upper arms.',
      'Press the bar back up above your chest.',
    ],
    fouten: [
      { fout: 'Elbows flare to the side', beter: 'Keep your elbows under the bar and pointing towards your feet.' },
      { fout: 'Weight too heavy', beter: 'Use less weight. Your elbows should keep feeling good.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you press.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Choose the close grip bench press.',
    zwaarder: 'Lower over 3 counts and pause for one count at the bottom.',
  },
  'Drag curl met barbell': {
    kernpunten: [
      { punt: 'Bar against your body', uitleg: 'The bar slides up along your belly. It never leaves your body.' },
      { punt: 'Elbows go back', uitleg: 'Your elbows move back as you curl. That keeps the tension on your biceps.' },
      { punt: 'Lower slowly', uitleg: 'Lower the bar slowly along the same path.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart.',
      'Grip the bar underhand at shoulder width, the bar against your thighs.',
    ],
    stappen: [
      'Drag the bar up along your body while your elbows move back.',
      'Stop when the bar reaches your lower ribs and squeeze briefly.',
      'Lower the bar slowly along your body.',
    ],
    fouten: [
      { fout: 'Bar leaves your body', beter: 'Keep it against your belly. If it moves forward, it becomes a normal curl.' },
      { fout: 'Shoulders shrug up', beter: 'Shoulders down. Only your elbows move back.' },
    ],
    ademhaling: 'Breathe out as you drag up and breathe in as you lower.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Choose an empty bar or an EZ bar.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Reverse curl met EZ-stang': {
    kernpunten: [
      { punt: 'Overhand grip', uitleg: 'Your palms face down. That makes your forearms work extra.' },
      { punt: 'Wrists straight', uitleg: 'Your wrists stay in line with your forearms. Do not let them bend.' },
      { punt: 'Elbows by your sides', uitleg: 'Only your forearms move. Your elbows stay in place.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart.',
      'Grip the EZ bar overhand at shoulder width on the angled parts.',
    ],
    stappen: [
      'Curl the bar up until your forearms are almost vertical.',
      'Squeeze briefly and keep your wrists straight.',
      'Lower the bar slowly until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Wrists bend back', beter: 'Keep your knuckles in line with your forearm. Use less weight.' },
      { fout: 'Swinging the torso', beter: 'Stand still. The weight is lighter than for a normal curl.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Use an empty bar or light dumbbells.',
    zwaarder: 'Lower over 3 counts and pause briefly halfway.',
  },
  'Polscurl met barbell': {
    kernpunten: [
      { punt: 'Forearms stay down', uitleg: 'Your forearms rest on your thighs. Only your wrists move.' },
      { punt: 'Full range', uitleg: 'Let the bar roll to your fingers and curl it all the way up.' },
      { punt: 'Light weight', uitleg: 'Your forearms are small muscles. Choose a weight for 15 calm reps.' },
    ],
    opstelling: [
      'Sit on a bench with your feet flat on the floor.',
      'Rest your forearms on your thighs with your hands underhand over your knees.',
    ],
    stappen: [
      'Let the bar roll slowly towards your fingers.',
      'Curl the bar up with your fingers and wrists as high as you can.',
      'Lower it slowly again.',
    ],
    fouten: [
      { fout: 'Forearms lift up', beter: 'Keep your forearms flat on your legs. Only your wrists work.' },
      { fout: 'Too fast and too small', beter: 'Use the whole movement and go slowly.' },
    ],
    ademhaling: 'Breathe calmly, out as you curl up.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Use a light dumbbell in each hand.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Squeeze press met dumbbells': {
    kernpunten: [
      { punt: 'Squeeze the dumbbells', uitleg: 'You press the dumbbells together for the whole movement. That switches on your chest.' },
      { punt: 'Elbows close to your torso', uitleg: 'Your elbows stay close to your body. That keeps your shoulders safe.' },
      { punt: 'Lower with control', uitleg: 'Lower the dumbbells together to your chest without letting them separate.' },
    ],
    opstelling: [
      'Lie on a flat bench with your feet flat on the floor.',
      'Hold two dumbbells with your palms facing each other, pressed together above your chest.',
    ],
    stappen: [
      'Squeeze the dumbbells firmly together.',
      'Lower them together until they almost touch your chest.',
      'Press them back up without releasing the squeeze.',
    ],
    fouten: [
      { fout: 'Dumbbells drift apart', beter: 'Keep pushing them together. Choose lighter dumbbells if that fails.' },
      { fout: 'Elbows flared wide', beter: 'Keep your elbows close to your torso.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you press.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Choose lighter dumbbells or do it on the floor.',
    zwaarder: 'Hold for 2 counts at the bottom with the dumbbells pressed together.',
  },
  'Floor press met dumbbells': {
    kernpunten: [
      { punt: 'Upper arms down softly', uitleg: 'Your upper arms touch the floor at the bottom. Set them down softly, no bouncing.' },
      { punt: 'Elbows at an angle', uitleg: 'Your elbows sit about 45 degrees from your torso.' },
      { punt: 'Wrists above your elbows', uitleg: 'The dumbbells stay straight above your elbows. That way you press in a straight line.' },
    ],
    opstelling: [
      'Lie on the floor with your knees bent and your feet flat.',
      'Hold a dumbbell in each hand above your chest with straight arms.',
    ],
    stappen: [
      'Lower the dumbbells until your upper arms touch the floor.',
      'Pause briefly.',
      'Press the dumbbells back up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Elbows bounce off the floor', beter: 'Set your arms down softly and wait one count.' },
      { fout: 'Dumbbells tip outwards', beter: 'Keep your wrists straight above your elbows.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you press.',
    tempo: '2 counts down, 1 count pause, 1 count up.',
    makkelijker: 'Choose lighter dumbbells.',
    zwaarder: 'Pause on the floor for 2 counts at the bottom.',
  },
  'Tate press': {
    kernpunten: [
      { punt: 'Upper arms still', uitleg: 'Your upper arms stay in place above your chest. Only your elbows bend.' },
      { punt: 'Elbows out', uitleg: 'Your elbows point outwards and the dumbbells tip inwards towards your chest.' },
      { punt: 'Light weight', uitleg: 'Choose light dumbbells. The movement is small and aimed at your triceps.' },
    ],
    opstelling: [
      'Lie on a flat bench with your feet flat on the floor.',
      'Hold two dumbbells above your chest with your palms facing your feet.',
    ],
    stappen: [
      'Bend your elbows out to the side so the dumbbells tip inwards.',
      'Let the heads touch your chest softly.',
      'Straighten your arms again until the dumbbells are above your chest.',
    ],
    fouten: [
      { fout: 'Upper arms drop too', beter: 'Keep your upper arms still. It is not a bench press.' },
      { fout: 'Dumbbells drop onto your chest', beter: 'Lower them slowly. Choose lighter dumbbells.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you straighten.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Choose the lying triceps extension with a dumbbell.',
    zwaarder: 'Lower over 3 counts and pause for one count at the bottom.',
  },
  'Zottman curl': {
    kernpunten: [
      { punt: 'Up with palms up', uitleg: 'You curl the dumbbells up with your palms facing up, like a normal curl.' },
      { punt: 'Turn at the top', uitleg: 'At the top you turn your hands to overhand. That is how you go down.' },
      { punt: 'Slowly down', uitleg: 'The way down takes 3 counts. That makes your forearms work hard.' },
    ],
    opstelling: [
      'Stand tall with a dumbbell in each hand and your arms by your sides.',
      'Keep your elbows by your sides and your palms facing forward.',
    ],
    stappen: [
      'Curl the dumbbells underhand up to your shoulders.',
      'Turn your hands at the top until your palms face down.',
      'Lower the dumbbells slowly and turn back at the bottom.',
    ],
    fouten: [
      { fout: 'Elbows drift forward', beter: 'Keep your elbows by your sides. Only your forearms move.' },
      { fout: 'Too fast on the way down', beter: 'Count 3 counts on the way down. Choose lighter dumbbells.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, turn, 3 counts down.',
    makkelijker: 'Choose lighter dumbbells or do one arm at a time.',
    zwaarder: 'Lower over 4 counts and pause for one count at the bottom.',
  },
  'Spider curl': {
    kernpunten: [
      { punt: 'Arms hang straight down', uitleg: 'Your upper arms hang straight down and stay still. That way you cannot swing.' },
      { punt: 'Squeeze at the top', uitleg: 'Squeeze briefly at the top. That is where the tension on your biceps is highest.' },
      { punt: 'Full range', uitleg: 'Let your arms almost straighten at the bottom before you curl again.' },
    ],
    opstelling: [
      'Set a bench at an incline and lie with your belly against it, your chest just over the top edge.',
      'Let your arms hang straight down with a dumbbell in each hand.',
    ],
    stappen: [
      'Curl the dumbbells up without moving your elbows.',
      'Squeeze briefly at the top.',
      'Lower the dumbbells slowly until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Elbows drift forward', beter: 'Keep your upper arms vertical. Only your forearms move.' },
      { fout: 'Torso lifts off the bench', beter: 'Keep your chest on the bench.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose lighter dumbbells.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Y-raise op een schuine bank': {
    kernpunten: [
      { punt: 'Thumbs up', uitleg: 'Your thumbs point to the ceiling. That gives your shoulder the most room.' },
      { punt: 'Shoulders down', uitleg: 'Do not shrug your shoulders to your ears. The work sits between and below your shoulder blades.' },
      { punt: 'Very light weight', uitleg: 'You are working small muscles. Start with the lightest dumbbells or no weight.' },
    ],
    opstelling: [
      'Set a bench at an incline and lie with your belly against it.',
      'Let your arms hang under your shoulders with light dumbbells, thumbs forward.',
    ],
    stappen: [
      'Raise your straight arms at an angle into a Y.',
      'Stop when your arms are in line with your torso and hold briefly.',
      'Lower your arms slowly.',
    ],
    fouten: [
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down before you start. Use less weight.' },
      { fout: 'Swinging the arms', beter: 'Go slowly and hold for one count at the top.' },
    ],
    ademhaling: 'Breathe out as you raise and breathe in as you lower.',
    tempo: '2 counts up, 1 count hold, 2 counts down.',
    makkelijker: 'Do it without weight.',
    zwaarder: 'Hold at the top for 3 counts.',
  },
  'Renegade row': {
    kernpunten: [
      { punt: 'Hips square', uitleg: 'Your hips keep facing the floor. They do not open up as you pull.' },
      { punt: 'Feet wide', uitleg: 'With your feet wide you are more stable. The closer together, the harder.' },
      { punt: 'Elbow along your side', uitleg: 'Pull the dumbbell to your hip with your elbow close to your body.' },
    ],
    opstelling: [
      'Place two dumbbells shoulder width apart on the floor and grip the handles.',
      'Hold a high plank with straight arms and your feet wide.',
    ],
    stappen: [
      'Brace your core and glutes so your body forms a straight line.',
      'Pull one dumbbell to your hip without rotating your hips.',
      'Set it down calmly and do the same with the other arm.',
    ],
    fouten: [
      { fout: 'Hips rotate open', beter: 'Widen your feet and choose lighter dumbbells.' },
      { fout: 'Hips sag', beter: 'Glutes on and core tight. Your body stays a plank.' },
    ],
    ademhaling: 'Breathe out as you pull and breathe in as you set the dumbbell down.',
    tempo: '1 count up, 2 counts down, then the other side.',
    makkelijker: 'Do it from your knees or without weight as a plank with shoulder taps.',
    zwaarder: 'Place your feet closer together.',
  },
  'Roemeense deadlift op een been met dumbbell': {
    kernpunten: [
      { punt: 'Hips square', uitleg: 'Your hips keep facing the floor. The hip of your free leg does not open up.' },
      { punt: 'One long line', uitleg: 'Your torso and your free leg form one straight line together, like a seesaw.' },
      { punt: 'Standing leg slightly bent', uitleg: 'Your standing leg is slightly bent and stays at that angle. You feel it in the back of your thigh.' },
    ],
    opstelling: [
      'Stand on one leg with a dumbbell in the opposite hand.',
      'Bend your standing leg slightly and brace your core.',
    ],
    stappen: [
      'Hinge forward from your hip while your free leg goes straight back.',
      'Lower until your torso is almost horizontal or you feel the stretch in your hamstring.',
      'Come back up by driving your hip forward.',
    ],
    fouten: [
      { fout: 'Hip opens up', beter: 'Point the toes of your free leg at the floor. Then your hips stay square.' },
      { fout: 'Back rounds', beter: 'Chest slightly forward and go less deep.' },
      { fout: 'Wobbling', beter: 'Look at a fixed spot on the floor and go slower.' },
    ],
    ademhaling: 'Breathe in as you hinge forward and breathe out as you come up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Hold your free hand against a wall or do it without weight.',
    zwaarder: 'Take a dumbbell in each hand or pause for 2 counts at the bottom.',
  },
  'Split squat met voorvoet verhoogd': {
    kernpunten: [
      { punt: 'Straight down', uitleg: 'You drop straight down between your feet. Your torso stays upright.' },
      { punt: 'Knee may pass your toes', uitleg: 'Your front knee travels forward over your toes. That is part of this exercise.' },
      { punt: 'Drive through your front foot', uitleg: 'Your front leg does the work. Your back foot only supports.' },
    ],
    opstelling: [
      'Place your front foot on a low step and your back foot a big step behind you.',
      'Hold a dumbbell in each hand by your sides.',
    ],
    stappen: [
      'Drop straight down until your back knee almost touches the floor.',
      'Drive back up through your front foot.',
      'Do all reps and then switch legs.',
    ],
    fouten: [
      { fout: 'Front knee caves in', beter: 'Keep your knee above your foot. Choose lighter dumbbells.' },
      { fout: 'Leaning forward', beter: 'Torso upright and look ahead.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you come up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Do it without dumbbells or without the step.',
    zwaarder: 'Pause for 2 counts at the bottom.',
  },
  'Dumbbell snatch': {
    kernpunten: [
      { punt: 'Power from your hips', uitleg: 'Your hips extend explosively and give the dumbbell its speed. Your arm only guides.' },
      { punt: 'Close to your body', uitleg: 'The dumbbell travels in a straight line close to your body.' },
      { punt: 'Still at the top', uitleg: 'At the top your arm is straight and still above your shoulder before you lower again.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and a dumbbell between your feet.',
      'Bend at your hips and knees and grab the dumbbell with one hand.',
    ],
    stappen: [
      'Extend your hips and knees explosively and pull the dumbbell up along your body.',
      'Punch it through in one movement until your arm is straight overhead.',
      'Lower it under control to your shoulder and then to the floor.',
    ],
    fouten: [
      { fout: 'Lifting with the arm only', beter: 'Let your hips do the work. Your arm follows the momentum.' },
      { fout: 'Dumbbell swings forward', beter: 'Keep it close to your body, as if you zip up your jacket.' },
    ],
    ademhaling: 'Breathe in before the pull, hold it on the way up and breathe out at the top.',
    tempo: 'Explosive up, 2 counts back.',
    makkelijker: 'Choose the single arm kettlebell swing to learn the hip movement.',
    zwaarder: 'Choose a heavier dumbbell with the same clean technique.',
  },
}
