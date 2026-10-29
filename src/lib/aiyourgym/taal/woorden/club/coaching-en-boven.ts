// Engelse coaching van de Blender-oefeningen uit golf 1 (29-10-2026): duwen,
// trekken, romp en de dynamische oefeningen. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_BOVEN: Readonly<Record<string, Coaching>> = {
  'Push-up op knieën': {
    kernpunten: [
      { punt: 'Straight from knees to head', uitleg: 'Your hips stay in line with your knees and shoulders, not up in the air. That way it looks like a real push-up.' },
      { punt: 'Core braced', uitleg: 'Brace your core so your lower back does not arch. This is the foundation for the full push-up.' },
      { punt: 'Elbows angled back', uitleg: 'Your elbows point back at about 45 degrees. That is kinder to your shoulders than flaring them wide.' },
      { punt: 'Chest to the floor', uitleg: 'Lower until your chest is just above the floor. Full reps build up to the regular push-up faster.' },
    ],
    opstelling: [
      'Put a mat or something soft under your knees and place your hands slightly wider than your shoulders.',
      'Walk your knees back until your body forms a straight line from knees to head.',
    ],
    stappen: [
      'Lower as one unit by bending your elbows.',
      'Stop when your chest is just above the floor.',
      'Push yourself up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Hips stick up', beter: 'Move your knees further back and push your hips forward until you are straight.' },
      { fout: 'Only the head moves', beter: 'Bring your whole chest to the floor. Your neck stays in line with your back.' },
      { fout: 'Elbows flared wide', beter: 'Keep your elbows angled back, about 45 degrees from your torso.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Place your hands on a bench or against a wall.',
    zwaarder: 'Lower slowly on your toes and push up on your knees, until you can do the full push-up.',
  },
  'Push-up met smalle handen': {
    kernpunten: [
      { punt: 'Hands under your shoulders', uitleg: 'Place your hands directly under your shoulders, not touching. That is narrow enough and spares your wrists.' },
      { punt: 'Elbows along your body', uitleg: 'Your elbows brush past your ribs and point back. That way your triceps work the most.' },
      { punt: 'Body straight', uitleg: 'Core and glutes on, a straight line from head to heels. Your hips do not sag and do not stick up.' },
      { punt: 'Full range', uitleg: 'Lower until your chest is just above your hands and push until your arms are straight.' },
    ],
    opstelling: [
      'Place your hands directly under your shoulders with your fingers pointing forward.',
      'Extend your legs back and brace your core and glutes.',
    ],
    stappen: [
      'Lower by bending your elbows back along your body.',
      'Stop when your chest is just above the floor.',
      'Push yourself up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Elbows flare out', beter: 'Keep them close to your torso. If they drift out, your chest takes over.' },
      { fout: 'Hands together in a triangle', beter: 'Place your hands under your shoulders. A triangle puts a lot of stress on your wrists and elbows.' },
      { fout: 'Hips sag', beter: 'Brace your core and glutes. If you can no longer stay straight, continue on your knees.' },
    ],
    ademhaling: 'Breathe in as you lower and breathe out as you push up.',
    tempo: '2 counts down, a short pause, 1 count up.',
    makkelijker: 'Do it on your knees or with your hands on a bench.',
    zwaarder: 'Put your feet on a bench or pause for 2 counts at the bottom.',
  },
  Zijplank: {
    kernpunten: [
      { punt: 'Hand under your shoulder', uitleg: 'Your supporting hand is directly under your shoulder with your arm straight. That keeps the load on your shoulder calmest.' },
      { punt: 'Hips high and forward', uitleg: 'Push your hips up and slightly forward, so your body is straight and does not bend.' },
      { punt: 'Push away from the floor', uitleg: 'Press your hand into the floor and do not sink into your shoulder. Your shoulder stays far from your ear.' },
      { punt: 'Line from head to feet', uitleg: 'Head, chest, hips and feet are in one line. Look straight ahead.' },
    ],
    opstelling: [
      'Lie on your side with your supporting hand flat on the floor, directly under your shoulder, fingers pointing away.',
      'Stack your feet or place your top foot just in front of the bottom one for more balance.',
      'Reach your top arm straight up or rest your hand on your hip.',
    ],
    stappen: [
      'Brace your core and glutes.',
      'Lift your hips until your body forms a straight line.',
      'Hold while you keep breathing calmly, then switch sides.',
    ],
    fouten: [
      { fout: 'Hips sink to the floor', beter: 'Actively push your bottom hip up. If you cannot, end the set or drop to your knees.' },
      { fout: 'Sinking into the shoulder', beter: 'Press your hand into the floor and push your body away, so there is space between shoulder and ear.' },
      { fout: 'Hips bend backwards', beter: 'Bring your hips forward until they line up with your shoulders and feet.' },
    ],
    ademhaling: 'Breathe calmly and evenly while you hold.',
    tempo: 'Hold for 15 to 30 seconds per side with good form.',
    makkelijker: 'Rest on your forearm with your elbow under your shoulder, or also put your bottom knee down.',
    zwaarder: 'Lift your top leg or slowly move your hips up and down.',
  },
  Superman: {
    kernpunten: [
      { punt: 'A small lift is enough', uitleg: 'Arms and legs only rise a few centimetres. Lifting higher mostly creates a kink in your lower back.' },
      { punt: 'Look at the floor', uitleg: 'Your head stays in line with your back. Looking up arches your neck for no reason.' },
      { punt: 'Make yourself long', uitleg: 'Reach forward with your hands and back with your feet. Think length, not height.' },
      { punt: 'Glutes lightly on', uitleg: 'Your glutes help lift your legs. That way your lower back does not have to do it all.' },
    ],
    opstelling: [
      'Lie face down on a mat with your arms straight overhead and your legs straight, hip width apart.',
      'Rest your forehead on the mat or on a folded towel.',
    ],
    stappen: [
      'Lightly brace your glutes and core.',
      'Lift your arms, chest and legs a little off the floor at the same time, eyes down.',
      'Hold for 2 to 3 counts and lower calmly.',
    ],
    fouten: [
      { fout: 'Lifting as high as possible', beter: 'Only lift a few centimetres. You should feel it along your whole back side, not as a pinch in your lower back.' },
      { fout: 'Head up, neck arched', beter: 'Keep your eyes on the mat. Your neck stays long and relaxed.' },
      { fout: 'Swinging up', beter: 'Come up calmly and hold. The exercise works through the hold, not through momentum.' },
    ],
    ademhaling: 'Breathe out as you lift and keep breathing calmly while you hold.',
    tempo: '1 count up, hold for 2 to 3 counts, 2 counts down.',
    makkelijker: 'Lift one arm and the opposite leg at a time instead of everything together.',
    zwaarder: 'Hold longer, for example 5 to 10 seconds per rep.',
  },
  'Barbell row met onderhandse greep': {
    kernpunten: [
      { punt: 'Back straight and still', uitleg: 'Your torso stays angled and still. Your lower back keeps its natural curve.' },
      { punt: 'Elbows along your body', uitleg: 'With the underhand grip your elbows almost brush your sides. That way you work the lower part of your lats.' },
      { punt: 'Pull to your stomach', uitleg: 'The bar comes in low, at your belly button or just below. Pulling higher turns it into a shoulder exercise.' },
      { punt: 'Start light', uitleg: 'Your biceps work hard and the grip asks more of your elbows. Build up the weight calmly.' },
    ],
    opstelling: [
      'Grip the bar at shoulder width with your palms facing forward, away from you.',
      'Knees slightly bent, hips back and torso leaning forward with a straight back.',
    ],
    stappen: [
      'Let the bar hang with straight arms.',
      'Pull your elbows back along your sides until the bar touches your stomach.',
      'Lower the bar calmly until your arms are straight.',
    ],
    fouten: [
      { fout: 'Standing up to move the weight', beter: 'Stay at the same angle. If you cannot, take some weight off.' },
      { fout: 'Curling instead of rowing', beter: 'Your wrists stay straight and your elbows lead. Think elbows to your hips.' },
      { fout: 'Lower back rounds', beter: 'Chest slightly forward, core braced. If your back does not stay straight, use less weight or the chest supported row.' },
    ],
    ademhaling: 'Breathe in and brace your core, breathe out as you pull the bar to your stomach.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Do the row on an incline bench with dumbbells, so the bench supports your torso.',
    zwaarder: 'Lower the bar over 3 to 4 counts.',
  },
  'Schouders ophalen met barbell': {
    kernpunten: [
      { punt: 'Straight up', uitleg: 'Pull your shoulders straight up towards your ears. Do not roll them, that adds nothing.' },
      { punt: 'Arms stay straight', uitleg: 'Your arms are hooks. Do not bend your elbows to help.' },
      { punt: 'Brief hold at the top', uitleg: 'Hold the top position for one count before you lower the bar.' },
      { punt: 'Head stays put', uitleg: 'Your chin stays neutral. Do not push it forward or pull it to your chest.' },
    ],
    opstelling: [
      'Take the bar at shoulder width from a rack, or from the floor with a straight back.',
      'Stand tall with the bar in straight arms in front of your thighs.',
    ],
    stappen: [
      'Pull your shoulders straight up towards your ears.',
      'Hold for one count.',
      'Lower your shoulders calmly until your arms hang fully.',
    ],
    fouten: [
      { fout: 'Rolling the shoulders', beter: 'Only move straight up and down, with your shoulders towards your ears.' },
      { fout: 'Bending the elbows', beter: 'Let your arms hang straight. Use less weight if you have to pull with your arms.' },
      { fout: 'Movement too small', beter: 'Use less weight and make the movement complete, from all the way down to all the way up.' },
    ],
    ademhaling: 'Breathe out as you shrug up, breathe in as you lower.',
    tempo: '1 count up, hold for 1 count, 2 counts down.',
    makkelijker: 'Do the exercise with dumbbells by your sides.',
    zwaarder: 'Hold the top for 2 to 3 counts.',
  },
  'Pike push-up': {
    kernpunten: [
      { punt: 'Hips high', uitleg: 'Your body forms an upside down V. The higher your hips, the more your shoulders do the work.' },
      { punt: 'Head in front of your hands', uitleg: 'Your head lowers to a point in front of your hands, so your hands and head form a triangle together.' },
      { punt: 'Elbows angled back', uitleg: 'Elbows not flared wide but angled back. That is kinder to your shoulders.' },
      { punt: 'Push the floor away', uitleg: 'Push yourself back up until your arms are straight and your hips are high again, like an upside down V.' },
    ],
    opstelling: [
      'Start in a push-up position with your hands at shoulder width. Walk your feet towards your hands until your hips are high and your legs almost straight.',
    ],
    stappen: [
      'Bend your elbows and lower your head calmly to a point just in front of your hands.',
      'Stop just above the floor.',
      'Push yourself back up until your arms are straight.',
    ],
    fouten: [
      { fout: 'Hips sink', beter: 'Keep your hips high. If they sink, it becomes a regular push-up and your chest works more than your shoulders.' },
      { fout: 'Head between the hands', beter: 'Lower your head to a point in front of your hands. That way you push in a straight line.' },
      { fout: 'Elbows flared wide', beter: 'Keep your elbows angled back, about 45 degrees from your body.' },
    ],
    ademhaling: 'Breathe in as you lower, breathe out as you push up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Place your hands on a bench or step so you carry less weight.',
    zwaarder: 'Put your feet on a bench or box, so more weight goes onto your shoulders.',
  },
  'Mountain climber': {
    kernpunten: [
      { punt: 'Shoulders over your hands', uitleg: 'Your shoulders stay right above your wrists. If they shift back, you lose your solid base.' },
      { punt: 'Hips in line', uitleg: 'Your hips stay in line with shoulders and heels. Do not stick them up and do not let them sag.' },
      { punt: 'Knee to your chest', uitleg: 'Really pull your knee under your chest and set your foot down lightly. That way your core works with every step.' },
      { punt: 'A pace you can hold', uitleg: 'Fast is fine, but your position comes first. If it gets sloppy, slow down.' },
    ],
    opstelling: [
      'Start in a high plank with your hands at shoulder width, directly under your shoulders.',
      'Your body forms a straight line from head to heels, with your feet hip width apart.',
    ],
    stappen: [
      'Brace your core and push the floor away.',
      'Pull your right knee towards your chest and put your foot back.',
      'Switch to your left knee and keep alternating at a brisk pace.',
    ],
    fouten: [
      { fout: 'Hips high in the air', beter: 'Lower until your body is a straight line. Use a mirror to check if needed.' },
      { fout: 'Shoulders drift behind the hands', beter: 'Lean slightly forward until your shoulders are above your wrists.' },
      { fout: 'Only tapping the feet', beter: 'Make the step bigger: your knee comes under your chest, not just a little forward.' },
    ],
    ademhaling: 'Breathe calmly and rhythmically, for example out on every second step.',
    tempo: 'Blocks of 20 to 40 seconds, brisk or slow with one count per knee.',
    makkelijker: 'Place your hands on a bench or step and move at a calm pace.',
    zwaarder: 'Bring your knee to the opposite elbow, or speed up while keeping your position.',
  },
  'Bird dog': {
    kernpunten: [
      { punt: 'Back like a table', uitleg: 'Your back stays flat and still, as if a glass of water rests on it. Nothing should shift or rotate.' },
      { punt: 'Reach long, do not lift high', uitleg: 'Push your hand forward and your heel back. Lifting above hip height gives you an arched back.' },
      { punt: 'Hips stay level', uitleg: 'Your pelvis does not tilt towards the lifted leg. Both hips point at the floor.' },
      { punt: 'Hands under your shoulders', uitleg: 'Push the floor away with your supporting hand. That way your shoulder does not sink and your upper back stays firm.' },
    ],
    opstelling: [
      'Get on your hands and knees: hands under your shoulders, knees under your hips, back flat.',
      'Look at the floor just in front of your hands so your neck stays in line.',
    ],
    stappen: [
      'Lightly brace your core without moving your back.',
      'Extend your right arm forward and your left leg back at the same time until they are horizontal.',
      'Hold for 2 to 3 counts, bring them back calmly and switch sides.',
    ],
    fouten: [
      { fout: 'Leg too high, arched lower back', beter: 'Lift your leg to hip height and no further. Think reaching long instead of up.' },
      { fout: 'Hip opens to the side', beter: 'Keep both hip bones pointing at the floor. Make the movement smaller until you stay still.' },
      { fout: 'Switching fast without a pause', beter: 'Hold each side briefly. The exercise works through staying still, not through speed.' },
    ],
    ademhaling: 'Breathe out as you extend your arm and leg, keep breathing calmly while you hold.',
    tempo: 'Per side: 2 counts to extend, hold for 2 to 3 counts, 2 counts back.',
    makkelijker: 'First extend only an arm or only a leg, and combine them once you stay still.',
    zwaarder: 'Bring elbow and knee together under your stomach between reps, or hold longer.',
  },
  Burpee: {
    kernpunten: [
      { punt: 'Plank with a tight core', uitleg: 'When your feet go back, you land in a straight plank. Your hips do not sag to the floor.' },
      { punt: 'Hands flat, shoulders above', uitleg: 'Place your hands firmly at shoulder width. That way you catch your weight without overloading your wrists.' },
      { punt: 'Land softly', uitleg: 'Land on the balls of your feet with slightly bent knees. If you hear a loud thud, you land too stiffly.' },
      { punt: 'Feet close to your hands', uitleg: 'Jump your feet back in to just behind your hands. That way you stand up easily with a straight back.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and free space in front of and behind you.',
    ],
    stappen: [
      'Bend your knees and place your hands flat on the floor in front of your feet.',
      'Jump both feet back into a plank, core braced.',
      'Lower your chest to the floor as one unit and push yourself back up into the plank.',
      'Jump your feet back to your hands and jump up explosively, arms overhead.',
    ],
    fouten: [
      { fout: 'Hips sag in the plank', beter: 'Brace your core and glutes before your feet land. A calmer pace helps keep the plank tight.' },
      { fout: 'Rounding the back to the floor', beter: 'Lower through your knees and hips, chest forward. Your back stays long, even when you go fast.' },
      { fout: 'Landing hard and stiff after the jump', beter: 'Land on the balls of your feet and give through your knees. The quieter you land, the better.' },
    ],
    ademhaling: 'Breathe out as you jump your feet back and as you jump up, breathe in between.',
    tempo: 'Explosive on the jump, brisk but controlled back to the floor.',
    makkelijker: 'Step your feet back and in one at a time, and skip the push-up and the jump.',
    zwaarder: 'Tuck your knees to your chest at the top, or do them in timed blocks.',
  },
}
