// Engelse coaching van de Blender-oefeningen uit golf 9 (05-11-2026): eenarmige
// dumbbell row, eenarmige triceps extension boven het hoofd, eenarmige lat
// pulldown, landmine press en pallof press. Alle vijf wisselen: rechts is het
// gespiegelde beeld van links. Het Nederlands in de oefenbibliotheek
// (src/lib/club/training/coaching) is de bron; dit zegt precies hetzelfde met
// dezelfde opbouw (coaching.test.ts dwingt dat af).

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_GOLF9: Readonly<Record<string, Coaching>> = {
  'Eenarmige dumbbell row': {
    kernpunten: [
      { punt: 'Back flat like a table', uitleg: 'Your back is flat and still from hip to neck. Imagine a glass of water resting on it.' },
      { punt: 'Pull to your hip', uitleg: 'The dumbbell travels in a small arc to your hip bone, not straight up to your armpit. That works your lats.' },
      { punt: 'Do not open your torso', uitleg: 'Your shoulders stay parallel to the bench. If you rotate open, the weight is too heavy.' },
      { punt: 'Stretch at the bottom', uitleg: 'Let your shoulder blade drop slightly forward at the bottom. You then feel a stretch in your back.' },
    ],
    opstelling: [
      'Place one knee and the hand on the same side on a flat bench. Your other foot stands next to it on the floor.',
      'Your supporting hand is under your shoulder, back flat, neck in line with your back. Take the dumbbell in your free hand.',
    ],
    stappen: [
      'Let the dumbbell hang under your shoulder with a straight arm.',
      'Pull your elbow up along your side until the dumbbell is at your hip.',
      'Lower it under control and then do the other side.',
    ],
    fouten: [
      { fout: 'Torso rotates open on every rep', beter: 'Keep your chest facing the bench and take less weight.' },
      { fout: 'Head up towards the mirror', beter: 'Look at the floor slightly ahead of you. Your neck stays in line with your back.' },
      { fout: 'Shoulder pulls towards your ear', beter: 'Pull your elbow towards your hip, not up towards your ear.' },
    ],
    ademhaling: 'Breathe out as you pull the dumbbell up and breathe in as it lowers.',
    tempo: '1 count up, brief pause, 2 counts down.',
    makkelijker: 'Take a lighter dumbbell and pause for a count at the top to feel the movement.',
    zwaarder: 'Lower the dumbbell in 3 to 4 counts or hold for 2 counts at the top.',
  },
  'Eenarmige triceps extension boven het hoofd': {
    kernpunten: [
      { punt: 'Elbow to the ceiling', uitleg: 'Your upper arm is vertical next to your head and stays there. Only your forearm moves.' },
      { punt: 'Stand tall', uitleg: 'Stand with your back straight and your abs lightly braced. If you lean back, your lower back takes over.' },
      { punt: 'Slowly behind your head', uitleg: 'Lower the dumbbell behind your head under control until you feel a stretch in the back of your arm.' },
      { punt: 'Extend fully', uitleg: 'Push until your arm is straight and feel your triceps contract at the top.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your knees slightly bent.',
      'Hold the dumbbell in one hand above your head, upper arm vertical next to your ear.',
    ],
    stappen: [
      'Bend your elbow and lower the dumbbell behind your head.',
      'Stop at a good stretch, without your elbow drifting forward or out to the side.',
      'Extend your arm back up above your head.',
    ],
    fouten: [
      { fout: 'Elbow swings outwards', beter: 'Keep your elbow next to your head. Hold it with your other hand if it keeps drifting.' },
      { fout: 'Arched back', beter: 'Brace your abs and glutes and keep your ribs down. Too heavy? Choose a lighter dumbbell.' },
      { fout: 'Lowering too fast', beter: 'Lower the dumbbell in 2 to 3 counts. Going too fast pulls hard on your elbow.' },
    ],
    ademhaling: 'Breathe in as the dumbbell lowers and breathe out as you extend.',
    tempo: '3 counts down, brief pause, 1 count up.',
    makkelijker: 'Do it seated on a bench with a backrest and hold your upper arm with your other hand.',
    zwaarder: 'Pause for 2 counts at the bottom or lower the dumbbell in 4 counts.',
  },
  'Eenarmige lat pulldown': {
    kernpunten: [
      { punt: 'Elbow to your side', uitleg: 'Pull your elbow down towards your hip, as if you put it in your back pocket.' },
      { punt: 'Torso stays straight', uitleg: 'Do not rotate away and do not lean to the side. Your torso stays straight under the cable.' },
      { punt: 'Stretch fully at the top', uitleg: 'Let your arm get long at the top. That is where you feel your lats stretch.' },
      { punt: 'Shoulder down first', uitleg: 'Start every rep by pulling your shoulder down, then your elbow.' },
    ],
    opstelling: [
      'Attach a single handle to the cable and lock your thighs under the pads.',
      'Take the handle in one hand, arm straight above you. Your free hand stays relaxed by your side, away from your thigh.',
    ],
    stappen: [
      'Pull your shoulder down and then your elbow to your side.',
      'Hold briefly when your hand is at your shoulder.',
      'Let the handle return up under control until your arm is straight.',
    ],
    fouten: [
      { fout: 'Rotating away with your torso', beter: 'Keep your chest facing forward. Take less weight if you have to rotate.' },
      { fout: 'Pulling with your biceps', beter: 'Think about bringing your elbow down, not about pulling your hand down.' },
      { fout: 'Not extending at the top', beter: 'Let your arm get fully long before you pull again.' },
    ],
    ademhaling: 'Breathe out as you pull, breathe in as the handle goes back up.',
    tempo: '1 count down, brief hold, 2 counts back.',
    makkelijker: 'Take less weight or do the regular lat pulldown with two hands.',
    zwaarder: 'Hold for 2 counts at the bottom and let the handle return in 3 counts.',
  },
  'Landmine press': {
    kernpunten: [
      { punt: 'Torso still', uitleg: 'Your hips and shoulders stay facing forward. Rotating to get the weight up does not count.' },
      { punt: 'Press up and forward', uitleg: 'The bar moves in an arc up and forward. Follow that line, it feels good for your shoulder.' },
      { punt: 'Let your shoulder blade move', uitleg: 'At the top your shoulder blade may move forward, as if you want to reach just a bit further.' },
      { punt: 'Glutes and abs tight', uitleg: 'A firm base keeps you from leaning back as the bar goes up.' },
    ],
    opstelling: [
      'Put one end of the bar in a landmine or in a corner. Take the other end in one hand with a neutral grip, thumb towards you, and bring it to your shoulder.',
      'Your other hand rests on your hip.',
      'Stand with your feet hip width apart or step the leg on the side of your pressing arm back.',
    ],
    stappen: [
      'Brace your glutes and abs.',
      'Press the bar up and forward until your arm is almost straight.',
      'Let the bar come back under control until just in front of your shoulder.',
    ],
    fouten: [
      { fout: 'Leaning back', beter: 'Keep your ribs down and your glutes tight. Your torso stays upright, only your arm presses.' },
      { fout: 'Torso rotates along', beter: 'Keep your hips and chest facing forward. Choose a lighter weight if you have to rotate to get it up.' },
      { fout: 'Elbow flared out wide', beter: 'Keep your elbow under the bar and slightly in front of your body, then you press in a straight line.' },
    ],
    ademhaling: 'Breathe in before the press, breathe out as you push the bar away.',
    tempo: '1 count up, 2 counts back.',
    makkelijker: 'Do the exercise half kneeling or with two hands on the end of the bar.',
    zwaarder: 'Add a plate to the bar or do it standing on one leg, which asks more of your balance.',
  },
  'Pallof press': {
    kernpunten: [
      { punt: 'Do not get pulled round', uitleg: 'The cable pulls you to the side. Your job is to stay still. That is the work for your abs.' },
      { punt: 'Hips and shoulders square', uitleg: 'Your hips and shoulders keep facing forward, even when your arms are straight.' },
      { punt: 'Press out slowly', uitleg: 'The further your arms get from your chest, the harder the cable pulls. Press calmly and hold.' },
      { punt: 'Glutes on, knees soft', uitleg: 'A firm base with slightly bent knees and squeezed glutes makes your torso more stable.' },
    ],
    opstelling: [
      'Set the pulley at chest height with a single handle.',
      'Stand side on to the cable, a big step away, with your feet hip width apart.',
      'Take the handle in one hand and wrap your other hand around that fist. Hold it like that against your breastbone.',
    ],
    stappen: [
      'Brace your abs and glutes and stand firm.',
      'Press the handle straight forward until your arms are straight.',
      'Hold for 2 counts without rotating.',
      'Bring the handle back to your chest under control.',
    ],
    fouten: [
      { fout: 'Torso rotates towards the cable', beter: 'Take less weight or stand closer to the cable until you stay square.' },
      { fout: 'Leaning away from the cable', beter: 'Stand upright with your weight evenly on both feet. You resist the force, you do not dodge it.' },
      { fout: 'Pressing at an angle instead of straight', beter: 'Press straight forward from your breastbone, as if pointing along a line on the floor.' },
    ],
    ademhaling: 'Breathe out calmly as you press out and keep breathing while you hold.',
    tempo: '2 counts press out, 2 counts hold, 2 counts back.',
    makkelijker: 'Stand closer to the cable or use a light resistance band.',
    zwaarder: 'Do it half kneeling or with your feet together, so your base is smaller.',
  },
}
