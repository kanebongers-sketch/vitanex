// De Engelse coaching van de kiesbare oefeningen (besluit Kane 28-10-2026: alleen
// de Blender-oefeningen zijn kiesbaar). Het Nederlands is de bron en staat in de
// oefenbibliotheek (src/lib/club/training/coaching); het Engels zegt precies
// hetzelfde, met dezelfde opbouw (coaching.test.ts dwingt dat af). Vijf oefeningen
// staan al op de website en komen uit dat woordenboek, zodat er een Engelse tekst
// per oefening is. Eigen coaching van een sportschool blijft zoals die is geschreven.
// Geen woordenboek({ nl, en }): het Nederlands staat al in de bibliotheek en heeft
// daar eigen tests.

import type { Coaching } from '@/lib/club/training/coaching/typen'
import type { Taal } from '../../taal'
import { SITE_COACHING } from '../website/coaching'

const SITE = SITE_COACHING.en

export const COACHING_EN: Readonly<Record<string, Coaching>> = {
  'Front squat': SITE['Front squat'] as Coaching,
  'Back squat': SITE['Back squat'] as Coaching,
  Deadlift: SITE.Deadlift as Coaching,
  'Push-up': SITE['Push-up'] as Coaching,
  'Barbell row': SITE['Barbell row'] as Coaching,
  'Barbell curl': {
    kernpunten: [
      { punt: 'Elbows by your sides', uitleg: 'Your elbows stay in the same place. Only your forearms move, so your biceps do the work.' },
      { punt: 'No swinging', uitleg: 'Hips and back stay still. If you swing, the weight is too heavy and your lower back takes over.' },
      { punt: 'Wrists in line', uitleg: 'Keep your wrists straight, not curled towards you and not bent back.' },
      { punt: 'Lower slowly', uitleg: 'Lower the bar over 2 to 3 counts. The way down matters at least as much as the way up.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your knees relaxed.',
      'Hold the bar at shoulder width with your palms facing forward. Core lightly braced, shoulders down.',
    ],
    stappen: [
      'Start with the bar against your thighs and your arms almost straight.',
      'Curl the bar towards your chest without letting your elbows move forward.',
      'Squeeze briefly and lower the bar under control until your arms are almost straight.',
    ],
    fouten: [
      { fout: 'Leaning back to swing the bar up', beter: 'Use less weight and lock your glutes and core. Your upper body stays still.' },
      { fout: 'Elbows drift forward at the top', beter: 'Stop at the top before your elbows drift forward. That keeps the tension on your biceps.' },
      { fout: 'Bar drops down', beter: 'Brake the bar on the way down. Do not let it drop into your arms, that strains your elbows.' },
    ],
    ademhaling: 'Breathe out as you curl up and breathe in as the bar comes down.',
    tempo: '1 count up, a short pause, 2 to 3 counts down.',
    makkelijker: 'Use an EZ bar or dumbbells, which often feel better on your wrists.',
    zwaarder: 'Lower the bar over 4 counts or pause halfway for 2 counts.',
  },
  'Glute bridge': {
    kernpunten: [
      { punt: 'Drive through your heels', uitleg: 'Your weight is on your heels, not your toes. That way you feel it in your glutes and less in the front of your thighs.' },
      { punt: 'Squeeze your glutes at the top', uitleg: 'At the top, squeeze your glutes hard. Your hips are then extended without arching your back.' },
      { punt: 'Ribs down', uitleg: 'Keep your lower ribs down and your core lightly braced. Then the movement comes from your hips, not your lower back.' },
      { punt: 'Knees over your feet', uitleg: 'Do not let your knees cave in. They point the same way as your toes.' },
    ],
    opstelling: [
      'Lie on your back with your knees bent and your feet flat, hip width apart, heels about a hand length from your glutes.',
      'Place your arms by your sides with your palms on the floor.',
    ],
    stappen: [
      'Brace your core lightly and press your heels into the floor.',
      'Lift your hips until you form a straight line from shoulders to knees, and squeeze your glutes.',
      'Hold for one count and lower your hips slowly until just above the floor.',
    ],
    fouten: [
      { fout: 'Arched back at the top', beter: 'Stop once you are straight and squeeze your glutes. Your ribs stay down, your hips go no higher.' },
      { fout: 'Feet too far from your glutes', beter: 'Bring your feet closer. Too far away shifts the work to your hamstrings, which can cramp.' },
      { fout: 'Knees cave in', beter: 'Push your knees slightly out. A band around your knees helps you feel it.' },
    ],
    ademhaling: 'Breathe out as you lift your hips, breathe in as you lower.',
    tempo: '1 count up, hold for 2 counts, 2 counts down.',
    makkelijker: 'Make the movement smaller and hold the top for less time.',
    zwaarder: 'Place a weight plate or dumbbell on your hips, or do it on one leg.',
  },
  'Lunge met barbell': {
    kernpunten: [
      { punt: 'Bar firmly on your upper back', uitleg: 'The bar rests on the muscles below your neck and your hands pull it tight. That way it does not shift with every step.' },
      { punt: 'Feet on two rails', uitleg: 'Do not step onto one line: keep your feet hip width apart. That keeps you stable under the bar.' },
      { punt: 'Front knee over your foot', uitleg: 'Your knee moves in the direction of your toes and does not cave in.' },
      { punt: 'Torso upright', uitleg: 'Chest up and core braced. Do not let the bar pull you forward.' },
    ],
    opstelling: [
      'Set the rack at chest height and take the bar on your upper back, as in the back squat.',
      'Step out of the rack and place your feet hip width apart. Make sure you have enough free space in front of you.',
    ],
    stappen: [
      'Breathe in, brace your core and take a big step forward.',
      'Sink straight down until your back knee almost touches the floor.',
      'Push off hard with your front leg and step back to the start.',
    ],
    fouten: [
      { fout: 'Losing balance when stepping back', beter: 'Take a slightly shorter step and set your feet wider. If you cannot control it, go back to dumbbells.' },
      { fout: 'Torso falls forward', beter: 'Keep your chest up and your elbows under the bar. Use less weight.' },
      { fout: 'Back knee slams into the floor', beter: 'Stop just above the floor and come up under control.' },
    ],
    ademhaling: 'Breathe in and brace before you step, breathe out once you are back at the start.',
    tempo: '2 counts down, drive back to the start.',
    makkelijker: 'Do the lunge with dumbbells, or do a reverse lunge.',
    zwaarder: 'Increase the weight in small steps as long as you stay stable.',
  },
  'Overhead press': {
    kernpunten: [
      { punt: 'Glutes and core tight', uitleg: 'Your whole body is as stiff as a plank. That way you press the bar up without leaning back.' },
      { punt: 'Bar close to your face', uitleg: 'Tuck your chin back briefly so the bar can pass straight by. A straight line is the shortest path.' },
      { punt: 'Head through your arms', uitleg: 'Once the bar passes your forehead, move your head under the bar. At the top it is above your midfoot.' },
      { punt: 'Wrists straight', uitleg: 'The bar sits low in your palm above your forearm, not bent back into your fingers.' },
    ],
    opstelling: [
      'Set the bar in the rack at chest height. Grip it just outside shoulder width, step under the bar and lift it out of the rack onto your upper chest.',
      'Stand with your feet hip width apart, elbows slightly in front of the bar.',
    ],
    stappen: [
      'Breathe in, squeeze your glutes and core and tuck your chin back slightly.',
      'Press the bar straight up past your face.',
      'Move your head under the bar until your arms are straight above your midfoot.',
      'Lower the bar under control back to your upper chest.',
    ],
    fouten: [
      { fout: 'Leaning back with an arched back', beter: 'Squeeze your glutes and keep your ribs down. If you cannot, the weight is too heavy.' },
      { fout: 'Bar arcs around your head', beter: 'Tuck your chin back so the bar can go straight up, then push your head forward again.' },
      { fout: 'Bending your knees to help', beter: 'Keep your legs straight and still. Using your knees is a push press, which is a different exercise.' },
      { fout: 'Wrists bend back', beter: 'Rest the bar low in your palm and keep your wrist straight above your elbow.' },
    ],
    ademhaling: 'Breathe in and hold it briefly while you press, breathe out at the top.',
    tempo: '1 count up, 2 counts down under control.',
    makkelijker: 'Start with the dumbbell shoulder press or the landmine press until your shoulder mobility is good.',
    zwaarder: 'Add weight in small steps, or pause the bar at the bottom for 2 counts before you press.',
  },
  Plank: {
    kernpunten: [
      { punt: 'Straight line, head to heels', uitleg: 'Your hips do not sag and do not stick up. Think of a plank a stick could rest on.' },
      { punt: 'Elbows under your shoulders', uitleg: 'That way you carry your weight steadily and your shoulders do not have to compensate.' },
      { punt: 'Glutes and core on', uitleg: 'Squeeze your glutes and draw your belly button in slightly. You feel your whole front working.' },
      { punt: 'Push the floor away', uitleg: 'Press your forearms into the floor so your upper back does not sag between your shoulder blades.' },
      { punt: 'Keep breathing', uitleg: 'Breathe calmly. If you have to hold your breath, the hold is too long.' },
    ],
    opstelling: [
      'Rest on your forearms with your elbows directly under your shoulders and your hands forward.',
      'Place your feet hip width apart on your toes and straighten your legs.',
    ],
    stappen: [
      'Lift your body into a straight line from head to heels.',
      'Squeeze your glutes and core and look at the floor just in front of your hands.',
      'Hold the position while you keep breathing calmly.',
    ],
    fouten: [
      { fout: 'Hips sag', beter: 'Squeeze your glutes harder and tilt your pelvis back slightly. If you feel your lower back, stop.' },
      { fout: 'Hips too high', beter: 'Lower until your hips are in line with your shoulders. High feels easier, but your core works less.' },
      { fout: 'Head drops or looks up', beter: 'Keep your neck long and look at the floor, so your head stays in line with your back.' },
    ],
    ademhaling: 'Breathe calmly and evenly, in through your nose and out through your mouth.',
    tempo: 'Hold for 20 to 45 seconds with good form.',
    makkelijker: 'Rest on your knees instead of your toes, with your body straight from knee to shoulder.',
    zwaarder: 'Lift one foot at a time a few centimetres, or place your elbows slightly further forward.',
  },
}

/** De namen met Engelse coaching. */
export const COACHING_EN_NAMEN: readonly string[] = Object.keys(COACHING_EN)

const OP_SLEUTEL = new Map(Object.entries(COACHING_EN).map(([naam, c]) => [naam.trim().toLowerCase(), c]))

/**
 * De standaardcoaching van een oefening in de gekozen taal. In het Nederlands
 * altijd `nl` (uit de bibliotheek); in het Engels de Engelse tekst als die er is,
 * anders het Nederlands (alleen bij een niet-kiesbare oefening).
 */
export function standaardCoachingIn(naam: string, nl: Coaching | null, taal: Taal): Coaching | null {
  if (taal === 'nl' || !nl) return nl
  return OP_SLEUTEL.get(naam.trim().replace(/\s+/g, ' ').toLowerCase()) ?? nl
}
