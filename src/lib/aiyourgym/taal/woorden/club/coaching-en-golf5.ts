// Engelse coaching van de Blender-oefeningen uit golf 5 (05-11-2026): de machines.
// Het Nederlands in de oefenbibliotheek (src/lib/club/training/coaching) is de bron;
// dit zegt precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF5: Readonly<Record<string, Coaching>> = {
  'Leg press': {
    kernpunten: [
      { punt: 'Lower back against the pad', uitleg: 'Your glutes and lower back stay against the pad. If they lift off, you are going too deep.' },
      { punt: 'Knees in line with your toes', uitleg: 'Your knees move in the direction of your toes. They do not cave in or flare out.' },
      { punt: 'Knees not locked', uitleg: 'Almost straighten at the top, but not fully. That keeps the weight on your muscles, not on your joint.' },
      { punt: 'Push with your whole foot', uitleg: 'Your heels stay on the platform. You feel it in your glutes and thighs.' },
    ],
    opstelling: [
      'Set the backrest so your lower back rests firmly against the pad.',
      'Place your feet hip width apart in the middle of the platform, toes slightly out. Hold the handles next to the seat.',
      'Push the platform up slightly and release the safety handles.',
    ],
    stappen: [
      'Lower the platform under control until your knees are at roughly a right angle.',
      'Push the platform back with your whole foot until your legs are almost straight.',
      'Lock the safety handles again after the last rep.',
    ],
    fouten: [
      { fout: 'Glutes lift off the pad', beter: 'Go less deep. Your pelvis must not tilt, that puts pressure on your lower back.' },
      { fout: 'Knees lock at the top', beter: 'Stop just before full extension and keep a slight bend in your knees.' },
      { fout: 'Pushing with your hands on your knees', beter: 'Keep hold of the handles. If the rep does not work without help, use less weight.' },
    ],
    ademhaling: 'Breathe in and brace your core before the platform lowers, breathe out when your legs are almost straight.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Less weight and a shallower depth.',
    zwaarder: 'Pause for 2 counts at the bottom or push with one leg at a time.',
  },
  'Leg press zittend': {
    kernpunten: [
      { punt: 'Back against the backrest', uitleg: 'Your lower back and glutes stay against the pad. If they lift off, you are going too deep.' },
      { punt: 'Feet in the middle of the plate', uitleg: 'Hip width apart, toes slightly out. Your knees follow the direction of your toes.' },
      { punt: 'Push through your whole foot', uitleg: 'Your heels stay on the plate. That way your thighs and glutes work together.' },
      { punt: 'Knees not locked', uitleg: 'Almost fully straighten your legs, but keep a slight bend at the end.' },
    ],
    opstelling: [
      'Set the backrest or the sled so your knees are at roughly a right angle in the starting position.',
      'Place your feet hip width apart in the middle of the plate and hold the handles next to the seat.',
    ],
    stappen: [
      'Push the plate away until your legs are almost straight.',
      'Let your knees bend under control to roughly a right angle, or as deep as you can with your back against the backrest.',
      'Push away again without bouncing.',
    ],
    fouten: [
      { fout: 'Glutes lift off the seat', beter: 'Bend your knees less far or move the backrest further back.' },
      { fout: 'Knees cave in', beter: 'Push your knees in line with your toes. Place your feet slightly wider if that helps.' },
      { fout: 'Knees locked at the top', beter: 'Stop just before your legs are fully straight and go straight into the next rep.' },
    ],
    ademhaling: 'Breathe in as your knees bend, breathe out as you push the plate away.',
    tempo: '2 counts back, a short pause, 1 count to push away.',
    makkelijker: 'Use less weight and make the movement slightly smaller.',
    zwaarder: 'Do the exercise with one leg or pause for 2 counts at the bottom.',
  },
  'Hack squat': {
    kernpunten: [
      { punt: 'Back flat against the pad', uitleg: 'Your whole back and your glutes stay against the pad. If your lower back lifts off, you are going too deep.' },
      { punt: 'Knees in line with your toes', uitleg: 'Your knees move in the direction of your toes, they do not cave in.' },
      { punt: 'Push with your whole foot', uitleg: 'Heels and forefoot push against the platform together. You mainly feel the front of your thighs.' },
      { punt: 'Knees not locked', uitleg: 'Almost fully straighten at the top, but keep a little bend. That keeps the tension on your muscles.' },
    ],
    opstelling: [
      'Place your shoulders under the pads and your back against the backrest.',
      'Place your feet hip width apart in the middle of the platform, toes slightly out.',
      'Only release the safety handle once you are standing firmly.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Lower under control until your knees are at roughly a right angle.',
      'Push yourself back up with your whole foot.',
      'Lock the safety catch again after the last rep.',
    ],
    fouten: [
      { fout: 'Heels lift off the platform', beter: 'Place your feet slightly higher on the platform so your whole foot stays down.' },
      { fout: 'Knees cave in', beter: 'Actively push your knees out. If that does not work, use less weight.' },
      { fout: 'Bouncing at the bottom', beter: 'Slow down and turn around calmly at the bottom. Do not spring back off your knees.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out when you are almost at the top.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Less weight and less depth, or start with the leg press.',
    zwaarder: 'Pause for 2 counts at the bottom or place your feet slightly lower for more work in your thighs.',
  },
  'Calf raise staand': {
    kernpunten: [
      { punt: 'Full range of motion', uitleg: 'From heels deep below the edge to as high on your toes as possible. That trains your calf along its whole length.' },
      { punt: 'Knees straight, not locked', uitleg: 'Keep your knees slightly relaxed but do not bend them during the movement. Your calf does the work, not your legs.' },
      { punt: 'No bouncing at the bottom', uitleg: 'Wait one count in the stretch before you push up. That way your calf muscle really works, not your Achilles tendon as a spring.' },
      { punt: 'Body tall and upright', uitleg: 'Shoulders under the pads, back straight, hips above your feet. Do not lean forward.' },
    ],
    opstelling: [
      'Set the shoulder pads so you just fit under them with slightly bent knees.',
      'Place the balls of your feet on the edge, heels free, feet hip width apart with toes pointing straight ahead.',
    ],
    stappen: [
      'Straighten your legs until the weight lifts and stand upright.',
      'Lower your heels calmly below the edge and feel the stretch.',
      'Push yourself as high as possible through the balls of your feet, hold briefly and lower again.',
    ],
    fouten: [
      { fout: 'Bouncing up out of the stretch', beter: 'Pause for one count at the bottom and then push up calmly. Use less weight if that does not work.' },
      { fout: 'Bending your knees to help push', beter: 'Keep the angle in your knee the same. If your legs help push, the weight is too heavy.' },
      { fout: 'Only doing the top part', beter: 'Really lower below the edge. Better to use less weight with the full movement.' },
    ],
    ademhaling: 'Breathe out as you push up, breathe in as your heels lower.',
    tempo: '1 count up, 1 count pause at the top, 2 to 3 counts down, a pause at the bottom.',
    zwaarder: 'Hold for 2 counts in the stretch at the bottom and 2 counts at the top, or do the last set on one leg.',
  },
  'Calf raise zittend': {
    kernpunten: [
      { punt: 'Pad just above your knees', uitleg: 'The pad rests on your thighs just above the knee. On the kneecap itself it puts needless pressure on it.' },
      { punt: 'Heels as high as possible', uitleg: 'Push your heels up until you are really up on the balls of your feet. You feel it deep in the lower part of your calf.' },
      { punt: 'Hold briefly at the top', uitleg: 'One count still in the highest position. That is the part you skip most easily when seated.' },
      { punt: 'Lower calmly into the stretch', uitleg: 'Lower your heels slowly below the edge. Do not drop and do not bounce back.' },
    ],
    opstelling: [
      'Sit upright with the balls of your feet on the edge and your heels free. Set the pad so it rests firmly on your thighs.',
      'Push your heels up and release the lock before your first rep.',
    ],
    stappen: [
      'Lower your heels calmly until you feel a stretch in your calves.',
      'Push your heels as high as possible through the balls of your feet.',
      'Hold for one count and lower again under control into the stretch.',
    ],
    fouten: [
      { fout: 'Pad on the kneecap', beter: 'Slide the pad onto your thighs, just above your knee. That is more comfortable and safer with heavy weight.' },
      { fout: 'Short quick pulses', beter: 'Do the whole movement from deep at the bottom to high at the top, with a pause at both ends.' },
      { fout: 'Pulling the pad up with your hands', beter: 'Only rest your hands on the pad for support. If it does not work without pulling, use less weight.' },
    ],
    ademhaling: 'Breathe out as your heels rise, breathe in as they lower.',
    tempo: '1 count up, 1 count pause, 2 to 3 counts down.',
    zwaarder: 'Hold for 2 counts at the top and 2 counts in the stretch at the bottom.',
  },
  'Hip thrust machine': {
    kernpunten: [
      { punt: 'Push through your heels', uitleg: 'Your feet are flat and your weight is on your heels. Then you feel it in your glutes instead of your thighs.' },
      { punt: 'No arched back at the top', uitleg: 'Stop when your hips are extended. Going higher only happens through your lower back.' },
      { punt: 'Chin slightly to your chest', uitleg: 'Look forward, not at the ceiling. That helps keep your ribs down.' },
      { punt: 'Squeeze your glutes fully', uitleg: 'Squeeze your glutes hard for one count at the top. That is the most important moment of the rep.' },
    ],
    opstelling: [
      'Sit with your upper back against the back pad and place the belt or pad across your hips, on the hip bones.',
      'Place your feet hip width apart so your shins point straight up at the top.',
    ],
    stappen: [
      'Brace your core and push your heels into the platform.',
      'Push your hips up until you are straight from shoulders to knees and squeeze your glutes.',
      'Hold for one count and lower calmly until the weight is just not resting.',
    ],
    fouten: [
      { fout: 'Arched back at the top', beter: 'Keep your ribs down and your chin slightly tucked. Stop when your glutes are fully squeezed.' },
      { fout: 'Feet too close or too far', beter: 'Move your feet until your shins are upright at the top. Then most of the work is in your glutes.' },
      { fout: 'Dropping the weight', beter: 'Lower in 2 counts and do not let the weight rest between reps.' },
    ],
    ademhaling: 'Breathe out as you push your hips up, breathe in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    zwaarder: 'Hold for 3 counts at the top or do the last reps with one leg.',
  },
  'Squat in de smith machine': {
    kernpunten: [
      { punt: 'Feet slightly in front of the bar', uitleg: 'Place your feet a little in front of your body, so you lower straight down and your heels stay on the floor.' },
      { punt: 'Neutral back', uitleg: 'The machine gives support, but your back has to stay straight by itself. Core braced.' },
      { punt: 'Knees follow your toes', uitleg: 'Your knees move in the direction of your toes and do not cave in.' },
      { punt: 'Set the safety stops correctly', uitleg: 'Set the stops just below your lowest point. Then you can always put the bar down safely.' },
    ],
    opstelling: [
      'Set the bar at shoulder height and the safety stops just below the point where your thighs are horizontal.',
      'Stand under the bar with the bar on your upper back and your feet shoulder width apart, slightly in front of the bar.',
      'Unhook the bar by rotating your wrists.',
    ],
    stappen: [
      'Breathe in and brace your core.',
      'Lower until your thighs are roughly horizontal.',
      'Push the floor away with your whole foot and come up.',
      'Hook the bar back in after the last rep by rotating your wrists back.',
    ],
    fouten: [
      { fout: 'Feet directly under the bar', beter: 'Place your feet a little forward. That keeps your weight on your midfoot and your heels on the floor.' },
      { fout: 'Leaning against the bar', beter: 'Stand firmly yourself. The bar moves along, but your torso carries the weight.' },
      { fout: 'Too deep with a tilting pelvis', beter: 'Only lower as far as your lower back stays neutral.' },
    ],
    ademhaling: 'Breathe in and hold while lowering, breathe out at the top.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Less weight and lower to a bench behind you.',
    zwaarder: 'Pause for 2 counts at the bottom or increase the weight step by step.',
  },
  'Bankdrukken in de smith machine': {
    kernpunten: [
      { punt: 'Bar above your mid chest', uitleg: 'Position the bench so the bar lowers straight onto your mid chest. The guide runs straight, so you have to lie in the right spot.' },
      { punt: 'Shoulder blades together and down', uitleg: 'Squeeze your shoulder blades together and towards your back pockets. Your chest is then lifted and your shoulders rest safely on the bench.' },
      { punt: 'Wrists above your elbows', uitleg: 'Your forearms are vertical at the lowest point. That sends the force straight into the bar and not through your wrists.' },
      { punt: 'Elbows angled down', uitleg: 'Keep your elbows about 45 degrees from your torso, not flared wide. That spares your shoulders.' },
    ],
    opstelling: [
      'Slide the bench under the bar until it hangs above your mid chest and set the safety stops just below chest height.',
      'Grip the bar slightly wider than your shoulders, feet flat on the floor and glutes on the bench.',
    ],
    stappen: [
      'Rotate the bar out of the hooks with your wrists and hold it with straight arms above your chest.',
      'Lower it calmly until it almost touches your chest.',
      'Push it straight up until your arms are straight, without snapping your elbows into lock.',
      'Rotate the bar back into the hooks after your last rep.',
    ],
    fouten: [
      { fout: 'Bar lowers to your neck or belly', beter: 'Move the bench. The bar must land on your mid chest, otherwise the line of your shoulders is wrong.' },
      { fout: 'Safety stops too low or not used', beter: 'Always set them just below your chest. If a rep fails, you let the bar rest on them.' },
      { fout: 'Glutes lift off the bench', beter: 'Keep your glutes on the bench and press your feet into the floor. Too heavy? Take a plate off.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out as you push the bar up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Start with just the bar or choose the chest press machine to learn the press calmly first.',
    zwaarder: 'Add weight in small steps or make the lowering phase 4 counts long.',
  },
  'Schuin bankdrukken in de smith machine': {
    kernpunten: [
      { punt: 'Bar above your upper chest', uitleg: 'Position the bench so the bar lands just below your collarbone. Then mainly your upper chest works.' },
      { punt: 'Shoulder blades into the bench', uitleg: 'Pull them back and down. That gives you a solid base and keeps your shoulders steady.' },
      { punt: 'Elbows under the bar', uitleg: 'Your forearms are vertical, elbows slightly below shoulder height.' },
      { punt: 'Lower under control', uitleg: 'Lower the bar calmly to your chest and then press it back up.' },
    ],
    opstelling: [
      'Set a bench at 30 to 45 degrees under the bar and sit with your back and head against the backrest.',
      'Grip the bar slightly wider than shoulder width and place your feet flat on the floor.',
    ],
    stappen: [
      'Rotate the bar out of the hooks and hold it with straight arms above your chest.',
      'Lower it until it almost touches your upper chest.',
      'Press the bar up until your arms are straight and rotate it back into the hooks after the last rep.',
    ],
    fouten: [
      { fout: 'Bar lowers to your neck', beter: 'Move the bench until the bar lands above your upper chest.' },
      { fout: 'Shoulders slide forward', beter: 'Keep your shoulder blades pulled back, at the top as well.' },
      { fout: 'Glutes come off the bench', beter: 'Keep your glutes on the bench and your feet flat. Use less weight if that does not work.' },
    ],
    ademhaling: 'Breathe in and brace your core before you lower, breathe out as you press.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Use less weight or set the bench less steep.',
    zwaarder: 'Pause for one count at the bottom just above your chest.',
  },
  'Leg extension': {
    kernpunten: [
      { punt: 'Knee at the pivot', uitleg: 'Your knee lines up with the axis of the machine. That keeps the movement smooth and the pad does not slide over your shin.' },
      { punt: 'Straighten calmly', uitleg: 'Straighten your legs without a jerk or swing. You feel the front of your thighs tighten.' },
      { punt: 'Hold briefly at the top', uitleg: 'Hold the extension for 1 count and consciously tighten your thigh before you lower.' },
      { punt: 'Glutes on the seat', uitleg: 'Hold the handles and stay seated. If you lift out of the seat, it is too heavy.' },
    ],
    opstelling: [
      'Set the backrest so your knees line up with the pivot.',
      'Place the pad on your shins, just above your ankles. Hold the handles next to the seat.',
    ],
    stappen: [
      'Brace your core lightly and sit upright.',
      'Straighten your legs under control until they are almost straight.',
      'Lower the pad calmly until your knees are back at roughly a right angle.',
    ],
    fouten: [
      { fout: 'Swinging your legs up', beter: 'Use less weight and straighten in one calm count. Swinging loads your knee and trains your muscle less.' },
      { fout: 'Pad too high on the shin', beter: 'Set the pad lower, just above your ankles.' },
      { fout: 'Dropping the weight', beter: 'Slow down on the way down, in 2 to 3 counts.' },
    ],
    ademhaling: 'Breathe out as you straighten, breathe in as you lower.',
    tempo: '1 count to straighten, 1 count hold, 3 counts back.',
    makkelijker: 'With sensitive knees: light weight and only the part of the movement that feels pain free.',
    zwaarder: 'Straighten with two legs and lower slowly with one leg.',
  },
  'Leg curl zittend': {
    kernpunten: [
      { punt: 'Knee at the pivot', uitleg: 'Your knee lines up with the axis of the machine. Then the pad moves smoothly with your leg.' },
      { punt: 'Back against the backrest', uitleg: 'Sit upright with your back against the pad. Do not lean forward or pull with your arms.' },
      { punt: 'Thighs locked in', uitleg: 'The leg pad presses firmly on your thighs. That way you can only pull with your hamstrings.' },
      { punt: 'Return slowly', uitleg: 'Let your legs come back in 2 to 3 counts. You feel the stretch in the back of your thighs.' },
    ],
    opstelling: [
      'Set the backrest so your knee is at the pivot.',
      'Place the lower pad just above your heels and set the thigh pad firmly on your thighs, just above your knees.',
    ],
    stappen: [
      'Hold the handles and sit upright.',
      'Bend your knees and pull the pad as far under you as you can.',
      'Let your legs return under control until they are almost straight.',
    ],
    fouten: [
      { fout: 'Thigh pad is too loose', beter: 'Set the pad tighter on your thighs so your hips cannot lift.' },
      { fout: 'Half the movement', beter: 'Bend as far as you can and straighten almost fully. Use lighter weight if needed.' },
      { fout: 'Knee not at the pivot', beter: 'Move the backrest until your knee and the axis line up.' },
    ],
    ademhaling: 'Breathe out as you bend your knees, breathe in on the way back.',
    tempo: '1 count to bend, a short hold, 3 counts back.',
    makkelijker: 'Less weight and a slightly smaller movement.',
    zwaarder: 'Bend with two legs and return with one leg in 4 counts.',
  },
  'Adductor machine': {
    kernpunten: [
      { punt: 'Back against the backrest', uitleg: 'Sit upright with your lower back against the pad, then the work stays in the inside of your thighs.' },
      { punt: 'Start with a small spread', uitleg: 'Do not set the starting position too wide. A light stretch is good, pulling in your groin is too much.' },
      { punt: 'Squeeze closed calmly', uitleg: 'Bring your legs together under control and feel the inside of your thighs tighten.' },
      { punt: 'Do not drop the weight', uitleg: 'Let the pads return calmly without the weights tapping together.' },
    ],
    opstelling: [
      'Set the starting position so your legs are spread with a light stretch, not as wide as possible.',
      'Place your feet on the supports and rest the inside of your knees against the pads. Hold the handles.',
    ],
    stappen: [
      'Brace your core lightly and sit upright.',
      'Bring your legs together under control until the pads almost touch.',
      'Let them return calmly to the starting position.',
    ],
    fouten: [
      { fout: 'Starting position too wide', beter: 'Reduce the spread. Only once it feels good can you set it one step wider.' },
      { fout: 'Leaning forward while squeezing', beter: 'Keep your back against the backrest and pull with your legs, not with your upper body.' },
      { fout: 'Letting your legs snap back', beter: 'Slow the return down over 2 counts. That way you work through the whole movement.' },
    ],
    ademhaling: 'Breathe out as you bring your legs together, breathe in as they go back.',
    tempo: '1 count closed, a short hold, 2 counts back.',
    makkelijker: 'Reduce the spread and use less weight.',
    zwaarder: 'Hold your legs squeezed together for 2 counts before you let them go back.',
  },
  'Abductor machine': {
    kernpunten: [
      { punt: 'Pelvis still on the seat', uitleg: 'Your glutes stay flat on the pad. Sliding or rocking takes the work out of the side of your hip.' },
      { punt: 'Push your knees out', uitleg: 'Think of your knees moving apart, not your feet. You feel it on the outside of your hip and glute.' },
      { punt: 'Return slowly', uitleg: 'Do not let the pads snap back. Returning calmly is what keeps the tension on your glutes.' },
      { punt: 'Lean slightly forward', uitleg: 'Leaning a little forward with a straight back puts more work on your glutes. Upright mainly works the side of your hip.' },
    ],
    opstelling: [
      'Set the starting position so your legs are closed but the weight is just not resting on the stack.',
      'Sit deep in the seat, feet on the supports and the pads on the outside of your knees. Hold the handles.',
    ],
    stappen: [
      'Brace your core lightly and set your pelvis firmly on the seat.',
      'Push your knees out to the widest opening you reach without rocking.',
      'Hold for one count and let your legs return calmly to just before the stack.',
    ],
    fouten: [
      { fout: 'Hips lift off the seat', beter: 'Use less weight and keep your glutes flat on the pad. The movement is only in your hip joint.' },
      { fout: 'Weight slams back on the stack', beter: 'Do not let the weight rest between reps. Stop just before the plates touch.' },
      { fout: 'Short quick back and forth movements', beter: 'Use the full opening and take your time on the way back. Better less weight with the full movement.' },
    ],
    ademhaling: 'Breathe out as you push your legs out, breathe in as they return.',
    tempo: '1 count out, a short hold, 2 counts back.',
    zwaarder: 'Hold for 2 to 3 counts at the widest point or add small pulses in the open position after the last rep.',
  },
  'Biceps curl machine': {
    kernpunten: [
      { punt: 'Elbows on the pad', uitleg: 'Your upper arms lie flat on the pad and stay there. That way only your biceps work.' },
      { punt: 'Set the seat correctly', uitleg: 'Your armpits rest against the top of the pad and your elbows line up with the pivot.' },
      { punt: 'Almost straighten at the bottom', uitleg: 'Let your arms straighten almost fully, then you work through the whole movement.' },
      { punt: 'Return calmly', uitleg: 'Lower the weight slowly. The way down counts just as much.' },
    ],
    opstelling: [
      'Set the seat so your upper arms lie flat on the pad and your elbows are at the pivot.',
    ],
    stappen: [
      'Grip the handles with your palms facing up.',
      'Bend your arms until the handles are at your shoulders and squeeze briefly.',
      'Lower the weight under control until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Elbows lift off the pad', beter: 'Keep your upper arms on the pad. Use less weight if they come up.' },
      { fout: 'Seat too high or too low', beter: 'Reset the seat until your elbows line up with the pivot.' },
      { fout: 'Weight drops back', beter: 'Lower it in 2 to 3 counts and do not let the plates touch.' },
    ],
    ademhaling: 'Breathe out as you bring the handles towards you, breathe in as you lower them.',
    tempo: '1 count up, a short hold, 2 counts down.',
    makkelijker: 'Use less weight and make the movement slightly smaller.',
    zwaarder: 'Lower the weight in 3 counts or do the exercise with one arm.',
  },
  'Preacher curl machine': {
    kernpunten: [
      { punt: 'Upper arms flat on the pad', uitleg: 'Your armpits rest just against the edge of the pad. Your upper arms stay there.' },
      { punt: 'Not locked at the bottom', uitleg: 'Straighten almost fully, but do not let your elbows snap into lock. That is where your elbow is vulnerable.' },
      { punt: 'Calm tempo', uitleg: 'No jerk at the bottom and no swing at the top. The machine gives the line, you give the control.' },
    ],
    opstelling: [
      'Set the seat so your upper arms lie flat on the pad and your armpits rest against the top edge.',
      'Make sure your elbows line up with the pivot of the machine and grip the handles.',
    ],
    stappen: [
      'Start with your arms almost straight.',
      'Bend your elbows until the handles are at your shoulders and squeeze briefly.',
      'Let the handles return calmly until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Seat too high or too low', beter: 'Set it so your elbows are at the pivot. Then the movement runs smoothly.' },
      { fout: 'Glutes off the seat to push', beter: 'Stay seated with your chest against the pad. Use less weight.' },
      { fout: 'Dropping at the bottom', beter: 'Slow down the last centimetres and stop just before straight.' },
    ],
    ademhaling: 'Breathe out as you curl the handles towards you and breathe in as you let them go back.',
    tempo: '1 count up, a short pause, 3 counts down.',
    zwaarder: 'Do it with one arm at a time or hold for 2 counts at the top.',
  },
  'Seated row machine': {
    kernpunten: [
      { punt: 'Chest against the support', uitleg: 'Your chest stays against the pad the whole time. That way your back pulls and your lower back stays calm.' },
      { punt: 'Shoulder blades together', uitleg: 'Squeeze your shoulder blades together briefly at the end. You feel it in the middle of your back.' },
      { punt: 'No jerking', uitleg: 'Pull calmly and return calmly. A jerk at the start takes the work out of your back.' },
    ],
    opstelling: [
      'Set the chest support so you can just reach the handles with straight arms.',
      'Set the seat so the handles are at roughly chest height and place your feet flat. Grip the upright handles with your palms facing each other.',
    ],
    stappen: [
      'Grip the handles with straight arms and your chest against the support.',
      'Pull the handles towards you until your elbows are next to your torso and squeeze your shoulder blades together.',
      'Return calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Chest comes off the support', beter: 'Keep contact with the pad. If you lift yourself off it, use less weight.' },
      { fout: 'Support too far, arms not straight', beter: 'Move the support closer or further until you just reach the handles with straight arms.' },
      { fout: 'Shoulders shrug up while pulling', beter: 'Keep your shoulders low and think of your elbows going back.' },
    ],
    ademhaling: 'Breathe out as you pull the handles towards you and breathe in as you let them go back.',
    tempo: '1 count pull, 1 count pause, 2 counts back.',
    zwaarder: 'Pull with one arm at a time or hold for 2 counts with your shoulder blades together.',
  },
  'Assisted pull-up': {
    kernpunten: [
      { punt: 'Shoulders down first', uitleg: 'Pull your shoulders away from your ears before your arms bend. That way you start from your back, not from your neck.' },
      { punt: 'Elbows to your sides', uitleg: 'Think of pulling your elbows to your trouser pockets. You then feel it wide under your armpits.' },
      { punt: 'Chest to the bar', uitleg: 'Bring your chest towards the bar instead of stretching your chin over it. Your neck stays long.' },
      { punt: 'Hang all the way down calmly', uitleg: 'Lower in 2 to 3 counts until your arms are straight. The platform must not bounce you up.' },
    ],
    opstelling: [
      'Choose the counterweight: more kilos means more help. Start so you reach 8 to 12 clean reps.',
      'Grip the handles slightly wider than shoulder width with your palms facing away and place your knees or feet firmly on the platform.',
    ],
    stappen: [
      'Hang with straight arms and set your shoulders low.',
      'Pull your elbows down and back until your chin is above the handles.',
      'Lower under control until your arms are straight again.',
    ],
    fouten: [
      { fout: 'Sticking your chin out to get over', beter: 'Head neutral and chest up. If you do not reach the bar, use more counterweight.' },
      { fout: 'Half reps, never fully straight', beter: 'Go back to straight arms every time, then you train your back over its full length.' },
      { fout: 'Shoulders shoot up at the bottom', beter: 'Keep hanging actively: shoulders just away from your ears, also when your arms are straight.' },
    ],
    ademhaling: 'Breathe out as you pull up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use more counterweight, or start with the lat pulldown to learn the movement.',
    zwaarder: 'Reduce the counterweight a little each week until you can do the regular pull-up.',
  },
  'Assisted dips': {
    kernpunten: [
      { punt: 'More weight is more help', uitleg: 'On this machine the weight helps you up. The stronger you get, the less weight you set.' },
      { punt: 'Shoulders low', uitleg: 'Push your shoulders away from your ears. They do not sink in when you are at the bottom.' },
      { punt: 'Lower to a right angle', uitleg: 'Lower until your upper arms are roughly horizontal. No need to go deeper.' },
      { punt: 'Chest slightly forward', uitleg: 'A slight forward lean lets your chest help, upright puts more emphasis on your triceps.' },
    ],
    opstelling: [
      'Choose the weight and kneel on the pad while you grip the handles.',
      'Push yourself up until your arms are almost straight, shoulders low.',
    ],
    stappen: [
      'Lower under control until your upper arms are roughly horizontal.',
      'Push yourself up until your arms are almost straight.',
      'Step off the pad calmly after the last rep.',
    ],
    fouten: [
      { fout: 'Shoulders shoot up to your ears', beter: 'Lower less deep and consciously push your shoulders down before you press back up.' },
      { fout: 'Elbows flared wide', beter: 'Keep your elbows pointing back, close to your body.' },
      { fout: 'Going too deep', beter: 'Stop when your upper arms are horizontal. Deeper puts a lot of pressure on the front of your shoulder.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Set more weight so you get more help.',
    zwaarder: 'Set less weight until you can do dips without help.',
  },
  'Leg curl liggend': {
    kernpunten: [
      { punt: 'Hips on the pad', uitleg: 'Press your hips into the bench. If your glutes come up, your lower back takes over the work.' },
      { punt: 'Heels to your glutes', uitleg: 'Bend your knees as far as possible. You feel the back of your thighs tighten hard.' },
      { punt: 'Return slowly', uitleg: 'Lower the weight in 2 to 3 counts. That is where much of the work for the hamstrings is.' },
      { punt: 'Feet pulled towards you', uitleg: 'Pull your toes slightly towards your shins. That often gives a firmer contraction.' },
    ],
    opstelling: [
      'Lie on your stomach with your knees just past the edge of the bench, level with the pivot.',
      'Place the pad just above your heels and hold the handles.',
    ],
    stappen: [
      'Brace your core and glutes lightly.',
      'Bend your knees and bring your heels as close to your glutes as possible.',
      'Lower the pad calmly until your legs are almost straight.',
    ],
    fouten: [
      { fout: 'Glutes come up', beter: 'Use less weight and consciously press your hips into the pad.' },
      { fout: 'Dropping the weight', beter: 'Slow the return down. If the plates tap together, you are going too fast.' },
      { fout: 'Pad on your calves', beter: 'Set the pad lower, just above your heels, so you can do the whole movement.' },
    ],
    ademhaling: 'Breathe out as you pull your heels to your glutes, breathe in on the way back.',
    tempo: '1 count up, a short hold, 3 counts back.',
    makkelijker: 'Use less weight and make a smaller movement.',
    zwaarder: 'Curl with two legs and lower with one leg, slowly in 4 counts.',
  },
  'Chest press machine': {
    kernpunten: [
      { punt: 'Handles at chest height', uitleg: 'Set the seat so the handles line up with your mid chest. Too high loads your shoulders.' },
      { punt: 'Shoulder blades against the backrest', uitleg: 'Your whole back and your shoulder blades stay against the pad. Your chest is slightly lifted.' },
      { punt: 'Elbows not locked', uitleg: 'Push until your arms are almost straight. That keeps tension on your chest and spares your elbows.' },
      { punt: 'Return calmly', uitleg: 'Let the handles come back under control until you feel a light stretch in your chest, without the weight slamming down.' },
    ],
    opstelling: [
      'Set the seat height so the handles are at chest height and set the starting position so you feel a light stretch.',
      'Place your feet flat on the floor and grip the handles with straight wrists.',
    ],
    stappen: [
      'Push the handles forward under control until your arms are almost straight.',
      'Hold very briefly.',
      'Let them return calmly until you feel a light stretch in your chest.',
    ],
    fouten: [
      { fout: 'Shoulders come off the backrest', beter: 'Keep your shoulder blades against the pad. Push with your chest, not by pushing your shoulders forward.' },
      { fout: 'Weight slams down on the way back', beter: 'Slow the weight down until it almost touches the stack and then start the next rep straight away.' },
      { fout: 'Seat too low or too high', beter: 'Reset the seat. The handles belong at chest height, not at your neck or belly.' },
    ],
    ademhaling: 'Breathe out as you push forward and breathe in as the handles come back.',
    tempo: '1 count push, a short pause, 2 to 3 counts back.',
    zwaarder: 'Make the way back 4 counts long or hold the handles halfway for 2 counts.',
  },
  'Shoulder press machine': {
    kernpunten: [
      { punt: 'Back against the backrest', uitleg: 'Your whole back stays against the pad. That way the machine keeps your torso still and only your shoulders work.' },
      { punt: 'Handles at shoulder height', uitleg: 'At the bottom your hands are at shoulder height. Too low loads your shoulder joint, too high makes the movement short.' },
      { punt: 'Elbows not locked', uitleg: 'Stop just before your arms are fully straight. That keeps the tension on your shoulders.' },
      { punt: 'Lower calmly', uitleg: 'Lower the handles under control and do not let the weights tap on the stack at the bottom.' },
    ],
    opstelling: [
      'Set the seat so the handles are at shoulder height when you sit. Place your feet flat on the floor and your back against the backrest.',
    ],
    stappen: [
      'Brace your core lightly and grip the handles.',
      'Push the handles up until your arms are almost straight.',
      'Lower them calmly until your hands are back at shoulder height.',
    ],
    fouten: [
      { fout: 'Arched back and away from the backrest', beter: 'Press your back against the backrest and brace your core. If that does not work, the weight is too heavy.' },
      { fout: 'Seat set wrong', beter: 'Set the seat so the handles are at shoulder height at the bottom. Deeper often feels uncomfortable, higher makes the movement short.' },
      { fout: 'Dropping the weight', beter: 'Take 2 counts on the way down and keep the weights just off the stack.' },
    ],
    ademhaling: 'Breathe in at the bottom, breathe out as you press the handles up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Choose a lower weight and press with both arms at the same time.',
    zwaarder: 'Press with one arm at a time or pause briefly at the top and halfway.',
  },
  'Pec deck': {
    kernpunten: [
      { punt: 'Arms at shoulder height', uitleg: 'Set the seat so your arms or the handles are at shoulder height. Too high loads your shoulders.' },
      { punt: 'Back against the backrest', uitleg: 'Your whole back and your head stay against the pad. That way only your chest works.' },
      { punt: 'Squeeze in the middle', uitleg: 'Bring your arms together and hold for one count. You feel your chest contract in the middle.' },
      { punt: 'Not too far back', uitleg: 'Open your arms to a comfortable stretch, not further than in line with your body.' },
    ],
    opstelling: [
      'Set the seat height so your arms are at shoulder height and set the starting position to a comfortable stretch.',
      'Sit upright with your back against the backrest and your feet flat on the floor.',
    ],
    stappen: [
      'Bring your arms together in an arc in front of you.',
      'Hold for one count and squeeze your chest.',
      'Let your arms open calmly back to a light stretch.',
    ],
    fouten: [
      { fout: 'Shoulders shrug up', beter: 'Keep your shoulders low and away from your ears. If that does not work, set the weight lighter.' },
      { fout: 'Weight pulls your arms open', beter: 'Slow the return down yourself. The weight should just not touch the stack.' },
      { fout: 'Torso comes off the backrest', beter: 'Stay against the pad. If you lean forward, you are helping with your body.' },
    ],
    ademhaling: 'Breathe out as you bring your arms together and breathe in as you let them go back.',
    tempo: '1 count together, 1 count squeeze, 3 counts back.',
    zwaarder: 'Hold for 2 counts in the middle and make the way back 4 counts long.',
  },
  'Reverse fly machine': {
    kernpunten: [
      { punt: 'Chest against the pad', uitleg: 'Your chest stays against the pad, so you do not help with your back.' },
      { punt: 'Arms slightly bent', uitleg: 'A small bend in your elbows that stays the same through the whole movement.' },
      { punt: 'Shoulders low', uitleg: 'Do not shrug your shoulders up to your ears. Then the back of your shoulder works.' },
      { punt: 'Light and calm', uitleg: 'A small muscle: choose a light weight and work with control.' },
    ],
    opstelling: [
      'Turn the arms of the machine back for the reverse fly and set the seat so the handles are at shoulder height.',
      'Sit with your chest against the pad and grip the handles with your palms facing each other or facing down.',
    ],
    stappen: [
      'Bring your arms back in a wide arc until they are in line with your body.',
      'Hold briefly.',
      'Let the handles return under control until just in front of you.',
    ],
    fouten: [
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down before you start and use less weight.' },
      { fout: 'Chest comes off the pad', beter: 'Stay against the pad and make the movement smaller.' },
      { fout: 'Elbows bend more and more', beter: 'Keep the same slight bend, otherwise it becomes a row.' },
    ],
    ademhaling: 'Breathe out as you bring your arms back, breathe in as they return.',
    tempo: '1 count back, a short hold, 2 counts return.',
    makkelijker: 'Use less weight and make the arc slightly smaller.',
    zwaarder: 'Hold the end position for 2 counts or do more reps.',
  },
  'Dips machine': {
    kernpunten: [
      { punt: 'Elbows back', uitleg: 'Your elbows point back and stay close to your body. Then your triceps do the work.' },
      { punt: 'Shoulders low', uitleg: 'Do not shrug your shoulders. They stay away from your ears during the whole movement.' },
      { punt: 'Straighten fully', uitleg: 'Push the handles down until your arms are straight and squeeze your triceps briefly.' },
      { punt: 'Return calmly', uitleg: 'Let the handles come back under control to roughly a right angle in your elbows.' },
    ],
    opstelling: [
      'Set the seat so the handles in the starting position are just below your chest next to your torso.',
      'Sit with your back against the backrest and grip the angled handles next to you, palms facing in.',
    ],
    stappen: [
      'Push the handles down until your arms are straight.',
      'Hold briefly with your triceps tight.',
      'Let the handles return calmly to roughly a right angle.',
    ],
    fouten: [
      { fout: 'Elbows flared wide', beter: 'Keep your elbows close to your body and pointing back.' },
      { fout: 'Leaning forward to push', beter: 'Stay with your back against the backrest. Use less weight if you have to hang on it.' },
      { fout: 'Weight drops back', beter: 'Let the handles return in 2 counts and do not let the plates touch.' },
    ],
    ademhaling: 'Breathe out as you push down, breathe in as the handles return.',
    tempo: '1 count push down, a short hold, 2 counts back.',
    makkelijker: 'Use less weight and make the movement slightly smaller.',
    zwaarder: 'Hold for 2 counts at the bottom with your arms straight.',
  },
  'Crunch machine': {
    kernpunten: [
      { punt: 'Roll your torso up', uitleg: 'Bring your ribs to your hips. Your back rounds, your abs do the work.' },
      { punt: 'Arms do not pull', uitleg: 'Your hands only hold the handles. The force comes from your abs.' },
      { punt: 'Breathe out as you roll', uitleg: 'Blow your breath out as you roll in. That makes your abs tighten deeper.' },
      { punt: 'Return calmly', uitleg: 'Let the weight return slowly and do not let the plates drop on each other.' },
    ],
    opstelling: [
      'Set the seat so the handles are next to your head above your shoulders and place your feet flat on the floor.',
    ],
    stappen: [
      'Grip the handles and brace your core.',
      'Roll your torso forward and down as you breathe out.',
      'Come back under control until you are almost sitting upright.',
    ],
    fouten: [
      { fout: 'Pulling with your arms', beter: 'Relax your arms and only keep your hands on the handles. Use less weight.' },
      { fout: 'Bending from the hips', beter: 'Roll your back up vertebra by vertebra instead of folding forward like a plank.' },
      { fout: 'Weight drops back', beter: 'Let it return in 2 counts. The way back counts too.' },
    ],
    ademhaling: 'Breathe out as you roll in, breathe in as you come back.',
    tempo: '1 count roll in, a short hold, 2 counts back.',
    makkelijker: 'Use less weight and make the movement smaller.',
    zwaarder: 'Hold for 2 counts at the bottom or do the cable crunch.',
  },
}
