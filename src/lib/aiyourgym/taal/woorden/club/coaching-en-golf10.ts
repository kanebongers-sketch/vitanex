// Engelse coaching van de Blender-oefening uit golf 10 (05-11-2026): de Turkish
// get-up. Hij wisselt: rechts is het gespiegelde beeld van links. Het Nederlands
// in de oefenbibliotheek (src/lib/club/training/coaching) is de bron; dit zegt
// precies hetzelfde met dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF10: Readonly<Record<string, Coaching>> = {
  'Turkish get-up': {
    kernpunten: [
      { punt: 'Watch the bell', uitleg: 'Your eyes follow the bell until you stand. That way you always know where the weight is and your arm stays above you.' },
      { punt: 'Arm straight, wrist straight', uitleg: 'Your arm stands like a post above your shoulder. Your wrist does not bend back and your elbow stays locked.' },
      { punt: 'Shoulder in its socket', uitleg: 'Pull your shoulder slightly down and back. A solid shoulder carries the bell safely.' },
      { punt: 'Step by step, no rush', uitleg: 'Each step is a fixed position. Settle into that position before you move on to the next.' },
    ],
    opstelling: [
      'Learn the steps first without weight or with a shoe on your fist. Lie on your back with the kettlebell in one hand, arm straight above your shoulder and the bell resting on the back of your forearm.',
      'Plant the foot on the side of the bell with the knee bent. Your other arm and leg lie straight and angled out next to you on the floor.',
    ],
    stappen: [
      'Roll onto the elbow of your free arm and then push through until you sit on that hand.',
      'Push your hips up into a bridge, sweep your straight leg under you to the back and place your knee right under your hip.',
      'Bring your torso upright into a half kneeling position and stand up next to your front foot, the bell straight above you the whole time.',
      'Go back the same way step by step until you lie on your back again and then do the other side.',
    ],
    fouten: [
      { fout: 'Arm bends or drifts away', beter: 'Keep your elbow straight and the bell above your shoulder. If you cannot, take a lighter weight.' },
      { fout: 'Rushing through all the steps', beter: 'Pause briefly in each position. Being still between the steps is the training.' },
      { fout: 'Eyes off the bell', beter: 'Keep looking at the bell until you stand tall. Only then may your gaze go forward.' },
      { fout: 'Lower leg swivels on the knee', beter: 'Place your knee straight behind you right away. Do not swivel your lower leg across the floor like a wiper afterwards.' },
    ],
    ademhaling: 'Breathe calmly and breathe out at every transition to the next step.',
    tempo: 'About 4 counts up to standing, brief pause, 4 counts back the same way.',
    makkelijker: 'Practise only the first part, up to sitting on your hand, and then go back down.',
    zwaarder: 'Choose a heavier bell once you reach every step with a straight arm and a steady shoulder.',
  },
}
