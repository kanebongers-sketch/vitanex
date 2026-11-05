// Engelse coaching van de Blender-oefeningen uit golf 3 (04-11-2026): hangen aan de
// optrekstang, dips, box, muur en nordic. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF3: Readonly<Record<string, Coaching>> = {
  'Pull-up': {
    kernpunten: [
      { punt: 'Start from a still hang', uitleg: 'Every rep starts without a swing. That way your back pulls the weight, not your momentum.' },
      { punt: 'Shoulders down first', uitleg: 'Set your shoulders low before your arms bend. Your neck stays long and relaxed.' },
      { punt: 'Elbows to your sides', uitleg: 'Pull your elbows towards your ribs. You feel it wide under your armpits.' },
      { punt: 'Lower all the way, calmly', uitleg: 'Lower yourself over 2 to 3 counts until your arms are straight.' },
    ],
    opstelling: [
      'Grip the bar slightly wider than shoulder width with your palms facing away from you.',
      'Hang with straight arms, core and glutes lightly braced, legs still.',
    ],
    stappen: [
      'Pull your shoulders down from a still hang.',
      'Pull yourself up until your chin is above the bar.',
      'Lower over 2 to 3 counts until your arms are straight.',
    ],
    fouten: [
      { fout: 'Swinging and kicking the legs', beter: 'Core braced and legs still. Better 3 clean reps than 8 with a swing.' },
      { fout: 'Stopping halfway', beter: 'Go back to straight arms every time. If you cannot, choose the assisted variant.' },
      { fout: 'Reaching your chin over the bar', beter: 'Head neutral and chest to the bar. Your neck stays long.' },
    ],
    ademhaling: 'Breathe out as you pull up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use the assisted pull-up machine or a band, or practise only the lowering from the top.',
    zwaarder: 'Hold the top for 2 counts or do them with a weight vest.',
  },
  'Chin-up': {
    kernpunten: [
      { punt: 'Start from a still hang', uitleg: 'Every rep starts without a swing. That way your back and biceps pull, not your momentum.' },
      { punt: 'Shoulders away from your ears', uitleg: 'Set your shoulders low first. Your neck stays long and relaxed while you pull up.' },
      { punt: 'Chest to the bar', uitleg: 'Pull your chest up towards the bar until your chin is above it.' },
      { punt: 'Lower under control', uitleg: 'Lower yourself over 2 to 3 counts to straight arms. Do not drop, that loads your elbows.' },
    ],
    opstelling: [
      'Grip the bar at shoulder width with your palms facing you.',
      'Hang with straight arms, legs still and lightly crossed or straight, core braced.',
    ],
    stappen: [
      'Pull your shoulders down from a still hang.',
      'Pull your elbows to your sides until your chin is above the bar.',
      'Lower calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Swinging with the legs', beter: 'Core braced and legs still. Better fewer reps than swinging along.' },
      { fout: 'Only the top part', beter: 'Go back to straight arms every time. Half reps do not count.' },
      { fout: 'Reaching your chin over the bar', beter: 'Head neutral. If you cannot get there, take the assisted variant.' },
    ],
    ademhaling: 'Breathe out while pulling up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use the assisted pull-up machine with the same grip, or do only the lowering from the top.',
    zwaarder: 'Hold the top for 2 counts or do them with a weight vest.',
  },
  'Pull-up met neutrale greep': {
    kernpunten: [
      { punt: 'Palms facing each other', uitleg: 'You hold the parallel handles. That often feels better for shoulders and elbows.' },
      { punt: 'Shoulders low', uitleg: 'Set your shoulders down before you pull up. Your neck stays relaxed.' },
      { punt: 'Chest to your hands', uitleg: 'Pull your chest towards your hands until your chin is above them. Elbows move along your sides.' },
      { punt: 'No swing', uitleg: 'Every rep starts still. Better fewer reps than swinging along.' },
    ],
    opstelling: [
      'Grip the parallel handles with your palms facing each other.',
      'Hang with straight arms, core braced and legs still.',
    ],
    stappen: [
      'Pull your shoulders down from a still hang.',
      'Pull yourself up until your chin is above your hands.',
      'Lower calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Using the legs to get up', beter: 'Legs still and core braced. If you cannot do it cleanly, use a band or the assisted machine.' },
      { fout: 'Not hanging all the way at the bottom', beter: 'Go back to straight arms with your shoulders just away from your ears.' },
      { fout: 'Dropping down quickly', beter: 'Take 2 to 3 counts to lower. That spares your elbows and trains your back.' },
    ],
    ademhaling: 'Breathe out as you pull up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use a band under your knees or feet, or the assisted pull-up machine.',
    zwaarder: 'Hold the top for 2 counts or add weight with a vest.',
  },
  'Negatieve pull-up': {
    kernpunten: [
      { punt: 'Start at the top', uitleg: 'Step or jump to the top position, chin above the bar. You do not pull yourself up.' },
      { punt: 'As slowly as possible', uitleg: 'The work is in the lowering. Try to brake for 3 to 5 counts, all the way down.' },
      { punt: 'Shoulders low', uitleg: 'Keep your shoulders away from your ears, also at the top. Then your back stays active.' },
      { punt: 'Body still', uitleg: 'Knees bent and core on, so you do not start to swing.' },
    ],
    opstelling: [
      'Put a bench or box under the bar, so you can start at the top.',
      'Grip the bar slightly wider than shoulder width with your palms facing away from you.',
    ],
    stappen: [
      'Step up until your chin is above the bar and lift your feet.',
      'Lower yourself as slowly as possible until your arms are straight.',
      'Put your feet back on the box and step or jump to the top position again.',
    ],
    fouten: [
      { fout: 'Lowering too fast', beter: 'Count out loud. If 3 counts does not work, use the assisted pull-up first.' },
      { fout: 'Letting go with a jolt at the bottom', beter: 'Brake until your arms are straight and then calmly put your feet down.' },
      { fout: 'Shoulders shoot up', beter: 'Pull your shoulders down and keep your chest towards the bar.' },
    ],
    ademhaling: 'Breathe out calmly while lowering, breathe in as you step back up.',
    tempo: '3 to 5 counts down, calmly back to the top position.',
    makkelijker: 'Do a negative with a band around the bar under your feet or knees.',
    zwaarder: 'Lower over 6 to 8 counts or hold for 2 counts halfway.',
  },
  'Hanging knee raise': {
    kernpunten: [
      { punt: 'Hang still, no swinging', uitleg: 'Start every rep from a standstill. If you swing, momentum does the work instead of your abs.' },
      { punt: 'Active shoulders', uitleg: 'Pull your shoulders slightly away from your ears. That way you do not hang slack in your joints.' },
      { punt: 'Roll your pelvis up', uitleg: 'Bring your knees up and tilt your pelvis forward with them. Only then do your abs fully work.' },
      { punt: 'Lower under control', uitleg: 'Let your legs come down calmly. If they drop, you start the next rep with a swing.' },
    ],
    opstelling: [
      'Grip the bar at shoulder width with your palms facing forward and hang with straight arms.',
      'Let your legs hang straight below you and brace your core before the first rep.',
    ],
    stappen: [
      'Pull your shoulders down slightly and lock your torso.',
      'Bring your knees up above hip height and roll your pelvis towards your chest.',
      'Lower your legs over 2 to 3 counts until they hang straight again.',
    ],
    fouten: [
      { fout: 'Swinging back and forth', beter: 'Wait at the bottom until you hang still and brace your core before your knees come up.' },
      { fout: 'Knees only to hip height', beter: 'Keep rolling until your pelvis tilts and your knees move towards your chest. That last part is your abs.' },
      { fout: 'Hanging slack in the shoulders', beter: 'Keep your shoulders active and away from your ears. If you cannot anymore, stop the set.' },
    ],
    ademhaling: 'Breathe out as you bring your knees up and breathe in as you lower them.',
    tempo: '1 count up, a short pause, 3 counts down.',
    makkelijker: 'Support yourself on your forearms in a knee raise station, so your grip does not have to work.',
    zwaarder: 'Keep your legs straight as you lift them or hold a light dumbbell between your feet.',
  },
  'Inverted row': {
    kernpunten: [
      { punt: 'Body like a plank', uitleg: 'A straight line from heels to head. Glutes and core tight, your hips do not sag.' },
      { punt: 'Chest to the bar', uitleg: 'Your chest goes to the bar, not your chin. That keeps your neck relaxed.' },
      { punt: 'Shoulder blades together', uitleg: 'Squeeze your shoulder blades together at the top. You feel it between your shoulders.' },
      { punt: 'Lower under control', uitleg: 'Lower over 2 counts until your arms are straight. Do not drop.' },
    ],
    opstelling: [
      'Set a bar in the rack or the Smith machine at about hip height.',
      'Hang under it with your hands slightly wider than shoulder width, palms facing away from you, heels on the floor and body straight.',
    ],
    stappen: [
      'Hang under the bar with straight arms and a straight body.',
      'Pull your chest to the bar and bring your shoulder blades together.',
      'Lower calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Squeeze your glutes and keep your core braced. Your body moves as one piece.' },
      { fout: 'Pushing your chin forward', beter: 'Head in line with your body and pull with your chest to the bar.' },
      { fout: 'Shoulders pull up to your ears', beter: 'Keep your shoulders low and pull your elbows back.' },
    ],
    ademhaling: 'Breathe out as you pull yourself up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Set the bar higher or bend your knees with your feet flat, then you are more upright and it is lighter.',
    zwaarder: 'Set the bar lower or put your feet on a bench.',
  },
  'Dips voor de borst': {
    kernpunten: [
      { punt: 'Lean slightly forward', uitleg: 'Bring your chest slightly forward and your legs slightly back. That forward angle puts the work on your chest.' },
      { punt: 'Shoulders low', uitleg: 'Push the bars down and keep your shoulders away from your ears. That way you do not hang in your joints.' },
      { punt: 'Lower to a light stretch', uitleg: 'Go as deep as your shoulders comfortably allow, about until your upper arms are level. No further.' },
      { punt: 'Elbows slightly out', uitleg: 'Let your elbows flare a little, not wide. That gives your chest room to work.' },
    ],
    opstelling: [
      'Grip the bars slightly wider than your shoulders if the station allows and push yourself up with straight arms.',
      'Bend your knees with your feet behind you and lean your torso slightly forward.',
    ],
    stappen: [
      'Lower under control with your torso slightly forward until you feel a stretch in your chest.',
      'Stop at about the point where your upper arms are level.',
      'Push yourself up until your arms are straight, your torso keeps the same angle.',
    ],
    fouten: [
      { fout: 'Going too deep', beter: 'Stop at a light stretch. If the front of your shoulder hurts, make the movement smaller or choose another exercise.' },
      { fout: 'Torso shoots upright as you push', beter: 'Hold the forward angle for the whole rep. Upright turns it into a triceps dip.' },
      { fout: 'Dropping into the bottom', beter: 'Brake the descent and pause briefly at the bottom. No bounce out of the bottom.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push up.',
    tempo: '2 to 3 counts down, a short pause, 1 count up.',
    makkelijker: 'Use the assisted dip machine or a band for help, or first do only the lowering slowly.',
    zwaarder: 'Hang a weight from a dip belt or make the lowering 4 counts long.',
  },
  'Step-up': {
    kernpunten: [
      { punt: 'Whole foot on the box', uitleg: 'Put your whole foot on the box, not just the ball of your foot. That way you can push through your heel.' },
      { punt: 'Push with the front leg', uitleg: 'The leg on the box lifts you up. Push off as little as possible with your back foot.' },
      { punt: 'Knee over your foot', uitleg: 'Your knee points towards your toes and does not cave in as you step up.' },
      { punt: 'Step down under control', uitleg: 'Lower yourself calmly. Do not fall back to the floor.' },
    ],
    opstelling: [
      'Choose a sturdy box, bench or step where your knee does not come higher than your hip.',
      'Stand straight in front of the box with your hands on your hips and put one foot fully on it.',
    ],
    stappen: [
      'Lean slightly forward and push through the heel of your front foot.',
      'Straighten your leg and stand tall on the box, your other foot joins.',
      'Step your other foot back to the floor under control and then put your working leg next to it. Switch legs.',
    ],
    fouten: [
      { fout: 'Pushing off with the bottom leg', beter: 'Consciously lift your back toes slightly, then your front leg does the work.' },
      { fout: 'Knee caves in', beter: 'Push your knee out in line with your toes. Choose a lower box if that does not work.' },
      { fout: 'Box too high', beter: 'Choose a height where your knee does not come above your hip.' },
    ],
    ademhaling: 'Breathe out as you step up, breathe in as you step down.',
    tempo: '1 count up, 2 counts down under control.',
    makkelijker: 'Use a lower step and hold on to a rack.',
    zwaarder: 'Hold dumbbells in your hands or choose a slightly higher box.',
  },
  'Box jump': {
    kernpunten: [
      { punt: 'Swing your arms', uitleg: 'Arms back as you dip and powerfully forward and up. That gives your jump extra height.' },
      { punt: 'Land softly', uitleg: 'Land with your whole foot on the box and bend your knees and hips, as if you want to land without a sound.' },
      { punt: 'Knees out on landing', uitleg: 'Your knees point in the direction of your toes. If they cave in, the box is too high.' },
      { punt: 'Step down calmly', uitleg: 'Step down one leg at a time. Jumping back gives a hard landing without adding anything.' },
    ],
    opstelling: [
      'Choose a sturdy box that cannot slide and start low, for example 30 to 40 cm.',
      'Stand half a step from the box with your feet hip width apart.',
    ],
    stappen: [
      'Dip quickly into a short squat and swing your arms back.',
      'Jump explosively up and forward, arms swinging along.',
      'Land softly with both feet at the same time in the middle of the box and stand up tall.',
      'Step down calmly one leg at a time.',
    ],
    fouten: [
      { fout: 'Box too high', beter: 'If you land in a deep squat or with your knees against your chest, the box is too high. Choose a box you land on upright.' },
      { fout: 'Landing hard with straight legs', beter: 'Bend as you land and absorb your weight with your hips and knees.' },
      { fout: 'Carrying on when tired', beter: 'Stop when your jumps get lower or sloppier. Quality over quantity, a miss on a box hurts.' },
    ],
    ademhaling: 'Breathe out briefly at take off and breathe in calmly as you stand on the box.',
    tempo: 'Explosive up, each jump separate with a short pause in between.',
    makkelijker: 'Use a lower box or do a step-up at a brisk pace.',
    zwaarder: 'Raise the box gradually, never higher than you can land on softly and upright.',
  },
  'Wall sit': {
    kernpunten: [
      { punt: 'Back flat against the wall', uitleg: 'Your whole back and the back of your head touch the wall. That keeps your torso still and your back neutral.' },
      { punt: 'Knees over your ankles', uitleg: 'Put your feet far enough from the wall so your knees are straight above your ankles.' },
      { punt: 'Weight on your heels', uitleg: 'Push your heels into the floor. You feel your thighs burn, not your knees.' },
      { punt: 'Hands off your legs', uitleg: 'Do not rest your hands on your thighs. Stretch them out in front of you or cross them over your chest.' },
    ],
    opstelling: [
      'Stand with your back against a wall and put your feet about two foot lengths forward, hip width apart.',
      'Stretch your arms out in front of you, or cross them over your chest.',
    ],
    stappen: [
      'Slide down the wall until your knees make about a right angle.',
      'Hold that position for the agreed time and keep breathing calmly.',
      'Slide back up the wall or put your hands on your thighs to stand up.',
    ],
    fouten: [
      { fout: 'Feet too close to the wall', beter: 'Move your feet further forward until your knees are above your ankles and not over your toes.' },
      { fout: 'Knees cave in', beter: 'Push your knees slightly out, in line with your toes. Your feet stay flat and hip width apart.' },
      { fout: 'Leaning on your thighs', beter: 'Take your hands off your legs. If you need support, choose a higher position.' },
    ],
    ademhaling: 'Breathe calmly and steadily, do not hold your breath.',
    tempo: 'Hold still, for example 20 to 45 seconds.',
    makkelijker: 'Go less deep, so your knees bend less than a right angle.',
    zwaarder: 'Hold longer or put a plate on your thighs.',
  },
  'Nordic hamstring curl': {
    kernpunten: [
      { punt: 'Straight line knee to head', uitleg: 'You do not bend at the hips. Your whole body falls forward like a plank.' },
      { punt: 'As slowly as possible', uitleg: 'The work is in the braking. Stretch the way down as long as you can.' },
      { punt: 'Glutes on', uitleg: 'With your glutes and core braced your hips stay straight and your hamstrings work.' },
      { punt: 'Catch yourself with your hands', uitleg: 'Keep your hands ready in front of your chest and catch yourself softly when you cannot hold it anymore.' },
    ],
    opstelling: [
      'Kneel on a mat with your heels fixed under a roller or a sturdy support, or have someone hold your ankles.',
      'Come up tall on your knees, arms crossed over your chest or hands ready to catch.',
    ],
    stappen: [
      'Let your body lower forward in a straight line as slowly as possible.',
      'Catch yourself with your hands as soon as you cannot brake anymore.',
      'Push yourself back up with your hands and pull along with your hamstrings.',
    ],
    fouten: [
      { fout: 'Bending at the hips', beter: 'Glutes on and hips forward. Then lower less far until you can hold the line.' },
      { fout: 'Falling too fast', beter: 'Lower less far and brake on purpose. A short, slow part is better than a long fall.' },
      { fout: 'Too many reps too soon', beter: 'Start with few reps and build up each week. This exercise is hard on your hamstrings.' },
    ],
    ademhaling: 'Breathe out calmly while lowering, breathe in as you come back up.',
    tempo: '3 to 5 counts down, back up with help from your hands.',
    makkelijker: 'Use a band around your chest attached to a rack behind you that supports you.',
    zwaarder: 'Brake all the way to the floor and pull yourself back up without your hands.',
  },
}
