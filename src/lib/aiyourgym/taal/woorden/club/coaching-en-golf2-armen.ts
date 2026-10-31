// Engelse coaching van de Blender-oefeningen uit golf 2 (31-10-2026): biceps en
// triceps met dumbbells en EZ-stang. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF2_ARMEN: Readonly<Record<string, Coaching>> = {
  'Dumbbell curl': {
    kernpunten: [
      { punt: 'Elbows by your sides', uitleg: 'Your elbows stay in the same place against your sides. Then your biceps do the work.' },
      { punt: 'Turn your little finger up', uitleg: 'Keep your palm up and turn your little finger up slightly at the top. You then feel your biceps fully contract.' },
      { punt: 'No swinging with your back', uitleg: 'Your torso stays still. If you have to swing, the weight is too heavy.' },
      { punt: 'Lower slowly', uitleg: 'Take 2 to 3 counts to lower the dumbbell until your arm is almost straight.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart, knees relaxed and core lightly braced.',
      'Hold a dumbbell in each hand beside your body with your palms facing forward.',
    ],
    stappen: [
      'Start with your arms almost straight beside your body.',
      'Curl the dumbbells to your shoulders, together or alternating.',
      'Squeeze briefly and lower them under control.',
    ],
    fouten: [
      { fout: 'Swinging with torso and hips', beter: 'Stand still with your core braced. Choose a weight you can do 8 to 12 clean reps with.' },
      { fout: 'Elbows move forward and up', beter: 'Keep your elbows by your sides. At the top, stop when your forearm is vertical.' },
      { fout: 'Wrist bends back', beter: 'Keep your wrist straight in line with your forearm.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Sit on a bench with a backrest, which makes swinging harder.',
    zwaarder: 'Lower the dumbbells over 4 counts or pause halfway for 2 counts.',
  },
  'Hammer curl': {
    kernpunten: [
      { punt: 'Thumbs up', uitleg: 'Your palms face each other for the whole rep. That also trains your forearm.' },
      { punt: 'Elbows by your sides', uitleg: 'Your elbows stay in place against your sides. Only your forearm moves.' },
      { punt: 'Shoulders still', uitleg: 'Your shoulders stay down and relaxed. If they shrug up, the weight is too heavy.' },
      { punt: 'Lower calmly', uitleg: 'Take 2 to 3 counts to lower. This is often where most is to be gained.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and a dumbbell in each hand beside your thighs.',
      'Your thumbs point forward and your palms face your body.',
    ],
    stappen: [
      'Start with your arms almost straight beside your body.',
      'Curl the dumbbell thumb first to your shoulder.',
      'Lower it calmly, alternating or both together.',
    ],
    fouten: [
      { fout: 'Dumbbell turns inward', beter: 'Keep your thumb up the whole time, also at the top.' },
      { fout: 'Swinging from your back', beter: 'Core braced and stand still. Better a lighter weight and clean reps.' },
      { fout: 'Dumbbell crosses your chest', beter: 'Curl straight forward and up to the same shoulder.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as you lower.',
    tempo: '1 count up, a short pause, 3 counts down.',
    makkelijker: 'Do it seated on a bench with a backrest.',
    zwaarder: 'Curl both arms together and pause halfway for 2 counts.',
  },
  'Curl op een schuine bank': {
    kernpunten: [
      { punt: 'Arms behind your body', uitleg: 'Your upper arms hang straight down, slightly behind your torso. That puts your biceps on an extra stretch.' },
      { punt: 'Upper arm stays still', uitleg: 'Only your forearm moves. If your elbow comes forward, your shoulder is helping.' },
      { punt: 'Light weight', uitleg: 'The stretch at the bottom is strong. Choose a weight with which you can calmly brake that stretch.' },
      { punt: 'Shoulders against the bench', uitleg: 'Your back and shoulders stay against the pad. That keeps your chest open and your shoulder calm.' },
    ],
    opstelling: [
      'Set the backrest to about 45 to 60 degrees and sit with your back and head against the bench.',
      'Let your arms hang straight down with a dumbbell in each hand, palms facing forward.',
    ],
    stappen: [
      'Start with your arms straight beside the bench.',
      'Curl both dumbbells together to your shoulders while your upper arms keep hanging still.',
      'Lower them slowly until your arms are straight again.',
    ],
    fouten: [
      { fout: 'Elbow slides forward', beter: 'Keep your upper arm vertical. Stop at the top just before your elbow starts to move.' },
      { fout: 'Dropping at the bottom', beter: 'Brake the last centimetres. That is exactly where your elbow is vulnerable.' },
      { fout: 'Shoulders come off the bench', beter: 'Rest the back of your head and your shoulders against the bench and keep your chest open.' },
    ],
    ademhaling: 'Breathe out as you curl and breathe in as the dumbbells lower.',
    tempo: '1 count up, a short pause, 3 counts down.',
    makkelijker: 'Set the bench more upright, then the stretch at the bottom is smaller.',
    zwaarder: 'Hold the top for 2 counts or lower the dumbbells over 4 counts.',
  },
  'Curl met EZ-stang': {
    kernpunten: [
      { punt: 'Take the angled grips', uitleg: 'Your hands are turned slightly inward. That often feels better for your wrists and elbows.' },
      { punt: 'Elbows by your sides', uitleg: 'Your upper arms stay still along your torso. Only your forearms move.' },
      { punt: 'No swinging', uitleg: 'Hips and back stay still. If you swing, you are using too much weight.' },
      { punt: 'Lower calmly', uitleg: 'Let the bar come back over 2 to 3 counts until your arms are almost straight.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your knees relaxed.',
      'Grip the EZ bar on the inner or outer angled handles, palms facing forward, shoulders down.',
    ],
    stappen: [
      'Start with the bar in front of your thighs.',
      'Curl the bar to your chest without your elbows moving forward.',
      'Lower the bar under control until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Hips push the bar up', beter: 'Glutes and core tight. Every rep starts still at the bottom.' },
      { fout: 'Elbows move far forward', beter: 'Stop at the top before your elbows start to slide. Then the tension stays on your biceps.' },
      { fout: 'Not straightening at the bottom', beter: 'Go back until your arms are almost straight, otherwise you only train half the range.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as the bar lowers.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    zwaarder: 'Lower the bar over 4 counts or pause halfway for 2 counts.',
  },
  'Triceps extension boven het hoofd': {
    kernpunten: [
      { punt: 'Elbows forward', uitleg: 'Your elbows point forward and stay close to your head, not wide out.' },
      { punt: 'Core tight', uitleg: 'Brace your core so you do not arch your back when the dumbbells go behind your head.' },
      { punt: 'Upper arms still', uitleg: 'Your upper arms stay beside your head. Only your forearms move.' },
      { punt: 'Deep behind your head', uitleg: 'Lower the dumbbells until you feel a stretch in the back of your arms. That is where this exercise pays off.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart, knees relaxed and core lightly braced.',
      'Hold a dumbbell in each hand with straight arms above your head, palms facing each other.',
    ],
    stappen: [
      'Bend your elbows and lower the dumbbells behind your head.',
      'Stop at a good stretch, elbows still pointing forward.',
      'Straighten your arms back to above your head.',
    ],
    fouten: [
      { fout: 'Elbows wide out', beter: 'Keep them close to your head. If they drift out, choose lighter dumbbells.' },
      { fout: 'Arched back', beter: 'Brace your core and glutes, your ribs stay down. If that does not work, sit down with a backrest.' },
      { fout: 'Half reps', beter: 'Really lower the dumbbells behind your head to a good stretch, then straighten all the way.' },
    ],
    ademhaling: 'Breathe in as the dumbbells lower and breathe out as you straighten.',
    tempo: '3 counts down, a short pause, 1 count up.',
    makkelijker: 'Do it seated with a backrest, or hold one dumbbell with both hands.',
    zwaarder: 'Pause in the stretch at the bottom for 2 counts or lower the dumbbells over 4 counts.',
  },
  'Triceps kickback': {
    kernpunten: [
      { punt: 'Upper arms along your torso', uitleg: 'Your upper arms lie along your body and stay there. Only your forearms move.' },
      { punt: 'Back straight', uitleg: 'Bend forward from your hips with a flat back and your knees slightly bent. Your torso stays still.' },
      { punt: 'Straighten all the way', uitleg: 'Straighten your arms until they are straight and squeeze your triceps for one count. That is the hardest moment.' },
      { punt: 'Light weight', uitleg: 'A dumbbell that is too heavy makes you swing. Choose a weight you can hold still at the top.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart and a dumbbell in each hand. Bend forward from your hips until your torso leans forward at an angle.',
      'Pull your elbows up until your upper arms lie along your torso, forearms hanging straight down.',
    ],
    stappen: [
      'Straighten your forearms back until your arms are straight.',
      'Hold for one count and squeeze your triceps.',
      'Lower your forearms calmly back to straight below your elbows.',
    ],
    fouten: [
      { fout: 'Elbows drop down', beter: 'Keep your upper arms along your torso. If they drop, you lose the tension at the top.' },
      { fout: 'Swinging with momentum', beter: 'Choose a lighter dumbbell and hold the top for one count. No swinging.' },
      { fout: 'Rounded back', beter: 'Push your hips back and keep your back flat, chest slightly forward.' },
    ],
    ademhaling: 'Breathe out as you straighten and breathe in as your forearms come back.',
    tempo: '1 count straighten, 1 count hold, 2 counts back.',
    makkelijker: 'Do one arm at a time and support yourself with your other hand and knee on a bench.',
    zwaarder: 'Do it on a low cable, so you also keep tension at the bottom.',
  },
}
