// Engelse coaching van de Blender-oefeningen uit golf 6 (05-11-2026): elastiek,
// overige materialen en cardio. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF6: Readonly<Record<string, Coaching>> = {
  'Band pull-apart': {
    kernpunten: [
      { punt: 'Shoulder blades together', uitleg: 'You feel the muscles between your shoulder blades working. That is the goal of this exercise.' },
      { punt: 'Ribs down', uitleg: 'Keep your core lightly braced so your lower back does not arch as your arms go back.' },
      { punt: 'Shoulders low', uitleg: 'Do not shrug your shoulders towards your ears. The longer your neck, the better your upper back works.' },
      { punt: 'Slowly back', uitleg: 'Do not let the band snap back. The way back matters just as much as the pull.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart. Hold the band shoulder width apart with your palms facing down and extend your arms in front of you at shoulder height.',
    ],
    stappen: [
      'Pull the band apart by opening your arms out to the sides, elbows almost straight.',
      'Keep going until the band touches your chest and briefly squeeze your shoulder blades together.',
      'Bring your arms back under control until they are in front of your chest.',
    ],
    fouten: [
      { fout: 'Arching your back as you pull', beter: 'Lightly brace your core and glutes and keep your ribs down. Your arms move, your torso does not.' },
      { fout: 'Bending your elbows', beter: 'Keep your arms almost straight. If that does not work, grip the band a little wider or choose a lighter band.' },
      { fout: 'Letting the band snap back', beter: 'Count 2 counts on the way back and keep tension on the band the whole time.' },
    ],
    ademhaling: 'Breathe out as you pull the band apart and breathe in on the way back.',
    tempo: '1 count open, a short hold, 2 counts back.',
    makkelijker: 'Grip the band wider or use a lighter band.',
    zwaarder: 'Grip the band narrower, choose a heavier band or hold the end position for 3 counts.',
  },
  'Zijwaarts stappen met elastiek': {
    kernpunten: [
      { punt: 'Knees out', uitleg: 'Push your knees against the band. They must not cave in, not even when you bring your foot in.' },
      { punt: 'Band stays tight', uitleg: 'Never bring your next foot in so close that the band goes slack. The tension keeps your glutes working.' },
      { punt: 'Stay low and steady', uitleg: 'You stay in the same shallow squat. Do not bob up and down and do not sway from side to side.' },
      { punt: 'Toes forward', uitleg: 'Your feet point straight ahead. If your toes turn out, other muscles do the work.' },
    ],
    opstelling: [
      'Place a band around your legs just above your knees.',
      'Stand with your feet hip width apart, bend your knees a little and push your hips back slightly.',
    ],
    stappen: [
      'Step sideways with your left foot, about shoulder width.',
      'Bring your right foot in slowly to hip width, keeping tension on the band.',
      'Repeat a set number of steps and then walk the same way back.',
    ],
    fouten: [
      { fout: 'Knees cave in', beter: 'Actively push your knees out and take smaller steps until you can.' },
      { fout: 'Torso sways with every step', beter: 'Keep your upper body still and your core braced. Only your legs move.' },
      { fout: 'Standing up straight', beter: 'Stay in your shallow squat. Standing up straight takes the work away from your glutes.' },
    ],
    ademhaling: 'Breathe calmly and evenly while you step.',
    tempo: 'Calm, controlled steps, placing each step briefly.',
    makkelijker: 'Use a lighter band or slide it higher up your thighs.',
    zwaarder: 'Place the band around your ankles or feet, or sink deeper into the squat.',
  },
  'Adductie staand met elastiek': {
    kernpunten: [
      { punt: 'Steady on your standing leg', uitleg: 'Your weight is on your standing leg and your hands rest on your hips. If you wobble, lightly support yourself with one hand against a wall.' },
      { punt: 'Torso stays upright', uitleg: 'Do not lean away from the anchor. Your shoulders are above your hips, only the working leg moves.' },
      { punt: 'Leg past your standing leg', uitleg: 'Pull your straight leg inwards until just in front of your standing leg. That is where you feel your inner thigh most.' },
      { punt: 'Brake on the way back', uitleg: 'Do not let the band snap your leg back. Going back slowly is half the work.' },
    ],
    opstelling: [
      'Attach the band low, for example to a rack, and put the loop around the ankle on the side of the anchor.',
      'Step sideways away from the anchor until there is already tension when your working leg hangs slightly out.',
    ],
    stappen: [
      'Start with your working leg slightly out, towards the anchor.',
      'Pull the straight leg inwards, past or just in front of your standing leg.',
      'Let it come back slowly until you feel the starting tension again.',
    ],
    fouten: [
      { fout: 'Upper body leans to the side', beter: 'Keep your shoulders straight above your hips. If you cannot, lightly support yourself with one hand against a wall.' },
      { fout: 'Swinging the leg', beter: 'Choose a lighter band or stand closer to the anchor. Calm tempo, full control.' },
      { fout: 'Toes turn out', beter: 'Keep your toes pointing forward, so the work stays in your inner thigh.' },
    ],
    ademhaling: 'Breathe out as you pull the leg in, breathe in on the way back.',
    tempo: '1 count in, a short hold, 2 counts back.',
    makkelijker: 'Stand closer to the anchor so the band is less tight.',
    zwaarder: 'Use a heavier band or hold the leg on the inside for 2 counts.',
  },
  'Squat met elastiek boven de knieen': {
    kernpunten: [
      { punt: 'Knees out', uitleg: 'Push your knees out against the band for the whole rep. That way the sides of your glutes work too.' },
      { punt: 'Band just above the knee', uitleg: 'Not on or below the knee, but just above it. It stays in place there and does not press on your joint.' },
      { punt: 'Chest up', uitleg: 'Your torso stays upright and you look ahead. Arms in front of you help you balance.' },
      { punt: 'Whole foot on the floor', uitleg: 'Your weight is spread over heel and forefoot. Your big toe stays on the floor as your knees go out.' },
    ],
    opstelling: [
      'Place a mini band around both legs, just above your knees.',
      'Stand with your feet shoulder width apart, toes slightly out, and extend your arms in front of you or clasp your hands.',
    ],
    stappen: [
      'Push your knees out slightly so there is tension on the band.',
      'Lower until your thighs are roughly horizontal, knees in line with your toes.',
      'Push the floor away and stand all the way up, without releasing the tension.',
    ],
    fouten: [
      { fout: 'Knees cave in', beter: 'Choose a lighter band and push out deliberately. Your knees point to your second and third toe.' },
      { fout: 'Band rolls up or slides down', beter: 'Lay it flat just above the knee. A wider fabric band stays in place better.' },
      { fout: 'Feet roll to the outside', beter: 'Keep your big toe on the floor. You push out with your knees, not with your feet.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you come up.',
    tempo: '2 counts down, 1 count up, tension stays on the band.',
    makkelijker: 'Use a lighter band or lower to a bench behind you.',
    zwaarder: 'Use a heavier band or hold a dumbbell in front of your chest.',
  },
  'Back extension': {
    kernpunten: [
      { punt: 'Bend from your hips', uitleg: 'You hinge over the pad like a door. Your back stays long, the movement is in your hips.' },
      { punt: 'Stop at a straight line', uitleg: 'At the top your body is straight from head to heels. Arching further back puts pressure on your lower back.' },
      { punt: 'Squeeze your glutes at the top', uitleg: 'Squeeze your glutes to come up. Then your lower back shares the work with your glutes and hamstrings.' },
      { punt: 'Chin slightly tucked', uitleg: 'Look diagonally at the floor. That keeps your neck in line with your back.' },
    ],
    opstelling: [
      'Set the pad so its top edge is just below your hip bones, so you can bend freely.',
      'Hook your heels behind the foot support and cross your arms in front of your chest or put your hands by your ears.',
    ],
    stappen: [
      'Start in a straight line with your core lightly braced.',
      'Lower slowly forward from your hips until you feel a stretch in your hamstrings.',
      'Come back up by squeezing your glutes until you are a straight line again.',
    ],
    fouten: [
      { fout: 'Arching too far back', beter: 'Stop when you are straight. An arched back at the top adds nothing and loads your lower back.' },
      { fout: 'Pad too high, under the belly', beter: 'Set the pad lower so your hips can move freely. Otherwise you only bend in your back.' },
      { fout: 'Swinging up with momentum', beter: 'Come up under control and pause briefly at the top. No swing from your upper body.' },
    ],
    ademhaling: 'Breathe in as you lower forward, breathe out as you come up.',
    tempo: '2 counts down, 1 count up, a short pause at the top.',
    makkelijker: 'Make the movement smaller or just hold the straight line for a few seconds.',
    zwaarder: 'Hold a weight plate against your chest or pause for 2 counts at the top.',
  },
  'Ab wheel rollout': {
    kernpunten: [
      { punt: 'Tilt your pelvis, glutes on', uitleg: 'Draw your navel in and squeeze your glutes. That keeps your lower back neutral and stops it from sagging.' },
      { punt: 'No further than your back allows', uitleg: 'Only roll out as far as your torso stays still. If you feel your lower back arch, you have gone too far.' },
      { punt: 'Arms straight', uitleg: 'Your arms stay long and your shoulders actively push away from the wheel. Your core does the work, not your arms.' },
      { punt: 'Back from your core', uitleg: 'Pull yourself back by bringing your ribs towards your pelvis, not by pushing your hips back.' },
    ],
    opstelling: [
      'Kneel on a mat with your knees hip width apart and the wheel directly under your shoulders.',
      'Hold the handles with straight arms and round your upper back very slightly.',
    ],
    stappen: [
      'Brace your core and glutes as if you are about to take a punch.',
      'Roll the wheel forward slowly while your hips and shoulders move along together.',
      'Stop at the point where your back just stays straight.',
      'Pull the wheel back with your core until it is under your shoulders.',
    ],
    fouten: [
      { fout: 'Lower back sags and arches', beter: 'Roll out less far and keep your glutes squeezed. Build up the distance calmly over the weeks.' },
      { fout: 'Hips stay back, only the arms roll', beter: 'Let your hips move forward too, so your body forms a long line from knee to shoulder.' },
      { fout: 'Coming back hips first', beter: 'Bring your chest and pelvis towards each other. Your hips only extend once the wheel is back.' },
    ],
    ademhaling: 'Breathe in before you roll out, keep your core braced during the movement and breathe out as you come back.',
    tempo: '3 counts forward, a short pause, 2 counts back.',
    makkelijker: 'Roll towards a wall so you cannot go too far, or roll uphill on a slope.',
    zwaarder: 'Roll out further with the same tight torso. Only try standing rollouts once the kneeling version fully works.',
  },
  'TRX row': {
    kernpunten: [
      { punt: 'Body like a plank', uitleg: 'A straight line from your head to your heels. Your hips do not sag.' },
      { punt: 'Chest to the handles', uitleg: 'Pull yourself up with your chest leading, not with your chin.' },
      { punt: 'Elbows along your body', uitleg: 'Your elbows go back, close to your sides.' },
      { punt: 'Lower slowly', uitleg: 'Lower yourself back under control until your arms are straight.' },
    ],
    opstelling: [
      'Set the straps to medium length and hold the handles with your palms facing each other.',
      'Walk your feet forward and lean back until your arms are straight and your body is straight.',
    ],
    stappen: [
      'Brace your core and glutes.',
      'Pull your chest to the handles until your hands are next to your ribs.',
      'Lower yourself slowly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Squeeze your glutes and keep your body straight. Move your feet back a little if you cannot.' },
      { fout: 'Pulling with your neck', beter: 'Keep your head in line with your torso and lead the movement with your chest.' },
      { fout: 'Dropping back into the straps', beter: 'Brake the way back over 2 counts. Dropping costs you half the exercise.' },
    ],
    ademhaling: 'Breathe out as you pull, breathe in as you lower.',
    tempo: '1 count up, a short hold, 2 counts back.',
    makkelijker: 'Step your feet back so you stand more upright.',
    zwaarder: 'Step your feet further forward or hold for 2 counts at the top.',
  },
  'Medicine ball slam': {
    kernpunten: [
      { punt: 'Get fully tall at the top', uitleg: 'Ball high above your head and rise onto your toes. The taller you get, the more power you have in the slam.' },
      { punt: 'Throw with your whole body', uitleg: 'The power comes from your core and hips, not just your arms. Your torso snaps down with the ball.' },
      { punt: 'Bend your knees to pick up', uitleg: 'Lower your hips with a straight back to pick up the ball. Never yank it off the floor with a rounded back.' },
      { punt: 'Ball in front of your feet', uitleg: 'Aim at the floor just in front of your toes. That way it does not bounce into your face and you do not have to reach far.' },
    ],
    opstelling: [
      'Use a slam ball that does not bounce and stand with your feet hip width apart.',
      'Hold the ball with both hands in front of your chest and make sure there is free space around you.',
    ],
    stappen: [
      'Lift the ball above your head and stretch your whole body.',
      'Throw the ball hard onto the floor in front of your feet, brace your core and bend your knees slightly.',
      'Bend your knees with a straight back, pick up the ball and start again.',
    ],
    fouten: [
      { fout: 'Picking up the ball with a rounded back', beter: 'Bend your knees and hips as if you are doing a deadlift. Feel free to take an extra second for it.' },
      { fout: 'Throwing with only your arms', beter: 'Let your torso and hips snap down too. Your core does most of the work on the way down.' },
      { fout: 'Using a bouncing ball', beter: 'Choose a real slam ball or a soft ball without bounce. A bouncing ball can rebound into your face.' },
    ],
    ademhaling: 'Breathe in as you lift the ball, breathe out forcefully on the slam.',
    tempo: 'Explosive on the way down, picking up calmly and under control.',
    makkelijker: 'Choose a lighter ball and make the movement smaller, from chest height.',
    zwaarder: 'Choose a heavier ball or do as many clean slams as possible in a set time.',
  },
  'Wall ball': {
    kernpunten: [
      { punt: 'Power from your legs', uitleg: 'The ball goes up because you drive up out of the squat. Your arms only finish the throw.' },
      { punt: 'Deep squat, chest up', uitleg: 'Lower until your hips are below your knees, or as deep as you can with a straight back.' },
      { punt: 'Catch in front of your chest', uitleg: 'Catch the ball in front of your chest, elbows down, and sink straight into the next squat.' },
      { punt: 'One flowing movement', uitleg: 'Squat, throw, catch and lower flow into each other without a pause.' },
    ],
    opstelling: [
      'Stand about an arm length from the wall with your feet shoulder width apart.',
      'Hold the medicine ball with two hands in front of your chest, elbows down.',
    ],
    stappen: [
      'Lower into a squat with the ball in front of your chest.',
      'Drive up powerfully and throw the ball at the target on the wall in the same movement.',
      'Catch the ball in front of your chest and sink straight into the next squat.',
    ],
    fouten: [
      { fout: 'Throwing with only your arms', beter: 'Wait to throw until your legs are almost straight. The throw is the end of the squat.' },
      { fout: 'Catching the ball above your head', beter: 'Let the ball drop to chest height before you catch it, then you sink down smoothly.' },
      { fout: 'Too far from the wall', beter: 'Stand closer to the wall, so the ball comes straight down and you do not have to reach forward.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out forcefully as you throw.',
    tempo: 'A flowing rhythm, blocks of 30 to 60 seconds or a set number of reps.',
    makkelijker: 'Use a lighter ball and a lower target on the wall.',
    zwaarder: 'Use a heavier ball or a higher target.',
  },
  'Battle ropes': {
    kernpunten: [
      { punt: 'Low, solid stance', uitleg: 'Knees slightly bent, hips back a little. That way your legs absorb the force, not your lower back.' },
      { punt: 'Torso stays still', uitleg: 'Your arms make the wave, your upper body does not. Core braced as if someone pushes gently against it.' },
      { punt: 'Waves all the way to the anchor', uitleg: 'Make the waves big enough to run to the end of the rope. Then your shoulders do real work.' },
      { punt: 'Firm grip, loose arms', uitleg: 'Hold the ends without tensing up. Elbows slightly bent, the movement comes from your shoulders.' },
    ],
    opstelling: [
      'Stand far enough from the anchor that the rope is just short of tight, with a small curve on the floor.',
      'Feet hip width apart, knees slightly bent, hold the ends with your thumbs on top.',
    ],
    stappen: [
      'Sink into your shallow squat and brace your core.',
      'Move your arms up and down quickly in turn, so waves run through the rope.',
      'Keep the tempo until the end of the block and then put the rope down calmly.',
    ],
    fouten: [
      { fout: 'Standing upright with straight legs', beter: 'Bend your knees and push your hips back a little. Your legs absorb the movement.' },
      { fout: 'Whole upper body moves along', beter: 'Lock your torso and let only your arms work. Make the waves smaller if you start to sway.' },
      { fout: 'Blocks too long, sloppy waves', beter: 'Work in short blocks, for example 20 to 30 seconds, with rest in between. Quality over duration.' },
    ],
    ademhaling: 'Breathe in short, rhythmic breaths and never hold your breath during a block.',
    tempo: 'Fast and explosive, in short blocks with rest in between.',
    makkelijker: 'Stand closer to the anchor or make calm waves with both arms at the same time.',
    zwaarder: 'Combine the waves with small squats or step further away so the rope gets heavier.',
  },
  'Slee duwen': {
    kernpunten: [
      { punt: 'Diagonal straight line', uitleg: 'A straight line from your head to your back foot, leaning forward.' },
      { punt: 'Arms straight', uitleg: 'Your arms pass on the force. They do not bend and do not push themselves.' },
      { punt: 'Short powerful steps', uitleg: 'Drive off through the balls of your feet with small steps, like sprinting uphill.' },
      { punt: 'Core tight', uitleg: 'Your lower back does not sag. Brace your core so the force from your legs goes into the sled.' },
    ],
    opstelling: [
      'Hold the poles of the sled at chest height or lower and step back until your arms are straight.',
      'Lean forward until your body is at an angle, one foot in front and one behind.',
    ],
    stappen: [
      'Get the sled moving with a powerful first step.',
      'Keep taking short, quick steps until the end of the lane.',
      'Come to a calm stop and recover before the next lane.',
    ],
    fouten: [
      { fout: 'Pushing upright', beter: 'Lean further forward and hold the poles lower. Then your force goes forward and not up.' },
      { fout: 'Arched lower back', beter: 'Brace your core and keep your hips in line with your torso.' },
      { fout: 'Big, slow steps', beter: 'Make your steps shorter and quicker and drive off through the balls of your feet.' },
    ],
    ademhaling: 'Breathe forcefully and rhythmically, do not hold your breath while pushing.',
    tempo: 'Blocks of 10 to 20 metres, drive hard, plenty of recovery in between.',
    makkelijker: 'Take weight off the sled or push a shorter distance.',
    zwaarder: 'Put more weight on the sled or make the lane longer.',
  },
  'Wandelen op de loopband': {
    kernpunten: [
      { punt: 'Let go of the handrail', uitleg: 'Walk without holding on if you can. Then your legs really work and your posture stays straight.' },
      { punt: 'Walk briskly', uitleg: 'A pace where you notice your heart rate going up, but you can still talk easily.' },
      { punt: 'Upright with a long back', uitleg: 'Even on an incline you stand upright and look ahead, not hunched forward.' },
      { punt: 'Arms along', uitleg: 'Let your arms swing actively. That helps your pace and your rhythm.' },
    ],
    opstelling: [
      'Stand with your feet on the side rails, set the belt to a low speed and step on. Clip the safety cord to your clothing.',
      'Start with a low incline of 1 to 3 percent.',
    ],
    stappen: [
      'Walk calmly for a few minutes to warm up.',
      'Increase the speed to a brisk walk and then raise the incline if you like.',
      'At the end, slow down to a calm pace before you stop.',
    ],
    fouten: [
      { fout: 'Holding the handrail on an incline', beter: 'Let go and lower the incline or speed. Holding on makes it a lot lighter than you think.' },
      { fout: 'Leaning forward', beter: 'Stand upright with your hips under your shoulders. Only lean slightly forward on a steep incline.' },
      { fout: 'A steep incline too soon', beter: 'Raise the incline step by step. Your calves and Achilles tendon need to get used to it too.' },
    ],
    ademhaling: 'Breathe calmly and deeply, in a rhythm that matches your steps.',
    tempo: 'A brisk walking pace at which you can still talk easily.',
    makkelijker: 'Walk on a flat belt at your own pace.',
    zwaarder: 'Raise the incline, for example to 8 to 12 percent, and keep the speed the same.',
  },
  'Hardlopen op de loopband': {
    kernpunten: [
      { punt: 'Small, quick steps', uitleg: 'Short steps under your body are easier on your knees than big strides far in front of you.' },
      { punt: 'Run upright', uitleg: 'A long torso and your eyes ahead. Do not look at your feet or the screen with a bent neck.' },
      { punt: 'Arms relaxed along', uitleg: 'Arms at an angle of about 90 degrees, swinging loosely back and forth along your body.' },
      { punt: 'A pace for short sentences', uitleg: 'During endurance work you can still say short sentences. If you cannot, lower the speed.' },
    ],
    opstelling: [
      'Stand with your feet on the side rails, start the belt at walking speed and step on. Clip the safety cord to your clothing.',
      'Set the incline to 1 percent, that feels most like running outside.',
    ],
    stappen: [
      'Walk for 3 to 5 minutes to warm up.',
      'Increase the speed step by step to your running pace.',
      'Run your block and at the end slow down to walking before you stop.',
    ],
    fouten: [
      { fout: 'Holding the handrail', beter: 'Let go and lower the speed if needed. Holding on changes your stride and your posture.' },
      { fout: 'Big strides landing on the heel', beter: 'Make your steps shorter and land your foot under your body. That feels lighter and softer.' },
      { fout: 'Wanting too much too fast', beter: 'Build up the duration calmly, for example alternating 2 minutes of running and 1 minute of walking.' },
    ],
    ademhaling: 'Breathe calmly and deeply in a steady rhythm, for example 2 steps in and 2 steps out.',
    tempo: 'An endurance pace at which you can still say short sentences, or alternating hard and easy.',
    makkelijker: 'Alternate stretches of running with stretches of brisk walking.',
    zwaarder: 'Do intervals: 1 minute at high speed, 1 minute easy, or run on an incline.',
  },
  'Touwtjespringen': {
    kernpunten: [
      { punt: 'Jump low', uitleg: 'A few centimetres is enough. Just high enough to let the rope pass under your feet.' },
      { punt: 'On the balls of your feet', uitleg: 'Land softly and springy on the balls of your feet. Your heels do not touch the floor.' },
      { punt: 'Turn from your wrists', uitleg: 'Your elbows stay close to your body. The turn comes from your wrists, not your shoulders.' },
      { punt: 'Calm rhythm', uitleg: 'You keep up a steady, calm rhythm longer than jumping fast with lots of misses.' },
    ],
    opstelling: [
      'Adjust the rope: stand with one foot in the middle, the handles then reach to about your armpits. Jump on a surface with some give.',
    ],
    stappen: [
      'Hold the handles next to your hips with your elbows close to your body.',
      'Turn the rope from your wrists over your head.',
      'Jump low on the balls of your feet just as the rope reaches your feet.',
    ],
    fouten: [
      { fout: 'Jumping too high', beter: 'Only jump a few centimetres high. That spares your calves and knees and you keep going longer.' },
      { fout: 'Turning with your arms', beter: 'Keep your elbows by your body and turn from your wrists. That takes much less energy.' },
      { fout: 'Landing on your heels', beter: 'Land on the balls of your feet with slightly bent knees, soft and quiet.' },
    ],
    ademhaling: 'Breathe calmly and evenly in the rhythm of the jumps.',
    tempo: 'Blocks of 30 to 60 seconds, followed by the same amount of rest.',
    makkelijker: 'Jump without a rope and only turn your wrists, or do short blocks of 20 seconds.',
    zwaarder: 'Alternate between both feet and one foot, or do fast blocks of 20 seconds.',
  },
  'Hometrainer': {
    kernpunten: [
      { punt: 'Saddle at the right height', uitleg: 'At the bottom your knee is slightly bent. Too low loads your knee, too high makes your hips rock.' },
      { punt: 'Knee in line with your foot', uitleg: 'Your knee moves straight up and down above your foot, not in or out.' },
      { punt: 'Calm upper body', uitleg: 'Your shoulders and arms are relaxed. All the work comes from your legs.' },
      { punt: 'Pedal in circles', uitleg: 'Do not just push down but make a smooth circle, then you ride more smoothly.' },
    ],
    opstelling: [
      'Set the saddle so your knee is slightly bent when the pedal is at the bottom. Set the handlebar at a height where you sit upright or slightly forward.',
      'Place the ball of your foot over the pedal axle and tighten any straps.',
    ],
    stappen: [
      'Ride for 3 to 5 minutes at low resistance to warm up.',
      'Increase the resistance until you feel a solid effort in your thighs.',
      'Ride your block and slow down calmly at the end.',
    ],
    fouten: [
      { fout: 'Saddle too low', beter: 'Raise the saddle until your knee is just slightly bent at the bottom. That spares your knees.' },
      { fout: 'Hips rock on the saddle', beter: 'The saddle is too high or the resistance too low. Adjust it until you sit still on the saddle.' },
      { fout: 'Spinning hard without resistance', beter: 'Increase the resistance. You should feel it in your legs, not just spin fast.' },
    ],
    ademhaling: 'Breathe calmly and evenly, and breathe more deeply as the resistance goes up.',
    tempo: 'Around 70 to 90 revolutions per minute, with heavy and light stretches.',
    makkelijker: 'Choose a low resistance and ride short blocks with breaks.',
    zwaarder: 'Do intervals: 30 seconds at high resistance, 1 minute easy.',
  },
  'Airbike': {
    kernpunten: [
      { punt: 'Push and pull at the same time', uitleg: 'Your arms deliver half the work. Push one handle away while you pull the other towards you.' },
      { punt: 'Calm torso', uitleg: 'Your upper body stays still above the saddle. Swinging costs energy and gives no extra power.' },
      { punt: 'Start under control', uitleg: 'The resistance grows with your pace. Whoever gives everything in the first seconds stalls halfway.' },
      { punt: 'Forefoot in the middle of the pedal', uitleg: 'Place the widest part of your foot in the middle of the pedal. That way you push powerfully and your foot does not slip.' },
    ],
    opstelling: [
      'Set the saddle so your knee stays slightly bent at the bottom. Hold the handles at chest height with a relaxed grip.',
    ],
    stappen: [
      'Push the pedals round and push and pull with your arms on the handles at the same time.',
      'Let your arms and legs work together in one rhythm, without your torso twisting along.',
      'Keep a steady rhythm and only raise the pace once you are warm.',
    ],
    fouten: [
      { fout: 'Riding with only your legs', beter: 'Actively use your arms: push and pull. That spreads the work and you keep going longer.' },
      { fout: 'Starting too hard in an interval', beter: 'Build up to your pace in the first 5 seconds and hold it until the end of the block.' },
      { fout: 'Shoulders up by your ears', beter: 'Let your shoulders drop and keep your neck long. Do not squeeze the handles harder than needed.' },
    ],
    ademhaling: 'Breathe rhythmically with your movement and never hold your breath, not even in a sprint.',
    tempo: 'Intervals of 10 to 30 seconds hard, then at least as long easy.',
    makkelijker: 'Ride with only your legs and rest your hands on the fixed supports, at a calm pace.',
    zwaarder: 'Shorten the rest between the blocks or work to a set number of calories per block.',
  },
  'Crosstrainer': {
    kernpunten: [
      { punt: 'Stand upright', uitleg: 'Chest up and eyes ahead. Hanging over the handles takes your legs out of the work.' },
      { punt: 'Push and pull with your arms', uitleg: 'The moving handles let your upper body work too, so it becomes a workout for your whole body.' },
      { punt: 'Whole foot on the pedals', uitleg: 'Keep your heels on the pedals. That prevents numb toes and makes your glutes work better.' },
      { punt: 'Resistance over speed', uitleg: 'A smooth rhythm with noticeable resistance works better than spinning fast without grip.' },
    ],
    opstelling: [
      'Step with your feet in the middle of the pedals and hold the moving handles at chest height. Choose a resistance at which you work hard but can keep up the pace.',
    ],
    stappen: [
      'Start with a calm rhythm in which your arms and legs move together.',
      'Push the pedal forward and down through your heel while alternately pushing and pulling the handles.',
      'Raise the resistance or pace once you are warm.',
    ],
    fouten: [
      { fout: 'Hanging forward on the handles', beter: 'Stand upright with your weight above your feet. Use the handles to push and pull, not to lean on.' },
      { fout: 'Standing on your toes', beter: 'Put your whole foot down and press from your heel. Then your calves stay relaxed and your glutes work too.' },
      { fout: 'Resistance too low', beter: 'If you feel no resistance, set it a few levels higher. You should notice it in your thighs.' },
    ],
    ademhaling: 'Breathe calmly and rhythmically and never hold your breath, not even at high resistance.',
    tempo: 'An even pace at which you can still say short sentences.',
    makkelijker: 'Let go of the arm handles, hold the fixed supports and choose a low resistance.',
    zwaarder: 'Do intervals: 1 minute at high resistance, 1 minute easy, or pedal backwards for a block now and then.',
  },
  'Traploper': {
    kernpunten: [
      { punt: 'Do not hang on the handrail', uitleg: 'Holding on lightly for balance is fine. Leaning on your arms takes the weight off your legs.' },
      { punt: 'Stand upright', uitleg: 'Your torso stays upright or slightly forward from your hips. Do not hunch over the screen.' },
      { punt: 'Whole foot on the step', uitleg: 'Put your whole foot down and push off from your heel. That way your glutes and thighs work too.' },
      { punt: 'Knee above your foot', uitleg: 'Your knee points the same way as your toes and does not cave in.' },
    ],
    opstelling: [
      'Step onto the bottom step while the machine is still and hold the handrail. Choose a calm speed to start with.',
    ],
    stappen: [
      'Place your foot with the whole sole on the next step.',
      'Push yourself up from your heel until your leg is straight.',
      'Switch legs in a calm, steady rhythm.',
    ],
    fouten: [
      { fout: 'Leaning on the handrail', beter: 'Only touch the handrail lightly. Choose a lower speed if you have to hang on to keep up.' },
      { fout: 'Stepping only on your toes', beter: 'Put your whole foot on the step. Then your calves stay fresh and your glutes work more.' },
      { fout: 'Knee caves in', beter: 'Push your knee in line with your toes with every step up.' },
    ],
    ademhaling: 'Breathe calmly and deeply in a steady rhythm, for example 2 steps in and 2 steps out.',
    tempo: 'A pace you can keep up, at which you can still say short sentences.',
    makkelijker: 'Choose a low speed and short blocks of 3 to 5 minutes.',
    zwaarder: 'Take every second step or do intervals with 1 minute at a higher speed.',
  },
  'Roeiergometer': {
    kernpunten: [
      { punt: 'Legs first', uitleg: 'The power comes mainly from your legs. Push off first, only then lean back and pull with your arms.' },
      { punt: 'Back straight', uitleg: 'Your back stays long and neutral, also when you are at the front by your feet. Do not hunch forward.' },
      { punt: 'Handle to your belly', uitleg: 'Pull the handle to your lower ribs with your elbows along your body, not to your neck.' },
      { punt: 'Calmly back', uitleg: 'The recovery takes about twice as long as the drive. That is where you recover for a moment.' },
    ],
    opstelling: [
      'Put your feet in the footrests with the strap over the widest part of your foot. Set the damper to a middle setting, 3 to 5 is enough for most people.',
      'Hold the handle with a relaxed grip and sit at the front with your shins almost vertical.',
    ],
    stappen: [
      'Push off with your legs while your arms are still straight.',
      'Lean back a little and pull the handle to your belly.',
      'Go back in reverse order: arms forward, torso forward, then bend your knees.',
    ],
    fouten: [
      { fout: 'Pulling with your arms before your legs push', beter: 'Keep your arms straight until your legs are almost fully pushed out. Legs, torso, arms.' },
      { fout: 'Rounded back at the front', beter: 'Do not come further forward than you can with a straight back. Tilt from your hips.' },
      { fout: 'Bending your knees before the handle has passed', beter: 'First bring the handle past your knees, only then bend your knees. That way you do not hit your legs.' },
      { fout: 'Damper on the heaviest setting', beter: 'Set the damper to 3 to 5. A higher setting makes every stroke heavier, not your workout better.' },
    ],
    ademhaling: 'Breathe out during the drive and breathe in on the calm way back.',
    tempo: 'Around 20 to 28 strokes per minute, a quick drive and a calm recovery.',
    makkelijker: 'Row with only your legs and arms without leaning back, at a calm pace.',
    zwaarder: 'Do intervals: 250 or 500 metres hard, followed by an easy minute.',
  },
}
