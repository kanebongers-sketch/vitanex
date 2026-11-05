// Engelse coaching van de Blender-oefeningen uit golf 8 (05-11-2026): preacher
// curl met barbell, hip thrust met dumbbell en T-bar row. Het Nederlands in de
// oefenbibliotheek (src/lib/club/training/coaching) is de bron; dit zegt
// precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF8: Readonly<Record<string, Coaching>> = {
  'Hip thrust met dumbbell': {
    kernpunten: [
      { punt: 'Lower shoulder blades on the bench', uitleg: 'The edge of the bench sits just below your shoulder blades. That is the pivot point of the movement.' },
      { punt: 'Chin to your chest', uitleg: 'You look forward, not at the ceiling. That keeps your ribs down and your lower back calm.' },
      { punt: 'Push through your heels', uitleg: 'Your feet are flat. Push through your heels, so your glutes do the work and not your thighs.' },
      { punt: 'Straight and firm at the top', uitleg: 'A straight line from knee to shoulder. Hold it for a count with your glutes squeezed.' },
    ],
    opstelling: [
      'Sit on the floor with your upper back against a bench and lay the dumbbell across your hips.',
      'Place your feet hip width apart so your shins are vertical at the top.',
    ],
    stappen: [
      'Place your hands flat on the heads of the dumbbell and push your hips up.',
      'Stop when your body is straight from knee to shoulder and hold briefly.',
      'Lower your hips slowly, not too deep: your glutes stay well above the floor.',
    ],
    fouten: [
      { fout: 'Arched back at the top', beter: 'Chin to your chest and ribs down. You stop when you are straight, not further.' },
      { fout: 'Feet too far away', beter: 'Move your feet closer until your shins point straight up at the top. Then you feel your glutes more than your hamstrings.' },
      { fout: 'Dumbbell rolls away', beter: 'Place it in the crease of your hips and keep it in place with your hands flat on the heads. A mat underneath makes it more comfortable.' },
    ],
    ademhaling: 'Breathe out as you push your hips up, breathe in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Do the movement without weight or as a glute bridge on the floor.',
    zwaarder: 'Hold for 3 counts at the top or move on to the hip thrust with a barbell.',
  },
  'Preacher curl met barbell': {
    kernpunten: [
      { punt: 'Upper arms on the pads', uitleg: 'Your upper arms rest at an angle on the arm pads, with your elbows on them. They stay there for the whole rep.' },
      { punt: 'Do not lock out at the bottom', uitleg: 'Stop just before your arms are straight. Straight arms under load pull hard on your elbow.' },
      { punt: 'Lower slowly', uitleg: 'Take 3 counts on the way down. That keeps your biceps in control.' },
      { punt: 'Wrists straight', uitleg: 'Your wrists stay in line with your forearms. Do not curl with your hands.' },
    ],
    opstelling: [
      'Set the seat so your upper arms rest at an angle on the arm pads and your elbows rest on them.',
      'Grip the straight bar at shoulder width with your palms facing up. An EZ bar can be kinder to your wrists.',
    ],
    stappen: [
      'Take the bar from the rack and start with your arms almost straight on the pads.',
      'Curl the bar up until your forearms are almost vertical.',
      'Lower it in 3 counts until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Bar drops the last few centimetres', beter: 'Brake extra at the bottom. That is where your elbow is most vulnerable.' },
      { fout: 'Elbows come off the pads', beter: 'Keep your upper arms on the pads and your torso still. If you lift yourself along, use less weight.' },
      { fout: 'Curling all the way through at the top', beter: 'Stop when your forearms are almost vertical. Going further takes the tension off.' },
    ],
    ademhaling: 'Breathe out as you curl the bar up and breathe in while it lowers.',
    tempo: '1 count up, a short pause, 3 counts down.',
    makkelijker: 'Use an EZ bar or the preacher curl machine.',
    zwaarder: 'Lower the bar in 4 to 5 counts.',
  },
  'T-bar row': {
    kernpunten: [
      { punt: 'Back straight, even when tired', uitleg: 'Your lower back stays neutral from tailbone to neck. This often goes wrong on the last reps.' },
      { punt: 'Bend from your hips', uitleg: 'Hips back and knees slightly bent until your torso leans forward about 45 degrees.' },
      { punt: 'Pull to your chest', uitleg: 'Pull the handle to your lower chest with your elbows moving back along your sides.' },
      { punt: 'Torso stays still', uitleg: 'Your torso keeps the same angle. If you come up to move the weight, it is too heavy.' },
    ],
    opstelling: [
      'Put one end of the bar in a landmine and slide a plate onto the free end. Stand over the bar with your feet hip width apart, the plate in front of you.',
      'Hook a V handle under the bar just behind the plate. Bend your knees slightly, push your hips back and grip the handle with a straight back and your core braced.',
    ],
    stappen: [
      'Lift the bar a little and let your arms hang straight.',
      'Pull the handle to your chest and bring your shoulder blades together.',
      'Lower it under control until your arms are straight, without the plate touching the floor.',
    ],
    fouten: [
      { fout: 'Lower back rounds', beter: 'Chest slightly forward, core braced and less weight. With a sensitive lower back, choose the chest supported version.' },
      { fout: 'Standing up on every rep', beter: 'Stay at the same angle. Your arms and back move, your torso does not.' },
      { fout: 'Plate taps the floor', beter: 'Stop just above the floor. That keeps the tension on your back and keeps you in position.' },
    ],
    ademhaling: 'Breathe in and brace your core before you pull, breathe out when the handle reaches your chest.',
    tempo: '1 count up, a short pause, 2 counts down.',
    makkelijker: 'Choose a T-bar with chest support or the row on an incline bench.',
    zwaarder: 'Hold for 2 counts at the top with your shoulder blades together.',
  },
}
